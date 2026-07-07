# GNC

> Yang 2020 · [论文](https://arxiv.org/abs/1909.08605)

**一句话总结** — Graduated Non-Convexity（渐进非凸性）：一种通用的鲁棒估计框架，从一个凸的代理代价函数出发，逐步将其变形为目标鲁棒（非凸）代价函数，可作为围绕任意非最小求解器的黑盒包装器——无需初始猜测。

## 问题

半定规划（SDP）和平方和（SOS）松弛已经为若干机器人与视觉问题（位姿图优化、旋转平均、配准）产生了可证明最优的*非最小求解器*——但这些求解器依赖于最小二乘表述，因此对错误的回环闭合和虚假匹配等外点较为脆弱。标准的解决办法是使用鲁棒代价函数（Geman-McClure、截断最小二乘），但这又重新引入了非凸性，因此局部迭代优化需要一个良好的初始猜测——而可证明最优的求解器则完全无法应用。GNC使得非最小求解器与鲁棒估计能够同时使用，且无需初始猜测。

## 方法与架构

无外点情形下的估计是最小二乘问题，$\min_{\mathbf{x}\in\mathcal{X}}\sum_{i=1}^{N} r^2(\mathbf{y}_i,\mathbf{x})$，其中 $r$ 是测量值 $\mathbf{y}_i$ 在估计 $\mathbf{x}$ 处的残差；鲁棒性则是用鲁棒代价函数 $\rho$ 替换二次项。GNC则优化一个由控制参数 $\mu$ 支配的代理函数 $\rho_\mu$，在调度序列的一端为凸函数，在另一端等于 $\rho$。对于Geman-McClure（GM）而言：

$$\rho_\mu(r) = \frac{\mu\bar{c}^2 r^2}{\mu\bar{c}^2 + r^2},$$

当 $\mu\to\infty$ 时变为二次（凸）函数，在 $\mu=1$ 时恢复为GM；$\bar{c}$ 设定为内点预期的最大误差。对于截断最小二乘（TLS），也可推导出类似的三段式代理函数，在 $\mu\to 0$ 时为凸函数，在 $\mu\to\infty$ 时精确。

关键的实现要素是**Black-Rangarajan对偶性**：最小化 $\sum_i \rho_\mu(r_i)$ 等价于一个加权最小二乘问题加上一个*外点过程*，

$$\min_{\mathbf{x}\in\mathcal{X},\ w_i\in[0,1]} \sum_{i=1}^{N} \Big( w_i\, r^2(\mathbf{y}_i,\mathbf{x}) + \Phi_{\rho_\mu}(w_i) \Big),$$

其中 $w_i$ 是每个测量的权重，$\Phi_{\rho_\mu}$ 是对这些权重的惩罚项——对于GM，$\Phi_{\rho_\mu}(w_i)=\mu\bar{c}^2(\sqrt{w_i}-1)^2$；对于TLS，$\Phi_{\rho_\mu}(w_i)=\frac{\mu(1-w_i)}{\mu+w_i}\bar{c}^2$。在每个固定的 $\mu$ 下，算法交替执行两个步骤：

1. **变量更新** — $\mathbf{x}^{(t)} = \arg\min_{\mathbf{x}\in\mathcal{X}} \sum_i w_i^{(t-1)} r^2(\mathbf{y}_i,\mathbf{x})$：这是无外点问题的一个*加权*版本，由现有的非最小求解器（Horn方法、SE-Sync、网格配准SDP等）全局求解。
2. **权重更新** — 具有闭式解。对于GNC-GM，给定残差 $\hat{r}_i^2 = r^2 (\mathbf{y}_i,\mathbf{x}^{(t)})$：

$$w_i^{(t)} = \left( \frac{\mu\bar{c}^2}{\hat{r}_i^2 + \mu\bar{c}^2} \right)^{2};$$

对于GNC-TLS，则采用三段式规则：当 $\hat{r}_i^2 \le \frac{\mu}{\mu+1}\bar{c}^2$ 时 $w_i=1$，当 $\hat{r}_i^2 \ge \frac{\mu+1}{\mu}\bar{c}^2$ 时 $w_i=0$，介于两者之间时 $w_i = \frac{\bar{c}}{\hat{r}_i}\sqrt{\mu(\mu+1)} - \mu$。

外层循环随后增加非凸程度：GNC-GM初始化 $\mu = 2r_{\max}^2/\bar{c}^2$，每次外层迭代除以1.4，直至 $\mu<1$；GNC-TLS初始化 $\mu = \bar{c}^2/(2r_{\max}^2-\bar{c}^2)$，每次乘以1.4，直至加权残差和收敛。所有权重初始均为1。由于求解器只需求解加权最小二乘问题，GNC可以作为围绕Ceres/g2o/GTSAM风格后端或可证明求解器的黑盒使用。作为进一步贡献，本文提出了首个可证明最优的形状配准（从2D-3D对应关系估计弱透视物体位姿）非最小求解器，通过SOS松弛在非单位四元数 $\mathbf{v}=\sqrt{s}\,\mathbf{q}$ 上最小化一个四次多项式（经实验验证总是精确的）。

## 实验结果

- **点云配准**（斯坦福兔子模型，$N=100$ 对应关系，噪声 $\sigma=0.01$）：GNC-GM、GNC-TLS、RANSAC和ADAPT在外点比例低于90%时精度相近，均在90%时崩溃；在80%外点比例下，平均运行时间为218毫秒（RANSAC）、22毫秒（GNC-GM）、23毫秒（GNC-TLS）。TEASER的鲁棒性更强，但在大规模实例上耗时超过5分钟。
- **网格配准**（PASCAL+ "car-2"；40个点到点、80个点到线、80个点到面的对应关系）：GNC-GM、GNC-TLS和ADAPT对80%的外点具有鲁棒性，而使用12点最小求解器的RANSAC在50%时就崩溃；GNC的迭代次数大致保持恒定，而ADAPT的迭代次数则随外点比例线性增长。
- **位姿图优化**（INTEL和CSAIL数据集，包含被污染的回环闭合，与g2o、DCS、PCM、ADAPT比较）：GNC-TLS表现最佳——在INTEL上对高达40%的外点不敏感，在70–80%的外点比例下仍可接受，在CSAIL上对90%的外点具有鲁棒性；g2o全程表现不佳，DCS/PCM则逐渐退化。
- **形状配准**（FG3DCar，全部600张图像）：GNC-GM/TLS和ADAPT对70%的外点具有鲁棒性；RANSAC在60%时崩溃；Zhou的凸松弛方法迅速退化。一次SOS求解大约耗时80毫秒。

核心结论：这些鲁棒非最小求解器能够容忍70–80%的外点，优于RANSAC，比专用局部求解器更精确，且比专用全局求解器更快——尽管GNC无法保证全局最优性。

## 对SLAM的意义

外点剔除决定了一份地图是可用还是被破坏的，而GNC为每个SLAM后端提供了一种简单、通用的鲁棒化方法，不需要针对具体问题设计凸松弛。它已作为`GncOptimizer`集成进GTSAM，用于鲁棒的位姿图优化、点云配准和旋转平均；在Carlone研究组内，它与可证明求解器（SE-Sync、TEASER++）互为补充，是那种实用的通用工具。

## 相关条目

- [SE-Sync](se-sync.md) — 可证明最优的位姿图优化
- [TEASER++](teaserpp.md) — 也采用GNC思想的可证明鲁棒配准方法
- [QUASAR](quasar.md) — 在极端外点条件下的可证明旋转搜索，使用了与GNC相同的TLS代价函数
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — GNC所处理的问题背景
- [ICP](../level-04-rgbd-slam/icp.md) — GNC可以使其鲁棒化的一种配准流程
