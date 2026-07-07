### 关键概念
- **[集中式与分布式](level-08-collaborative-slam/centralized-vs-decentralized.md)** — 单一服务器对比点对点(peer-to-peer)地图合并
- **[跨机器人回环检测](level-08-collaborative-slam/inter-robot-loop-closure.md)** — 在不同机器人视角下进行地点识别
- **[通信约束](level-08-collaborative-slam/communication-constraints.md)** — 带宽受限下的地图共享，稀疏描述子
- **[地图合并](level-08-collaborative-slam/map-merging.md)** — 将不同机器人的子地图对齐合并为一张全局地图

### 系统

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**C2TAM**](level-08-collaborative-slam/c2tam.md) | [Riazuelo 2014](https://ieeexplore.ieee.org/document/6696630) | 基于云端的协同单目SLAM |
| [**CCM-SLAM**](level-08-collaborative-slam/ccm-slam.md) | [Schmuck & Chli 2019](https://github.com/v4rl-ucy/ccm_slam) | 集中式协同单目SLAM，对通信故障具有鲁棒性 |
| [**DOOR-SLAM**](level-08-collaborative-slam/door-slam.md) | [Lajoie 2020](https://arxiv.org/abs/1909.12198) | 分布式、抗外点的SLAM，具有成对一致性检验 |
| [**Kimera-Multi**](level-08-collaborative-slam/kimera-multi.md) | [Tian 2022](https://arxiv.org/abs/2106.14386) | 分布式多机器人度量-语义SLAM，网格重建 |
| [**Swarm-SLAM**](level-08-collaborative-slam/swarm-slam.md) | [Lajoie 2024](https://arxiv.org/abs/2301.06230) | 分布式、稀疏、可扩展的协同SLAM，支持LiDAR/立体/RGB-D |
| [**CoPeD**](level-08-collaborative-slam/coped.md) | [Zhou 2024](https://arxiv.org/abs/2405.14731) | 多机器人协同感知数据集(真实场景，空中+地面机器人) |
| [**maplab 2.0**](level-08-collaborative-slam/maplab-2-0.md) | [Cramariuc 2023](https://arxiv.org/abs/2212.00654) | 多会话、多机器人视觉惯性建图 |
