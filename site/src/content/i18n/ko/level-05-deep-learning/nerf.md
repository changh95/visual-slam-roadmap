# NeRF

> Mildenhall 2020 · [논문](https://arxiv.org/abs/2003.08934)

**한 줄 요약** — 장면을 MLP 내의 연속 함수 — 3D 위치와 시선 방향을 색상과 밀도로 매핑 — 로 표현하고 미분 가능한 볼륨 렌더링으로 렌더링하여, 포즈가 알려진 이미지들로부터 포토리얼리스틱한 새로운 뷰를 생성한다.

## 문제

새로운 뷰 합성(novel view synthesis) — 한 번도 촬영되지 않은 시점에서 복잡한 장면을 렌더링하는 것 — 은 오랫동안 명시적 표현(메시, voxel grid, multi-plane image)으로 다루어져 왔는데, 이들은 장면을 이산화하거나, 시간/공간 확장성이 나빠 달성 가능한 해상도를 제한하거나, 복잡한 기하와 시점 의존적 외관에서 실패한다. NeRF는 장면을 대신 *연속적인* 볼륨 함수로 저장하고, 미분 가능한 렌더러를 통한 광도 지도(supervision)만으로 희소한 입력 뷰 집합에서 직접 최적화할 수 있는지를 묻는다.

## 방법 및 아키텍처

**표현.** 단일 완전연결(비합성곱) MLP $F_{\Theta}: (\mathbf{x}, \mathbf{d}) \to (\mathbf{c}, \sigma)$가 5D 좌표 — 위치 $(x,y,z)$와 시선 방향 — 를 볼륨 밀도 $\sigma$와 시점 의존적 RGB radiance $\mathbf{c}$로 매핑한다. 아키텍처상으로는 8개의 완전연결 층(256채널, ReLU)이 $\gamma(\mathbf{x})$를 처리하여 $\sigma$와 256차원 특징을 출력하고, 이 특징을 $\gamma(\mathbf{d})$와 결합하여 128채널 층 하나를 통과시켜 RGB를 얻는다. $\sigma$를 위치만으로부터 예측하는 것은 다중 뷰 간에 일관된 기하를 강제한다.

**미분 가능 볼륨 렌더링.** 카메라 광선 $\mathbf{r}(t) = \mathbf{o} + t\mathbf{d}$의 색상은 고전적인 볼륨 렌더링 적분이다,

$$C(\mathbf{r}) = \int_{t_n}^{t_f} T(t)\,\sigma(\mathbf{r}(t))\,\mathbf{c}(\mathbf{r}(t), \mathbf{d})\,dt, \qquad T(t) = \exp\Big(-\int_{t_n}^{t} \sigma(\mathbf{r}(s))\,ds\Big),$$

이는 층화 샘플(stratified sample) $t_i$에 대한 quadrature로 추정된다(각 구간마다 하나씩 균등하게 샘플링하여, MLP가 연속적인 위치에서 질의된다):

$$\hat{C}(\mathbf{r}) = \sum_{i=1}^{N} T_i\,\big(1 - e^{-\sigma_i \delta_i}\big)\,\mathbf{c}_i, \qquad T_i = \exp\Big(-\sum_{j=1}^{i-1} \sigma_j \delta_j\Big), \quad \delta_i = t_{i+1} - t_i .$$

**위치 인코딩.** 원본 $xyz\theta\phi$ 입력은 MLP가 고주파 성분을 매끈하게 만들어 버리므로, 각 좌표를 $\gamma(p) = \big(\sin(2^0 \pi p), \cos(2^0 \pi p), \ldots, \sin(2^{L-1}\pi p), \cos(2^{L-1}\pi p)\big)$로 끌어올린다($\mathbf{x}$에는 $L{=}10$, $\mathbf{d}$에는 $L{=}4$) — 작지만 필수적으로 밝혀진 트릭이다.

**계층적 샘플링.** 거친(coarse) 네트워크와 세밀한(fine) 네트워크를 함께 최적화한다: 거친 네트워크의 합성 가중치 $w_i = T_i(1 - e^{-\sigma_i\delta_i})$를 정규화하여 구간별 상수 PDF로 만들고, 이를 통해 표면 근처에 추가 점 $N_f$개를 역변환 샘플링으로 배치한다($N_c{=}64$, $N_f{=}128$).

**학습.** 손실은 렌더링된 픽셀 색상과 실제 픽셀 색상 사이의 총 제곱 오차이며 coarse와 fine 렌더 모두에 대해 계산되고, 4096개의 광선으로 이루어진 배치 단위로 학습한다; Adam을 사용해 학습률 $5\times 10^{-4}$에서 $5\times 10^{-5}$로 감쇠시키며, 장면당 10만~30만 반복(V100에서 약 1~2일)이 필요하다. 실제 장면의 카메라 포즈는 COLMAP에서 얻는다.

## 실험 결과

- 표 1(PSNR/SSIM/LPIPS): Realistic Synthetic 360°에서 NeRF는 31.01 / 0.947 / 0.081을 기록했다(LLFF 24.88, NV 26.05, SRN 22.26 대비); Real Forward-Facing에서는 26.50 / 0.811 / 0.250(LLFF 24.13 / 0.798 / 0.212 — LLFF는 해당 LPIPS 지표에서만 근소하게 우수); Diffuse Synthetic 360°에서는 40.15(LLFF 34.38 대비).
- Ablation(Realistic Synthetic): 위치 인코딩을 제거하면 PSNR이 28.77로, 시점 의존성을 제거하면 27.66으로 떨어지며, 둘 다 제거하고 계층 구조도 없는 최소 모델은 26.67에 도달한다; 입력 이미지가 25장뿐일 때도 NeRF는 100장을 사용한 NV, SRN, LLFF를 여전히 능가한다.
- 저장/시간 트레이드오프: 장면당 네트워크 가중치 5MB 대 LLFF 장면 하나당 15GB 이상(약 3000배의 상대적 압축)이며, 그 대가로 장면당 12시간 이상의 학습이 필요하다.

## SLAM에서의 의미

NeRF는 신경 암묵적 SLAM 전체 흐름의 기초가 되는 연구이다: iMAP, NICE-SLAM, Co-SLAM, NeRF-SLAM 모두 온라인으로 최적화되는 radiance-field 스타일의 맵 표현을 사용하며, 미분 가능한 렌더링 손실은 동시에 추적 목적함수로도 쓰인다(렌더러를 역으로 풀어 카메라 포즈를 얻는다). 3D Gaussian Splatting이 실시간 렌더링 자리에서 NeRF를 대체한 이후에도, 핵심 아이디어들 — 최적화 가능한 필드로서의 장면, 미분 가능한 렌더러를 통한 광도 지도, 위치 인코딩 스타일의 입력 승격 — 은 현대 신경 밀집 매핑의 개념적 기반으로 남아 있다.

## 관련 문서

- [iMAP](imap.md) — 최초의 NeRF 스타일 SLAM 시스템
- [NICE-SLAM](nice-slam.md) — 계층적 특징 그리드 후속 연구
- [NeRF-SLAM](nerf-slam.md) — DROID-SLAM 추적과 결합된 radiance field
- [BARF](barf.md) — 포즈와 NeRF의 공동 최적화
- [Co-SLAM](co-slam.md) — 실시간 신경 SLAM을 위한 좌표/파라메트릭 인코딩 결합
