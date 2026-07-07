# OpenVINS

> Geneva 2020 · [论文](https://docs.openvins.com/)

**一句话总结** — OpenVINS 是特拉华大学开发的一个开源、模块化的基于 MSCKF 的 VIO 研究平台,它将一个流形上的滑动窗口卡尔曼滤波器与 FEJ 一致性、在线相机内参/外参与时间偏移标定、完整的视觉惯性仿真器以及评测工具打包在一起——已成为事实上的标准 MSCKF 实现。

## 问题

尽管 MSCKF 自 2007 年起就产生了广泛影响,但一直没有权威、文档完善的开源实现,这使得复现结果以及在基于滤波与基于优化的 VIO 之间进行比较变得相当困难;现有代码库存在硬编码假设,且缺乏评测工具。实际部署还需要对相机-IMU 外参、相机内参以及相机与 IMU 时钟之间的时间偏移进行在线标定,而 EKF 不一致性(在不可观测方向上产生虚假信息增益)在理论上早已被充分理解,但在已发布的代码中却很少被处理。

## 方法与架构

- **状态量。** 该滤波器估计当前的惯性状态、$c$ 个历史 IMU 位姿克隆(clone)、$m$ 个地标,以及每个相机的标定参数加一个时间偏移(公式 1–5):
  $$\mathbf{x}_k = \begin{bmatrix} \mathbf{x}_I^\top & \mathbf{x}_C^\top & \mathbf{x}_M^\top & \mathbf{x}_W^\top & {}^Ct_I \end{bmatrix}^\top, \qquad
  \mathbf{x}_I = \begin{bmatrix} {}^{I_k}_G\bar{q}^\top & {}^G\mathbf{p}_{I_k}^\top & {}^G\mathbf{v}_{I_k}^\top & \mathbf{b}_{\omega}^\top & \mathbf{b}_{a}^\top \end{bmatrix}^\top,$$
  其中 $\mathbf{x}_C$ 堆叠了克隆位姿,$\mathbf{x}_M$ 是地标(全局三维、完全逆深度,或锚点表示),$\mathbf{x}_W$ 是每个相机的内参 $\zeta$ 以及 IMU-相机外参。惯性状态量位于 $\mathcal{M} = \mathbb{H} \times \mathbb{R}^{12}$(15 自由度)上,并采用四元数的 boxplus 运算 $\bar q \boxplus \delta\boldsymbol{\theta} \simeq \begin{bmatrix} \tfrac{1}{2}\delta\boldsymbol{\theta} \\ 1 \end{bmatrix} \otimes \bar q$。
- **在流形上进行传播/更新。** IMU 运动学对均值和协方差进行传播,$\mathbf{P}_{k|k-1} = \boldsymbol{\Phi}_{k-1}\mathbf{P}_{k-1|k-1}\boldsymbol{\Phi}_{k-1}^\top + \mathbf{Q}_{k-1}$;克隆位姿、地标和标定状态是静态的,因此其雅可比块保持为单位矩阵(可利用稀疏性)。观测量 $\mathbf{z}_{m,k} = h(\mathbf{x}_k) + \mathbf{n}_{m,k}$ 相对于零均值误差状态进行线性化,并在流形上进行更新:
  $$\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} \boxplus \mathbf{K}_k\big(\mathbf{z}_{m,k} - h(\hat{\mathbf{x}}_{k|k-1})\big), \qquad \mathbf{K}_k = \mathbf{P}_{k|k-1}\mathbf{H}_k^\top\big(\mathbf{H}_k\mathbf{P}_{k|k-1}\mathbf{H}_k^\top + \mathbf{R}_{m,k}\big)^{-1}.$$
  地标更新采用标准的 MSCKF 随机克隆(stochastic-clone)模型,配合嵌套的观测函数,覆盖不同的特征参数化方式和相机模型;首估计雅可比(First-Estimate Jacobians)使滤波器不会在不可观测方向上获得信息增益。
- **在线时空标定。** 关于内参 $\zeta$ 和外参 $\{{}^C_I\mathbf{R}, {}^C\mathbf{p}_I\}$ 的额外雅可比在滤波器内完成标定;相机和 IMU 时钟通过 ${}^It = {}^Ct + {}^Ct_I$ 关联,偏移量 ${}^Ct_I$ 在线估计。
- **基于类型的索引系统。** 每个状态"类型"(其估计值、误差状态大小、协方差索引以及 boxplus 更新方式)在初始化/克隆/边缘化过程中自动管理,因此用户只需针对观测所涉及的变量编写稀疏雅可比。新变量(例如 SLAM 地标)通过对线性化系统进行 QR 分离(吉文斯旋转),分解为依赖新状态的子系统和不依赖新状态的子系统,从而实现最优初始化。
- **研究基础设施。** ov_core(KLT 式稀疏跟踪、三角化、流形数学)、ov_eval(轨迹对齐、ATE/RPE/NEES 工具)、ov_msckf(估计器),以及一个基于 SE(3) B 样条的视觉惯性仿真器,可为任意相机装置生成 IMU 和方位观测数据,并附有完整推导的文档。

## 实验结果

在 20 次蒙特卡洛仿真中(单目相机 10 Hz,IMU 400 Hz,含 ADIS16448 噪声,窗口大小 11,每帧最多 100 条轨迹和 50 个 SLAM 地标,1 像素噪声):启用在线标定后,在*较差*初始标定条件下 ATE 为 0.218°/0.139 m——基本与真实标定条件下获得的 0.212°/0.134 m 相当,且 NEES 保持一致(约为 2);若禁用标定并使用较差的初始猜测,ATE 会暴增至 5.432°/508.7 m,NEES 发散。标定参数能够从较差的初始猜测迅速收敛。在 EuRoC MAV Vicon 室内序列上(每个序列运行 10 次,排除 V2_03),单目 OpenVINS-SLAM 平均达到 **1.445°/0.079 m ATE**——是所比较的单目系统中最好的一个——相比之下 OKVIS 为 1.911°/0.154 m,ROVIO(maplab)为 2.054°/0.140 m,R-VIO 为 1.693°/0.149 m,VINS-Fusion VIO 为 2.926°/0.104 m;双目版本相对于 Basalt、ICE-BA 和 S-MSCKF 同样具有竞争力。

## 对SLAM的意义

OpenVINS 将基于滤波的谱系(MSCKF、FEJ/可观测性约束的 EKF 研究)转变为一个易于获取、文档完善的代码库——成为 VIO 文献中被引用的标准开放 MSCKF,并为多相机、多 IMU 以及 Schmidt 滤波器 SLAM 的后续研究奠定了基础。它使基于 FEJ 的可观测性约束和在线时空标定成为基于 EKF 的 VIO 的预期默认配置,其仿真器和评测工具箱也显著降低了 VIO 研究的入门门槛。如果你想了解生产级基于 EKF 的 VIO 是如何工作的——或者需要为计算资源受限的机器人配备一个轻量级估计器——这就是值得研究的参考系统。

## 相关条目

- [MSCKF](msckf.md)
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md)
- [ROVIO](rovio.md)
- [Observability](observability.md)
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md)
- [IMU noise model](imu-noise-model.md)
