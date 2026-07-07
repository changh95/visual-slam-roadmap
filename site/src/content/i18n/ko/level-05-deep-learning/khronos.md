# Khronos

> Schmid (MIT SPARK) 2024 · [논문](https://arxiv.org/abs/2402.13817)

**한 줄 요약** — Hydra의 scene graph 계열을 동적 환경으로 확장하는 통합 시공간적 metric-semantic SLAM으로, 객체의 전체 이력을 추적합니다: 언제 나타났는지, 이동했는지, 또는 제거되었는지를 추적합니다.

## 문제

동적(dynamic) SLAM 연구는 변화하는 환경에서 로봇 포즈를 정확하게 추정하는 데 큰 진전을 이루었지만, 환경 자체의 밀집 *시공간적* 표현을 구축하는 데는 훨씬 적은 강조가 있었습니다. 장기 자율성은 단기적 동역학(지나가는 사람)과 장기적 변화(방문 사이에 재배치된 가구) 모두에 대한 추론을 필요로 하며, 이동 객체 추적과 변화 검출이라는 두 연구 흐름은 서로 연결되어 있지 않았습니다. Khronos는 시공간적 metric-semantic SLAM (SMS) 문제를 정의합니다: 현재 시각 $T$마다, *모든* 이전 시각 $t \leq T$에서의 장면 상태를 추정합니다.

## 방법 및 아키텍처

장면은 객체 집합 $O_i^t = \{\Omega_i^t,\ T_{WO_i}^t,\ L_i\}$로 표현됩니다(표면, 포즈, 의미론적 레이블; 배경은 단일 정적 객체 $O_{BG}$입니다), 표면 측정치 $Z$와 오도메트리 $\Phi$를 통해 관측됩니다. SMS는 MAP 추정으로 정식화됩니다:

$$O^{\star}, X^{\star} = \arg\max_{O,X}\ \mathbb{P}(O, X \mid Z, \Phi).$$

이는 직접적으로는 계산이 불가능합니다 — 측정치와 맵 사이의 불일치는 노이즈, 드리프트, 움직임, *또는* 변화로부터 발생할 수 있습니다. 핵심 가정은 **시공간적 지역 일관성(spatio-temporal local consistency)**입니다: 짧은 구간 $\tau$에 걸쳐, 상태 추정 오차와 장면 변화 모두가 작다는 것입니다. 이는 Khronos가 잠재적인 **객체 조각(fragment)** $Y_k = \{\Omega_k,\ T_{RY_k},\ L_k\}$ — 지역적으로 일관된 시간 윈도우에 걸쳐 축적된 객체의 부분 관측치 — 를 도입하고 문제를 인수분해할 수 있게 합니다(식 16):

$$\mathbb{P}(O, X, Y, A \mid Z, \Phi) = \underbrace{\prod_i \mathbb{P}(O_i \mid \bar{Y}_i, X)}_{\text{조각 정합}}\ \underbrace{\mathbb{P}(X, A \mid Y, \Phi)}_{\text{SLAM}}\ \underbrace{\prod_k \mathbb{P}(Y_k \mid \bar{Z}_k, \bar{\Phi}_k)}_{\text{지역 추정}},$$

여기서 $A$는 조각을 객체와 연관시킵니다. 단기 동역학은 전적으로 빠른 지역 항(term)에 존재하며, 장기 변화는 더 느린 전역 항에 존재합니다. 시스템은 세 가지 구성 요소로 이루어집니다:

- **활성 윈도우(지역 추정).** 점진적 TSDF 융합이 배경 메시 $\Omega_{BG}$를 재구성합니다. 프레임별 후보 객체는 의미론적 마스크와 기하학적 움직임 검출(이전에 관측된 자유 공간으로 떨어지는 점은 동적이어야 함)로부터 얻어집니다. 관측치는 부피 IoU에 의해 객체 가설에 greedy하게 연관됩니다. 관측 횟수가 $\tau_Z = 15$ 미만인 가설, 또는 이동 거리가 $\tau_D = 1$m 미만인 "동적" 가설은 거부됩니다. 정적 객체는 적응 해상도 메시가 되고, 동적 객체는 포인트 클라우드 시퀀스가 됩니다.
- **전역 최적화.** 로봇 포즈 $X$, 메시 제어점 $P_M$, 조각 포즈 $T_{WY_k}$(각각 처음/마지막으로 관측된 포즈에 연결됨) 위의 deformation graph가, 후보 엣지(조각-조각 연관 $\mathcal{E}_{YY}$와 loop closure $\mathcal{E}_{LC}$)에 대한 이진 스위치 $\omega_{ij}$를 사용하는 강건한 pose-graph 최적화로 풀립니다:

$$\mathcal{T}^{*} = \arg\min_{\mathbf{T}_1,\dots,\mathbf{T}_n,\ \omega_{ij}\in\{0,1\}} \sum_{(i,j)\in\mathcal{E}_{obs}} \lVert \mathbf{T}_i^{-1}\mathbf{T}_j \boxminus \bar{\mathbf{T}}_{ij} \rVert^2_{\Lambda_{ij}} + \sum_{(i,j)\in\mathcal{E}_{can}} \Big( \omega_{ij} \lVert \mathbf{T}_i^{-1}\mathbf{T}_j \boxminus \bar{\mathbf{T}}_{ij} \rVert^2_{\Lambda_{ij}} + (1-\omega_{ij})\,\bar{c}^2 \Big).$$

- **정합(변화 검출).** "광선 라이브러리(library of rays)"는 각 배경 정점 $\mathbf{p}_v$에 대해 이를 관측한 로봇 위치 $\mathbf{p}_r$을 저장합니다. 조각 표면 점 $\mathbf{p}_q$를 근처 광선에 대해 질의하면, 광선으로부터의 이탈 거리 $d_r = \lVert (\mathbf{p}_q - \mathbf{p}_r) \times (\mathbf{p}_r - \mathbf{p}_v) \rVert / \lVert \mathbf{p}_q - \mathbf{p}_r \rVert$와 광선을 따른 깊이 $d_d$가 얻어집니다: 깊이가 더 짧으면 *부재의 증거*이고, 깊이가 유사하면(30cm 이내) 존재의 증거입니다. 객체의 출현/소멸 시각은 마지막 부재 증거와 첫 존재 증거 사이 윈도우의 중간 시점으로 추정됩니다(균등 사전분포 하에서 최소 예상 오차).

## 실험 결과

밀집한 시공간적 ground truth가 있는 두 개의 사실적인 TESSE 시뮬레이션 장면 — **Apartment**(87초, 약 39m, 정적 64개 + 동적 10개 객체, 6개의 장기 변화)와 **Office**(217초, 약 181m, 196개 객체, 동적 6개, 8개 변화) — 각각 ground-truth 포즈와 Kimera VIO 오도메트리 모두에서, Hydra, Dynablox, Panoptic Mapping과 대비하여 평가(모두 8cm 해상도, 5m 범위):

- **Apartment (GT 포즈), F1 점수:** 배경 재구성 91.2(Hydra 87.7, Dynablox 86.2, Panoptic Mapping 70.3); 객체 75.3(Hydra 42.3, Panoptic Mapping 64.3); 동적 객체 84.1(Dynablox 61.3); 변화 64.6(Panoptic Mapping 56.1).
- **드리프트가 있는 Kimera 오도메트리를 사용한 Office:** Khronos는 최고의 배경(F1 67.6)과 객체(F1 73.1) 점수를 유지합니다. Panoptic Mapping의 변화 검출 precision은 Khronos의 결합 시공간적 최적화 및 변형 가능한 변화 검출 없이는 붕괴합니다(9.6 대 Khronos 25.8).
- **세그멘테이션에 무관함:** GT 의미론을 개방형 SAM + CLIP 프론트엔드로 대체해도 높은 성능이 유지됩니다(Apartment GT 포즈: 변화 F1 64.4 대 64.6).
- **실제 로봇:** Jackal UGV(중2층 장면)와 대학 건물 한 층 전체를 이동한 Boston Dynamics Spot에서, Khronos는 계획된 객체의 출현/소멸과 단기 움직임(사람, 밀린 카트)을 정확히 포착합니다.
- **실시간성:** 인수분해 덕분에 거의 상수 시간 복잡도로, 활성 윈도우 프레임 처리는 45.5 ± 9.2ms(평균 22.2FPS)가 소요됩니다.

## SLAM에서의 의미

거의 모든 고전적 SLAM은 정적 세계를 가정하며, 이는 가정, 창고, 오피스에서 객체가 끊임없이 움직이는 장기 운용 환경에서 무너집니다. Khronos는 동역학을 걸러내야 할 대상이 아니라 *모델화하고 기억해야* 할 대상으로 재구성하며, 조각 인수분해는 이를 실시간으로 수행하는 방법을 보여줍니다: 센서 노이즈, 로봇 드리프트, 움직임, 장면 변화가 각각 자신만의 항을 가집니다. 이는 Kimera → Hydra 계보의 metric-semantic scene graph 위에서 장기 자율성을 위한 핵심 구성 요소입니다.

## 관련 문서

- [Hydra](hydra.md) — Khronos가 확장하는 실시간 scene graph 시스템
- [Clio](clio.md) — 동일 연구실의 작업 기반 개방형 scene graph
- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — 동적 scene graph 개념의 기원
- [SAM 2](sam-2.md) — 동적 개체 추적에 유용한 비디오 세그멘테이션
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — Khronos가 넘어서는 고전적인 "동역학을 걸러내는" 접근법
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — 식 17의 근간이 되는 switchable-constraint 기법
