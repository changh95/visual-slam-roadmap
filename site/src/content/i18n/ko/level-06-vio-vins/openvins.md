# OpenVINS

> Geneva 2020 · [논문](https://docs.openvins.com/)

**한 줄 요약** — OpenVINS는 델라웨어 대학교(University of Delaware)에서 개발한 오픈소스 모듈식 MSCKF 기반 VIO 연구 플랫폼으로, 다양체 위 슬라이딩 윈도우 칼만 필터에 FEJ 일관성, 온라인 카메라 내부/외부 파라미터 및 시간 오프셋 캘리브레이션, 완전한 시각-관성 시뮬레이터와 평가 도구를 함께 패키징하여 사실상의 표준 MSCKF 구현으로 자리매김했습니다.

## 문제

2007년 이후 MSCKF의 영향력에도 불구하고 권위 있고 문서화된 오픈소스 구현이 존재하지 않아, 결과 재현과 필터 기반 대 최적화 기반 VIO 비교가 실질적으로 어려웠습니다; 기존 코드베이스는 하드코딩된 가정을 가지고 있었고 평가 도구가 부족했습니다. 실제 배포는 추가로 카메라-IMU 외부 파라미터, 카메라 내부 파라미터, 카메라와 IMU 클록 사이의 시간 오프셋에 대한 온라인 캘리브레이션을 요구하며, EKF 불일치(관측 불가능한 방향을 따라 발생하는 허위 정보 이득)는 이론적으로는 잘 알려져 있었지만 공개된 코드에서는 거의 다루어지지 않았습니다.

## 방법 및 아키텍처

- **상태.** 필터는 현재 관성 상태, $c$개의 과거 IMU 자세 클론, $m$개의 랜드마크, 카메라별 캘리브레이션과 시간 오프셋을 추정합니다 (식 1–5):
  $$\mathbf{x}_k = \begin{bmatrix} \mathbf{x}_I^\top & \mathbf{x}_C^\top & \mathbf{x}_M^\top & \mathbf{x}_W^\top & {}^Ct_I \end{bmatrix}^\top, \qquad
  \mathbf{x}_I = \begin{bmatrix} {}^{I_k}_G\bar{q}^\top & {}^G\mathbf{p}_{I_k}^\top & {}^G\mathbf{v}_{I_k}^\top & \mathbf{b}_{\omega}^\top & \mathbf{b}_{a}^\top \end{bmatrix}^\top,$$
  여기서 $\mathbf{x}_C$는 클론 자세들을 쌓은 것이고, $\mathbf{x}_M$은 랜드마크(전역 3D, 완전 역깊이, 또는 앵커 기반 표현), $\mathbf{x}_W$는 각 카메라의 내부 파라미터 $\zeta$와 IMU-카메라 외부 파라미터입니다. 관성 상태는 $\mathcal{M} = \mathbb{H} \times \mathbb{R}^{12}$ (15 DoF) 위에 존재하며, 쿼터니언 boxplus는 $\bar q \boxplus \delta\boldsymbol{\theta} \simeq \begin{bmatrix} \tfrac{1}{2}\delta\boldsymbol{\theta} \\ 1 \end{bmatrix} \otimes \bar q$입니다.
- **다양체 위에서의 전파 / 업데이트.** IMU 운동학이 평균과 공분산을 전파합니다: $\mathbf{P}_{k|k-1} = \boldsymbol{\Phi}_{k-1}\mathbf{P}_{k-1|k-1}\boldsymbol{\Phi}_{k-1}^\top + \mathbf{Q}_{k-1}$; 클론, 랜드마크, 캘리브레이션 상태는 정적이므로 이들의 야코비안 블록은 항등원으로 유지됩니다(희소성 활용). 측정값 $\mathbf{z}_{m,k} = h(\mathbf{x}_k) + \mathbf{n}_{m,k}$는 평균이 0인 오차 상태에 대해 선형화되어 다양체 위에서 업데이트됩니다:
  $$\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} \boxplus \mathbf{K}_k\big(\mathbf{z}_{m,k} - h(\hat{\mathbf{x}}_{k|k-1})\big), \qquad \mathbf{K}_k = \mathbf{P}_{k|k-1}\mathbf{H}_k^\top\big(\mathbf{H}_k\mathbf{P}_{k|k-1}\mathbf{H}_k^\top + \mathbf{R}_{m,k}\big)^{-1}.$$
  랜드마크 업데이트는 서로 다른 특징 파라미터화와 카메라 모델을 다루는 중첩된 측정 함수를 갖는 표준 MSCKF 확률적 클론 모델을 사용합니다; First-Estimate Jacobians는 필터가 관측 불가능한 방향을 따라 정보를 얻는 것을 막아줍니다.
- **온라인 시공간 캘리브레이션.** 내부 파라미터 $\zeta$와 외부 파라미터 $\{{}^C_I\mathbf{R}, {}^C\mathbf{p}_I\}$에 대한 추가 야코비안이 필터 내에서 이를 캘리브레이션합니다; 카메라와 IMU 클록은 ${}^It = {}^Ct + {}^Ct_I$로 관계되며, 오프셋 ${}^Ct_I$는 온라인으로 추정됩니다.
- **타입 기반 인덱스 시스템.** 각 상태 "타입"(그 추정값, 오차 상태 크기, 공분산 인덱스, boxplus 업데이트)은 초기화/클로닝/주변화 전반에서 자동으로 관리되므로, 사용자는 측정값이 관여하는 변수에 대해서만 희소 야코비안을 작성하면 됩니다. 새 변수(예: SLAM 랜드마크)는 QR 분리(기븐스 회전)를 통해 선형화된 시스템을 새 상태에 의존하는 부분 시스템과 그렇지 않은 부분 시스템으로 나눠 최적으로 초기화됩니다.
- **연구 인프라.** ov_core(KLT 스타일 희소 추적, 삼각측량, 다양체 수학), ov_eval(궤적 정렬, ATE/RPE/NEES 도구), ov_msckf(추정기)에, 임의의 카메라 리그에 대한 IMU와 방향 측정값을 생성하는 SE(3) B-스플라인 기반 시각-관성 시뮬레이터, 그리고 전체 유도 과정을 담은 문서가 더해집니다.

## 실험 결과

20회 몬테카를로 시뮬레이션(단안 카메라 10 Hz, IMU 400 Hz에 ADIS16448 잡음, 윈도우 크기 11, 프레임당 최대 100개 트랙과 50개 SLAM 랜드마크, 1픽셀 잡음)에서: 온라인 캘리브레이션을 활성화한 경우, *불량한* 초기 캘리브레이션에서의 ATE는 0.218°/0.139 m로 — 실제 캘리브레이션으로 얻은 0.212°/0.134 m과 거의 동일하며 NEES도 일관적입니다(~2); 캘리브레이션을 비활성화하고 초기 추정값이 나쁠 경우 ATE는 5.432°/508.7 m로 폭발하고 NEES는 발산합니다. 캘리브레이션 파라미터는 부실한 초기 추정값으로부터도 빠르게 수렴합니다. EuRoC MAV Vicon-room 시퀀스(각 10회 실행, V2_03 제외)에서 단안 OpenVINS-SLAM은 평균 **1.445°/0.079 m ATE**를 달성하여 — 비교 대상 단안 시스템 중 최고이며 — OKVIS의 1.911°/0.154 m, ROVIO(maplab)의 2.054°/0.140 m, R-VIO의 1.693°/0.149 m, VINS-Fusion VIO의 2.926°/0.104 m를 앞섭니다; 스테레오 변형 역시 Basalt, ICE-BA, S-MSCKF와 비교하여 비슷하게 경쟁력이 있습니다.

## SLAM에서의 의미

OpenVINS는 필터 기반 계보(MSCKF, FEJ/관측 가능성 제약 EKF 연구)를 접근 가능하고 문서화된 코드베이스로 전환시켰습니다 — VIO 문헌 전반에서 참조되는 표준 오픈 MSCKF이며, 다중 카메라, 다중 IMU, Schmidt 필터 SLAM에 관한 후속 연구의 토대입니다. FEJ 기반 관측 가능성 강제와 온라인 시공간 캘리브레이션을 EKF 기반 VIO의 기본 기대치로 만들었으며, 시뮬레이터와 평가 도구 모음은 VIO 연구의 진입 장벽을 크게 낮췄습니다. 프로덕션 품질의 EKF 기반 VIO가 어떻게 동작하는지 배우고 싶거나 — 계산 자원이 제한된 로봇을 위한 경량 추정기가 필요하다면 — 이것이 연구해야 할 기준 시스템입니다.

## 관련 문서

- [MSCKF](msckf.md)
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md)
- [ROVIO](rovio.md)
- [관측 가능성](observability.md)
- [필터 기반 vs 최적화 기반](filter-based-vs-optimization-based.md)
- [IMU 잡음 모델](imu-noise-model.md)
