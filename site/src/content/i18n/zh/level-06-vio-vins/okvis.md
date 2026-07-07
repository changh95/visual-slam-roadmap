# OKVIS
> Leutenegger 2015 · [论文](https://journals.sagepub.com/doi/10.1177/0278364914554813)

**一句话总结** — OKVIS（Open Keyframe-based Visual-Inertial SLAM）确立了VIO中紧耦合滑动窗口优化的范式：在一个由关键帧和最近帧组成的有限窗口内联合最小化重投影误差和IMU误差，并用Schur补边缘化将所有更早的信息压缩为一个先验。

## 问题
基于滤波器的VIO（MSCKF一类）对每个测量只在更新时线性化一次；累积的线性化误差会带来精度损失。全量光束法平差在每次迭代时重新线性化所有内容，漂移小得多——但对所有历史帧执行BA无法实时运行，而且以数百赫兹到达的惯性测量会在相邻状态之间产生密集的时间约束。OKVIS通过一个有限的*关键帧*窗口来化解这一张力：关键帧在时间上可以任意间隔（因此即使静止不动，估计结果也不会产生漂移），而旧的状态则通过边缘化被折叠进一个高斯先验中。

## 方法与架构
- **状态与联合代价函数。** 每个机器人状态保存位姿、速度和IMU偏置，$\mathbf{x}_R = \begin{bmatrix} {}_W\mathbf{r}_S^\top & \mathbf{q}_{WS}^\top & {}_S\mathbf{v}^\top & \mathbf{b}_g^\top & \mathbf{b}_a^\top \end{bmatrix}^\top$，同时还有三维地标${}_W\mathbf{l}^j$以及（可选、在线标定的）相机外参。估计器最小化一个联合代价函数，其中结合了加权的重投影误差$\mathbf{e}_r$和IMU误差项$\mathbf{e}_s$（式7）：
  $$J(\mathbf{x}) := \sum_{i=1}^{I}\sum_{k=1}^{K}\sum_{j \in \mathcal{J}(i,k)} \mathbf{e}_r^{i,j,k\,\top}\,\mathbf{W}_r^{i,j,k}\,\mathbf{e}_r^{i,j,k} \;+\; \sum_{k=1}^{K-1} \mathbf{e}_s^{k\,\top}\,\mathbf{W}_s^{k}\,\mathbf{e}_s^{k},$$
  其中$i$为相机索引，$k$为帧索引，$j$为地标索引，$\mathbf{W}$为信息矩阵——用Google Ceres求解，每次迭代都重新线性化（不同于滤波器）。
- **重投影误差。** $\mathbf{e}_r^{i,j,k} = \mathbf{z}^{i,j,k} - \mathbf{h}_i\big(\mathbf{T}_{C_iS}\,\mathbf{T}_{SW}\,{}_W\mathbf{l}^j\big)$，其中$\mathbf{h}_i$是相机$i$的（考虑畸变的）投影函数；解析雅可比同时也是边缘化步骤的组成部分。
- **IMU误差项。** 帧$k$与$k{+}1$之间的原始IMU测量用经典的Runge-Kutta方法（该论文早于基于流形的预积分方法）积分得到预测值$\hat{\mathbf{x}}^{k+1}$，15维残差即为预测值与估计值之间的差异——包括位置、最小四元数误差$2\big[\hat{\mathbf{q}}_{WS}^{k+1} \otimes \mathbf{q}_{WS}^{k+1\,-1}\big]_{1:3}$、速度和偏置——其信息矩阵$\mathbf{W}_s^k$通过将协方差$\mathbf{P}\big(\delta\hat{\boldsymbol{\chi}}_R^{k+1}\,\vert\,\mathbf{x}_R^k, \mathbf{z}_s^k\big)$经残差雅可比传播得到。
- **关键帧窗口。** 优化范围涵盖$S$个最近的帧（时间/IMU窗口）以及$M$个可能远在过去的关键帧。当已投影且匹配的地标凸包覆盖不到图像的约50%,或检测到的关键点中匹配上的比例低于约20%时，某一帧就会被设为关键帧——因此保留下来的关键帧能够跨越多样的视角。
- **边缘化。** 丢弃状态$\mathbf{x}_\mu$时，对Gauss-Newton系统$\mathbf{H}\delta\boldsymbol{\chi} = \mathbf{b}$应用Schur补：
  $$\mathbf{H}^{*}_{\lambda\lambda} = \mathbf{H}_{\lambda\lambda} - \mathbf{H}_{\lambda\mu}\mathbf{H}_{\mu\mu}^{-1}\mathbf{H}_{\mu\lambda}, \qquad \mathbf{b}^{*}_{\lambda} = \mathbf{b}_{\lambda} - \mathbf{H}_{\lambda\mu}\mathbf{H}_{\mu\mu}^{-1}\mathbf{b}_{\mu},$$
  线性化点固定在边缘化发生时的估计值处（一种首次估计处理方式）。非关键帧的测量会被丢弃、状态会被边缘化；旧的关键帧连同只在其中可见的地标一起被边缘化，从而保持问题的稀疏性。
- **前端。** 采用多尺度SSE优化的Harris角点配合BRISK描述子（强制关键点均匀分布），先用受马氏距离检验和绝对位姿RANSAC约束的暴力3D-2D匹配，再用2D-2D匹配配合三角化以及针对最新关键帧的相对RANSAC；立体和单目变体共享同一流水线。

## 实验结果
在一套定制的、由FPGA同步的立体惯性传感器（ADIS16448 IMU，800 Hz，两台WVGA全局快门相机，20 Hz，基线11厘米）采集的数据集上进行评估，并与一个采用相同关键点和IMU数据的、基于MSCKF风格随机克隆的滑动窗口滤波器进行对比，使用$M{=}7$个关键帧和$S{=}3$个最近帧。在1200米长的**Vicon Loops**序列上（14分钟，Vicon真值）,所有方法的每米行程中位位置误差都低于0.1%，但OKVIS的航向角漂移比滤波器更小。在7.9公里长的**Bicycle Trajectory**（23分钟，速度可达13.1 m/s，DGPS真值）以及620米的**ETH Main Building**手持数据集上，立体版本（aslam）和单目版本（aslam-mono）都始终优于msckf-mono。从粗略的CAD估计出发进行在线外参标定，消除了标定不准所引起的尺度误差；将关键帧数量从7增加到12没有带来显著提升，而将每幅图像的关键点数量从240减少到45只会轻微降低精度。

## 对SLAM的意义
OKVIS所确立的滑动窗口BA加边缘化架构，是VINS-Mono、Basalt、ORB-SLAM3的VI模式、DM-VIO以及OKVIS2都遵循的模板，它也提供了紧耦合非线性优化在可接受代价下优于滤波方法的第一个有力证据。它的关键帧选择逻辑和边缘化策略，至今仍是"如何在不丢弃信息的前提下限制VIO计算量"这一问题的默认答案。OKVIS还开创了一条长长的传承线：OKVIS2加入了带可重新激活地标的回环检测，OKVIS2-X则将该框架扩展到了LiDAR、深度和GNSS。

## 相关条目
- [VINS-Mono](vins-mono.md) — 这一架构中部署最广泛的后继者。
- [OKVIS2](okvis2.md) — 加入了可扩展回环检测的直接后继版本。
- [Basalt](basalt.md) — 解决了OKVIS式边缘化先验的线性化弱点。
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — 后来出现、现已成为标准的IMU因子形式。
- [Marginalization](../level-02-getting-familiar/marginalization.md) — 支撑滑动窗口的核心机制。
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — 实现这种压缩的线性代数工具。
