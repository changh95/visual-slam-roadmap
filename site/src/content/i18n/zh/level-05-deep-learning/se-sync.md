# SE-Sync

> Rosen 2019 · [论文](https://arxiv.org/abs/1611.00128)

**一句话总结** — 首个可证明正确的位姿图优化算法：通过黎曼优化求解的SDP松弛，能恢复全局最优解并给出最优性证明(arXiv 2016年，IJRR 2019年)。

## 问题

$SE(d)$同步——即根据$m$个成对相对变换的噪声观测，估计$n$个未知位姿$x_1,\dots,x_n \in SE(d)$，其中$x_{ij} = x_i^{-1}x_j$——是标准的SLAM后端问题(位姿图SLAM、相机位姿估计)。在论文所用的生成模型下(具有精度$\tau_{ij}$的高斯平移噪声、具有集中度$\kappa_{ij}$的各向同性Langevin旋转噪声)，最大似然估计最小化

$$p^{*}_{\mathrm{MLE}} = \min_{t_i \in \mathbb{R}^d,\; R_i \in SO(d)} \sum_{(i,j)\in\vec{\mathcal{E}}} \kappa_{ij}\big\lVert R_j - R_i\tilde{R}_{ij}\big\rVert_F^2 + \tau_{ij}\big\lVert t_j - t_i - R_i\tilde{t}_{ij}\big\rVert_2^2 .$$

这是一个高维非凸非线性规划，一般情况下计算上很困难：局部求解器(g2o、GTSAM、Ceres)可能悄无声息地收敛到远离真实解的局部极小值，且无法*知道*返回的答案是否为全局最优——这对于安全关键的自主系统而言是不可接受的。

## 方法与架构

- **消去平移量。** 对固定的旋转量而言，该问题是关于$t$的无约束二次问题，可通过广义Schur补以闭式解求解。这将MLE问题化简为纯旋转同步问题，$p^{*}_{\mathrm{MLE}} = \min_{R \in SO(d)^n} \operatorname{tr}(\tilde{Q} R^{\mathsf{T}} R)$，其中数据矩阵$\tilde{Q} = L(\tilde{G}^{\rho}) + \tilde{T}^{\mathsf{T}} \Omega^{1/2} \Pi\, \Omega^{1/2} \tilde{T}$将旋转连接拉普拉斯矩阵$L(\tilde{G}^{\rho})$与一个平移数据项相结合；$\Pi$(一个正交投影)可通过对加权关联矩阵做薄LQ分解来获得稀疏分解，因此与$\tilde{Q}$的乘积从不会形成稠密矩阵。最优平移量随后通过$t^{*} = -\operatorname{vec}\big(R^{*}\tilde{V}^{\mathsf{T}} L(W^{\tau})^{\dagger}\big)$恢复。
- **可证明紧的SDP松弛。** 将$SO(d)$松弛为$O(d)$使该问题成为一个QCQP，其拉格朗日对偶是如下的半定规划

$$p^{*}_{\mathrm{SDP}} = \min_{Z \succeq 0}\; \operatorname{tr}(\tilde{Q} Z) \quad \text{s.t.} \quad \mathrm{BlockDiag}_{d\times d}(Z) = \mathrm{Diag}(I_d,\dots,I_d),$$

  因此$p^{*}_{\mathrm{SDP}} \le p^{*}_{\mathrm{MLE}}$。**命题1**：存在$\beta > 0$，使得若$\lVert \tilde{Q} - \bar{Q} \rVert_2 < \beta$(其中$\bar{Q}$是真实潜在变换的数据矩阵——即噪声低于某个临界阈值)，则该SDP具有*唯一*解$Z^{*} = R^{*\mathsf{T}}R^{*}$，其中$R^{*} \in SO(d)^n$即为精确的MLE解。每当舍入后的估计达到SDP下界时，该等式即构成全局最优性的*计算证书*。
- **黎曼阶梯法。** 与内点法SDP求解器(超过几千个变量便难以处理)不同，SE-Sync使用Burer–Monteiro分解$Z = Y^{\mathsf{T}}Y$，其中$Y \in \mathbb{R}^{r\times dn}$，$r \ll dn$；此时块约束表明每个$Y_i$都是一个正交标架，从而得到一个在Stiefel流形积上的无约束问题：

$$p^{*}_{\mathrm{SDPLR}} = \min_{Y \in \mathrm{St}(d,r)^n} \operatorname{tr}(\tilde{Q}\, Y^{\mathsf{T}} Y).$$

  **命题2**(承自Boumal等人的工作)：该问题的任何秩缺失二阶临界点都是*全局*最小值点，并能得到SDP的解——因此算法沿秩的层级逐步攀升("黎曼阶梯")，直到出现秩缺失的临界点。
- **快速二阶局部搜索。** 在流形上，$\nabla F(Y) = 2Y\tilde{Q}$，Hessian向量积是环境导数的投影($\operatorname{grad} F(Y) = \operatorname{Proj}_Y \nabla F(Y)$)，全部通过稀疏矩阵乘积和三角求解计算；一种截断牛顿黎曼信赖域(RTR)方法用于寻找高精度临界点。
- **舍入。** 对$Y^{*}$做秩为$d$的薄SVD得到$\hat{R} = \Xi_d V_d^{\mathsf{T}}$；如果大多数块的行列式为负则翻转朝向，再将每个块投影到最近的旋转矩阵——当松弛是紧的时结果精确，否则为一个可行的近似。

## 实验结果

(基于Manopt的MATLAB实现，阶梯法固定为$r=5$，从$\mathrm{St}(3,5)^n$上的*随机*点初始化；基线为：里程计初始化的高斯-牛顿法、弦初始化的GN，以及GN-弦初始化加事后验证。)

- **模拟立方体世界**($s^3$格点，回环概率$p_{LC}$，噪声$\sigma_T$、$\sigma_R$；每种设置30次运行)：SE-Sync能够从随机初始化收敛到*可证明的全局最优*解，所用时间与——在这些测试中通常更快于——采用最先进弦初始化的GN相当，且远快于GN加单独验证。唯一的例外是高旋转噪声区间，此时松弛的紧性会失效。
- **大规模真实/标准3D SLAM数据集**——sphere(2500个节点/4949条边)、sphere-a(2200/8647)、torus(5000/9048)、cube(8000/22236)、garage(1661/6275)、cubicle(5750/16869)：SE-Sync在*所有*数据集上都取得了经证书验证的全局最优解(例如在sphere-a上目标函数值为$1.249\times 10^{6}$，而里程计初始化的GN为$3.041\times 10^{6}$)，耗时3.6–203秒，证实该松弛在具有挑战性的真实场景实例上依然保持紧性。
- 按论文摘要所述，即使噪声"比机器人应用中通常遇到的水平高出一个数量级"，全局最优性依然能够恢复，其计算成本与直接的牛顿类局部搜索方法相当。

## 对SLAM的意义

SE-Sync回答了一个基础性问题：尽管位姿图优化是非凸的，但实际SLAM中出现的问题实例是可全局求解的，并且你可以*知道*自己是否已经得到了全局最优解。这一发现开启了可证明感知的研究方向(用于配准的TEASER++、用于旋转搜索的QUASAR)，并为SLAM后端提供了一种验证工具——例如，在可能存在受损回环的情况下，检查局部求解器给出的答案是否真正达到最优。

## 相关条目

- [位姿图优化](../level-02-getting-familiar/pose-graph-optimization.md) — 被证明的问题本身
- [作为稀疏非线性最小二乘的MAP推断](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — 被松弛的MLE表述
- [TEASER++](teaserpp.md) — 可证明的点云配准
- [QUASAR](quasar.md) — 可证明的旋转搜索
- [GNC](gnc.md) — 用于处理含离群值图的鲁棒估计配套方法
