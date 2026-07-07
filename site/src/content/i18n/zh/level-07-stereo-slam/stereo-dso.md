# Stereo DSO

> Wang 2017 · [论文](https://arxiv.org/abs/1708.07878)

**一句话总结** — Stereo DSO 将 DSO 的直接稀疏光度光束法平差扩展到双目相机，在一个滑动窗口优化中将静态双目（左右目）约束与时间多视图约束耦合起来——从而在 KITTI 规模上产生高精度、度量尺度的直接法里程计。

## 问题

像 DSO 这样的单目直接法会累积尺度漂移，并且需要一个缓慢、依赖运动的启动阶段，因为深度只能从时间视差中产生。固定基线的双目装置解决了这两个问题——但仅靠静态双目只能在有限的深度范围内准确三角化，并且与外极线平行的双目边缘是退化的。Stereo DSO 提出的问题是：如何将静态双目融入时间多视图立体的直接稀疏光束法平差中，使两者相辅相成：双目提供绝对尺度和深度初始化；时间观测约束远处点和退化方向。

## 方法与架构

**流程。** 新的双目帧通过粗到精的直接图像对齐（在图像金字塔上进行高斯-牛顿优化，恒定运动初始化）与最新关键帧进行跟踪；该位姿用于优化最近选取的候选点的深度。如果场景或光照变化足够大（均方光流、相对亮度因子），则创建一个关键帧并将其加入活动窗口，在该窗口中联合优化所有关键帧的位姿、仿射亮度参数、点逆深度和相机内参；旧的关键帧和点通过舒尔补进行边缘化。系统初始化使用来自静态双目匹配的半稠密深度图（沿水平外极线在 3×5 图像块上进行 NCC 匹配），而非随机深度。

**光度能量。** 对于在 $I_j$ 中观测到的帧 $I_i$ 的点 $\mathcal{P}_i$，每幅图像的仿射亮度参数为 $a,b$：

$$E_{ij}=\sum_{\mathbf{p}\in\mathcal{P}_{i}}\sum_{\tilde{\mathbf{p}}\in\mathcal{N}_{\mathbf{p}}}\omega_{\tilde{\mathbf{p}}}\left\|I_{j}[\tilde{\mathbf{p}}^{\prime}]-b_{j}-\frac{e^{a_{j}}}{e^{a_{i}}}\left(I_{i}[\tilde{\mathbf{p}}]-b_{i}\right)\right\|_{\gamma}$$

其中 $\|\cdot\|_\gamma$ 是 Huber 范数，$\mathcal{N}_{\mathbf{p}}$ 是 8 点残差模式，$\omega_{\mathbf{p}}=c^{2}/(c^{2}+\|\nabla I_{i}(\mathbf{p})\|_{2}^{2})$ 对高梯度像素降权，$\mathbf{p}'=\Pi_{\mathbf{K}}\left(\mathbf{T}_{ji}\,\Pi_{\mathbf{K}}^{-1}(\mathbf{p},d_{\mathbf{p}})\right)$ 通过逆深度 $d_{\mathbf{p}}$ 进行重投影。

**双目耦合——核心贡献。** 每个活动点都会产生指向其他关键帧的时间残差 $r^{t}$，以及指向同一时刻右图像的静态双目残差 $r^{s}$（$\mathbf{T}_{ji}$ 由基线固定，因此其几何参数只有 $(d,\mathbf{c})$）。两者都进入由耦合因子 $\lambda$ 加权的单一能量函数：

$$E=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_{i}}\Big(\sum_{j\in obs^{t}(\mathbf{p})}E^{\mathbf{p}}_{ij}+\lambda E^{\mathbf{p}}_{is}\Big)$$

通过高斯-牛顿法最小化，$\delta\boldsymbol{\xi}=-(\mathbf{J}^{T}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^{T}\mathbf{W}\mathbf{r}$，作用于所有关键帧位姿 $\mathbf{T}$、逆深度 $d$、内参 $\mathbf{c}$，以及左/右仿射参数 $a^{L},b^{L},a^{R},b^{R}$，其中 $\mathrm{SE}(3)$ 增量应用为 $\mathbf{x}\boxplus\mathbf{T}:=\exp(\hat{\mathbf{x}})\mathbf{T}$。

**点管理与边缘化。** 候选像素从梯度自适应的图像块中选取（图像块大小与图像尺寸成比例，这对宽幅的 KITTI 图像有帮助）；它们的深度通过静态双目 NCC 匹配初始化——相比单目从零到无穷的初始化，这显著提高了跟踪精度——并在激活前由后续的非关键帧进一步优化。边缘化保持窗口的大小受限：以 $\alpha$ 表示保留的变量、$\beta$ 表示被边缘化的变量，

$$\left(\mathbf{H}_{\alpha\alpha}-\mathbf{H}_{\alpha\beta}\mathbf{H}^{-1}_{\beta\beta}\mathbf{H}^{T}_{\alpha\beta}\right)\mathbf{x}_{\alpha}=\mathbf{b}_{\alpha}-\mathbf{H}_{\alpha\beta}\mathbf{H}^{-1}_{\beta\beta}\mathbf{b}_{\beta}$$

被保留下来作为后续优化的先验。

## 实验结果

- **耦合因子**（KITTI 序列 06）：$\lambda=1,2$ 能显著降低平移和旋转误差；$\lambda>3$ 过度信任静态双目，会因错误的双目匹配而导致性能下降。
- **KITTI 训练集（00-10）**，平移 RMSE $t_{rel}$（%）/ 旋转 RMSE $r_{rel}$（度/100 米），在 100-800 米区间上取平均：Stereo DSO 平均为 **0.84 / 0.20**，而 ORB-SLAM2（VO 模式，回环检测和全局 BA 关闭）为 0.81 / 0.26，Stereo LSD-VO 为 1.14 / 0.40。旋转误差在每个序列上都优于 ORB-SLAM2；平移误差则参差不齐（例如序列 10：0.49 对比 0.58）。
- **KITTI 测试集（11-21）**：作为纯 VO 的 Stereo DSO，在所有距离区间和行驶速度上都优于 Stereo LSD-SLAM 和 ORB-SLAM2 的完整 SLAM 版本（带回环检测，且 ORB-SLAM2 还带全局 BA）。
- **Cityscapes Frankfurt**：在长时间的卷帘快门驾驶片段（每段 5000-6000 帧）上进行了定性的跟踪和三维重建，展示了对直接法一个已知弱点的鲁棒性；单目基线在 KITTI 00/06 上表现出明显的尺度漂移，而 Stereo DSO 没有。

## 对SLAM的意义

Stereo DSO 表明直接法并不局限于小型室内场景：借助双目装置，它们能够实现最先进的大规模室外里程计——作为纯 VO 击败了带回环检测的 SLAM 系统。它将静态与时间双目结合在一个光度光束法平差中，并使用双目初始化点深度的方案，成为了一种标准的设计模式：DVSO 的"虚拟双目"（CNN 预测的右图像）以及惯性扩展版本 VI-DSO 都直接建立在此基础之上。学习完 DSO 之后再研究它，可以了解直接法流程如何吸纳第二个相机。

## 相关条目

- [DSO](../level-03-monocular-slam/dso.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [DVSO](../level-03-monocular-slam/dvso.md)
- [Disparity vs Depth](disparity-vs-depth.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
