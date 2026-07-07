# Hydra

> Hughes (MIT SPARK) 2022 · [논문](https://arxiv.org/abs/2201.13360)

**한 줄 요약** — 센서 데이터로부터 계층적 3D scene graph(메시 → 객체 → 장소 → 방 → 건물)를 점진적으로 구축하고, loop closure가 발생하면 모든 레이어를 동시에 최적화하는 최초의 실시간 Spatial Perception System입니다.

## 문제

3D scene graph는 다중 추상화 수준의 공간 개념을 노드로 하는 계층적 그래프인 강력한 고수준 표현으로 막 부상했지만, 이전 시스템들은 이를 오프라인으로 구축했습니다: Kimera의 3D Dynamic Scene Graphs와 Armeni et al.은 수 분의 배치 처리를 필요로 하고, *전체* 환경의 ESDF에 의존하며(메모리 확장성이 나쁨), loop closure가 발생할 때마다 그래프를 처음부터 재구축해야 합니다. 저자들의 표현대로, 로봇에 탑재하여 이러한 "정신 모델"을 실시간으로 구축하는 방법은 미지의 영역이었습니다 — scene graph에서 loop closure가 무엇을 의미하는지조차 포함해서, 궤적을 보정하려면 메시 위의 모든 레이어를 일관되게 보정해야 하기 때문입니다.

## 방법 및 아키텍처

**레이어 1–3을 활성 윈도우 내에서 점진적으로.** Hydra는 로봇 주변의 사용자 설정 반경(8m) 내로 Voxblox TSDF/ESDF를 공간적으로 윈도우화하여 메모리를 제한합니다. 윈도우 내에서: marching cubes가 zero-crossing "부모" voxel에 레이블을 부여하며 metric-semantic 메시를 추출합니다. 객체는 메시 정점의 클래스별 유클리드 클러스터링으로 형성됩니다(중심점 + 바운딩 박스, 중심점이 다른 노드의 박스 안에 떨어지면 기존 노드와 병합). 장소는 Generalized Voronoi Diagram에서 추출됩니다 — 적어도 2개의 장애물로부터 등거리에 있는 voxel로, ESDF brushfire 갱신의 부산물로 얻어지며, 점진적으로 그래프로 희소화됩니다(기저점이 4개 이상이거나 코너 템플릿을 가진 voxel에 노드를 배치; flood-fill 레이블링으로 엣지를 생성하며, 직선 엣지가 GVD에서 벗어나는 곳은 분할). 이는 환경 크기와 무관하게 상수 시간에 실행됩니다.

**레이어 4: 위상 구조로부터의 방.** 장애물을 거리 $\delta$만큼 팽창시키면 문이 닫히고 방들이 분리됩니다. 각 장소 노드가 자신의 장애물 거리를 저장하고 있으므로, 팽창은 장소 서브그래프 ${\cal G}_{p}$에 직접 매핑됩니다. Hydra는 $[0.45, 1.2]$m 범위에서 10개의 팽창 거리를 순회하며, 가지치기된 각 그래프 ${\cal G}_{p,\delta}$의 연결 요소 수를 세고, 중앙값 개수 $n_{r}$을 취하여 $n_{r}$개의 연결 요소를 가진 가장 큰 ${\cal G}_{p,\delta^{\star}}$를 선택하고, 나머지 노드는 해당 연결 요소를 시드로 하는 greedy modularity 기반 커뮤니티 검출로 할당합니다 — 배치 ESDF 처리 대신 밀리초 단위로 완료됩니다.

**계층적 loop closure.** 각 agent(키프레임) 노드는 descriptor 계층을 가집니다: DBoW2 외관 단어, 주변 객체 레이블의 히스토그램, 주변 장소 장애물 거리의 히스토그램. 검출은 *top-down*으로 진행됩니다(장소 → 객체 → 외관). 검증은 *bottom-up*으로 진행되며, 먼저 시각 특징에 대한 RANSAC을 수행하고, 시각 검증이 실패하면 매칭된 객체에 대한 TEASER++ 정합을 수행합니다 — 그래서 시점이나 조명 변화로 매칭이 깨져도 의미론적으로 검증이 가능합니다.

**Scene graph 최적화.** 프론트엔드는 전체 그래프를 조립하고 메시를 제어점(octree 정점 클러스터링)으로 서브샘플링합니다. 백엔드는 embedded deformation graph를 형성합니다 — agent 포즈 그래프 + 메시 제어점 + 장소의 최소 신장 트리 — 레이어 간 엣지로 연결되며, rigid-transform 재구성을 이용해 GTSAM의 GNC 솔버로 pose-graph 최적화 문제로 풀고, 이 과정에서 이상치 loop closure도 함께 걸러냅니다. 나머지 메시는 재보간되고, 객체 중심점/박스가 재계산되며, 겹치는 노드가 병합되고(0.4m 이내의 장소, 동일 레이블이며 박스가 포함 관계인 객체), 방이 재검출됩니다. 방 정확도는 voxel 단위로 다음과 같이 채점됩니다.

$$\text{Precision}=\frac{1}{|R_{e}|}\sum_{r_{e}\in R_{e}}\max_{r_{g}\in R_{g}}\frac{|r_{g}\cap r_{e}|}{|r_{e}|},\qquad \text{Recall}=\frac{1}{|R_{g}|}\sum_{r_{g}\in R_{g}}\max_{r_{e}\in R_{e}}\frac{|r_{e}\cap r_{g}|}{|r_{g}|}$$

**빠른 사고와 느린 사고.** Hydra는 프레임 레이트의 초기 인지(특징 추적, 세그멘테이션), 1초 미만의 중간 수준 모듈(메시, 객체, 장소, 프론트엔드), 느린 고수준 모듈(loop closure, 백엔드 최적화, 방 검출)을 병렬화합니다 — 2D 세그멘테이션 네트워크를 제외하면 모두 CPU에서 실행됩니다.

## 실험 결과

- uHumans2(시뮬레이션된 아파트, 오피스, 지하철)와 실제 SidPac 데이터셋(Kinect Azure + RealSense T265, 평균 약 400m 이동의 다층 건물 녹화 2개)에서 평가되었습니다.
- Ground-truth 포즈가 주어졌을 때, Hydra의 온라인 그래프는 배치 오프라인 베이스라인과 비교 가능합니다: 객체의 80–100%를 찾음/정확했고, 장소 위치 오차는 25cm 미만입니다.
- Scene graph loop closure(SG-LC)는 허용적인 시각 기반 DBoW2+ORB 베이스라인에 비해 10cm 및 1도 오차 내에서 약 **2배 더 많은 loop closure**를 산출하며, 큰 규모의 SidPac 장면에서 시각 기반 loop closure보다 훨씬 나은 객체 정확도를 보입니다.
- 방 세분화: SidPac 3–4층에서 Kimera는 precision 0.88 / **recall 0.06**으로 저조합니다(10개 방 중 2개만 세분화). 반면 Hydra는 다층 장면을 포함해 일관된 precision과 recall을 유지합니다.
- 실행 시간: 배치 베이스라인은 중간 규모 장면에서도 갱신당 40초를 초과하지만, Hydra의 중간 수준 비용은 일정하게 유지됩니다. Nvidia Xavier NX에서: 5Hz 키프레임 레이트 목표에 대해 객체 $75\pm 35$ms, 장소 $33\pm 6$ms, 방 $55\pm 41$ms입니다.

## SLAM에서의 의미

Hydra는 3D Dynamic Scene Graph를 오프라인 구성물에서 실시간 spatial perception system으로 전환시켰으며, embedded deformation graph 백엔드는 메시, 장소, 객체, 방 전체 scene graph를 궤적과 함께 공동으로 최적화하는 최초의 알고리즘으로, pose-graph 최적화를 계층적 맵으로 일반화합니다. 5계층 계층 구조는 사실상의 표준 Spatial AI 표현이 되었으며 MIT SPARK 생태계의 기반이 되었습니다 — Hydra-Multi(다중 로봇), Clio(작업 기반 개방형 그래프), Khronos(시공간적 동역학) — 여러 추상화 수준에서 로봇이 언어 명령을 받을 수 있게 합니다.

## 관련 문서

- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — Hydra가 실시간화한 scene graph 개념
- [Hydra-Multi](hydra-multi.md) — 다중 로봇 확장
- [Clio](clio.md) — 작업 기반 개방형 scene graph
- [Khronos](khronos.md) — 동적 장면을 위한 시공간적 확장
- [ConceptGraphs](conceptgraphs.md) — 개방형 어휘 3D scene graph
- [GNC](gnc.md) — scene graph 백엔드에 사용되는 강건한 솔버
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — deformation graph 보정이 확장하는 고전적 기법
