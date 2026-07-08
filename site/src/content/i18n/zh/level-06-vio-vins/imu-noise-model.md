# IMU噪声模型

原始IMU测量值以一种结构化的方式受到污染。完整的误差模型(遵循Woodman的入门教程)包括偏置、比例因子误差、交叉轴失准以及每个传感器的白噪声:

$$
\tilde{\mathbf{a}} = \mathbf{a} + \mathbf{b}^a + \mathbf{S}^a\mathbf{a} + \mathbf{M}^a\mathbf{a} + \boldsymbol{\eta}^a, \qquad
\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b}^g + \mathbf{S}^g\boldsymbol{\omega} + \mathbf{M}^g\boldsymbol{\omega} + \boldsymbol{\eta}^g
$$

其中 $\mathbf{S}$ 是(对角的)比例因子误差,$\mathbf{M}$ 是交叉轴敏感度。VIO估计器假设 $\mathbf{S}$ 和 $\mathbf{M}$ 已由出厂或离线标定处理,只保留两个在线项——加性**白噪声**和缓慢变化的**偏置**:

$$
\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b}^g + \boldsymbol{\eta}^g \qquad
\tilde{\mathbf{a}} = \mathbf{a} + \mathbf{b}^a + \boldsymbol{\eta}^a
$$

其中 $\boldsymbol{\eta}$ 是零均值白高斯噪声,每个偏置都被建模为**随机游走**:$\dot{\mathbf{b}} = \boldsymbol{\eta}^b$,拥有自己的白色驱动噪声。

## 为什么这两项如此重要

- **白噪声积分为随机游走漂移。** 对陀螺仪白噪声积分会得到一个按 $\sigma\sqrt{t}$ 增长的姿态误差(*角度随机游走*);对加速度计噪声二次积分会得到一个按 $t^{3/2}$ 增长的位置误差。这就是为什么使用MEMS IMU的纯惯性推算会在几秒内发散——也是为什么需要相机的原因。
- **偏置不是常数。** 开机偏置在每次开机时都不同,运行中偏置会随时间和温度缓慢漂移。因此VIO估计器将 $\mathbf{b}^g, \mathbf{b}^a$ *保留在状态向量中*并持续估计它们;随机游走模型告诉估计器应允许它们以多快的速度变化。

## 四个参数及其单位

一个VIO配置需要四个数值(通常按轴给出,一般共用):

| 参数 | 符号 | 典型连续时间单位 |
|---|---|---|
| 陀螺噪声密度(角度随机游走) | $\sigma_{\eta^g}$ | $\mathrm{rad/s/\sqrt{Hz}}$ |
| 加速度计噪声密度(速度随机游走) | $\sigma_{\eta^a}$ | $\mathrm{m/s^2/\sqrt{Hz}}$ |
| 陀螺偏置随机游走 | $\sigma_{b^g}$ | $\mathrm{rad/s^2/\sqrt{Hz}}$ |
| 加速度计偏置随机游走 | $\sigma_{b^a}$ | $\mathrm{m/s^3/\sqrt{Hz}}$ |

这些是*连续时间密度*。要在离散采样间隔 $\Delta t$ 下使用它们,标准的转换是:测量噪声用 $\sigma_{\eta,d} = \sigma_\eta / \sqrt{\Delta t}$,偏置增量用 $\sigma_{b,d} = \sigma_b \sqrt{\Delta t}$——这是实现中常见错误的一个长期来源(见"常见陷阱")。这四个数值直接输入EKF的协方差传播或预积分IMU因子的协方差中,即它们决定了估计器相对于相机对IMU的信任程度。

## Allan方差:识别参数

**Allan方差**是从一段长时间静止记录(数小时,温度稳定)中识别这些噪声参数的标准工具。在对数-对数坐标下绘制Allan偏差 $\sigma(\tau)$ 相对于平均时间 $\tau$ 的曲线,可以通过斜率区分不同的噪声来源:

| 斜率 | 噪声来源 | 参数 |
|---|---|---|
| $-1/2$ | 白噪声(角度/速度随机游走) | $\sigma_{\eta}$(在 $\tau = 1\,\mathrm{s}$ 处读取的噪声密度) |
| $0$(平坦的最小值) | 偏置不稳定性 | — |
| $+1/2$ | 偏置随机游走 | $\sigma_{b}$(随机游走密度) |

从这张图上读出的四个数值,正是VINS-Mono、OpenVINS、Kimera-VIO及其他所有VIO系统的配置文件所需要的参数,例如Kalibr风格的`imu.yaml`中:

```yaml
# continuous-time noise densities (example structure — measure your own values)
gyroscope_noise_density:     ...   # [rad/s/sqrt(Hz)]
gyroscope_random_walk:       ...   # [rad/s^2/sqrt(Hz)]
accelerometer_noise_density: ...   # [m/s^2/sqrt(Hz)]
accelerometer_random_walk:   ...   # [m/s^3/sqrt(Hz)]
update_rate: 200.0                 # [Hz]
```

`kalibr_allan`和`allan_variance_ros`等工具可以自动完成记录和拟合流程。在实践中,数值通常会在Allan方差推导值的基础上适度放大(通常是数倍),以吸收未建模的效应:振动、温度波动、比例因子残差。

## 常见陷阱

- **单位混淆。** 将连续时间密度与离散时间标准差(或数据表中的单位,如陀螺仪的 $^\circ/\sqrt{\mathrm{h}}$)混用,会在不知不觉中把IMU的权重弄错好几个数量级。始终检查你的估计器所期望的是哪种约定。
- **数据表过于乐观。** 制造商给出的数值是在防振工作台上测得的;四旋翼上的IMU会感受到表现如同额外噪声的电机振动。如果可能,在实际平台上进行记录。
- **参数过于自信**会使滤波器过度信任IMU——在振动或快速运动下发散。**参数过于悲观**则会丢弃IMU的运动信息,损害视觉丢失期间的鲁棒性。这两种失效模式都很常见;需要刻意调节。
- **Allan记录时间过短。** $+1/2$ 的偏置随机游走区域只在较大的 $\tau$ 处才出现;10分钟的记录无法识别出它。数小时的静止记录才是常态。

## 对SLAM的意义
噪声模型是你的硬件与估计器之间的契约:它决定了IMU因子相对于视觉因子的权重。参数过于乐观会使滤波器对IMU过度自信(在振动下发散);过于悲观则会丢弃IMU的运动信息。能够运行并读懂Allan方差图,是任何在真实硬件上部署VIO的人的基本实践技能。

## 相关条目
- [Introduction to Inertial Navigation](introduction-to-inertial-navigation.md) — Woodman深入介绍误差来源的入门教程。
- [IMU](../level-02-getting-familiar/imu.md) — 传感器本身。
- [IMU preintegration](imu-preintegration.md) — 这些噪声项传播进入因子协方差的地方。
- [OpenVINS](openvins.md) — 一个将噪声参数工作流程说明得很清楚的系统。
- [Multi-sensor calibration](../level-02-getting-familiar/multi-sensor-calibration.md) — 去除比例/失准项的离线标定。
