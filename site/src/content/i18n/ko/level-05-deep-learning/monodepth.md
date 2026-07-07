# MonoDepth

> Godard 2016 · [논문](https://arxiv.org/abs/1609.03677)

**한 줄 요약** — 좌우 광도 일관성(left-right photometric consistency)을 통해 스테레오 이미지 쌍으로 학습하는 자기지도 단안 depth estimation: 학습에는 스테레오 이미지가 지도 신호로 사용되지만, 테스트 시에는 단일 이미지만으로 충분하다.

## 문제

지도 학습 기반 단안 depth estimation은 깊이를 회귀 문제로 다루기 때문에 방대한 양의 ground-truth 깊이가 필요하지만, 고가의 레이저 스캐너조차 움직임과 반사가 있는 실제 장면에서는 부정확한 값만을 제공한다. 반면 스테레오 리그는 저렴하고 어디에나 있다. MonoDepth의 핵심 통찰은 학습 시 깊이 추정을 *이미지 재구성* 문제로 재정의하는 것이다: 한 정류화(rectified)된 뷰를 다른 뷰로 워핑하는 disparity 필드 $d$를 예측하는 것은 $\hat{d}=bf/d$ (베이스라인 $b$, 초점 거리 $f$)를 통해 깊이를 예측하는 것과 동등하므로, 이미지 재구성 오차가 학습 신호가 되고 깊이 라벨이 전혀 필요 없어진다.

## 방법 및 아키텍처

**네트워크.** DispNet에서 영감을 받은 완전 합성곱 encoder-decoder (31M 파라미터; ResNet50-encoder 변형은 48M)로, skip connection과 4개 스케일에서의 disparity 출력을 갖는다. 중요한 점은, *왼쪽 이미지만으로부터* disparity 맵 $d^l$과 $d^r$을 **모두** 예측한다는 것이다. 오른쪽 이미지는 손실 계산에만 사용된다. 역방향 워핑에는 spatial transformer network에서 온 완전 미분 가능한 bilinear sampler를 사용한다: $\tilde{I}^l = I^r(d^l)$. Disparity는 스케일된 sigmoid를 통해 $[0, 0.3\times\text{width}]$로 제한되며, ELU가 ReLU를 대체하고(ReLU는 중간 스케일 disparity를 조기에 고정시켰다), deconvolution은 nearest-neighbor 업샘플 + conv로 대체된다.

**손실.** 전체 손실 $C=\sum_{s=1}^4 C_s$는 각 스케일에서 세 가지의 좌우 대칭 항을 결합한다:

$$C_s=\alpha_{ap}(C_{ap}^{l}+C_{ap}^{r})+\alpha_{ds}(C_{ds}^{l}+C_{ds}^{r})+\alpha_{lr}(C_{lr}^{l}+C_{lr}^{r})$$

- *외관 매칭(Appearance matching)* — SSIM + L1 광도 재구성 ($\alpha=0.85$, 단순화된 $3\times3$ 블록 필터 SSIM):
$$C_{ap}^{l}=\frac{1}{N}\sum_{i,j}\alpha\frac{1-\text{SSIM}(I^{l}_{ij},\tilde{I}^{l}_{ij})}{2}+(1-\alpha)\left\|I^{l}_{ij}-\tilde{I}^{l}_{ij}\right\|$$
- *경계 인지 disparity 평활화(Edge-aware disparity smoothness)* — disparity 기울기에 대한 L1으로, 이미지 경계에서 가중치를 낮춰 깊이 불연속이 물체 경계와 정렬되도록 한다:
$$C_{ds}^{l}=\frac{1}{N}\sum_{i,j}\left|\partial_{x}d^{l}_{ij}\right|e^{-\left\|\partial_{x}I_{ij}^{l}\right\|}+\left|\partial_{y}d^{l}_{ij}\right|e^{-\left\|\partial_{y}I^{l}_{ij}\right\|}$$
- *좌우 disparity 일관성(Left-right disparity consistency)* — 핵심 novelty로, 왼쪽 뷰의 disparity 맵이 투영된 오른쪽 뷰의 disparity 맵과 같아야 한다:
$$C_{lr}^{l}=\frac{1}{N}\sum_{i,j}\left|d^{l}_{ij}-d^{r}_{ij+d^{l}_{ij}}\right|$$

단순한 단방향 샘플링은 잘못된 이미지에 정렬된 disparity나 "텍스처 복제(texture-copy)" 아티팩트, 깊이 불연속 지점에서의 오차를 만들어내는데, $d^l$과 $d^r$ 사이의 상호 일관성을 강제하면 이 두 문제가 모두 해결된다. 가중치는 $\alpha_{ap}=\alpha_{lr}=1$, $\alpha_{ds}=0.1/r$ (스케일별). Titan X에서 Adam(학습률 $10^{-4}$, 배치 8)으로 50 에포크, 약 25시간 학습; 플립/색상 지터 증강을 사용했다. 테스트 시 후처리 단계(pp)는 이미지와 그 미러 이미지의 disparity를 평균하여 스테레오 disocclusion ramp를 억제한다. 테스트 시에는 가장 미세한 스케일의 $d^l$만 사용하며, 512×256 이미지에 대해 추론은 35ms 이내(28+ FPS)로 동작한다.

## 실험 결과

- **KITTI split (공식 disparity 이미지 200장)**: 좌우 일관성이 no-LR 변형과 Deep3D 이미지 형성 기준선을 모든 지표에서 능가한다(Ours K: Abs Rel 0.124, RMSE 6.125, D1-all 30.27 vs Deep3D 0.412/13.69/66.85); Cityscapes 사전학습 + KITTI로 0.104/5.417로 향상되며, ResNet + 후처리를 적용하면 0.097/5.093이다.
- **Eigen split (테스트 이미지 697장)**: KITTI만으로 학습해 Abs Rel 0.148, RMSE 5.927, $\delta<1.25$ = 0.803을 달성 — 깊이 라벨 없이도 *지도 학습* 기반인 Eigen et al.(0.203)과 Liu et al.(0.201)의 방법을 능가한다; ResNet + pp를 적용한 CS+K는 Abs Rel 0.114, RMSE 4.935, $\delta<1.25$ = 0.861에 도달한다. 50m로 제한하면 Garg et al.을 능가한다(0.140 vs 0.169 Abs Rel).
- **일반화**: Make3D에서 한 번도 학습하지 않았음에도 완전 지도 학습 방법들보다 우수한 정성적 결과를 보인다; 스테레오 입력 변형은 더 우수하다(Abs Rel 0.068), 이는 단안이 더 어려운 문제임을 확인시켜 준다.

## SLAM에서의 의미

MonoDepth는 자기지도 depth estimation을 개척했으며 거대한 연구 흐름(Monodepth2, PackNet, 그리고 수십 개의 후속 연구)을 낳았다; 그 좌우 일관성과 SSIM + L1 광도 손실 기법은 표준 도구가 되었다. SLAM 입장에서 이것은 SLAM 시스템이 이미 수집하는 것과 같은 종류의 원시 주행/로봇 영상으로부터 학습 가능한 깊이 사전(depth prior)의 길을 열었다 — 별도의 깊이 센서가 필요 없다 — 이는 D3VO, MonoRec, 그리고 현대의 단안 밀집 매핑에서 사용되는 자기지도 깊이 계열의 기반이 된다.

## 관련 문서

- [SfM-Learner](sfm-learner.md) — 단안 비디오 대응판 (깊이 + ego-motion)
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — 개념 개관
- [MiDaS](midas.md) — 다중 데이터셋 일반화 후속 연구
- [MonoRec](monorec.md) — 이 계보를 이어받은 밀집 복원
- [D3VO](../level-03-monocular-slam/d3vo.md) — 이 자기지도 학습 철학 위에 구축된 딥러닝 기반 VO
