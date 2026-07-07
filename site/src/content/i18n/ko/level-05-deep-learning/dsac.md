# DSAC

> Brachmann 2017 · [논문](https://arxiv.org/abs/1611.05705)

**한 줄 요약** — 결정론적 가설 선택을 확률적 선택으로 대체하여 RANSAC을 미분 가능하게 만들고, 강인한 포즈 추정기를 통해 scene coordinate 기반 카메라 위치 추정 파이프라인의 종단간 학습을 가능하게 합니다.

## 문제

RANSAC은 기하학적 비전 (multi-view geometry, 포즈 추정, SLAM)에서 "지역적으로 예측하고 전역적으로 피팅한다"는 방식을 따르는 강인한 추정의 핵심 도구입니다. 그러나 가장 높은 합의 점수를 가진 모델 가설을 취하는 가설 선택 방식, $\mathbf{h}_{\mathrm{AM}}=\arg\max_{\mathbf{h}_J} s(\mathbf{h}_J,Y)$은 미분 불가능하여, RANSAC이 종단간으로 학습되는 딥러닝 파이프라인 내부에 위치할 수 없었습니다. 카메라 재위치추정 (relocalization)의 경우 특히, 딥러닝은 지금까지 전통적 접근법을 능가하지 못했습니다: 직접 포즈 회귀 (PoseNet)는 부정확하며 (장면당 중간값 이동 오차 약 40cm), scene coordinate regression은 기하학을 유지했지만 학습 가능한 구성 요소들이 실제로 중요한 포즈 손실이 아니라 대리 손실로만 학습될 수 있었습니다.

## 방법 및 아키텍처

이 파이프라인은 scene coordinate regression (SCoRF) 프레임워크를 따라 알려진 장면 내에서 RGB 이미지의 6-DoF 포즈 $\tilde{\mathbf{h}}$를 추정합니다:

- **Coordinate CNN** ($\mathbf{w}$; VGG 스타일, 13개 레이어, 3300만 파라미터): 각 42x42 패치에 대해 scene coordinate $\mathbf{y}_i \in \mathbb{R}^3$ — 2D-3D 대응점 — 을 예측합니다. 이미지당 40x40개의 예측을 수행합니다.
- **가설 생성**: $n{=}4$개 대응점의 최소 집합을 균일하게 샘플링하고, PnP를 통해 256개의 포즈 가설 $\mathbf{h}_J$ 풀을 생성합니다.
- **Score CNN** ($\mathbf{v}$; 13개 레이어, 600만 파라미터): 각 가설은 재투영 오차 $e_i = \lVert\mathbf{p}_i - C\mathbf{h}_J\mathbf{y}_i\rVert$의 40x40 이미지로부터 점수를 얻습니다. 여기서 $\mathbf{p}_i$는 픽셀 $i$의 2D 위치이고, $C$는 카메라 투영 행렬입니다.
- **선택 및 정제**: 하나의 가설을 선택한 후, 인라이어 좌표 (재투영 오차가 $\tau=10$ px 미만, 최대 100개 인라이어)에서 8회 반복 정제합니다.

선택 단계를 미분 가능하게 만드는 두 가지 경로가 비교됩니다:

- **SoftAM (soft argmax)**: 선택을 softmax 가중 평균으로 대체합니다, $\mathbf{h}_{\mathrm{SoftAM}}=\sum_J P(J|\mathbf{v},\mathbf{w})\,\mathbf{h}_J$ 여기서 $P(J|\mathbf{v},\mathbf{w}) \propto \exp(s(\mathbf{h}_J,Y;\mathbf{v}))$ — 하지만 이는 RANSAC의 hard decision을 버리고 대신 강인한 평균을 학습합니다.
- **DSAC (확률적 선택)**: hard 선택을 유지하되 이를 샘플링합니다, $\mathbf{h}_{\mathrm{DSAC}}=\mathbf{h}_J$ 여기서 $J \sim P(J|\mathbf{v},\mathbf{w})$이며, policy-gradient 강화학습에서 착안하여 *기댓값* 작업 손실을 최소화합니다:

$$\tilde{\mathbf{w}},\tilde{\mathbf{v}}=\arg\min_{\mathbf{w},\mathbf{v}}\sum_{I\in\mathcal{I}}\mathbb{E}_{J\sim P(J|\mathbf{v},\mathbf{w})}\left[\ell(\mathbf{R}(\mathbf{h}_J^{\mathbf{w}},Y^{\mathbf{w}}))\right]$$

  이 그래디언트 자체가 기댓값입니다:

$$\frac{\partial}{\partial\mathbf{w}}\mathbb{E}_{J}\left[\ell(\cdot)\right]=\mathbb{E}_{J}\left[\ell(\cdot)\frac{\partial}{\partial\mathbf{w}}\log P(J|\mathbf{v},\mathbf{w})+\frac{\partial}{\partial\mathbf{w}}\ell(\cdot)\right]$$

학습 손실은 포즈 오차 $\ell_{\text{pose}}(\mathbf{h},\mathbf{h}^{*})=\max(\measuredangle(\boldsymbol{\theta},\boldsymbol{\theta}^{*}),\lVert\mathbf{t}-\mathbf{t}^{*}\rVert)$ 입니다 (회전은 도 단위, 이동은 cm 단위). 두 CNN은 먼저 구성 요소별로 학습됩니다 ($L_1$ coordinate 손실; 점수는 $\beta{=}10$인 $-\beta\,\ell_{\text{pose}}$에 대해 회귀), 그런 다음 종단간으로 학습됩니다. PnP와 정제의 도함수는 중심 차분 (central differences)을 통해 구합니다.

## 실험 결과

7-Scenes 데이터셋에서 (정확도 = 5cm / 5도 이내 테스트 프레임의 비율):

- **구성 요소별**: 전체 세트 (17,000 프레임)에서 RANSAC 61.0%, SoftAM 61.6%, DSAC 60.3% — 모두 이미 sparse-feature 기준선 (38.6%)과 Brachmann 등의 auto-context forest 파이프라인 (55.2%)을 능가하며, 이는 주로 Score CNN 덕분입니다.
- **종단간**: DSAC은 **62.5%**로 향상됩니다 (+2.2%, SEM ±0.4%). Kitchen +5.0%, Pumpkin +3.3%. 반면 SoftAM은 57.8%로 *하락*합니다 (−3.8%), 심하게 과적합됩니다 (Office −14.7%) — SoftAM의 평균화는 공격적인 가중치 감소를 강제하여 점수 분포를 붕괴시키지만, DSAC은 이를 넓게 유지합니다. 종단간 DSAC은 전체 세트에서 기존 최고 성능을 7.3% 능가합니다 (장면 평균 4.9%).
- **중간값 포즈 오차**: 3.9cm / 1.6도, Brachmann 등의 4.5cm / 2.0도 대비 우수. PoseNet (중간값 이동 오차 약 40cm)은 경쟁력이 없습니다.
- 종단간 학습 후, 테스트 시 원래의 argmax 선택을 손실 없이 복원할 수 있습니다 (62.4%). 약점: Stairs 장면 (4.5%)은 반복 구조에 대한 unimodal 포인트 예측으로 어려움을 겪습니다.

## SLAM에서의 의미

DSAC은 scene coordinate regression을 실내 카메라 재위치추정의 지배적인 학습 기반 패러다임으로 확립했으며, 기하학적 solver를 루프 내에 유지하고 작업이 실제로 중요시하는 포즈 손실에 대해 학습하기 때문에 absolute pose regression을 크게 능가합니다. 미분 가능 RANSAC이라는 아이디어는 geometric deep learning 전반에 널리 확산되었습니다 — 논문은 이를 SfM 또는 SLAM을 종단간으로 학습하기 위한 강인한 최적화 구성 요소로 명시적으로 제안합니다 — 그리고 DSAC은 DSAC++, DSAC*, 그리고 오늘날 사용되는 빠른 학습 재위치추정기인 ACE 계열의 직접적인 선조입니다.

## 관련 문서

- [PoseNet](posenet.md) — SCR이 대체한 absolute pose regression 기준선
- [DSAC++](dsacpp.md) — 후속 연구: 단일 학습 가능 구성 요소, 포즈만으로 학습 가능
- [DSAC*](dsac-star.md) — 안정화된 학습을 갖춘 통합 RGB/RGB-D 프레임워크
- [ACE](ace.md) — 몇 시간 대신 몇 분 만에 학습되는 scene coordinate regression
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — 직접 포즈 회귀가 부족한 이유
