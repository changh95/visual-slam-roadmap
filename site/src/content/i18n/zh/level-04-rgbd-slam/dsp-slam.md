# DSP-SLAM

> Wang (UCL) 2021 · [论文](https://arxiv.org/abs/2108.09481)

**一句话总结** —— 通过为ORB-SLAM2增加类别级DeepSDF形状先验,从单目、立体或立体+LiDAR输入中在线重建完整、稠密的物体模型。

## 问题

没有先验的物体级SLAM系统(例如Fusion++)对每个物体的重建质量仅取决于相机恰好观察到的部分——局部视角只能得到局部、低质量的模型——而基于实例数据库的系统(SLAM++)则要求每个物体都事先被扫描过。诸如DeepSDF这样的学习型形状先验可以从稀疏观测中补全未见的物体部分,但将深度隐式形状模型整合进实时SLAM循环——同时处理在线位姿跟踪、稀疏且局部的数据以及联合地图——是一个尚未解决的问题:像FroDO这样基于先验的重建方法是缓慢的批处理方法,而NodeSLAM则需要稠密深度。DSP-SLAM为前景构建稠密物体模型、为背景构建稀疏地标点的联合地图,填补了这一空白。

## 方法与架构

ORB-SLAM2(单目或立体)提供相机跟踪、关键帧选取以及稀疏3D点云。在每个关键帧处,Mask R-CNN掩膜加上一个3D检测器为每个物体实例给出$I=\{\mathcal{B},\mathcal{M},\mathcal{D},\mathbf{T}_{co,0}\}$——2D框、掩膜、稀疏3D点观测(SLAM点,或少至50个LiDAR点),以及来自LiDAR/图像3D检测器或对物体点做PCA得到的初始位姿。每个物体是一个DeepSDF潜在编码$\mathbf{z}\in\mathbb{R}^{64}$,配合解码器$s=G(\mathbf{x},\mathbf{z})$以及7自由度位姿$\mathbf{T}_{co}\in \mathbf{Sim}(3)$。形状和位姿通过最小化两个能量项来估计。表面一致性项将观测到的反投影点驱动至零水平集:

$$E_{surf}=\frac{1}{\lvert\mathbf{\Omega}_{s}\rvert}\sum_{\mathbf{u}\in\mathbf{\Omega}_{s}}G^{2}\big(\mathbf{T}_{oc}\,\pi^{-1}\!\left(\mathbf{u},\mathcal{D}\right),\,\mathbf{z}\big)$$

单独使用这一项会导致在部分观测下形状变得过大,因此一个可微的SDF渲染器加入了带轮廓感知的深度监督:沿每条像素射线,$M$个采样深度从预测的SDF中获得占用值$o_i$(分段线性截断$\sigma=0.01$)、光线终止事件概率$\phi_{i}=o_{i}\prod_{j=1}^{i-1}(1-o_{j})$,以及期望渲染深度$\hat{d}_{\mathbf{u}}=\sum_{i=1}^{M+1}\phi_{i}d_{i}$,从而得到

$$E_{rend}=\frac{1}{\lvert\mathbf{\Omega}_{r}\rvert}\sum_{\mathbf{u}\in\mathbf{\Omega}_{r}}(d_{\mathbf{u}}-\hat{d}_{\mathbf{u}})^{2}$$

其中$\mathbf{\Omega}_{r}$加入了位于框内但掩膜外的像素,并赋予其背景深度$1.1\,d_{max}$——惩罚泄漏到轮廓之外的形状。总能量$E=\lambda_{s}E_{surf}+\lambda_{r}E_{rend}+\lambda_{c}\lVert\mathbf{z}\rVert^{2}$($\lambda_s=100$、$\lambda_r=2.5$、$\lambda_c=0.25$)通过高斯-牛顿法从$\mathbf{z}=\mathbf{0}$开始最小化,利用通过网络的解析雅可比——每次迭代比一阶下降快约一个数量级(在两项都存在时为20毫秒 vs 183毫秒),且只需约10次而非50次迭代。重建出的物体随后进入一个关于相机位姿$C$、物体位姿$O$和点$P$的联合因子图:

$$C^{*},O^{*},P^{*}=\mathop{\arg\min}_{\{C,O,P\}}\sum_{i,j}\big\lVert\mathbf{e}_{co}(\mathbf{T}_{wc_{i}},\mathbf{T}_{wo_{j}})\big\rVert_{\Sigma_{i,j}}+\sum_{i,k}\big\lVert\mathbf{e}_{cp}(\mathbf{T}_{wc_{i}},{}^{w}\mathbf{p}_{k})\big\rVert_{\Sigma_{i,k}}$$

其中相机-物体残差为$\mathbf{e}_{co}=\log(\mathbf{T}^{-1}_{co}\mathbf{T}^{-1}_{wc}\mathbf{T}_{wo})$,标准ORB-SLAM2重投影残差为$\mathbf{e}_{cp}$,由g2o中的Levenberg-Marquardt求解——物体充当额外的地标。数据关联通过3D框距离(LiDAR)或共享特征匹配(单目/立体)将检测结果与地图中的物体匹配;被重新观测的物体只进行位姿更新。

## 实验结果

在KITTI3D数据集上(7481帧,单幅图像+LiDAR,使用与基线相同的DeepSDF先验和初始化),DSP-SLAM在几乎所有物体位姿指标上都优于自动标注方法:BEV AP@0.5达83.31 vs 80.70(Easy),75.28 vs 63.36(Moderate);nuScenes NS@0.5达88.01 vs 86.52(E),76.15 vs 64.44(M)——形状明显更好(轿车不再被重建成"甲壳虫"形状)。在KITTI里程计基准上,立体+LiDAR的DSP-SLAM平均达到0.70%平移误差/每100米0.22度旋转误差——在物体丰富的序列03、05、06、08上优于其ORB-SLAM2骨干网络(0.72/0.22),并与SuMa++(0.70/0.29)相当,而每帧仅使用数百个LiDAR点;将每个物体的点数减少到50个几乎不影响精度(0.72/0.22)。纯立体运行时为0.75/0.25,在5 Hz并进行逐关键帧BA时与ORB-SLAM2(0.72/0.22)相当。完整系统以约10 fps运行,并能从单目输入在Freiburg Cars和Redwood-OS椅子数据集上生成完整的物体重建。

## 对SLAM的意义

DSP-SLAM是第一个将学习型隐式形状先验整合进在线物体重建的SLAM系统,将SLAM++的理念——地图由物体而非原始几何构成——更新到了深度学习时代:不再需要一个扫描CAD模型的数据库,一个潜在形状空间就能覆盖整个类别。它通过神经SDF进行的二阶优化表明,深度形状拟合可以运行在实时循环内部,它是经典物体级SLAM(SLAM++、Fusion++、NodeSLAM)与后来的神经场物体建图(vMAP)之间的重要过渡节点——当你需要语义上有意义、完整的物体模型而非面元(surfel)大杂烩时,这是一个很好的模板。

## 动手实践

- [运行 DSP-SLAM](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/dsp_slam)

## 相关条目

- [SLAM++](slampp.md) —— 最初的、带CAD模型数据库的面向物体SLAM
- [Fusion++](fusionpp.md) —— 无形状先验的逐物体TSDF
- [MoreFusion](morefusion.md) —— 带位姿估计以用于操作的物体级融合
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md) —— 底层SLAM骨干
- [NodeSLAM](../level-05-deep-learning/nodeslam.md) —— 由稠密深度驱动的形状先验SLAM,最接近的同期工作
- [vMAP](../level-03-monocular-slam/vmap.md) —— 作为下一步的逐物体神经场
