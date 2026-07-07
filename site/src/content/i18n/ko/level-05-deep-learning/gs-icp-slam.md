# GS-ICP SLAM

> Ha 2024 · [논문](https://arxiv.org/abs/2403.12550)

**한 줄 요약** — "RGBD GS-ICP SLAM"은 Generalized ICP 추적과 3DGS 매핑을 공통 요소인 가우시안(평균 + 공분산)을 통해 융합하여, 공분산이 추적과 매핑 사이를 양방향으로 흐르게 함으로써 전체 시스템에서 최대 107 FPS에 도달합니다.

## 문제

초기 3DGS SLAM 시스템(SplaTAM, MonoGS, GS-SLAM)은 가우시안 지도를 렌더링하고 밀집 광도 오차를 최소화하여 카메라를 추적합니다 — 프레임당 수십 번의 래스터화 패스가 필요하여 추적이 느립니다. 반면 분리형 시스템(Photo-SLAM, Orbeez-SLAM, vMAP)은 신경 지도에 ORB-SLAM 프론트엔드를 덧붙이는 방식으로, "추적을 위한 ORB 특징 정보를 담은 별도의 지도"가 필요하며 그 연산 결과는 매핑에 재사용되지 않습니다. GS-ICP SLAM의 관찰은 다음과 같습니다: 3D 가우시안은 이미 확률 분포 *그 자체*이며, G-ICP 정합은 정확히 평균과 공분산만 필요로 합니다 — 따라서 "G-ICP와 3DGS는 동일한 가우시안 세계를 공유할 수 있습니다."

## 방법 및 아키텍처

장면은 하나의 가우시안 집합 $\boldsymbol{G}=\{\boldsymbol{\mathcal{X}},\boldsymbol{\mathcal{C}}\}$(3D 포인트와 공분산, 렌더링을 위한 색상과 불투명도 집합 $\boldsymbol{H},\boldsymbol{O}$ 포함)로 표현됩니다. 프레임마다: 깊이 영상을 다운샘플링하고 역투영하여 소스 가우시안을 만들고, 지도에 대해 G-ICP로 추적하며, (키프레임의 경우) 소스 가우시안을 새로운 지도 프리미티브로 삽입하는 동시에 병렬 매핑 스레드가 래스터화를 통해 이들을 최적화합니다.

- **G-ICP 추적**: 최근접 이웃 탐색으로 얻은 대응점 $\boldsymbol{x}^s_i \leftrightarrow \boldsymbol{x}^t_i$와 잔차 $d_i=\boldsymbol{x}^t_i-\mathbf{T}\boldsymbol{x}^s_i$에서, 각 포인트는 가우시안 확률 변수이므로 $d_i\sim\mathcal{N}(0,\,C^t_i+\mathbf{T}C^s_i\mathbf{T}^\top)$이고, 최대우도추정은 분포-대-분포(마할라노비스) 목적함수를 제공합니다

$$\mathbf{T}^{*}=\operatorname*{argmin}_{\mathbf{T}}\sum_i^N d_i^{\top}\left(C_i^{t}+\mathbf{T}C_i^{s}\mathbf{T}^{\top}\right)^{-1}d_i ,$$

  즉 두 분포의 결합 불확실성으로 가중된 정합입니다. 추적을 위해 영상이 렌더링되는 일은 전혀 없습니다.
- **공분산 공유**: G-ICP 도중 현재 프레임에 대해 계산된 공분산은 새로 삽입되는 지도 가우시안의 초기 공분산이 되고, 지도의 최적화된 가우시안은 그대로 G-ICP 타겟으로 사용됩니다 — 재계산도, densification이나 불투명도 재설정도 필요 없습니다.
- **타원 스케일 정규화(추적)**: SVD로 $C=\boldsymbol{R}\boldsymbol{\Lambda}^{2}\boldsymbol{R}^{\top}$을 분해할 때, 평면으로 강제하는 기존 방식 $\boldsymbol{S}=[1,1,\epsilon]^{\top}$ 대신 스케일을 $\boldsymbol{\Lambda}'=\frac{1}{median(\boldsymbol{S})}\,diag(s_2,s_1,s_0)$로 정규화하여, 모든 것을 평면으로 눌러버리는 대신 각 지도 가우시안의 최적화된 형태(선, 코너)를 보존합니다.
- **스케일 정렬(매핑)**: 센서 포인트 클라우드는 거리에 따라 희소해지므로 카메라에서 먼 곳의 kNN 공분산은 지나치게 커집니다. 새 키프레임 가우시안은 삽입 전에 $\boldsymbol{\Lambda}''=\frac{1}{z^{p}}\boldsymbol{\Lambda}'$($p=1.5$에서 최선)로 정규화됩니다.
- **매핑 손실**: 가우시안의 위치, 공분산, 색상, 불투명도는 $\lambda_{I_1}\mathcal{L}_1(I,I_{gt})+\lambda_{I_2}\mathcal{L}_{D\text{-}SSIM}(I,I_{gt})+\lambda_{D}\mathcal{L}_1(D,D_{gt})$로 최적화되며, 시점 국소 최소값을 피하기 위해 반복마다 과거 키프레임 하나를 무작위로 샘플링하고, 퇴화된 가우시안을 가지치기(pruning)합니다.
- **2단계 키프레임**: 추적 키프레임은 G-ICP 대응점의 비율(추적의 부산물로 자유롭게 얻어짐)로 선택되며, 추가적인 *매핑 전용* 키프레임은 스캔 매칭 오차를 추적에 피드백하지 않으면서 학습 뷰를 조밀하게 만듭니다.

## 실험 결과

Ryzen 7 7800X3D + RTX 4090, RGB-D 입력 기준:

- **Replica ATE RMSE**: 8개 장면 평균 0.16 cm — 모든 장면에서 최고, 이전 최고 기록(SplaTAM 0.36, GS-SLAM 0.50, Point-SLAM 0.54 cm)의 절반 미만.
- **Replica 지도 품질/속도**: 추적을 30 FPS로 제한했을 때 PSNR 38.83 dB / SSIM 0.975 / LPIPS 0.041(모든 장면에서 SOTA; SplaTAM 33.89, Point-SLAM 35.62 dB). 속도 제한이 없으면 전체 시스템 평균 98.11 FPS, 최고 107.06 FPS(office1)이면서도 35.93 dB를 유지 — SplaTAM의 0.23 FPS, Point-SLAM의 0.30 FPS 대비.
- **TUM RGB-D**: ATE 평균 2.4 cm로, 결합형 시스템 중 최고(SplaTAM 3.2, GS-SLAM 3.7, NICE-SLAM 4.0). 분리형 ORB-SLAM3/Photo-SLAM은 1.3 cm에 도달하지만 별도의 특징 지도가 필요합니다. 무제한 상태로 73.92 FPS로 동작하며 PSNR은 SplaTAM보다 약 11.7% 낮음 — 속도는 약 92배(30 FPS 모드) ~ 227배.
- **Ablation**: TUM에서 타원 vs. 평면 vs. 스케일 정규화 없음 비교: ATE 2.37 vs. 29.12 vs. 236.54 cm; $z^{1.5}$ 스케일 정렬과 함께 G-ICP 공분산을 사용하면 Replica가 8.89 cm ATE / 24.81 dB(단순 kNN 초기화)에서 0.157 cm / 38.83 dB로 향상됩니다.

## SLAM에서의 의미

GS-ICP SLAM은 고전적인 기하학적 정합과 현대적인 미분 가능 렌더링이 단일 데이터 구조를 공유할 수 있음을 보여줍니다: 기하로 추적하고 외관으로 매핑하며, 하나의 확률적 가우시안 세계가 둘 다에 쓰입니다. 개념적으로 이는 3DGS 흐름을 수십 년에 걸친 ICP 기반 RGB-D SLAM(KinectFusion 계열)과 다시 연결하며, 추적이 렌더링을 전혀 하지 않기 때문에 광도 기반 트래커를 괴롭히는 노출 변화에 본질적으로 강건합니다. 실무자들에게 이는 밀집 사실적 SLAM이 느릴 필요가 없다는 것을 보여주는 대표적인 사례로 남아 있습니다.

## 관련 문서

- [SplaTAM](splatam.md)
- [MonoGS](monogs.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [RTG-SLAM](rtg-slam.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
