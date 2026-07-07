# R3LIVE

> Lin 2022 · [논문](https://arxiv.org/abs/2109.07982)

**한 줄 요약** — R3LIVE는 LiDAR, 관성, 시각 센싱을 융합하여 LiDAR-관성 오도메트리가 전역 맵의 기하를 구축하는 동안 직접 시각-관성 서브시스템이 그 텍스처를 채색하도록 하여, 실시간으로 밀집한 RGB 컬러 포인트 클라우드를 생성한다.

## 문제

LiDAR 기반 SLAM은 기하학적 특징이 충분하지 않을 때—특히 시야가 좁은 솔리드 스테이트 LiDAR에서—실패하며, 그 맵은 색상이 없어 측량, 시뮬레이터, 기타 3D 응용에서의 활용이 제한된다. R3LIVE는 각 센서에 가장 잘 맞는 역할을 부여하여, 하나의 공유 맵과 하나의 필터를 통해 결합함으로써 강인하고 정확한 상태 추정 *및* 밀집 RGB 컬러 맵을 목표로 한다.

## 방법 및 아키텍처

두 서브시스템은 IMU 포즈 $({^G}\mathbf{R}_I, {^G}\mathbf{p}_I)$, 속도, 자이로/가속도 바이어스, 중력 ${^G}\mathbf{g}$, 카메라-IMU 외부 파라미터 $({^I}\mathbf{R}_C, {^I}\mathbf{p}_C)$, 카메라-IMU 시간 오프셋 ${^I}t_C$, 카메라 내부 파라미터 $\boldsymbol{\phi} = [f_x, f_y, c_x, c_y]^T$를 포함하는 29차원 상태 $\mathbf{x} \in \mathbb{R}^{29}$를 공유하며—이 모두는 오차 상태 반복 칼만 필터(ESIKF)에서 온라인으로 추정된다.

- **맵**: 고정 크기 복셀(예: $0.1$ m 정육면체로, 최근 포인트가 추가되었으면 *활성화됨*으로 표시된다)이 포인트 $\mathbf{P} = [{^G}\mathbf{p}^T, \mathbf{c}^T]^T$—3D 위치와 RGB 색상—를 포함하며, 각각 공분산 $\boldsymbol{\Sigma}_{\mathbf{p}}, \boldsymbol{\Sigma}_{\mathbf{c}}$를 가진다.
- **LIO 서브시스템**(FAST-LIO 기반): IMU 역방향 전파가 각 스캔을 디스큐잉하고, ESIKF가 포인트-투-평면 잔차를 최소화하며, 수렴한 스캔은 전역 맵에 추가된다—이는 VIO에 깊이도 공급하는 기하를 구축한다.
- **VIO 서브시스템**은 특징 추출이 없는 2단계 직접 파이프라인이다:
  1. *프레임-투-프레임 업데이트*: LK 광류가 맵 포인트의 투영을 추적하며, PnP 재투영 잔차 $\mathbf{r} = \boldsymbol{\rho}_{s_k} - \boldsymbol{\pi}({^C}\mathbf{p}_s, \check{\mathbf{x}}_k)$($\boldsymbol{\pi}$ 내부에 온라인 시간 오프셋 보정항 포함)가 ESIKF 업데이트를 구동한다.
  2. *프레임-투-맵 업데이트*: 광도계 잔차 $\mathbf{o}(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \mathbf{c}_s) = \mathbf{c}_s - \boldsymbol{\gamma}_s$는 각 추적된 포인트의 저장된 맵 색상 $\mathbf{c}_s$를 현재 이미지에서 보간된 색상 $\boldsymbol{\gamma}_s$와 비교한다—맵 색상은 패치 피라미드와 달리 카메라 회전/이동에 불변이다.
- 두 업데이트는 동일한 MAP 문제를 풀며, IMU로 전파된 사전 정보와 누적된 잔차를 결합한다:

$$\min_{\delta\check{\mathbf{x}}_k} \Big( \big\|\check{\mathbf{x}}_k \boxminus \hat{\mathbf{x}}_k + \boldsymbol{\mathcal{H}}\delta\check{\mathbf{x}}_k\big\|^2_{\boldsymbol{\Sigma}_{\delta\hat{\mathbf{x}}_k}} + \sum_{s=1}^{m} \big\|\mathbf{o}(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \mathbf{c}_s) + \mathbf{H}^o_s \delta\check{\mathbf{x}}_k\big\|^2_{\boldsymbol{\Sigma}_{\boldsymbol{\beta}_s}} \Big)$$

  칼만 게인 $\mathbf{K} = (\mathbf{H}^T\mathbf{R}^{-1}\mathbf{H} + \mathbf{P}^{-1})^{-1}\mathbf{H}^T\mathbf{R}^{-1}$(가우스-뉴턴과 동일)로 수렴까지 반복된다.
- **텍스처 렌더링**: 수렴한 각 포즈 이후, 활성화된 복셀 내에서 이미지에 들어오는 포인트의 색상은 베이지안 업데이트로 융합되며—저장된 색상의 공분산은 블렌딩 전에 랜덤 워크 항 $\boldsymbol{\sigma}_s^2 \cdot \Delta t_{\mathbf{c}_s}$(조명 변화를 모델링)만큼 증가한다.
- **추적 포인트 유지**: 재투영 오차나 광도계 오차가 큰 포인트는 제거되며; 50픽셀 반경 내에 추적된 포인트가 없는 곳에는 새로운 맵 포인트가 추가된다.

## 실험 결과

핸드헬드 장치: Livox AVIA LiDAR(FoV 70.4°×77.2°), FLIR Blackfly 글로벌 셔터 카메라, DJI Manifold-2c(Intel i7-8550U, 8GB RAM).

- **LiDAR 퇴화 + 무텍스처 테스트**: 흰 벽을 바라본 채 좁은 "T"자 통로를 통과할 때(단일 평면 LiDAR 제약, 텍스처 거의 없음), R3LIVE는 살아남으며 엔드투엔드로 병진 4.57cm, 회전 1.62°만 드리프트한다(ArUco 정답값).
- **대규모 캠퍼스 매핑**(HKUST, 1317/1524/1372/1191 m의 네 궤적): 병진 드리프트 0.093/0.154/0.164/0.102 m, 회전 드리프트 2.140/0.285/2.342/3.925°이며, 어떤 루프 클로저 모듈 없이도 궤적이 루프를 닫는다.
- **RTK-GPS 벤치마크**(항구, 두 시퀀스): R3LIVE-HiRes가 최고 상대 오차를 달성하며, 예를 들어 시퀀스 (a)의 300 m 서브시퀀스에서 0.21°/0.17%(RRE/RTE)로 LVI-SAM의 0.43°/2.40%, VINS-Mono의 0.59°/2.31%를 앞선다; R2LIVE와 FAST-LIO2도 근소하게 앞선다.
- **런타임**: VIO는 320×256 / 0.10 m 맵 해상도의 PC에서 프레임당 7.01ms가 소요된다—온보드 컴퓨터에서도 여유 있게 실시간이다.

## SLAM에서의 의미

R3LIVE는 LVI 시스템을 위한 "LiDAR에서 기하, 카메라에서 텍스처" 패턴을 확립했고, 컬러 LiDAR 맵에 대한 직접 광도계 정렬이 특징 기반 시각 융합에 대한 실용적이고 실시간인 대안임을 보여주었다. 이는 상태 추정과 색상화된 3D 재구성—디지털 트윈, 검사, AR—을 연결하며, 완전한 오픈소스 공개(코드, 메쉬 텍스처링 유틸리티, 심지어 장치의 기계적 설계까지)로 R3LIVE++와 FAST-LIVO가 그 위에 구축하는 레퍼런스 디자인이 되었다.

## 관련 문서

- [FAST-LIO2](fast-lio2.md) — 이 연구 계열이 기반으로 하는 LiDAR-관성 코어
- [R3LIVE++](r3livepp.md) — 복사 맵과 광도계 캘리브레이션을 갖춘 후속 연구
- [FAST-LIVO](fast-livo.md) — 시각 정보가 패치를 통해 포즈 추정에도 기여하는 형제 시스템
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — 융합 범주
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — 광도계 융합 원칙
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md) — ESIKF 이면의 오차 상태 메커니즘
