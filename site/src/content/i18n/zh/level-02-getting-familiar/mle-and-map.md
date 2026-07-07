# MLE与MAP

最大似然估计(MLE)和最大后验估计(MAP)是把"SLAM"从一个模糊目标变成一个具体优化问题的两条统计学原理。几乎每一个SLAM后端——无论是滤波器还是平滑器——都在计算这两种估计中的某一种。

## 贝叶斯定理搭建舞台

设 $\mathbf{x}$ 为状态(机器人位姿与地图),$\mathbf{z}$ 为测量值(特征观测、IMU读数)。贝叶斯定理把我们想要的东西(后验)与传感器模型和运动模型所给出的东西联系起来:

$$
p(\mathbf{x} \mid \mathbf{z}) = \frac{p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})}{p(\mathbf{z})} \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

- $p(\mathbf{z} \mid \mathbf{x})$——**似然(likelihood)**:如果状态为 $\mathbf{x}$,测量值出现的概率有多大(由观测模型给出)。
- $p(\mathbf{x})$——**先验(prior)**:在看到 $\mathbf{z}$ 之前我们对状态的信念(来自运动模型或之前的估计)。
- $p(\mathbf{z})$——归一化常数,对优化没有影响。

## 两种估计器

**MAP**选取使后验最大化的状态:

$$
\mathbf{x}^*_{\text{MAP}} = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

**MLE**去掉先验(等价于假设先验是均匀分布),只最大化似然:

$$
\mathbf{x}^*_{\text{MLE}} = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})
$$

MAP = MLE + 先验。用SLAM的语言来说:仅对图像观测做纯粹的[光束法平差](bundle-adjustment.md)是MLE;而加入运动模型因子、IMU因子,或对第一个位姿加上先验,就是在做MAP。

## 从概率到最小二乘

SLAM后端是*最小二乘求解器*而不是通用的概率推断引擎,原因就在于高斯噪声假设。设测量模型为 $\mathbf{z} = h(\mathbf{x}) + \mathbf{v}$,其中 $\mathbf{v} \sim \mathcal{N}(\mathbf{0}, \Sigma)$。那么

$$
p(\mathbf{z} \mid \mathbf{x}) \propto \exp\!\left(-\tfrac{1}{2}\,\|\mathbf{z} - h(\mathbf{x})\|^2_{\Sigma^{-1}}\right)
$$

其中 $\|\mathbf{e}\|^2_{\Sigma^{-1}} = \mathbf{e}^T \Sigma^{-1} \mathbf{e}$ 是平方**马氏距离(Mahalanobis distance)**。取负对数——这一步把最大化变成最小化,把独立测量值的乘积变成求和——MAP问题就变成:

$$
\mathbf{x}^* = \arg\min_{\mathbf{x}} \left[ \sum_t \|h(\mathbf{x}_t) - \mathbf{z}_t\|^2_{R_t^{-1}} + \sum_t \|f(\mathbf{x}_{t-1}, \mathbf{u}_t) - \mathbf{x}_t\|^2_{Q_t^{-1}} \right]
$$

第一个求和项是观测代价(例如带测量协方差 $R_t$ 的[重投影误差](reprojection-error.md));第二个求和项是运动模型代价(里程计/IMU,带过程协方差 $Q_t$)。有三点值得牢记于心:

- **平方误差并非随意选取**——它正是高斯分布的负对数。如果噪声不是高斯分布(存在外点!),平方损失就是错误的似然形式,这恰恰是[M估计器](m-estimator.md)存在的原因。
- **协方差变成了权重**:一个置信度高的传感器(小的 $\Sigma$)会贡献一个权重很大的残差。g2o/GTSAM中的信息矩阵 $\Omega = \Sigma^{-1}$ 正是这些权重。
- **独立性变成了稀疏性**:每个测量只依赖于少数几个状态变量,因此对数后验是许多小的局部项之和——这就是[因子图](factor-graph.md),求解器正是利用了这种结构。

## 滤波器与平滑器

扩展卡尔曼滤波逐个时间步地计算后验的递归高斯近似(用 $p(\mathbf{x})$ 预测,用 $p(\mathbf{z} \mid \mathbf{x})$ 更新),而现代的平滑后端则用[非线性优化](non-linear-optimization.md)在整条轨迹上求解完整的MAP问题。两者追求的是同一个后验;它们的区别在于分别近似了什么、以及在何时进行线性化。

## 对SLAM的意义

MLE/MAP是SLAM的概率*表述*与求解它所用的优化*机制*之间的桥梁。下游的每一个设计决策——为什么残差要按逆协方差加权、为什么光束法平差要最小化平方重投影误差、为什么用一个先验因子来固定规范自由度(gauge freedom)、为什么外点需要鲁棒核函数——都是"高斯噪声下的MAP等价于加权非线性最小二乘"这一条命题的直接推论。如果你能重新推导出这一条,大多数后端论文就会变得容易阅读。

## 相关条目

- [基础概率与统计](../level-01-beginner/basic-probability-and-statistics.md)
- [MAP推断即稀疏非线性最小二乘](map-inference-as-sparse-nonlinear-least-squares.md)
- [因子图](factor-graph.md)
- [非线性优化](non-linear-optimization.md)
- [扩展卡尔曼滤波](extended-kalman-filter.md)
