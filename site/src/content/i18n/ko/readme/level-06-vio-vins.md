### 핵심 개념
- **[긴밀 결합 vs 느슨한 결합](level-06-vio-vins/tightly-coupled-vs-loosely-coupled.md)** — 시각 및 관성 측정값의 공동 최적화 vs 개별 최적화
- **[필터 기반 vs 최적화 기반](level-06-vio-vins/filter-based-vs-optimization-based.md)** — EKF 접근법 vs 비선형 최적화(BA)
- **[IMU 사전 적분](level-06-vio-vins/imu-preintegration.md)** — 키프레임 사이의 IMU 측정값을 적분하는 것 (Lupton 2012; 다양체 위 공식화: Forster 2015)
- **[IMU 잡음 모델](level-06-vio-vins/imu-noise-model.md)** — 바이어스, 랜덤 워크, 앨런 분산
- **[관측 가능성](level-06-vio-vins/observability.md)** — VIO에서 관측 불가능한 4개의 자유도(3자유도 전역 이동 + 요); 등가속도 운동에서는 스케일도 추가로 관측 불가능해짐
- **[실제 배포된 VIO](level-06-vio-vins/deployed-vio.md)** — 상용 XR 스택(Meta Quest, ARKit/ARCore)은 가장 널리 배포된 VIO 시스템으로, 사례 연구로서 살펴볼 가치가 있음

### 기초

| 자료 | 저자/연도 | 핵심 개념 |
|----------|-------------|--------------|
| [**Introduction to Inertial Navigation**](level-06-vio-vins/introduction-to-inertial-navigation.md) | [Woodman 2007](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-696.html) | IMU 기초, 좌표계, 오차 원인 — 필수 선행 지식 |
| [IMU Preintegration on Manifold](level-06-vio-vins/imu-preintegration-on-manifold.md) | [Forster 2015](https://arxiv.org/abs/1512.02363) | 다양체 위 사전 적분, 재적분 없는 바이어스 보정 |
| [Quaternion kinematics for error-state KF](level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md) | [Solà 2017](https://arxiv.org/abs/1711.02508) | 쿼터니언 수학, 오차 상태 공식화 |

### 필터 기반

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**MSCKF**](level-06-vio-vins/msckf.md) | [Mourikis 2007](https://ieeexplore.ieee.org/document/4209642) | Multi-State Constraint KF, 상태에 랜드마크가 없는 효율적인 VIO |
| [ROVIO](level-06-vio-vins/rovio.md) | [Bloesch 2015](https://github.com/ethz-asl/rovio) | 로봇 중심(robocentric) VIO, 직접 광도 추적 + EKF |
| [**OpenVINS**](level-06-vio-vins/openvins.md) | [Geneva 2020](https://docs.openvins.com/) | 오픈소스 MSCKF, 모듈형, 확장 가능 |

### 최적화 기반

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [OKVIS](level-06-vio-vins/okvis.md) | [Leutenegger 2015](https://journals.sagepub.com/doi/10.1177/0278364914554813) | 키프레임 기반, 긴밀 결합, 슬라이딩 윈도우 최적화 |
| [**VINS-Mono**](level-06-vio-vins/vins-mono.md) | [Qin 2018](https://arxiv.org/abs/1708.03852) | 긴밀 결합, 재지역화, 루프 클로저, 포즈 그래프 최적화 |
| [VI-DSO](level-06-vio-vins/vi-dso.md) | [von Stumberg 2018](https://arxiv.org/abs/1804.05625) | 직접 희소 VIO, 동적 주변화, 광도 오차 |
| [VINS-Fusion](level-06-vio-vins/vins-fusion.md) | [Qin 2019](https://arxiv.org/abs/1901.03638) | 스테레오 + GPS 융합 확장 |
| [maplab](level-06-vio-vins/maplab.md) | [Schneider 2018](https://arxiv.org/abs/1711.10250) | 다중 세션 시각-관성 매핑 프레임워크 |
| [**Kimera-VIO**](level-06-vio-vins/kimera-vio.md) | [Rosinol 2020](https://arxiv.org/abs/1910.02490) | Kimera 파이프라인을 위한 빠른 VIO 프론트엔드, 구조 없는(structureless) 시각 팩터 |
| [Basalt](level-06-vio-vins/basalt.md) | [Usenko 2020](https://arxiv.org/abs/1904.06504) | 주변화 사전 정보의 비선형 팩터 복원(NFR), 시각-관성 오도메트리 + 매핑 |
| [**ORB-SLAM3**](level-03-monocular-slam/orb-slam3.md) | [Campos 2020](https://arxiv.org/abs/2007.11898) | VIO 모드, 다중 맵, IMU 초기화 |
| [**DM-VIO**](level-06-vio-vins/dm-vio.md) | [von Stumberg 2022](https://arxiv.org/abs/2201.04114) | 직접 방법(DSO 기반) 단안 VIO, 지연 주변화, IMU 초기화를 위한 포즈 그래프 BA |
| [**OKVIS2**](level-06-vio-vins/okvis2.md) | [Leutenegger 2022](https://arxiv.org/abs/2202.09199) | 다중 세션, 개선된 주변화 |
| [AirVO](level-06-vio-vins/airvo.md) | [Xu 2023](https://arxiv.org/abs/2212.07595) | 점-선 VIO, 조명 변화에 강건 |
| [**OKVIS2-X**](level-06-vio-vins/okvis2-x.md) | [Boche & Leutenegger 2025](https://arxiv.org/abs/2510.04612) | 다중 센서 SLAM(시각+관성+깊이+LiDAR+GNSS), 밀도 볼류메트릭 점유 지도, 대규모(9km 이상)를 위한 서브매핑, EuRoC/Hilti22 SOTA |
