### 关键概念
- **[LiDAR-视觉-惯性融合(LVI)](level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)** — 三重融合以实现鲁棒的室外SLAM
- **[紧耦合LiDAR-相机融合](level-09-lidar-visual-lidar-slam/tightly-coupled-lidar-camera.md)** — 点云与视觉特征的联合优化
- **[直接法LiDAR-相机对齐](level-09-lidar-visual-lidar-slam/direct-lidar-camera-alignment.md)** — 无需特征提取的光度/几何对齐
- **[退化处理](level-09-lidar-visual-lidar-slam/degradation-handling.md)** — 当某一模态失效时的平稳降级(例如雨天中的LiDAR、黑暗中的相机)
- **[距离图像(Range image)](level-09-lidar-visual-lidar-slam/range-image.md)** — LiDAR扫描的2D投影，用于高效处理(SuMa, RangeNet++)

### LiDAR / LiDAR惯性SLAM

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**LOAM**](level-09-lidar-visual-lidar-slam/loam.md) | [Zhang 2014](https://www.ri.cmu.edu/pub_files/2014/7/Ji_LidarMapping_RSS2014_v8.pdf) | LiDAR里程计与建图(奠基性工作)，边缘特征+平面特征 |
| [**SuMa**](level-09-lidar-visual-lidar-slam/suma.md) | [Behley (Bonn) 2018](http://www.roboticsproceedings.org/rss14/p16.pdf) | 基于面元的LiDAR SLAM，在距离图像上的投影式ICP |
| [**SuMa++**](level-09-lidar-visual-lidar-slam/sumapp.md) | [Chen (Bonn) 2019](https://www.ipb.uni-bonn.de/pdfs/chen2019iros.pdf) | SuMa+RangeNet++语义信息，语义加权ICP，动态物体过滤 |
| [**LIO-SAM**](level-09-lidar-visual-lidar-slam/lio-sam.md) | [Shan 2020](https://arxiv.org/abs/2007.00258) | 紧耦合LiDAR惯性，因子图，GPS融合 |
| [**FAST-LIO2**](level-09-lidar-visual-lidar-slam/fast-lio2.md) | [Xu 2022](https://arxiv.org/abs/2107.06829) | 直接法LiDAR惯性，ikd-Tree，极快速度 |
| [**PIN-SLAM**](level-09-lidar-visual-lidar-slam/pin-slam.md) | [Pan (Bonn) 2024](https://arxiv.org/abs/2401.09101) | 神经点云LiDAR SLAM，点到SDF配准，用于回环检测的弹性地图形变 |

### 视觉-LiDAR融合SLAM

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**LVI-SAM**](level-09-lidar-visual-lidar-slam/lvi-sam.md) | [Shan 2021](https://arxiv.org/abs/2104.10831) | 基于因子图的LiDAR-视觉-惯性融合，LIO-SAM+VINS-Mono |
| [**R3LIVE**](level-09-lidar-visual-lidar-slam/r3live.md) | [Lin 2022](https://arxiv.org/abs/2109.07982) | 实时LiDAR-视觉-惯性融合，稠密RGB点云地图 |
| [**R3LIVE++**](level-09-lidar-visual-lidar-slam/r3livepp.md) | [Lin 2023](https://arxiv.org/abs/2209.03666) | 改进版R3LIVE，带网格重建 |
| [**FAST-LIVO**](level-09-lidar-visual-lidar-slam/fast-livo.md) | [Zheng 2022](https://arxiv.org/abs/2203.00893) | FAST-LIO+直接法视觉里程计，紧耦合LVI |
| [**FAST-LIVO2**](level-09-lidar-visual-lidar-slam/fast-livo2.md) | [Zheng 2024](https://arxiv.org/abs/2408.14035) | 改进版，顺序图像处理，直接光度融合 |
| [**OKVIS2-X**](level-06-vio-vins/okvis2-x.md) | [Boche 2025](https://arxiv.org/abs/2510.04612) | 视觉+惯性+深度+LiDAR+GNSS可配置融合(同时也见于第6级) |

### 资料

| 资料 | 作者/年份 | 关键概念 |
|----------|-------------|--------------|
| [多传感器融合SLAM综述](level-09-lidar-visual-lidar-slam/multi-sensor-fusion-slam-survey.md) | [Zhu 2024](https://www.sciopen.com/article/10.26599/TST.2023.9010010) | 相机+LiDAR+IMU融合SLAM — 全面综述 |
