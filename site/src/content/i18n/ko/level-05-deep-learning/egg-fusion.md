# EGG-Fusion

> Pan 2025 · [논문](https://arxiv.org/abs/2512.01296)

**한 줄 요약** — SIGGRAPH Asia 2025에서 발표된 실시간 RGB-D 재구성 기법으로, 센서 노이즈를 명시적으로 모델링하는 정보 필터(information filter) 갱신을 통해 기하학 인식 가우시안 서펠(surfel)을 실시간으로 융합함으로써, 미분 가능 최적화가 이미 거의 수렴한 지도를 다듬는 역할만 하도록 만듭니다.

## 문제

미분 가능 렌더링 기반 SLAM(NeRF 및 3DGS 기반)은 포토리얼리스틱한 지도를 제공하지만, "현재의 미분 가능 렌더링 방법들은 실시간 연산과 센서 노이즈 민감성이라는 이중의 난제에 직면해 있으며, 이는 장면 재구성에서 기하학적 정확도 저하와 실용성 제한으로 이어집니다." 3DGS 타원체의 높은 자유도는 기하학적 모호성을 유발하고, 역전파를 통한 매핑은 프레임당 여러 번의 경사 반복을 필요로 하며, 노이즈가 많은 소비자용 깊이 센서 데이터를 실측값처럼 취급하면 복원된 표면이 왜곡됩니다. EGG-Fusion은 실시간 처리량과 노이즈 인식 고정밀 표면 기하학을 동시에 목표로 합니다.

## 방법 및 아키텍처

장면은 2D 가우시안 서펠 집합 $\mathcal{S}=\{S_{i}:(\textbf{p}_{i},\textbf{s}_{i},\textbf{r}_{i},o_{i},\textbf{c}_{i})\}$로 표현됩니다 — 중심, 두 개의 타원축 스케일, 회전, 불투명도, SH 색상을 가진 원반 모양의 프리미티브로, 깊이 정렬된 알파 합성으로 렌더링됩니다($T_{i}=\prod_{j<i}(1-\alpha_{j})$, $\hat{C}=\sum_{i}T_{i}\alpha_{i}\textbf{c}_{i}$이며, 깊이/노멀 맵도 유사하게 블렌딩됩니다). 프레임마다 두 개의 모듈이 실행됩니다: 희소-대-밀집(sparse-to-dense) 카메라 추적, 그리고 명시적 서펠 융합에 이어지는 짧은 미분 가능 최적화입니다.

- **기하학 인식 서펠 초기화**: 새로운 서펠은 저불투명도 영역과 양의 깊이-격차(positive depth-disparity) 영역(새로운 전경)에만 생성되며, 깊이 적응형 스케일 $\mathbf{s}=[\alpha_{s}\cdot d/f_{x},\,\alpha_{s}\cdot d/f_{y}]$($d$ = 깊이, $\alpha_s=2.0$)을 사용합니다. 이에 따라 먼 서펠은 더 크지만 영상 상의 투영 면적은 일정하게 유지되어, 동일한 서펠 개수로도 고정 스케일보다 더 좋은 렌더링을 얻습니다.
- **정보 필터를 이용한 서펠 융합**(핵심 기여): 각 서펠의 기하 상태 $\mathbf{x}^{t}=[\mathbf{p},\mathbf{n}]^{\top}\in\mathbb{R}^{6}$는 공분산 $\boldsymbol{\Sigma}^{t}$를 가지며, 재관측 $\mathbf{z}^{t}=[V_{t}(\mathbf{u}),N_{t}(\mathbf{u})]^{\top}$는 $\mathbf{z}^{t}=\mathbf{H}\mathbf{x}^{t}+\bar{\mathbf{t}}+\boldsymbol{\epsilon}$, $\boldsymbol{\epsilon}\sim\mathcal{N}(0,\boldsymbol{\Sigma}_{\mathbf{z}}^{t})$를 따릅니다. 여기서 $\mathbf{H}$는 카메라 회전을 담고 있으며, 노이즈 분산 $\sigma_p,\sigma_n$은 (센서 모델에 따라) 깊이의 제곱에 비례해 커집니다. 재귀적 베이지안 갱신은 정보 형태(information form)로 이루어집니다:

$$\boldsymbol{\Lambda}^{t}=\boldsymbol{\Lambda}^{t-1}+\mathbf{H}^{\top}\boldsymbol{\Lambda}^{t}_{\mathbf{z}}\mathbf{H},\qquad \boldsymbol{\eta}^{t}=\boldsymbol{\eta}^{t-1}+\mathbf{H}^{\top}\boldsymbol{\Lambda}^{t}_{\mathbf{z}}\mathbf{z}^{t},\qquad \hat{\mathbf{x}}^{t}=(\boldsymbol{\Lambda}^{t})^{-1}\boldsymbol{\eta}^{t},$$

  관측당 닫힌 형태(closed-form)의 단일 패스로 처리됩니다(대각 공분산이라 계산 비용이 저렴합니다). 갱신된 노멀은 서펠에 적용되는 $\mathbf{n}_{tg}=\mathbf{n}_{g}\times\mathbf{n}_{t}$를 축으로 하는 고유한 회전 증분 $\Delta\textbf{R}(\textbf{n}_{tg},\theta)$를 정의합니다. $\text{tr}(\boldsymbol{\Lambda})$는 신뢰할 수 있는 표면을 추출하기 위한 서펠별 신뢰도 역할도 겸합니다.
- **미분 가능 서펠 최적화**: 최근 $N_{\text{batch}}$개 프레임의 지역 지도가 $\mathcal{L}_{total}=\mathcal{L}_{c}+w_{d}\mathcal{L}_{d}+w_{n}\mathcal{L}_{n}+w_{reg}\cdot\mathcal{L}_{reg}$로 정제됩니다. 여기서 $\mathcal{L}_{c},\mathcal{L}_{d}$는 $L_1$ 색상/깊이 손실이고, $\mathcal{L}_{n}=|1-\gamma|$는 노멀 불일치에 대한 페널티이며, $\mathcal{L}_{reg}=|\textbf{p}-\textbf{p}_{f}|+w^{n}_{reg}\cdot|1-\textbf{n}\cdot\textbf{n}_{f}|$는 서펠을 필터로 융합된 기하 $\textbf{p}_f,\textbf{n}_f$에 고정시킵니다. 융합 단계에서 서펠이 이미 수렴에 가까운 상태로 남기 때문에, 매핑 단계당 약 9회의 반복만으로 충분합니다.
- **희소-대-밀집 추적**: LM을 통한 희소 2D-3D 재투영 오차 $\boldsymbol{\xi}_{t}^{(0)}=\arg\min\sum_{\mathcal{M}}\rho(|\mathbf{u}_{i}-\Pi(\exp(\boldsymbol{\xi}_{t})\cdot\textbf{X}_{i}^{w})|^{2})$로 초기 포즈를 구한 뒤, (전역 모델에 대한 점-대-평면 ICP와 광도 오차를 결합한) 밀집 결합 정렬 $E_{\text{dense}}=E_{\text{icp}}+\lambda_{\text{photo}}E_{\text{photo}}$로 정제되며, 퇴화된 정제 결과를 걸러내는 수렴 검사가 포함됩니다.

## 실험 결과

Replica, TUM-RGBD, ScanNet++, 그리고 자체 촬영한 3개의 Azure Kinect 실외 장면에서 평가했습니다.

- **표면 재구성(가우시안에서 샘플링한 점 기준)**: Replica에서 정확도 0.60 cm, ScanNet++에서 0.67 cm, 3 cm 이내 정확도 비율은 각각 99.99% / 99.98%입니다 — RTG-SLAM(0.80/1.06 cm), SplaTAM(2.87/1.71 cm)보다 우수합니다. 논문 초록의 표현대로 "최신 GS 기반 방법들에 비해 20% 이상의 정확도 향상"입니다.
- **추적**: Replica 평균 ATE 0.17 cm(RTG-SLAM 0.18, SplaTAM 0.39); TUM 평균 4.47 cm(온라인) — 실시간 미분 가능 시스템 중 최고 수준입니다(RTG-SLAM 5.12, SplaTAM 5.48). 전역 최적화를 포함한 오프라인 변형은 1.98 cm입니다.
- **렌더링(ScanNet++)**: novel-view PSNR 25.70 / SSIM 0.907로, RTG-SLAM(24.77/0.882), SplaTAM(24.75/0.900)보다 우수합니다. 학습 뷰(training-view) PSNR은 29.06입니다.
- **속도/메모리(Replica off0)**: 24.21 FPS이며 매핑에는 프레임당 0.071초(7.5 ms × 9회 반복), 메모리는 1.8 GB가 소요됩니다 — RTG-SLAM(15.73 FPS / 2.7 GB), SplaTAM(0.19 FPS / 9.1 GB)과 대비됩니다.
- **어블레이션**: 희소 초기화가 없으면 fr1/room과 fr3/office에서 밀집 추적이 완전히 실패합니다. 정보 필터 융합을 제거하면 ScanNet++의 점 정확도가 0.67에서 0.73 cm로 저하되고, 노이즈가 많고 먼 물체에서 눈에 띄게 표면이 더 시끄러워집니다.

## SLAM에서의 의미

대부분의 3DGS-SLAM 시스템(SplaTAM, MonoGS)은 렌더러를 통한 역전파로 지도를 최적화하며, 손실이 수렴할 때까지 반복합니다. EGG-Fusion은 다른 계보를 보여줍니다: 가우시안을 학습되는 파라미터가 아니라 *필터링되어야 할 상태*로 취급하는 것입니다 — 고전적인 서펠 SLAM(ElasticFusion)의 추정 이론적이고 신뢰도 가중된 융합 방식을 미분 가능하고 렌더링 가능한 표현으로 업그레이드한 것입니다. 닫힌 형태의 융합에 소수의 다듬기 반복을 더한 이 방식은, 조밀한 포토리얼리스틱 지도를 진정한 실시간 증분 연산과 양립 가능하게 하고, 배포 가능한 가우시안 지도 SLAM에 필수적인 프리미티브별 원리적 불확실성 추정도 제공합니다.

## 관련 문서

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
