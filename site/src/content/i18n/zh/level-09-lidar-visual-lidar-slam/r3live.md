# R3LIVE

> Lin 2022 · [论文](https://arxiv.org/abs/2109.07982)

**一句话总结** — R3LIVE 融合激光雷达、惯性和视觉感知，让激光-惯性里程计构建全局地图的几何结构，同时一个直接法视觉-惯性子系统为其绘制纹理，从而实时生成稠密的 RGB 彩色点云。

## 问题

当几何特征不足时——尤其是使用小视场固态激光雷达时——基于激光雷达的 SLAM 会失效，而且其地图是无色的，限制了在测绘、仿真器和其他三维应用中的使用。R3LIVE 的目标是同时实现稳健、精确的状态估计*以及*稠密的 RGB 彩色地图，让每种传感器发挥其最擅长的作用，并通过一张共享地图和一个滤波器耦合起来。

## 方法与架构

两个子系统共享一个 29 维状态 $\mathbf{x} \in \mathbb{R}^{29}$，其中包含 IMU 位姿 $({^G}\mathbf{R}_I, {^G}\mathbf{p}_I)$、速度、陀螺仪/加速度计偏置、重力 ${^G}\mathbf{g}$、相机-IMU 外参 $({^I}\mathbf{R}_C, {^I}\mathbf{p}_C)$、相机-IMU 时间偏移 ${^I}t_C$，以及相机内参 $\boldsymbol{\phi} = [f_x, f_y, c_x, c_y]^T$——所有量都在一个误差状态迭代卡尔曼滤波器（ESIKF）中在线估计。

- **地图**：固定大小的体素（例如 $0.1$ m 立方体，若近期有点被追加则标记为*激活*状态），包含点 $\mathbf{P} = [{^G}\mathbf{p}^T, \mathbf{c}^T]^T$——三维位置加 RGB 颜色，各自带有协方差 $\boldsymbol{\Sigma}_{\mathbf{p}}, \boldsymbol{\Sigma}_{\mathbf{c}}$。
- **LIO 子系统**（基于 FAST-LIO）：IMU 反向传播对每帧扫描去畸变，ESIKF 最小化点到平面残差，收敛后的扫描被追加到全局地图中——构建的几何结构同时为 VIO 提供深度。
- **VIO 子系统**，一个无需特征提取的两步直接法流水线：
  1. *帧到帧更新*：LK 光流跟踪地图点的投影；PnP 重投影残差 $\mathbf{r} = \boldsymbol{\rho}_{s_k} - \boldsymbol{\pi}({^C}\mathbf{p}_s, \check{\mathbf{x}}_k)$（$\boldsymbol{\pi}$ 内部含有在线时间偏移校正项）驱动 ESIKF 更新。
  2. *帧到地图更新*：光度残差 $\mathbf{o}(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \mathbf{c}_s) = \mathbf{c}_s - \boldsymbol{\gamma}_s$ 比较每个被跟踪点存储的地图颜色 $\mathbf{c}_s$ 与从当前图像插值得到的颜色 $\boldsymbol{\gamma}_s$——与图像块金字塔不同，地图颜色对相机的旋转/平移是不变的。
- 两个更新步骤都在求解同一个 MAP 问题，将 IMU 传播的先验与堆叠的残差结合：

$$\min_{\delta\check{\mathbf{x}}_k} \Big( \big\|\check{\mathbf{x}}_k \boxminus \hat{\mathbf{x}}_k + \boldsymbol{\mathcal{H}}\delta\check{\mathbf{x}}_k\big\|^2_{\boldsymbol{\Sigma}_{\delta\hat{\mathbf{x}}_k}} + \sum_{s=1}^{m} \big\|\mathbf{o}(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \mathbf{c}_s) + \mathbf{H}^o_s \delta\check{\mathbf{x}}_k\big\|^2_{\boldsymbol{\Sigma}_{\boldsymbol{\beta}_s}} \Big)$$

  迭代至收敛，卡尔曼增益为 $\mathbf{K} = (\mathbf{H}^T\mathbf{R}^{-1}\mathbf{H} + \mathbf{P}^{-1})^{-1}\mathbf{H}^T\mathbf{R}^{-1}$（等价于高斯-牛顿法）。
- **纹理渲染**：每次位姿收敛后，落在图像视野中的激活体素内的点，会通过贝叶斯更新融合其颜色——存储颜色的协方差会随一个随机游走项 $\boldsymbol{\sigma}_s^2 \cdot \Delta t_{\mathbf{c}_s}$（用于建模光照变化）增大，然后再与新的观测混合。
- **被跟踪点的维护**：重投影误差或光度误差较大的点会被丢弃；在半径 50 像素范围内不存在被跟踪点的地方，会新增地图点。

## 实验结果

手持设备：Livox AVIA 激光雷达（视场角 70.4°×77.2°）、FLIR Blackfly 全局快门相机、DJI Manifold-2c（Intel i7-8550U，8 GB RAM）。

- **激光雷达退化+无纹理测试**：在面对白墙时穿过一条狭窄的"T"形通道（单平面激光雷达约束，几乎零纹理），R3LIVE 存活下来，端到端仅漂移平移 4.57 cm、旋转 1.62°（以 ArUco 为真值）。
- **大规模校园建图**（香港科技大学，四条轨迹分别为 1317/1524/1372/1191 m）：平移漂移为 0.093/0.154/0.164/0.102 m，旋转漂移为 2.140/0.285/2.342/3.925°，轨迹在没有任何回环检测模块的情况下实现了闭环。
- **RTK-GPS 基准测试**（海港，两个序列）：R3LIVE-HiRes 取得了最佳的相对误差，例如在序列（a）的 300 m 子序列上为 0.21°/0.17%（RRE/RTE），对比 LVI-SAM 的 0.43°/2.40% 和 VINS-Mono 的 0.59°/2.31%；它也略微超过了 R2LIVE 和 FAST-LIO2。
- **运行速度**：在 320×256 分辨率、0.10 m 地图分辨率下，VIO 在 PC 上每帧耗时 7.01 ms——即使在机载计算机上也能轻松实现实时运行。

## 对SLAM的意义

R3LIVE 建立了 LVI 系统中"几何来自激光雷达、纹理来自相机"的模式，并证明了针对彩色激光雷达地图的直接光度对齐是一种实用的、实时的视觉融合替代方案，可替代基于特征的方法。它连接了状态估计与彩色三维重建——数字孪生、巡检、AR——其完全开源的发布（代码、网格纹理化工具，甚至设备的机械设计）使其成为 R3LIVE++ 和 FAST-LIVO 所依据的参考设计。

## 相关条目

- [FAST-LIO2](fast-lio2.md) — 这一系列工作所依托的激光-惯性核心
- [R3LIVE++](r3livepp.md) — 引入辐射地图和光度标定的后续系统
- [FAST-LIVO](fast-livo.md) — 姊妹系统，其中视觉也通过图像块参与位姿估计
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — 该融合类别
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — 光度融合原理
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md) — 支撑其 ESIKF 的误差状态机制
