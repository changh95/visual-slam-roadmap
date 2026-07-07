# SceneCode

> Zhi 2019 · [论文](https://arxiv.org/abs/1903.06482)

**一句话总结** — 将CodeSLAM扩展为同时编码深度*和*语义分割为紧凑的、以图像为条件的潜在编码，使语义标签融合变为多视角编码优化问题，几何、位姿和语义在一个统一的优化中被估计。

## 问题

增量式语义建图系统必须存储并更新几何和语义两者，但几何估计已有成熟的概率化表述，而最先进的系统却为每个表面元素(深度像素、surfel或体素)存储*独立的*标签估计。空间相关性被丢弃，导致融合后的标签图不连贯、噪声大，且语义证据无法反馈影响运动或几何估计。基于物体图的方法(SLAM++风格)具有理想的类似token的特性，但只能覆盖离散的已知物体。SceneCode探讨语义是否可以存在于一个学习得到的紧凑编码中——就像CodeSLAM的深度编码那样——使标签成为一个可优化的、空间上连贯的地图变量。

## 方法与架构

**多任务CVAE。** 一个U形网络，共享一个ResNet-50编码器和两个RefineNet解码器，处理彩色图像；两个类似VGG的变分编码器将深度和one-hot语义标签压缩为两个低维编码($\boldsymbol{c}_d$、$\boldsymbol{c}_s$)。每个解码器被特意设计为**在编码上是线性的**，同时以图像为条件做非线性处理：

$$D\left(\boldsymbol{c}_{d},I\right)=D_{0}\left(I\right)+J_{d}\left(I\right)\boldsymbol{c}_{d}, \qquad S\left(\boldsymbol{c}_{s},I\right)=S_{0}\left(I\right)+J_{s}\left(I\right)\boldsymbol{c}_{s}$$

其中$D_0(I), S_0(I)$是零编码(最可能的单视角)预测，$J_{d/s}$是学习到的线性影响——线性性使得编码雅可比矩阵可以在每个关键帧上预先计算一次。训练结合了带预测的逐像素不确定性$b_i$的$L_1$近似损失，$\sum_{i=1}^{N}\big[\tfrac{|\widetilde{p}_{i}-p_{i}|}{b_{i}}+\log(b_{i})\big]$(近似度$p=a/(a+d)$，$a=2$米)，多类别交叉熵用于语义，KL退火的变分损失，以及自适应任务权重。

**通过多视角编码优化实现融合。** 给定相对位姿$\boldsymbol{T}_{BA}$，稠密对应关系$w\left(\boldsymbol{u}_{A},\boldsymbol{c}_{d}^{A},\boldsymbol{T}_{BA}\right)=\pi\left(\boldsymbol{T}_{BA}\,\pi^{-1}\left(\boldsymbol{u}_{A},D_{A}\left[\boldsymbol{u}_{A}\right]\right)\right)$将重叠视角联系起来。三项残差被最小化：光度残差$r_{i}=I_{A}\left[\boldsymbol{u}_{A}\right]-I_{B}\left[w\left(\boldsymbol{u}_{A},\boldsymbol{c}_{d}^{A},\boldsymbol{T}_{BA}\right)\right]$，几何残差$r_z$(warp点的深度一致性)，以及新提出的**语义一致性残差**

$$r_{s}=DS\left(S_{A}\left[\mathbf{u}_{A}\right],S_{B}\left[w\left(\mathbf{u_{A}},\boldsymbol{c}_{d}^{A},\boldsymbol{T}_{BA}\right)\right]\right)$$

其中$DS$是softmax概率之间的欧氏距离——对应像素无论视角如何都应具有相似的类别分布。由于$r_s$对语义编码*以及*位姿*以及*深度都是可微的，语义可以影响运动和结构的估计(墙壁与墙壁对齐，椅子与椅子对齐)。一个零编码先验对这个较弱锚定的语义项进行正则化。

**SLAM系统。** 一个基于关键帧的单目流水线：每个关键帧存储$I$、$\boldsymbol{c}_d$、$\boldsymbol{c}_s$；跟踪仅使用光度残差；建图在一个N帧问题上运行带阻尼的高斯-牛顿法，先优化几何+位姿，再优化语义，最后联合优化全部变量。

## 实验结果

- **数据集**：NYUv2(训练/测试795/654，13类)、Stanford 2D-3D-Semantic(66,792/3,704)、合成的SceneNet RGB-D(110,000/3,000子集)；图像分辨率256×192。重建效果在编码尺寸超过32后趋于饱和，因此全文均使用该尺寸；零编码预测在语义上可与判别式RefineNet相当，在深度上更优。
- **标签融合(2,000张SceneNet RGB-D图像，理想数据关联)**：基于编码的融合优于逐元素融合，在mIoU上最为明显——单视角41.71；2视角时：本方法43.84，对比乘法融合42.33和平均融合42.22；3视角44.23；4视角44.26。总体像素准确率从75.17提升到75.73(2视角)。
- **零编码先验消融实验**：去掉先验后，2视角融合的mIoU降至39.60——*低于*单视角——表明该学习到的先验是必不可少的。
- **系统演示**：在NYUv2、SceneNet RGB-D和Stanford上进行双视角稠密语义SfM；几何先验使初始化更鲁棒，甚至能处理纯旋转运动。

## 对SLAM的意义

SceneCode是首个用于SLAM的联合几何-语义潜在表示，证明了语义可以成为一个可优化的地图变量，而不是事后将标签涂抹到几何上——由于像素不再被视为独立的，融合后的标签保持平滑且空间上连贯。它处于帝国理工学院潜在地图这一脉络中(CodeSLAM → SceneCode → DeepFactors/NodeSLAM)，并在概念上预示了语义神经场SLAM，后者同样用单一隐式表示解码几何和语义。

## 相关条目

- [CodeSLAM](codeslam.md) — 仅处理深度的潜在编码前身
- [DeepFactors](deepfactors.md) — 基于编码的概率因子图SLAM
- [NodeSLAM](nodeslam.md) — 物体级潜在编码
- [CodeMapping](codemapping.md) — 与稀疏SLAM配合的稠密建图编码
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md) — 更早的逐surfel语义融合
