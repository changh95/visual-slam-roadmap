# VI-DSO

> von Stumberg 2018 · [论文](https://arxiv.org/abs/1804.05625)

**一句话总结** — VI-DSO 将预积分的 IMU 因子紧耦合地整合进 DSO 的直接稀疏光度光束法平差中,显式地优化度量尺度和重力方向,使系统能够以任意尺度立即初始化——并通过一种新颖的"动态边缘化"方案保持一致性。

## 问题

单目直接法里程计(DSO)能提供出色的精度,但只能达到未知尺度。IMU 使尺度变得可观测——但通常*并非立即*可观测:对于某些运动(例如匀速运动下的零加速度),立即初始化是不可能的,这正是 VI ORB-SLAM 在 EuRoC 上初始化前要等待 15 秒相机运动的原因。同时,滑动窗口估计器通过部分边缘化来限制计算量,而如果尺度估计后来大幅偏离了先验被线性化时所处的取值,线性化后的先验就会变得不一致。VI-DSO 同时解决了这两个问题。

## 方法与架构

两个组件并行运行:**粗略跟踪**通过对最新关键帧进行直接图像对齐(几何和尺度固定)外加一个惯性项来估计每一帧的位姿,而每当创建一个新关键帧时,**视觉惯性光束法平差**通过最小化如下组合能量,重新估计所有活跃关键帧的几何和位姿

$$E_{\text{total}} = \lambda \cdot E_{\text{photo}} + E_{\text{inertial}}$$

光度项是 DSO 中,对于寄宿在关键帧 $i$ 中、在帧 $j$ 中被观测到的一个点 $\boldsymbol{p}$ 的误差:

$$E_{\boldsymbol{p}j} = \sum_{\mathbf{p}\in\mathcal{N}_{\boldsymbol{p}}} \omega_{\boldsymbol{p}} \left\lVert (I_j[\boldsymbol{p}'] - b_j) - \frac{t_j e^{a_j}}{t_i e^{a_i}} (I_i[\boldsymbol{p}] - b_i) \right\rVert_{\gamma}$$

其中 $\mathcal{N}_{\boldsymbol{p}}$ 是一个小的像素邻域,$t_i, t_j$ 是曝光时间,$a_i, b_i, a_j, b_j$ 是仿射光照参数,$\omega_{\boldsymbol{p}}$ 是与梯度相关的权重,$\gamma$ 是 Huber 范数——因此*任何*具有足够大强度梯度的像素都可以被跟踪,而不仅仅是角点。连续关键帧之间的 IMU 观测被预积分为单一因子:给定预测状态 $\widehat{\boldsymbol{s}}_j$ 和协方差 $\widehat{\boldsymbol{\Sigma}}_{s,j}$,

$$E_{\text{inertial}}(\boldsymbol{s}_i, \boldsymbol{s}_j) = \left(\boldsymbol{s}_j \boxminus \widehat{\boldsymbol{s}}_j\right)^{T} \widehat{\boldsymbol{\Sigma}}_{s,j}^{-1} \left(\boldsymbol{s}_j \boxminus \widehat{\boldsymbol{s}}_j\right)$$

每个关键帧的状态量堆叠了位姿、速度、IMU 偏置、仿射亮度参数以及其寄宿点的逆深度,

$$\boldsymbol{s}_i = \big[(\boldsymbol{\xi}^{D}_{cam_i\_w})^{T},\ \boldsymbol{v}_i^{T},\ \boldsymbol{b}_i^{T},\ a_i,\ b_i,\ d_i^{1}, \dots, d_i^{m}\big]^{T}$$

完整状态还额外包含相机内参和 $\boldsymbol{\xi}_{m\_d} \in \mathfrak{sim}(3)$,这是一个无平移的 SIM(3) 变换,连接无尺度/无重力的"DSO 坐标系"与度量坐标系。光度误差在 DSO 坐标系(与尺度无关)中评估,惯性误差在度量坐标系中评估——因此**尺度和重力方向是显式变量**,与其他一切一起通过高斯-牛顿法联合优化,其中 $\mathbf{H} = \mathbf{H}_{\text{photo}} + \mathbf{H}_{\text{imu}}$,惯性块通过一个相对雅可比 $\mathbf{J}_{\text{rel}}$ 在两种状态表示之间映射。连续关键帧之间的间隔保持在 0.5 秒以下,以保证预积分的精度。

**初始化** — 使用 DSO 的视觉初始化器(平均深度归一化为 1),重力方向通过平均最多 40 个加速度计观测得到,速度和偏置初始化为零,尺度初始化为 1.0;之后所有这些都被联合优化,因此惯性数据从最初几帧起就能改善位姿估计。

**动态边缘化** — 通过舒尔补(配合首估计雅可比)边缘化旧的关键帧会冻结线性化点,而在尺度仍在收敛的过程中这样做是不安全的。因此 VI-DSO 维护了三个边缘化先验:$M_{\text{visual}}$(仅包含与尺度无关的视觉因子)、$M_{\text{curr}}$(自尺度线性化点以来的所有因子;用于优化)以及 $M_{\text{half}}$(仅包含尺度接近当前估计值的近期状态),并施加约束

$$\forall i \in M_{\text{curr}}:\ s_i \in \left[\, s_{\text{middle}}/d_i,\ s_{\text{middle}} \cdot d_i \,\right]$$

每当尺度估计超出该区间边界,先验就会级联更新($M_{\text{curr}} \leftarrow M_{\text{half}}$,$M_{\text{half}} \leftarrow M_{\text{visual}}$),区间中心 $s_{\text{middle}}$ 也随之移动——因此优化过程始终保留*一定量*具有一致尺度的惯性历史,区间大小 $d_i$ 会动态调整($d_{\text{min}} = \sqrt{1.1}$)。

## 实验结果

在 EuRoC 上(左相机,每个序列运行 10 次,取 RMSE 中值,实时运行):MH1–MH5 上为 0.062 / 0.044 / 0.117 / 0.132 / 0.121 m,V11–V23 上为 0.059 / 0.067 / 0.096 / 0.040 / 0.062 / 0.174 m——每个序列都低于 0.23 m,是除 ROVIO 之外唯一一个在所有序列上都没有失败的评测方法。VI-DSO 在每个序列上都超过了单目 VI 里程计(Leutenegger 等),甚至在 11 个序列中的 9 个上超过了双目/SLAM 变体(Kasyanov 等)。与 VI ORB-SLAM(一个完整的 SLAM 系统,基于其经过光束法平差的关键帧轨迹进行评测)相比,VI-DSO 在没有任何回环检测的情况下 RMSE 具有竞争力,且更加鲁棒——ORB-SLAM 在 V1_03_difficult 上初始化失败。尺度估计也更好:平均尺度误差为 0.7% 对比 1.0%,最大误差为 1.2% 对比 3.4%。纯视觉的 DSO 完全无法处理 V1_03/V2_03;ROVIO 鲁棒,但作为一个滤波器,精度远逊于 VI-DSO。

## 对SLAM的意义

VI-DSO 证明了视觉惯性融合并非基于特征流水线的专利:直接光度光束法平差同样可以容纳 IMU 因子,并达到与成熟的基于特征的 VIO 相当的 EuRoC 精度。它是 DSO 谱系(DSO → Stereo DSO / LDSO → VI-DSO → DM-VIO)中的关键一环:在窗口内联合估计尺度和重力已成为视觉惯性初始化的常见范式,而动态边缘化正是 DM-VIO 延迟边缘化的直接前身。

## 相关条目

- [DSO](../level-03-monocular-slam/dso.md)
- [DM-VIO](dm-vio.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [IMU preintegration](imu-preintegration.md)
- [VINS-Mono](vins-mono.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
