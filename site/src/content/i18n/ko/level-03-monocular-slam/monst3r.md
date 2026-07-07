# MonST3R

> Zhang 2024 · [논문](https://arxiv.org/abs/2410.03825)

**한 줄 요약** — 프레임마다 포인트맵을 예측함으로써 DUSt3R 방식의 포인트맵 추정을 *동적* 장면으로 확장하여, 움직이는 물체가 있는 비디오로부터 비디오 깊이, 카메라 포즈, 4D 재구성을 가능하게 합니다.

## 문제

동적 장면으로부터의 기하학 추정은 일반적으로 문제를 하위 작업(깊이, 플로우, 모션 분할)으로 분해하는 다단계 파이프라인이나 전역 최적화에 의존해왔으며, "이는 오류가 발생하기 쉬운 복잡한 시스템으로 이어진다". DUSt3R의 포인트맵 표현은 정적 재구성을 단일 피드포워드 예측으로 통합했지만, 이는 장면이 강체 (rigid)라고 가정합니다: 움직이는 물체가 있는 비디오를 입력하면 움직이는 콘텐츠를 하나의 비일관적인 정적 재구성으로 강제하거나 (실측 모션 마스크가 있어도) 카메라 포즈를 신뢰성 있게 추정하지 못합니다. MonST3R (Motion DUSt3R)는 명시적인 모션 모델을 추가하지 않고도 포인트맵이라는 아이디어가 모션 속에서도 살아남을 수 있는지 묻습니다.

## 방법 및 아키텍처

**프레임별 포인트맵.** 프레임 쌍 $\mathbf{I}^t, \mathbf{I}^{t'}$에 대해, 네트워크는 포인트맵 $\mathbf{X}^{t;t\rightarrow t'}$와 $\mathbf{X}^{t';t\rightarrow t'} \in \mathbb{R}^{H\times W\times 3}$ (신뢰도 $\mathbf{C}$ 포함)을 예측하며, 둘 다 프레임 $t$의 카메라 좌표계로 표현됩니다 — 이는 DUSt3R의 설정과 정확히 동일하지만, 각 포인트맵이 이제 *특정 시점의 단일 시각*에 대응하므로 움직이는 콘텐츠가 각 순간에 있는 위치대로 표현됩니다.

**동역학을 위한 파인튜닝.** 걸림돌은 데이터입니다: 깊이가 포함된 동적이고 포즈가 지정된 비디오가 필요합니다. 저자들은 PointOdyssey (샘플링 가중치 50%), TartanAir (25%), Waymo (20%), Spring (5%)의 네 데이터셋을 조합하고, ViT-Base 디코더와 DPT 헤드만 파인튜닝합니다 (인코더는 CroCo의 기하학적 특징을 보존하기 위해 동결). 프레임 쌍은 시간 간격 1--9로 샘플링되며 (간격이 커질수록 확률 증가), 시야각 (field-of-view) 증강과 DUSt3R의 신뢰도 인식 회귀 손실을 사용합니다. 25 에포크 × 2만 쌍, RTX 6000 2장으로 하루가 걸립니다.

**다운스트림 도구.** 내부 파라미터는 DUSt3R를 따릅니다 (프레임별로 초점 거리를 해결). 상대 포즈는 동적 물체에 의해 오염된 2D-2D 대응점을 피하고자, 하나의 뷰 내에서 픽셀별 2D-3D 대응점을 PnP + RANSAC과 함께 사용합니다:

$$\mathbf{R^{*}},\mathbf{T^{*}} = \arg\min_{\mathbf{R},\mathbf{T}} \sum_{i\in\mathcal{I}} \big\| \mathbf{x}_i - \pi\big(\mathbf{K}^{t'}(\mathbf{R}\,\mathbf{X}^{t';t\rightarrow t'}_i + \mathbf{T})\big) \big\|^2 .$$

신뢰할 수 있는 *정적 마스크*는 카메라 모션만으로 유도된 플로우와 추정된 광학 플로우를 비교합니다: $\mathbf{S}^{t\rightarrow t'} = \big[\alpha > \|\mathbf{F}^{t\rightarrow t'}_{\mathrm{cam}} - \mathbf{F}^{t\rightarrow t'}_{\mathrm{est}}\|_{L1}\big]$.

**동적 전역 포인트 클라우드 + 포즈.** DUSt3R의 전체 쌍 그래프 대신, 쌍들은 슬라이딩 시간 윈도우 내부에서 (간격을 둔 샘플링과 함께) 구성됩니다. 전역 포인트맵은 $\mathbf{P}^t = [\mathbf{R}^t|\mathbf{T}^t]$, $\mathbf{K}^t$, 그리고 프레임별 깊이 $\mathbf{D}^t$로 재파라미터화된 후 다음과 같이 최적화됩니다

$$\hat{\mathbf{X}} = \arg\min_{\mathbf{X},\mathbf{P}_W,\sigma}\; \mathcal{L}_{\mathrm{align}}(\mathbf{X},\sigma,\mathbf{P}_W) + w_{\mathrm{smooth}}\,\mathcal{L}_{\mathrm{smooth}}(\mathbf{X}) + w_{\mathrm{flow}}\,\mathcal{L}_{\mathrm{flow}}(\mathbf{X}),$$

여기서 $\mathcal{L}_{\mathrm{align}} = \sum_{e}\sum_{t\in e}\|\mathbf{C}^{t;e}\cdot(\mathbf{X}^{t}-\sigma^{e}\mathbf{P}^{t;e}\mathbf{X}^{t;e})\|_1$는 DUSt3R의 정렬 항이고, $\mathcal{L}_{\mathrm{smooth}} = \sum_t \big(\|\mathbf{R}^{t\top}\mathbf{R}^{t+1}-\mathbf{I}\|_f + \|\mathbf{T}^{t+1}-\mathbf{T}^{t}\|_2\big)$는 궤적을 매끄럽게 하며, $\mathcal{L}_{\mathrm{flow}}$는 신뢰할 수 있는 정적 영역 내에서 재투영된 전역 기하학이 추정된 플로우와 일치하도록 합니다 ($w_{\mathrm{smooth}} = w_{\mathrm{flow}} = 0.01$; Adam 반복 300회). $\hat{\mathbf{D}}$를 직접 반환하면 시간적으로 일관된 비디오 깊이를 얻을 수 있습니다. 추론: 60프레임 비디오의 쌍별 포인트맵에 약 30초 (윈도우 9, 간격 2)에 RTX 6000 한 장으로 약 1분의 최적화가 추가됩니다.

## 실험 결과

- **비디오 깊이** (스케일-및-이동 정렬, Abs Rel / δ<1.25): Sintel 0.335/58.5, Bonn **0.063**/96.4, KITTI **0.104**/89.5 — 동시대의 전용 방법인 DepthCrafter를 Bonn과 KITTI에서 능가하고 (0.075/97.1, 0.110/88.1), 모든 결합 깊이-포즈 기준선을 능가합니다 (CasualSAM: 0.387, 0.169, 0.246 Abs Rel). 스케일만 정렬하는 경우 그 차이가 더 벌어집니다 (0.345/0.065/0.106 대 DepthCrafter의 0.692/0.217/0.141).
- **카메라 포즈** (ATE): Sintel 0.108, ScanNet 0.068 — 결합 깊이+포즈 방법 중 최고 수준이며 (CasualSAM 0.141/0.158; 실측 모션 마스크를 *사용해도* DUSt3R는 0.417/0.081), 실측 내부 파라미터가 필요한 포즈 전용 트래커 (LEAP-VO 0.089 Sintel)와도 경쟁력이 있습니다. TUM-dynamics ATE는 0.074입니다.
- **단일 프레임 깊이**는 파인튜닝 후에도 DUSt3R 수준을 유지합니다 (Sintel 0.345 대 0.424, Bonn 0.076 대 0.141, KITTI 0.101 대 0.112 Abs Rel; 정적인 NYU-v2에서는 소폭 저하, 0.091 대 0.080).
- 어블레이션: 모든 학습 데이터셋이 기여합니다. 디코더+헤드 파인튜닝이 다른 대안들보다 우수합니다. 매끄러움/플로우 손실은 깊이에 대한 영향을 최소화하면서 포즈를 개선합니다. 정성적으로, DAVIS에서의 피드포워드 4D 재구성은 DUSt3R의 강체 정렬이 붕괴하는 지점에서도 성공합니다.

## SLAM에서의 의미

동적 환경은 기하학 기반 SLAM의 오랜 실패 모드로, 전통적으로 움직이는 물체를 마스킹하여 처리했습니다 (DynaSLAM, DS-SLAM). MonST3R는 다른 경로를 보여줍니다: 모션이 존재하는 상태에서도 기하학을 원래부터 추정하는 파운데이션 모델을 통해, 포즈, 비디오 깊이, 모션 분할이 모두 하나의 표현에서 자연스럽게 도출됩니다 — 그리고 명시적인 모션 모델 없이도, 적절히 선택된 소규모 파인튜닝 (대부분 합성 데이터, 동결된 인코더)만으로 충분함을 보여줍니다. 이는 정적인 DUSt3R/MASt3R 계열에서 4D 장면 이해로 나아가는 핵심 발판이며, 정적 세계 가정이 파이프라인 수준에서 패치되는 것이 아니라 표현 수준에서 해소될 수 있음을 시사합니다.

## 관련 문서

- [DUSt3R](../level-05-deep-learning/dust3r.md)
- [MASt3R](../level-05-deep-learning/mast3r.md)
- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [SEA-RAFT](../level-05-deep-learning/sea-raft.md) — 이 연구가 의존하는 기성품 플로우 종류
- [Align3R](../level-05-deep-learning/align3r.md)
