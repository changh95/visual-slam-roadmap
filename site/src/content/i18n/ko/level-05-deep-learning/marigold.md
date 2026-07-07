# Marigold

> Ke 2024 · [논문](https://arxiv.org/abs/2312.02145)

**한 줄 요약** — Stable Diffusion의 U-Net만을 미세조정하여 이미지에 조건화된 깊이 latent를 denoising하도록 함으로써 Stable Diffusion을 affine-invariant 단안 깊이 추정기로 재활용하며, 순수하게 7만 4천 개의 합성 샘플로 약 2.5 GPU-day 만에 학습되고, 여러 diffusion 샘플을 앙상블함으로써 픽셀별 불확실성도 얻을 수 있다.

## 문제

단일 이미지로부터 3D 깊이를 복원하는 것은 기하학적으로 ill-posed하다 — 단순한 기하가 아니라 *장면 이해*를 필요로 한다. 소형 CNN부터 대형 Transformer에 이르는 판별적(discriminative) 깊이 추정기는 학습 중에 본 시각적 세계에 의해 제약되며, 낯선 콘텐츠와 배치(layout)에서는 zero-shot 성능이 어렵다. 한편 Stable Diffusion은 인터넷 규모의 이미지 모음(LAION-5B)을 시각적 세계에 대한 풍부한 사전(prior)으로 증류해 두었다. Marigold는 다음을 묻는다: 시각적 세계에 대한 포괄적인 표현이 단안 깊이의 초석이라면, 그 사전을 잊지 않으면서 사전학습된 이미지 diffusion 모델로부터 널리 적용 가능한 깊이 추정기를 *유도*할 수 있을까?

## 방법 및 아키텍처

깊이 추정은 조건부 denoising diffusion으로 formulate된다: RGB 이미지 $\mathbf{x}\in\mathbb{R}^{W\times H\times 3}$가 주어졌을 때 깊이 $\mathbf{d}\in\mathbb{R}^{W\times H}$에 대한 조건부 분포 $D(\mathbf{d}\,|\,\mathbf{x})$를 모델링한다. forward process는 단계 $t\in\{1,\dots,T\}$에서 깊이를 손상시킨다:

$$\mathbf{d}_t=\sqrt{\bar{\alpha}_t}\,\mathbf{d}_0+\sqrt{1-\bar{\alpha}_t}\,\boldsymbol{\epsilon},\qquad \boldsymbol{\epsilon}\sim\mathcal{N}(0,I),\ \ \bar{\alpha}_t:=\textstyle\prod_{s=1}^{t}(1-\beta_s)$$

그리고 U-Net $\boldsymbol{\epsilon}_\theta$은 표준 denoising 목적함수 $\mathcal{L}=\mathbb{E}_{\mathbf{d}_0,\boldsymbol{\epsilon},t}\lVert\boldsymbol{\epsilon}-\hat{\boldsymbol{\epsilon}}\rVert_2^2$로 학습된다. 모든 과정은 Stable Diffusion v2의 latent space 안에서 진행되며, 그 공간을 그대로 유지한다:

- **두 modality 모두에 동결된 VAE.** 깊이 맵은 3채널로 복제되어 수정하지 않은 SD VAE로 인코딩된다($\mathbf{d}\approx\mathcal{D}(\mathcal{E}(\mathbf{d}))$가 무시할 만한 오차로 성립); 추론 시 디코딩된 3채널은 평균낸다.
- **연결(concatenation)을 통한 조건화.** 이미지 latent $\mathbf{z}^{(\mathbf{x})}$와 잡음이 섞인 깊이 latent를 특징 차원을 따라 연결한다; U-Net의 첫 레이어는 입력 채널 수가 두 배로 늘어나며, 사전학습된 입력 가중치를 복제한 뒤 절반으로 나눈다. 텍스트 조건화는 비활성화된다. U-Net만 미세조정된다.
- **Affine-invariant 정규화.** ground-truth 깊이는 $\tilde{\mathbf{d}}=\left(\frac{\mathbf{d}-\mathbf{d}_2}{\mathbf{d}_{98}-\mathbf{d}_2}-0.5\right)\times 2$를 통해 $[-1,1]$로 매핑된다. 여기서 $\mathbf{d}_2,\mathbf{d}_{98}$은 깊이의 2%와 98% 백분위수다 — scale/shift가 없는 정형화된(canonical) 표현이다.
- **합성 데이터만으로 학습.** Hypersim(실내 약 5.4만 장) + Virtual KITTI(거리 약 2만 장) — VAE가 받아들일 수 있는 밀집하고 노이즈 없는 깊이(invalid 픽셀 없음). 학습: 1.8만 iteration, 배치 32, Adam lr $3\cdot 10^{-5}$, RTX 4090 한 대로 약 2.5일.
- 미세조정 중의 **annealed multi-resolution noise**(다중 스케일 Gaussian noise를 중첩한 뒤 $t=0$에서 표준 Gaussian으로 annealing)는 더 빠르게 수렴하며 표준 DDPM noise보다 훨씬 우수하다.
- **추론과 앙상블.** Gaussian noise로부터 50 스텝으로 재분배된 DDIM을 사용; $N$번의 확률적 실행은 pairwise 거리 $\lVert\hat{\mathbf{d}}'_i-\hat{\mathbf{d}}'_j\rVert_2$를 최소화하도록 실행별 scale $\hat{s}_i$와 shift $\hat{t}_i$를 공동 최적화하고, 여기에 픽셀별 median으로 병합된 맵 $\mathbf{m}$에 대한 정규화 항 $\mathcal{R}=|\min(\mathbf{m})|+|1-\max(\mathbf{m})|$를 더해 병합된다 — ground truth가 필요 없으며, 샘플 간 편차가 그대로 불확실성이 된다.

## 실험 결과

학습 중 본 적 없는 다섯 개의 실제 데이터셋에서 zero-shot 평가(지표는 %, AbsRel은 낮을수록/$\delta_1$은 높을수록 좋음):

- **NYUv2**: AbsRel 5.5 / $\delta_1$ 96.4 (앙상블 사용) — 기존 최고인 HDN의 6.9 / 94.8 대비 우수하며, 초록에서 언급된 20% 이상의 상대적 개선에 해당한다.
- **KITTI**: 9.9 / 91.6 vs DPT 10.0 / 90.1; **ETH3D**: 6.5 / 96.0 vs DPT 7.8 / 94.6; **ScanNet**: 6.4 / 95.1; **DIODE**: 30.8 / 77.3.
- 벤치마크 전체에서 평균 순위 1.4로, HDN(3.2)과 DPT(3.9)보다 우수하다 — 30만~1200만 장의 실제 이미지로 학습된 baseline 대비 오직 7만 4천 장의 합성 샘플만 사용했다.
- Ablation: multi-resolution + annealed noise는 NYUv2 AbsRel을 7.7에서 5.6으로 개선; 10개 예측 앙상블은 NYUv2 AbsRel을 약 8% 줄인다(20개 예측은 약 9.5%로, 10개 이후로는 개선이 줄어든다); 정확도는 약 10 DDIM step에서 saturate되며, 이는 이미지 생성이 필요로 하는 step 수보다 훨씬 적다.

## SLAM에서의 의미

Marigold는 인터넷 규모의 생성적 사전이 기하학적 과제로 전이될 수 있음을 보여, diffusion 기반 깊이 계열을 열었다. SLAM에 특히 중요한 것은 샘플링된 불확실성이다: 단안 깊이 사전을 SLAM 백엔드로 융합하려면 noise 모델이 필요한데, Marigold는 앙상블 분산으로부터 픽셀별 noise 모델을 공짜로 제공한다. 반복적인 추론 때문에 실시간 프론트엔드에는 적합하지 않지만, 오프라인 매핑, 밀집 사전 생성, 그리고 (Depth Anything V2 같은) 더 빠른 모델들이 비교 대상으로 삼는 세밀한 디테일 품질의 기준으로서 가치가 있다.

## 관련 문서

- [MiDaS](midas.md) — 다중 데이터셋 relative-depth 기준선
- [DPT](dpt.md) — 깊이를 위한 판별적 Transformer 아키텍처
- [Depth Anything V2](depth-anything-v2.md) — 합성 데이터로 학습된 더 빠른 판별적 경쟁 모델
- [Metric3D](metric3d.md) — 카메라를 고려한 metric-scale 대안
- [Align3R](align3r.md) — Marigold와 같은 프레임별 깊이를 비디오/SLAM을 위해 시간적으로 일관되게 만듦
