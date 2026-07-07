# DeepV2D

> Teed 2018 · [논문](https://arxiv.org/abs/1812.04605)

**한 줄 요약** — DeepV2D는 고전적인 기하학 알고리즘(PnP 스타일 포즈 갱신, 평면 스위프 스테레오)을 미분 가능한 모듈로 구성하고 모션과 깊이 추정을 둘 다 수렴할 때까지 교대로 수행함으로써 비디오로부터 깊이를 예측한다 — 학습된 block coordinate descent라 할 수 있다.

## 문제

비디오로부터의 깊이 추정은 만족스럽지 못한 두 극단 사이에 놓여 있다: 고전적인 SfM 파이프라인은 기하학적으로 원칙적이지만 텍스처가 적은 영역, 가려짐, 조명 변화에서 노이즈가 많거나 누락된 재구성을 만들어내며, 반면 일반적인 깊이 회귀 네트워크는 실제로 다중 뷰 기하학을 활용하도록 학습시키기 어렵다. DeepV2D의 목표는 "신경망의 표현 능력과 이미지 형성을 지배하는 기하학적 원리를 결합하는" 종단간 아키텍처다 — 이는 스테레오 시차, 밀집 2D 매칭, PnP를 교대로 수행하는 고전적 SfM 파이프라인을 "미분화(differentialize)"한다.

## 방법 및 아키텍처

추론 시 두 모듈이 교대로 동작한다. 투영 $\pi$와 역투영 $\pi^{-1}$을 핀홀 모델 아래에서 사용하면, 카메라 $i$에서 깊이 $z$를 갖는 픽셀 $\mathbf{x}$는 카메라 $j$로 $\pi(\mathbf{G}_{ij}\,\pi^{-1}(\mathbf{x},z))$로 재투영되며, 여기서 $\mathbf{G}_{ij}=\mathbf{G}_{j}\mathbf{G}_{i}^{-1}$은 $SE(3)$ 상의 상대 포즈다.

**깊이 모듈**(포즈가 주어졌을 때 키프레임 깊이를 예측): stacked-hourglass 2D 인코더가 각 이미지를 특징 $F_i$로 매핑한다; 키프레임이 아닌 각 프레임 $j$에 대해, 깊이 가설 $z_1,\dots,z_D$(실내에서 0.2–10 m)에 대해 특징을 역투영하여 비용 볼륨을 구성한다:

$$C_{uvk}^{j}=F_{j}\big(\pi(\mathbf{G}_{j}\mathbf{G}_{1}^{-1}\pi^{-1}(\mathbf{x},z_{k}))\big),$$

미분 가능한 bilinear sampling을 사용하므로 이 볼륨은 카메라 포즈에 대해서도 미분 가능하다. 볼륨은 키프레임 특징과 결합되고, 3D 컨볼루션으로 매칭되며, 여러 뷰에 걸쳐 평균화("view pooling")되고, 3D hourglass 모듈로 정제되며, 깊이 차원에 대한 미분 가능한 soft argmax로 읽어들여진다.

**모션 모듈(Flow-SE3)**(깊이가 주어졌을 때 포즈를 갱신): 공유 특징 추출기와 hourglass 네트워크가 키프레임 특징과 현재 깊이/포즈로 워핑된 특징 사이의 밀집한 *잔차 flow* $\mathbf{R}$과 신뢰도 $\mathbf{W}$를 예측한다. 각 픽셀은 포즈 섭동 $\xi\in se(3)$에 대한 기하학적 재투영 오차를 정의한다:

$$\mathbf{e}_{k}^{ij}(\xi_{i},\xi_{j})=\mathbf{r}_{k}-\big[\pi\big((e^{\xi_{j}}\mathbf{G}_{j})(e^{\xi_{i}}\mathbf{G}_{i})^{-1}\mathbf{X}_{k}^{i}\big)-\pi(\mathbf{G}_{ij}\mathbf{X}_{k}^{i})\big],\qquad \mathbf{X}_{k}^{i}=\pi^{-1}(\mathbf{x}_{k},z_{k}),$$

그리고 목적함수 $E(\boldsymbol{\xi})=\sum_{(i,j)\in\mathcal{C}}\sum_{k}\mathbf{e}_{k}^{ij\,T}\,diag(\mathbf{w}_{k})\,\mathbf{e}_{k}^{ij}$는 하나의 미분 가능한 Gauss-Newton 스텝으로 최소화된다.

$$\xi^{*}=-(\mathbf{J}^{T}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^{T}\mathbf{W}\,\mathbf{r},$$

이는 단일 PnP 반복을 펼친(unroll) 것이며, 기울기는 이 solve를 거쳐 flow 및 특징 네트워크로 흘러간다. 쌍 집합 $\mathcal{C}$에는 두 가지 변형이 있다: *키프레임* 최적화(키프레임 대 각 프레임; 각 $\xi_j$가 독립적으로 풀림)와 *전역* 최적화(모든 $N\times(N-1)$개의 쌍, 포즈 그래프처럼 모든 포즈를 결합적으로 갱신).

**학습 및 추론.** 지도는 매끄러움 페널티가 포함된 L1 깊이 손실과, 예측 포즈와 ground-truth 포즈 사이의 Huber-robust 재투영 손실이며, $\mathcal{L}=\mathcal{L}_{depth}+\lambda\mathcal{L}_{motion}$($\lambda=1$)로 결합된다. 추론은 상수 깊이 맵(self-init) 또는 단일 이미지 네트워크(fcrn-init)로 초기화되며 모듈들을 교대로 실행한다 — 8회 반복 후 평가하지만, 정확도는 몇 회 안에 수렴한다.

## 실험 결과

- **NYUv2**(스케일 정합 깊이): Abs Rel 0.061, RMSE 0.403, $\delta<1.25$ = 0.956(fcrn-init, 전역) — NYU로 재학습한 DeMoN 0.144, MVSNet+OpenMVG 0.181, 단일 이미지 DORN 0.109 / DenseDepth 0.103 대비. self-init조차 Abs Rel 0.070에 도달한다.
- **ScanNet**: ScanNet으로 학습, Abs Rel 0.057, sc-inv 0.077, 회전 0.628도, 이동 1.373 cm; *NYU로만* 학습해도 모든 지표에서 BA-Net(5-view: Abs Rel 0.091)을 앞선다 — 강력한 데이터셋 간 일반화.
- **SUN3D**: L1-inv 0.041 / sc-inv 0.104(NYU+ScanNet 학습) 대 DeepTAM 0.054 / 0.128 — DeepTAM이 SUN3D로 학습되었고 ground-truth 포즈로 평가되었음에도 그렇다.
- **KITTI**(Eigen split): Abs Rel 0.037, RMSE 2.005 대 BA-Net 0.083 / 3.640, DORN 0.069 / 2.857.
- **TUM RGB-D 추적**(이동 RMSE, m/s): 평균 0.033 대 DeepTAM 0.040, DVO 0.060, 슬라이딩 8프레임 윈도우에 대한 전역 포즈 최적화 사용.
- Ablation: 3D 스테레오 매칭 네트워크를 correlation layer + 2D 인코더-디코더로 교체하면 NYU Abs Rel이 0.062에서 0.135로 악화된다.

## SLAM에서의 의미

DeepV2D는 DeMoN에서 DROID-SLAM으로 이어지는 계보의 핵심 연결점이다: 학습된 모션과 학습된 깊이 사이를 반복하는 것 — 기하학(즉 $SE(3)$ 상의 미분 가능한 Gauss-Newton 레이어)이 그 교환을 매개하는 것 — 이 어느 한쪽을 한 번에 회귀하는 것보다 우수함을 보여주었다. BA-Net의 깊이 basis에 대한 결합 최적화와 달리, DeepV2D의 block coordinate descent 분해는 픽셀별 깊이를 직접 최적화한다. Teed & Deng의 후속작인 RAFT와 DROID-SLAM은 바로 이 alternate-and-converge 설계로부터 자라났으며, 이는 현재 가장 정확한 학습 기반 VO/SLAM 시스템들의 근간을 이룬다.

## 관련 문서

- [DeMoN](demon.md)
- [BA-Net](ba-net.md)
- [DeepTAM](deeptam.md)
- [RAFT](raft.md)
- [DROID-SLAM](droid-slam.md)
