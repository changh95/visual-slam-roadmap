# NeRF-SLAM

> Rosinol 2023 · [논문](https://arxiv.org/abs/2210.13641)

**한 줄 요약** — 밀집 단안 SLAM 프론트엔드 (DROID-SLAM)와 Instant-NGP 복사장 (radiance-field) 백엔드를 결합하고, SLAM 깊이의 마지널 (marginal) 공분산으로 NeRF 깊이 손실을 가중하여 — 실시간으로 기하학적으로 및 광도적으로 정확한 밀집 단안 재구성을 달성합니다.

## 문제

최초의 신경 암시적 (neural-implicit) SLAM 시스템 (iMAP, NICE-SLAM)은 RGB-D 입력이 필요했으며, 광도 손실만으로 학습된 복사장은 "떠다니는 물체 (floater)"에 취약합니다 — 나쁜 초기화나 나쁜 지역 최소값에서 발생하는 유령 기하학인데, 깊이 감독을 추가하면 이를 제거하고 수렴 속도를 높입니다. 밀집 단안 SLAM은 그 깊이를 실시간으로 제공할 수 있지만, 그 깊이 지도는 "밀집도로 인해 매우 노이즈가 많으며, 질감이 없는 영역조차 깊이 값이 부여되기 때문에" 문제가 됩니다. NeRF-SLAM의 핵심 통찰: 밀집 단안 SLAM은 NeRF를 실시간으로 피팅하기에 정확히 필요한 정보 — 정확한 포즈와 *관련 불확실성이 함께 있는* 밀집 깊이 지도 — 를 제공하므로, 지도는 추정기가 신뢰하는 만큼만 각 깊이를 신뢰할 수 있습니다.

## 방법 및 아키텍처

두 스레드가 하나의 GPU(RTX 2080 Ti, 11 GB, PyTorch + CUDA)에서 병렬로 실행됩니다:

**추적: 공분산을 포함한 밀집 SLAM.** DROID-SLAM은 RAFT 스타일의 ConvGRU를 사용하여 프레임 쌍 간의 밀집 광학 플로우 $\mathbf{p}_{ij}$를 계산하며, 이 네트워크는 관측치별 가중치 $\mathbf{\Sigma}_{\mathbf{p}_{ij}}$도 함께 출력합니다. 그런 다음 기하학을 키프레임별 역깊이 지도로 파라미터화하여 밀집 번들 조정을 풉니다. 선형화하면 블록 희소 시스템을 얻습니다

$$H\mathbf{x}=\mathbf{b}, \quad \begin{bmatrix} C & E \\ E^{T} & P \end{bmatrix} \begin{bmatrix} \Delta\boldsymbol{\xi} \\ \Delta\mathbf{d} \end{bmatrix} = \begin{bmatrix} \mathbf{v} \\ \mathbf{w} \end{bmatrix},$$

여기서 $C$는 카메라 블록, $P$는 (대각) 역깊이 블록, $E$는 카메라/깊이 결합 항, $\Delta\boldsymbol{\xi}$는 $SE(3)$ 포즈 갱신, $\Delta\mathbf{d}$는 픽셀별 역깊이 갱신입니다. Schur complement는 축소된 카메라 행렬 $H_T$를 주며, 이는 Cholesky 분해 $H_T = LL^{T}$로 풀립니다. Rosinol et al.의 확률적 체적 융합 (WACV 2022)을 따라, 깊이와 포즈의 마지널 공분산은 같은 분해로부터 얻어집니다:

$$\mathbf{\Sigma}_{\mathbf{d}} = P^{-1} + P^{-T}E^{T}\mathbf{\Sigma}_{\mathbf{T}}EP^{-1}, \qquad \mathbf{\Sigma}_{\mathbf{T}} = (LL^{T})^{-1}.$$

**매핑: 확률적 체적 NeRF.** Instant-NGP 해시 그리드 복사장이 (슬라이딩 윈도우 없이) 모든 키프레임에서 매핑 손실로 학습되며, 포즈 $\mathbf{T}$와 네트워크 파라미터 $\Theta$ 양쪽에 대해 최소화됩니다:

$$\mathcal{L}_{M}(\mathbf{T},\Theta) = \mathcal{L}_{\text{rgb}}(\mathbf{T},\Theta) + \lambda_{D}\,\mathcal{L}_{\text{D}}(\mathbf{T},\Theta), \qquad \lambda_D = 1.0,$$

여기서 깊이 손실은 추적 공분산으로 마할라노비스 (Mahalanobis) 가중됩니다,

$$\mathcal{L}_{\text{D}}(\mathbf{T},\Theta) = \|D - D^{\star}(\mathbf{T},\Theta)\|^{2}_{\Sigma_{D}},$$

그리고 $\mathcal{L}_{\text{rgb}} = \|I - I^{\star}(\mathbf{T},\Theta)\|^{2}$입니다. 렌더링된 깊이는 표준 체적 렌더링 아래에서의 기대 광선 종료 거리입니다,

$$d^{\star} = \sum_{i}\mathcal{T}_{i}\bigl(1-\exp(-\sigma_{i}\delta_{i})\bigr)d_{i}, \qquad \mathcal{T}_{i} = \exp\Bigl(-\sum_{j<i}\sigma_{j}\delta_{j}\Bigr),$$

여기서 $\sigma_i$는 샘플 $i$에서의 밀도, $d_i$는 그 깊이, $\delta_i = d_{i+1} - d_i$이며, 색상 $\mathbf{c}_i$도 동일한 방식으로 합성됩니다.

**스레드 인터페이스.** 추적 스레드는 최대 8개의 키프레임으로 이루어진 활성 윈도우를 유지하며, 평균 광학 플로우가 2.5픽셀을 초과할 때마다 새로운 키프레임을 생성합니다. 새 키프레임이 생길 때마다 포즈, 이미지, 깊이 지도, 깊이 공분산을 매퍼로 전달하는데, 이것이 두 스레드 간의 유일한 통신입니다.

## 실험 결과

Replica (8개 장면, 깊이 L1 및 PSNR로 평가)에서:

- **본 논문 (단안, 자체 깊이 사용): 평균 4.49 cm 깊이 L1, 41.40 dB PSNR** — 실측 깊이를 사용한 NICE-SLAM (4.08 cm, 24.61 dB), 깊이 없는 NICE-SLAM (14.18 cm, 17.76 dB), 실측 깊이를 사용한 iMAP (7.64 cm, 6.95 dB), 동일한 추정 깊이에 대한 TSDF-Fusion (21.88 cm, 7.07 dB), $\sigma$-Fusion (20.10 cm, 7.08 dB)과 비교됩니다.
- NICE-SLAM 대비 최대 **179% 더 나은 PSNR** (office-1)과 **86% 더 나은 깊이 L1** (room-2); office-1이 가장 큰 결합 향상을 보입니다 (179% PSNR, 80% L1).
- 어블레이션 (Cube-Diorama): 가중치 없는 원시 깊이 감독은 공분산 가중 방식보다 120초 후 4 dB PSNR / 7 cm L1 더 나쁩니다. 포즈만 사용하면 500초 후 7.8 cm L1을 주고, 원시 깊이는 4.1 cm이지만 PSNR이 3 dB 나쁩니다 — 가중치 부여가 양쪽의 장점을 모두 얻습니다.
- 실행 시간: 640x480에서 파이프라인 12 fps (추적 약 15 fps, 매핑 약 10 fps), GPU 메모리 약 11 GB.

## SLAM에서의 의미

(Kimera로 유명한) Rosinol이 MIT의 Leonard, Carlone과 함께 발표한 NeRF-SLAM은 하이브리드 레시피를 구체화했습니다 — 포즈, 기하학, 불확실성을 위한 추정 이론 기반 SLAM, 지도를 위한 신경장 (neural field) — 이 둘이 경쟁 관계가 아니라 상호 보완적임을 보였습니다. 이는 "네트워크가 시스템 전체다"라는 iMAP의 순수주의적 입장에 대한 대응이며, 어쩌면 더 영향력 있는 청사진입니다: 오늘날 대부분의 실용적인 신경 및 가우시안 SLAM 시스템은 정확히 이런 방식으로 강건한 트래커와 미분 가능한 지도를 짝지으며, 이 논문의 불확실성 가중 깊이 감독은 노이즈가 많은 추정 기하학을 신경 표현에 융합하는 반복적인 기법이 되었습니다.

## 관련 문서

- [DROID-SLAM](droid-slam.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [GO-SLAM](go-slam.md)
- [NeRF](nerf.md)
