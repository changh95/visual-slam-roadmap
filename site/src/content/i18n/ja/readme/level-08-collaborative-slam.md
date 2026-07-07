### キーコンセプト
- **[集中型対分散型](level-08-collaborative-slam/centralized-vs-decentralized.md)** — 単一サーバー対ピアツーピアの地図統合
- **[ロボット間ループクロージング](level-08-collaborative-slam/inter-robot-loop-closure.md)** — 異なる視点を持つロボット間での場所認識
- **[通信制約](level-08-collaborative-slam/communication-constraints.md)** — 帯域制限下での地図共有、疎な記述子
- **[地図統合](level-08-collaborative-slam/map-merging.md)** — 異なるロボットのサブマップをグローバル地図へ位置合わせすること

### システム

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**C2TAM**](level-08-collaborative-slam/c2tam.md) | [Riazuelo 2014](https://ieeexplore.ieee.org/document/6696630) | クラウドベースの協調型モノキュラSLAM |
| [**CCM-SLAM**](level-08-collaborative-slam/ccm-slam.md) | [Schmuck & Chli 2019](https://github.com/v4rl-ucy/ccm_slam) | 集中型の協調型モノキュラSLAM、通信障害にロバスト |
| [**DOOR-SLAM**](level-08-collaborative-slam/door-slam.md) | [Lajoie 2020](https://arxiv.org/abs/1909.12198) | 分散型で外れ値に耐性のあるSLAM、ペアワイズ整合性を利用 |
| [**Kimera-Multi**](level-08-collaborative-slam/kimera-multi.md) | [Tian 2022](https://arxiv.org/abs/2106.14386) | 分散マルチロボットのメトリック・セマンティックSLAM、メッシュ再構成 |
| [**Swarm-SLAM**](level-08-collaborative-slam/swarm-slam.md) | [Lajoie 2024](https://arxiv.org/abs/2301.06230) | 分散型・疎・スケーラブルなC-SLAM、LiDAR/ステレオ/RGB-D対応 |
| [**CoPeD**](level-08-collaborative-slam/coped.md) | [Zhou 2024](https://arxiv.org/abs/2405.14731) | マルチロボット協調知覚データセット(実世界、空中+地上ロボット) |
| [**maplab 2.0**](level-08-collaborative-slam/maplab-2-0.md) | [Cramariuc 2023](https://arxiv.org/abs/2212.00654) | マルチセッション・マルチロボットの視覚慣性マッピング |
