# ROVIO

> Bloesch 2015 · [논문](https://github.com/ethz-asl/rovio)

**한 줄 요약** — ROVIO(Robust Visual Inertial Odometry)는 다중 레벨 이미지 패치의 직접적인 픽셀 강도 오차를 혁신값(innovation) 항으로 EKF에 곧바로 입력하는 긴밀 결합 단안 VIO로, 방향 벡터/역거리 랜드마크를 사용하는 완전한 로보센트릭 상태 위에서 동작하며 별도의 초기화 절차가 필요 없는 "전원만 넣으면 바로 동작하는" 추정기입니다.

## 문제

특징 기반 VIO 시스템(MSCKF, OKVIS)은 디스크립터 추출과 매칭에 의존하며, 이는 저텍스처 환경과 빠른 모션 블러 하에서 무너집니다. 별개로, 표준 세계 좌표 중심 EKF는 전역적으로 관측 불가능한 양(절대 위치, 요)을 상태에 유지하여 게이지 자유도 및 일관성 문제를 일으킵니다. ROVIO는 두 문제 모두를 공격합니다: 광도 패치 오차가 특징 매칭 파이프라인을 대체하고, 최소 다양체 위 랜드마크 파라미터화를 가진 로보센트릭 공식화는 관측 불가능한 전역 위치를 아예 표현하지 않도록 합니다.

## 방법 및 아키텍처

- **로보센트릭 상태.** IMU 프레임 $B$, 세계 프레임 $I$, 카메라 프레임 $V$를 사용할 때, 필터 상태(논문의 식 1)는
  $$\mathbf{x} := \big(\mathbf{r},\ \mathbf{v},\ \mathbf{q},\ \mathbf{b}_f,\ \mathbf{b}_\omega,\ \mathbf{c},\ \mathbf{z},\ \mu_0,\dots,\mu_N,\ \rho_0,\dots,\rho_N\big),$$
  여기서 $\mathbf{r}, \mathbf{v}$는 (프레임 $B$로 표현된) 로보센트릭 IMU 위치와 속도, $\mathbf{q}$는 자세($B\to I$ 사상), $\mathbf{b}_f, \mathbf{b}_\omega$는 가속도계/자이로 바이어스, $\mathbf{c}, \mathbf{z}$는 온라인으로 캘리브레이션되는 IMU-카메라 외부 파라미터이며, 각 랜드마크는 방향 벡터 $\mu_i \in S^2$와 $d(\rho_i) = 1/\rho_i$(역거리)인 거리 파라미터 $\rho_i$로 표현됩니다. 회전과 단위 벡터는 최소 boxplus 차이를 사용하므로 랜드마크 하나는 공분산 열 3개(방향 2개 + 깊이 1개)만 소요하며, 검출 시점에 매우 큰 깊이 불확실성으로 *지연 없이* 초기화될 수 있습니다.
- **IMU 기반 전파.** 바이어스 보정된 측정값 $\hat{\mathbf{f}}, \hat{\boldsymbol{\omega}}$가 있을 때, 연속시간 동역학(식 2–4)은
  $$\dot{\mathbf{r}} = -\hat{\boldsymbol{\omega}}^\times\mathbf{r} + \mathbf{v} + \mathbf{w}_r, \qquad \dot{\mathbf{v}} = -\hat{\boldsymbol{\omega}}^\times\mathbf{v} + \hat{\mathbf{f}} + \mathbf{q}^{-1}(\mathbf{g}), \qquad \dot{\mathbf{q}} = -\mathbf{q}(\hat{\boldsymbol{\omega}}),$$
  이며, 각 랜드마크의 방향과 거리는 카메라 프레임 속도에 따라(식 9–10) $\dot{\mu}_i = N^T(\mu_i)\hat{\boldsymbol{\omega}}^V - \begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix} N^T(\mu_i)\frac{\hat{\mathbf{v}}^V}{d(\rho_i)}$, $\dot{\rho}_i = -\mu_i^T\hat{\mathbf{v}}^V / d'(\rho_i)$로 진화합니다. 여기서 $N^T(\mu)$는 $\mu$의 접평면으로의 투영입니다.
- **직접 광도 업데이트.** 각 랜드마크는 다중 레벨 패치를 가집니다: 배율 2의 이미지 피라미드(4개 레벨) 위 모든 레벨에서 $8{\times}8$ 픽셀 패치 $P_l$을 가지며(4레벨 → 특징당 $256 = 4\times8\times8$개의 강도 오차). 레벨 $l$과 패치 픽셀 $\mathbf{p}_j$에 대한 강도 오차(식 17)는
  $$e_{l,j} = P_l(\mathbf{p}_j) - I_l\big(\mathbf{p}\,s_l + \mathbf{W}\mathbf{p}_j\big) - m,$$
  여기서 $\mathbf{W}$는 시점 왜곡을 위한 아핀 워프, $s_l$은 레벨별 스케일, $m$은 조명 불변성을 위해 빼는 평균 오차입니다. 모든 항을 쌓으면 $\bar{\mathbf{b}}(\hat{\mathbf{p}}) = \bar{\mathbf{A}}(\hat{\mathbf{p}})\,\delta\mathbf{p}$를 얻고, QR 분해로 이를 등가의 2D 시스템 $\mathbf{b}(\hat{\mathbf{p}}) = \mathbf{A}(\hat{\mathbf{p}})\,\delta\mathbf{p}$로 압축합니다; 이는 야코비안 $\mathbf{H}_i = \mathbf{A}_i(\pi(\hat{\mu}_i))\frac{d\pi}{d\mu}(\hat{\mu}_i)$와 함께 혁신값 $\mathbf{y}_i = \mathbf{b}_i(\pi(\hat{\mu}_i)) + \mathbf{n}_i$로서 EKF에 입력됩니다 — 디스크립터도 명시적 매칭도 없습니다.
- **강건성 장치.** 큰 예측 불확실성을 가진 특징(예: 새로 생성된 것)은 EKF 업데이트 전에 선형화 지점을 개선하는 패치 기반 사전 정렬(pre-alignment)을 거칩니다; 마할라노비스 혁신값 검정이 이상치/동적 물체를 거부합니다; 검출은 다중 레벨 Shi-Tomasi 기준($\mathbf{H} = \bar{\mathbf{A}}^T\bar{\mathbf{A}}$, 최소 고유값)으로 점수화된 FAST 코너 검출기를 버킷팅과 함께 사용하며, 지역/전역 추적 품질 점수가 특징 교체를 좌우합니다.

## 실험 결과

VI-Sensor 데이터(20 Hz, 120° FOV 렌즈를 가진 와이드-VGA 글로벌 셔터 카메라 1대; 200 Hz ADIS16448 IMU, 각속도 랜덤 워크 0.66 deg/√Hz)에서 평가했으며, 최대 50개 특징, 4개 피라미드 레벨, 모션 캡처 그라운드 트루스를 사용했습니다. 약 1분짜리 핸드헬드 시퀀스(평균 회전 속도 ~1.5 rad/s)에서, 이동 거리 대비 상대 위치 오차는 **참조 배치 최적화 프레임워크와 유사하거나 종종 그보다 약간 더 낫습니다**; 특징이 20개 미만으로 떨어질 때만 정확도가 눈에 띄게 저하됩니다. Intel i7-2760QM 단일 코어에서 이미지당 처리 시간은 특징 10개일 때 6.65 ms에서 특징 50개일 때 **29.72 ms**까지 — 20 Hz에서 여유롭게 실시간입니다. 빠른 모션 데이터셋(평균 3.5 rad/s, 최대 8 rad/s)에서 자세와 로보센트릭 속도는 3σ 경계 내에서 그라운드 트루스를 따라가며, 관측 불가능한 요만 천천히 드리프트합니다; IMU-카메라 외부 파라미터는 대략적인 추정값(이동은 0으로 초기화)으로부터 온라인으로 수렴합니다. 이 필터는 멀티로터 UAV에 탑재되어 실행되었고, 온라인 캘리브레이션과 함께 이착륙까지 비행을 안정화했습니다.

## SLAM에서의 의미

ROVIO는 직접법과 칼만 필터링이 자연스럽게 결합됨을 보여주었습니다: 카메라는 EKF를 위한 강도 혁신값을 만들어내는 "또 하나의 센서"가 되며, 로보센트릭 + 역거리 공식화는 초기화 절차와 세계 좌표 중심 필터를 괴롭히는 관측 불가능한 전역 상태를 모두 제거합니다. maplab 매핑 프레임워크의 VIO 프론트엔드(ROVIOLI)가 되었으며 MSCKF, OKVIS와 함께 EuRoC 시대의 표준 기준선이 되었고, 그 광도 잔차 철학은 이후 VI-DSO와 DM-VIO 같은 직접 VIO 시스템으로 이어졌습니다. 저텍스처와 모션 블러를 견디는 경량의 강건한 오도메트리가 필요할 때 선택하세요.

## 관련 문서

- [MSCKF](msckf.md)
- [OpenVINS](openvins.md)
- [DM-VIO](dm-vio.md)
- [maplab](maplab.md)
- [VI-DSO](vi-dso.md)
- [오차 상태 칼만 필터를 위한 쿼터니언 운동학](quaternion-kinematics-for-error-state-kf.md)
