# EDS

> Hidalgo-Carrió 2022 · [论文](https://rpg.ifi.uzh.ch/docs/CVPR22_Hidalgo.pdf)

**一句话总结** —— EDS(Event-aided Direct Sparse Odometry)是第一个在同一光度框架内融合事件与帧的直接单目VO:通过事件生成模型将事件与关键帧进行跟踪,在快速运动破坏纯帧直接VO的"盲区时段"内保持跟踪不中断。

## 问题

DSO是最精确的基于帧的VO系统之一,得益于在一组稀疏高梯度点上进行的光度光束法平差——但它的跟踪假设连续帧之间有足够的重叠以支持光度对齐。这一假设在快速相机运动、运动模糊和低帧率下会被打破。事件恰好携带了这些空隙中缺失的信号,但它们不能被直接简单地接入:直接法作用于绝对图像强度,而事件编码的是亮度*变化*。EDS提供了两者之间的原理性转换,借助的正是事件生成模型。

## 方法与架构

**事件生成模型(EGM)。** 当对数亮度按对比敏感度 $C$ 发生变化时,一个事件 $e_k = (\mathbf{u}_k, t_k, p_k)$ 就会触发:$\Delta L(\mathbf{u}_k, t_k) = p_k C$。在一个包含 $N_e$ 个事件的窗口内累积极性,得到一张亮度增量图 $\Delta L(\mathbf{u}) = \sum_{t_k \in \mathcal{T}} p_k C\, \delta(\mathbf{u} - \mathbf{u}_k)$(EDS累积的是*高斯加权*的极性 $w_k p_k$,以减少累积模糊),对于较小的 $\Delta t$,可线性化为:

$$\Delta L(\mathbf{u}) \approx -\nabla L(\mathbf{u}) \cdot \mathbf{v}(\mathbf{u})\, \Delta t.$$

**前端(跟踪)。** 一个关键帧持有一张亮度帧 $\hat{L}$ 和一张半稠密逆深度图。图像点的速度纯粹是几何性的,$\mathbf{v}(\mathbf{u}) = \mathrm{J}(\mathbf{u}, d_{\mathbf{u}})\, \dot{\mathrm{T}}$,其中 $\mathrm{J}$ 是像素 $\mathbf{u}$(深度为 $d_{\mathbf{u}}$)的 $2\times 6$ 特征敏感度矩阵,$\dot{\mathrm{T}} = (\mathbf{V}^\top, \boldsymbol{\omega}^\top)^\top$ 是相机的线速度/角速度。这样就可以从帧中预测出亮度变化 $\Delta \hat{L}(\mathbf{u}) \approx -\nabla \hat{L}(\mathbf{u}) \cdot \mathrm{J}(\mathbf{u}, d_{\mathbf{u}})\, \dot{\mathrm{T}}\, \Delta t$。相机跟踪在Huber范数 $\gamma$ 下通过匹配归一化增量,联合优化6-DOF位姿增量和速度:

$$(\delta \mathrm{T}^{\ast}, \dot{\mathrm{T}}^{\ast}) = \arg\min_{\delta \mathrm{T}, \dot{\mathrm{T}}} \left\| \frac{\Delta \hat{L}}{\|\Delta \hat{L}\|_2} - \frac{\Delta L}{\|\Delta L\|_2} \right\|_{\gamma},$$

只在选定的高梯度轮廓像素处评估(通过分块方案,例如11×11分块,保持10–15%的像素分布均匀),事件增量通过投影 $\mathbf{u}_e = \pi\big(T_{e,f}\, \pi^{-1}(\mathbf{u}_f, d_{\mathbf{u}_f})\big)$ 转移到关键帧上。归一化会抵消未知的对比度 $C$。当20–30%的点离开视场或相对旋转超过阈值时,会生成新的关键帧;深度通过k-d树最近邻填充的方式传播到新的关键帧。

**后端。** 在7个关键帧的滑动窗口上进行光度光束法平差(2000–8000个点,8像素残差patch,Huber范数,Ceres),精化位姿和逆深度,再反馈给前端——该设计足够模块化,可以直接换用DSO的PBA。初始化使用经典多视图几何、学习型单目深度,或DSO在帧上的粗初始化器。

## 实验结果

- **Stereo DAVIS 240C数据集**(bin、boxes、desk、monitor;动作捕捉真值):EDS的ATE为1.1 / 2.1 / 1.5 / 1.0 cm——优于*立体*事件方法ESVO(2.8 / 5.8 / 3.2 / 3.3 cm)、事件+帧+IMU的USLAM(7.7 / 9.5 / 9.8 / 6.5 cm)以及EVO(13.2 / 14.2 / 5.2 / 7.8 cm,在两个序列上提前失败),而EDS本身是单目且不依赖IMU的。旋转误差:0.99 / 1.83 / 1.87 / 0.60度。
- 相较基于帧的基线,EDS在平移上一贯优于单目ORB-SLAM,与DSO相近(在快速的desk序列上更精确,1.5 cm对10.0 cm),只比立体ORB-SLAM稍差一点。
- **低帧率研究**:随着帧率下降,EDS的误差几乎保持不变,而DSO的误差急剧增长(DSO的恢复跟踪在10 FPS以下失效);EDS在没有回环检测的情况下也优于ORB-SLAM——事件在相距较远的帧之间维持了跟踪。
- **敏感性**:跟踪对深度噪声退化平稳,但当对比度阈值噪声超过 $\sigma_C > 0.15$ 时会突然失效。
- 该工作还引入了一个新的分束器装置的事件+帧数据集(EDS数据集),用于评估混合系统。

## 对SLAM的意义

EDS是"事件作为增强手段"这一理念在直接法上的对应实现:EKLT在特征跟踪层面增强,Ultimate-SLAM在基于特征的VIO后端层面增强,而EDS展示了同样的互补性在光度、直接法里程计上同样成立。它证明了一个成熟的基于帧的系统可以通过有针对性的改动而不是彻底重新设计来吸纳事件——为在现有直接法SLAM流水线上改装事件鲁棒性提供了一个蓝本。

## 相关条目

- [DSO](../level-03-monocular-slam/dso.md)
- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)
- [Event representations](event-representations.md)
