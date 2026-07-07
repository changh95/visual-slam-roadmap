# InstantSfM

> Zhong 2025 · [논문](https://arxiv.org/abs/2510.13310)

**한 줄 요약** — 희소성을 인식하는 최적화를 갖춘, 완전히 GPU 기반이며 PyTorch와 호환되는 전역 SfM 파이프라인으로, 대규모 장면에서 COLMAP 대비 최대 약 40배의 속도 향상을 비슷한 정확도로 달성합니다.

## 문제

성숙한 SfM 시스템들은 여전히 CPU 중심이며 전통적인 최적화 도구체인(Ceres 스타일 솔버) 위에 구축되어 있어, "현대의 GPU 기반, 학습 주도 파이프라인과의 불일치가 커지고" 있으며 확장성을 제한합니다 — 대규모 컬렉션은 처리에 몇 시간에서 며칠이 걸릴 수 있습니다. GPU 가속 번들 조정은 병렬 희소 최적화의 가능성을 보여주었지만, 이를 *완전한* 전역 SfM 시스템으로 확장하는 것은 두 가지 미해결 문제에 막혀 있었습니다: 메트릭 스케일 복원과 수치적 강건성(이상치 필터링이 카메라/포인트를 불충분하게 제약된 상태로 남겨, Levenberg–Marquardt 솔버를 망가뜨리는 랭크 결핍(rank-deficient) 정규 방정식을 만들 수 있습니다). InstantSfM은 이 완전한 시스템을 구축합니다.

## 방법 및 아키텍처

InstantSfM은 (GLOMAP처럼) 전역 패러다임을 따릅니다: 회전 평균화(rotation averaging), 그 다음 **전역 위치 결정(global positioning, GP)**, 그 다음 **번들 조정(BA)** — 모든 단계가 희소 야코비안을 사용하는 GPU 상의 PyTorch로 구현됩니다. GP는 회전된 광선 방향 $\mathbf{v}_{ij}$로부터 포인트 $\mathbf{X}_j$, 카메라 중심 $\mathbf{t}_i$, 관측별 스케일 $s_{ij}$를 함께 추정합니다:

$$\boldsymbol{\theta}=\arg\min_{\mathbf{X},\mathbf{t},s}\sum_{i=1}^{C}\sum_{j=1}^{P}\rho\left(\|\mathbf{v}_{ij}-s_{ij}(\mathbf{X}_{j}-\mathbf{t}_{i})\|^{2}_{2}\right)$$

이어서 BA는 재투영 오차 $\mathbf{r}_{ij}=\Pi(\boldsymbol{\zeta}_{i},\mathbf{X}_{j},\mathbf{K}_{i})-\mathbf{x}_{ij}$를 최소화하여 포즈 $\boldsymbol{\zeta}_i$, 내부 파라미터 $\mathbf{K}_i$, 포인트를 정제합니다. 둘 다 LM 스텝 $(\mathbf{J}^{\top}\mathbf{J}+\lambda\operatorname{diag}(\mathbf{J}^{\top}\mathbf{J}))\Delta\boldsymbol{\theta}=-\mathbf{J}^{\top}\mathbf{r}$으로 풀리며, BA 야코비안 $\mathbf{J}\in\mathbb{R}^{2CP\times(7C+3P)}$은 블록 희소 형태로 저장되고 처리됩니다. 두 가지 기여가 이를 완전한 시스템으로 만듭니다:

- **깊이 제약 야코비안 구조.** GP 스케일 $s_{ij}$는 카메라 $i$에서 본 $\mathbf{X}_j$의 역깊이와 정확히 같습니다. 메트릭 깊이 $\hat{d}_{ij}$가 존재하는 곳(RGB-D 또는 단안 깊이 모델)에서는 $s_{ij}=1/\hat{d}_{ij}$로 고정되어 야코비안에서 해당 열이 제거됩니다. $\partial\mathbf{u}_{ij}/\partial\mathbf{t}_{i}=s_{ij}\mathbf{I}$이므로, 고정된 관측치는 공유된 카메라 중심에 메트릭 스케일의 그래디언트를 부과하며, $\mathbf{J}^{\top}\mathbf{J}$가 이를 자유로운 스케일들과 결합합니다 — 메트릭 스케일은 사후 정렬이 아니라 솔버 *내부에서* 장면 전체로 전파됩니다. BA에서는 추가적인 역깊이 잔차가 더해집니다:

$$\mathbf{r}^{d}_{ij}=\frac{1}{\text{Depth}(\boldsymbol{\zeta}_{i},\mathbf{X}_{j},\mathbf{K}_{i})}-\frac{1}{\hat{d}_{ij}},\qquad \boldsymbol{\theta}=\arg\min\sum_{i,j}\rho\left(\mathbf{r}_{ij}+\lambda_{d}\mathbf{r}^{d}_{ij}\right)$$

  유효하지 않은 깊이 픽셀(하늘, 반사광)은 기준값을 $\tilde{d}^{-1}_{ij}=m_{ij}\cdot\hat{d}_{ij}^{-1}$로 설정하는 이진 마스크 $m_{ij}$로 처리되어, 이 항을 하나의 균일한 GPU 연산 안에서 재투영 전용으로 붕괴시킵니다 — 관측별로 스레드가 분기되는 일이 없습니다.
- **동적 파라미터 추출을 통한 강건한 이상치 제거.** 매 LM 반복마다 관측치는 기하학적 유효성($\mathcal{O}_{\text{valid}}=\{(i_{c},i_{p})\mid z_{i_{c},i_{p}}>0.1\}$, 절두체 내부 여부)에 대해 다시 검사되며, 적어도 하나의 유효한 관측치를 가진 카메라/포인트만(GPU `torch.unique`와 인덱스 재매핑을 통해) 축소된 파라미터 벡터 $\hat{\mathbf{x}}$로 압축됩니다. 이 구성상 $\hat{\mathbf{J}}$는 모두 0인 열을 갖지 않으므로, 많은 포인트가 일시적으로 무효화되어도 정규 방정식은 (게이지까지) 완전 랭크를 유지합니다. 갱신은 전처리된 conjugate gradient로 계산되어 다시 흩뿌려집니다(scatter). 포인트는 기하학이 변함에 따라 유효/무효 사이를 오갈 수 있습니다 — 잔차의 가중치만 낮추는 일회성 전처리 필터나 강건 커널과는 다릅니다.

## 실험 결과

- **실행 시간**: 100~5,000개 이미지 규모의 장면(MipNeRF360 + 다운샘플링된 1DSfM)에서 COLMAP 대비 1.5배~40배, GLOMAP 대비 최대 12배의 속도 향상. GPU 가속 Ceres를 사용한 COLMAP/GLOMAP 대비에서도: Alamo 597초 대 12,855초(COLMAP)와 1,600초(GLOMAP); Union_Square 571초 대 4,697/966초.
- **MipNeRF360(novel-view-synthesis 지표)**: COLMAP, GLOMAP, VGGSfM 중 전반적으로 최고 성능; 특히 GLOMAP이 `kitchen`에서 겪는 치명적 실패를 피합니다(PSNR 27.79 대 16.11).
- **ScanNet**: COLMAP과 GLOMAP은 대부분의 장면에서 실패합니다(뷰 그래프 캘리브레이션에서의 Ceres 발산, 불완전한 복원). InstantSfM은 모든 장면에서 성공하며 깊이 사전 정보로 더욱 개선됩니다. **ScanNet++**에서는 평균 Chamfer distance 2.61을 달성(GLOMAP의 3.80 대비).
- DTU(구조광 그라운드 트루스)에서도 평가됨. 코드: [github.com/cre185/InstantSfM](https://github.com/cre185/InstantSfM).

## SLAM에서의 의미

오프라인 SfM은 SLAM 연구를 뒷받침하는 핵심 도구입니다: 가짜 그라운드 트루스 궤적, 캘리브레이션, 그리고 NeRF/3DGS와 학습 기반 SLAM 시스템 학습에 사용되는 포즈가 부여된 이미지를 만들어냅니다 — 이를 한 자릿수 이상 빠르게 만드는 것은 그 생태계 전체의 반복 루프를 단축시킵니다. InstantSfM은 (GLOMAP의 전역 형식화를 따라) COLMAP이 표준화한 느린 순차적 CPU 파이프라인에서 벗어나는 흐름을 이어가며, 야코비안 안에 깊이 사전 정보를 넣는 트릭은 학습된 사전 정보를 고전적 추정을 대체하는 대신 융합하는 깔끔한 예시입니다. 매 반복마다 문제를 재구성해 정규 방정식을 완전 랭크로 유지하는 동적 파라미터 추출 아이디어는 GPU 상에 상주하는 어떤 SLAM 백엔드에도 널리 유용합니다.

## 관련 문서

- [COLMAP](colmap.md)
- [GLOMAP](glomap.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [VGGT](vggt.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Depth Anything](../level-05-deep-learning/depth-anything.md)
