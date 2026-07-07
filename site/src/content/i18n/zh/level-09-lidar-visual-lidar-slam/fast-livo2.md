# FAST-LIVO2

> Zheng 2024 · [论文](https://arxiv.org/abs/2408.14035)

**一句话总结** —— FAST-LIVO2通过误差状态迭代卡尔曼滤波器融合IMU、LiDAR和相机,采用*顺序*更新解决了异构LiDAR测量和图像测量之间的维度不匹配问题,为机载计算资源上的直接法LVI里程计设立了新标杆。

## 问题

一次LiDAR扫描在一次更新中贡献数千个低维几何残差,而一帧相机图像贡献的光度残差在结构上完全不同——在一个卡尔曼步骤中联合更新两者颇为棘手,而FAST-LIVO的简化处理(为仿射变换假设每个图像块深度恒定、没有曝光处理、当LiDAR点缺失时没有回退机制)在精度和鲁棒性上留下了余地。FAST-LIVO2重新设计了融合架构,使其在严谨性上足够扎实,在效率上足以支持完全机载的实时机器人应用。

## 方法与架构

状态位于19维流形 $\mathcal{M} = SO(3)\times\mathbb{R}^{16}$ 上:$\mathbf{x} = [{^G}\mathbf{R}_I^T\ {^G}\mathbf{p}_I^T\ {^G}\mathbf{v}_I^T\ \mathbf{b}_g^T\ \mathbf{b}_a^T\ {^G}\mathbf{g}^T\ \tau]^T$,其中 $\tau$ 是**相机曝光时间的逆**(相对于第一帧,$\tau_0 = 1$固定以保证可观测性),建模为随机游走。扫描重组会将LiDAR流重新分割为与相机采样时刻对齐的扫描帧,使两种传感器都以相同的10 Hz频率更新。

- **顺序ESIKF更新**:将后验分解为

$$p(\mathbf{x} \mid \mathbf{y}_l, \mathbf{y}_c) \propto p(\mathbf{y}_c \mid \mathbf{x})\, \underbrace{p(\mathbf{y}_l \mid \mathbf{x})\, p(\mathbf{x})}_{\propto\, p(\mathbf{x} \mid \mathbf{y}_l)},$$

  滤波器首先对照IMU传播的先验迭代进行LiDAR更新,然后对照LiDAR已收敛的状态和协方差进行视觉更新——当两种噪声相互独立时,这在理论上等价于联合更新,但每个模块保留了自己的迭代过程和结构。每一步都使用标准的迭代卡尔曼增益 $\mathbf{K} = ((\mathbf{H}^\kappa)^T\mathbf{R}^{-1}\mathbf{H}^\kappa + \widehat{\mathbf{P}}^{-1})^{-1}(\mathbf{H}^\kappa)^T\mathbf{R}^{-1}$。
- **LiDAR测量模型**:原始点(时间上1:3下采样),点到平面残差 $\mathbf{0} = \mathbf{n}_j^T({^G}\mathbf{T}_I\,{^I}\mathbf{T}_L\,{^L}\mathbf{p}_j - \mathbf{q}_j)$ 针对存储在哈希索引体素地图(0.5米根体素,3层八叉树)中的平面计算,噪声模型同时考虑测距、方位角*以及激光束发散*——噪声随对平面的入射角增大而增大。
- **视觉测量模型**(稀疏直接法,单步帧到地图):每个视觉地图点都是一个带有图像块金字塔的LiDAR点;残差比较当前帧与参考帧之间经过曝光归一化的图像块,

$$\mathbf{0} = \tau_k\,\mathbf{I}_k(\mathbf{u}_i + \Delta\mathbf{u}) - \tau_r\,\mathbf{I}_r(\mathbf{u}'_i + \mathbf{A}^r_i\,\Delta\mathbf{u}),$$

  其中 $\mathbf{A}^r_i$ 是根据**LiDAR平面先验**(法向量可选地通过多图像块光度优化进一步精细化)计算出的仿射变换,而非FAST-LIVO的恒定深度假设。逆合成(inverse compositional)公式将位姿增量放在参考帧一侧,使雅可比矩阵只需计算一次,对齐过程在三个金字塔层级上以粗到精的方式运行。由于 $\tau_k$ 出现在残差中,曝光是在同一次更新中被估计出来的。
- **统一体素地图**:LiDAR构建并更新几何结构(平面);视觉将图像块金字塔附着到LiDAR点上。参考图像块根据与同类图像块的NCC相似度以及视角正交性重新打分;当运动超过20帧或40像素后添加新图像块;新的地图点会填充空的30×30像素网格单元,选取梯度最高的候选点。
- **按需体素光线投射**:当LiDAR返回的点很少时(近距离盲区、视场不匹配),会通过未被占据的图像网格单元投射射线,沿深度方向对体素采样,直到召回地图点——从而使视觉更新保持有约束。

## 实验结果

- **基准测试**(25个序列:NTU-VIRAL、Hilti'22、Hilti'23;LVI-SAM去除了回环检测):平均绝对平移RMSE为**0.044米**——大约是第二名FAST-LIVO(0.137米)精度的三倍,远超FAST-LIO2(0.151米)、R3LIVE(0.278米)、LVI-SAM(1.928米,在九个序列上失败)、SDV-LOAM(7.416米)。在几乎所有序列上都表现最佳,只有两个昏暗/模糊的序列中FAST-LIO2略胜几毫米。
- **消融实验**:去除在线曝光估计,平均精度损失6毫米;去除参考图像块更新,损失44毫米;法向量精细化带来约1毫米的提升(仅在光照良好的结构化场景中有帮助)。
- **运行时间**(i7-10700K):每帧对平均30.03毫秒(17.13毫秒LiDAR + 12.90毫秒图像)——在10 Hz下实时运行且有余量;在ARM RB5(Qualcomm Kryo585)上为78.44毫秒,仍属实时。尽管FAST-LIO2不处理任何图像,却也只快了约10.35毫秒。
- **建图**:实时彩色点云地图,其近景细节近似于真实的RGB图像;在展示的建图序列中端到端位置误差低于0.01米;曝光归一化着色基本消除了过曝的地图点。
- **应用**:完全机载的自主无人机导航(一项开创性的、基于LIV的真实世界闭环飞行),光线投射在近墙盲区保持定位稳定;空中建图;以及从稠密彩色地图生成网格/纹理和NeRF/3D高斯溅射模型。代码、数据集和应用均已开源。

## 对SLAM的意义

FAST-LIVO2被广泛认为是目前最强的开源直接法LVI里程计——它是HKU MARS系列(FAST-LIO2 → FAST-LIVO → FAST-LIVO2)的集大成之作。其顺序更新的技巧是一种普遍适用的模式,可用于融合维度和结构差异极大的传感器测量,而其已展示的无人机部署证明了直接三重融合在边缘计算预算下已具备可投产的成熟度。如果你今天要为机器人选择一个现代LVI系统,这就是要挑战的默认候选。

## 动手实践

- [运行 FAST-LIVO2](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/fast_livo2)

## 相关条目

- [FAST-LIVO](fast-livo.md) —— 其融合方案得以严谨化的前身
- [FAST-LIO2](fast-lio2.md) —— 直接法LiDAR-惯性核心
- [R3LIVE++](r3livepp.md) —— 共享在线曝光估计的思路
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) —— 底层原理
- [LVI-SAM](lvi-sam.md) —— LVI设计空间中的因子图对应方案
- [NeRF](../level-05-deep-learning/nerf.md) —— 其稠密地图所支持的渲染流水线之一
