### 编程(核心)
- **[C++](level-02-getting-familiar/cpp.md)**: 面向对象编程、现代C++、数据结构与算法、编译器、CMake/Makefile/Ninja、设计模式、OpenCV C++
- **[C](level-02-getting-familiar/c.md)**
- **[Git/GitHub](level-02-getting-familiar/git-github.md)**
- **[OpenCV](level-02-getting-familiar/opencv.md)** (opencv-python)
- **[Python](level-02-getting-familiar/python.md)**: 深度学习、绘图、系统脚本
- **[Bash/Linux](level-02-getting-familiar/bash-linux.md)**: ssh、命令行文本编辑器/Vim/tmux
- **[数学库](level-02-getting-familiar/math-libraries.md)**: Eigen、Ceres-solver/GTSAM/g2o
- **[C++/Python互操作](level-02-getting-familiar/cpp-python-interop.md)**: PyBind11、nanobind
- **[ROS/ROS2](level-02-getting-familiar/ros-ros2.md)**
- **[Docker](level-02-getting-familiar/docker.md)**

### 编程(可选 — 面向SLAM岗位的工程技能)
- **[并发](level-02-getting-familiar/concurrency.md)**: SIMD-SSE/AVX/Neon、OpenMP、CUDA
- **[边缘端部署](level-02-getting-familiar/edge-deployment.md)**: 学习型前端的TensorRT/ONNX导出、Jetson性能测试
- **[移动端](level-02-getting-familiar/mobile.md)**: Android(Java/Kotlin)、iOS(Objective-C/Swift)
- **[C#](level-02-getting-familiar/csharp.md)**: Unity AR、Microsoft HoloLens
- **[CI/CD](level-02-getting-familiar/ci-cd.md)**: GitHub Actions
- **[仿真](level-02-getting-familiar/simulation.md)**: Gazebo、Isaac Sim

### 图像处理
- **[关键点](level-02-getting-familiar/keypoints.md)** → 检测器/描述子
  - [SIFT](level-02-getting-familiar/sift.md)、[FAST](level-02-getting-familiar/fast.md)、[ORB](level-02-getting-familiar/orb.md)、[AKAZE](level-02-getting-familiar/akaze.md)
  - 深度特征: [R2D2](level-05-deep-learning/r2d2.md)、[SuperPoint](level-05-deep-learning/superpoint.md)
- [图像金字塔](level-02-getting-familiar/image-pyramid.md)、[oFAST](level-02-getting-familiar/orb.md)、[rBRIEF](level-02-getting-familiar/orb.md)

### 局部特征匹配
- [暴力匹配(Brute-Force)](level-02-getting-familiar/brute-force-matching.md)、[FLANN](level-02-getting-familiar/flann.md)、[Kd-Tree](level-02-getting-familiar/kd-tree.md)
- [LSH](level-02-getting-familiar/lsh.md)、[多探针LSH](level-02-getting-familiar/lsh.md)、[HBST](level-02-getting-familiar/hbst.md)
- [SuperGlue](level-05-deep-learning/superglue.md)

### 全局特征匹配
- [视觉词袋(Bag of Visual Words)](level-02-getting-familiar/bag-of-visual-words.md)、[NetVLAD](level-05-deep-learning/netvlad.md)
- [深度图像检索](level-02-getting-familiar/deep-image-retrieval.md)、[层次化定位](level-05-deep-learning/hloc.md)

### 特征跟踪
- [光流](level-02-getting-familiar/optical-flow.md)、[KLT跟踪器](level-02-getting-familiar/klt-tracker.md)

### 多视图几何
- **[2D-2D对应关系](level-02-getting-familiar/2d-2d-correspondence.md)**: [本质矩阵/基础矩阵](level-01-beginner/epipolar-geometry.md)、[单应矩阵](level-01-beginner/epipolar-geometry.md)
- **[2D-3D对应关系](level-02-getting-familiar/2d-3d-correspondence.md)**: [P3P](level-02-getting-familiar/pnp.md)、[PnP](level-02-getting-familiar/pnp.md)、[SVD](level-01-beginner/svd.md)
- **[3D-3D对应关系](level-02-getting-familiar/3d-3d-correspondence.md)**: [ICP](level-04-rgbd-slam/icp.md)

### 外点剔除
- [RANSAC](level-02-getting-familiar/ransac.md)、[PROSAC](level-02-getting-familiar/prosac.md)、[M-估计器(M-Estimator)](level-02-getting-familiar/m-estimator.md)、[MAXCON](level-02-getting-familiar/maxcon.md)、[凸松弛](level-02-getting-familiar/convex-relaxation.md)
- **[鲁棒位姿图优化](level-02-getting-familiar/robust-pose-graph-optimization.md)**: 可切换约束(Switchable constraints)、动态协方差缩放(DCS)、成对一致性最大化(PCM)

### 最小二乘优化
- [重投影误差](level-02-getting-familiar/reprojection-error.md)、[光束法平差](level-02-getting-familiar/bundle-adjustment.md)
- [非线性优化](level-02-getting-familiar/non-linear-optimization.md)、[李代数](level-02-getting-familiar/lie-groups.md)
- **[李群](level-02-getting-familiar/lie-groups.md)**: SO(3)、SE(3)
- [高斯-牛顿法](level-02-getting-familiar/gauss-newton.md)、[列文伯格-马夸尔特法(Levenberg-Marquardt)](level-02-getting-familiar/levenberg-marquardt.md)
- **[位姿图优化](level-02-getting-familiar/pose-graph-optimization.md)**
- **[舒尔补/稀疏性](level-02-getting-familiar/schur-complement-sparsity.md)**

### 运动模型
- **[本体感知传感器](level-02-getting-familiar/proprioceptive-sensor.md)**: IMU、轮速计
- **[里程计](level-02-getting-familiar/odometry.md)**(位姿)

### 观测模型
- **[外部感知传感器](level-02-getting-familiar/exteroceptive-sensor.md)**: 相机、LiDAR
- **[地标点(Landmark)](level-02-getting-familiar/landmark.md)**(地图)
- [联合优化](level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)、[最大似然估计与最大后验估计(MLE & MAP)](level-02-getting-familiar/mle-and-map.md)

### 因子图优化
- **[因子图](level-02-getting-familiar/factor-graph.md)**: 将SLAM表示为变量(位姿、地标点)与因子(观测量)构成的二部图
- **[将MAP推断表示为稀疏非线性最小二乘问题](level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)**；变量消元与贝叶斯树(Bayes tree)
- **[增量式平滑](level-02-getting-familiar/incremental-smoothing.md)**: iSAM / iSAM2
- **[边缘化](level-02-getting-familiar/marginalization.md)**与固定滞后平滑(fixed-lag smoothing)
- 参考文献: [Dellaert & Kaess, *Factor Graphs for Robot Perception* (2017)](https://www.cs.cmu.edu/~kaess/pub/Dellaert17fnt.pdf); GTSAM教程

### 建图
- [点云](level-02-getting-familiar/point-cloud.md)、[占据栅格建图](level-02-getting-familiar/occupancy-grid-mapping.md)、[TSDF](level-04-rgbd-slam/tsdf-vs-surfel-maps.md)、[面元(Surfel)](level-04-rgbd-slam/tsdf-vs-surfel-maps.md)、[体素地图](level-02-getting-familiar/voxel-map.md)

### 传感器
- **[相机设备](level-02-getting-familiar/camera-device.md)**: 广角/远心镜头、镜头MTF、CCD/CMOS、卷帘/全局快门、曝光/ISO、[立体视觉](level-01-beginner/stereo-vision.md)、[RGB-D](level-04-rgbd-slam/depth-from-sensor.md)、[结构光](level-04-rgbd-slam/depth-from-sensor.md)、[主动红外/ToF](level-04-rgbd-slam/depth-from-sensor.md)
- **[LiDAR](level-02-getting-familiar/lidar.md)** → [视觉-LiDAR融合](level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)
- **[IMU](level-02-getting-familiar/imu.md)** → VIO
- **[RADAR](level-02-getting-familiar/radar.md)** → [传感器](level-02-getting-familiar/camera-device.md)融合、[扩展卡尔曼滤波器](level-02-getting-familiar/extended-kalman-filter.md)
- **[声呐(Sonar)](level-02-getting-familiar/sonar.md)**
- **[多传感器标定](level-02-getting-familiar/multi-sensor-calibration.md)**: 相机-IMU、相机-LiDAR([Kalibr](https://github.com/ethz-asl/kalibr))

### 评估
- **[评价指标](level-02-getting-familiar/metrics.md)**: ATE(绝对轨迹误差)、RPE(相对位姿误差)
- **[一致性](level-02-getting-familiar/consistency.md)**: NEES(归一化估计误差平方)
- **数据集**: [KITTI](https://www.cvlibs.net/datasets/kitti/)、[TUM RGB-D](https://cvg.cit.tum.de/data/datasets/rgbd-dataset)、[EuRoC](https://projects.asl.ethz.ch/datasets/euroc-mav/)、[TartanAir](https://arxiv.org/abs/2003.14338)、[TUM-VI](https://arxiv.org/abs/1804.06120)、[4Seasons](https://arxiv.org/abs/2009.06364)、[Hilti SLAM Challenge](https://hilti-challenge.com/)、[Newer College](https://arxiv.org/abs/2003.05691)、[Project Aria](https://www.projectaria.com/)
- **工具**: [evo](https://github.com/MichaelGrupp/evo)(轨迹评估)
