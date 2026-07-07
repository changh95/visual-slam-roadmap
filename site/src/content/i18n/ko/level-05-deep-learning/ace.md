# ACE

> Brachmann 2023 · [논문](https://arxiv.org/abs/2305.14059)

**한 줄 요약** — Accelerated Coordinate Encoding은 네트워크를 장면 비의존적인 사전 학습 인코더와 아주 작은 장면 특화 MLP 헤드로 분리하여, scene coordinate regression 학습을 장면당 수 시간에서 약 5분으로 단축했습니다.

## 문제

학습 기반 visual relocalizer는 최고 수준의 포즈 정확도를 보여주지만, 학습에 수 시간에서 수일이 걸립니다 — 그리고 학습은 새로운 장면마다 다시 이루어져야 하므로, 긴 학습 시간은 높은 정확도라는 가능성에도 불구하고 학습 기반 relocalization을 대부분의 응용에서 비실용적으로 만들었습니다. 배포의 병목은 질의(query) 단계가 아니라 매핑 단계였습니다: 최신 SCR 파이프라인인 DSAC\*는 하나의 장면을 매핑하는 데 고급 GPU에서 15시간이 필요합니다.

## 방법 및 아키텍처

**설정.** DSAC 계열과 마찬가지로, 포즈는 $\mathbf{h}=g(\mathcal{C})$로부터 나오며, 여기서 $g$는 PnP + RANSAC 솔버 (64개 가설, 10px 인라이어 임계값, LM 정제)이고 $\mathcal{C}=\{(\mathbf{x}_i,\mathbf{y}_i)\}$는 이미지 패치 $\mathbf{p}_i$에서 동작하는 scene coordinate regressor $\mathbf{y}_{i}=f(\mathbf{p}_{i};\mathbf{w})$가 예측한 2D-3D 대응점입니다. ACE는 이를 완전히 그대로 유지하며 — 그 기여는 $f$의 학습을 두 자릿수만큼 더 빠르게 만드는 것입니다.

**Backbone/head 분리.** Regressor는 다음과 같이 분해됩니다.

$$f(\mathbf{p}_{i};\mathbf{w})=f_{\text{H}}(\mathbf{f}_{i};\mathbf{w}_{\text{H}}),\quad\text{with}\quad \mathbf{f}_{i}=f_{\text{B}}(\mathbf{p}_{i};\mathbf{w}_{\text{B}}),$$

여기서 $f_{\text{B}}$는 장면 비의존적인 convolutional backbone (DSAC\* 설계의 첫 10개 레이어, 512차원 특징, 100개 ScanNet 장면에서 100개의 병렬 헤드로 일주일간 한 번 사전 학습 — 11MB, 배포 시 동결)이고, $f_{\text{H}}$는 1x1 convolution으로 구성된 장면 특화 512-wide MLP 헤드입니다 — 이 4MB 헤드가 곧 맵입니다.

**그래디언트 비상관화 — 핵심 아이디어.** 표준 SCR 학습은 반복마다 하나의 이미지를 입력하므로, 모든 패치 그래디언트가 서로 강하게 상관됩니다. MLP 헤드는 공간적 맥락이 필요 없기 때문에, ACE는 그 대신 첫 1분 동안 800만 개 backbone 특징 (픽셀 위치, 내부 파라미터, ground-truth 포즈 포함)으로 구성된 학습 버퍼를 미리 계산한 후, 매 epoch마다 이를 섞어서 수천 개의 서로 다른 매핑 뷰에서 뽑은 5120개 특징으로 배치를 구성합니다. 따라서 각 파라미터 업데이트는 전체 장면에 걸쳐 동시에 최적화를 수행합니다 — 비상관화된 그래디언트는 매우 높은 학습률 (AdamW, $5\cdot10^{-4}$에서 $5\cdot10^{-3}$까지의 one-cycle 스케줄)을 견딜 수 있으며, 16 epoch / 4분 내에 수렴합니다.

**종단간 학습 대신 커리큘럼.** 미분 가능 포즈 솔버를 통한 값비싼 역전파 (DSAC\* 학습 시간의 절반을 차지하지만 업데이트의 10%에만 해당)는 픽셀별 재투영 손실에 대한 커리큘럼으로 대체됩니다: 유효한 예측은 $\tanh$로 클램프된 재투영 오차를 최적화합니다.

$$\hat{e}_{\bm{\pi}}(\mathbf{x}_{i},\mathbf{y}_{i},\mathbf{h}^{*}_{i})=\tau(t)\,\tanh\left(\frac{e_{\bm{\pi}}(\mathbf{x}_{i},\mathbf{y}_{i},\mathbf{h}^{*}_{i})}{\tau(t)}\right),\qquad \tau(t)=w(t)\,\tau_{\text{max}}+\tau_{\text{min}},\;\; w(t)=\sqrt{1-t^{2}},$$

임계값은 학습 진행도 $t$에 따라 $\tau_{\text{max}}{=}50$px에서 $\tau_{\text{min}}{=}1$px까지 줄어듭니다 — 네트워크는 신뢰할 수 있는 구조에 대해 먼저 학습하고, 어차피 RANSAC이 거부할 예측은 포기합니다. 유효하지 않은 예측은 깊이 10m의 더미 좌표를 향해 회귀됩니다. 학습은 fp16으로 실행되며, 헤드는 softplus w-클리핑을 사용해 동차 좌표 $(x,y,z,w)$를 예측하는데, 이는 어려운 장면에서 지속적으로 도움이 됩니다. 깊이도, 3D 모델도 필요 없이 — 오직 포즈가 알려진 RGB만 필요합니다.

## 실험 결과

- **핵심 결과**: 훨씬 느린 기존 SCR 대비 동등한 정확도를 장면당 5분 이내의 학습으로 달성 — 최신 SCR보다 최대 **300배 빠른 매핑**, 4MB 맵 (DSAC\*: 15시간, 28MB; hLoc은 7Scenes 장면당 약 3.3GB, Cambridge에서 약 800MB 저장).
- **7Scenes / 12Scenes** (5cm/5° 임계값, SLAM 및 SfM ground truth 모두): ACE는 최고 정확도, 10분 이내 매핑, 장면당 10MB 이하를 모두 결합한 유일한 접근법입니다 — DSAC\*와 동등합니다 (Table 1). 단 한 번의 epoch (75초) 이후 이미 약 80%의 정확도에 도달하며, 2.5MB 헤드도 7Scenes에서 95%를 넘습니다.
- **Cambridge Landmarks**: ACE는 4MB로 적절한 성능을 보이며, 4개의 ACE 헤드로 구성된 "Poker" 앙상블은 매핑 시간과 저장 공간에서 훨씬 가벼우면서도 평균 median 오차에서 DSAC\*를 능가합니다.
- **Wayspots** (Map-free 스타일 SfM ground truth를 사용한 폰 스캔 기반의 새로운 10개 야외 장면 벤치마크, 10cm/5°): ACE는 두 자릿수 더 빠르게 매핑하면서도 평균적으로 DSAC\*를 능가합니다.
- **하드웨어**: 저가형 T4 GPU에서 ACE는 약 10%만 느려지는 반면, DSAC\* 매핑 시간은 약 30시간으로 두 배가 되어 — 매핑 비용과 에너지가 두 자릿수만큼 줄어듭니다.

## SLAM에서의 의미

ACE는 scene coordinate regression을 연구실의 흥미로운 소재에서 배포 가능한 relocalization 도구로 바꾸어 놓았습니다: 이미지나 포인트 클라우드를 저장하지 않는 컴팩트하고 암묵적이며 프라이버시에 유리한 장면 표현을, 포즈가 알려진 RGB만으로 현장에서 몇 분 만에 학습할 수 있게 되었습니다 — 이는 폰 규모의 visual odometry가 정확히 제공하는 것입니다. 이는 활발히 확장되고 있는 계보의 토대입니다 — ACE Zero는 알려진 포즈에 대한 필요성을 제거하고, ACE-G는 장면별 미세 조정 없이도 일반화를 목표로 하며, ACE-SLAM은 이 표현을 네트워크 가중치 자체가 맵이 되는 실시간 SLAM 루프로 확장합니다.

## 관련 문서

- [DSAC](dsac.md)
- [DSAC\*](dsac-star.md)
- [ACE Zero](ace-zero.md)
- [ACE-G](ace-g.md)
- [ACE-SLAM](ace-slam.md)
