# Kimera-VIO

> Rosinol 2020 · [논문](https://arxiv.org/abs/1910.02490)

**한 줄 요약** — Kimera 라이브러리의 고속 스테레오-관성 오도메트리 모듈: 다양체 위 IMU 사전 적분과 GTSAM 구조 없는(structureless) 비전 팩터를 iSAM2 고정-지연(fixed-lag) 스무딩으로 풀어내는—실시간, CPU 전용 메트릭-시맨틱 SLAM 파이프라인의 상태 추정 핵심 요소입니다.

## 문제

사람들 주변에서 동작하는 로봇은 궤적 이상의 것을 필요로 합니다: 메트릭적으로 정확하면서도 *시맨틱하게 라벨링된* 장면 모델이 필요합니다. 기존의 오픈 라이브러리(ORB-SLAM, VINS-Mono, OKVIS, ROVIO)는 자세와 희소한 점에서 멈추는 반면, 실시간 메트릭-시맨틱 시스템(SLAM++, SemanticFusion, Voxblox++)은 RGB-D 센싱과 대체로 GPU에 의존합니다. Kimera는 "메시 재구성과 3D에서의 시맨틱 라벨링을 가능하게 함으로써 ... 기존의 시각 및 시각-관성 SLAM 라이브러리를 넘어섭니다"—시각-관성 센싱을 사용하여, CPU에서, 실시간으로—이는 전체 스택을 지탱할 만큼 빠르고 정확한 VIO 프론트엔드에 의해 뒷받침됩니다.

## 방법 및 아키텍처

Kimera는 스테레오 프레임과 고속 IMU 데이터를 받아 네 개의 모듈을 담당하는 네 개의 스레드에서 병렬화됩니다.

- **Kimera-VIO**는 Forster 등의 키프레임 기반 최대 사후 확률(MAP) 시각-관성 추정기를 고정-지연(또는 선택적으로 전체) 스무더로 구현합니다. *프론트엔드*는 키프레임 사이에서 다양체 위 IMU 사전 적분을 수행하고, 비전 측면에서는 Shi-Tomasi 코너를 검출하고, Lucas-Kanade 트래커로 이를 추적하며, 좌우 스테레오 매칭을 찾고, 기하학적 검증을 수행합니다—5점 RANSAC(단안)과 3점 RANSAC(스테레오)이며, IMU 회전을 이용하는 선택적 2점/1점 변형도 있습니다. 검출, 스테레오 매칭, 검증은 키프레임에서만 실행되며; 중간 프레임은 추적만 됩니다. *백엔드*는 사전 적분된 IMU 팩터와 **구조 없는(structureless) 비전 모델**을 GTSAM 팩터 그래프에 추가하고 iSAM2로 풉니다: 매 반복마다 관측된 특징들은 현재 자세 추정값으로부터 DLT를 통해 삼각측량되고, 3D 점들은 (카메라 뒤에 있거나 시차가 낮은) 퇴화된 점과 (재투영 오차가 큰) 이상치를 제거한 후 VIO 상태로부터 해석적으로 소거됩니다. 스무딩 지평선을 벗어난 상태는 주변화되며; 프론트엔드는 IMU 속도로 상태 추정값을 발행합니다.
- **Kimera-RPGO**는 DBoW2 bag-of-words와 단안/스테레오 기하학적 검증으로 루프 클로저를 검출한 다음, *증분적 Pairwise Consistent Measurement set maximization(PCM)*을 통해 강건한 PGO를 적용합니다: 각 루프는 사이클을 따라 오도메트리와 일관성이 있어야 하며(카이제곱 검정), 이전 루프들과도 쌍별 일관성이 있어야 하며, 이는 증분적으로 증가하는 인접 행렬 $\boldsymbol{A}\in\mathbb{R}^{L\times L}$에서 추적됩니다; 빠른 최대 클리크 탐색이 Gauss-Newton 최적화 전에 가장 큰 일관 집합을 선택합니다.
- **Kimera-Mesher**는 백엔드 깊이로 역투영된 추적 특징들에 대한 2D Delaunay 삼각화를 통해 5\,ms 이내에 프레임별 3D 메시를 구축하고, VIO 지평선에 대한 다중 프레임 메시를 구축합니다; 검출된 평면 표면은 정규성 팩터를 VIO에 되먹임합니다—메시 정규화와 상태 추정의 긴밀한 결합입니다.
- **Kimera-Semantics**는 키프레임마다 조밀 스테레오(semi-global matching)를 수행하고, 번들 레이캐스팅을 통해 포인트 클라우드를 Voxblox TSDF에 융합하는 동시에 2D 세그멘테이션으로부터 복셀별 시맨틱 라벨 확률을 베이지안 업데이트하며, marching cubes로 전역 메트릭-시맨틱 메시를 추출합니다.

이 모듈들은 "단독으로 또는 조합하여 실행할 수 있으므로, Kimera는 최신 VIO 또는 완전한 SLAM 시스템으로 쉽게 대체될 수 있습니다."

## 실험 결과

EuRoC(RMSE ATE, SE(3) 정렬)에서, Kimera는 카테고리별로 최상위 성능을 달성합니다: 고정-지연 스무딩에서 Kimera-VIO는 0.05–0.35\,m에 도달(예: MH\_1 0.11, V1\_3 0.07)하며 이는 OKVIS의 0.09–0.47, MSCKF의 0.10–1.13, ROVIO의 0.10–0.52, VINS-Mono의 0.08–0.32와 대비됩니다; 전체 스무딩에서는 SVO-GTSAM이 V 시퀀스 세 개에서 실패하는 상황에서 MH\_1에서 0.04\,m을 달성합니다; 루프 클로저를 포함하면 Kimera-RPGO는 V2\_3에서 0.19\,m을 얻는데, VINS-LC는 1.39\,m을 보고합니다. 강건성: PCM이 없으면 DBoW2 임계값 $\alpha$가 완화될수록 PGO 오차가 1.74\,m로 폭증하는 반면, Kimera-RPGO는 모든 $\alpha$에서 ~0.05\,m을 유지합니다—파라미터 튜닝이 필요 없습니다. 기하: 전역 시맨틱 메시는 EuRoC 그라운드 트루스 클라우드 대비 0.35–0.48\,m의 정확도를 가지며; 빠른 다중 프레임 메시는 최대 24\% 더 노이즈가 있지만 두 자릿수 배 더 빠릅니다. 포토리얼리스틱 시뮬레이터에서, Kimera-Semantics는 그라운드 트루스 깊이와 Kimera-VIO 자세(ATE 0.04\,m)를 사용할 때 80.03\% mIoU에 도달하며, 조밀 스테레오를 사용하면 57.23\%로 떨어집니다. 시간(CPU): IMU 사전 적분 ~40\,µs(>200\,Hz 상태 출력), 추적 4.5\,ms/프레임, 키프레임 처리 45\,ms, 백엔드 <40\,ms, RPGO ~55\,ms, 시맨틱스는 키프레임당 ~0.1\,s.

## SLAM에서의 의미

Kimera는 깔끔하고 모듈화된 오픈소스 스택이 원시 스테레오+IMU에서 시맨틱하게 라벨링된 3D 메시로 실시간으로 CPU에서 이어질 수 있음을 보여주었습니다—이는 실용적인 VIO 기준선이자, 전체 연구 계보의 기반이 되었습니다: 3D Dynamic Scene Graphs, Hydra, Kimera-Multi 모두 이 프론트엔드 위에 구축됩니다. GTSAM smart-factor + iSAM2 방식은 이제 Ceres 스타일 슬라이딩 윈도우 최적화에 대한 표준적인 대안이 되었으며, Kimera-RPGO의 강건한 포즈 그래프 최적화는 독립 라이브러리로 사용됩니다.

## 실습

- [Kimera 실행하기](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/kimera)

## 관련 문서

- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — Kimera-VIO가 사용하는 IMU 팩터.
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) — 이 VIO 위에 구축된 장면 이해 계층.
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — 다중 로봇 확장.
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — 그 아래에 있는 iSAM2 메커니즘.
- [GNC](../level-05-deep-learning/gnc.md) — 이후 Kimera-RPGO에서 채택된 강건 최적화.
- [MSCKF](msckf.md) — 구조 없는 측정 아이디어의 필터링 조상.
