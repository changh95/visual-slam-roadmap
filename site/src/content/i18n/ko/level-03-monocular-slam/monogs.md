# MonoGS

> Matsuki 2024 · [논문](https://arxiv.org/abs/2312.06741)

**한 줄 요약** — "Gaussian Splatting SLAM"(CVPR 2024 하이라이트): 단안 SLAM에 3D Gaussian Splatting을 처음 적용한 연구로, 가우시안을 유일한 3D 표현으로 사용하고 래스터화된 맵에 대한 직접 최적화로 카메라를 추적하며, 3fps로 실시간 동작한다.

## 문제

3D Gaussian Splatting은 빠른 미분 가능 래스터화로 사실적인 맵을 생성하지만, 원본 3DGS 알고리즘은 "오프라인 Structure from Motion(SfM) 시스템으로부터 정확한 포즈를 필요로 한다" — 포즈가 주어진 배치 방법이다. SLAM *내부에서* 이를 사용한다는 것은 정반대를 의미한다: 라이브 카메라로부터 가우시안을 점진적으로 구축하는 동시에 그 가우시안으로부터 포즈를 추정하는 것이며, 이는 "시각 SLAM에서 가장 근본적이면서도 가장 어려운 설정" — 단일 단안 RGB 스트림에서 이루어진다. 이 설정에서는 래스터화가 시선 방향을 따라 아무런 제약도 부과하지 않으며, 새로 삽입된 가우시안은 여러 시점이 제약을 걸기 전까지 기하학적으로 모호하다.

## 방법 및 아키텍처

맵은 비등방성 가우시안 집합 $\mathcal{G}$이며, 각각은 색상 $c^i$, 불투명도 $\alpha^i$, 월드 좌표 평균 $\boldsymbol{\mu}_W^i$와 공분산 $\boldsymbol{\Sigma}_W^i$를 가진다(구면 조화 함수는 생략). 픽셀 색상은 깊이 순으로 정렬된 $\mathcal{N}$개의 가우시안을 스플래팅하고 알파 블렌딩하여 합성된다.

$$\mathcal{C}_p=\sum_{i\in\mathcal{N}}c_i\alpha_i\prod_{j=1}^{i-1}(1-\alpha_j), \qquad \mathcal{D}_p=\sum_{i\in\mathcal{N}}z_i\alpha_i\prod_{j=1}^{i-1}(1-\alpha_j),$$

여기서 $z_i$는 레이를 따라 가우시안 $i$까지의 거리이다(깊이도 동일한 방식으로 래스터화된다). 이미지로의 투영은 $\boldsymbol{\mu}_I=\pi(\boldsymbol{T}_{CW}\cdot\boldsymbol{\mu}_W)$, $\boldsymbol{\Sigma}_I=\mathbf{J}\mathbf{W}\boldsymbol{\Sigma}_W\mathbf{W}^\top\mathbf{J}^\top$이며, $\boldsymbol{T}_{CW}\in SE(3)$는 카메라 포즈, $\mathbf{J}$는 선형화된 투영의 야코비안, $\mathbf{W}$는 $\boldsymbol{T}_{CW}$의 회전 부분이다.

- **리 그룹 위에서의 해석적 카메라 야코비안** (논문의 핵심 도출): 추적은 프레임당 약 50–100회의 경사 하강 반복이 필요하므로, 오토디프 대신 $\boldsymbol{\mu}_I$와 $\boldsymbol{\Sigma}_I$의 $\boldsymbol{T}_{CW}$에 대한 도함수를 매니폴드 도함수 $\frac{\mathcal{D}f(\boldsymbol{T})}{\mathcal{D}\boldsymbol{T}}\triangleq\lim_{\tau\to 0}\frac{\mathrm{Log}(f(\mathrm{Exp}(\tau)\circ\boldsymbol{T})\circ f(\boldsymbol{T})^{-1})}{\tau}$를 이용해 닫힌 형태로 도출하여, 다음과 같은 최소 야코비안을 얻는다.

$$\frac{\mathcal{D}\boldsymbol{\mu}_C}{\mathcal{D}\boldsymbol{T}_{CW}}=\begin{bmatrix}\boldsymbol{I} & -\boldsymbol{\mu}_C^{\times}\end{bmatrix},$$

  여기서 $\boldsymbol{\mu}_C^{\times}$는 카메라 좌표에서 가우시안 중심의 반대칭 행렬이다. 이들은 CUDA 래스터라이저에 그대로 삽입된다.
- **추적**: 현재 포즈만 최적화하며, 광도 잔차 $E_{pho}=\lVert I(\mathcal{G},\boldsymbol{T}_{CW})-\bar{I}\rVert_1$을 최소화한다(노출을 위한 아핀 밝기 파라미터 포함); 깊이를 사용할 수 있으면 기하 잔차 $E_{geo}=\lVert D(\mathcal{G},\boldsymbol{T}_{CW})-\bar{D}\rVert_1$이 $\lambda_{pho}E_{pho}+(1-\lambda_{pho})E_{geo}$, $\lambda_{pho}=0.9$로 추가된다.
- **가우시안 공가시성을 통한 키프레임 선정**: 윈도우 $\mathcal{W}_k$ (8–10 키프레임)는 두 프레임에서 보이는 가우시안들의 교집합/합집합 비율을 이용해 관리된다; 공가시성이 떨어지거나 이동량이 중앙 깊이의 일정 비율을 넘으면 프레임이 키프레임이 된다. 가우시안이 레이를 따라 정렬되어 있으므로 가림은 설계상 처리된다.
- **삽입 및 가지치기**: 새 가우시안은 관측된 깊이(RGB-D)로 초기화되거나 렌더링/중앙값 깊이 주변에 분산을 두고 샘플링된다(단안); 최근 3개 키프레임에서 삽입되었지만 다른 프레임 3개 이상에서 관측되지 않은 가우시안은 기하학적으로 불안정한 것으로 간주해 가지치기된다.
- **등방성 정규화를 포함한 매핑**: 래스터화는 시선 방향을 따라 가우시안을 제약하지 않으므로, 매핑은 길쭉한 스케일에 페널티를 주는 $E_{iso}=\sum_{i=1}^{|\mathcal{G}|}\lVert\mathbf{s}_i-\tilde{\mathbf{s}_i}\cdot\mathbf{1}\rVert_1$을 추가하고, 윈도우 키프레임 포즈와 가우시안을 공동 최적화한다: $\min\sum_{k\in\mathcal{W}}E^k_{pho}+\lambda_{iso}E_{iso}$, $\lambda_{iso}=10$이며, 잊혀짐을 방지하기 위해 반복마다 무작위로 선택된 과거 키프레임 2개를 함께 사용한다.

## 실험 결과

RTX 4090을 갖춘 데스크톱에서(다중 프로세스 구현, 단안 3fps로 실시간 동작):

- **TUM RGB-D, 단안 ATE RMSE (cm)**: fr1/desk, fr2/xyz, fr3/office에서 각각 3.78 / 4.60 / 3.50 (평균 3.96), DROID-VO(7.73), DepthCov-VO(25.2), DSO(11.0)를 어떤 딥러닝 사전 정보 없이도 능가하며, 루프 클로징 시스템(ORB-SLAM2: 1.60)에 근접한다.
- **TUM RGB-D 모드**: 평균 1.47cm — 렌더링 기반 방법 중 최고(ESLAM 2.00, Point-SLAM 3.04)이며 루프 클로저를 갖춘 BAD-SLAM(1.50)보다도 우수하다.
- **Replica RGB-D ATE**: 평균 0.58cm(단일 프로세스 0.32cm, 8개 시퀀스 중 6개에서 Point-SLAM의 0.53보다 우수).
- **Replica 렌더링**: PSNR 38.94dB, SSIM 0.968, LPIPS 0.070, 렌더링 769FPS — 깊이 안내 레이 샘플링이 필요한 Point-SLAM의 35.17dB, 1.33FPS 대비 우수하다.
- **메모리**: TUM에서 맵 2.6MB(단안) / 3.97MB(RGB-D) 대 NICE-SLAM의 40MB.
- **수렴 범위**: 이동된 시작점에서의 포즈 최적화가 시도의 79–82%에서 수렴하는 반면 해시 그리드 SDF는 14%, MLP SDF는 33% — 가우시안은 3D에서 매끄러운 기울기 장을 형성하는데, 이는 해싱/위치 인코딩과 다른 점이다.
- 에블레이션: $E_{iso}$를 제거하면 단안 ATE가 3.96에서 4.83으로 악화된다; 키프레임 선택을 제거하면 8.73까지 악화된다. 정성적으로는 깊이 센서가 놓치는 얇은 전선과 투명한 물체까지 재구성한다.

## SLAM에서의 의미

MonoGS는 가우시안 스플래팅 SLAM의 정통적인 *단안* 진입점이다: 렌더링 품질의 맵과 카메라 추적이 하나의 미분 가능한 표현을 대화형 속도로 공유할 수 있음을 보였다. 그 해석적 야코비안, 직접 정합 방식은 스플래팅 SLAM을 직접법(DTAM, LSD-SLAM, DSO)으로 다시 연결한다 — 같은 광도 원리를 훨씬 풍부한 맵에 적용한 것이며, 공가시성 기반 키프레임 선정은 DSO의 윈도우 관리를 반영한다. 이 연구는 MonoSLAM과 iMAP과 같은 임페리얼 칼리지 연구실 출신이며, 이 두 연구 역시 각자의 시대에 맵 표현을 재정의한 바 있다.

## 실습

- [Gaussian Splatting SLAM 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/gaussian_splatting_slam)

## 관련 문서

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [Photo-SLAM](photo-slam.md)
- [DTAM](dtam.md)
- [DSO](dso.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
