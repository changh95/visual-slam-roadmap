# Quaternion kinematics for error-state KF

> Solà 2017 · [论文](https://arxiv.org/abs/1711.02508)

**一句话总结** — 一篇从第一性原理出发推导四元数代数与运动学、并据此构建用于 IMU 驱动状态估计的误差状态卡尔曼滤波器(ESKF)的独立成篇教程——是在 VIO 滤波器中*正确*处理旋转的标准参考资料。

## 问题

三维旋转是任何估计引擎中最容易出错的部分:四元数并不构成向量空间,相互竞争的符号与顺序约定(Hamilton 约定与 JPL 约定)污染了文献,而关于旋转的*扰动、导数与积分*的正确定义分散在各处相互矛盾的资料中。Solà 的这篇文章是"对与三维空间中四元数和旋转相关的概念与公式,以及它们在诸如误差状态卡尔曼滤波器等估计引擎中正确使用方式的详尽梳理",其中包括对旋转群及其李结构的深入研究——明确目标是为集成 IMU 信号的实际应用推导出精确的 ESKF 公式。

## 方法与架构

- **严谨的四元数代数。** 确定 Hamilton 约定($ij = k$,$i^2 = j^2 = k^2 = ijk = -1$,标量部分在前),并推导出乘积 $\otimes$、共轭,以及连接旋转向量和单位四元数的指数映射(公式 101):

  $$\mathbf{q} \triangleq \mathrm{Exp}(\phi\mathbf{u}) = e^{\phi\mathbf{u}/2} = \begin{bmatrix} \cos(\phi/2) \\ \mathbf{u}\sin(\phi/2) \end{bmatrix},$$

  双重乘积 $\mathbf{x}' = \mathbf{q} \otimes \mathbf{x} \otimes \mathbf{q}^{*}$ 解释了半角的由来,以及由 $\mathbf{R} = e^{\phi[\mathbf{u}]_\times}$ 得出的矩阵侧罗德里格斯公式。一个专门章节梳理了四种"四元数风格",使得任何代码库中的 Hamilton 与 JPL 混淆问题都能被诊断出来。
- **真实状态、名义状态与误差状态。** 真实状态是*名义状态*(大信号,由 IMU 数据非线性积分得到)与*误差状态* $\delta\mathbf{x} = (\delta\mathbf{p}, \delta\mathbf{v}, \delta\boldsymbol{\theta}, \delta\mathbf{a}_b, \delta\boldsymbol{\omega}_b, \delta\mathbf{g})$(小信号,可线性积分,适用于线性高斯滤波)的组合。IMU 模型为 $\mathbf{a}_m = \mathbf{R}_t^{\top}(\mathbf{a}_t - \mathbf{g}_t) + \mathbf{a}_{bt} + \mathbf{a}_n$,$\boldsymbol{\omega}_m = \boldsymbol{\omega}_t + \boldsymbol{\omega}_{bt} + \boldsymbol{\omega}_n$,真实四元数运动学为 $\dot{\mathbf{q}}_t = \tfrac{1}{2}\mathbf{q}_t \otimes \boldsymbol{\omega}_t$。
- **名义状态传播(离散形式,公式 260)。** $\mathbf{p} \leftarrow \mathbf{p} + \mathbf{v}\Delta t + \tfrac{1}{2}(\mathbf{R}(\mathbf{a}_m - \mathbf{a}_b) + \mathbf{g})\Delta t^2$,$\ \mathbf{v} \leftarrow \mathbf{v} + (\mathbf{R}(\mathbf{a}_m - \mathbf{a}_b) + \mathbf{g})\Delta t$,$\ \mathbf{q} \leftarrow \mathbf{q} \otimes \mathbf{q}\{(\boldsymbol{\omega}_m - \boldsymbol{\omega}_b)\Delta t\}$ ——忽略噪声的完整非线性积分。
- **误差状态动力学(公式 238)。** 对误差求解组合关系并舍去二阶项,得到卡尔曼滤波器实际运行所依赖的线性时变系统:

  $$\dot{\delta\mathbf{v}} = -\mathbf{R}[\mathbf{a}_m - \mathbf{a}_b]_\times\,\delta\boldsymbol{\theta} - \mathbf{R}\,\delta\mathbf{a}_b + \delta\mathbf{g} - \mathbf{R}\mathbf{a}_n, \qquad \dot{\delta\boldsymbol{\theta}} = -[\boldsymbol{\omega}_m - \boldsymbol{\omega}_b]_\times\,\delta\boldsymbol{\theta} - \delta\boldsymbol{\omega}_b - \boldsymbol{\omega}_n,$$

  其中 $\dot{\delta\mathbf{p}} = \delta\mathbf{v}$,偏置为随机游走。姿态误差 $\delta\boldsymbol{\theta} \in \mathbb{R}^3$ 是相对于名义四元数以*局部*(乘性)方式定义的;另有一章给出了全局定义角误差的变体。
- **ESKF 循环。** 用离散误差动力学预测误差协方差;当出现非 IMU 观测(GPS、视觉)时,通过链式雅可比(经由名义状态)按标准卡尔曼滤波方程更新误差状态;**注入**均值到名义状态,$\mathbf{q} \leftarrow \mathbf{q} \otimes \mathbf{q}\{\hat{\delta\boldsymbol{\theta}}\}$(公式 283,对向量状态则为求和);然后**重置** $\hat{\delta\mathbf{x}} \leftarrow 0$,并以协方差更新 $\mathbf{P} \leftarrow \mathbf{G}\mathbf{P}\mathbf{G}^{\top}$ 将姿态误差重新表达在新的名义坐标系下。
- **误差状态为何更优。** 误差始终接近零,因此线性化精确;姿态误差采用最简的三参数表示,远离任何奇异点;而大信号、快变化的部分由精确非线性积分处理,而非由滤波器处理。附录提供了龙格-库塔与闭式积分方案、截断级数转移矩阵,以及完整 IMU 示例中的噪声脉冲积分。

## 实验结果

这是一篇教程/参考文档,而非经过基准测试的系统——它不报告任何实验,其"结果"是一套完整、内部一致的公式和雅可比目录(旋转映射、扰动、ESKF 矩阵),可直接转录为代码。它的影响力体现在被采纳的程度上:它已成为基于滤波的 VIO 和 IMU 融合实现最常引用的标准文献之一,其阐述的 ESKF 配方是无数研究和生产级 IMU 集成模块背后的模式。它与流形上的预积分(优化侧的对应方法)一起,构成了现代 VIO 代码库所依赖的数学工具箱。

## 对SLAM的意义

旋转并不处于向量空间中,因此在四元数上进行朴素的加性 EKF 更新会破坏群约束;误差状态这一技巧是每一个严肃的基于滤波的 VIO(MSCKF、ROVIO、OpenVINS 以及商用跟踪器)处理姿态的方式。Solà 的这份笔记是大多数实现者在编写 IMU 传播或 ESKF 模块时案头必备的文档,它与基于优化系统所使用的流形上预积分理论相辅相成。

## 相关条目

- [IMU noise model](imu-noise-model.md)
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [MSCKF](msckf.md)
- [Introduction to Inertial Navigation](introduction-to-inertial-navigation.md)
- [OpenVINS](openvins.md)
