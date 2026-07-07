# DeepTAM

> Zhou 2018 · [论文](https://arxiv.org/abs/1808.01900)

**一句话总结** — DeepTAM(ECCV 2018)是对DTAM的一次学习式重构:一个从粗到细的跟踪网络针对一个合成的关键帧视图估计位姿增量,而一个建图网络则从围绕当前估计的一个窄带内精炼的平面扫描代价体中提取关键帧深度。

## 问题

经典的稠密跟踪与建图(DTAM、LSD-SLAM)依赖光度最小化和手工设计的正则项,这在低纹理场景下十分脆弱,且需要良好的初始化。朴素的学习式替代方案(DeepVO、SfM-Learner、UnDeepVO)在两帧之间回归运动,并继承了其训练集(如KITTI式的平面3自由度运动)的运动统计特性,因此在完整的6自由度跟踪上泛化能力较差。DeepTAM探讨的问题是:能否在保留经过验证的跟踪/建图架构的前提下,让基于关键帧的稠密相机跟踪和深度图估计*完全由学习实现*。

## 方法与架构

**跟踪。** 给定当前图像 $\mathbf{I}^C$ 和一个关键帧 $(\mathbf{I}^K, \mathbf{D}^K)$(图像+逆深度),目标是求出变换 $\mathbf{T}^{KC}$,满足 $\mathbf{T}^{C}=\mathbf{T}^{K}\mathbf{T}^{KC}$,均处于 $\mathbf{SE}(3)$ 中。DeepTAM并不直接回归这个变换,而是在当前位姿猜测 $\mathbf{T}^V$ 处渲染一个*虚拟关键帧* $(\mathbf{I}^V, \mathbf{D}^V)$,只学习一个小的增量

$$\mathbf{T}^{C}=\mathbf{T}^{V}\,\delta\mathbf{T}, \qquad \delta\mathbf{T}=f(\mathbf{I}^{C},\mathbf{I}^{V},\mathbf{D}^{V}),$$

这"极大地简化了学习问题,并缓解了相机运动数据集偏差的问题"。三个编码器-解码器网络以从粗到细的方式在 $80\times 60$、$160\times 120$ 和 $320\times 240$ 分辨率上运行;每个网络针对一个新渲染的虚拟关键帧预测一个增量 $\delta\mathbf{T}_i$,最终位姿是所有增量的乘积。一个辅助的光流分支(仅在训练时激活)迫使编码器学习运动特征。系统并不输出单一位姿,而是由 $N=64$ 个共享权重的全连接分支给出假设 $\delta\boldsymbol{\xi}_i=(\mathbf{r}_i,\mathbf{t}_i)^{\top}$(角轴旋转+平移),再取平均:

$$\delta\boldsymbol{\xi}=\frac{1}{N}\sum_{i=1}^{N=64}\delta\boldsymbol{\xi}_{i}.$$

损失函数 $\mathcal{L}_{\text{tracking}}=\mathcal{L}_{\text{flow}}+\mathcal{L}_{\text{motion}}+\mathcal{L}_{\text{uncertainty}}$ 结合了光流端点误差、加权位姿误差 $\mathcal{L}_{\text{motion}}=\alpha\lVert\mathbf{r}-\mathbf{r}_{\text{gt}}\rVert_2+\lVert\mathbf{t}-\mathbf{t}_{\text{gt}}\rVert_2$,以及关于假设分布(协方差 $\mathbf{\Sigma}$ 由样本估计得出)的一个多元拉普拉斯分布的负对数似然,这促使网络预测出彼此不同的假设。虚拟关键帧同时充当数据增强:围绕真值采样 $\mathbf{T}^V_0$,可以在有偏训练数据(SUN3D、SUNCG)之下模拟出所有6自由度运动。

**建图。** 每个关键帧的深度来自一个平面扫描代价体。对于像素 $\mathbf{x}$ 和深度标签 $d$,光度一致性在 $m$ 帧上累积:

$$\mathbf{C}(\mathbf{x},d)=\sum_{i\in\{1,..,m\}}\rho_{i}(\mathbf{x},d)\cdot w_{i}(\mathbf{x}),$$

其中 $\rho_i$ 是关键帧与变形后图像之间 $3\times 3$ 块的SAD,$w_i$ 是一个匹配置信度权重,当代价曲线具有明确唯一最小值 $d^*$ 时接近1。一个**固定带模块**(在深度范围内均匀分布32个标签,输入为 $\mathbf{I}^K$ +代价体)回归出一个插值因子 $\mathbf{s}_{fb}$,给出 $\mathbf{D}_{fb}=(1-\mathbf{s}_{fb})\cdot d_{min}+\mathbf{s}_{fb}\cdot d_{max}$——一个无尺度输出,有助于泛化。随后一个**窄带模块**进行迭代:它在以前一次估计为中心的逐像素标签 $b_{i}=d_{\text{prev}}+i\cdot\sigma_{\text{nb}}\cdot d_{\text{prev}}$(带宽 $\sigma_{nb}=0.0125$)上重建代价体;一个编码器-解码器将其转化为一个学习到的代价体,由可微的软argmin读出,第二个编码器-解码器对结果进行正则化——这一对模块的作用类似于变分方法中交替的数据项和平滑项。

## 实验结果

- **跟踪(TUM RGB-D基准,平移RMSE,单位米/秒):** 平均0.040,而Kerl等人帧到关键帧的RGB-D SLAM里程计为0.060——尽管DeepTAM仅在关键帧上使用了数据集深度。消融实验:去掉光流任务时为0.050,不使用多假设时为0.043。未在该基准上进行任何训练或微调。
- **跟踪+建图:** 在fr1系列序列上平均为0.086,而CNN-SLAM(不使用位姿图优化运行)为0.253。
- **建图(10帧序列,MVS/SUNCG/SUN3D的测试集划分):** 在所有指标和数据集上均为最佳——例如在MVS上L1-inv为0.036,而DTAM为0.086,DeMoN为0.059;在SUNCG上sc-inv为0.128,而SGM为0.248,DTAM为0.343,DeMoN为0.383。更多帧数有帮助(MVS上使用2帧时L1-inv为0.117,10帧时为0.083),窄带迭代大约在3次后收敛(1次迭代为0.076,3次迭代为0.065)。
- **鲁棒性:** 在逐渐增大的位姿噪声(标准差最高达 $0.6|\boldsymbol{\xi}|$)下,SGM和DTAM迅速退化,而DeepTAM仍能保持场景结构;在未经微调的情况下,对KITTI也表现出定性上的泛化能力。

## 对SLAM的意义

DeepTAM表明,经典的稠密跟踪与建图架构可以顺利过渡到深度学习时代:保留结构(关键帧、代价体、增量式对齐),只学习经典方法处理欠佳的那些组件(鲁棒对齐、深度正则化)。它的增量式对齐思想预示了RAFT和DROID-SLAM的迭代更新算子,使其成为DTAM时代稠密SLAM与当今学习式系统之间一个重要的概念性纽带。

## 相关条目

- [DTAM](../level-03-monocular-slam/dtam.md)
- [DeepV2D](deepv2d.md)
- [DeMoN](demon.md)
- [TANDEM](tandem.md)
- [DVO](../level-04-rgbd-slam/dvo.md)
- [CNN-SLAM](../level-03-monocular-slam/cnn-slam.md)
