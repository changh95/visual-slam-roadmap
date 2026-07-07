# CodeMapping

> Matsuki 2021 · [论文](https://arxiv.org/abs/2107.08994)

**一句话总结** — CodeMapping(RA-L 2021)将一个CodeSLAM风格的学习式稠密建图模块嵌入到一个可靠的稀疏SLAM系统中:一个以强度图像、稀疏深度图和重投影误差图为条件的VAE,为每个关键帧预测带不确定性的稠密深度图,并在一个并行线程中通过多视角编码优化进行精化。

## 问题

当前最先进的稀疏视觉SLAM系统能够提供精确可靠的相机轨迹和地图点位置,但其稀疏地图"无法用于诸如避障或场景理解等其他任务"。完全稠密的SLAM则较为脆弱(受光度噪声影响),且无法在实时条件下联合优化其庞大的参数量,而CodeSLAM/DeepFactors仅从灰度图像预测深度,在实践中精度不足。CodeMapping探讨的问题是:如何在不触碰——也不拖慢——其经过实战检验的跟踪核心的前提下,为任意的度量式稀疏SLAM系统添加稠密的、带不确定性的建图能力。

## 方法与架构

**两个松耦合的进程。** ORB-SLAM3不加修改地运行(跟踪、局部与全局建图)。每次局部光束法平差之后,SLAM线程将一个包含4个关键帧的窗口(最新关键帧加上其共视度最高的前3个关键帧)交给稠密建图线程,内容包括相机位姿、稀疏深度图像(将地图点投影到关键帧上)以及重投影误差图像(每个地图点的平均重投影距离;未匹配的新点设为10)。

**稀疏到稠密的VAE。** 一个U-Net接收与稀疏深度图和重投影误差图(归一化到接近度 $[0,1]$)拼接后的灰度图像,并以此条件化一个VAE,输出一个潜在编码 $\mathbf{c} \in \mathbb{R}^{32}$、一个稠密深度图 $D$,以及一个不确定性图 $b$,训练时使用KL损失加上带不确定性加权的重建损失

$$\sum_{\mathbf{x}\in\Omega} \frac{\| D[\mathbf{x}] - D_{gt}[\mathbf{x}] \|}{b[\mathbf{x}]} + \log(b[\mathbf{x}]) .$$

重投影误差输入使网络能够降低外点地图点(其平均重投影误差更高)的权重。训练使用约40万张ScanNet图像,每张带有1000个由ORB选取的稀疏点;重投影误差通过沿射线扰动地图点来*模拟*,使误差服从在真实ORB-SLAM3运行中观察到的指数-高斯分布(10个epoch,学习率0.0001,分辨率256×192)。

**多视角编码优化。** 深度始终保持为一个紧凑的编码,因此建图模块在GTSAM中通过DeepFactors风格的因子来优化一致性——只优化编码本身(来自稀疏SLAM的位姿被信任并固定),所有因子均使用Huber代价。设warp函数 $\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) = \pi(\mathbf{T}_{ji}\,\pi^{-1}(\mathbf{x}, D_i[\mathbf{x}]))$:

$$E_{photo}^{ij}(\mathbf{c}_i) = \sum_{\mathbf{x}\in\Omega} \| I_i[\mathbf{x}] - I_j[\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i)] \|^2 \qquad E_{rep}^{ij}(\mathbf{c}_i) = \sum_{\mathbf{x},\mathbf{y}\in M_{ij}} \| \omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) - \mathbf{y} \|^2$$

$$E_{dpt}^{ij}(\mathbf{c}_i) = \sum_{\mathbf{x}\in\Omega'} \| \,|\mathbf{T}_{ji}\,\pi^{-1}(\mathbf{x}, D_i[\mathbf{x}])|_z - D_j[\hat{\mathbf{x}}] \,\|^2 ,$$

其中 $M_{ij}$ 为BRISK匹配,$\Omega'$ 为几何项所使用的稀疏采样像素。由于稀疏SLAM轨迹本身是全局一致的,精化后的关键帧深度最终可以被融合成一个全局一致的TSDF模型。

## 实验结果

- ScanNet测试场景(ORB-SLAM3 RGB-D模式;MAE/RMSE以米为单位,相对于渲染真值):完整方法在全部7个序列上均优于DeepFactors(仅以强度图像为条件)以及Ma等人的稀疏到稠密网络——例如场景scene0100_00上MAE为0.046,相比DeepFactors的0.185和Ma等人方法的0.141。多视角优化使单视角预测提升约10%。
- EuRoC MAV(视觉惯性模式,LiDAR渲染真值):完整方法在V101上MAE为0.192米,相比DeepFactors的0.842和Ma等人方法的0.495;稀疏点条件化显著降低了域偏移带来的损失,而重投影误差条件化则过滤了EuRoC无纹理墙面上常见的严重外点。
- 运行时间(i9-10900 + RTX 3080,两个数据集的平均值):通过TensorFlow C++ API进行稠密预测耗时235毫秒(通过Python API为11毫秒),4个关键帧的多视角优化耗时170毫秒——大约以1Hz的频率更新稠密地图而不会拖慢SLAM进程。
- 定性结果:比Kimera的Delaunay三角化生成更平滑、更精确的局部网格;实现TSDF融合的全局重建;甚至在经过尺度校正的纯单目ORB-SLAM输出上也能工作。

## 对SLAM的意义

CodeMapping清晰地展示了主导可部署系统的那种实用的"混合式"设计:保留经过实战检验的稀疏前端,只在经典方法薄弱的地方(稠密几何)引入学习,并将两者松耦合,使网络故障永远不会导致跟踪失败。它将CodeSLAM/DeepFactors的潜在编码脉络延续到了一种更贴近生产环境的架构中,其作者(Matsuki)后来又将"稠密建图与跟踪并行"这一理念带入了高斯溅射SLAM(MonoGS)。

## 相关条目

- [CodeSLAM](codeslam.md)
- [DeepFactors](deepfactors.md)
- [TANDEM](tandem.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
- [MonoGS](monogs.md)
- [Kimera / 3D动态场景图](kimera-3d-dynamic-scene-graph.md) — 与之比较的几何式实时网格化方法
