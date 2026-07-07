# Photo-SLAM

> Huang 2024 · [논문](https://arxiv.org/abs/2311.16728)

**한 줄 요약** — "하이퍼 프리미티브(hyper primitives)" 지도가 명시적인 ORB 특징점 기하(팩터 그래프 지역화용)와 3DGS로 렌더링되는 학습된 광도 속성을 결합하여, Jetson AGX Orin에서도 동작하는 단안, 스테레오, RGB-D 카메라를 위한 실시간 포토리얼리스틱 SLAM을 제공합니다.

## 문제

신경 렌더링 SLAM은 유망한 결합 지역화와 포토리얼리스틱 재구성을 보여주었지만, "암시적 표현에 전적으로 의존하는 기존 방법들은 리소스를 너무 많이 소모하여 휴대용 기기에서 실행할 수 없으며, 이는 SLAM의 본래 취지에서 벗어난다"고 지적됩니다. NICE-SLAM/ESLAM 스타일의 시스템은 광선 샘플링 손실을 통해 포즈를 최적화하는데, 이는 느리고 수렴을 위해 깊이(또는 깊이 예측기)가 필요하며 사전에 정의된 바운딩 볼륨을 요구합니다. Photo-SLAM의 답은 역할 분담입니다: 지역화를 위한 명시적 기하 특징점과, 밀집 깊이에 의존하지 않는 외관을 위한 학습된 광도 특징점입니다.

## 방법 및 아키텍처

지역화, 기하 매핑, 포토리얼리스틱 매핑, 루프 클로저의 네 개의 병렬 스레드가 함께 **하이퍼 프리미티브 지도(hyper primitives map)**를 유지합니다: 각각 ORB 특징점 $\mathbf{O}\in\mathbb{R}^{256}$, 회전 $\mathbf{r}\in SO(3)$, 스케일링 $\mathbf{s}\in\mathbb{R}^{3}$, 밀도 $\sigma$, 구면 조화(spherical-harmonic) 계수 $\mathbf{SH}\in\mathbb{R}^{16}$를 갖는 포인트 클라우드 $\mathbf{P}\in\mathbb{R}^{3}$입니다. ORB 특징점은 2D-2D/2D-3D 대응을 담당하고, 광도 속성은 스플래팅 기반 렌더링을 담당합니다.

- **지역화(운동만의 BA)**: 매칭된 키포인트 $\mathbf{p}_i$와 지도점 $\mathbf{P}_i$의 재투영 오차에 대해 Levenberg-Marquardt를 사용하는 팩터 그래프로 풀립니다:

$$\{\mathbf{R},\mathbf{t}\}=\mathop{\arg\min}\limits_{\mathbf{R},\mathbf{t}}\sum_{i\in\mathcal{X}}\rho\left(\lVert\mathbf{p}_{i}-\pi(\mathbf{R}\mathbf{P}_{i}+\mathbf{t})\rVert^{2}_{\Sigma_{g}}\right),$$

  $\pi$는 투영, $\rho$는 Huber 비용, $\Sigma_g$는 키포인트의 스케일 공분산입니다. 기하 매핑은 공시야 키프레임과 포인트에 대한 지역 BA를 실행합니다 — 추적은 렌더링 수렴에 절대 의존하지 않습니다.
- **포토리얼리스틱 매핑**: 하이퍼 프리미티브는 타일 기반 렌더러(SH에서 파생된 색상의 3DGS 알파 블렌딩)로 래스터화되며, $\mathbf{P},\mathbf{r},\mathbf{s},\sigma,\mathbf{SH}$에 대해 광도 손실로 최적화됩니다

$$\mathcal{L}=(1-\lambda)\left|I_{\text{r}}-I_{\text{gt}}\right|_{1}+\lambda\left(1-\text{SSIM}(I_{\text{r}},I_{\text{gt}})\right), \qquad \lambda=0.2 .$$

- **기하 기반 밀집화(densification)**: 2D 특징점 중 약 30% 미만만이 삼각측량된 3D 포인트를 갖습니다; 비활성 포인트들은 질감이 복잡한 영역을 나타내므로, 그곳에 임시 하이퍼 프리미티브가 생성됩니다 — 센서로부터의 깊이(RGB-D), 가장 가까운 활성 특징점으로부터의 깊이(단안), 또는 스테레오 매칭으로부터의 깊이(스테레오) — 표준적인 그래디언트 기반 분할/복제에 더하여 사용됩니다.
- **가우시안 피라미드(GP) 학습**: 훈련 대상은 가장 거친 피라미드 레벨에서 전체 이미지로 점진적으로 진행됩니다, $t_{0}:\arg\min\mathcal{L}(I^{n}_{\text{r}},\text{GP}^{n}(I_{\text{gt}}))\;\dots\;t_{n}:\arg\min\mathcal{L}(I^{0}_{\text{r}},\text{GP}^{0}(I_{\text{gt}}))$ — 다중 레벨 특징점이 점진적으로 학습됩니다(기본값 3레벨). ablation 실험에서는 이 방법이 단안 입력에서 가장 중요함을 보여줍니다.
- **루프 클로저**는 유사 변환(similarity transform)으로 키프레임과 하이퍼 프리미티브를 보정하여 드리프트로 인한 고스팅(ghosting)을 제거합니다. 전체 시스템은 C++/CUDA로 작성되었습니다(ORB-SLAM3, 3DGS, LibTorch 기반).

## 실험 결과

데스크톱 = RTX 4090; 노트북(RTX 3080 Ti)과 Jetson AGX Orin에서도 변경 없이 실행됩니다:

- **Replica, 단안**: ATE RMSE 1.091 cm, PSNR 33.302 / SSIM 0.926 / LPIPS 0.078, 2분 이내에 911 FPS 렌더링 — Go-SLAM의 71.05 cm / 21.17 dB / 0.821 FPS 렌더링 대비. Jetson에서는 1.235 cm, 29.28 dB, 4 GB GPU 메모리로 95 FPS 렌더링입니다.
- **Replica, RGB-D**: 0.604 cm, PSNR 34.958, 2분 미만에 1084 FPS 렌더링 — Point-SLAM의 34.632 dB, 0.510 FPS 렌더링, 2시간 이상 대비 — 초록은 이전 온라인 시스템 대비 "PSNR이 30% 더 높고 렌더링 속도가 수백 배 더 빠르다"고 밝힙니다.
- **TUM, 단안**: fr1-desk / fr2-xyz / fr3-office에서 1.539 / 0.984 / 1.257 cm로, ORB-SLAM3와 동등한 수준이면서 Go-SLAM이 33~106 cm를 기록하는 곳에서 포토리얼리스틱 매핑을 추가로 제공합니다.
- **스테레오**: EuRoC MAV에서의 정량적 결과; 논문은 이를 "스테레오 카메라로 온라인 포토리얼리스틱 매핑을 지원하는 최초의 시스템"이라 부르며, ZED 2 야외 핸드헬드 장면에 대한 정성적 결과도 제시합니다.
- Ablation 실험은 기하 기반 밀집화가 충분한 프리미티브를 공급하고 GP 학습이 이를 철저히 최적화함을 확인시켜주며, 실시간 속도에서 PSNR을 향상시킵니다.

## SLAM에서의 의미

Photo-SLAM은 포토리얼리스틱 3DGS SLAM이 데스크톱 GPU뿐만 아니라 임베디드 로봇 플랫폼에서도 실시간으로 동작할 수 있음을 보여주었습니다. 견고성을 위한 고전적 특징점 기반 추적과 순수하게 외관을 위한 가우시안 스플래팅이라는 분리된 템플릿은 실용적인 가우시안 SLAM의 표준 아키텍처 중 하나가 되었습니다(그리고 GS-ICP SLAM이 "분리형" 대안으로서 비교 대상으로 삼는 설계입니다). 또한 성숙한 고전적 프론트엔드(ORB-SLAM3)와 현대적 지도 백엔드를 결합하면 정확도를 희생하지 않고도 효율성에서 종단간(end-to-end) 설계를 능가할 수 있음을 상기시켜줍니다.

## 관련 문서

- [SplaTAM](splatam.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
- [RTG-SLAM](rtg-slam.md)
- [MonoGS](monogs.md)
- [GS-ICP SLAM](gs-icp-slam.md)
