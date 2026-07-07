# ROVIO

> Bloesch 2015 · [论文](https://github.com/ethz-asl/rovio)

**一句话总结** — ROVIO(鲁棒视觉惯性里程计,Robust Visual Inertial Odometry)是一种紧耦合单目 VIO,它将多级图像块的直接像素强度误差作为创新项直接输入 EKF,状态量完全以机体为中心(robocentric),地标采用方位向量/逆距离表示——由此得到一个"开机即用"的估计器,无需任何初始化流程。

## 问题

基于特征的 VIO 系统(MSCKF、OKVIS)依赖描述子提取与匹配,在低纹理环境和快速运动模糊下会失效。与此独立的另一个问题是,标准的以世界为中心的 EKF 会在状态中保留全局不可观测的量(绝对位置、航向角),导致规范自由度(gauge-freedom)和一致性问题。ROVIO 同时解决了这两个问题:光度块误差取代了特征匹配流水线,而以机体为中心的表述配合最小化的流形上地标参数化,则完全避免了表示不可观测的全局位置。

## 方法与架构

- **以机体为中心的状态量。** 设 IMU 坐标系为 $B$,世界坐标系为 $I$,相机坐标系为 $V$,滤波器状态量(论文公式 1)为
  $$\mathbf{x} := \big(\mathbf{r},\ \mathbf{v},\ \mathbf{q},\ \mathbf{b}_f,\ \mathbf{b}_\omega,\ \mathbf{c},\ \mathbf{z},\ \mu_0,\dots,\mu_N,\ \rho_0,\dots,\rho_N\big),$$
  其中 $\mathbf{r}, \mathbf{v}$ 是以机体坐标系 $B$ 表达的 IMU 位置和速度,$\mathbf{q}$ 是姿态($B\to I$ 的映射),$\mathbf{b}_f, \mathbf{b}_\omega$ 是加速度计/陀螺仪偏置,$\mathbf{c}, \mathbf{z}$ 是在线标定的 IMU-相机外参,每个地标则为一个方位向量 $\mu_i \in S^2$ 加一个距离参数 $\rho_i$,满足 $d(\rho_i) = 1/\rho_i$(逆距离)。旋转和单位向量采用最小化的 boxplus 差分,因此一个地标只需 3 个协方差列(2 个方位 + 1 个深度),并且可以在检测到的瞬间以巨大的深度不确定性*无延迟*初始化。
- **IMU 驱动的传播。** 利用偏置校正后的测量值 $\hat{\mathbf{f}}, \hat{\boldsymbol{\omega}}$,连续动力学(公式 2–4)为
  $$\dot{\mathbf{r}} = -\hat{\boldsymbol{\omega}}^\times\mathbf{r} + \mathbf{v} + \mathbf{w}_r, \qquad \dot{\mathbf{v}} = -\hat{\boldsymbol{\omega}}^\times\mathbf{v} + \hat{\mathbf{f}} + \mathbf{q}^{-1}(\mathbf{g}), \qquad \dot{\mathbf{q}} = -\mathbf{q}(\hat{\boldsymbol{\omega}}),$$
  而每个地标的方位与距离随相机坐标系下的速度演化(公式 9–10):$\dot{\mu}_i = N^T(\mu_i)\hat{\boldsymbol{\omega}}^V - \begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix} N^T(\mu_i)\frac{\hat{\mathbf{v}}^V}{d(\rho_i)}$ 以及 $\dot{\rho}_i = -\mu_i^T\hat{\mathbf{v}}^V / d'(\rho_i)$,其中 $N^T(\mu)$ 投影到 $\mu$ 的切空间上。
- **直接光度更新。** 每个地标携带一个多级图像块:在一个缩放因子为 2 的图像金字塔的每一层上都有一个 $8{\times}8$ 像素的图像块 $P_l$(4 层 → 每个特征 $256 = 4\times8\times8$ 个强度误差)。对于第 $l$ 层的图像块像素 $\mathbf{p}_j$,强度误差(公式 17)为
  $$e_{l,j} = P_l(\mathbf{p}_j) - I_l\big(\mathbf{p}\,s_l + \mathbf{W}\mathbf{p}_j\big) - m,$$
  其中 $\mathbf{W}$ 为处理视角形变的仿射变形,$s_l$ 为每层的尺度,均值误差 $m$ 被减去以实现光照不变性。将所有项堆叠得到 $\bar{\mathbf{b}}(\hat{\mathbf{p}}) = \bar{\mathbf{A}}(\hat{\mathbf{p}})\,\delta\mathbf{p}$;通过 QR 分解将其压缩为一个等价的二维系统 $\mathbf{b}(\hat{\mathbf{p}}) = \mathbf{A}(\hat{\mathbf{p}})\,\delta\mathbf{p}$,并以创新项 $\mathbf{y}_i = \mathbf{b}_i(\pi(\hat{\mu}_i)) + \mathbf{n}_i$、雅可比 $\mathbf{H}_i = \mathbf{A}_i(\pi(\hat{\mu}_i))\frac{d\pi}{d\mu}(\hat{\mu}_i)$ 的形式进入 EKF——不需要描述子,不需要显式匹配。
- **鲁棒性机制。** 预测不确定性较大的特征(例如新出现的特征)会先进行基于图像块的预对齐,以改善更新前的 EKF 线性化点;马氏距离创新检验用于剔除外点/运动物体;检测采用 FAST 角点检测器,并用多级 Shi-Tomasi 准则($\mathbf{H} = \bar{\mathbf{A}}^T\bar{\mathbf{A}}$,取最小特征值)打分,配合分桶(bucketing)策略,局部/全局跟踪质量分数则用于控制特征替换。

## 实验结果

在一个 VI-Sensor 采集的数据上进行了评测(一个宽 VGA 全局快门相机,20 Hz,120° 视场角镜头;ADIS16448 IMU,200 Hz,角度随机游走 0.66 deg/√Hz),最多 50 个特征,4 层金字塔,动作捕捉系统提供真值。在一段约 1 分钟的手持序列中(平均旋转速率约 1.5 rad/s),相对位置误差与行进距离之比**与一个参考批量优化框架相近,且往往略优**;仅当特征数低于 20 时精度才明显下降。在 Intel i7-2760QM 单核上的单帧处理耗时:10 个特征时为 6.65 ms,50 个特征时最高为 **29.72 ms**——在 20 Hz 下轻松达到实时性能。在一个快速运动数据集上(平均 3.5 rad/s,峰值可达 8 rad/s),姿态和机体坐标系下速度在其 3σ 边界内跟踪真值,仅有不可观测的航向角缓慢漂移;IMU-相机外参能够从一个粗略猜测(平移初始化为零)在线收敛。该滤波器还在一台多旋翼无人机上机载运行,从起飞到降落全程稳定飞行,并进行在线标定。

## 对SLAM的意义

ROVIO 证明了直接法与卡尔曼滤波可以自然地结合:相机变成"仅仅是另一个传感器",为 EKF 产生强度创新项,而以机体为中心加逆距离的表述方式则同时消除了初始化流程以及困扰以世界为中心滤波器的不可观测全局状态。它成为 maplab 建图框架的 VIO 前端(ROVIOLI),也是 EuRoC 时代与 MSCKF、OKVIS 并列的标准基线,其光度残差理念延续到了后来的直接法 VIO 系统,如 VI-DSO 和 DM-VIO。当你需要一种能够容忍低纹理和运动模糊的轻量级、鲁棒的里程计时,可以选择它。

## 相关条目

- [MSCKF](msckf.md)
- [OpenVINS](openvins.md)
- [DM-VIO](dm-vio.md)
- [maplab](maplab.md)
- [VI-DSO](vi-dso.md)
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md)
