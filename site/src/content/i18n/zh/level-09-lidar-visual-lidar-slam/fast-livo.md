# FAST-LIVO

> Zheng 2022 · [论文](https://arxiv.org/abs/2203.00893)

**一句话总结** —— FAST-LIVO通过将图像块附着到LiDAR地图点上,把直接法LiDAR-惯性里程计与直接法视觉里程计统一进单一的ESIKF中,从两种模态中都去掉了特征提取。

## 问题

现有的LVI系统(R2LIVE、LVI-SAM)运行的是基于特征的前端——视觉端进行角点提取和滑动窗口优化,LiDAR端进行边缘/平面提取——这带来了显著的计算开销,并且在显著特征稀缺的地方会失效。FAST-LIVO探讨的问题是:FAST-LIO2为LiDAR带来的直接法理念是否也能扩展到相机,以及两种传感器是否可以共享同一张地图,而不是维护独立的视觉与LiDAR表示。

## 方法与架构

一个误差状态迭代卡尔曼滤波器(ESIKF),作用于18维流形状态 $\mathbf{x} = [{^G}\mathbf{R}_I^T\ {^G}\mathbf{p}_I^T\ {^G}\mathbf{v}^T\ \mathbf{b_g}^T\ \mathbf{b_a}^T\ {^G}\mathbf{g}^T]^T \in SO(3)\times\mathbb{R}^{15}$,在两次测量之间进行IMU前向传播,并进行反向传播以对每次LiDAR扫描去畸变。

- **LIO子系统**(改编自FAST-LIO2):原始扫描点——无边缘/平面特征——通过点到平面残差进行帧到地图配准

$$\mathbf{r}_l(\mathbf{x}_k, {^L}\mathbf{p}_j) = \mathbf{u}_j^T\big({^G}\mathbf{T}_{I_k}\,{^I}\mathbf{T}_L\,{^L}\mathbf{p}_j - \mathbf{q}_j\big),$$

  其中 $\mathbf{u}_j, \mathbf{q}_j$ 是拟合到增量式k-d树(ikd-Tree)中最近5个地图点的平面的法向量和中心。
- **VIO子系统**(稀疏直接法,帧到地图):地图点 ${^G}\mathbf{p}_i$ 携带来自先前观测图像的图像块金字塔;参考图像块 $\mathbf{Q}_i$ 是观测角度最接近的那一个,对齐通过最小化光度残差实现

$$\mathbf{r}_c(\mathbf{x}_k, {^G}\mathbf{p}_i) = \mathbf{I}_k\big(\boldsymbol{\pi}({^I}\mathbf{T}_C^{-1}\,{^G}\mathbf{T}_{I_k}^{-1}\,{^G}\mathbf{p}_i)\big) - \mathbf{A}_i\mathbf{Q}_i$$

  ($\mathbf{A}_i$ 是仿射变换,$\boldsymbol{\pi}$ 是针孔投影),在三个金字塔层级上以粗到精的方式优化。无需ORB/FAST角点,无需三角化,无需深度滤波器。
- **每次测量对应一个MAP问题**:无论哪种传感器的数据在 $t_k$ 时刻到达,都会触发一次迭代更新 $\min_{\mathbf{x}_k} \big( \|\mathbf{x}_k \boxminus \hat{\mathbf{x}}_k\|^2_{\hat{\mathbf{P}}_k} + \sum_j \|\mathbf{r}_l\|^2_{\boldsymbol{\Sigma}_l} + \sum_i \|\mathbf{r}_c\|^2_{\boldsymbol{\Sigma}_c} \big)$——LiDAR扫描只融合 $\mathbf{r}_l$,图像只融合 $\mathbf{r}_c$,两者都针对同一个状态和协方差(等价于高斯-牛顿法)。
- **共享地图**:LiDAR全局地图是所有点构成的ikd-Tree;视觉全局地图在哈希索引的体素中保存LiDAR点及其图像块金字塔。视觉子图是通过查询最近一次扫描所触及的体素来获取的。
- **异常值剔除**:子图中的点用预测位姿投影后,每个40×40像素网格只保留深度最小的点,并剔除在9×9邻域内被当前扫描点所遮挡的点——从而移除会破坏光度对齐的边缘点和遮挡点。
- **地图更新**:对齐之后,光度误差较高的点若已超过20帧或超过40像素的运动(距上次更新以来),就会获得一个新的8×8图像块;新的地图点是每个40×40网格中梯度最高的投影LiDAR点,跳过高曲率的边缘点。

## 实验结果

- **NTU-VIRAL基准测试**(9个无人机序列,Ouster OS1-16 + 相机 + IMU):FAST-LIVO在9个序列中的8个上取得了最佳的绝对平移RMSE——例如eee_01:0.28米,对比FAST-LIO2的0.54米、R2LIVE的0.45米、DVL-SLAM(去除回环检测)的2.88米,SVO2.0则失败;nya_01为0.19米。只有在sbs_01上(0.29米对FAST-LIO2的0.25米),严重的运动模糊使得图像帮助不大。
- **LiDAR退化墙面**(面对约30米的墙):FAST-LIO2在未受约束的方向上漂移,SVO2.0在重复纹理上漂移;FAST-LIVO达到了最低的端到端漂移,仅0.05米。
- **视觉挑战序列**(室内-室外过渡,两次剧烈运动,无纹理白墙):在79.52米的路径上仅0.04米的端到端误差,依然存活。
- **运行时间**:每个LiDAR+图像帧的总处理时间为36.75毫秒,对比R2LIVE的45.16毫秒前端+59.27毫秒滑动窗口后端;VIO子系统在Intel i7上耗时10.23毫秒,在ARM(Qualcomm RB5)上耗时13.82毫秒——在两种平台上均为实时,配套的硬同步Livox Avia+相机硬件也已开源。

## 对SLAM的意义

FAST-LIVO证明了"直接法"理念能够从LiDAR干净地扩展到视觉模态——一张共享地图,一个滤波器,没有特征前端。LiDAR为每个视觉锚点提供精确的深度,因此视觉几乎不需要额外成本就能贡献位姿约束。这种架构上的经济性(相较于LVI-SAM的两条特征流水线,或R3LIVE仅用于着色的VIO)使其成为在小型机载计算机上实现高频LVI里程计的模板,并直接引出了FAST-LIVO2。

## 相关条目

- [FAST-LIO2](fast-lio2.md) —— 直接法LIO基础与ikd-Tree地图
- [FAST-LIVO2](fast-livo2.md) —— 采用顺序ESIKF更新的改进后继者
- [R3LIVE](r3live.md) —— 采用地图着色式VIO理念的姊妹系统
- [SVO](../level-03-monocular-slam/svo.md) —— 其所依赖的稀疏直接视觉对齐思想
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) —— 该系统所定义的概念
- [LVI-SAM](lvi-sam.md) —— 基于特征、因子图的替代方案
