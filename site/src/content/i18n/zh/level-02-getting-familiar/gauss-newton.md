# Gauss-Newton

**Gauss-Newton** 是非线性最小二乘问题的基础迭代算法——几乎每一个 SLAM 后端计算(光束法平差、位姿图优化、PnP 精化、直接图像对齐)都归结为这一类问题。它利用代价函数*平方和*的特殊结构,在只计算一阶导数的情况下获得接近二阶的收敛速度。

## 推导

我们在状态 $\mathbf{x} \in \mathbb{R}^n$ 上,基于残差向量 $\mathbf{e}(\mathbf{x}) \in \mathbb{R}^m$ 构造代价函数并将其最小化:

$$
F(\mathbf{x}) = \frac{1}{2} \|\mathbf{e}(\mathbf{x})\|^2
$$

在当前估计 $\mathbf{x}_k$ 附近,用雅可比矩阵 $J_k = \partial \mathbf{e} / \partial \mathbf{x}$(在 $\mathbf{x}_k$ 处求值)对残差(而非代价函数本身)进行线性化:

$$
\mathbf{e}(\mathbf{x}_k + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}_k) + J_k \Delta\mathbf{x}
$$

代入后得到代价函数关于 $\Delta\mathbf{x}$ 的一个*二次*模型:

$$
F(\mathbf{x}_k + \Delta\mathbf{x}) \approx \frac{1}{2}\|\mathbf{e}_k\|^2 + \Delta\mathbf{x}^T J_k^T \mathbf{e}_k + \frac{1}{2} \Delta\mathbf{x}^T J_k^T J_k \Delta\mathbf{x}
$$

令关于 $\Delta\mathbf{x}$ 的导数为零,得到**正规方程**:

$$
(J_k^T J_k)\, \Delta\mathbf{x} = -J_k^T \mathbf{e}_k
$$

求解 $\Delta\mathbf{x}$(实践中通过对稀疏矩阵 $J^T J$ 做 Cholesky 分解,而绝不显式求逆),更新 $\mathbf{x}_{k+1} = \mathbf{x}_k + \Delta\mathbf{x}$,重新线性化,重复直到更新量或代价变化可以忽略。

在有测量协方差的情况下,残差按信息矩阵 $\Omega = \Sigma^{-1}$ 加权,正规方程变为 $J^T \Omega J \,\Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$——代数形式相同,而这恰恰就是高斯噪声下的 MAP 估计。

## 与牛顿法的关系

牛顿法使用 $F$ 的真实 Hessian 矩阵:

$$
\nabla^2 F = J^T J + \sum_i e_i \, \nabla^2 e_i
$$

Gauss-Newton **舍弃了第二项**,用 $H \approx J^T J$ 来近似。这样做代价低(不需要二阶导数),并且当最优点处的残差较小(模型拟合良好)或接近线性时(恰恰是一个收敛中的 SLAM 问题所处的情形)是准确的。在解附近,收敛速度接近二次。该近似还保证了 $H \succeq 0$,因此只要 $H$ 非奇异,计算出的步长就是一个下降方向。

## 失效模式

- **远离最优点时发散**:线性化可能糟糕到使得完整的步长反而增大代价。Gauss-Newton 没有步长控制机制;Levenberg-Marquardt 通过对正规方程施加阻尼来解决这个问题。
- **$J^T J$ 奇异或病态**:不可观测的方向(单目尺度、BA 的全局规范自由度——整个解可以自由地平移/旋转)会使 $H$ 出现秩缺陷。补救措施:固定一个位姿、加入先验,或使用 LM 的阻尼。
- **局部极小值**:与所有局部方法一样,它会收敛到起始点所在的那个盆地——这正是 SLAM 如此执着于良好初始化的原因。

## 在流形上

位姿存在于 $\mathrm{SE}(3)$ 而非 $\mathbb{R}^n$ 上,因此更新是通过指数映射来施加的:将增量参数化为 $\boldsymbol{\xi} \in \mathbb{R}^6$,求解关于 $\boldsymbol{\xi}$ 的正规方程,然后更新 $T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})$。雅可比矩阵是相对于这个局部扰动求取的。所有 SLAM 求解器(g2o、Ceres、GTSAM)都以这种"在局部向量上优化、再缩回流形"的形式实现 Gauss-Newton/LM。

## 对SLAM的意义

Gauss-Newton 是 SLAM 的*核心*内循环。光束法平差就是在重投影误差上运行 Gauss-Newton/LM,其中 $J^T J$ 的稀疏块结构(位姿仅通过观测与点耦合)通过 Schur 补加以利用;位姿图优化是在相对位姿残差上运行 Gauss-Newton;直接法(LSD-SLAM、DSO)在光度误差上运行它;甚至 ICP 的对齐步骤本身也是一次 Gauss-Newton 迭代。阅读任何 SLAM 后端论文都需要熟练掌握这里定义的词汇——残差、雅可比、Hessian 近似、正规方程、阻尼——并且大多数实际调试工作(为什么我的优化发散了?为什么我的 Hessian 是奇异的?)都能追溯到上面列出的这些假设。

## 相关条目

- [Non-linear optimization](non-linear-optimization.md)
- [Levenberg-Marquardt](levenberg-marquardt.md)
- [Reprojection error](reprojection-error.md)
- [Bundle adjustment](bundle-adjustment.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)
