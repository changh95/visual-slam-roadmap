# CodeSLAM

> Bloesch 2018 · [论文](https://arxiv.org/abs/1804.00874)

**一句话总结** — CodeSLAM(CVPR 2018)将每个关键帧的稠密深度图表示为一个来自图像条件化变分自编码器的小型潜在编码,使稠密几何足够紧凑,从而能够与相机位姿联合优化。

## 问题

实时3D感知中几何的表示方式仍然是一个关键的未解决问题。稠密地图能够捕捉完整的表面形状,但其高维度使其存储和处理代价高昂,也不适合严格的概率推断;基于稀疏特征的表示允许对结构和运动进行联合概率推断,但只捕捉了部分场景信息,主要用于定位。然而,自然场景几何具有高度的有序性——相邻的深度值高度相关——因此稠密表示实际上不应该需要大量参数。CodeSLAM寻求的是一种**既稠密又紧凑且可优化**的表示方式:用足够少的参数表达完整表面几何,从而能够置于联合概率优化之中。

## 方法与架构

**以强度图像为条件的深度自编码。** 一个变分自编码器压缩关键帧的深度图,但以强度图像为条件,使编码只保留仅凭图像本身无法预测的信息:

$$D = D(I, \boldsymbol{c})$$

其中 $I$ 是强度图像,$\boldsymbol{c}$ 是潜在编码(参考网络中为128维)。一个U-Net将 $I$ 分解为多尺度特征,这些特征在匹配的分辨率上被拼接进深度编码器/解码器中;变分瓶颈(两个512通道的全连接层,带KL正则化)保持编码到深度映射的平滑性。设置 $\boldsymbol{c}=0$ 会得到最可能的单视角深度预测 $D(I,0)$。

**不确定性感知训练。** 网络预测每个像素的均值 $\mu$ 和不确定性 $b$,在四个金字塔层级上使用观测深度 $\tilde{d}$ 的拉普拉斯分布负对数似然进行训练:

$$-\log p(\tilde{d}\mid\mu,b) = \frac{|\tilde{d}-\mu|}{b} + \log(b)$$

深度被重新参数化为*接近度(proximity)* $p = a/(d+a)$(平均深度为 $a$),将 $[0,\infty]$ 映射到 $[0,1]$。训练使用SceneNet RGB-D数据集,采用ADAM优化器(学习率从 $10^{-4}$ 降到 $10^{-6}$,共6个epoch)。使用**线性解码器**,以便雅可比矩阵 $\partial D/\partial\boldsymbol{c}$(否则每次评估最多需要约1秒)可以在每个关键帧上预先计算一次。

**稠密warp与联合优化。** 给定视角之间的位姿 $\boldsymbol{T}_A^B=(\boldsymbol{R}_A^B, {}_B\boldsymbol{t}_A^B)$,每个像素 $\boldsymbol{u}$ 的warp为

$$w(\boldsymbol{u},\boldsymbol{c}_{A},\boldsymbol{T}_{A}^{B})=\pi\big(\boldsymbol{R}_{A}^{B}\,\pi^{-1}(\boldsymbol{u},D_{A}[\boldsymbol{u}])+{}_{B}\boldsymbol{t}_{A}^{B}\big)$$

其中 $\pi,\pi^{-1}$ 是投影/逆投影算子,$D_A[\boldsymbol{u}]$ 是一次像素查表。一个N帧的结构从运动(SfM)后端为每一帧分配一个未知编码(初值为0)和位姿(初值为单位),并在所有重叠帧对上最小化光度和几何残差,

$$E_{\mathrm{pho}} = L_{p}\big(I_{A}[\boldsymbol{u}]-I_{B}[w(\boldsymbol{u},\boldsymbol{c}_{A},\boldsymbol{T}_{A}^{B})]\big), \qquad E_{\mathrm{geo}} = L_{g}\big(D_{A}[\boldsymbol{u}]-D_{B}[w(\boldsymbol{u},\boldsymbol{c}_{A},\boldsymbol{T}_{A}^{B})]\big)$$

其中损失 $L_p, L_g$ 屏蔽无效的对应关系,对两类误差进行加权,施加Huber加权,并降低倾斜或被遮挡像素的权重。一个带阻尼的高斯-牛顿求解器更新所有编码和位姿。**跟踪**利用同样的机制(仅光度代价,由粗到细)将当前帧与上一个关键帧对齐;整个系统采用PTAM风格,交替进行跟踪和建图,并将旧关键帧边缘化为一个线性先验。

## 实验结果

- **编码大小**:重建精度在编码大小为128时趋于饱和;彩色输入和非线性解码没有带来显著提升。编码项的雅可比矩阵显示,各条目控制着语义上连贯一致的图像区域。
- **N帧SfM(SceneNet RGB-D)**:随着帧数增加,主关键帧的均方根接近度误差单调下降——从1帧时的 $2.65\times10^{-2}$ 降到6帧时的 $2.14\times10^{-2}$,证明了对稠密几何的真正多视角精化。
- **泛化能力**:尽管仅在合成数据上训练,仍能在真实的EuRoC和NYU V2图像上实现双帧重建;EuRoC结果使用了50步优化,每步约100毫秒。
- **在EuRoC MH_02上的视觉里程计**:以滑动窗口(4关键帧)视觉里程计方式运行,行进9米后误差约为1米——无法与视觉惯性系统竞争,但对于仅有合成数据训练先验的纯视觉方法而言已属可观;地图更新频率约为5Hz。

## 对SLAM的意义

CodeSLAM回答了一个自DTAM以来一直阻碍稠密SLAM发展的问题:如何将稠密几何纳入联合概率优化,而不是在事后才进行融合。其核心经验——在优化器与稠密地图之间放置一个学习到的低维参数化——是学习式SLAM中最具影响力的思想之一(获CVPR 2018最佳论文荣誉提名),催生了SceneCode、DeepFactors、NodeSLAM和CodeMapping,并从概念上预见了神经隐式SLAM(iMAP、NICE-SLAM),其中网络参数再次充当紧凑的可优化几何表示。

## 相关条目

- [DeepFactors](deepfactors.md)
- [SceneCode](scenecode.md)
- [NodeSLAM](nodeslam.md)
- [CodeMapping](codemapping.md)
- [iMAP](imap.md)
- [DTAM](../level-03-monocular-slam/dtam.md)
