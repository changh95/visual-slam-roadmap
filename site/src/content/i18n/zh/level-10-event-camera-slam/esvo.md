# ESVO

> Zhou 2021 · [论文](https://arxiv.org/abs/2007.15548)

**一句话总结** —— ESVO是第一个公开发表的基于事件的*立体*视觉里程计系统:一个完全建立在时间面之上的并行跟踪与建图设计,其中立体时空一致性给出度量意义上的半稠密深度,而位姿则来自将事件与该地图配准——并能在CPU上实时运行。

## 问题

单目事件VO只能恢复带尺度模糊的位姿;而已知基线的立体装置可以在不需要IMU的情况下提供绝对度量深度。但事件相机的立体匹配并非易事:时间上的一致性在像素层面并不严格成立(延迟、抖动、不同的事件触发率),而且事件不携带强度信息可供关联——经典的同步强度patch匹配方法不适用。ESVO致力于在自然场景中、在一般6-DoF运动下,从一个立体事件装置求解VO,其解法既要有原理支撑,又要足够高效以支持在商用硬件上实时运行。

## 方法与架构

一个并行的跟踪与建图系统,其通用"货币"是**时间面**(TS):对于每个像素 $\mathbf{x}$,设 $t_{\text{last}}(\mathbf{x})$ 为该处最近一次事件的时间戳,

$$\mathcal{T}(\mathbf{x},t) \doteq \exp\!\left(-\frac{t - t_{\text{last}}(\mathbf{x})}{\eta}\right),$$

衰减率 $\eta = 30$ ms——这是一张紧凑的2D图,记录近期的边缘运动,以100 Hz刷新。

- **建图——每个事件的逆深度**:对于左相机上位于 $\mathbf{x}$ 处的一个事件,逆深度 $\rho^\star = \arg\min_\rho C$ 最小化时间不一致性 $C \doteq \sum_i r_i^2(\rho)$,其带符号的逐像素残差为 $r_i(\rho) \doteq \mathcal{T}_{\text{left}}(\mathbf{x}_{1,i},t) - \mathcal{T}_{\text{right}}(\mathbf{x}_{2,i},t)$,即深度假设投影到两张时间面上的投影点 $\mathbf{x}_1, \mathbf{x}_2$ 之间的patch差异。这是一种前向投影方式:一个深度假设*本身*就是一个候选立体匹配,因此匹配与三角化在同一步完成。通过高斯-牛顿更新 $\Delta\rho = -(\mathbf{J}^{\top}\mathbf{r})/\|\mathbf{J}\|^{2}$ 求解,并用外极线块匹配初始化。
- **建图——概率融合**:残差在经验上服从学生 $t$ 分布,因此每个估计都带有不确定性 $\rho \sim St(\rho^\star,\, s_r^2/\|\mathbf{J}\|^2,\, \nu_r)$,方差 $\sigma_{\rho^\star}^{2} = \frac{\nu_r}{\nu_r - 2}\frac{s_r^{2}}{\|\mathbf{J}\|^{2}}$;鲁棒IRLS取代了普通最小二乘。来自20次立体观测的估计被传播到同一时刻,并通过学生$t$贝叶斯滤波器融合(若 $\mu_b - 2\sigma_b \leq \mu_a \leq \mu_b + 2\sigma_b$ 则认为假设兼容,否则保留方差较小的一个),得到20 Hz的半稠密逆深度图。
- **跟踪——把TS的负值作为距离场**:"负"时间面 $\bar{\mathcal{T}}(\mathbf{x},t) = 1 - \mathcal{T}(\mathbf{x},t)$ 起到了到当前边缘位置的各向异性距离场的作用。装置位姿即为最小化下式的变形 $\boldsymbol{\theta}^\star$(Cayley旋转加平移):$\sum_{\mathbf{x}\in\mathcal{S}} \bigl(\bar{\mathcal{T}}_{\text{left}}(W(\mathbf{x},\rho;\boldsymbol{\theta}),k)\bigr)^2$,在深度图的支持集 $\mathcal{S}$ 上求解——使用前向合成Lucas-Kanade方法、Huber范数IRLS以及随机LM采样($N_p = 300$个点每次迭代,约5次迭代)。只使用左侧TS(加入右侧会使代价翻倍而精度提升甚微)。

## 实验结果

- **测试设置**:DAVIS240C装置(14.7 cm基线)、DAVIS346无人机数据(MVSEC/upenn,10 cm)、一个模拟器,以及作者自己的DAVIS346装置(7.5 cm基线);C++/ROS,在Intel Core i7-8750H笔记本CPU上实时运行(建图约20 Hz)。
- **建图**:学生$t$ IRLS求解器优于标准最小二乘(在合成三平面数据上平均深度误差2.15 cm对2.76 cm,标准差1.29对2.94 cm,同时融合估计数量增加约52%)。在带有LiDAR真值的序列上,与立体基线GTS、SGM和CopNet比较,ESVO在每一项指标上均最优——例如upenn_flying1:平均误差0.16 m、相对误差3.05%,而GTS为0.31 m / 5.64%,SGM为0.31 m / 5.58%,CopNet为0.59 m / 10.93%。
- **完整VO**:在全部六个序列上均优于基于事件的SGM+ICP基线(例如ATE为13.9 cm对95.8 cm,upenn_flying1);在rpg手持序列上略逊于立体ORB-SLAM2(无全局BA),但在upenn无人机序列上明显更优(ATE为13.9对49.8 cm,以及11.1对50.2 cm),这些序列正是帧相机表现不佳的场景。
- 在作者自己录制的数据上展示了在弱光和HDR条件下的VO效果;软件、装置设计和数据集均已开源(发表于T-RO 2021),使ESVO成为标准的立体事件VO基线。

## 对SLAM的意义

ESVO证明了曾经成就基于帧SLAM成熟发展的立体方案(依靠基线获得度量尺度、不需要IMU)同样可以迁移到事件相机上——但前提是围绕事件的时序特性而不是强度重新思考立体匹配。它的两个关键思想——利用立体时间面间的时空一致性求深度,以及把时间面的负值作为跟踪用的距离场——已成为标准工具。它直接催生了ESVIO,后者在立体事件设计之上加入了紧耦合的IMU与图像融合,而它至今仍是包括DEVO这类学习型方法在内的新系统进行比较的参考基准。

## 相关条目

- [EVO](evo.md)
- [ESVIO](esvio.md)
- [Event representations](event-representations.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
