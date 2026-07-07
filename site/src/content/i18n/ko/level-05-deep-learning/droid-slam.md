# DROID-SLAM

> Teed 2021 · [논문](https://arxiv.org/abs/2108.10869)

**한 줄 요약** — 밀집 광학 흐름을 반복적으로 정제하고, 미분 가능한 Dense Bundle Adjustment 레이어를 통해 포즈와 깊이를 풀어내는 종단 간 학습 SLAM 시스템으로, 고전적 시스템 대비 치명적 실패를 극적으로 줄입니다.

## 문제

고전적 SLAM 파이프라인은 수작업으로 설계된 특징 추출 및 매칭에 의존하는데, 이는 로봇이 가장 필요로 하는 바로 그 상황 — 질감이 없는 표면, 모션 블러, 반복적인 구조 — 에서 취약합니다: "실패는 여러 형태로 나타나는데, 특징 추적의 손실, 최적화 알고리즘의 발산, 드리프트의 누적 등이 있습니다." 이전의 학습 기반 시스템(DeepVO, TartanVO, DeepV2D, BA-Net)은 완전한 번들 조정, 루프 클로저, 전역 정제가 없기 때문에 "일반적인 벤치마크에서 고전적인 대안들의 정확도에 크게 미치지 못합니다." DROID-SLAM의 질문: 종단 간 학습이 가능한 시스템이 SLAM을 정확하게 만드는 최적화 구조를 유지하면서, 고전적 SLAM을 취약하게 만드는 부분들을 학습으로 대체할 수 있을까?

## 방법 및 아키텍처

**상태와 프레임 그래프.** 각 이미지 $t$에 대해 시스템은 포즈 $\mathbf{G}_t \in SE(3)$와 역깊이 지도 $\mathbf{d}_t \in \mathbb{R}_+^{H\times W}$를 유지합니다. 프레임 그래프 $(\mathcal{V},\mathcal{E})$는 공시야 (co-visible) 프레임들을 연결합니다. 카메라가 이미 매핑된 영역을 재방문할 때 장거리 엣지가 추가되어, 동일한 메커니즘 안에서 루프 클로저가 이루어집니다.

**특징과 상관관계.** RAFT 스타일의 특징 및 컨텍스트 네트워크가 1/8 해상도의 지도를 생성합니다. 각 엣지 $(i,j)\in\mathcal{E}$에 대해, 모든 쌍의 내적으로부터 4D 상관 볼륨이 구성됩니다. $C^{ij}_{u_1 v_1 u_2 v_2} = \langle g_\theta(I_i)_{u_1 v_1},\, g_\theta(I_j)_{u_2 v_2} \rangle$, 이는 4단계 피라미드로 풀링되어 반경 $r$의 룩업 연산자로 인덱싱됩니다.

**순환 갱신 연산자.** 각 반복은 먼저 현재 기하학에 의해 유도되는 밀집 대응 필드를 계산합니다.

$$\mathbf{p}_{ij} = \Pi_c(\mathbf{G}_{ij} \circ \Pi_c^{-1}(\mathbf{p}_i, \mathbf{d}_i)), \qquad \mathbf{G}_{ij} = \mathbf{G}_j \circ \mathbf{G}_i^{-1}$$

여기서 $\Pi_c$는 카메라 투영이고 $\mathbf{p}_i$는 픽셀 격자입니다. $\mathbf{p}_{ij}$에서의 상관 룩업, 유도된 흐름, 이전 BA 잔차가 $3\times 3$ ConvGRU에 입력되며, 이는 흐름 수정치 $\mathbf{r}_{ij}$와 신뢰도 $\mathbf{w}_{ij} \in \mathbb{R}_+^{H\times W\times 2}$를 출력하여 보정된 대응관계 $\mathbf{p}^*_{ij} = \mathbf{r}_{ij} + \mathbf{p}_{ij}$를 만들고, 픽셀별 댐핑 인자 $\lambda$도 함께 출력합니다.

**Dense Bundle Adjustment (DBA) 레이어.** 흐름 수정치는 전체 프레임 그래프에 대해 다음을 최소화함으로써 포즈/깊이 갱신치로 매핑됩니다.

$$\mathbf{E}(\mathbf{G}', \mathbf{d}') = \sum_{(i,j)\in\mathcal{E}} \left\lVert \mathbf{p}^*_{ij} - \Pi_c(\mathbf{G}'_{ij} \circ \Pi_c^{-1}(\mathbf{p}_i, \mathbf{d}'_i)) \right\rVert^2_{\Sigma_{ij}}, \qquad \Sigma_{ij} = \operatorname{diag} \mathbf{w}_{ij}$$

이는 신뢰도로 가중된(마할라노비스) 재투영 오차입니다. 한 번의 가우스-뉴턴 단계는 Schur complement로 풀리는데 — 깊이 블록 $\mathbf{C}$가 대각이므로 $\Delta\boldsymbol{\xi} = [\mathbf{B} - \mathbf{E}\mathbf{C}^{-1}\mathbf{E}^{T}]^{-1}(\mathbf{v} - \mathbf{E}\mathbf{C}^{-1}\mathbf{w})$ 그리고 $\Delta\mathbf{d} = \mathbf{C}^{-1}(\mathbf{w} - \mathbf{E}^{T}\Delta\boldsymbol{\xi})$가 되며 — retraction으로 적용됩니다: $\mathbf{G}^{(k+1)} = \operatorname{Exp}(\Delta\boldsymbol{\xi}^{(k)}) \circ \mathbf{G}^{(k)}$, $\mathbf{d}^{(k+1)} = \Delta\mathbf{d}^{(k)} + \mathbf{d}^{(k)}$. 이 레이어는 미분 가능하므로 전체 루프가 종단 간으로 학습됩니다(7프레임 TartanAir 클립에 대해 포즈 손실 $\mathcal{L}_{pose} = \sum_i \lVert \operatorname{Log}_{SE3}(\mathbf{T}_i^{-1}\cdot\mathbf{G}_i) \rVert_2$와 흐름 손실, 15회의 풀린(unrolled) 반복, RTX-3090 4대로 1주일).

**시스템.** 프론트엔드 스레드는 들어오는 프레임을 추적하고 키프레임 윈도우에 대해 지역 BA를 실행합니다. 백엔드 스레드는 프레임 그래프를 재구성하고 전체 키프레임 히스토리에 대해 전역 BA를 실행합니다(커스텀 블록-희소 CUDA 커널). 스테레오는 단순히 고정된 기저선의 카메라 간 엣지를 추가하고, RGB-D는 목적함수에 깊이 잔차 항을 추가합니다 — 동일한 단안 학습 가중치가 세 가지 모달리티를 모두 처리합니다.

## 실험 결과

한 번 학습(단안 전용, 합성 TartanAir), 4개 데이터셋과 3개 모달리티에서 제로샷 평가:

- **TartanAir** (단안, Hard 테스트 세트): 평균 ATE 0.24 m vs TartanVO 1.92, DeepV2D 5.03 — 각각 8배, 20배 낮으며 실패는 0건. ECCV 2020 SLAM 대회 분할에서는: 0.129(단안)와 0.047(스테레오)로, 최상위 COLMAP 기반 제출들보다 62%/60% 낮은 오차를 16배 빠른 속도로 달성합니다.
- **EuRoC** (단안): 11개 시퀀스 전체에서 평균 ATE 0.022 m, 실패 0건 — 이전의 무실패 방법보다 82% 낮고, ORB-SLAM3가 완료하는 11개 중 10개 시퀀스에서 ORB-SLAM3보다 43% 낮음; 스테레오는 ORB-SLAM3 대비 오차를 71% 줄입니다.
- **TUM-RGBD** (freiburg1, mono): 평균 ATE 0.038 m, ORB-SLAM2/3가 대부분에서 실패하는 9개 시퀀스 모두를 추적; DeepFactors보다 83% 낮고 DeepV2D보다 90% 낮은 오차입니다.
- **ETH3D-SLAM** (RGB-D): 학습 및 테스트 리더보드에서 1위(테스트 AUC 207.79 vs BAD-SLAM의 153.47), 32개 데이터셋 중 30개를 성공적으로 추적한 반면 그 다음으로 좋은 방법은 32개 중 19개.
- **비용**: 실시간 동작에는 RTX-3090 2대가 필요합니다(EuRoC에서 약 20 fps); 긴 비디오에서는 백엔드가 최대 24 GB의 GPU 메모리를 필요로 할 수 있으며 — 이것이 DPVO/DPV-SLAM의 명시적인 동기가 되었습니다.

## SLAM에서의 의미

DROID-SLAM은 학습 기반 SLAM을 위한 미분 가능 BA 패러다임을 확립했고, 학습된 시스템이 수십 년간 수작업으로 설계된 SLAM 파이프라인과 동등하거나 이를 능가할 수 있음을 입증하여 학습 기반 SLAM 연구의 물결을 촉발했습니다. 이 시스템의 순환 갱신 + DBA 아키텍처는 DPVO, DPV-SLAM, MAC-VO의 직접적인 조상이며, NeRF-SLAM과 GO-SLAM 같은 시스템 내부의 포즈/깊이 프론트엔드로도 활용됩니다.

## 관련 문서

- [RAFT](raft.md)
- [DPVO](dpvo.md)
- [TartanVO](tartanvo.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
- [NeRF-SLAM](nerf-slam.md)
- [GO-SLAM](go-slam.md)
