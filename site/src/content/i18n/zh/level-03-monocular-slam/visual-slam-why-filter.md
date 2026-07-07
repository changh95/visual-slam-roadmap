# Visual-SLAM why filter?

> Strasdat 2012 · [论文](https://doi.org/10.1016/j.imavis.2012.02.009)

**一句话总结** — 严谨地证明了基于关键帧的光束法平差在单位计算时间内能提供比滤波方法更高的精度，从而将视觉SLAM从滤波向优化的范式转变正式化。

## 问题

到2012年，实时单目SLAM领域已经有了两套可行的方案：MonoSLAM（2007年）使用EKF联合估计相机位姿和地标点，而PTAM（2007年）则引入了基于关键帧的光束法平差。两者都能实时运行，但学界缺乏一个原理性的比较。这两种范式在SLAM图上做出了相反的结构选择：滤波方法*边缘化掉*所有历史位姿，只留下当前位姿与所有地标点的一个稠密联合分布，而基于关键帧的BA则直接*丢弃*非关键帧的位姿及其观测，从而保持问题的稀疏性。Strasdat、Montiel和Davison提出的问题是：在相同的计算预算下，哪种选择能带来更高的精度？

## 方法与架构

**两套精心匹配的流程**，均已实现并在蒙特卡洛仿真中运行。

*BA-SLAM*：在每个关键帧处，为离开视野的特征初始化替代点，通过仅运动的BA估计位姿，通过仅结构的BA细化点，然后联合优化所有变量（使用g2o，配合Schur补的Levenberg–Marquardt方法）：

$$
\chi^2(\mathbf{y}) = \sum_{\mathbf{z}_{i,j} \in Z_{0:i}} \big(\mathbf{z}_{i,j} - \hat{\mathbf{z}}(\mathbf{T}_i, \mathbf{x}_j)\big)^2, \qquad
\chi^2(\mathbf{T}_i) = \sum_{\mathbf{z}_j \in Z_i} \big(\mathbf{z}_j - \hat{\mathbf{z}}(\mathbf{T}_i, \mathbf{x}_j)\big)^2,
$$

在 $\mathbf{y} = (\mathbf{T}_1, ..., \mathbf{T}_i, \mathcal{X})^\top$ 上进行优化，第一帧作为规范基准（gauge）被固定。

*Filter-SLAM*：一种最先进的高斯-牛顿信息滤波器，特意设计为滤波方法的最佳情形：点使用锚定逆深度坐标 $\boldsymbol{\psi}_j := \mathrm{inv\_d}(A_{a(j)}\, \mathbf{x}_j)$，其中 $\mathrm{inv\_d}(\mathbf{a}) = \frac{1}{a_3}(a_1, a_2, 1)^\top$，每次更新都相对高斯地图先验最小化观测残差：

$$
\chi^2(\Phi_i, \mathbf{T}_i) = (\Phi_i \boxminus \Phi_{i-1})^\top \Lambda_{\Phi_{i-1}} (\Phi_i \boxminus \Phi_{i-1}) + \sum_{\mathbf{z}_j \in Z_i} \mathbf{d}_j^\top \Lambda_z \mathbf{d}_j,
$$

随后进行信息矩阵更新 $\Lambda_i = \Lambda_{i-1} + D^\top \mathrm{diag}(\Sigma_z^{-1}, \ldots)\, D$，其中 $D$ 是堆叠的重投影雅可比矩阵。滤波方法的决定性特征在于：被吸收的观测的线性化点被永久固定，而BA则在每次迭代中重新线性化所有变量。

**评价指标。** 精度以终点位姿的平移误差衡量，用RMSE以及相对于最弱配置的*熵减少量*（以比特计）来表示：

$$
E = \frac{1}{2} \log_2 \frac{\det(\Sigma_{\langle M_{\min},\,15 \rangle})}{\det(\Sigma_{\langle M,N \rangle})},
$$

其中变化的是中间帧数量 $M$ 和点数量 $N$；效率则是每秒计算所对应的熵减少量（$E/c$，单位比特每秒）。渐近复杂度：BA的代价为 $O(NM^2 + M^3)$（Schur补+简化相机系统），滤波的代价为 $O(MN^3)$——相对于点数是线性还是三次的差异。测试了四种相机运动（横向移动且场景完全重叠；横向移动且部分重叠；横向移动+30°旋转；急剧的前向转弯），每种都分为单目和双目情形，观测噪声为 $\sigma_z = \frac{1}{2}$ 像素。

## 实验结果

- **地标点比帧数更重要** ——论文自我宣称的"最重要的单一结果"：增加点数 $N$ 在所有配置中都显著降低熵，而增加帧数 $M$ 对精度的影响很小（它的真正作用在于鲁棒性，例如在 $M=2$ 时防止单目初始化失败）。
- 在三种中等设置中，精心参数化的滤波器*能够匹配*BA的精度——差异在于成本：由于BA相对于 $N$ 是线性的，而滤波是三次的，只有BA能够承担精度所需的大量地标点。
- 在急剧前向转弯的单目情形中，滤波精度会*低于*BA，因为观测雅可比矩阵从未被重新线性化——这是经典的高斯滤波一致性问题。
- 在综合精度/成本（比特每秒）方面，BA总体上更高效；滤波仅在精度需求较低时（较小的 $M$ 和 $N$）才具有竞争力。
- 结论，大意如此：基于关键帧的BA优于滤波，因为它在单位计算时间内提供了最高的精度。

## 对SLAM的意义

这篇论文为PTAM在实践中所展示的转变提供了理论依据，巩固了基于关键帧的光束法平差作为视觉SLAM标准后端的地位。ORB-SLAM、LSD-SLAM、DSO以及几乎所有后续系统都建立在这一结论之上，其精度与预算的权衡方法论也成为论证SLAM设计选择的标准方式。值得注意一个至今仍然重要的细微之处：该论证针对的是拥有大量地标点的纯视觉SLAM——紧耦合的VIO系统仍然使用滤波器（例如MSCKF），因为其中的权衡关系有所不同，作者本人也将该结论的适用范围限定在局部SLAM，而将回环检测留给基于外观的方法处理。

## 相关条目

- [MonoSLAM](monoslam.md) — 比较中滤波方法的一方
- [PTAM](ptam.md) — 比较中基于关键帧BA的一方
- [ORB-SLAM](orb-slam.md) — 基于此结论构建的典型系统
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md) — 这一权衡在VIO中的体现
- [Schur补/稀疏性](../level-02-getting-familiar/schur-complement-sparsity.md) — BA为何能如此高效地扩展
- [作为稀疏非线性最小二乘的MAP推断](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — 支撑整个论证的估计视角
