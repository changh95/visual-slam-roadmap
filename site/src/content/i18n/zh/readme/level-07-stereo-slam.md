### 关键概念
- **[立体校正](level-07-stereo-slam/stereo-rectification.md)** — 对极对齐以实现高效的视差搜索
- **[视差与深度](level-07-stereo-slam/disparity-vs-depth.md)** — d = f·B/Z，基线长度决定深度测量范围/精度
- **[尺度可观测性](level-07-stereo-slam/scale-observability.md)** — 立体相机可提供度量尺度(与单目不同)

### 系统

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**S-PTAM**](level-07-stereo-slam/s-ptam.md) | [Pire 2017](https://github.com/lrse/sptam) | 立体版PTAM，兼容ROS，实时 |
| [**ORB-SLAM2**](level-03-monocular-slam/orb-slam2.md)(立体模式) | [Mur-Artal 2017](https://arxiv.org/abs/1610.06475) | 立体+RGB-D模式，回环检测，重定位 |
| [**StereoMSCKF**](level-07-stereo-slam/stereomsckf.md) | [Sun 2018](https://arxiv.org/abs/1712.00036) | 使用立体相机的MSCKF，适用于资源受限平台 |
| [**RTAB-Map**](level-04-rgbd-slam/rtab-map.md) | [Labbé 2019](https://ieeexplore.ieee.org/document/6942560) | 多传感器(立体/RGB-D/LiDAR)、内存管理、大规模场景(→ 也见于第4级) |
| [**ORB-SLAM3**](level-03-monocular-slam/orb-slam3.md)(立体模式) | [Campos 2020](https://arxiv.org/abs/2007.11898) | 多地图，Atlas，立体+IMU |
| [**Stella-VSLAM**](level-03-monocular-slam/stella-vslam.md) | [Community 2021](https://github.com/stella-cv/stella_vslam) | OpenVSLAM的继任者，支持立体模式(→ 也见于第3级) |
| [**Stereo DSO**](level-07-stereo-slam/stereo-dso.md) | [Wang 2017](https://arxiv.org/abs/1708.07878) | 直接法稀疏立体里程计，大规模场景(DSO的扩展) |
