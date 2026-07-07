# Non-linear Optimization

SLAM 状态估计最终都归结为最小化一个代价函数

$$
F(\mathbf{x}) = \frac{1}{2}\sum_i \|\mathbf{e}_i(\mathbf{x})\|^2_{\Sigma_i^{-1}}
$$

该函数是关于状态 $\mathbf{x}$（位姿、地图点、偏置）的函数，其中每个 $\mathbf{e}_i$ 是一个残差——可以是重投影误差、里程计误差或 IMU 误差——并按其逆协方差加权。这些残差相对于状态是**非线性**的：相机投影涉及除以深度，而旋转位于一个弯曲的流形上。因此不存在闭式解，我们必须进行迭代。

## 迭代下降的通用模板

所有实用求解器都共享同一个循环：从初始猜测 $\mathbf{x}_0$ 出发，反复寻找能降低代价的更新量 $\Delta\mathbf{x}$，应用它，并在更新量或梯度变得足够小时停止。不同方法的区别在于如何选取 $\Delta\mathbf{x}$：

- **梯度下降（Gradient descent）**：$\Delta\mathbf{x} = -\alpha\, \nabla F$。只需要一阶导数，但会来回震荡，收敛缓慢（线性收敛）——在 SLAM 中很少直接使用。
- **牛顿法（Newton's method）**：用真实的 Hessian 矩阵 $H$ 求解 $H\,\Delta\mathbf{x} = -\nabla F$。具有二次收敛速度，但残差的二阶导数计算代价高，且在远离最优解处 $H$ 可能不是正定的。
- **[高斯-牛顿法（Gauss-Newton）](gauss-newton.md)**：利用最小二乘的结构。对每个残差线性化，$\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\Delta\mathbf{x}$，并求解正规方程 $(J^T J)\,\Delta\mathbf{x} = -J^T\mathbf{e}$。矩阵 $J^T J$ 仅用一阶导数就近似了 Hessian 矩阵——这正是让大规模 SLAM 变得可行的关键技巧。
- **[列文伯格-马夸尔特法（Levenberg-Marquardt）](levenberg-marquardt.md)**：带自适应阻尼的高斯-牛顿法，$(J^T J + \lambda I)\,\Delta\mathbf{x} = -J^T\mathbf{e}$，在线性化不可信时向梯度下降靠拢。这是事实上的默认选择。
- **狗腿法（Dogleg）/信赖域法**：显式维护一个区域半径，并在其中结合高斯-牛顿步和梯度步；思路上与 LM 类似，在光束法平差上通常更快。

## 在流形上进行优化

相机位姿是 $\mathrm{SE}(3)$ 中的元素，而不是向量——如果简单地将更新量加到旋转矩阵上，会破坏其正交性。标准的解决方法是在[李代数](lie-groups.md)中优化一个**局部扰动** $\boldsymbol{\xi} \in \mathbb{R}^6$，并通过指数映射将其应用回去：

$$
T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})
$$

求解器始终只看到小向量 $\boldsymbol{\xi}$；这个回缩（retraction）操作使状态保持在流形上。每个 SLAM 库都实现了这一点（Ceres 中的局部参数化，g2o 中顶点的 `oplus`，GTSAM 中的 retraction）。

## 什么使得 SLAM 问题可解

- **稀疏性。** 每个残差只涉及很少的变量（一个位姿加一个地图点，或两个位姿），因此 $J^T J$ 极其稀疏。稀疏 Cholesky 分解和 Schur 补将原本不可能解决的问题（数万个变量）变成了实时可解的问题。
- **良好的初始化。** 这些方法只能找到非凸代价函数的*局部*最小值。SLAM 之所以能够运行，是因为它总能有一个不错的初始猜测——上一帧的位姿、运动模型，或来自 RANSAC 的最小解算器结果。冷启动问题（重定位、地图合并）之所以困难，正是因为缺少这样的初始猜测。
- **鲁棒性。** 平方代价假设噪声是高斯的，而真实的匹配器会产生外点。鲁棒核函数（[M 估计器](m-estimator.md)）重塑了代价函数，使得严重的误差不再主导优化，但代价是增加了更多的非凸性。

## 解读求解器的输出

迭代会在以下实用准则下停止：每次迭代的代价下降量低于某个容差、更新量的范数 $\|\Delta\mathbf{x}\|$ 变得可忽略、梯度范数趋近于零，或迭代次数/时间预算耗尽（实时系统通常将每个关键帧的光束法平差限制在少数几次迭代内）。当求解出问题时，症状能对应到具体原因：代价爆炸通常意味着初始猜测不好或雅可比矩阵有 bug；代价停滞在较高水平且每步更新都很小,则可能是收敛到了较差的局部最小值,或存在未建模的外点；正规方程矩阵秩不足则指向不可观测的方向（规范自由度、未约束的地图点），需要引入先验或加以固定。

## 对SLAM的意义

现代每一个 SLAM 系统的后端——光束法平差、位姿图优化、VIO 滑动窗口、直接光度对齐——都是在流形上用高斯-牛顿/LM 迭代求解的稀疏非线性最小二乘问题的一个实例。概率视角([MLE & MAP](mle-and-map.md))说明*要*最小化*什么*；非线性优化说明*如何*最小化。熟练掌握这部分内容会在各处产生回报：读懂一篇论文中"我们最小化以下能量函数"的段落、诊断发散问题（初始化不好？参数化方式错误？存在外点？），以及有效使用 Ceres/g2o/GTSAM，都建立在这些知识之上。

## 动手实践

- [Ceres-solver hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_15)

## 相关条目

- [Gauss-Newton](gauss-newton.md)
- [Levenberg-Marquardt](levenberg-marquardt.md)
- [MLE & MAP](mle-and-map.md)
- [Bundle Adjustment](bundle-adjustment.md)
- [Lie groups](lie-groups.md)
