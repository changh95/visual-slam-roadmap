# COLMAP

> Schönberger 2016 · [论文](https://colmap.github.io/)

**一句话总结** — 事实上的标准开源增量式Structure-from-Motion与多视角立体（Multi-View Stereo）流水线（"Structure-from-Motion Revisited"，CVPR 2016），在整个3D视觉领域被用作离线重建和真值位姿的主力工具。

## 问题

到2016年，增量式SfM——逐张注册图像，同时三角化结构并进行光束法平差——已经是处理无序照片集合的主流策略，但"鲁棒性、精度、完整性和可扩展性仍然是构建真正通用流水线的关键问题"。已有系统（Bundler、VisualSFM）常常无法注册大比例的可注册图像，或因误注册和漂移而产生破碎的模型。Schönberger和Frahm重新审视了增量式流水线的每个阶段并加以强化，最终发布为COLMAP。

## 方法与架构

该流水线包含两个阶段：**对应关系搜索**（特征提取、匹配、几何验证，产生一个*场景图*）和**增量式重建**（初始化、通过PnP进行图像注册、三角化、光束法平差、外点过滤）。论文的贡献强化了每一个步骤：

- **场景图增强**：多模型几何验证针对每一对图像估计基础矩阵（$N_F$ 个内点）、单应矩阵（$N_H$）和本质矩阵（$N_E$），并通过内点比例（如 $N_H/N_F$）以及三角化角度的中位数 $\alpha_m$ 将每条边分类为*一般*、*全景*（纯旋转）或*平面*；水印/时间戳/边框("WTF")图像对通过边框区域的相似变换检测并剔除。重建仅从非全景、优先使用已标定的图像对开始播种，且全景图像对永不进行三角化。
- **下一最佳视图选择**：候选图像通过一个多分辨率金字塔评分（$L$ 个层级，每边 $K_l = 2^l$ 个格子，权重 $w_l = K_l^2$）：包含可见三角化点的每个格子在每个层级贡献一次分数，因此分数 $S$ 同时奖励*数量多*且*分布均匀*的2D-3D对应关系——这是对以不确定性驱动的视图规划的一种高效近似。
- **鲁棒多视角三角化**：特征轨迹（通过传递链接得到的匹配）可能存在严重的外点污染，因此三角化被建模为在轨迹元素上进行的递归RANSAC：采样两个测量值，用DLT对 $X_{ab} \sim \tau(\bar{x}_a, \bar{x}_b, P_a, P_b)$（$a \neq b$）三角化，且只有在良态条件下才接受该模型——即足够大的三角化角 $\alpha$（满足

$$\cos\alpha=\frac{t_{a}-X_{ab}}{\left\|t_{a}-X_{ab}\right\|_{2}}\cdot\frac{t_{b}-X_{ab}}{\left\|t_{b}-X_{ab}\right\|_{2}}$$

  ），外加正深度（视差可行性检验）和低于阈值 $t$ 的重投影误差。对剩余测量值的递归处理能从被错误合并成一条轨迹的多个独立点中恢复出来。
- **迭代式BA、重三角化、过滤**：光束法平差最小化经鲁棒化处理的重投影误差

$$E=\sum_{j}\rho_{j}\left(\left\|\pi\left(P_{c},X_{k}\right)-x_{j}\right\|_{2}^{2}\right)$$

  优化对象是位姿 $P_c \in \mathrm{SE}(3)$ 和点 $X_k \in \mathbb{R}^3$（局部BA中使用Cauchy损失 $\rho_j$；用Ceres配合稀疏直接求解器或PCG求解）。局部BA在每次注册后运行；全局BA仅在模型增长到一定百分比后才运行。COLMAP在VisualSFM的BA前重三角化（pre-BA RT）基础上增加了*BA后*重三角化，并在BA→RT→过滤之间迭代，直到被过滤掉的观测数量减少，以此对抗漂移。
- **冗余视图挖掘**：对于密集的图像集合，将互重叠度 $V_{ab}=\left\|v_{a}\wedge v_{b}\right\| / \left\|v_{a}\vee v_{b}\right\|$（二值点可见性向量）高的未受影响图像聚类为若干组 $G_r$，在BA中折叠为单个相机，使用分组代价 $E_g$、分组投影 $\pi_g(G_r, P_c, X_k)$ 及 $P_{cr}=P_{c}G_{r}$——从而缩小约化相机系统的规模。

一个配套的基于PatchMatch的MVS阶段（"Pixelwise View Selection for Unstructured Multi-View Stereo"，ECCV 2016）对输出进行稠密化；整个系统以维护良好的C++/CUDA代码库形式发布，附带GUI、CLI以及`pycolmap`绑定。

## 实验结果

在共计144,953张无序互联网照片、17个数据集上，与Bundler、VisualSFM、Theia和DISCO进行了评测：

- **完整性**：几乎在每个数据集上都能注册最多的图像——例如Rome数据集：从74,394张图像中注册出20,918张，而Bundler为14,797张、Theia为13,455张；Quad数据集：5,860张，而对比方法为5,624/5,028张。
- **精度**：在Quad数据集的真值相机位置上取得最佳位姿精度——中位误差0.85 m，而VisualSFM为0.89 m、Bundler为1.01 m、DISCO为1.16 m；平均重投影误差约为0.6–0.8像素，而Bundler/Theia约为1.5–3.2像素。
- **效率**：比Bundler快超过50倍（比VisualSFM略慢；Theia最快）。RANSAC三角化比穷举采样快10–40倍，轨迹长度仅略短；在Dubrovnik数据集（来自4700万验证匹配的290万条轨迹）上，递归RANSAC恢复出906,501个点，平均轨迹长度为8.8，而Bundler为713,824个点，平均轨迹长度为7.8。
- **冗余视图挖掘**：在重叠阈值 $V$ = 0.6/0.3/0.1下，总运行时间分别提速5%/14%/32%，平均重投影误差仅从0.26像素退化到0.27–0.29像素；在Colosseum数据集上，$V$ = 0.4使整个流水线的运行时间缩短36%，且重建质量相当。

## 对SLAM的意义

COLMAP是评判SLAM系统和学习式重建方法的参照基准，也是生成相机位姿以训练和评估这些方法的标准工具——大多数NeRF与3D高斯溅射（Gaussian Splatting）流水线都是从COLMAP位姿开始的。理解它的增量式设计有助于厘清SLAM在哪些方面有所不同（顺序输入、实时预算、回环检测），而其随图像数量增长的单帧代价，正是全局SfM（GLOMAP）、GPU并行（InstantSfM）以及前馈式（DUSt3R、VGGT）后继方法所要解决的痛点。

## 相关条目

- [GLOMAP](glomap.md)
- [InstantSfM](instantsfm.md)
- [DUSt3R](../level-05-deep-learning/dust3r.md)
- [hloc](../level-05-deep-learning/hloc.md)
- [BARF](../level-05-deep-learning/barf.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
