# CNN Pose Regression Limitations

> Sattler 2019 · [论文](https://arxiv.org/abs/1903.07504)

**一句话总结** — 这篇CVPR 2019的分析文章("Understanding the Limitations of CNN-based Absolute Camera Pose Regression")表明,PoseNet风格的绝对位姿回归方法,其行为更像是带位姿插值的图像检索,而不是真正基于3D几何的定位。

## 问题

视觉定位——在已知场景中精确估计相机位姿——传统上是通过3D几何求解的:建立2D-3D匹配,然后在RANSAC框架内运行PnP求解器。将图像直接映射到位姿的端到端绝对位姿回归(APR)网络(PoseNet及其后续工作)因其速度快、结构简单而流行起来,但始终未能达到基于结构方法的精度。这篇论文追问的是*为什么*:APR网络究竟学到了什么,这种方法的根本局限又在哪里?

## 方法与架构

论文建立了一个涵盖所有PoseNet类架构的理论模型,这些架构共享三个阶段:一个卷积特征提取器 $F(\mathcal{I})$,一个(非线性)嵌入 $E(F(\mathcal{I})) = \alpha^{\mathcal{I}} \in \mathbb{R}^n$(倒数第二层),以及一个将嵌入投影到位姿空间的最终线性层。学习到的定位函数为

$$L(\mathcal{I}) = \mathbf{b} + \mathtt{P} \cdot E(F(\mathcal{I})) = \mathbf{b} + \sum_{j=1}^{n} \alpha_j^{\mathcal{I}} \mathbf{P}_j,$$

其中 $\mathtt{P} \in \mathbb{R}^{(3+r)\times n}$ 是最后一层的投影矩阵,$\mathbf{b}$ 是偏置,$\mathbf{P}_j = (\mathbf{c}_j^T, \mathbf{r}_j^T)^T$ 是其按平移和朝向部分拆分的列。分解后,预测的位姿为

$$\begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{I}}\\ \hat{\mathbf{r}}_{\mathcal{I}}\end{pmatrix}=\begin{pmatrix}\mathbf{c}_{b}+\sum_{j=1}^{n}\alpha_{j}^{\mathcal{I}}\mathbf{c}_{j}\\ \mathbf{r}_{b}+\sum_{j=1}^{n}\alpha_{j}^{\mathcal{I}}\mathbf{r}_{j}\end{pmatrix}.$$

**解读**:APR学到的是一组*基础位姿(base poses)* $\mathcal{B} = \{(\mathbf{c}_j, \mathbf{r}_j)\}$,并将每一个预测表示为它们的线性组合(实际上由于ReLU,是锥形组合),而图像外观只是在调节系数 $\alpha_j^{\mathcal{I}}$。输出结果与场景的3D结构没有任何关联。由此推导出两个预测,并在实验中得到了验证:

- **必然失败的情形。** 如果所有训练位置都位于一条直线 $\mathbf{o} + \delta\mathbf{d}$ 上,那么一个可行的训练解会把所有基础平移都放在这条直线上——而直线上的点的线性组合仍然停留在这条直线上,因此网络*无法*泛化。对PoseNet和MapNet学到的基础平移进行可视化,恰好证实了这种坍缩现象(自动扶梯和建筑外墙场景)。
- **APR ≈ 检索。** 将测试嵌入写作训练嵌入加上一个偏移量,$\alpha^{\mathcal{I}} = \alpha^{\mathcal{J}} + \Delta^{\mathcal{I}}$,可得

$$\begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{I}}\\ \hat{\mathbf{r}}_{\mathcal{I}}\end{pmatrix} = \begin{pmatrix}\hat{\mathbf{c}}_{\mathcal{J}}\\ \hat{\mathbf{r}}_{\mathcal{J}}\end{pmatrix} + \begin{pmatrix}\sum_{j=1}^{n}\Delta_j^{\mathcal{I}}\mathbf{c}_{j}\\ \sum_{j=1}^{n}\Delta_j^{\mathcal{I}}\mathbf{r}_{j}\end{pmatrix},$$

  也就是说,APR在结构上预测的是一个*相对于相似训练图像*的位姿——这正是图像检索加位姿插值所做的事情,并与相对位姿回归密切相关。

实验工具包括:作为APR代表的PoseNet(带学习的损失权重)和MapNet,作为基于结构方法金标准的Active Search(RootSIFT + P3P-RANSAC),以及作为检索基线的DenseVLAD(手工设计的密集RootSIFT汇聚成4096维VLAD描述子),另外还有一个对检索到的前 $k$ 张图像的位姿进行插值的变体。

## 实验结果

- **Cambridge Landmarks与7 Scenes**:"绝对和相对位姿回归方法都无法始终稳定地超过检索基线",APR方法"在性能上往往更接近图像检索而不是基于结构的方法"(位置/朝向误差中位数,表2)。AnchorNet作为最佳的端到端方法,在最大的场景(Street)上仍未能超过DenseVLAD。
- **TUM LSI**(无纹理室内场景):即使低层SIFT特征处于不利地位,DenseVLAD仍然优于位姿回归方法。
- **RobotCar**:MapNet+和MapNet+PGO在1.1公里的LOOP场景上超过了DenseVLAD,但在9.6公里的FULL场景上表现"明显更差"——这是一个可扩展性方面的失败。
- **密集采样的合成数据**(Shop Facade渲染,在训练轨迹外延最多3米、以25厘米网格采样的额外位姿):更多数据有帮助,但PoseNet和MapNet"即便使用多一个数量级的数据,性能也远远达不到Active Search的水平"。
- **DeepLoc**:DenseVLAD优于单图APR方法,Active Search甚至超过了基于序列的VLocNet++变体。

## 对SLAM的意义

这篇论文是解释"仅用CNN回归位姿"为何不能替代几何式重定位的标准参考文献。SLAM中的重定位和回环检测候选需要能够泛化到已建图轨迹之外的位姿,而这项分析阐明了哪些学习方法能够做到这一点(基于结构的方法:场景坐标回归、特征匹配+PnP),哪些方法做不到(直接回归)。它所引入的检索基线合理性检查现已成为评估任何学习式重定位方法的标准做法。

## 相关条目

- [PoseNet](posenet.md)
- [DSAC](dsac.md)
- [DSAC\*](dsac-star.md)
- [ACE](ace.md)
- [HF-Net](hf-net.md)
- [NetVLAD](netvlad.md)
