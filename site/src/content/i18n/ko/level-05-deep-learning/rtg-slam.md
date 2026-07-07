# RTG-SLAM

> Peng 2024 · [논문](https://arxiv.org/abs/2404.19706)

**한 줄 요약** — 실시간 가우시안 SLAM(SIGGRAPH 2024)으로, 컴팩트한 이진 불투명도 가우시안 표현, 서펠 방식의 깊이 렌더링, 불안정한 가우시안만 최적화하고 그 픽셀만 렌더링하는 즉석 방식을 통해 3DGS 재구성을 대규모 장면으로 확장한다.

## 문제

초기 3DGS SLAM 시스템은 매 프레임 모든 가우시안을 최적화하고 모든 픽셀을 렌더링했기 때문에 비용이 지도 크기에 비례해 증가했다 — 당시 가장 빠른 동시대 가우시안 SLAM도 합성 데이터셋 Replica에서 8.34 fps에 그쳤고, 완전한 실제 대규모 장면을 보여준 사례는 없었다. 또한 기본 3DGS는 표면을 여러 개의 겹치는 반투명 가우시안으로 맞추기 때문에 메모리와 연산이 낭비된다. RTG-SLAM은 "가우시안 스플래팅을 이용한 RGBD 카메라 기반 대규모 환경 실시간 3D 재구성 시스템"으로, 프레임당 비용이 지도 크기가 아니라 *변화량*을 따라가도록 설계되었다.

## 방법 및 아키텍처

각 가우시안은 위치 $\mathbf{p}_i$, 공분산 $\boldsymbol{\Sigma}_i$(스케일 $\mathbf{s}_i$ + 쿼터니언 $\mathbf{q}_i$), 불투명도 $\alpha_i$, SH 계수를 가지며, 여기에 더해 법선 $\mathbf{n}_i$, 신뢰도 카운트 $\eta_i$, 타임스탬프 $t_i$를 갖는 타원 디스크(서펠)로도 취급된다. 불투명도는 생성 시점에 고정된다: **불투명**($\alpha=0.99$, 표면과 주된 색상을 맞춤) 또는 **거의 투명**($\alpha=0.1$, 잔여 색상을 맞춤) — 깊은 알파 합성 스택이 필요하지 않다.

- **색상 대 깊이 렌더링**: 색상은 표준 알파 블렌딩 $\hat{\mathbf{C}}(\mathbf{u})=\sum_{i=1}^{n}\mathbf{c}_{i}f_{i}(\mathbf{u})\prod_{j=1}^{i-1}(1-f_{j}(\mathbf{u}))$을 사용하며 $f(\mathbf{u})=\alpha_{i}\exp(-\frac{1}{2}(\mathbf{u}-\boldsymbol{\mu})^{\top}\boldsymbol{\Sigma}_{2D,i}^{-1}(\mathbf{u}-\boldsymbol{\mu}))$이고, 여기에 광 투과율 지도 $\hat{\mathbf{T}}(\mathbf{u})=\prod_{i}(1-f_{i}(\mathbf{u}))$가 더해진다. 깊이는 *다르게* 렌더링된다: 광선을 따라 $\alpha^{\mathbf{r}}_{j}>\delta_{\alpha}=e^{-0.5}$을 만족하는 첫 번째 불투명 가우시안을 디스크로 취급하고, 픽셀 깊이는 광선-평면 교차로부터 얻는다.

$$\mathbf{p}_{G_{j}^{\mathbf{r}},\mathbf{r}}=(\mathbf{R}_{g}\mathbf{K}^{-1}\dot{\mathbf{u}})\,\theta_{\mathbf{u}}+\mathbf{t}_{g},\qquad \theta_{\mathbf{u}}=\frac{(\mathbf{p}_{j}^{\mathbf{r}}-\mathbf{t}_{g})\cdot\mathbf{n}_{j}^{\mathbf{r}}}{(\mathbf{R}_{g}\mathbf{K}^{-1}\dot{\mathbf{u}})\cdot\mathbf{n}_{j}^{\mathbf{r}}},$$

  이는 완전히 미분 가능하며, 하나의 불투명 가우시안만으로도 지역 표면 패치를 단독으로 맞출 수 있게 한다. 법선 및 인덱스 지도도 같은 패스에서 함께 나온다.
- **타겟형 가우시안 추가**: 프레임마다 마스크가 기하가 필요한 픽셀을 골라낸다. 투과율 $\hat{\mathbf{T}}_{k}(\mathbf{u})>\delta_{\mathbf{T}}=0.5$(새로 관측됨)이거나 $|\hat{\mathbf{D}}_{k}-\mathbf{D}_{k}|>\delta_{d}=0.1$(깊이 오차)인 픽셀이 $M_{s}$, 색상 오차만 $\delta_{c}=0.1$을 넘는 픽셀이 $M_{c}$이며, 마스크된 픽셀 중 5%를 샘플링한다. $M_s$ 픽셀은 불투명 가우시안을 생성하고, $M_c$ 픽셀은 기존의 불투명 가우시안이 이미 안정된 경우에만 작은 투명 가우시안을 생성한다.
- **안정/불안정 최적화**: 신뢰도 $\eta>\delta_{\eta}$인 가우시안은 안정 상태이며 고정된다. "우리는 불안정한 가우시안만 최적화하고 불안정한 가우시안이 점유하는 픽셀만 렌더링한다"며 $L=w_{c}L_{color}+w_{d}L_{depth}+w_{reg}L_{reg}$($L_1$ 색상/깊이 손실; $L_{reg}$는 투명 가우시안의 기하를 고정; $w_c=w_d=1$, $w_{reg}=1000$)를 사용한다. 최적화된 윈도우는 이전 상태와 가중 평균 $G_{o}=(1-w_{curr})G_{o-1}+w_{curr}G^{\prime}_{o}$으로 융합되어 망각을 방지하며, 반복적으로 오차가 발생하는 안정 가우시안은 불안정 상태로 되돌아가고, 오랫동안 불안정 상태인 가우시안은 이상값으로 간주되어 삭제된다.
- **추적**: 렌더링된 깊이/법선 지도에 대한 고전적인 프레임-대-모델 ICP로, 점-대-평면 오차 $E(\boldsymbol{\xi})=\sum\lVert(\mathbf{T}_{g,k}\mathbf{V}_{k}^{l}(\mathbf{u})-\hat{\mathbf{V}}_{k-1}^{g*}(\hat{\mathbf{u}}))\cdot\hat{\mathbf{N}}_{k-1}^{*}(\hat{\mathbf{u}})\rVert$를 다중 레벨 ICP로 최소화하며, 여기에 ORB-SLAM2 방식의 랜드마크/포즈 그래프 백엔드를 결합한다. 키프레임(30° 또는 0.3 m마다)은 오차 상위 40% 픽셀에 대한 전역 최적화를 트리거한다.

## 실험 결과

i9-13900KF + RTX 4090에서 Azure Kinect를 이용한 실시간 스캐닝 기준:

- **실제 대규모 장면**: 복도, 창고, 호텔룸, 주택, 오피스(43–100 m²)를 약 16 fps로 실시간 재구성한다. 약 70 m² 주택 장면에서 17.9 fps, 8.8 GB 메모리(Co-SLAM의 8.65 fps / 17.3 GB 대비 — 논문은 이를 SOTA NeRF SLAM 대비 "약 두 배의 속도, 절반의 메모리 비용"으로 표현); SplaTAM은 0.31 fps에 그치고 메모리 부족(OOM)을 일으키며 OOM 전까지 7,155,880개의 가우시안을 사용한 데 반해 RTG-SLAM은 987,524개다.
- **Replica office0 처리량**: 전체 17.24 FPS; 추적 0.02 s/프레임, 매핑 3.5 ms/반복, 최대 메모리 2751 MB — SplaTAM의 재구성 속도보다 약 46배 빠르다.
- **TUM ATE RMSE**: 1.66 / 0.38 / 1.13 cm(fr1_desk / fr2_xyz / fr3_office), 평균 1.06 cm — ESLAM(2.11), Point-SLAM(2.38), SplaTAM(3.39)을 앞서며 ORB-SLAM2(1.00)에 근접한다.
- **ScanNet++ 기하(GT 포즈 사용)**: 정확도 0.95 cm / 완전성 1.11 cm로, SplaTAM(1.32/1.54)과 (샘플링에 정답 깊이를 사용하는 Point-SLAM을 제외한) 모든 NeRF 계열 방법보다 우수하다.
- 어블레이션 실험은 컴팩트 가우시안이 알파 블렌딩 깊이보다 동일한 깊이 정확도를 훨씬 적은 프리미티브로 달성함을 보이며, 불투명 전용 지도는 투명 잔여 층이 없으면 새로운 시점에서 색상 오차를 겪는다는 것도 보여준다.

## SLAM에서의 의미

RTG-SLAM은 가우시안 SLAM의 계산량을 지도 크기가 아니라 변화한 부분에 비례하도록 만드는 방법을 보여주었다 — 이는 지역 BA와 공가시성 윈도우가 고전적 대규모 SLAM을 다룰 만하게 만들었던 것과 같은 통찰을, KinectFusion 방식의 ICP 추적과 서펠 방식의 신뢰도 관리를 통해 스플래팅 시대로 옮겨온 것이다. RTG-SLAM의 안정/불안정 상태 관리와 디스크 기반 깊이 렌더링은 실제 건물과 실제 로봇으로 가우시안 SLAM을 확장하기 위한 참조 설계가 되었다.

## 관련 문서

- [SplaTAM](splatam.md)
- [Photo-SLAM](photo-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [MonoGS](monogs.md)
- [EGG-Fusion](egg-fusion.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
