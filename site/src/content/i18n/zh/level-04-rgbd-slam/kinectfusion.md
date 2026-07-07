# KinectFusion

> Newcombe 2011 · [论文](https://ieeexplore.ieee.org/document/6162880)

**一句话总结** — 第一个实时RGB-D稠密SLAM系统，使用GPU加速的体积化TSDF融合和从粗到细的点到面ICP跟踪，以30 Hz的速度重建房间大小的场景。

## 问题

在KinectFusion之前，稠密3D重建需要昂贵的离线处理或缓慢的顺序算法。消费级Kinect突然带来了廉价的、30 Hz的640x480深度流，但当时没有任何系统能够实时地把这些数据融合成一个连贯的表面模型。KinectFusion用一个完全驻留在GPU上的流水线——没有离线步骤，没有特征提取——弥合了这一空白，把一个游戏外设变成了一台实时的3D扫描仪。

## 方法与架构

整个循环每帧都在GPU上运行：`深度采集 → 双边滤波 → 顶点/法向图金字塔 → ICP（3层） → TSDF融合 → 光线投射表面预测`，而光线投射得到的预测结果会成为下一帧的跟踪参照。

**表面测量。** 原始深度经双边滤波后，反投影为带有法向 $\mathbf{N}_k$（由有限差分得到）的顶点图 $\mathbf{V}_k$，然后经区块平均和降采样，构建成一个3层的金字塔。

**传感器位姿估计（frame-to-model，点到面ICP）。** 通过最小化当前实时测量与光线投射得到的模型预测 $(\hat{\mathbf{V}}_{k-1}, \hat{\mathbf{N}}_{k-1})$ 之间的全局点-面能量，来求解位姿 $\mathbf{T}_{g,k} \in \mathrm{SE}(3)$：

$$E(\mathbf{T}_{g,k}) = \sum_{\mathbf{u},\,\Omega_k(\mathbf{u}) \neq \text{null}} \Big\| \big(\mathbf{T}_{g,k}\dot{\mathbf{V}}_k(\mathbf{u}) - \hat{\mathbf{V}}^{g}_{k-1}(\hat{\mathbf{u}})\big)^{\!\top} \hat{\mathbf{N}}^{g}_{k-1}(\hat{\mathbf{u}}) \Big\|_2$$

对应关系 $\hat{\mathbf{u}}$ 来自**投影数据关联（projective data association）**（将实时顶点投影到预测的地图中——不需要最近邻搜索），并通过距离和法向兼容性阈值 $\varepsilon_d, \varepsilon_\theta$ 进行门限筛选。在假设帧间运动较小的情况下，增量变换用参数 $\mathbf{x} = (\beta, \gamma, \alpha, t_x, t_y, t_z)^\top \in \mathbb{R}^6$ 线性化，得到一个 $6{\times}6$ 的对称正规方程系统 $\sum \mathbf{A}^\top \mathbf{A}\,\mathbf{x} = \sum \mathbf{A}^\top b$，该系统在GPU上通过并行树形归约构建，在CPU上通过Cholesky分解求解。迭代以从粗到细的方式运行，在金字塔层级 $[3, 2, 1]$ 上最多分别迭代 $[4, 5, 10]$ 次。对 $\mathbf{x}$ 的零空间和幅值检查可以检测出退化几何或线性化失效，并触发重定位模式。

**通过TSDF融合建图。** 一个固定的体素网格为每个体素存储一个截断的有符号距离 $F(\mathbf{p})$ 和权重 $W(\mathbf{p})$；每一帧的投影有符号距离，被截断到一个宽度为 $\mu$ 的条带中，

$$f_k(\mathbf{p}) = \Psi\left(\frac{d_k(\pi(\mathbf{K}\mathbf{T}_{g,k}^{-1}\mathbf{p})) - \lambda^{-1}\|\mathbf{p} - \mathbf{t}_{g,k}\|}{\mu}\right), \qquad \Psi(\eta) = \min\big(1, \max(-1, \eta)\big)$$

再通过加权滑动平均进行融合

$$F_{k}(\mathbf{p}) = \frac{W_{k-1}(\mathbf{p})\,F_{k-1}(\mathbf{p}) + w_k(\mathbf{p})\,f_k(\mathbf{p})}{W_{k-1}(\mathbf{p}) + w_k(\mathbf{p})}$$

从而使传感器噪声被平均掉；将 $W$ 截断在一个最大值处，则会得到一个可以吸收场景小幅变化的移动平均。

**通过光线投射进行表面预测。** 光线在TSDF中前进直到穿过零交叉点（当数值仍处于正向截断状态时以小于 $\mu$ 的步长跳跃前进），交叉点通过对三线性采样值做线性插值来精化——从而得到既用于显示、也作为下一次ICP参照的预测顶点/法向图。相对于frame-to-frame，采用针对已融合体积的frame-to-model跟踪，是本论文最核心的设计选择。

## 实验结果

所有评估都基于实时Kinect数据（30 Hz的640x480深度图）。在转台实验中（560帧、约19秒，在一个3立方米的体积内使用256^3的体素），frame-to-frame ICP积累了明显的漂移和一条非闭合的轨迹，而frame-to-model跟踪在没有任何显式全局优化的情况下就能闭合首末帧、使其几乎完全重合；将同一循环反复输入M=4次能进一步收紧对齐并减少伪影。关键帧式跟踪（每8帧取一帧）能减少漂移，但只有frame-to-model才是无漂移的。在内存减少为1/64（64^3体素，每6帧取一帧）时，系统性能优雅地退化。从64^3到512^3，每种体素分辨率下的耗时保持恒定；TSDF融合的处理速度超过每秒650亿体素（约每次完整的512^3体积更新耗时2毫秒），每个体素分量只需16位就足够（SDF值最少可用6位）。论文报告的失效模式是：一个占满视野的大平面会使ICP零空间中的6个自由度中的3个处于无约束状态。该论文获得了ISMAR 2011最佳论文奖。

## 对SLAM的意义

KinectFusion确立了标准流水线——深度预处理、投影数据关联ICP、TSDF融合、光线投射预测——几乎所有后续的RGB-D稠密SLAM系统都建立在这一流水线之上。它证明了廉价的消费级深度传感器加上GPU并行性，就能实现此前需要离线处理才能达到的稠密重建效果,从而引发了本级别所涵盖的整整一波融合系统（Kintinuous、ElasticFusion、BundleFusion、InfiniTAM）。它自己指出的局限性——固定体积、静态场景假设——则定义了这些后继系统所追求的研究方向。

## 相关条目

- [ICP](icp.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [Kintinuous](kintinuous.md)
- [ElasticFusion](elasticfusion.md)
- [DynamicFusion](dynamicfusion.md)
