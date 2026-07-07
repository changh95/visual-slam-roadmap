### 关键概念
- **[紧耦合与松耦合](level-06-vio-vins/tightly-coupled-vs-loosely-coupled.md)** — 视觉与惯性测量的联合优化对比独立优化
- **[基于滤波与基于优化](level-06-vio-vins/filter-based-vs-optimization-based.md)** — EKF方法对比非线性优化(BA)
- **[IMU预积分](level-06-vio-vins/imu-preintegration.md)** — 在关键帧之间对IMU测量值进行积分(Lupton 2012；流形上的表述: Forster 2015)
- **[IMU噪声模型](level-06-vio-vins/imu-noise-model.md)** — 偏置(bias)、随机游走、艾伦方差(Allan variance)
- **[可观测性](level-06-vio-vins/observability.md)** — VIO中存在4个不可观测自由度(3自由度全局平移+偏航角)；在匀加速运动下尺度也变得不可观测
- **[已部署的VIO系统](level-06-vio-vins/deployed-vio.md)** — 商业XR产品(Meta Quest、ARKit/ARCore)是部署量最大的VIO系统 — 值得作为案例研究

### 基础

| 资料 | 作者/年份 | 关键概念 |
|----------|-------------|--------------|
| [**惯性导航导论(Introduction to Inertial Navigation)**](level-06-vio-vins/introduction-to-inertial-navigation.md) | [Woodman 2007](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-696.html) | IMU基础知识、坐标系、误差来源 — 必备前置知识 |
| [流形上的IMU预积分](level-06-vio-vins/imu-preintegration-on-manifold.md) | [Forster 2015](https://arxiv.org/abs/1512.02363) | 流形上的预积分，无需重新积分即可修正偏置 |
| [用于误差状态卡尔曼滤波的四元数动力学](level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md) | [Solà 2017](https://arxiv.org/abs/1711.02508) | 四元数数学、误差状态表述 |

### 基于滤波

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**MSCKF**](level-06-vio-vins/msckf.md) | [Mourikis 2007](https://ieeexplore.ieee.org/document/4209642) | 多状态约束卡尔曼滤波，状态中不含地标点的高效VIO |
| [ROVIO](level-06-vio-vins/rovio.md) | [Bloesch 2015](https://github.com/ethz-asl/rovio) | 机体中心式VIO(Robocentric VIO)，直接光度跟踪+EKF |
| [**OpenVINS**](level-06-vio-vins/openvins.md) | [Geneva 2020](https://docs.openvins.com/) | 开源MSCKF，模块化，可扩展 |

### 基于优化

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [OKVIS](level-06-vio-vins/okvis.md) | [Leutenegger 2015](https://journals.sagepub.com/doi/10.1177/0278364914554813) | 基于关键帧、紧耦合、滑动窗口优化 |
| [**VINS-Mono**](level-06-vio-vins/vins-mono.md) | [Qin 2018](https://arxiv.org/abs/1708.03852) | 紧耦合，重定位，回环检测，位姿图优化 |
| [VI-DSO](level-06-vio-vins/vi-dso.md) | [von Stumberg 2018](https://arxiv.org/abs/1804.05625) | 直接法稀疏VIO，动态边缘化，光度误差 |
| [VINS-Fusion](level-06-vio-vins/vins-fusion.md) | [Qin 2019](https://arxiv.org/abs/1901.03638) | 立体+GPS融合扩展 |
| [maplab](level-06-vio-vins/maplab.md) | [Schneider 2018](https://arxiv.org/abs/1711.10250) | 多会话视觉惯性建图框架 |
| [**Kimera-VIO**](level-06-vio-vins/kimera-vio.md) | [Rosinol 2020](https://arxiv.org/abs/1910.02490) | Kimera流水线的快速VIO前端，无结构视觉因子(structureless vision factors) |
| [Basalt](level-06-vio-vins/basalt.md) | [Usenko 2020](https://arxiv.org/abs/1904.06504) | 边缘化先验的非线性因子恢复(NFR)，视觉惯性里程计+建图 |
| [**ORB-SLAM3**](level-03-monocular-slam/orb-slam3.md) | [Campos 2020](https://arxiv.org/abs/2007.11898) | VIO模式，多地图，IMU初始化 |
| [**DM-VIO**](level-06-vio-vins/dm-vio.md) | [von Stumberg 2022](https://arxiv.org/abs/2201.04114) | 直接法(基于DSO)单目VIO，延迟边缘化，用于IMU初始化的位姿图BA |
| [**OKVIS2**](level-06-vio-vins/okvis2.md) | [Leutenegger 2022](https://arxiv.org/abs/2202.09199) | 多会话，改进的边缘化 |
| [AirVO](level-06-vio-vins/airvo.md) | [Xu 2023](https://arxiv.org/abs/2212.07595) | 点线特征VIO，光照鲁棒 |
| [**OKVIS2-X**](level-06-vio-vins/okvis2-x.md) | [Boche & Leutenegger 2025](https://arxiv.org/abs/2510.04612) | 多传感器SLAM(视觉+惯性+深度+LiDAR+GNSS)，稠密体素占据地图，大规模场景(9公里+)分块建图，EuRoC/Hilti22 SOTA |
