# Hydra-Multi

> Chang 2023 · [논문](https://arxiv.org/abs/2304.13487)

**한 줄 요약** — 최초의 다중 로봇 spatial perception 시스템: 각 로봇이 Hydra를 실행하여 온라인으로 로컬 3D scene graph를 구축하고, 중앙 스테이션이 이를 정렬, 최적화, 정합하여 전역적으로 일관된 단일 계층적 맵을 만듭니다.

## 문제

3D scene graph는 표현력이 풍부한 고수준 맵 표현임이 입증되었지만, Hydra는 단일 로봇의 시점에서만 이를 구축할 수 있었으며 — 대규모 환경은 한 로봇이 빠르게 커버하기에는 비현실적입니다. 한편 다중 로봇 SLAM 시스템은 계층적 의미론이 없는 메트릭 맵을 생성했습니다. 다중 로봇 scene graph를 온라인으로 구축하려면 세 가지 결합된 문제를 풀어야 합니다: 로봇 프레임 간 상대 변환 추정(초기 캘리브레이션 없이), 강한 지각적 애매성(perceptual aliasing)에도 불구한 로봇 간 loop closure 검출, 그리고 서로 다른 로봇이 기여한 중복 scene graph 노드의 정합입니다.

## 방법 및 아키텍처

**프론트엔드(제어 스테이션).** 각 로봇은 로컬 Hydra 인스턴스를 실행하며 주기적으로 자신의 전체 scene graph를 전송합니다. Scene graph 프로세서는 이를 신중한 노드별 참조 프레임 관리와 함께 *최적화되지 않고 정합되지 않은* 단일 프론트엔드 그래프로 누적합니다. 로봇 간 loop closure는 Hydra의 계층적 검출기로 찾습니다 — top-down descriptor 비교(장소 → 객체 → 시각적 외형)에 이어 RANSAC(시각 keypoint) 또는 TEASER++(객체)를 이용한 bottom-up 기하학적 검증입니다.

**백엔드: 정렬 — 최적화 — 정합.**

1. *초기 정렬.* 로봇 $A$와 $B$ 사이의 각 로봇 간 loop closure $(\alpha_{i},\beta_{j})$는 $A$의 프레임에서 본 $B$의 프레임에 대한 노이즈 있는 추정치를 제공합니다:

$$\widehat{\mathbf{X}}^{A}_{B,ij}=\widehat{\mathbf{X}}^{A}_{\alpha_{i}}\,\widetilde{\mathbf{X}}^{\alpha_{i}}_{\beta_{j}}\big(\widehat{\mathbf{X}}^{B}_{\beta_{j}}\big)^{-1}$$

   여기서 $\widehat{\mathbf{X}}$는 오도메트리 포즈 추정치이고 $\widetilde{\mathbf{X}}^{\alpha_{i}}_{\beta_{j}}$는 loop closure 측정치입니다. 이 추정치들은 절단된 최소제곱 비용 $\rho$를 사용한 강건한 포즈 평균화로 융합됩니다:

$$\widehat{\mathbf{X}}^{A}_{B}\in\arg\min_{\mathbf{X}\in\mathrm{SE}(3)}\;\sum_{(i,j)\in L_{A,B}}\rho\left(\big\|\mathbf{X}\boxminus\widehat{\mathbf{X}}^{A}_{B,ij}\big\|_{\Sigma}\right)$$

   GTSAM에서 Graduated Non-Convexity (GNC)로 풀며, $k=5$개의 인라이어가 살아남으면 로봇이 초기화된 것으로 간주하고, 변환은 로봇 수준 의존성 그래프의 스패닝 트리를 따라 연쇄됩니다.
2. *정합 후보 제안.* 정렬 후, 병합 후보가 제안됩니다: 겹치는 장소 쌍(거리 $\leq 0.01$m, 유사한 반경)과 동일한 의미론적 레이블 및 겹치는 바운딩 박스를 가진 객체 쌍(메시 정점의 ICP로 얻은 변환)입니다.
3. *강건한 scene graph 최적화.* Agent 포즈 그래프, 장소, 병합 후보 객체, 서브샘플링된 메시 제어점이 embedded deformation graph를 형성하며, 다음과 같은 pose-graph 최적화 문제로 풀립니다.

$$\arg\min_{\mathbf{T}_{1},\ldots,\mathbf{T}_{n}\in\mathrm{SE}(3)}\;\sum_{\mathbf{E}_{ij}}\big\|\mathbf{T}_{i}^{-1}\mathbf{T}_{j}\boxminus\mathbf{E}_{ij}\big\|^{2}_{\mathbf{\Omega}_{ij}}$$

   여기서 엣지 $\mathbf{E}_{ij}$는 오도메트리, loop closure, 메시 강체성(rigidity), 정합 팩터입니다. GNC는 잘못된 loop closure와 잘못된 병합을 이상치로 거부합니다.
4. *노드 정합.* GNC 인라이어로 판정된 병합이 실행되고, 메시가 재보간되며, 객체 중심점/박스가 재계산됩니다. 제안된 병합 중 절반 미만만 유효하다면 모두 취소되며, 방은 병합된 장소로부터 재분할됩니다.

**이종 로봇 팀.** 자신의 맵이 최소 하나의 레이어와 호환되는 로봇이라면 어떤 로봇도 기여할 수 있습니다: 객체 기반 SLAM 로봇은 객체 레이어를 채우고, 의미론이 없는 메시를 가진 LIDAR 로봇도 메시와 장소에 기여합니다 — 계층적 구조 자체가 이종 맵을 융합 가능하게 하는 핵심입니다.

## 실험 결과

- 데이터셋: 시뮬레이션된 uHumans2 오피스(로봇 3대), 실제 SidPac(SP, 서로 다른 층에서 시작하는 두 대의 로봇으로 취급된 약 400m 다층 녹화 2개), Simmons(SM1/SM2, RealSense D455 + LIDAR를 장착한 두 대의 Clearpath Jackal, 약 500m 이동, 지각적 애매성으로 인해 **80–90%의 이상치 loop closure**가 발생).
- **ATE (m)**: Hydra-Multi 0.25(uH2), 3.92(SP), 0.99(SM1), 0.79(SM2), 중앙집중식 Kimera-Multi 0.59/4.99/2.0/0.87과 비교; 비전을 사용함에도 LIDAR 기반 LAMP 2.0(SM1/SM2에서 0.73/0.58)에 근접합니다.
- Scene graph 정확도는 ground-truth 프레임 정렬을 사용한 단일 로봇 Hydra와 일치하며, uH2/SP에서는 로봇 간 loop closure 덕분에 이를 약간 상회합니다.
- Ablation(객체 "발견율 %"): 전체 시스템 92.9%(uH2), 59.3%(SM1), 초기 정렬 없이는 80.8%/23.8%, 정합 없이는 91.1%/37.3%.
- 두 대의 로봇이 약 30분 안에 도미토리 한 층 전체를 재구성하는 반면, 동일 영역을 커버하는 단일 로봇은 약 50분이 걸립니다. 프론트엔드는 반복당 약 100ms를 유지하며, 로봇당 loop closure 및 deformation graph 트래픽은 1MB 미만입니다(원시 메시/scene graph 스트리밍이 대역폭의 대부분을 차지).

## SLAM에서의 의미

Hydra-Multi는 로봇 팀 전체에서 협력적으로 3D scene graph를 구축한 최초의 시스템으로, Kimera/Hydra 계열을 단일 로봇에서 함대 규모의 의미론적 매핑으로 확장했습니다. 정렬-최적화-정합 백엔드는 loop closure를 보정하는 것과 동일한 강건한 기법(deformation graph 위의 GNC)이 로봇 간 노드 병합의 중재에도 사용될 수 있음을 보여줍니다. 이종 로봇 팀 결과는 아키텍처적으로 중요한 시사점을 제공합니다: scene graph 계층 구조 자체가 LIDAR 전용 로봇과 비전 기반 로봇이 하나의 세계 모델을 공유하게 하는 상호운용성 계층이라는 점이며, 이는 수색 구조, 창고 운영, 그리고 모든 다중 로봇 배치에 관련됩니다.

## 관련 문서

- [Hydra](hydra.md) — 각 로봇이 실행하는 단일 로봇 scene graph 시스템
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — 동일 연구실의 다중 로봇 metric-semantic SLAM
- [GNC](gnc.md) — 정렬, 최적화, 병합 검증의 근간이 되는 강건한 솔버
- [Inter-robot loop closure](../level-08-collaborative-slam/inter-robot-loop-closure.md) — 로봇 맵을 정렬하는 핵심 메커니즘
- [Map merging](../level-08-collaborative-slam/map-merging.md) — Hydra-Multi가 scene graph 수준에서 해결하는 일반적 문제
- [Centralized vs Decentralized](../level-08-collaborative-slam/centralized-vs-decentralized.md) — Hydra-Multi는 중앙집중식 경로를 택함
