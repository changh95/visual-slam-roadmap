# MRS-Map

> Stückler 2014 · [논문](https://doi.org/10.1016/j.jvcir.2013.02.008)

**한 줄 요약** — 서펠마다 형상과 색상의 결합 통계를 저장하는 옥트리 기반 다중 해상도 서펠 맵으로 RGB-D SLAM을 구현하여, 잡음을 고려한 확률적 정합, 키뷰 기반 포즈 그래프 SLAM, CPU만으로의 실시간 객체 추적을 가능하게 함.

## 문제

단일한 고정 해상도의 밀도 RGB-D 매핑은 피할 수 없는 트레이드오프에 직면합니다: 세밀한 해상도는 디테일을 포착하지만 메모리를 낭비하고, 거친 해상도는 충실도를 잃습니다. RGB-D 센서 잡음 역시 깊이에 대해 제곱으로 증가하므로, 모든 측정을 하나의 해상도로 취급하는 것은 통계적으로 잘못된 것입니다. KinectFusion과 같은 GPU에 의존하는 시스템은 경량이거나 저비용인 로봇 플랫폼을 더더욱 배제합니다. 필요한 것은 측정 품질에 따라 디테일을 조정하고, 이미지·맵·다중 뷰 객체 모델의 빠르고 강건한 정합을 지원하는 — 전적으로 CPU에서 동작하는 — 컴팩트한 표현입니다.

## 방법 및 아키텍처

- **옥트리 내의 다중 해상도 서펠**: 모든 복셀 크기에 걸친 모든 옥트리 노드(내부 노드와 리프 노드 모두)는 하나의 *서펠* — 그 볼륨 내부 점 $\mathcal{P}$에 대한 법선 근사 — 을 저장합니다. 통계는 충분통계량 $\mathcal{S}(\mathcal{P}) := \sum_{p\in\mathcal{P}} p$와 $\mathcal{S}^2(\mathcal{P}) := \sum_{p\in\mathcal{P}} p p^T$로 유지되며, 점 집합 $\mathcal{P}^A, \mathcal{P}^B$ 사이의 병합은 수치적으로 안정적인 단일 패스 갱신으로 이루어집니다.

$$\mathcal{S}^2(\mathcal{P}^{A\cup B}) \leftarrow \mathcal{S}^2(\mathcal{P}^A) + \mathcal{S}^2(\mathcal{P}^B) + \frac{\delta\delta^T}{N_A N_B (N_A + N_B)}, \qquad \delta := N_B\,\mathcal{S}(\mathcal{P}^A) - N_A\,\mathcal{S}(\mathcal{P}^B),$$

  여기서 평균 $\mu = \frac{1}{\lvert\mathcal{P}\rvert}\mathcal{S}$와 공분산 $\Sigma = \frac{1}{\lvert\mathcal{P}\rvert-1}\mathcal{S}^2 - \mu\mu^T$가 도출됩니다. 이 분포는 6차원입니다 — 위치와 색상이, 명도와 색차를 분리하는 L$\alpha\beta$ 공간에서 결합됩니다. 최대 6개의 직교 시점 방향을 두어 하나의 복셀 내 서로 다른 표면들을 구분하며, 서펠은 최소 10개의 점을 필요로 합니다.
- **잡음 적응적 집계**: 각 픽셀에서 옥트리의 최대 해상도는 센서로부터의 *제곱* 거리(센서 잡음 법칙과 일치)에 따라 조정되며, 동일한 노드에 속하는 연속된 이미지 영역들은 먼저 집계됩니다 — 640×480 이미지는 307,200번의 점 삽입 대신 단 수천 번의 노드 삽입으로 흡수됩니다. 이미지 경계나 가림 경계(가상 경계)의 노드는 표면을 부분적으로만 관측하므로 제외됩니다.
- **형상-질감 기술자**: 각 서펠과 그 최대 26개의 동일 해상도 이웃 사이의 FPFH 유사 3-빈 각도 히스토그램, 그리고 명도/색차 대조 히스토그램을 사용하여, $\tau=0.1$인 기술자 거리 임계값 $d_f(s_i,s_j) \le \tau$로 대응을 걸러냅니다.
- **확률적 정합**: 소스 맵 $m_s$(예: 현재 이미지)를 포즈 $x$ 하에서 타겟 맵 $m_m$에 정합하기 위해, 서펠들은 모든 해상도에서 동시에 — 각 노드에서 가장 세밀한 공통 해상도가 큐브 쿼리로 선택되므로 암묵적으로 거칠기-에서-세밀도 방식으로 — 대응이 이루어지며, 각 대응의 관측 가능도는 두 정규분포의 차이로 표현됩니다.

$$p(s_{s,i} \mid x, s_{m,j}) = \mathcal{N}\big(d_{i,j}(x);\, 0,\, \Sigma_{i,j}(x)\big), \quad d_{i,j}(x) := \mu_{m,j} - T(x)\,\mu_{s,i}, \quad \Sigma_{i,j}(x) := \Sigma_{m,j} + R(x)\,\Sigma_{s,i}\,R(x)^T,$$

  이렇게 하면 데이터로부터 학습된 공분산이 신뢰할 수 있는 형상을 자동으로 더 무겁게 가중합니다 — 키포인트 추출이 필요 없습니다. 로그 가능도 $L(x) = \sum_{a\in\mathcal{A}} \log\lvert\Sigma_a(x)\rvert + d_a^T(x)\,\Sigma_a^{-1}(x)\,d_a(x)$는 빠른 근사 Levenberg-Marquardt(보통 10~20회 반복)로 최적화된 뒤, 모델 서펠의 삼중선형 보간을 사용하는 약 5회의 뉴턴 반복이 이어지며, 평가는 CPU 코어들에 걸쳐 병렬화됩니다. 포즈 공분산에 대한 닫힌 형태 추정이 관측되지 않는 차원(예: 평면 표면을 바라보는 경우)을 따르는 불확실성을 포착합니다.
- **랜덤화된 루프 클로징을 갖춘 키뷰 SLAM**: 이미지는 하나의 기준 키뷰에 대해 추적됩니다. 충분한 움직임이 있으면 새 키뷰가 생성되어 공간 제약 에지를 추가합니다. 매 프레임 정확히 하나의 추가 제약이 포즈 거리에 대한 $p_{\mathrm{chk}}(v_{\mathrm{cmp}}) = \mathcal{N}(d;0,\sigma_d^2)\cdot\mathcal{N}(\lvert\alpha\rvert;0,\sigma_\alpha^2)$에 따라 비교 키뷰를 샘플링하여 테스트되며, 매칭은 양방향 서펠 매칭 가능도로 검증됩니다. 키뷰 그래프 $p(\mathcal{V}\mid\mathcal{E}) \propto \prod_{e_{ij}} p(x_i^j \mid x_i, x_j)$는 프레임마다 한 번 g2o(희소 Cholesky)로 최적화됩니다. 최적화된 키뷰들은 최종적으로 하나의 다중 뷰 서펠 맵으로 융합되며, 이는 실시간 6-DoF 포즈 추적을 위한 객체 모델로도 쓰일 수 있습니다.

## 실험 결과

모든 타이밍은 노트북용 Intel Core i7-3610QM(2.3\,GHz 쿼드코어)에서 전체 640×480 해상도, 최대 맵 해상도 0.0125\,m로 측정되었습니다. **점진적 정합**(TUM RGB-D 벤치마크, 중앙값 이동 RPE): fr1/desk에서 4.4\,mm로, warp의 5.8, GICP의 10.2, 3D-NDT의 7.9, fovis의 6.3을 능가합니다. 대부분의 fr1 시퀀스에서 최고 성능(예: fr1/plant 3.5\,mm, fr1/xyz 2.6\,mm, fr2/xyz 1.4\,mm)을 기록합니다. fr1/desk에서 평균 실행 시간은 75.15\,ms로, warp의 108.64, GICP의 4015.4, 3D-NDT의 414.87과 대비됩니다 — 약 15\,Hz이며, 프레임을 건너뛰어도 warp가 발산하는 상황에서 ICP와 유사한 강건성을 유지합니다. **SLAM**: 모든 프레임을 처리할 때 11개 시퀀스 중 8개에서 RGB-D SLAM보다 더 나은 RMSE RPE를 기록합니다(예: freiburg1_room 0.111\,m 대 0.219\,m, freiburg2_desk 0.100\,m 대 0.143\,m, freiburg1_teddy 0.066\,m 대 0.138\,m). freiburg1_floor(질감이 부족한 바닥)와 freiburg2_large_loop(먼 거리, 불확실한 깊이)에서는 실패합니다. 하나의 그래프 최적화 반복은 최대 몇 밀리초가 걸립니다(freiburg2_desk: 최대 64개 키뷰, 138개 에지에서 중앙값 0.79\,ms). **객체 모델링/추적**: 360도 모델 구축에서 중앙값 ATE 약 1~2\,cm, 학습된 모델 추적은 프레임당 32~50\,ms로 중앙값 ATE 16~30\,mm를 기록했으며, RoboCup@Home 2011/2012(둘 다 우승)에서 로봇 Cosero로 실시간 시연되었습니다.

## SLAM에서의 의미

MRS-Map은 밀도 복셀 그리드가 아니라 통계적 서펠 표현이 적은 메모리와 GPU 없이도 정확한 RGB-D 추적을 지원할 수 있음을 보여주어, 실제 로봇 하드웨어에서 밀도에 가까운 SLAM과 객체 추적을 가능하게 했습니다. 불확실성을 고려한 서펠 정합(NDT의 RGB-D 계승 방식)과 다중 해상도 옥트리 설계는 ElasticFusion과 같은 이후의 서펠 기반 시스템 및 서펠 기반 LiDAR 매핑에 영향을 주었으며, 2010년대 중반까지 밀도 RGB-D SLAM 시스템(DVO-SLAM, ElasticFusion)의 표준 비교 대상이었습니다.

## 관련 문서

- [ElasticFusion](elasticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [KinectFusion](kinectfusion.md)
- [DVO](dvo.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [SuMa](../level-09-lidar-visual-lidar-slam/suma.md)
