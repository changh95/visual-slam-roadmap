# LVI-SAM

> Shan 2021 · [논문](https://arxiv.org/abs/2104.10831)

**한 줄 요약** — LVI-SAM은 공유된 팩터 그래프 위에서 VINS-Mono 스타일의 시각-관성 서브시스템과 LIO-SAM 스타일의 LiDAR-관성 서브시스템을 긴밀하게 결합하며, 각 서브시스템이 서로를 초기화하고 구제한다.

## 문제

LiDAR 기반 방법은 장거리에서 정밀한 환경 디테일을 포착하지만, 긴 복도나 평탄하고 개방된 들판 같은 구조가 없는 환경에서는 대체로 실패한다. 시각 기반 방법은 장소 인식과 텍스처가 풍부한 장면에서 뛰어나지만 조명 변화, 급격한 움직임, 초기화에 민감하다. 각각을 IMU와 결합하면 도움이 되지만, 어느 한 쌍만으로는 실제 배치 환경 전반에서 강인하지 않다. LVI-SAM은 이 세 가지 센서를 하나의 프레임워크에서 융합하여, 시각 또는 LiDAR 절반 중 하나가 성능이 저하되더라도 계속 작동한다.

## 방법 및 아키텍처

두 서브시스템은 iSAM2로 최적화되는 하나의 팩터 그래프를 공유한다:

- **시각-관성 시스템(VIS)**: VINS-Mono에서 적용되었으며, KLT로 추적되는 Shi-Tomasi 코너와, 상태 $\mathbf{x} = [\,\mathbf{R},\ \mathbf{p},\ \mathbf{v},\ \mathbf{b}\,]$에 대한 슬라이딩 윈도우 번들 조정을 사용한다. 여기서 $\mathbf{R} \in SO(3)$는 회전, $\mathbf{p} \in \mathbb{R}^3$는 위치, $\mathbf{v}$는 속도, $\mathbf{b} = [\,\mathbf{b}_a, \mathbf{b}_w\,]$는 가속도계/자이로 바이어스이며, 몸체-투-월드 변환은 $\mathbf{T} = [\mathbf{R}\,|\,\mathbf{p}] \in SE(3)$이다.
- **LiDAR-관성 시스템(LIS)**: LIO-SAM에서 적용되었으며, IMU 디스큐잉 후 모서리 및 평면 특징이 키프레임의 슬라이딩 윈도우로 유지되는 특징 맵과 매칭된다. 포즈 변화가 임계값을 초과하면 새로운 키프레임(그래프 노드)이 추가된다. IMU 사전통합, 시각 오도메트리, LiDAR 오도메트리, 루프 클로저의 네 가지 팩터 유형이 공동으로 최적화된다.

교차 시스템 보조가 핵심 설계다:

- **초기화**: VINS-Mono 스타일 초기화는 속도가 작거나 일정할 때 자주 실패한다(가속도 자극이 없으면 스케일을 관측할 수 없기 때문이다). 그래서 깊이를 직접 관측할 수 있는 LIS가 먼저 초기화되어, 추정된 $\mathbf{x}$와 $\mathbf{b}$를 VIS에 초기 추정값으로 전달한다.
- **LiDAR로부터의 특징 깊이**: 여러 LiDAR 프레임이 조밀한 깊이 맵으로 누적된다. 특징과 깊이 포인트는 카메라를 중심으로 한 단위 구에 투영되고, 극좌표계의 2D K-D 트리를 통해 가장 가까운 세 깊이 포인트를 찾은 뒤, 특징 깊이는 카메라 중심에서 이 세 포인트가 이루는 평면과의 교점까지의 레이 길이로 정해진다. 세 포인트 사이의 최대 거리가 2m를 초과하면(누적으로 인한 깊이 모호성) 깊이가 연관되지 않는다.
- **스캔 매칭을 위한 초기 추정값**: 시각-관성 오도메트리가 LiDAR 스캔 매칭의 시드를 제공한다. LIS 초기화 이전에는 원시 IMU 적분만으로도 초기 선속도 10 m/s 미만, 각속도 180°/s 미만 조건에서 충분하다.
- **실패 감지**: VIS는 추적된 특징이 임계값 아래로 떨어지거나 추정된 IMU 바이어스가 임계값을 초과하면 실패로 보고하고 재초기화한다. LIS는 스캔 매칭을 $\min_{\mathbf{T}} \|\mathbb{A}\mathbf{T} - \mathbf{b}\|^2$를 반복적으로 푸는 문제로 취급하며, $\mathbb{A}^{\mathsf{T}}\mathbb{A}$의 최소 고유값이 임계값 아래로 떨어지면 실패로 보고하고, 이 경우 LiDAR 팩터를 추가하지 않는다.
- **2단계 루프 클로저**: BRIEF 디스크립터를 사용하는 DBoW2가 VIS에서 후보를 제안하고, LIS가 스캔 매칭으로 이를 정밀화한 뒤 제약이 그래프에 들어간다.

## 실험 결과

Velodyne VLP-16, FLIR 카메라, MicroStrain 3DM-GX5-25 IMU, RTK GPS 정답값을 사용해 자체 수집한 세 데이터셋(*Urban*, *Jackal*, *Handheld*)에서 VINS-Mono, LOAM, LIO-mapping, LINS, LIO-SAM과 비교하여 Intel i7-10710U 노트북에서 평가했다.

- **Urban 애블레이션**(엔드투엔드 오차): VIS 단독 239.19 m → LiDAR 깊이 추가 시 142.12 m; LIS 단독 290.43 m(성능 저하 구간에서 발산); 루프 클로저 없는 전체 LVIO 45.42 m → 깊이 추가 시 32.18 m(29% 감소); 모든 모듈 활성화 시: 병진 0.28 m, 회전 5.77°.
- **Jackal(UGV)**: 루프를 포함한 LVI-SAM이 GPS 기준 최고 RMSE 0.67 m를 달성했다(LIO-SAM 1.52 m, LINS 0.77 m, VINS-Mono 4.49 m와 비교), 엔드투엔드 회전 오차도 최고인 1.52°였다.
- **Handheld**(개방된 야구장을 가로지르는 주행): 모든 LiDAR 기반 방법이 완전히 실패하는 반면, LVI-SAM은 루프 클로저를 포함해 RMSE 0.83 m, 엔드투엔드 병진 오차 0.27 m로 주행을 완료한다(루프를 포함한 VINS-Mono는 RMSE 73.07 m).

## SLAM에서의 의미

LVI-SAM은 LiDAR-시각-관성 융합을 팩터 그래프로 구현한 대표적인 사례이며, *양방향* 센서 보조를 가장 명확하게 보여준다: 깊이는 LiDAR에서 카메라로 흐르고, 초기화와 초기 추정값은 양방향으로 흐른다. LIO-SAM 저자들이 그 자연스러운 확장으로 구축한 이 시스템은 R3LIVE, FAST-LIVO 같은 직접적이고 필터 기반인 경쟁자들이 자신을 비교하는 표준 오픈소스 LVI 기준선이 되었으며, 삼중 융합에서 성능 저하 처리를 다루는 대표적인 사례 연구가 되었다.

## 관련 문서

- [LIO-SAM](lio-sam.md) — LiDAR-관성 서브시스템 및 팩터 그래프 백본
- [VINS-Mono](../level-06-vio-vins/vins-mono.md) — 시각-관성 서브시스템의 설계 기반
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — 이 시스템이 예시하는 융합 개념
- [Degradation handling](degradation-handling.md) — 서브시스템 간 폴백 동작
- [FAST-LIVO](fast-livo.md) — 직접적이고 필터 기반인 대안
- [Tightly-coupled LiDAR-camera](tightly-coupled-lidar-camera.md) — 팩터 그래프로 구현하는 아키텍처 원칙
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md) — 그래프의 네 가지 팩터 유형 중 하나
