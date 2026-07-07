# VINS-Mono

> Qin 2018 · [论文](https://arxiv.org/abs/1708.03852)

**一句话总结** — VINS-Mono 是一个完整的紧耦合单目视觉惯性估计器——包含鲁棒的初始化、带双向边缘化的滑动窗口优化、紧耦合重定位以及 4 自由度位姿图回环检测——它已成为机器人领域最广泛使用的 VIO 系统之一。

## 问题

单目相机加低成本 IMU 构成了实现度量六自由度状态估计的*最小*传感器套件——但由于缺乏任何直接的距离测量,这在 IMU 处理、估计器初始化、外参标定和非线性优化方面都带来了巨大挑战。初始化通常是单目 VINS 中最脆弱的一步,而消除长期漂移则需要在一个系统中同时具备回环检测、重定位和全局优化。VINS-Mono 的目标是一个单一的、鲁棒、通用且完整的方案,覆盖以上所有内容,并包含失效恢复机制。

## 方法与架构

流水线为:基于 Shi-Tomasi 角点的 KLT 光流(RANSAC 基础矩阵外点剔除)→ 视觉惯性对齐初始化 → 滑动窗口 VIO(Ceres)→ 边缘化 → DBoW2/BRIEF 回环检测 → 紧耦合重定位 → 4 自由度位姿图。

- **通过视觉惯性对齐进行初始化。** 一个纯视觉的 SfM 给出带未知尺度的位姿;通过最小化 $\sum_k \lVert \mathbf{q}_{b_{k+1}}^{c_0\,-1} \otimes \mathbf{q}_{b_k}^{c_0} \otimes \boldsymbol{\gamma}_{b_{k+1}}^{b_k} \rVert^2$(相对于预积分旋转)来标定陀螺仪偏置,随后速度、重力 $\mathbf{g}^{c_0}$ 和度量尺度 $s$ 通过一个基于预积分项 $\hat{\boldsymbol{\alpha}}, \hat{\boldsymbol{\beta}}$ 构建的线性系统一次性求解。同一个模块还负责失效恢复。
- **滑动窗口状态量与代价函数。** 状态量 $\mathcal{X} = [\mathbf{x}_0, \dots, \mathbf{x}_n, \mathbf{x}_c^b, \lambda_0, \dots, \lambda_m]$ 保存了 $n{+}1$ 个 IMU 状态 $\mathbf{x}_k = [\mathbf{p}^w_{b_k}, \mathbf{v}^w_{b_k}, \mathbf{q}^w_{b_k}, \mathbf{b}_a, \mathbf{b}_g]$、相机-IMU 外参,以及逆深度 $\lambda_l$。MAP 问题(公式 22)为
  $$\min_{\mathcal{X}} \Big\{ \big\lVert \mathbf{r}_p - \mathbf{H}_p\mathcal{X} \big\rVert^2 + \sum_{k \in \mathcal{B}} \big\lVert \mathbf{r}_{\mathcal{B}}(\hat{\mathbf{z}}^{b_k}_{b_{k+1}}, \mathcal{X}) \big\rVert^2_{\mathbf{P}^{b_k}_{b_{k+1}}} + \sum_{(l,j) \in \mathcal{C}} \rho\big( \lVert \mathbf{r}_{\mathcal{C}}(\hat{\mathbf{z}}^{c_j}_{l}, \mathcal{X}) \rVert^2_{\mathbf{P}^{c_j}_{l}} \big) \Big\},$$
  其中 $\{\mathbf{r}_p, \mathbf{H}_p\}$ 是边缘化先验,$\rho$ 是作用于视觉项的 Huber 损失。
- **预积分 IMU 残差**(公式 24):将位置/速度/旋转/偏置误差与预积分项 $\hat{\boldsymbol{\alpha}}^{b_k}_{b_{k+1}}, \hat{\boldsymbol{\beta}}^{b_k}_{b_{k+1}}, \hat{\boldsymbol{\gamma}}^{b_k}_{b_{k+1}}$ 进行比较,例如 $\delta\boldsymbol{\alpha} = \mathbf{R}^{b_k}_w\big(\mathbf{p}^w_{b_{k+1}} - \mathbf{p}^w_{b_k} + \tfrac{1}{2}\mathbf{g}^w\Delta t_k^2 - \mathbf{v}^w_{b_k}\Delta t_k\big) - \hat{\boldsymbol{\alpha}}^{b_k}_{b_{k+1}}$ 以及 $\delta\boldsymbol{\theta} = 2\big[\mathbf{q}^{w\,-1}_{b_k} \otimes \mathbf{q}^w_{b_{k+1}} \otimes (\hat{\boldsymbol{\gamma}}^{b_k}_{b_{k+1}})^{-1}\big]_{xyz}$,偏置在线校正。
- **单位球面上的视觉残差**(公式 25):重投影误差被投影到所观测单位方位向量的切平面 $[\mathbf{b}_1\ \mathbf{b}_2]^T$ 上,因此广角/鱼眼相机也能被原生处理。
- **双向边缘化。** 如果次新帧是关键帧,则将*最旧*帧及其观测通过舒尔补边缘化进先验;否则直接丢弃次新帧(舍弃其视觉观测,保留 IMU)——这样既能保留空间上分散的关键帧,又能维持稀疏性。
- **重定位 + 4 自由度位姿图。** DBoW2 回环候选通过 BRIEF 描述子匹配进行验证,采用 2D-2D 及 PnP RANSAC;检索到的特征以回环帧位姿固定的方式进入滑动窗口优化(紧耦合重定位)。被边缘化的关键帧加入一个全局位姿图,其边仅携带相对位置和航向角,残差为 $\mathbf{r}_{i,j} = \big[\mathbf{R}(\hat{\phi}_i, \hat{\theta}_i, \psi_i)^{-1}(\mathbf{p}^w_j - \mathbf{p}^w_i) - \hat{\mathbf{p}}^i_{ij};\ \psi_j - \psi_i - \hat{\psi}_{ij}\big]$——只优化四个易漂移的自由度(x、y、z、航向角),因为重力使横滚角和俯仰角可观测。

## 实验结果

在 EuRoC 上(MH_03_median、MH_05_difficult),VINS-Mono 的纯 VIO 精度与 OKVIS 单目/双目相当,加上回环检测后其平移误差最小。在一次 2.5 公里的室内外混合步行中,不使用回环检测时最终漂移为 [−5.47, 2.76, −0.29] m(占轨迹的 **0.88%**),相比 OKVIS 的 2.36%;加上回环校正后为 [−0.032, 0.09, −0.07] m。一次 5.62 公里、耗时 1 小时 34 分钟的手持环形路线绕香港科技大学校园(相机 25 Hz / IMU 200 Hz)在一台 i7-4790 上实时运行(特征跟踪在 25 Hz 下耗时 15+5 ms,窗口优化在 10 Hz 下耗时 50 ms,回环检测耗时 100 ms,位姿图优化耗时 130 ms),并相对于地图几乎保持无漂移。机载闭环 MAV 飞行跟踪一个八字形轨迹(61.97 米,禁用回环检测)得到最终漂移 [0.08, 0.09, 0.13] m——**0.29%**。该系统还被移植到 iOS(VINS-Mobile),并在一次 264 米的步行中与 Google Tango 进行了比较,PC 和手机版本均已开源发布。

## 对SLAM的意义

VINS-Mono 可以说是单目 VIO 的参考系统:它将 OKVIS 开创的滑动窗口 + 边缘化架构与实用的线性初始化以及完整的重定位/回环检测后端打包在一起,并以一次开源发布同时运行在无人机和手机上。它的设计选择——预积分、Huber 鲁棒的单位球面重投影因子、双向边缘化、4 自由度位姿图——成为了后续系统(VINS-Fusion、ORB-SLAM3 的惯性模式、众多商用跟踪器)所遵循或改进的标准范式。

## 相关条目

- [IMU preintegration](imu-preintegration.md)
- [OKVIS](okvis.md)
- [VINS-Fusion](vins-fusion.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
