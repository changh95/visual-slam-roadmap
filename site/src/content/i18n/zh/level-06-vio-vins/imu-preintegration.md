# IMU预积分

IMU以100–1000 Hz产生测量值,而相机以10–30 Hz提供关键帧。朴素的VIO表述会将每个IMU读数都插入估计器,导致状态变量数量爆炸。更糟的是,朴素积分是在世界坐标系中完成的:积分结果依赖于区间起点的绝对位姿,因此每当优化器调整该位姿时,所有原始IMU数据都需要重新积分。

**预积分**(由Lupton和Sukkarieh于2012年提出)解决了这两个问题。两个关键帧时刻 $i$ 和 $j$ 之间的IMU测量值在关键帧*$i$的局部坐标系*中被积分,生成一个紧凑的相对运动摘要:

$$\left(\Delta\mathbf{R}_{ij},\; \Delta\mathbf{v}_{ij},\; \Delta\mathbf{p}_{ij}\right)$$

——相对旋转、速度变化和位置变化。关键的是,这些量只依赖于IMU测量值和偏置估计,**不依赖于绝对位姿**。它们只需被计算一次、存储起来,并在因子图中充当连接 $i$ 和 $j$ 处状态的一个单一"IMU因子"。当优化器移动位姿时,不需要重新积分任何东西。

## 数学原理

从测量模型 $\tilde{\boldsymbol{\omega}}_t = \boldsymbol{\omega}_t + \mathbf{b}^g + \boldsymbol{\eta}^g$,$\;\tilde{\mathbf{a}}_t = \mathbf{R}_t^\top(\mathbf{a}_t - \mathbf{g}) + \mathbf{b}^a + \boldsymbol{\eta}^a$ 出发,预积分项在 $[i, j)$ 区间内的IMU采样点上累积:

$$\Delta\mathbf{R}_{ij} = \prod_{t=i}^{j-1} \mathrm{Exp}\!\big((\tilde{\boldsymbol{\omega}}_t - \mathbf{b}^g_i)\,\delta t\big)$$

$$
\Delta\mathbf{v}_{ij} = \sum_{t=i}^{j-1} \Delta\mathbf{R}_{it}\,(\tilde{\mathbf{a}}_t - \mathbf{b}^a_i)\,\delta t, \qquad
\Delta\mathbf{p}_{ij} = \sum_{t=i}^{j-1}\Big[\Delta\mathbf{v}_{it}\,\delta t + \tfrac{1}{2}\Delta\mathbf{R}_{it}\,(\tilde{\mathbf{a}}_t - \mathbf{b}^a_i)\,\delta t^2\Big]
$$

注意重力在这里**不**出现——它只在下面的残差中重新出现,那时绝对姿态才可用。用伪代码表示,这个累积过程是一个每个关键帧区间只运行一次的简单循环:

```text
ΔR, Δv, Δp ← I, 0, 0
for each IMU sample (ω̃, ã, δt) in [i, j):
    Δp ← Δp + Δv·δt + ½·ΔR·(ã − bᵃ)·δt²
    Δv ← Δv + ΔR·(ã − bᵃ)·δt
    ΔR ← ΔR · Exp((ω̃ − bᵍ)·δt)
    (propagate covariance and bias Jacobians alongside)
```

## IMU残差

得到的因子将预测的相对运动(由当前的位姿/速度/偏置估计和重力计算得出)与存储的预积分测量值进行比较,这与重投影残差比较预测像素和观测像素的方式完全平行:

$$
\mathbf{r}_{\Delta R} = \mathrm{Log}\big(\Delta\mathbf{R}_{ij}^\top\,\mathbf{R}_i^\top\mathbf{R}_j\big), \qquad
\mathbf{r}_{\Delta v} = \mathbf{R}_i^\top\big(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\,\Delta t_{ij}\big) - \Delta\mathbf{v}_{ij}
$$

$$\mathbf{r}_{\Delta p} = \mathbf{R}_i^\top\big(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\,\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\,\Delta t_{ij}^2\big) - \Delta\mathbf{p}_{ij}$$

并按累积循环中传播的协方差进行加权(这正是[IMU noise model](imu-noise-model.md)参数介入的地方)。

## 使其实用的两项改进

- **通过雅可比进行偏置修正。** 预积分项是用某个特定的偏置估计 $\mathbf{b}_i$ 计算得到的。当优化器将偏置更新 $\delta\mathbf{b}$ 时,一个利用存储雅可比的一阶修正会更新该因子而不触碰原始数据:
  $$\Delta\tilde{\mathbf{R}}_{ij}(\mathbf{b} + \delta\mathbf{b}) \approx \Delta\mathbf{R}_{ij}\cdot\mathrm{Exp}\!\Big(\tfrac{\partial \Delta\mathbf{R}}{\partial \mathbf{b}^g}\,\delta\mathbf{b}^g\Big),$$
  对 $\Delta\mathbf{v}_{ij}, \Delta\mathbf{p}_{ij}$ 也有类似的 $\partial/\partial\mathbf{b}^g$ 和 $\partial/\partial\mathbf{b}^a$ 项。只有当偏置远离线性化点时,才需要重新积分该区间。
- **流形上的表述(Forster等人,2015)。** 旋转存在于李群 $SO(3)$ 上,而非向量空间中。Forster的表述在流形上正确地进行积分和噪声传播,得到正确的协方差和解析雅可比。这正是GTSAM、VINS-Mono、ORB-SLAM3、Kimera-VIO和OKVIS2所实现的版本。

## 常见陷阱

- **忘记偏置线性化的有效范围。** 一阶偏置修正只在存储的线性化点附近有效;在偏置发生较大更新之后(例如在初始化期间),应重新计算预积分项。
- **重力符号/坐标系约定。** 重力 $\mathbf{g}$ 是指向上还是指向下,以及加速度计模型是减去还是加上重力,在不同论文和代码库之间存在差异——不匹配会导致估计器立即发散。
- **时间戳抖动和丢样。** 该累积过程假定每个采样点的 $\delta t$ 是准确的;若使用名义采样率而非实测时间戳,会引入未建模的误差。
- **忽视协方差传播。** 预积分测量值的作用大小取决于其权重;跳过恰当的噪声传播(或使用随意的常数协方差)会使IMU与视觉项的权衡失衡。

## 对SLAM的意义
预积分是使基于优化的VIO实现实时性的那个单一思想:它将每对关键帧之间数百个高频测量值压缩成一个因子,同时仍能精确地被重新线性化。每一个现代紧耦合VIO系统都建立在它之上,理解 $\Delta\mathbf{R}_{ij}$ 是如何形成并进行偏置修正的,是理解任何VIO代码库最快的途径。

## 相关条目
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — Forster 2015论文条目。
- [IMU noise model](imu-noise-model.md) — 进入积分过程的偏置和噪声项。
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — 流形上表述背后的数学工具。
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — 预积分IMU因子所在的位置。
- [VINS-Mono](vins-mono.md) — 一个围绕预积分IMU因子构建的完整系统。
