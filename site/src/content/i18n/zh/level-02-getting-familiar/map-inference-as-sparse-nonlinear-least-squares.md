# MAP 推断即稀疏非线性最小二乘

这是现代SLAM最核心的理论等价关系:**在高斯噪声假设下,基于因子图的最大后验(MAP)估计,恰好等价于一个稀疏非线性最小二乘问题。** 后端所做的一切都源自这一推导。

## 从贝叶斯公式到最小二乘

从贝叶斯法则出发。我们希望在给定测量值的条件下找到最可能的状态:

$$
\mathbf{x}^* = \arg\max_{\mathbf{x}}\, p(\mathbf{x} \mid \mathbf{z}) \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

给定运动模型 $\mathbf{x}_{t} = f(\mathbf{x}_{t-1}, \mathbf{u}_t) + \mathbf{w}_t$,$\mathbf{w}_t \sim \mathcal{N}(\mathbf{0}, Q_t)$,以及观测模型 $\mathbf{z}_t = h(\mathbf{x}_t, \mathbf{m}) + \mathbf{v}_t$,$\mathbf{v}_t \sim \mathcal{N}(\mathbf{0}, R_t)$,对高斯乘积取负对数,就把"*最大化概率*"变成了"*最小化一组经协方差加权的平方残差之和*":

$$
\mathbf{x}^* = \arg\min_{\mathbf{x}} \left[ \sum_t \|h(\mathbf{x}_t) - \mathbf{z}_t\|^2_{R_t^{-1}} + \sum_t \|f(\mathbf{x}_{t-1}, \mathbf{u}_t) - \mathbf{x}_t\|^2_{Q_t^{-1}} \right]
$$

因子图中的每个因子贡献一项;对于视觉SLAM而言,观测项就是重投影误差,问题也就特化为光束法平差(bundle adjustment)。有一个实用的记账等式:协方差权重可以被吸收进残差本身,$\|\mathbf{r}\|^2_{\Sigma^{-1}} = \|\Sigma^{-1/2}\mathbf{r}\|^2$("白化"),因此任何带权重的问题都可以化为对白化残差的普通最小二乘问题。

## 求解方法:高斯-牛顿与列文伯格-马夸特

该问题是*非线性*的(投影、旋转),需要迭代求解。**高斯-牛顿法(Gauss-Newton)**将堆叠残差 $\mathbf{e}$ 在当前估计 $\mathbf{x}_k$ 附近线性化:

$$
\mathbf{e}(\mathbf{x}_k + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}_k) + J_k \Delta\mathbf{x}
$$

将其代入代价函数并对 $\Delta\mathbf{x}$ 求最小化,得到**正规方程(normal equations)**:

$$
(J_k^T J_k)\, \Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

矩阵 $H = J^T J$ 近似了Hessian矩阵(忽略了二阶项)。高斯-牛顿法在解附近收敛很快,但如果初始估计较差则可能发散。**列文伯格-马夸特法(Levenberg-Marquardt)**通过阻尼来解决这个问题:

$$
(J_k^T J_k + \lambda I)\, \Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

当 $\lambda \to 0$ 时,其行为类似高斯-牛顿法(在最小值附近收敛快);当 $\lambda \to \infty$ 时,则退化为一个很小的最速下降步(在远离最优解时更稳健)。$\lambda$ 会逐次迭代自适应调整——当某一步降低了代价时减小,反之则增大。LM是Ceres及大多数SLAM后端中的标准算法。

完整的迭代循环,结合李群笔记中的流形处理机制:

1. 在当前估计处对所有残差线性化(对切空间扰动 $\boldsymbol{\xi}$ 求雅可比)。
2. 求解稀疏(带阻尼)的正规方程,得到 $\Delta\mathbf{x}$。
3. 在流形上更新:每个位姿执行 $T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})$,欧氏变量则直接加法更新。
4. 重复,直到代价或更新范数收敛。

**鲁棒核函数。** 真实的对应关系集合中总含有外点(outlier),单个较大的平方残差就可能主导整体代价和。实用系统会将每一项用鲁棒损失函数 $\rho$ 包裹(Huber:小残差时为二次函数,超过阈值后变为线性;Cauchy:对数增长,能强力降低严重外点的权重)。此时优化问题就变成了迭代重加权最小二乘——每个残差获得权重 $w_i = \rho'(r_i)/r_i$——这恰好能纳入完全相同的正规方程求解框架。

## 稀疏性:故事的另一半

每个因子只涉及少数几个变量(一个观测只关联一个位姿和一个地图点),因此 $J$ 和 $H$ 都是高度稀疏且分块结构化的。利用这种结构正是使SLAM能够大规模求解的关键——具体做法是稀疏Cholesky/QR分解,以及在光束法平差中通过Schur补先消去所有地图点(将一个 $(6m+3n)$ 维系统缩减为 $6m$ 维的相机变量系统,当地图点数量远超位姿数量时,这一缩减效果十分显著)。

**变量消元与贝叶斯树。** 求解稀疏系统可以从图论角度理解:从因子图中逐个消去变量,每次消元都会产生一个条件密度,并在剩余变量上产生新的诱导因子。消元的*顺序*决定了会产生多少填充(fill-in,即密度增加)——好的排序方式(如COLAMD)能保持分解的稀疏性。将消元进行到底会得到一棵**贝叶斯网(Bayes net)**,其团(clique)组织成**贝叶斯树(Bayes tree)**:一棵由团构成的有向树,其中每个变量的解只依赖于其祖先节点。贝叶斯树不仅是一个实现细节——它揭示了一次新测量会影响解的哪些部分,这正是iSAM2用于增量更新的结构,同时它也把边缘化(永久消去一个变量)解释为与消元完全相同的代数运算。

在此基础上有两类求解方案:

- **批量/全量平滑**:对所有变量求解(光束法平差、位姿图优化);精度最高,代价随轨迹长度增长。
- **增量/固定滞后**:增量式更新贝叶斯树(iSAM2),或限定窗口并边缘化旧变量(滑动窗口VIO)。

## 对SLAM的意义

这一表述正是该领域从滤波转向优化("平滑")的原因:它可以在任何需要的地方重新线性化,能统一处理任意类型的因子,并借助稀疏性实现大规模扩展。每一个后端库(Ceres、g2o、GTSAM)都是这一流程的具体实现,而你将阅读到的每一篇后端论文——从ORB-SLAM的BA,到VINS-Mono的滑动窗口,再到iSAM2——都是对"用哪些变量、哪些因子、哪种消元/求解调度方式"这一问题给出的特定答案。

## 相关条目

- [因子图](factor-graph.md)
- [李群](lie-groups.md)
- [Schur补/稀疏性](schur-complement-sparsity.md)
- [增量平滑(iSAM/iSAM2)](incremental-smoothing.md)
- [视觉SLAM:为何弃用滤波器?](../level-03-monocular-slam/visual-slam-why-filter.md)
