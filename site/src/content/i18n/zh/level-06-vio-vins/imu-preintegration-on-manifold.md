# IMU Preintegration on Manifold
> Forster 2015 · [论文](https://arxiv.org/abs/1512.02363)

**一句话总结** — 推导了一种在 $SO(3)$ 流形上进行理论上严谨的IMU测量预积分方法,使基于优化的VIO能够以解析方式针对偏置变化进行修正,而无需重新积分原始IMU数据。

## 问题
非线性优化能给出高精度的VIO,但"随着轨迹的增长,实时优化很快变得不可行;由于惯性测量以高频率到来,这一问题因优化中变量数量的快速增长而进一步加剧"(摘要)。朴素积分是在世界坐标系中定义的,因此它依赖于区间起点的绝对位姿:每当优化器移动该位姿时,所有原始IMU数据都必须重新积分——在数百Hz的频率下这是不可行的。Lupton的预积分方法(2012)指出了出路,但将旋转当作向量空间处理;一个严谨的表述必须尊重 $SO(3)$ 的流形结构,并正确刻画旋转噪声。

## 方法与架构
IMU测量的是体坐标系下的角速率和比力,受缓慢变化的偏置和白噪声污染(公式27–28):

$$\tilde{\boldsymbol{\omega}}(t) = \boldsymbol{\omega}(t) + \mathbf{b}^g(t) + \boldsymbol{\eta}^g(t), \qquad \tilde{\mathbf{a}}(t) = \mathtt{R}_{\mathrm{WB}}^{\mathsf{T}}(t)\big(\mathbf{a}(t) - \mathbf{g}\big) + \mathbf{b}^a(t) + \boldsymbol{\eta}^a(t),$$

运动学方程为 $\dot{\mathtt{R}}_{\mathrm{WB}} = \mathtt{R}_{\mathrm{WB}}\,\boldsymbol{\omega}^{\wedge}$,$\dot{\mathbf{v}} = \mathbf{a}$,$\dot{\mathbf{p}} = \mathbf{v}$。整条流水线的工作方式如下:

- **预积分测量值。** 关键帧 $i$ 和 $j$ 之间的所有测量值,相对于帧 $i$、使用积分时刻的偏置估计 $\mathbf{b}_i$,被合并一次:

$$\Delta\tilde{\mathtt{R}}_{ij} \doteq \prod_{k=i}^{j-1} \mathrm{Exp}\big((\tilde{\boldsymbol{\omega}}_k - \mathbf{b}^g_i)\Delta t\big), \qquad \Delta\tilde{\mathbf{v}}_{ij} \doteq \sum_{k=i}^{j-1} \Delta\tilde{\mathtt{R}}_{ik}\,(\tilde{\mathbf{a}}_k - \mathbf{b}^a_i)\Delta t,$$

  以及由类似的双重求和得到的 $\Delta\tilde{\mathbf{p}}_{ij}$——这些量只依赖于测量值和 $\mathbf{b}_i$,不依赖于绝对状态。
- **正确的旋转噪声处理。** 利用 $\mathrm{Exp}$ 的一阶展开和伴随性质,合成后的旋转可分解为测量值乘以噪声,$\Delta\mathtt{R}_{ij} = \Delta\tilde{\mathtt{R}}_{ij}\,\mathrm{Exp}(-\delta\boldsymbol{\phi}_{ij})$,其中 $\delta\boldsymbol{\phi}_{ij}$ 位于 $SO(3)$ 的切空间中,涉及右雅可比 $\mathtt{J}_r^k$。这得到了测量模型(公式38):

$$\Delta\tilde{\mathtt{R}}_{ij} = \mathtt{R}_i^{\mathsf{T}}\mathtt{R}_j\,\mathrm{Exp}(\delta\boldsymbol{\phi}_{ij}), \quad \Delta\tilde{\mathbf{v}}_{ij} = \mathtt{R}_i^{\mathsf{T}}(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\Delta t_{ij}) + \delta\mathbf{v}_{ij}, \quad \Delta\tilde{\mathbf{p}}_{ij} = \mathtt{R}_i^{\mathsf{T}}\big(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\Delta t_{ij}^2\big) + \delta\mathbf{p}_{ij},$$

  其中噪声向量 $[\delta\boldsymbol{\phi}_{ij}, \delta\mathbf{v}_{ij}, \delta\mathbf{p}_{ij}]$ 在一阶近似下是零均值高斯分布,其协方差 $\mathbf{\Sigma}_{ij}$ 通过迭代传播得到。
- **无需重新积分的偏置修正。** 当优化器将偏置更新 $\delta\mathbf{b}$ 时,增量测量值用预先计算好的常数雅可比进行修正,而不是重新积分(公式44):

$$\Delta\tilde{\mathtt{R}}_{ij}(\mathbf{b}^g_i) \simeq \Delta\tilde{\mathtt{R}}_{ij}(\bar{\mathbf{b}}^g_i)\,\mathrm{Exp}\!\Big(\tfrac{\partial\Delta\bar{\mathtt{R}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g\Big), \qquad \Delta\tilde{\mathbf{v}}_{ij} \simeq \Delta\tilde{\mathbf{v}}_{ij}(\bar{\mathbf{b}}_i) + \tfrac{\partial\Delta\bar{\mathbf{v}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g + \tfrac{\partial\Delta\bar{\mathbf{v}}_{ij}}{\partial\mathbf{b}^a}\delta\mathbf{b}^a.$$

- **预积分IMU因子。** 一个9自由度的残差 $\mathbf{r}_{\mathcal{I}_{ij}} = [\mathbf{r}_{\Delta\mathtt{R}_{ij}}, \mathbf{r}_{\Delta\mathbf{v}_{ij}}, \mathbf{r}_{\Delta\mathbf{p}_{ij}}]$ 约束连续关键帧状态,例如 $\mathbf{r}_{\Delta\mathtt{R}_{ij}} = \mathrm{Log}\big(\big(\Delta\tilde{\mathtt{R}}_{ij}(\bar{\mathbf{b}}^g_i)\,\mathrm{Exp}(\tfrac{\partial\Delta\bar{\mathtt{R}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g)\big)^{\mathsf{T}}\mathtt{R}_i^{\mathsf{T}}\mathtt{R}_j\big)$——与重投影残差完全平行,所有雅可比均为解析形式。
- **带无结构视觉因子的因子图后端。** IMU因子接入用iSAM2求解的因子图MAP估计中;视觉地标点以闭式形式被消去(无结构投影因子),这"避免了对3D点的优化,进一步加速了计算"——实现实时的完整平滑,而非固定延迟滤波。

## 实验结果
- **仿真:** 在一条带有正弦垂直运动的120米圆形轨迹上进行50次蒙特卡洛分析(用iSAM2求解),证实了预积分模型的准确性和一致性。
- **室内(430米轨迹,VI-Sensor:800 Hz的ADIS16448 IMU,20 Hz相机,Vicon地面真值):** 完整流水线(SVO前端+预积分+无结构因子+iSAM2)取得**每行进360米平均漂移0.3米,而OKVIS和MSCKF均为0.7米**,偏航漂移明显更小。
- **运行时间(Intel i7,2.4 GHz笔记本电脑):** iSAM2平均每次更新10 ms(10次迭代,完整MAP);SVO前端每帧约3 ms。相比之下,OKVIS必须在每次线性化点变化时重复进行IMU积分。
- **室外对比Google Tango:** 绕办公楼一圈的端到端闭环误差为1.5米,对比Tango的2.2米;三层楼轨迹为0.5米,对比1.4米。
- 发表于IEEE TRO(2017年;arXiv发布于2015年);预积分IMU和无结构视觉因子的参考实现内置于GTSAM中。

## 对SLAM的意义
这是几乎所有现代基于优化的VIO背后的基础理论:VINS-Mono、ORB-SLAM3、Kimera-VIO、Basalt和OKVIS2的IMU因子都使用Forster式的流形上预积分。它对Lupton最初的预积分思想进行了正确的流形处理升级——避免了欧拉角奇异性——并使高频惯性感知与关键帧频率的非线性优化兼容。如果你要亲自动手实现一段VIO理论,就该实现这一个。

## 相关条目
- [IMU preintegration](imu-preintegration.md) — 附带更多背景上下文的概念条目。
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md) — 关于流形上状态估计的配套参考资料。
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — 背后的数学工具($\mathrm{Exp}/\mathrm{Log}$、雅可比)。
- [VINS-Mono](vins-mono.md) — 一个基于这些IMU因子构建的广泛使用的系统。
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — 论文所搭配的iSAM2后端。
- [IMU noise model](imu-noise-model.md) — 进入协方差传播的噪声项的来源。
