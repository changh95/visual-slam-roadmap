# Co-SLAM

> Wang 2023 · [论文](https://arxiv.org/abs/2304.14377)

**一句话总结** — 将Instant-NGP风格的多分辨率哈希网格与平滑的one-blob坐标编码结合用于神经SLAM，运行速度达10-17 Hz——远快于NICE-SLAM——同时保持表面的连贯性。

## 问题

坐标编码MLP具有一致性与平滑性先验，能带来高保真、可填补空洞的重建效果，但在按序列优化时"存在收敛缓慢和灾难性遗忘的问题";参数化编码（特征网格）速度快，但"在空洞填补与平滑性上有所欠缺"。NICE-SLAM具备可扩展性，但远未达到实时，且其局部网格无法补全未观测区域。Co-SLAM（"Joint Coordinate and Sparse Parametric Encodings for Neural Real-Time SLAM"）希望在一个实时RGB-D SLAM系统中同时兼具这两种特性。

## 方法与架构

给定一个已知内参的RGB-D数据流，Co-SLAM联合优化相机位姿 $\{\xi_t\}$ 与一个神经场 $f_\theta(\mathbf{x})\mapsto(\mathbf{c},s)$，将世界坐标映射为颜色和截断有符号距离（TSDF）。**联合编码**将一个平滑的one-blob坐标编码 $\gamma(\mathbf{x})$ 与Instant-NGP多分辨率哈希网格 $\mathcal{V}_\alpha$（各层级跨越 $R_{min}$ 到 $R_{max}$，三线性插值）的特征进行拼接。两个微型MLP负责解码：

$$f_\tau(\gamma(\mathbf{x}),\mathcal{V}_\alpha(\mathbf{x}))\mapsto(\mathbf{h},s),\qquad f_\phi(\gamma(\mathbf{x}),\mathbf{h})\mapsto\mathbf{c},$$

可学习参数为 $\theta=\{\alpha,\phi,\tau\}$——"在线SLAM所需的快速收敛、高效内存使用和空洞填补"。颜色与深度沿射线 $\mathbf{x}_i=\mathbf{o}+d_i\mathbf{r}$ 通过归一化加权求和渲染：$\hat{\mathbf{c}}=\tfrac{1}{\sum_i w_i}\sum_i w_i\mathbf{c}_i$、$\hat{d}=\tfrac{1}{\sum_i w_i}\sum_i w_i d_i$，其中使用一种简单的钟形SDF转权重函数

$$w_i=\sigma\!\left(\frac{s_i}{tr}\right)\sigma\!\left(-\frac{s_i}{tr}\right),$$

其中 $tr$ 为截断距离（10 cm），$\sigma$ 为sigmoid函数。采样是深度引导的：$M_c$ 个均匀采样点加上围绕测量深度附近的 $M_f$ 个近表面采样点。

**损失函数**：颜色/深度渲染的 $\ell_2$ 损失；截断区域内的近似SDF损失 $\mathcal{L}_{sdf}$，将预测值拉向 $D[u,v]-d$；一个自由空间损失，强制在远离表面处 $s_p=tr$；以及一个基于相邻哈希网格顶点特征度量差异的平滑正则项，$\mathcal{L}_{smooth}=\tfrac{1}{|\mathcal{G}|}\sum_{\mathbf{x}\in\mathcal{G}}\Delta_x^2+\Delta_y^2+\Delta_z^2$，在小的随机区域上计算，以抑制未观测空间中的哈希碰撞噪声。

**跟踪**用一个恒速运动模型 $\mathbf{T}_t=\mathbf{T}_{t-1}\mathbf{T}_{t-2}^{-1}\mathbf{T}_{t-1}$ 来初始化每一帧，随后在 $N_t$ 个采样像素上优化 $\xi_t$。**全局光束法平差**是第二个关键思想：不同于存储完整关键帧图像并选取约10个（iMAP/NICE-SLAM的做法），Co-SLAM每个关键帧仅存储约5%的像素，频繁插入关键帧（每第5帧插入一次），并从*整个*关键帧数据库中采样 $N_g$ 条射线来联合优化地图和所有位姿，在 $k_m$ 步地图更新与基于累积梯度的位姿更新之间交替进行。

## 实验结果

- **Replica**：深度L1误差1.51 cm，精度2.10 cm，完整度2.08 cm，完整率93.44%，速度**17.4 FPS**，参数量0.26 M——相比之下NICE-SLAM为1.90 / 2.37 / 2.64 / 91.13%，速度0.91 FPS，参数量17.4 M，iMAP为4.64 / 3.62 / 4.93 / 80.51%。
- **NeuralRGBD合成数据集**（含噪声深度、细结构）：深度L1误差3.02 cm，而NICE-SLAM为6.32、iMAP*为43.91，速度15.6 FPS。
- **ScanNet跟踪**：平均ATE RMSE为9.37 cm（跟踪迭代次数加倍后为8.75），而NICE-SLAM为9.63，速度6.4-12.8 FPS（NICE-SLAM为0.68）。
- **TUM RGB-D**：在fr1/desk、fr2/xyz、fr3/office上分别为2.7 / 1.9 / 2.6 cm（迭代次数增加后为2.4 / 1.7 / 2.4）——在神经系统中表现最好，但仍落后于ORB-SLAM2（1.6 / 0.4 / 1.0）。
- **消融实验**：去掉one-blob编码会损害完整度（完整模型2.08 cm、完整率93.44%，去掉后为2.13 cm、93.17%）；去掉哈希网格会损害精度（3.69 cm）；在相同总射线预算下，全局BA的ATE为8.75±0.33，而NICE-SLAM风格的局部BA为9.69，不用BA为16.81。

## 对SLAM的意义

Co-SLAM将神经隐式SLAM带入了实时速度，使NeRF-SLAM系列方法可用于交互式场景，并证明了在配合能恢复空洞填补能力的平滑坐标编码时，Instant-NGP的哈希网格可以用于在线建图。它的联合参数化+坐标编码方案以及稀疏像素全局光束法平差，成为NICE-SLAM系列中具有影响力的设计模式，与ESLAM的三平面表示和Point-SLAM的神经点云并列。

## 相关条目

- [NICE-SLAM](nice-slam.md)
- [iMAP](imap.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)
- [NeRF](nerf.md)
