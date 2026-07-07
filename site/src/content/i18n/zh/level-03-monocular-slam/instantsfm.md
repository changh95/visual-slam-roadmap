# InstantSfM

> Zhong 2025 · [论文](https://arxiv.org/abs/2510.13310)

**一句话总结** —— 一个完全基于GPU、与PyTorch兼容的全局SfM流水线,采用稀疏感知优化,在大场景上相比COLMAP速度最高提升约40倍,同时精度相当。

## 问题

成熟的SfM系统仍以CPU为中心,构建在传统优化工具链(Ceres风格求解器)之上,这造成了"与现代基于GPU、由学习驱动的流水线之间日益严重的不匹配",并限制了可扩展性——大规模图像集合可能需要数小时到数天才能处理完。GPU加速的光束法平差(bundle adjustment)已展现出并行稀疏优化的潜力,但将其扩展为一个*完整*的全局SfM系统,一直受到两个未解决问题的阻碍:恢复度量尺度,以及数值鲁棒性(离群点滤除可能使相机/点约束不足,产生秩缺陷的正规方程,从而破坏Levenberg-Marquardt求解器)。InstantSfM构建了这样一个完整的系统。

## 方法与架构

InstantSfM遵循全局范式(与GLOMAP类似):先做旋转平均(rotation averaging),再做**全局定位(global positioning,GP)**,最后做**光束法平差(BA)**——所有阶段均在GPU上以PyTorch实现,并使用稀疏雅可比矩阵。GP从旋转后的射线方向 $\mathbf{v}_{ij}$ 联合估计点 $\mathbf{X}_j$、相机中心 $\mathbf{t}_i$ 以及每个观测的尺度 $s_{ij}$:

$$\boldsymbol{\theta}=\arg\min_{\mathbf{X},\mathbf{t},s}\sum_{i=1}^{C}\sum_{j=1}^{P}\rho\left(\|\mathbf{v}_{ij}-s_{ij}(\mathbf{X}_{j}-\mathbf{t}_{i})\|^{2}_{2}\right)$$

随后BA通过最小化重投影误差 $\mathbf{r}_{ij}=\Pi(\boldsymbol{\zeta}_{i},\mathbf{X}_{j},\mathbf{K}_{i})-\mathbf{x}_{ij}$ 来精调姿态 $\boldsymbol{\zeta}_i$、内参 $\mathbf{K}_i$ 和点。二者均用LM步骤求解 $(\mathbf{J}^{\top}\mathbf{J}+\lambda\operatorname{diag}(\mathbf{J}^{\top}\mathbf{J}))\Delta\boldsymbol{\theta}=-\mathbf{J}^{\top}\mathbf{r}$,其中BA的雅可比矩阵 $\mathbf{J}\in\mathbb{R}^{2CP\times(7C+3P)}$ 以块稀疏形式存储与处理。使其成为一个完整系统的两个贡献是:

- **深度约束的雅可比结构。** GP的尺度 $s_{ij}$ 恰好是相机 $i$ 观察到的点 $\mathbf{X}_j$ 的逆深度;在存在度量深度 $\hat{d}_{ij}$(RGB-D或单目深度模型)的地方,该值被固定为:$s_{ij}=1/\hat{d}_{ij}$,从雅可比矩阵中移除该列。由于 $\partial\mathbf{u}_{ij}/\partial\mathbf{t}_{i}=s_{ij}\mathbf{I}$,被固定的观测会对共享的相机中心施加度量尺度的梯度,而 $\mathbf{J}^{\top}\mathbf{J}$ 又将其与自由尺度耦合起来——度量尺度在求解器*内部*传播到整个场景,而不是通过事后对齐来实现。在BA中,增加了一个额外的逆深度残差项:

$$\mathbf{r}^{d}_{ij}=\frac{1}{\text{Depth}(\boldsymbol{\zeta}_{i},\mathbf{X}_{j},\mathbf{K}_{i})}-\frac{1}{\hat{d}_{ij}},\qquad \boldsymbol{\theta}=\arg\min\sum_{i,j}\rho\left(\mathbf{r}_{ij}+\lambda_{d}\mathbf{r}^{d}_{ij}\right)$$

  无效的深度像素(天空、高光反射)通过一个二值掩码 $m_{ij}$ 处理,该掩码设定参考值 $\tilde{d}^{-1}_{ij}=m_{ij}\cdot\hat{d}_{ij}^{-1}$,在一次统一的GPU运算中将该项退化为仅有重投影误差——不需要针对每个观测做线程分歧的分支判断。
- **通过动态参数提取实现鲁棒的离群点剔除。** 在每次LM迭代中,系统都会重新检查观测的几何有效性($\mathcal{O}_{\text{valid}}=\{(i_{c},i_{p})\mid z_{i_{c},i_{p}}>0.1\}$,即位于视锥内),并且只有至少存在一个有效观测的相机/点才会被压缩(通过GPU上的`torch.unique`及索引重映射)进一个精简的参数向量 $\hat{\mathbf{x}}$。由此构造出的 $\hat{\mathbf{J}}$ 不存在全零列,因此即使许多点暂时无效,正规方程也能保持满秩(直至规范变换,gauge);更新通过预条件共轭梯度法计算,并散射回原位。随着几何结构的演化,点可以在有效/无效之间转换——这与一次性预处理滤波器或仅降低残差权重的鲁棒核函数不同。

## 实验结果

- **运行时间**:在100-5,000张图像的场景中(MipNeRF360加下采样的1DSfM),相比COLMAP提速1.5倍至40倍,相比GLOMAP最高提速12倍。即便对比带GPU加速Ceres的COLMAP/GLOMAP:Alamo场景为597秒,对比COLMAP的12,855秒和GLOMAP的1,600秒;Union_Square场景为571秒,对比4,697/966秒。
- **MipNeRF360(新视角合成指标)**:在COLMAP、GLOMAP和VGGSfM中综合性能最佳;尤其避免了GLOMAP在`kitchen`场景上的灾难性失败(PSNR 27.79对16.11)。
- **ScanNet**:COLMAP和GLOMAP在大多数场景上失败(视图图校准中Ceres发散;重建不完整),而InstantSfM在所有场景中均成功,并借助深度先验进一步提升;在**ScanNet++**上,其平均Chamfer距离达到2.61,优于GLOMAP的3.80。
- 同时在DTU(结构光真值)上进行了评测。代码见:[github.com/cre185/InstantSfM](https://github.com/cre185/InstantSfM)。

## 对SLAM的意义

离线SfM是SLAM研究的主力工具:它产生伪真值轨迹、标定参数以及用于训练NeRF/3DGS和基于学习的SLAM系统的带姿态图像——将其速度提升一个数量级会缩短这整个生态系统中每一次迭代循环的时间。InstantSfM延续了从COLMAP确立的缓慢增量式CPU流水线(沿袭GLOMAP的全局公式化)向外转移的趋势,而它将深度先验融入雅可比矩阵的技巧,是将学习到的先验融合进经典估计方法(而非取而代之)的一个清晰范例。其动态参数提取的思路——每次迭代都重构问题以保持正规方程满秩——在任何驻留GPU的SLAM后端中都具有广泛的实用价值。

## 相关条目

- [COLMAP](colmap.md)
- [GLOMAP](glomap.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [VGGT](../level-05-deep-learning/vggt.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Depth Anything](../level-05-deep-learning/depth-anything.md)
