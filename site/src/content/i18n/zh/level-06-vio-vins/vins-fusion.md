# VINS-Fusion

> Qin 2019 · [论文](https://arxiv.org/abs/1901.03638)

**一句话总结** — VINS-Fusion 将 VINS-Mono 推广为一个用于局部里程计的基于优化的框架,其中每个传感器都被视为一个通用因子;共享状态变量的因子被汇总到同一个滑动窗口问题中,并在同一个开源代码库中展示了纯双目、单目+IMU 和双目+IMU 这三种套件。

## 问题

机器人所搭载的传感器组合日益多样化——地面车辆上的双目相机、手机上的单目相机加 IMU、飞行机器人上的双目加 IMU——但大多数状态估计器都是为单一传感器或某一种特定套件设计的,无法跨平台移植。一个实用的系统还需要能够优雅地处理传感器失效:某个失效的传感器应能被移除,并能迅速加入一个替代传感器。VINS-Fusion 提出了一个统一的基于优化的通用框架,在这个框架中每个传感器都仅仅是位姿图中的另一个残差因子。

## 方法与架构

**状态量。** 滑动窗口估计本体位姿以及可选的传感器专属变量:

$$\mathcal{X} = [\mathbf{p}_0, \mathbf{R}_0, \dots, \mathbf{p}_n, \mathbf{R}_n, \mathbf{x}_{cam}, \mathbf{x}_{imu}], \quad \mathbf{x}_{cam} = [\lambda_0, \dots, \lambda_l], \quad \mathbf{x}_{imu} = [\mathbf{v}_0, \mathbf{b}_{a_0}, \mathbf{b}_{g_0}, \dots]$$

其中 $\lambda$ 是每个特征在其首次观测帧中的深度;对于纯双目套件,$\mathbf{x}_{imu}$(速度和 IMU 偏置)则被直接省略。状态估计是对独立高斯观测量的最大似然估计,即非线性最小二乘:

$$\mathcal{X}^{*} = \arg\min_{\mathcal{X}} \sum_{t=0}^{n} \sum_{k\in\mathbf{S}} \left\lVert \mathbf{z}^{k}_{t} - h^{k}_{t}(\mathcal{X}) \right\rVert^{2}_{\mathbf{\Omega}^{k}_{t}}$$

**相机因子。** 由 KLT 跟踪的 Shi-Tomasi 角点(双目情形下还进行左右匹配);该因子将特征 $l$ 从其在图像 $i$ 中的首次观测重投影到图像 $t$:

$$\mathbf{z}^{l}_{t} - h^{l}_{t}(\mathcal{X}) = \begin{bmatrix} u^{l}_{t} \\ v^{l}_{t} \end{bmatrix} - \pi_c\Big( (\mathbf{T}^{b}_{c})^{-1}\, \mathbf{T}_{t}^{-1}\, \mathbf{T}_{i}\, \mathbf{T}^{b}_{c}\, \pi_c^{-1}\big(\lambda_l, \begin{bmatrix} u^{l}_{i} \\ v^{l}_{i} \end{bmatrix}\big) \Big)$$

其中 $\pi_c$ 是相机模型的投影函数,$\mathbf{T}^b_c$ 是本体到相机的外参。*同一个*因子既服务于时间上(左到左)的观测,也服务于空间上(左到右)的观测——空间观测通过标定好的基线约束度量尺度,不需要 IMU 激励。

**IMU 因子。** 连续帧之间的流形上预积分产生伪观测量 $\boldsymbol{\alpha}^{t-1}_{t}, \boldsymbol{\beta}^{t-1}_{t}, \boldsymbol{\gamma}^{t-1}_{t}$(相对位置、速度、旋转)以及传播的协方差;残差将其与状态预测的运动进行比较,例如对于位置有 $\boldsymbol{\alpha}^{t-1}_{t} \ominus \mathbf{R}_{t-1}^{-1}(\mathbf{p}_t - \mathbf{p}_{t-1} + \tfrac{1}{2}\mathbf{g}\,dt^2 - \mathbf{v}_{t-1} dt)$,偏置被建模为随机游走。

**优化与边缘化。** 汇总后的代价函数在 Ceres 中通过高斯-牛顿/Levenberg-Marquardt 求解。窗口保留十个空间相机帧;当有新的关键帧到来时,最旧帧的视觉和惯性因子通过舒尔补被边缘化,

$$\mathbf{H}_p = \mathbf{H}_{rr} - \mathbf{H}_{rm}\mathbf{H}_{mm}^{-1}\mathbf{H}_{mr}, \qquad \mathbf{b}_p = \mathbf{b}_r - \mathbf{H}_{rm}\mathbf{H}_{mm}^{-1}\mathbf{b}_m$$

将问题转化为带有先验项且无信息损失的 MAP 问题。由于任何能够归约为残差因子的传感器都能被纳入(论文中提及了轮式里程计、LiDAR、雷达),传感器失效可以通过移除失效传感器的因子并加入另一个传感器的因子来处理。

## 实验结果

在 EuRoC 上(RMSE ATE,Horn 对齐),三种套件与 OKVIS 进行了比较:单目+IMU 在 MH_02 上达到 0.09 m(OKVIS 为 0.22),在 V1_02 上为 0.09 m(OKVIS 为 0.20),在 V2_01 上为 0.06 m(OKVIS 为 0.13),在大多数序列上超过了 OKVIS。纯双目在 V1_03 和 V2_03 上*失败*(运动过于剧烈,视觉跟踪无法应对),在其他地方漂移也最大;每一种有 IMU 辅助的配置都在全部十一个序列上存活下来——IMU 弥补了光照变化、无纹理区域和运动模糊,并通过观测重力抑制了横滚/俯仰漂移。双目+IMU 并非总是最优,它对标定误差更为敏感。在户外手持实验中(mvBlueFOX 双目相机,20 Hz + DJI A3 IMU,200 Hz,以 GPS 为真值),在约 224–232 米的环路上,RMSE 从纯双目的 1.85–2.59 m 降低到融合 IMU 后的 0.43–0.75 m。GPS 融合在本文中被列为未来工作;而开源发布的 VINS-Fusion 则附带了一个配套的全局位姿图模块,用于将局部里程计与全局位置观测融合。

## 对SLAM的意义

VINS-Fusion 是机器人领域部署最广泛的开源里程计栈之一:它将学术上成功的 VINS-Mono 通过增加双目尺度可观测性和传感器无关的因子表述,变得能够适用于真实车辆,后来又扩展了 GPS 漂移校正。它"一切皆因子"的设计成为自动驾驶和无人机自主领域局部加全局融合的模板,并且仍然是双目惯性估计的标准基线。

## 相关条目

- [VINS-Mono](vins-mono.md)
- [OKVIS](okvis.md)
- [Scale observability](../level-07-stereo-slam/scale-observability.md)
- [Tightly-coupled vs Loosely-coupled](tightly-coupled-vs-loosely-coupled.md)
- [LVI-SAM](../level-09-lidar-visual-lidar-slam/lvi-sam.md)
- [OKVIS2-X](okvis2-x.md)
