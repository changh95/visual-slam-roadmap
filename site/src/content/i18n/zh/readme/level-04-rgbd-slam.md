### 关键概念
- **[深度传感器原理](level-04-rgbd-slam/depth-from-sensor.md)** — 结构光与主动红外(ToF)对比；免费获得度量尺度，但存在测距范围/材质限制
- **[帧到模型跟踪](level-04-rgbd-slam/frame-to-model-tracking.md)** — 将每一帧与累积模型对齐([ICP](level-04-rgbd-slam/icp.md))，而非帧到帧对齐
- **[TSDF与面元(Surfel)地图](level-04-rgbd-slam/tsdf-vs-surfel-maps.md)** — 体素化的有符号距离场融合(KinectFusion)与基于点的面元融合(ElasticFusion)对比

### RGB-D相机设备
- Intel RealSense D系列
- Orbbec Femto系列(Azure Kinect的继任产品)、Orbbec Astra
- Luxonis OAK-D
- 已停产的旧设备: Microsoft Kinect v1/v2、Azure Kinect DK、Occipital Structure Core

### GPGPU编程
- [CUDA、OpenGL GLSL](level-04-rgbd-slam/gpgpu-programming.md)

### 系统

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [ICP](level-04-rgbd-slam/icp.md) | [Besl & McKay 1992](https://ieeexplore.ieee.org/document/121791) | 迭代最近点(Iterative Closest Point)、最近点对应关系、闭式刚体变换求解、局部收敛(需要初始化)、3D-3D配准的基础方法 |
| **DTAM** | Newcombe 2011 | → 见第3级 直接法SLAM |
| [**KinectFusion**](level-04-rgbd-slam/kinectfusion.md) | [Newcombe 2011](https://ieeexplore.ieee.org/document/6162880) | GPGPU、跟踪(深度投影到3D、表面法线、由粗到精ICP)、建图(体素积分、TSDF)、对小幅场景变化鲁棒、无法建模形变、地图增长为立方级、仅限房间尺度场景 |
| [双窗口优化(Double Window Optimisation)](level-04-rgbd-slam/double-window-optimisation.md) | [Strasdat 2011](https://ieeexplore.ieee.org/document/6126517) | 内窗口(局部BA)+外窗口(位姿图)、共视图、常数时间优化 |
| [Kintinuous](level-04-rgbd-slam/kintinuous.md) | [Whelan 2012](https://ieeexplore.ieee.org/document/6907054) | 体积平移(Volume shift)、几何、光度、dBoW+SURF、优化、回环检测 |
| [RGBD-SLAM-V2](level-04-rgbd-slam/rgbd-slam-v2.md) | [Endres 2013](https://felixendres.github.io/rgbdslam_v2/) | 跟踪(彩色图像、视觉特征、深度图像、点云、变换)、建图(OctoMap 2013) |
| [SLAM++](level-04-rgbd-slam/slampp.md) | [Salas-Moreno 2013](https://ieeexplore.ieee.org/document/6619022) | 面向对象的SLAM |
| [DVO](level-04-rgbd-slam/dvo.md) | [Kerl 2013](https://vision.in.tum.de/data/software/dvo) | 关键帧、深度、直接法、优化、回环检测 |
| [**RTAB-Map**](level-04-rgbd-slam/rtab-map.md) | [Labbé 2014](https://introlab.github.io/rtabmap/) | 回环检测、地图合并、多会话记忆管理 |
| [MRS-Map](level-04-rgbd-slam/mrs-map.md) | [Stückler 2014](https://doi.org/10.1016/j.jvcir.2013.02.008) | 基于八叉树的多分辨率面元地图，每个面元的形状+颜色统计，抗噪RGB-D配准，CPU实时运行 |
| [**ElasticFusion**](level-04-rgbd-slam/elasticfusion.md) | [Whelan 2015](https://ieeexplore.ieee.org/document/7274882) | 活动模型: 帧到模型跟踪(光度+几何)、联合优化、融合式面元模型重建 · 非活动模型: 局部回环检测(模型到模型局部表面、子模型分离)、全局回环检测(随机蕨编码(randomised fern)、非刚性空间变形) |
| [DynamicFusion](level-04-rgbd-slam/dynamicfusion.md) | [Newcombe 2015](https://ieeexplore.ieee.org/document/7298631) | 6D运动场、可变形场景 |
| **ORB-SLAM2**(RGB-D模式) | Mur-Artal 2017 | 光束法平差、稀疏重建(→ 也见于第3级) |
| [**BundleFusion**](level-04-rgbd-slam/bundlefusion.md) | [Dai 2016](https://arxiv.org/abs/1604.01093) | 局部到全局优化、稀疏RGB特征、粗略全局位姿估计、精细位姿细化(几何+光度) |
| [SemanticFusion](level-04-rgbd-slam/semanticfusion.md) | [McCormac 2016](https://arxiv.org/abs/1609.05130) | 深度学习CNN、深度语义SLAM |
| [InfiniTAM v3](level-04-rgbd-slam/infinitam-v3.md) | [Prisacariu 2017](https://arxiv.org/abs/1708.00783) | 跟踪(场景光线投射、深度图像、RGB图像)、重定位(随机蕨)、建图(TSDF重建、体素哈希、面元重建) |
| [Fusion++](level-04-rgbd-slam/fusionpp.md) | [McCormac & Clark 2018](https://arxiv.org/abs/1808.08378) | 深度学习CNN、Mask-RCNN实例分割、物体级SLAM、无需先验、物体级TSDF重建 |
| [PointFusion / DenseFusion](level-04-rgbd-slam/pointfusion-densefusion.md) | [Xu 2018](https://arxiv.org/abs/1711.10871) / [Wang 2019](https://arxiv.org/abs/1901.04780) | RGB-D物体6自由度位姿估计，点云+图像特征融合(物体级SLAM的物体前端) |
| [BAD SLAM](level-04-rgbd-slam/bad-slam.md) | [Schöps 2019](https://openaccess.thecvf.com/content_CVPR_2019/html/Schops_BAD_SLAM_Bundle_Adjusted_Direct_RGB-D_SLAM_CVPR_2019_paper.html) | 直接法RGB-D光束法平差、面元地图、实时GPU BA、ETH3D基准测试 |
| [**RTAB-Map**](level-04-rgbd-slam/rtab-map.md)(RGB-D / LiDAR) | [Labbé 2019](https://doi.org/10.1002/rob.21831) | 多传感器RGB-D/LiDAR支持、光源检测(2016) |
| [**MoreFusion**](level-04-rgbd-slam/morefusion.md) | [Wada 2020](https://arxiv.org/abs/2004.04336) | 深度学习实例分割、物体级体素融合、体素位姿预测、3D场景重建、基于碰撞的细化、语义SLAM、物体位姿估计、CAD物体拟合 |
| **NodeSLAM** | Sucar 2020 | 占据VAE、物体级SLAM(→ 也见于第5级 潜表征) |
| [**DSP-SLAM**](level-04-rgbd-slam/dsp-slam.md) | [Wang (UCL) 2021](https://arxiv.org/abs/2108.09481) | DeepSDF形状先验+ORB-SLAM2，物体级稠密重建(单目/立体/LiDAR) |
