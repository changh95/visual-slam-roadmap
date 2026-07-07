### 핵심 개념
- **[중앙집중식 vs 분산식](level-08-collaborative-slam/centralized-vs-decentralized.md)** — 단일 서버 vs 피어-투-피어 맵 병합
- **[로봇 간 루프 클로저](level-08-collaborative-slam/inter-robot-loop-closure.md)** — 서로 다른 시점을 가진 로봇들 간의 장소 인식
- **[통신 제약](level-08-collaborative-slam/communication-constraints.md)** — 대역폭이 제한된 맵 공유, 희소 디스크립터
- **[맵 병합](level-08-collaborative-slam/map-merging.md)** — 서로 다른 로봇의 서브맵을 전역 맵으로 정렬하는 것

### 시스템

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**C2TAM**](level-08-collaborative-slam/c2tam.md) | [Riazuelo 2014](https://ieeexplore.ieee.org/document/6696630) | 클라우드 기반 협업 단안 SLAM |
| [**CCM-SLAM**](level-08-collaborative-slam/ccm-slam.md) | [Schmuck & Chli 2019](https://github.com/v4rl-ucy/ccm_slam) | 중앙집중식 협업 단안 SLAM, 통신 장애에 강건 |
| [**DOOR-SLAM**](level-08-collaborative-slam/door-slam.md) | [Lajoie 2020](https://arxiv.org/abs/1909.12198) | 쌍별 일관성을 활용한 분산형, 이상치에 강인한 SLAM |
| [**Kimera-Multi**](level-08-collaborative-slam/kimera-multi.md) | [Tian 2022](https://arxiv.org/abs/2106.14386) | 분산형 멀티로봇 메트릭-시맨틱 SLAM, 메시 재구성 |
| [**Swarm-SLAM**](level-08-collaborative-slam/swarm-slam.md) | [Lajoie 2024](https://arxiv.org/abs/2301.06230) | 분산형, 희소, 확장 가능한 협업 SLAM, LiDAR/스테레오/RGB-D 지원 |
| [**CoPeD**](level-08-collaborative-slam/coped.md) | [Zhou 2024](https://arxiv.org/abs/2405.14731) | 멀티로봇 협업 인식 데이터셋 (실제 환경, 공중 + 지상 로봇) |
| [**maplab 2.0**](level-08-collaborative-slam/maplab-2-0.md) | [Cramariuc 2023](https://arxiv.org/abs/2212.00654) | 다중 세션, 멀티로봇 시각-관성 매핑 |
