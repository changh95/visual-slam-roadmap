# NICE-SLAM

> Zhu & Peng 2022 · [论文](https://arxiv.org/abs/2112.12130)

**一句话总结** — 引入了一种分层场景表示，使用多级局部特征网格（粗、中、细）实现可扩展的神经隐式SLAM，克服了iMAP在大场景中的局限性。

## 问题

神经隐式表示刚刚随iMAP进入SLAM领域，但"现有方法产生的场景重建过于平滑，且难以扩展到大场景"——这一局限"主要是因为它们简单的全连接网络架构没有将观测中的局部信息纳入考虑"（摘自摘要）。单一的全局MLP必须在每次新的、可能是局部的RGB-D观测到来时进行全局更新，因此在学习新区域时会遗忘旧区域。NICE-SLAM（CVPR 2022）通过一种将信息*局部*存储在多级特征网格中、再由预训练网络解码的表示方式解决了这一问题。

## 方法与架构

场景被编码为**四个特征网格**：三个几何网格 $\phi^l_\theta$，配有冻结的MLP解码器 $f^l$，$l\in\{0,1,2\}$分别对应粗（2米体素，可外推未观测到的几何）、中（32厘米）、细（16厘米）三个层级，另加一个颜色网格 $\psi_\omega$，配有解码器 $\mathbf{g}_\omega$。一个点 $\mathbf{p}\in\mathbb{R}^3$通过三线性插值解码；中层给出占用率 $o^1_{\mathbf{p}}=f^1(\mathbf{p},\phi^1_\theta(\mathbf{p}))$，细层则以中层特征为条件添加一个残差项：

$$\Delta o^{1}_{\mathbf{p}}=f^{2}(\mathbf{p},\phi^{1}_{\theta}(\mathbf{p}),\phi^{2}_{\theta}(\mathbf{p})),\qquad o_{\mathbf{p}}=o^{1}_{\mathbf{p}}+\Delta o^{1}_{\mathbf{p}},$$

颜色则为 $\mathbf{c}_{\mathbf{p}}=\mathbf{g}_\omega(\mathbf{p},\psi_\omega(\mathbf{p}))$。粗/中/细解码器**作为ConvONet的一部分被预训练**，然后被冻结——只优化网格特征——这样既能稳定优化过程，又能注入学到的室内几何先验；粗网格可以在未观测区域外预测占用率，这使得当视野中大部分内容都是新的时跟踪仍能维持。

**渲染**：沿每条射线采样 $N=N_{\text{strat}}+N_{\text{imp}}$个点（分层采样加上在测得深度附近的采样）；点 $\mathbf{p}_i$处的射线终止概率为 $w_i=o_{\mathbf{p}_i}\prod_{j=1}^{i-1}(1-o_{\mathbf{p}_j})$，深度/颜色渲染为

$$\hat{D}=\sum_{i=1}^{N}w_i d_i,\qquad \hat{I}=\sum_{i=1}^{N}w_i\mathbf{c}_i,$$

同时在粗、细层级也计算逐射线深度方差 $\hat{D}_{var}=\sum_i w_i(\hat{D}-d_i)^2$。

**建图**从当前帧和选定的关键帧中采样 $M$ 个像素，然后分阶段优化：先只优化中层网格，使用 $L_1$ 深度损失 $\mathcal{L}_g$，再优化中+细层，最后进行局部光束法平差 $\min_{\theta,\omega,\{\mathbf{R}_i,\mathbf{t}_i\}}(\mathcal{L}^c_g+\mathcal{L}^f_g+\lambda_p\mathcal{L}_p)$，同时也会优化 $K$ 个关键帧的位姿（$\mathcal{L}_p$ 是一个 $L_1$ 颜色损失）。**跟踪**与之并行运行，优化当前帧的 $\{\mathbf{R},\mathbf{t}\}$，目标为 $\min(\mathcal{L}_{g\_var}+\lambda_{pt}\mathcal{L}_p)$，其中

$$\mathcal{L}_{g\_var}=\frac{1}{M_t}\sum_{m=1}^{M_t}\frac{|D_m-\hat{D}^{c}_m|}{\sqrt{\hat{D}^{c}_{var}}}+\frac{|D_m-\hat{D}^{f}_m|}{\sqrt{\hat{D}^{f}_{var}}}$$

会对物体边缘等不确定区域降低权重。损失超过该帧中位数10倍的像素会被丢弃，从而对动态物体具有鲁棒性。关键帧只在与当前视图有视觉重叠的帧中选取——这之所以可行，是因为网格更新是局部的，因此视野之外的几何保持不变（从设计上就不会发生灾难性遗忘）。系统运行在三个线程中：粗建图、中/细+颜色建图，以及跟踪。

## 实验结果

在五个数据集上评估：Replica、ScanNet、TUM RGB-D、Co-Fusion，以及一个自采集的多房间公寓数据集。

- **Replica（8个场景均值）**：深度L1为3.53 cm，精度2.85 cm，完整度3.00 cm，完整度比例89.33%——相比之下iMAP*为7.64 / 6.95 / 5.33 / 66.60%，DI-Fusion为23.33 / 19.40 / 10.19 / 72.96%——模型大小仅为12.02 MB。
- **ScanNet跟踪**：6个场景平均ATE RMSE为9.63 cm，而iMAP*为36.67，DI-Fusion为78.89；消融实验显示局部BA和颜色损失都很重要（去掉局部BA后：37.74）。
- **TUM RGB-D**：在fr1/desk、fr2/xyz、fr3/office上ATE RMSE分别为2.7 / 1.8 / 3.0 cm——在隐式方法中表现最佳（iMAP为4.9 / 2.0 / 5.8），不过经典的ORB-SLAM2依然更精确（1.6 / 0.4 / 1.0）。
- **计算量**：每个查询点104.16×10³ FLOPs，而iMAP为443.91×10³；每次迭代跟踪耗时47 ms、建图耗时130 ms，相较iMAP的101 / 448 ms。

## 对SLAM的意义

NICE-SLAM使神经隐式SLAM能够扩展到房间尺度及更大的环境，使该领域超越了iMAP概念验证的阶段。其分层特征网格设计成为后续工作（如采用三平面的ESLAM、采用哈希网格的Co-SLAM、采用神经点的Point-SLAM）所采纳的标准范式。与iMAP一起，它确立了后续大多数神经SLAM论文所使用的Replica / TUM RGB-D / ScanNet评测协议。

## 相关条目

- [iMAP](imap.md)
- [Co-SLAM](co-slam.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)
- [NICER-SLAM](nicer-slam.md)
- [NeRF](nerf.md)
