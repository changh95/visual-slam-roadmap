# DTAM

> Newcombe 2011 · [논문](https://ieeexplore.ieee.org/document/6126513)

**한 줄 요약** — 키프레임에서 광도 비용 볼륨을 누적하고, 정규화된 원시-쌍대 (primal-dual) 깊이 최적화, 그리고 GPU에서의 밀집 모델 대비 전체 이미지 정렬을 통해, 단일 단안 카메라로부터 실시간으로 밀집 3D 재구성과 카메라 추적을 수행한 최초의 시스템.

## 문제

DTAM 이전의 실시간 단안 시스템들 — MonoSLAM과 PTAM — 은 희소한 점 지도만을 생성했습니다: 카메라를 지역화하는 데는 충분했지만, 가림을 인식하는 AR, 장애물 회피, 또는 표면을 필요로 하는 어떤 작업에도 쓸모가 없었습니다. 다중 뷰 밀집 재구성은 오프라인으로는 존재했지만, 아무도 이를 들어오는 모든 프레임에 대해 실시간으로 실행한 적이 없었습니다. DTAM("Dense Tracking and Mapping in Real-Time", Newcombe, Lovegrove, Davison, ICCV 2011)은 밀집 방법이 재구성과 추적 모두에 "이미지의 모든 데이터를 활용한다"고 주장했으며, GPGPU 병렬성이 마침내 픽셀별, 프레임별로 이를 가능하게 만들었다고 주장했습니다.

## 방법 및 아키텍처

두 개의 밀집 처리 과정이 긴밀하게 맞물려 있습니다: 밀집 모델이 주어지면, 전체 이미지 정렬을 통해 모든 프레임을 추적합니다; 추적된 포즈가 주어지면, 밀집 키프레임 깊이 지도를 구축하고 정제합니다. 한 번 부트스트랩된 후(표준 점-특징 스테레오 초기화기를 통해)에는, "특징점 기반 스켈레톤이나 추적이 전혀 필요하지 않습니다."

- **비용 볼륨**: 각 키프레임 $r$은 역깊이 샘플 $d \in [\xi_{\min}, \xi_{\max}]$에 대한 평균 광도 오차 $C_r(\mathbf{u}, d)$를 저장하며, 이는 수십에서 수백 개의 겹치는 좁은 기저선 프레임 $m \in \mathcal{I}(r)$으로부터 누적됩니다:

$$C_r(\mathbf{u},d) = \frac{1}{|\mathcal{I}(r)|}\sum_{m\in\mathcal{I}(r)} \big\| I_r(\mathbf{u}) - I_m\big(\pi(K\, T_{mr}\, \pi^{-1}(\mathbf{u},d))\big) \big\|_1 .$$

  개별 두 뷰 비용은 여러 개의 극소값을 가지지만, 평균화된 L1 비용은 극소값이 거의 없습니다; 가림은 이상치가 됩니다. 실행 평균은 각 프레임이 도착할 때마다 갱신되므로, 이미지를 저장할 필요가 없습니다.
- **정규화된 깊이**: 역깊이 지도 $\xi$는 이미지 경계로 가중된 기울기-Huber 정규화 항을 가지는 비-볼록 에너지를 최소화합니다, $g(\mathbf{u}) = e^{-\alpha\|\nabla I_r(\mathbf{u})\|_2^{\beta}}$:

$$E_\xi = \int_\Omega \big\{ g(\mathbf{u})\, \|\nabla \xi(\mathbf{u})\|_\epsilon + \lambda\, C(\mathbf{u}, \xi(\mathbf{u})) \big\}\, d\mathbf{u} .$$

- **원시-쌍대 + 전수 탐색**: 데이터 항과 평활성 항은 보조 변수 $\alpha$를 통해 $\frac{1}{2\theta}(\xi - \alpha)^2$ 결합으로 분리되며; $\theta \to 0$일 때 원래 에너지가 회복됩니다. 볼록한 부분은 원시-쌍대(Legendre–Fenchel) 방식으로 풀리고, 비-볼록한 데이터 항은 샘플링된 깊이들에 대한 픽셀별 전수 탐색으로 풀립니다 — 세밀한 디테일을 잃게 만드는 거칠기-에서-세밀도 워핑을 피합니다. 축소하는 경계 $r^{n+1}_{\mathbf{u}} = \sqrt{2\theta^n \lambda (C^{\max}_{\mathbf{u}} - C^{\min}_{\mathbf{u}})}$가 탐색을 가속하며, 적합된 포물선에 대한 단 한 번의 뉴턴 단계가 서브샘플 수준의 깊이 정확도를 제공합니다(핵심적으로: $S \le 64$개의 깊이 샘플만으로도 세밀한 표면을 얻습니다).
- **밀집 추적**: 모델은 가상 카메라로 투영되어 뷰 $I_v$와 깊이 $\xi_v$를 합성합니다; 실제 포즈는 *모든* 픽셀에 대해 거칠기-에서-세밀도로 수행되는 Lucas–Kanade 스타일의 전방 합성 (forward-compositional) 가우스-뉴턴으로 찾아지며, 블러에 대한 강건성을 위해 먼저 회전 전용 정렬을 수행합니다:

$$F(\boldsymbol{\psi}) = \frac{1}{2}\sum_{\mathbf{u}\in\Omega} f_{\mathbf{u}}(\boldsymbol{\psi})^2, \qquad f_{\mathbf{u}}(\boldsymbol{\psi}) = I_l\big(\pi(K\, T_{lv}(\boldsymbol{\psi})\, \pi^{-1}(\mathbf{u}, \xi_v(\mathbf{u})))\big) - I_v(\mathbf{u}),$$

  여기서 $\boldsymbol{\psi} \in \mathbb{R}^6$은 $\mathfrak{se}(3)$에 있습니다. 광도 오차가 임계값(반복에 따라 낮춰짐)을 초과하는 픽셀은 폐기되므로, 흔드는 손과 같이 모델링되지 않은 물체가 추적을 훼손하지 않습니다. 예측치의 표면 정보를 담고 있는 픽셀이 너무 적어지면 새 키프레임이 추가됩니다.

## 실험 결과

데스크톱 환경에서 실시간으로 평가되었습니다: Point Grey Flea2, 30 Hz, 640×480 RGB, i7 쿼드코어 CPU를 갖춘 NVIDIA GTX 480 GPU에서 실행. 키프레임 깊이 지도는 동일한 프레임에서 PTAM이 사용하는 ~1000개의 점 특징 대비 거의 $300{\times}10^3$개의 추정된 점을 담고 있습니다. 평가는 PTAM 대비 정성적 비교입니다: 컵 근처에서 왔다갔다하는 고가속 궤적에서, PTAM은 반복적으로 추적을 잃고 재지역화에 의존한 반면, DTAM(재지역화 기능이 의도적으로 비활성화됨)은 시각적으로 더 부드러운 속도 추정과 함께 계속 추적을 유지했습니다; DTAM은 또한 카메라 초점 이탈 상태에서도 추적을 유지했으며, 올바른 가림 처리를 갖춘 물리 강화 AR 응용을 시연했습니다. 궤적 오차 벤치마크는 보고되지 않았습니다 — 그 유산은 이후의 밀집 및 직접 SLAM이 물려받은 템플릿(비용 볼륨 + 정규화 항 + 원시-쌍대 + 밀집 모델 기반 추적)입니다.

## SLAM에서의 의미

PTAM이 희소 점 지도를 생성했던 반면, DTAM은 단일 카메라로도 실시간으로 밀집 표면을 제공할 수 있음을 보여, 더 풍부한 장면 이해, 가림 인식 AR, 장애물 회피의 문을 열었습니다. DTAM은 직접/밀집 SLAM 연구 계보를 창시했습니다 — LSD-SLAM, DSO, 그리고 (같은 제1저자를 통해) KinectFusion에 직접적인 영향을 주었으며 — GPU 컴퓨팅을 밀집 SLAM의 핵심 도구로 확립했습니다. ElasticFusion부터 NeRF 및 3DGS 기반 SLAM에 이르는 현대의 밀집 시스템들은 모두 이 밀집-추적-및-매핑 청사진의 후예입니다.

## 관련 문서

- [PTAM](ptam.md)
- [LSD-SLAM](lsd-slam.md)
- [DSO](dso.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
- [Frame-to-model tracking](../level-04-rgbd-slam/frame-to-model-tracking.md)
