# Bundle Adjustment

**光束法平差（Bundle Adjustment, BA）**是对相机姿态和3D地图点位置进行联合非线性精炼，以最小化总重投影误差的方法。其名称来源于连接每个相机中心与其观测到的3D点之间的"射线束（bundles of rays）"——BA不断调整姿态和点，直到这些射线束尽可能与图像测量值相吻合。它是特征法SLAM和运动恢复结构（structure-from-motion）中黄金标准的后端方法。

## 代价函数

对于观测到地图点 $\mathbf{X}_j \in \mathbb{R}^3$、像素测量值为 $\mathbf{z}_{ij}$ 的相机姿态 $T_i \in SE(3)$，**重投影误差**为

$$\mathbf{e}_{ij} = \mathbf{z}_{ij} - \pi\big(T_i\, \mathbf{X}_j\big)$$

其中 $\pi : \mathbb{R}^3 \to \mathbb{R}^2$ 是相机投影函数（针孔模型加畸变）。BA求解

$$\min_{\{T_i\},\, \{\mathbf{X}_j\}} \sum_{(i,j) \in \mathcal{O}} \rho\big(\mathbf{e}_{ij}^T\, \Omega_{ij}\, \mathbf{e}_{ij}\big)$$

其中 $\mathcal{O}$ 是（姿态，点）观测对的集合，$\Omega_{ij} = \Sigma_{ij}^{-1}$ 是信息矩阵（测量协方差的逆，通常按金字塔层级进行缩放），$\rho$ 是一个可选的稳健核函数（例如Huber核），用于限制外点匹配的影响。在高斯噪声且关联正确的假设下，这恰好就是最大似然估计。

## 求解方式

BA是一个非线性最小二乘问题，通过高斯-牛顿法或列文伯格-马夸尔特法迭代求解。每次迭代都在当前估计值附近对残差进行线性化，$\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\,\Delta\mathbf{x}$，并求解（带阻尼的）正规方程

$$\big(J^T \Omega J + \lambda I\big)\, \Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$$

姿态存在于 $SE(3)$ 流形上，因此更新时使用局部参数化：一个6维向量 $\boldsymbol{\xi}$ 通过指数映射变换后与当前姿态相乘复合，$T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})$，从而保证每一步状态都仍是合法的刚体变换。

## 稀疏性与Schur补

每个残差恰好涉及**一个姿态和一个点**，因此Hessian近似矩阵 $H = J^T \Omega J$ 具有如下的分块结构

$$H = \begin{bmatrix} B & E \\ E^T & C \end{bmatrix}$$

其中 $B$（$6m \times 6m$）只在姿态之间耦合，$C$（$3n \times 3n$）只在点之间耦合，$E$ 是姿态-点交叉项。关键的是，$C$ 是**块对角**的，每个地图点对应一个独立的 $3 \times 3$ 块，因此求逆非常简单。**Schur补**先消去点：

$$\big(B - E\, C^{-1} E^T\big)\, \Delta\mathbf{x}_{\text{cam}} = -\mathbf{b}_{\text{cam}} + E\, C^{-1}\, \mathbf{b}_{\text{pts}}$$

将一个 $(6m + 3n)$ 维的求解问题降为一个 $6m$ 维的问题——当 $n \gg m$（成千上万个点、几十个关键帧）时，这一点具有决定性意义。地图点的更新随后可以通过廉价的回代求得。正是这种结构利用使实时BA变得可行；它已内置于g2o、Ceres和GTSAM之中。

**规范自由度（Gauge freedom）**：该代价函数对所有姿态和点的整体刚体变换是不变的（对于单目情形，尺度也是自由的，共7个自由度）。求解器通过锚定第一个关键帧（以及对单目情形，锚定一个尺度参考）或添加先验来固定这一点；否则 $H$ 将是奇异的。

## 实践中常用的变体

- **仅运动光束法平差（Motion-only BA）**：固定地图点，仅优化单个相机姿态——即ORB-SLAM跟踪线程中的姿态精炼步骤。
- **局部光束法平差（Local BA）**：优化一个由近期/共视关键帧及其地图点组成的窗口，相邻关键帧作为锚点保持固定——在建图线程中持续运行。
- **全局光束法平差（Global BA）**：优化所有内容，通常在回环检测之后进行，往往先由位姿图优化将轨迹拉近，再进行昂贵的完整精炼。
- **仅结构光束法平差（Structure-only BA）**：固定姿态，精炼点（例如在三角化出新的地图点之后）。

## 对SLAM的意义

BA是现代视觉SLAM的精度引擎：基于关键帧的系统之所以能获得高精度，正是因为它们不断地针对原始图像测量值重新优化姿态和结构，而不是单纯信任增量式的估计结果。Strasdat等人提出的"对于视觉SLAM，优化胜过滤波"这一比较结论，本质上就是关于BA的论断。理解其稀疏结构——以及Schur补这一技巧——同样可以解释每一个成熟的SLAM后端库的架构，以及为什么关键帧选择（保持 $m$ 较小）如此重要。

## 相关条目

- [Reprojection error](reprojection-error.md)
- [Gauss-Newton](gauss-newton.md)
- [Levenberg-Marquardt](levenberg-marquardt.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)
- [M-estimator](m-estimator.md)
