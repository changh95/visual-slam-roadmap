# PyCuVSLAM

> NVIDIA 2025 · [论文](https://github.com/NVlabs/pycuvslam)

**一句话总结** — NVIDIA cuVSLAM 的 Python API：一个 CUDA 加速的视觉（惯性）里程计与 SLAM 库，支持任意刚性装配中的 1 到 32 个相机，并在 Jetson 级边缘设备上实现实时性能（技术报告：arXiv 2506.04359,《cuVSLAM: CUDA accelerated visual odometry and mapping》）。

## 问题

高性能 SLAM 实现几乎清一色是与其构建系统和中间件紧密耦合的 C++ 代码库——这对生活在 Python 世界里的机器人开发者和机器学习研究者而言是一个很高的门槛。除了打包问题之外，该报告还指出了现有系统的三个技术缺口：它们"在资源受限平台上难以实现实时性能，传感器配置的灵活性有限，并且可能未能充分利用可用的硬件加速"。cuVSLAM 的应对方式是构建一个 GPU 原生流水线，同时提供 Isaac ROS 和 Python（PyCuVSLAM）两种 API。

## 方法与架构

cuVSLAM 分为一个**前端**（在最近 $N$ 个关键帧位姿及可见 3D 地标构成的局部里程计地图上进行低延迟局部位姿估计）和一个异步**后端**（用于全局一致性的回环检测与位姿图优化）。

- **2D 模块**：图像被划分为 $N \times M$ 的网格；每个图块贡献其前 $k$ 个 Shi–Tomasi（"Good Features to Track"）关键点，其中 $k > \lfloor K_I / (N \cdot M) \rfloor$，从而在保持均匀覆盖的同时满足总数不低于 $K_I$。跟踪采用改进的金字塔 Lucas–Kanade 方法，并在每一步优化中加入归一化互相关校验；当存活的跟踪数低于阈值时创建关键帧。
- **3D 模块**：在每个关键帧上，地标通过多视角观测三角化得到，并由异步 CUDA 稀疏光束法平差（先用舒尔补求解位姿，再求解点）进行精化：

$$\hat{T}^{bw}_{1:N},\hat{p}^{w}_{1:M} = \arg\min_{T^{bw}_{1:N},\,p^{w}_{1:M}} \sum_{i=1}^{N}\sum_{j=1}^{M}\sum_{k=1}^{C} \left\| \pi\!\left(T^{cb}_{k} T^{bw}_{i} p^{w}_{j}\right) - o_{j,k} \right\|^{2}_{\Sigma}$$

  其中 $T^{cb}_k$ 是第 $k$ 个相机相对于基座的变换，$T^{bw}_i$ 是基座相对于世界的位姿，$p^w_j$ 是一个地标，$o_{j,k}$ 是其观测值。逐帧位姿则由已跟踪地标的 PnP 求解得到。
- **模式**：*立体*（默认）；*多立体*——通过从外参自动构建的视锥交叉图，测试视场重叠情况，将任意刚性装配分解为若干立体相机对；*视觉惯性*——一个 15 自由度的状态 $S=[T \in SE(3),\, v,\, b^a,\, b^w]$，配合 IMU 预积分因子、重力估计和 VI 稀疏光束法平差；*单目*（基本矩阵初始化，尺度不定）；*单目-深度*——结合重投影、灰度、深度和点对点因子的稠密逐帧对齐，由 GPU 上的 Levenberg–Marquardt 求解。
- **后端**：关键帧特征是取自各金字塔层的 $9\times 9$ 图块；回环候选来自对历史位姿的 kd-树半径搜索，并通过将地标图块跟踪到当前图像来验证，随后估计相对位姿 $\hat{T}^{bm}$，再通过 $T_{1:N} = \arg\min_{T_{1:N}} \sum_{i,j \in E} \| \mathrm{Log}(D_{ij}^{-1} T_i^{-1} T_j) \|^2$ 对位姿图进行精化，其中 $D_{ij}$ 是测得的位姿增量。

## 实验结果

- **速度**：在 RTX 4090 台式机上单帧跟踪调用耗时 0.4 ms（立体）/0.9 ms（单目），在 Jetson AGX Orin（768×480 输入）上为 1.8 ms/2.7 ms；通过 Isaac ROS 运行的实时立体在 Jetson AGX Orin 上以 640×480、60 FPS 运行时仅占用约 5.5% 的 CPU 和约 1.7% 的 GPU。
- **精度**（平均相对轨迹误差 avgRTE / RMSE 绝对位姿误差 APE，已做尺度修正）：KITTI 立体 SLAM 为 0.27% / 1.98 m，对比 ORB-SLAM3 的 0.31% / 2.98 m 及 DPVO（单目）的 21.69% / 195 m；EuRoC 立体 SLAM 为 0.17% / 0.054 m，对比 ORB-SLAM3 的 0.21% / 0.068 m；TUM-VI Room 立体惯性为 0.12% / 0.12 m。论文将其总结为：在 KITTI 上平均轨迹误差低于 1%，在 EuRoC 上位置误差低于 5 cm。
- **多立体**：在真实的四立体相机 R2B 数据集上，SLAM 达到 0.11% avgRTE / 0.18 m APE——得益于更频繁的回环检测，相比纯里程计约提升 40%；在一项遮挡压力测试中，相机在 20-60 秒内随机被遮挡，只要仍有一个立体相机对可见，轨迹就能保持平滑。

## 对SLAM的意义

PyCuVSLAM 同时代表了两个行业趋势：硬件加速的 SLAM 作为产品级组件，以及 Python 优先的 API，从而降低机器人和机器学习开发者在无需编写 C++ 的情况下集成 SLAM 的门槛。其多相机建模方式（视锥图 + 装配级 PnP/BA）也为如今在部署中日益占主导地位的多传感器机器人提供了一个清晰的模板，这与 ORB-SLAM3 等单相机研究系统形成了对比。

## 动手实践

- [运行 cuVSLAM](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/cuvslam)

## 相关条目

- [ORB-SLAM3](orb-slam3.md)
- [DPVO](dpvo.md)
- [C++/Python 互操作](../level-02-getting-familiar/cpp-python-interop.md)
- [边缘部署](../level-02-getting-familiar/edge-deployment.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)
