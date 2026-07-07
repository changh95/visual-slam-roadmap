# 惯性导航简介

> Woodman 2007 · [论文](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-696.html)

**一句话总结** — 一份关于惯性导航的自成体系的教程性技术报告——涵盖传感器物理原理、捷联式积分（strapdown integration），以及对MEMS误差传播的测量与仿真研究——至今仍是学习任何VIO系统之前的标准入门读物。

## 问题
IMU几乎出现在每一个机器人和SLAM系统中，但现有的惯性导航入门材料"未能充分描述惯性系统的误差特性"。初入VIO领域的研究者缺乏理解陀螺仪和加速度计噪声为何从根本上限制航位推算（dead-reckoning）精度的背景知识——也因此不理解为何每一种视觉惯性设计都呈现出现在这样的形态。Woodman的剑桥技术报告（UCAM-CL-TR-696）填补了这一空白，聚焦于基于MEMS器件构建的捷联式系统。

## 方法与架构
该报告完整梳理了捷联式INS（惯性导航系统）流程，并通过测量（Allan方差）和仿真对每个误差源进行了量化：

- **传感器物理原理。** 陀螺仪：机械式、光学式（Sagnac效应）以及MEMS式（作用在振动质量块上的科里奥利力）；加速度计：机械式检测质量块、固态式（例如表面声波器件）以及MEMS式。加速度计测量的是比力（specific force），因此在投影到全局坐标系之后必须减去重力。
- **姿态跟踪。** 机体坐标系下的角速度$\boldsymbol{\omega}_b(t)$通过$\dot{C}(t) = C(t)\,\Omega(t)$驱动方向余弦矩阵$C$（机体→全局），其中$\Omega$是$\boldsymbol{\omega}_b$的反对称形式。用矩形法在一个采样周期内进行积分（$B = \Omega\,\delta t$，$\sigma = |\boldsymbol{\omega}_b\,\delta t|$）可得到闭式的姿态更新公式

  $$C(t+\delta t) = C(t)\left(I + \frac{\sin\sigma}{\sigma}B + \frac{1-\cos\sigma}{\sigma^{2}}B^{2}\right).$$

- **位置跟踪。** 加速度被旋转到全局坐标系、补偿重力后进行二次积分：$\mathbf{a}_g(t) = C(t)\,\mathbf{a}_b(t)$，然后$\mathbf{v}_g(t) = \mathbf{v}_g(0) + \int_0^t (\mathbf{a}_g - \mathbf{g}_g)\,dt$以及$\mathbf{s}_g(t) = \mathbf{s}_g(0) + \int_0^t \mathbf{v}_g\,dt$。
- **误差增长规律。** 恒定的陀螺仪偏置$\epsilon$积分后会产生线性增长的角度误差$\theta(t) = \epsilon\,t$。方差为$\sigma^2$的陀螺仪白噪声会产生一种*角度随机游走*（angle random walk），$\sigma_\theta(t) = \sigma\sqrt{\delta t \cdot t}$（按$\sqrt{t}$增长）。加速度计白噪声经二次积分后会在位置上产生*二阶随机游走*，

  $$\sigma_s(t) \approx \sigma\, t^{3/2} \sqrt{\delta t / 3},$$

  按$t^{3/2}$增长。闪烁噪声（1/f噪声）会导致偏置不稳定性，通常建模为偏置随机游走；温度和标定误差（比例因子、安装误差）则会引入结构化误差项。
- **关键误差路径。** 倾角误差$\epsilon$会以残余偏置$g\sin(\epsilon)$的形式将重力泄漏到水平通道中：仅0.05°的倾角就会向水平轴上投影出0.0086 m/s²的加速度，仅30秒后就会以平方规律增长到7.7 m的位置误差。陀螺仪误差传播到重力补偿环节中所造成的影响——而非加速度计误差——才是主导INS漂移的因素。
- **Allan方差。** 将信号划分为长度为$t$的若干区间，对每个区间求平均，然后计算$\mathrm{AVAR}(t) = \frac{1}{2(n-1)}\sum_i (a(t)_{i+1} - a(t)_i)^2$。在对数-对数坐标的Allan偏差曲线图上，白噪声表现为斜率$-0.5$的直线（在$t = 1$处读出ARW/VRW），偏置不稳定性表现为曲线的平坦极小值——这一流程能得到每个VIO滤波器配置都需要的噪声参数。

## 实验结果
使用一台以100 Hz采样的Xsens Mtx MEMS IMU（500次静止的60秒试验）：

- 纯捷联式航位推算60秒后的平均位置漂移达到**152.67 m**；其中仅1.76 m是垂直方向的漂移——这正是倾角误差导致重力泄漏的典型特征。
- 在仿真中选择性地去除传感器噪声表明，加速度计噪声只在最初约0.3秒内主导漂移；此后，由陀螺仪噪声引起的姿态误差才是主要原因，其中白噪声在各类陀螺仪噪声过程中贡献最大。
- 对Mtx陀螺仪的Allan分析得出角度随机游走约为4.6–4.8°/√h，偏置不稳定性约为32–43°/h。
- 与磁力计进行传感器融合后，60秒平均位置误差从150多米降至约5 m——这预示了为何惯性数据始终需要辅助信息（在VIO中即为相机）。

## 对SLAM的意义
几乎每一篇VIO论文都假定读者已经了解IMU测量的是什么、为何必须在线估计偏置、以及为何纯惯性航位推算会发散——并引用Woodman的报告来说明细节。先读这份报告，会让MSCKF、预积分以及此后每一个系统中的测量模型都变得清晰易懂，其"60秒漂移152米"的实例还给出了相机需要纠正多少误差的定量直觉。

## 相关条目
- [IMU noise model](imu-noise-model.md) — 从本材料中提炼出的概念性笔记。
- [IMU](../level-02-getting-familiar/imu.md) — 传感器基础知识。
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — 建立在这些测量模型之上的理论。
- [MSCKF](msckf.md) — 在打好这一基础之后应阅读的第一个系统。
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md) — 处理旋转的配套数学参考资料。
