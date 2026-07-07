# DVO

> Kerl 2013 · [Project page](https://vision.in.tum.de/data/software/dvo)

**한 줄 요약** — 강건한 t-분포 오차 모델 하에서 모든 픽셀에 대한 광도(photometric) 및 깊이 잔차를 결합하여 최소화하는 직접(featureless) RGB-D 오도메트리로, 엔트로피 기반 키프레임 선택과 포즈 그래프 루프 클로저가 추가되어 DVO-SLAM으로 확장됨.

## 문제

특징 기반 RGB-D 오도메트리는 이미지를 희소한 키포인트로 축소하여 대부분의 정보를 버리며, 텍스처가 부족한 실내 장면에서는 성능이 부족합니다. 직접(direct) 방법은 모든 픽셀을 활용할 수 있지만, 밀도 잔차는 가림(occlusion), 반사, 동적 객체, 센서 노이즈 등의 이상치(outlier)로 오염됩니다. 저자들은 가우시안 노이즈 가정이 실제 잔차 히스토그램에 잘 맞지 않아 이상치가 추정치를 왜곡시킨다는 것을 발견했습니다. 프레임 간(frame-to-frame) 정렬 또한 본질적으로 드리프트가 발생합니다. 필요했던 것은 강건한 밀도 RGB-D 정렬을 위한 원리적인 확률적 공식화, 그리고 드리프트를 최적화로 제거할 수 있도록 키프레임을 선택하고 루프 클로저를 검증하는 경량화된 방법이었습니다.

## 방법 및 아키텍처

"DVO"는 두 논문으로 구성됩니다: ICRA 2013의 강건한 오도메트리 논문(광도 항, t-분포, 모션 사전)과 IROS 2013의 밀도 시각 SLAM 논문(깊이 항, 키프레임, 루프 클로저, g2o 포즈 그래프 추가).

- **워핑(Warping)**: 깊이 $\mathcal{Z}_1(\mathbf{x})$를 가진 픽셀 $\mathbf{x}$는 역투영 $\pi^{-1}$로 복원되고, 강체 운동 $\boldsymbol{T} = \exp(\hat{\boldsymbol{\xi}})$ (트위스트 $\boldsymbol{\xi}\in\mathbb{R}^6$)로 변환된 후 재투영됩니다: $\mathbf{x}' = \tau(\mathbf{x},\boldsymbol{T}) = \pi\big(\boldsymbol{T}\,\pi^{-1}(\mathbf{x}, \mathcal{Z}_1(\mathbf{x}))\big)$.
- **광도 + 깊이 잔차**: 각 픽셀은 다음과 같은 결합 잔차 $\mathbf{r} = (r_{\mathcal{I}}, r_{\mathcal{Z}})^\top$를 제공합니다.

$$r_{\mathcal{I}} = \mathcal{I}_2\big(\tau(\mathbf{x},\boldsymbol{T})\big) - \mathcal{I}_1(\mathbf{x}), \qquad r_{\mathcal{Z}} = \mathcal{Z}_2\big(\tau(\mathbf{x},\boldsymbol{T})\big) - \big[\boldsymbol{T}\,\pi^{-1}(\mathbf{x},\mathcal{Z}_1(\mathbf{x}))\big]_Z ,$$

  여기서 $[\cdot]_Z$는 Z 성분이며, 깊이 오차는 투영적 탐색(projective lookup)을 사용하는 점-대-평면 ICP와 동등합니다. 두 오차를 수동으로 조정한 가중치로 선형 결합했던 기존 연구와 달리, 이 방법은 둘을 결합적으로 모델링합니다.
- **확률적 강건 추정**: MAP 추정 $\boldsymbol{\xi}^* = \arg\max_{\boldsymbol{\xi}} p(\boldsymbol{\xi} \mid \mathbf{r})$이며, 이변량 잔차는 t-분포 $p_t(\mathbf{0}, \boldsymbol{\Sigma}, \nu)$를 따릅니다 — 무한한 가우시안 혼합으로, 그 무거운 꼬리(heavy tail)가 이상치를 포괄합니다. 이는 반복 재가중 최소 제곱(iteratively re-weighted least squares)으로 이어집니다.

$$\boldsymbol{\xi}^* = \arg\min_{\boldsymbol{\xi}} \sum_{i}^{n} w_i\, \mathbf{r}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i, \qquad w_i = \frac{\nu+1}{\nu + \mathbf{r}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i},$$

  자유도 $\nu = 5$를 사용하며, 스케일 행렬 $\boldsymbol{\Sigma}$는 매 반복마다 기대값 최대화(EM)로 재추정됩니다 — 수동으로 조정한 강건 커널 임계값이 없습니다. Gauss-Newton 정규 방정식 $\sum_i w_i \boldsymbol{J}_i^\top \boldsymbol{\Sigma}^{-1} \boldsymbol{J}_i\, \Delta\boldsymbol{\xi} = -\sum_i w_i \boldsymbol{J}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i$ (2×6 야코비안 $\boldsymbol{J}_i$)는 이미지 피라미드에서 거칠기-에서-세밀도(coarse-to-fine)로 풀립니다. 등속도 모션 사전을 추가할 수 있으며, 이 경우 업데이트는 $(J^\top W J + \Sigma^{-1})\Delta\boldsymbol{\xi} = -J^\top W \mathbf{r}(\mathbf{0}) + \Sigma^{-1}(\boldsymbol{\xi}_{t-1} - \boldsymbol{\xi}_t^{(k)})$가 됩니다.
- **엔트로피 기반 키프레임과 루프 클로저 (DVO-SLAM)**: 근사 헤시안 $\boldsymbol{A}$는 포즈 공분산 $\boldsymbol{\Sigma}_{\boldsymbol{\xi}} = \boldsymbol{A}^{-1}$를 제공하며, 그 엔트로피는 $H(\boldsymbol{\xi}) \propto \ln \lvert\boldsymbol{\Sigma}_{\boldsymbol{\xi}}\rvert$입니다. 프레임은 엔트로피 비율

$$\alpha = \frac{H(\boldsymbol{\xi}_{k:k+j})}{H(\boldsymbol{\xi}_{k:k+1})}$$

  이 임계값 아래로 떨어질 때까지 현재 키프레임에 대해 매칭되며, 그 시점에 새 키프레임이 삽입됩니다. 루프 클로저 후보는 각 키프레임 주변의 구(sphere) 내에서 메트릭 최근접 이웃 탐색으로 찾아지며, 먼저 거친 해상도에서 테스트되고 동일한 엔트로피 비율 테스트로 검증됩니다. 검증된 제약은 g2o로 최적화되는 키프레임 포즈 그래프에 들어가며, 마지막에 모든 키프레임에 대해 재탐색됩니다.

## 실험 결과

TUM RGB-D 벤치마크(ICRA 논문, 병진 RPE의 RMSE로 측정한 드리프트)에서: fr1/desk에서 t-분포 가중치는 드리프트를 0.0458\,m/s로 줄였으며(가중치 미적용 시 0.0551), 네 개의 "desk" 시퀀스 전체에 대한 평균에서 t-분포 + 시간적 사전은 0.0428\,m/s를 달성합니다 — 기준 방법(0.2425\,m/s)에 대해 82.35% 개선 — 그리고 fr3의 "sitting" 동적 객체 시퀀스에서는 0.0316\,m/s를 달성합니다. 런타임은 단일 CPU 코어에서 실시간(30\,Hz)이며, 가중치를 적용한 변형은 프레임당 약 50\,ms입니다. 완전한 DVO-SLAM(IROS 논문, freiburg1 세트)의 경우: 키프레임 추적만으로 드리프트를 평균 16% 줄이고, 포즈 그래프 최적화는 20% 줄입니다. 절대 궤적 오차는 (프레임-대-프레임의) 0.19\,m에서 0.07\,m로 떨어집니다. 시스템 간 비교(평균 ATE RMSE)에서, DVO-SLAM은 0.034\,m에 도달하며 RGB-D SLAM(0.054\,m), MRSMap(0.043\,m), KinFu(0.297\,m)를 앞섭니다. 예를 들어 fr1/desk는 0.021\,m, fr1/xyz는 0.011\,m입니다. 프레임-대-키프레임 추적은 약 32\,ms(Intel i7-2600)가 걸리며, 평균 지도 갱신은 135\,ms가 걸립니다.

## SLAM에서의 의미

DVO는 직접 RGB-D 오도메트리를 특징 기반 파이프라인의 진지한 대안으로 확립했으며, 더 복잡한 밀도 시스템을 다루기 전에 직접 정렬의 메커니즘 — 워핑, 결합 잔차, 강건 가중치, 거칠기-에서-세밀도 IRLS — 을 배우기 위한 가장 명료한 논문으로 남아 있습니다. t-분포 가중치와 엔트로피 기반 키프레임/루프 클로저 기준은 표준 요소가 되었습니다. 현대 SLAM의 직접(direct) 계보(LSD-SLAM, DSO, 신경 SLAM 내부의 밀도 추적기)는 이 주제의 변형으로 읽힙니다.

## 관련 문서

- [RGBD-SLAM-V2](rgbd-slam-v2.md) — DVO가 능가한 특징 기반 RGB-D 동시대 연구
- [KinectFusion](kinectfusion.md) — 체적 모델에 대한 ICP 기반 밀도 추적
- [ICP](icp.md) — DVO의 깊이 잔차의 순수 기하학적 조상
- [MRS-Map](mrs-map.md) — 동일 벤치마크에서 비교된 서펠 통계 기반 정합
- [LSD-SLAM](../level-03-monocular-slam/lsd-slam.md) — 단안 반밀도(semi-dense) SLAM으로 이어진 직접 정렬
- [DSO](../level-03-monocular-slam/dso.md) — 강건한 직접 정렬을 채택한 희소 직접 오도메트리
