# M-Estimator

普通最小二乘在高斯噪声下是统计最优的——但在外点存在时却异常脆弱，因为平方损失是无界增长的：单个严重的外点就能把估计值拖到任意远的地方。**M估计器（M-estimators，最大似然型估计器）**通过用一个增长更慢的**鲁棒核（robust kernel）**$\rho$替代平方损失来解决这个问题：

$$
\min_{\theta} \sum_i \rho\!\left(\frac{r_i(\theta)}{\sigma}\right)
$$

其中$r_i$是第$i$个残差（例如重投影误差），$\sigma$是一个将残差归一化为噪声单位的尺度参数。

## 常见的鲁棒核

- **Huber核**：小残差时为二次函数，超过阈值$k$后为线性函数：

$$
\rho(r) = \begin{cases} r^2/2 & |r| \leq k \\ k|r| - k^2/2 & |r| > k \end{cases}
$$

  凸、安全、温和——在不确定时的默认选择。

- **Cauchy（Lorentzian）核**：$\rho(r) = \frac{c^2}{2}\log\!\left(1 + r^2/c^2\right)$。呈对数增长，对大外点有强烈的降权作用，但非凸。

- **Tukey双权重核（biweight）**：完全饱和——超过阈值$c$的残差贡献一个常数代价,且梯度恰好为**零**，因此已确认的外点完全不再影响求解结果。这类*回缩型（redescending）*核对外点的排斥力最强，但需要一个不错的初始化，因为遥远的观测无法把估计值拉回来。

导数$\psi(r) = \rho'(r)$称为**影响函数（influence function）**：它衡量残差为$r$的数据点对估计值的牵引力大小。对于最小二乘，$\psi(r) = r$（无界影响）；对于Huber核，它在$\pm k$处被截断；对于Tukey核，它回缩到零。

## 用IRLS求解

将鲁棒代价的梯度置零，得到$\sum_i \psi(r_i)\,\partial r_i/\partial\theta = 0$。定义权重$w_i = \psi(r_i)/r_i$后,这就变成了一个**加权**最小二乘问题的条件，这启发了**迭代重加权最小二乘（Iteratively Reweighted Least Squares，IRLS）**：

1. 在当前估计处计算残差$r_i$。
2. 计算权重$w_i = \rho'(r_i)/r_i$（残差小→权重接近1；残差大→权重接近0）。
3. 求解加权最小二乘问题$\min_\theta \sum_i w_i\, r_i(\theta)^2$（一步Gauss-Newton/LM）。
4. 重复直到收敛。

在实践中,这能无缝集成到[Gauss-Newton](gauss-newton.md)或[Levenberg-Marquardt](levenberg-marquardt.md)循环中：鲁棒核只是重新缩放每个残差块的雅可比和误差。Ceres将这些称为`LossFunction`，g2o将其称为`RobustKernel`。

尺度参数$\sigma$与核函数本身同样重要：它定义了什么算"大"。一个标准的鲁棒估计方法源自中值绝对偏差，$\hat{\sigma} = 1.4826 \cdot \mathrm{median}_i\,|r_i - \mathrm{median}(r)|$，其中的常数使其与高斯标准差保持一致。

## M估计器与RANSAC的比较

两者是互补的，实际的流水线往往同时使用：

- [RANSAC](ransac.md)做出**硬性**的内点/外点判断，能够在外点比例极高的情况下恢复,但其输出的好坏仅取决于一次最小样本采样。
- M估计器做出**软性**、连续的判断，联合细化所有参数，但只有在初始值接近正确解的盆地时才能收敛到正确结果。

标准做法是：先用RANSAC找到一个粗略模型和内点集合，然后对内点进行鲁棒非线性细化（Huber/Cauchy）以吸收剩余的误匹配。

## 对SLAM的意义

SLAM中的每一个残差偶尔都会出错：误匹配的特征、运动的物体、错误的回环检测。即使只将少数这类残差喂入纯最小二乘[光束法平差](bundle-adjustment.md)，也会破坏整条轨迹。因此鲁棒核无处不在——ORB-SLAM将重投影误差包裹在Huber核中，位姿图后端将回环检测边包裹在Cauchy核或可切换约束（switchable-constraint）表述中，而现代的全局鲁棒方法（渐进非凸性,graduated non-convexity）直接建立在回缩型M估计器之上。知道一个系统使用哪种核、阈值设为多少，能告诉你当前端出错的那一天,该系统会如何表现。

## 相关条目

- [RANSAC](ransac.md)
- [非线性优化](non-linear-optimization.md)
- [Bundle Adjustment](bundle-adjustment.md)
- [鲁棒位姿图优化](robust-pose-graph-optimization.md)
- [GNC](gnc.md)
