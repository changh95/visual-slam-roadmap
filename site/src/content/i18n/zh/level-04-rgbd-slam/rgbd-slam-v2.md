# RGBD-SLAM-V2

> Endres 2013 · [论文](https://felixendres.github.io/rgbdslam_v2/)

**一句话总结** — 一个完整的基于图优化的RGB-D SLAM系统("使用RGB-D相机进行三维建图", T-RO 2014),利用反投影到三维空间的视觉特征点、基于光束的变换验证模型、g2o位姿图优化和OctoMap输出,并在TUM RGB-D基准数据集上进行了详尽的评测。

## 问题

早期的RGB-D SLAM方法缺乏标准化、模块化的处理流程以及可复现的评测方式。除此之外,基于特征点的RANSAC和ICP都缺乏可靠的*失效检测*机制:较低的内点数量可能只是意味着重叠区域较小,而重复性的人造结构(相同的椅子、墙纸)则会产生看似可信但实际错误的变换估计。学界需要一个鲁棒的开源基线系统,将彩色特征与稠密深度结合在一个原则清晰的图优化后端中,并对影响精度的关键因素进行严格的基于基准数据集的特征分析。

## 方法与架构

系统沿用经典的前端/后端/地图表示三元结构。

**前端:基于特征与深度的自运动估计。** 从RGB图像中提取关键点(GPU版SIFT、SURF或ORB;SURF的描述子$\mathbf{d} \in \mathbb{R}^{64}$),并通过深度图像将其定位到三维空间。匹配使用Lowe提出的最近邻/次近邻比值测试(ORB使用汉明距离;SIFT/SURF使用欧氏距离,或效果更好的Hellinger距离)。两帧之间的相对变换通过RANSAC估计:用三组3D-3D对应关系初始化一个估计值,通过马氏距离统计内点数量,再通过闭式最小二乘解、逐步收紧内点阈值来递归地精细化估计结果。

**环境测量模型(EMM)。** 为了独立于估计方式来验证候选变换,系统将一帧的深度点投影到另一帧中;每个深度像素隐式地定义了一条*光束*,观测到的自由空间点必须满足该光束的约束。对同一表面点的两次测量分别用传感器噪声协方差$\Sigma_i, \Sigma_j$建模,论文推导出

$$p(\mathbf{y}_i \mid \mathbf{y}_j) = \mathcal{N}(\mathbf{y}_i;\, \mathbf{y}_j,\, \Sigma_{ij}), \qquad \Sigma_{ij} = \Sigma_i + \Sigma_j$$

落在3个标准差以内的点被计为内点;投影后远远落在对应光束后方的点被视为"被遮挡"而忽略;落在已观测自由空间内的点被视为外点。只有当质量指标$q = I/(I+O)$(内点数占内点加外点总数的比例)超过阈值,且内点数至少占观测点总数的25%时,变换才被接受——这是一种鲁棒的逐点假设检验,而非脆弱的联合$\chi^2_{3N}$检验。

**回环检测的候选搜索。** 用于两两匹配的候选帧综合了(i)$n$个紧邻的前序帧,(ii)通过深度受限的生成树,从前一帧的测地(图)邻域中采样的$k$帧——因此已找到的回环会引导后续搜索找到更多回环——以及(iii)从指定关键帧中采样的$l$帧,用于检测大范围回环。

**后端:使用g2o的位姿图优化。** 经过验证的变换$z_{ij}$及其信息矩阵$\Omega_{ij}$构成传感器位姿$\mathbf{X}$位姿图上的边,通过最小化下式进行优化:

$$F(\mathbf{X}) = \sum_{\langle i,j\rangle \in \mathcal{C}} e(\mathbf{x}_i, \mathbf{x}_j, z_{ij})^{\top}\, \Omega_{ij}\, e(\mathbf{x}_i, \mathbf{x}_j, z_{ij})$$

优化完成后,马氏距离偏差过大的边会被剔除——这是针对重复结构导致的虚假回环的第二层鲁棒性保障。

**地图:OctoMap。** 优化后的轨迹将点云投影到概率八叉树占据地图中,该地图明确表示自由空间和未知空间(测试序列以2厘米分辨率建图仅需4.2-25 MB),且可直接用于导航,而原始点云则不具备这一优势。

## 实验结果

在TUM RGB-D基准数据集(由作者共同创建)上使用ATE指标进行评测:$\mathrm{ATE}_{\mathrm{RMSE}} = \sqrt{\tfrac{1}{n}\sum_i \|\mathrm{trans}(\hat{\mathbf{x}}_i) - \mathrm{trans}(\mathbf{x}_i)\|^2}$。主要数据(Intel i7 3.4 GHz + GTX 570):**fr1/desk上ATE RMSE为0.026 m**(15.2 Hz),fr1/room为0.087 m,fr2/desk为0.057 m,fr2/large_no_loop为0.86 m,229米长的MIT Stata Center序列为1.65 m——除fr2/large_no_loop外,均优于当时已发表的最佳结果。特征研究:GPU-SIFT精度最高(fr1系列序列的中位数RMSE为0.04 m,每帧约600-700个特征点即可满足需求),而ORB与Shi-Tomasi+SURF是速度更快的方案,其约15厘米的平均误差仅适用于较为温和的场景;Hellinger距离在部分数据集上将匹配效果提升了多达25.8%,且不增加运行时开销。在具有挑战性的"Robot SLAM" Pioneer序列上,测地邻域采样将平均误差降低了26%,而EMM(平均评估耗时0.82毫秒)与边剔除机制大幅降低了误差,两者结合使用时效果最佳。该系统完全开源。

## 对SLAM的意义

RGBD-SLAM-V2确立了"基于特征的前端+位姿图后端"这一处理流程作为RGB-D SLAM的标准基线,与KinectFusion开创的稠密GPU融合路线形成对比,其EMM引入了利用稠密深度进行的、独立于估计器的原则性失效检测方法。其影响力或许更多体现在TUM RGB-D基准数据集及ATE/RPE评测工具上,几乎所有后续的SLAM论文都会报告这些指标。它至今仍是一个完整经典SLAM系统中极具可读性的参考实现。

## 相关条目

- [3D-3D对应关系](../level-02-getting-familiar/3d-3d-correspondence.md)
- [位姿图优化](../level-02-getting-familiar/pose-graph-optimization.md)
- [DVO](dvo.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
- [评测指标](../level-02-getting-familiar/metrics.md)
