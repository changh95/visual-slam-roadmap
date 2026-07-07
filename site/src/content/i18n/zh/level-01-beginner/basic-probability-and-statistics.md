# Basic Probability & Statistics

SLAM 本质上是一个*概率估计问题*：给定带噪声的传感器数据，机器人最可能的状态（位姿+地图）是什么？概率论为在不确定性下进行推理提供了严格的语言。

## 高斯分布

均值为 $\mu$、标准差为 $\sigma$ 的单变量高斯（正态）分布，其概率密度函数为：

$$p(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)$$

SLAM 的状态是多维的，因此我们使用**多元高斯分布**。对于均值为 $\boldsymbol{\mu}$、协方差矩阵为 $\boldsymbol{\Sigma}$（对称正定）的随机向量 $\mathbf{x} \in \mathbb{R}^n$：

$$p(\mathbf{x}) = \frac{1}{(2\pi)^{n/2}|\boldsymbol{\Sigma}|^{1/2}} \exp\!\left(-\frac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})\right)$$

指数中的项 $(\mathbf{x}-\boldsymbol{\mu})^T\boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})$ 是**马氏距离**——一种衡量 $\mathbf{x}$ 距均值有多远的尺度无关的度量。在 SLAM 中，协方差 $\boldsymbol{\Sigma}$ 编码了不确定性：对角元 $\Sigma_{ii}$ 较大意味着我们对状态的第 $i$ 个分量不太确定。

两个特性使高斯分布成为估计问题中的主力工具：

- **在线性映射下的封闭性**：如果 $\mathbf{x} \sim \mathcal{N}(\boldsymbol{\mu}, \boldsymbol{\Sigma})$，那么 $\mathbf{y} = A\mathbf{x} + \mathbf{b}$ 也是高斯分布，均值为 $A\boldsymbol{\mu} + \mathbf{b}$，协方差为 $A\boldsymbol{\Sigma}A^T$。这个**协方差传播**规则（$\Sigma_y = A\Sigma A^T$，对于非线性映射用雅可比矩阵代替 $A$）正是不确定性在 SLAM 流水线中传递的方式——从像素噪声到三角化点的协方差，再到位姿协方差。
- **高斯分布的乘积仍是高斯分布**（在归一化意义下），这正是为什么使用高斯先验和似然进行贝叶斯更新仍然是可解的——这也是卡尔曼滤波背后的代数原理。

## 贝叶斯定理

贝叶斯定理是概率 SLAM 的引擎。它把*后验*分布 $p(\mathbf{x}|\mathbf{z})$（在给定观测 $\mathbf{z}$ 的条件下我们对状态 $\mathbf{x}$ 的信念）与*似然* $p(\mathbf{z}|\mathbf{x})$ 和*先验* $p(\mathbf{x})$ 联系起来：

$$p(\mathbf{x} \mid \mathbf{z}) = \frac{p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})}{p(\mathbf{z})} \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})$$

在 SLAM 中，$\mathbf{x}$ 是机器人位姿（以及地图），$\mathbf{z}$ 是相机图像（或特征观测）。先验来自运动模型；似然来自观测模型。反复应用贝叶斯定理——预测再更新——正是扩展卡尔曼滤波（EKF-SLAM）和粒子滤波的基础。

## MAP 与 MLE

寻找使后验最大化的状态即为**最大后验估计（MAP）**：

$$\mathbf{x}^* = \arg\max_{\mathbf{x}}\, p(\mathbf{x} \mid \mathbf{z}) = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})$$

当先验是均匀分布时，MAP 退化为**最大似然估计（MLE）**。对于高斯噪声模型，MLE 等价于最小化误差平方和——而这正是光束法平差所做的事情。

## 从 MLE 到最小二乘（关键推导）

假设各观测 $\mathbf{z}_i$ 相互独立，并具有高斯噪声：$\mathbf{z}_i = \mathbf{h}_i(\mathbf{x}) + \boldsymbol{\epsilon}_i$，$\boldsymbol{\epsilon}_i \sim \mathcal{N}(\mathbf{0}, \boldsymbol{\Sigma}_i)$。似然是一个乘积，因此它的*负对数*是一个求和：

$$-\log \prod_i p(\mathbf{z}_i \mid \mathbf{x}) = \frac{1}{2}\sum_i \big(\mathbf{z}_i - \mathbf{h}_i(\mathbf{x})\big)^T \boldsymbol{\Sigma}_i^{-1} \big(\mathbf{z}_i - \mathbf{h}_i(\mathbf{x})\big) + \text{const}$$

因此，最大化似然等价于**最小化以马氏距离加权的残差平方和**。这一行公式把概率与优化联系在一起：光束法平差、位姿图优化和因子图推理本质上都是带高斯噪声的 MAP 估计,而信息矩阵 $\boldsymbol{\Sigma}_i^{-1}$ 正好是每个残差所获得的权重。

## 常见陷阱

- **混淆似然与后验**：$p(\mathbf{z}|\mathbf{x})$ 是在数据固定的情况下关于状态的函数；它对 $\mathbf{x}$ 的积分并不等于 1。
- **忽略相关性**：当误差是相关的（例如边缘化之后）却把 $\boldsymbol{\Sigma}$ 当作对角矩阵，会使估计器过于自信——这是 SLAM 中*不一致性*的一个根本原因。
- **高斯假设与异常值**：单个错误的特征匹配就足以严重违反高斯噪声模型的假设，从而破坏整个估计结果，这正是稳健核函数和 RANSAC 存在的原因。

## 对SLAM的意义

SLAM 后端中两大主流方法——滤波方法（EKF、粒子滤波）和平滑方法（因子图、光束法平差）——都是贝叶斯估计在高斯噪声下的直接应用。理解高斯分布、贝叶斯定理以及 MAP/MLE 之间的联系,可以让你看清:卡尔曼滤波的更新步骤和最小二乘求解其实是同一个底层推理问题的两种不同视角。

## 相关条目

- [Basic Calculus](basic-calculus.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md)
- [Consistency](../level-02-getting-familiar/consistency.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
