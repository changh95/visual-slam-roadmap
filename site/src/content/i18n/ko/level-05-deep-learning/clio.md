# Clio

> Maggio (MIT SPARK) 2024 · [논문](https://arxiv.org/abs/2404.13696)

**한 줄 요약** — Clio는 실시간, 작업 기반의 개방형(open-set) 3D scene graph를 구축합니다: 자연어로 주어진 작업에 대해, 증분 Agglomerative Information Bottleneck으로 3D 프리미티브를 클러스터링하여, 맵이 작업에 필요한 — 그리고 필요한 세분도의 — 객체와 영역만을 유지하게 합니다.

## 문제

클래스 비의존적 세그멘테이션 (SAM)과 개방형 embedding (CLIP)은 로봇 맵이 더 이상 수십 또는 수백 개의 클래스에 국한되지 않음을 의미합니다 — 이제는 "수많은 객체와 무수한 의미론적 변형"을 포함할 수 있습니다. 이는 논문이 직접 제기하는 질문으로 이어집니다: 로봇이 맵에 포함해야 하는 객체와 의미론적 개념의 적절한 세분도는 무엇일까요? 피아노를 옮기는 로봇은 이를 하나의 객체로 매핑해야 하고, 피아노를 연주하는 로봇은 키가 필요하며, 피아노를 조율하는 로봇은 현과 튜닝 핀이 필요합니다. 기존의 개방형 파이프라인은 세그먼트 연관 임계값을 조정함으로써 암묵적으로 세분도를 선택합니다; Clio는 이 선택이 본질적으로 작업에 의존적이며 매핑 시스템 자체가 결정해야 한다고 주장합니다.

## 방법 및 아키텍처

**Information Bottleneck 공식화.** 작업 목록 $Y$ (CLIP으로 임베딩된 자연어 지시)와 작업 비의존적 프리미티브 $X$ (3D 객체 세그먼트와 장애물이 없는 장소)는 압축 문제를 정의합니다: 작업 관련 클러스터 $\tilde{X}$, 즉 할당 $p(\tilde{x}|x)$를 찾아 다음을 풉니다.

$$\min_{p(\tilde{x}|x)}\; I(X;\tilde{X})-\beta I(\tilde{X};Y)$$

이는 작업과의 상호 정보를 보존하면서 $X$를 압축하며, $\beta$가 압축과 작업 관련성 사이의 트레이드오프를 조정합니다.

**Agglomerative IB.** 클러스터는 프리미티브로 초기화됩니다; 각 단계에서 병합 가중치가 가장 작은 *인접한* 클러스터 쌍을

$$d_{ij}=\big(p(\tilde{x}_{i})+p(\tilde{x}_{j})\big)\cdot D_{\mathrm{JS}}\big[p(y|\tilde{x}_{i}),\,p(y|\tilde{x}_{j})\big]$$

병합합니다 ($D_{\mathrm{JS}}$ = Jensen-Shannon divergence), 그리고 부분 정보 손실

$$\delta(k)=\frac{I(\tilde{X}_{k};Y)-I(\tilde{X}_{k-1};Y)}{I(X;Y)}$$

이 임계값 $\bar{\delta}$를 초과하면 중단합니다. 작업 관련성 분포 $p(y|x_{i})$는 각 프리미티브와 각 작업의 CLIP embedding 간 코사인 유사도 $\phi(f_{x_{i}},f_{t_{j}})$로부터 나오며, *null task*로 보강되어 $\alpha=0.23$으로 채점됩니다: null task와 가장 유사한 프리미티브는 배경으로 사전에 가지치기(pruning)되며, 순위를 강조하기 위해 상위 $k$개의 작업 유사도만 유지됩니다 (재가중).

**증분 IB.** 클러스터링이 프리미티브 그래프의 연결 요소(connected component)별로 분해되고 $\delta(k)$가 컴포넌트별로 계산 가능하므로, 새로운 측정에 의해 영향을 받은 컴포넌트만 재클러스터링됩니다 — 따라서 복잡도가 환경 크기에 따라 증가하지 않아 온라인 동작이 가능합니다.

**시스템.** *프론트엔드*는 RGB-D 스트림에서 FastSAM + CLIP을 실행하여, 세그먼트를 시간적으로 3D 객체 프리미티브 트랙에 연관시키고 (코사인 유사도 $\geq\theta_{\text{track}}$, 3D IoU $\geq\gamma$, Khronos를 따름), Hydra의 GVD 기반 장소 서브그래프를 구축하며, 각 장소에 그 중심에서 보이는 모든 이미지의 평균 CLIP embedding을 할당합니다. *백엔드*는 객체-프리미티브 그래프 (엣지 = 겹치는 바운딩 박스)에 대해 증분 Agglomerative IB를 실행하여 작업 관련 객체를 생성하고, 장소 그래프에 대해서도 실행하여 장소를 의미론적 영역으로 클러스터링합니다; 모든 노드는 CLIP embedding을 유지하므로, 그래프는 계속 언어로 질의 가능한 상태를 유지합니다.

## 실험 결과

- 세 개의 자체 수집 및 주석 처리된 장면 (Office, Apartment, Cubicle, 각각 27/28/18개의 대상 객체)에서의 **개방형 객체 검색**: Clio-batch/Clio-online은 거의 모든 지표에서 1위 또는 2위를 차지하며, F1 0.55–0.80 (batch) vs 작업 인지형 ConceptGraphs 0.39–0.55, 작업 비의존형 ConceptGraphs 0.25–0.39.
- **컴팩트함**: Clio는 48–131개의 객체로 맵을 구성하는 반면, 클러스터링되지 않은 자체 프론트엔드 (Clio-Prim)는 1070–1880개를 유지합니다 — IB 클러스터링으로 자릿수 단위 압축을 달성하면서도 검색 정확도를 *향상*시킵니다.
- **속도**: 프레임당 약 0.23–0.31초로, ConceptGraphs (2.0–8.1초)보다 약 6배 빠르며 온라인으로 실행됩니다; 다섯 번째 데이터셋은 5층짜리 대학 건물을 다룹니다.
- **폐쇄형 sanity check** (Replica, 8개 장면): Clio-batch는 37.95 mAcc / 36.98 F-mIOU에 도달하며 ConceptGraphs는 40.63 / 35.95입니다 — 작업 기반 클러스터링이 폐쇄형 성능을 저하시키지 않습니다.
- **영역**: 방 레이블을 작업으로 사용할 때, Clio (평균 embedding)는 의미론적으로 정의된 Office (F1 0.76 vs 0.70)와 Building (0.81 vs 0.78) 장면에서 Hydra의 순수 기하학적 방 분할을 능가하지만, 기하학적으로 뚜렷한 Apartment (0.90 vs 0.69)에서는 기하학적 Hydra가 승리합니다.
- **로봇 시연**: 팔이 달린 Boston Dynamics Spot에서의 실시간 온보드 매핑; 언어 프롬프트를 통한 파지를 7회 시행하며, 장소 그래프 위에서 Dijkstra를 통해 유사도가 가장 높은 객체로 내비게이션합니다.

## SLAM에서의 의미

Clio는 "고정된 의미론적 세분도로 모든 것을 매핑"에서 "작업이 필요로 하는 것을 매핑"으로의 전환을 나타내며 — SLAM이 embodied AI와 융합됨에 따라 핵심적인 아이디어입니다. 이 IB 공식화는 세분도 문제에 임계값 조정이 아닌 원칙적인 정보이론적 근거를 제공하며, 컴포넌트별 증분 솔버는 foundation model 의미론 (FastSAM, CLIP)이 온보드 컴퓨팅상의 실시간 metric-semantic 매핑 스택 내부에 존재할 수 있음을 보여줍니다. 언어 기반 로봇에게, 작업 조건형 scene graph는 맵을 컴팩트하게 유지하면서도 계획과 조작에 충분한 상태를 유지시켜 줍니다.

## 관련 문서

- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md)
- [Hydra](hydra.md)
- [ConceptGraphs](conceptgraphs.md)
- [Khronos](khronos.md) — Clio의 객체-프리미티브 프론트엔드를 제공
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [SAM](sam.md)
