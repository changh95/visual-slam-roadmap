# OKVIS2

> Leutenegger 2022 · [论文](https://arxiv.org/abs/2202.09199)

**一句话总结** — OKVIS2将经典的OKVIS滑动窗口VIO升级为一个实时、可扩展的视觉惯性*SLAM*系统，通过将共同观测边缘化为位姿图边，这些位姿图边在回环闭合时可以灵活地重新转换回地标和观测。

## 问题

滑动窗口VIO系统通过边缘化或固定旧状态来限制计算量，但经典的边缘化是一条单行道：紧密整合回环检测与大规模地图管理"对采用旧状态和地标边缘化方案的系统而言构成了内在的挑战"。ORB-SLAM3则干脆直接*固定*旧状态——这更简单，但"本质上并非一种保守的近似，因为它实际上忽略了过去的估计不确定性"。OKVIS2的目标是为机器人和AR/VR应用提供鲁棒、准确的估计，尤其关注*长*回环和*重复*回环，使用一个能同时表现出里程计和完整SLAM行为的、有限的统一因子图。

## 方法与架构

该系统分为一个**前端**（状态初始化、BRISK关键点匹配、立体三角化、分割CNN、场景识别/重定位）、一个针对每个多帧同步运行的**实时估计器**，以及一个**异步全图回环优化**模块。估计器最小化以下目标（用Ceres求解，观测采用Cauchy鲁棒化）：

$$c(\mathbf{x}) = \frac{1}{2}\sum_{i}\sum_{k\in\mathcal{K}}\sum_{j\in\mathcal{J}(i,k)} \rho\left({\mathbf{e}_{\mathrm{r}}^{i,j,k}}^T \mathbf{W}_{\mathrm{r}}\, \mathbf{e}_{\mathrm{r}}^{i,j,k}\right) + \frac{1}{2}\sum_{k\in\mathcal{P}\cup\mathcal{K}\setminus f} {\mathbf{e}_{\mathrm{s}}^{k}}^T \mathbf{W}_{\mathrm{s}}^{k}\, \mathbf{e}_{\mathrm{s}}^{k} + \frac{1}{2}\sum_{r\in\mathcal{P}}\sum_{c\in\mathcal{C}(r)} {\mathbf{e}_{\mathrm{p}}^{r,c}}^T \mathbf{W}_{\mathrm{p}}^{r,c}\, \mathbf{e}_{\mathrm{p}}^{r,c},$$

其中包含重投影误差$\mathbf{e}_{\mathrm{r}}^{i,j,k} = \tilde{\mathbf{z}}^{i,j,k} - \mathbf{h}\big(\mathbf{T}_{SC_i}^{-1}\, \mathbf{T}_{S^k W}\, {}_{W}\mathbf{l}^{j}\big)$、预积分IMU误差$\mathbf{e}_{\mathrm{s}}^{k} = \hat{\mathbf{x}}^{n}(\mathbf{x}^{k}, \tilde{\mathbf{z}}_{\mathrm{s}}^{k,n}) \boxminus \mathbf{x}^{n} \in \mathbb{R}^{15}$,以及相对位姿（位姿图）误差。$\mathcal{K}$保存$T$个最近帧加上$M$个具有实时观测的关键帧；$\mathcal{P}$则保存能追溯到更久以前的位姿图帧。

- **位姿图构建（核心贡献）**：当$|\mathcal{K}|$超过界限$K$时，共视度最低的关键帧会被转换为一个位姿图节点。它与相连帧的共同观测会被压缩为一个相对位姿因子
  $$\mathbf{e}_{\mathrm{p}}^{r,c} = \mathbf{e}_{\mathrm{p},0}^{r,c} + \begin{bmatrix} {}_{S^r}\mathbf{r}_{S^c} - {}_{S^r}\tilde{\mathbf{r}}_{S^c} \\ \mathbf{q}_{S^rS^c} \boxminus \tilde{\mathbf{q}}_{S^rS^c} \end{bmatrix},$$
  其权重来自对共同观测地标实际执行的Schur补边缘化，$\mathbf{H}^{*} = \mathbf{H}_{\mathrm{p},\mathrm{p}} - \sum_j \mathbf{H}_{\mathrm{p},j}\mathbf{H}_{jj}^{+}\mathbf{H}_{\mathrm{p},j}^{T}$，从而得到$\mathbf{W}_{\mathrm{p}}^{r,c} = \mathbf{H}^{*}$和$\mathbf{e}_{\mathrm{p},0}^{r,c} = -\mathbf{H}^{*+}\mathbf{b}^{*}$——这是对事实上标准的单位权重位姿图边方案的一种更为严谨的替代。
- **边的选择**：通过对共同观测计数构建最大生成树来决定创建哪些边，从而保持图的稀疏性；只要最早的关键帧仍与当前状态共享观测，就会被保留，从而保持长期的方向精度。
- **带地标复活的回环检测**：一次DBoW2查询加上3D-2D RANSAC验证将活动窗口重新对齐到匹配的位姿；连接该处的位姿图边被"复活"回地标和观测，地标被合并，回环误差通过旋转平均分配，随后一次背景全图优化（包含IMU因子，回环内的状态为变量）会与实时图同步。
- **有限的实时问题**：只有最近的$A = \max(A_{\min}, A_{\Delta T})$个状态保持为变量；实验中使用$T{=}3$，$K{=}5$，$L{=}5$个回环帧，$A_{\min}{=}12$，$\Delta T{=}2$秒。
- **动态内容去除**：一个轻量级的Fast-SCNN分割CNN在CPU上异步运行，仅针对关键帧,去除投射到天空/云层区域的观测——这是仅靠Cauchy鲁棒核无法拒绝的。

## 实验结果

在EuRoC和TUM-VI上进行评估（位置+航向角对齐后的ATE，因果模式与非因果模式分别报告）：

- **EuRoC**平均ATE：OKVIS2非因果模式为**0.031 m**，相比ORB-SLAM3的0.035，因果模式为0.048，VIO模式为0.071；原始OKVIS为0.089，Kimera为0.119，VINS-Fusion为0.138。
- **TUM-VI**：在走廊/房间等短序列上与ORB-SLAM3表现相当（room平均为0.01 m），在长序列上明显更优——magistrale平均0.28 m，相比ORB-SLAM3的0.81 m；outdoors平均11.60 m，相比17.87 m；slides平均0.54 m，相比0.45 m——并且在ORB-SLAM3报告未能实现回环检测的序列上,它成功实现了回环闭合。
- 每帧耗时（i7-11700K）：检测与描述7.1毫秒，匹配与三角化26.6毫秒，回环检测尝试17.7毫秒，实时图优化33.2毫秒，位姿图边处理14.0毫秒；背景回环优化耗时数十毫秒，对于非常长的回环最多可达约1秒。

## 对SLAM的意义

OKVIS（2015年）确立了VIO的滑动窗口优化+边缘化架构，但一旦发现回环就无法撤销边缘化。OKVIS2由边缘化推导出的位姿图边,在Schur补先验和完全保留地标之间提供了一种有理有据的折中方案——估计器可以在里程计与完整SLAM之间灵活切换，而无需重置地图。它是OKVIS2-X的直接基础,后者将同一因子图扩展到了深度、LiDAR和GNSS。

## 相关条目

- [OKVIS](okvis.md)
- [OKVIS2-X](okvis2-x.md)
- [IMU preintegration](imu-preintegration.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [VINS-Mono](vins-mono.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
