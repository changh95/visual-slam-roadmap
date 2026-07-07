# DPVO

> Teed 2023 · [논문](https://arxiv.org/abs/2208.04726)

**한 줄 요약** — DROID-SLAM의 패치 기반 경량 변형으로, 희소 패치 추적과 미분 가능 번들 조정을 결합하여 밀집 흐름과 동등하거나 그 이상의 성능을 훨씬 적은 메모리와 연산량으로 달성함을 보였습니다.

## 문제

밀집 광학 흐름(DROID-SLAM)에 기반한 딥 VO는 정확도를 크게 향상시켰지만, "밀집 흐름을 사용하는 것은 큰 계산 비용을 초래하여, 이러한 기존 방법들을 많은 활용 사례에서 비실용적으로 만듭니다": DROID의 VO 프론트엔드는 8.7 GB의 GPU 메모리를 필요로 하며, 급격한 움직임 중에는 프레임률이 붕괴됩니다. 이 분야는 그러한 비용이 필요하다고 가정했습니다 — 밀집 흐름이 "잘못된 매칭에 대한 추가적인 중복성을 제공한다"는 것입니다. Deep Patch Visual Odometry(DPVO)는 이 가정을 검증하고, 궁극적으로는 반증하고자 했습니다.

## 방법 및 아키텍처

**패치 표현.** 장면은 포즈 $\mathbf{T} \in \mathbb{SE}(3)^N$ 집합과 정사각형 $p \times p$ 이미지 패치들로 구성되며, 각 패치는 픽셀 좌표 $(\mathbf{x}, \mathbf{y})$와 패치가 공유하는 단일 역깊이 $\mathbf{d}$를 갖는 $4 \times p^2$ 동차 배열로 저장됩니다(DSO에서처럼 정면-평행 평면). 프레임 $i$의 패치 $k$는 다음과 같이 프레임 $j$로 재투영됩니다.

$$\mathbf{P}'_{kj} \sim \mathbf{K} \mathbf{T}_j \mathbf{T}_i^{-1} \mathbf{K}^{-1} \mathbf{P}_k$$

여기서 $\mathbf{K}$는 보정 행렬입니다. 이분 (bipartite) **패치 그래프**는 각 패치를 자신의 소스 프레임으로부터 거리 $r$ 이내에 있는 모든 프레임에 연결합니다. 패치 궤적은 이러한 재투영들의 집합이며, 프레임이 도착함에 따라 그래프는 확장/축소됩니다.

**특징과 패치.** 쌍둥이 잔차 네트워크가 1/4 해상도(2단계 피라미드)에서 매칭 및 컨텍스트 특징을 제공합니다. 패치는 *임의의* 픽셀 위치에서 잘려나오는데 — 프레임당 96개(Default) 또는 48개(Fast) — ablation 결과 이 방식이 SIFT, ORB, SuperPoint, 또는 기울기 기반 선택보다 더 잘 동작함이 확인되었습니다.

**순환 갱신 연산자.** 엣지마다 은닉 상태를 가진 패치 그래프에서 동작하며, 각 반복은 다음을 수행합니다: (1) *상관* — 재투영된 패치의 각 픽셀에 대해, 프레임 특징의 $7\times 7$ 격자와 내적을 계산합니다, $\mathbf{C}_{uv\alpha\beta} = \langle \mathbf{g}_{uv},\ \mathbf{f}(\mathbf{P}'_{kj}(u,v) + \Delta_{\alpha\beta}) \rangle$; (2) 각 패치 궤적을 따르는 *1D 시간적 컨볼루션*; (3) *소프트맥스 집계* — 패치나 프레임을 공유하는 엣지들 사이의 메시지 패싱으로, 밀집 방법들이 공간 컨볼루션에서 공짜로 얻는 것을 대체합니다; (4) *전이 블록* (게이트 잔차 유닛 + LayerNorm); (5) 엣지별로 2D 궤적 수정치 $\delta_{kj}$와 신뢰도 $\Sigma_{kj} \in (0,1)^2$를 예측하는 *팩터 헤드*.

**미분 가능 번들 조정.** 포즈와 패치 역깊이는 다음 식에 대해 (Schur complement, 역전파를 통과하는) 두 번의 가우스-뉴턴 반복으로 갱신됩니다.

$$\sum_{(k,j)\in\mathcal{E}} \left\lVert \hat{\omega}_{ij}(\mathbf{T}, \mathbf{P}_k) - [\hat{\mathbf{P}}'_{kj} + \delta_{kj}] \right\rVert^2_{\Sigma_{kj}}$$

이는 유도된 재투영과 예측된 패치 중심 재투영 사이의 마할라노비스 거리로, 훨씬 작아진 문제에 대해 DROID-SLAM의 DBA를 적용한 것입니다.

**학습 및 시스템.** TartanAir(24만 반복, RTX-3090 1대, 3.5일)에서 손실 $\mathcal{L} = 10\mathcal{L}_{pose} + 0.1\mathcal{L}_{flow}$로 종단 간 학습되며, 여기서 $\mathcal{L}_{pose}$는 Umeyama 스케일 정렬 이후의 상대 포즈를 비교합니다. 추론 시: 8프레임 초기화, 등속도 포즈 예측, 10 키프레임 윈도우(Fast는 7개)에 대해 프레임당 1회의 갱신 + 2회의 BA 반복, 흐름 기반 키프레임 제거. 루프 클로저나 전역 BA는 없습니다 — 이 간극은 DPV-SLAM이 채웁니다.

## 실험 결과

5회 실행의 중앙값; 두 가지 설정: RTX-3090에서 Default(60 FPS, 4.9 GB)와 Fast(120 FPS, 2.5 GB), DROID-VO는 40 FPS / 8.7 GB.

- **TartanAir** (ECCV 2020 SLAM 대회 테스트 분할): 평균 ATE 0.21 — 전체 DROID-SLAM(0.33)보다 40% 낮고, DROID-VO(0.58)보다 64% 낮음; 고전적 DSO는 평균 7.32, ORB-SLAM3는 14.38. 검증 분할에서는 AUC 0.80으로 DROID-SLAM의 0.71 대비, 4배 빠른 속도로 달성합니다.
- **EuRoC**: 평균 ATE 0.105 vs DROID-VO 0.186(43% 낮음); 120 FPS Fast 설정(0.129)조차도 대부분의 시퀀스에서 DROID-VO를 능가합니다.
- **TUM-RGBD** (freiburg1, mono): 평균 ATE 0.089 vs DROID-VO 0.098(9% 낮음), ORB-SLAM3와 DSO가 여러 시퀀스에서 실패하는 것과 달리 치명적인 실패가 전혀 없습니다.
- **안정성**: 프레임률이 거의 일정합니다(95%의 프레임에서 48 FPS 이상; Fast는 98 FPS 이상 유지)하는 반면, DROID-VO는 최악의 경우 11 FPS까지 떨어집니다 — 8.9배의 격차입니다.

## SLAM에서의 의미

DPVO는 미분 가능 BA 기반 시각 오도메트리를 오프라인의 GPU 집약적 작업이 아니라 실시간 로보틱스에 실용적으로 만들었으며, 희소 패치 위에서의 순환 갱신 설계는 MAC-VO와 DPV-SLAM 같은 후속 연구들(그리고 이벤트 카메라에 적용된 DEVO)에 채택되었습니다. 학습된 단안 VO의 표준적인 현대 베이스라인입니다. 이 시스템은 레벨 3(단안 시스템으로서)과 레벨 5(딥러닝 방법으로서) 모두에 등장합니다.

## 관련 문서

- [DROID-SLAM](droid-slam.md)
- [DPV-SLAM](dpv-slam.md)
- [MAC-VO](mac-vo.md)
- [DSO](dso.md) — 패치 표현의 원천
- [RAFT](../level-05-deep-learning/raft.md)
- [DEVO](../level-10-event-camera-slam/devo.md)
