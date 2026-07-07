# R3LIVE++

> Lin 2023 · [论文](https://arxiv.org/abs/2209.03666)

**一句话总结** — R3LIVE++ 将 R3LIVE 从简单的 RGB 上色升级为实时**辐射地图（radiance map）**重建，并新增相机光度标定和在线曝光时间估计，从而同时提升建图精度和状态估计精度。

## 问题

R3LIVE 在地图点上存储原始 RGB 值，但像素的亮度并不是场景本身的属性——它是场景辐射经相机的非线性响应函数、镜头渐晕以及自动曝光为该帧选择的曝光时间共同过滤后的结果。忽略这一成像流程会使存储的颜色在不同视角和时间之间不一致，并给光度残差引入系统性误差。R3LIVE++ 明确地对成像流程建模，使地图存储的是物理量*辐射*，而不是依赖设备的 RGB 值。

## 方法与架构

架构与 R3LIVE 相同，仍是双子系统 ESIKF 架构——基于 FAST-LIO 风格的 LIO 构建地图的几何结构，直接法 VIO 恢复这些点的辐射——但视觉部分现在有了物理建模：

- **成像模型**：对每个颜色通道 $i$，记录到的像素强度为

$$\mathbf{I}_i(\boldsymbol{\rho}) = \mathbf{f}_i\big(\tau\, V(\boldsymbol{\rho})\, \boldsymbol{\gamma}_i\big),$$

  其中 $\boldsymbol{\gamma}_i$ 是该点处的场景辐射，$V(\boldsymbol{\rho}) \in [0,1]$ 是逐像素的渐晕系数，$\tau$ 是曝光时间，$\mathbf{f}_i(\cdot)$ 是该通道的非线性相机响应函数（CRF）。CRF 和渐晕都是离线标定的；对其求逆即可从观测到的像素得到辐射：$\boldsymbol{\gamma}_i = \mathbf{f}_i^{-1}(\mathbf{I}_i(\boldsymbol{\rho})) \,/\, (\tau V(\boldsymbol{\rho}))$。在光照恒定和朗伯反射的假设下，辐射对相机位姿是不变的——这正是它能够驱动自运动估计的原因。
- **状态中的曝光量**：完整状态 $\mathbf{x} = ({^G}\mathbf{R}_I, {^G}\mathbf{p}_I, {^G}\mathbf{v}, \mathbf{b_g}, \mathbf{b_a}, {^G}\mathbf{g}, {^I}\mathbf{R}_C, {^I}\mathbf{p}_C, \epsilon, {^I}t_C, \boldsymbol{\phi})$ 现在还包括**逆曝光时间** $\epsilon = 1/\tau$，与外参、时间偏移和内参一起在线估计。
- **在校正后图像上的两步 VIO**：每张输入图像首先经过光度校正（撤销 CRF 和渐晕的影响）得到 $\boldsymbol{\Gamma}$。对光流跟踪的地图点进行帧到帧的 PnP 更新，得到一个粗略的状态；随后帧到地图的更新最小化每个被跟踪点的**辐射误差**，

$$\mathbf{r}_c(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \boldsymbol{\gamma}_s) = \boldsymbol{\Phi}_s - \boldsymbol{\gamma}_s, \qquad \boldsymbol{\Phi}_s = \check{\epsilon}_k\, \boldsymbol{\Gamma}_k(\check{\boldsymbol{\rho}}_{s_k}),$$

  比较地图点存储的辐射 $\boldsymbol{\gamma}_s$ 与其投影处观测到的辐射 $\boldsymbol{\Phi}_s$。由于 $\boldsymbol{\Phi}_s$ 依赖于 $\epsilon$，残差的雅可比中含有非零的曝光量项——同一次更新同时跟踪位姿并估计曝光。
- **单像素而非图像块**：残差建立在单个像素上，使用该点存储的辐射（对相机旋转/平移不变），避免了基于图像块的直接法中图像块变形和恒定深度近似的问题。
- **辐射地图更新**：收敛后，一次贝叶斯更新将新的观测融合进每个可见点的辐射中，光照变化的随机游走噪声 $\mathbf{n}_{\text{ic}} \sim \mathcal{N}(\mathbf{0}, \boldsymbol{\sigma}^2_{\text{ic}} \Delta t_{\boldsymbol{\gamma}_s})$ 会使陈旧辐射的协方差膨胀。

## 实验结果

- **NCLT 基准测试**（25 个序列，共 138.0 km、33.6 小时；为公平比较，基线方法均关闭回环检测）：R3LIVE++ 取得最佳的平均绝对位置误差 **8.51 m**，对比 FAST-LIO2 的 9.59 m、R2LIVE 的 10.58 m、其自身单独 LIO 的 10.75 m、LVI-SAM 的 15.03 m、LIO-SAM 的 15.39 m。
- **R3LIVE 数据集**（13 个自采的港大/港科大序列，共 8.4 km、2.4 小时，包括三个激光雷达/相机退化序列）：系统在设备面对单一无纹理墙壁的场景中依然存活。
- **曝光估计**（与相机 API 提供的真值对比）：五个序列上的平均误差为 0.189–3.460 ms，均一致低于 Tum-cali（0.341–7.082 ms），例如在 hkust_campus_seq_02 上为 0.302 ms 对比 5.225 ms。
- **辐射地图精度**（将地图重投影到所有图像后的平均光度误差）：在每个序列上均最低——例如 hku_campus_seq_00：R3LIVE++ 为 14.57，对比 R3LIVE 的 22.56 和"按最新帧上色"基线的 34.78。
- **运行速度**（i7-9700K，纯 CPU）：在 NCLT 上每个激光雷达扫描耗时 34.3 ms，每张图像耗时 16.6 ms——总处理时间不到每秒数据的一半，即约为实时速度的两倍。
- 建立在辐射地图之上的应用：HDR 成像（以多个虚拟曝光值渲染）、虚拟环境探索，以及三维视频游戏。

## 对SLAM的意义

R3LIVE++ 是 SLAM 与照片级真实感重建融合过程中一个早期而实用的进展：它把外观视为一种经过标定的物理测量量，而非单纯的装饰，在一个实时 LVI 估计器内部预演了辐射场（NeRF、高斯溅射）的思路。其光度标定和在线曝光估计方法被后续的直接法 LVI 系统（如 FAST-LIVO2）所采纳。当交付目标是高保真的彩色地图而不仅仅是一条轨迹时，可选用该系统。

## 相关条目

- [R3LIVE](r3live.md) — 该系统所改进的前身
- [FAST-LIVO2](fast-livo2.md) — 同样在线估计曝光的直接法 LVI 里程计
- [FAST-LIO2](fast-lio2.md) — 港大 MARS 系列工作的激光-惯性基础
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — 光度标定对直接法为何重要
- [DSO](../level-03-monocular-slam/dso.md) — 率先实现完整光度标定的纯视觉系统
- [NeRF](../level-05-deep-learning/nerf.md) — 该系统在实时环境中预演的辐射场思想
