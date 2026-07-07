# DVO

> Kerl 2013 · [项目主页](https://vision.in.tum.de/data/software/dvo)

**一句话总结** —— 一种直接(无特征)RGB-D里程计方法,在稳健的t分布误差模型下联合最小化所有像素上的光度残差和深度残差,并通过基于熵的关键帧选择和位姿图回环检测扩展为DVO-SLAM。

## 问题

基于特征的RGB-D里程计将图像简化为稀疏关键点,丢弃了大部分图像信息,这在纹理稀少的室内场景中会陷入困境。直接方法可以利用每一个像素,但稠密残差会被外点污染——遮挡、反射、动态物体、传感器噪声——作者发现高斯噪声假设与真实残差直方图的拟合效果很差,使得外点会使估计产生偏差。逐帧对齐本身也天生会累积漂移。当时缺失的是一个用于稳健稠密RGB-D对齐的、有原则的概率化表述,再加上一种轻量级的方式来选择关键帧并验证回环检测,从而能优化掉漂移。

## 方法与架构

"DVO"由两篇论文组成:ICRA 2013的稳健里程计论文(光度项、t分布、运动先验)和IROS 2013的稠密视觉SLAM论文(增加深度项、关键帧、回环检测、g2o位姿图)。

- **变形(Warping)**:一个带深度$\mathcal{Z}_1(\mathbf{x})$的像素$\mathbf{x}$通过逆投影$\pi^{-1}$被重建,经刚体运动$\boldsymbol{T} = \exp(\hat{\boldsymbol{\xi}})$(旋量$\boldsymbol{\xi}\in\mathbb{R}^6$)变换,再重投影:$\mathbf{x}' = \tau(\mathbf{x},\boldsymbol{T}) = \pi\big(\boldsymbol{T}\,\pi^{-1}(\mathbf{x}, \mathcal{Z}_1(\mathbf{x}))\big)$。
- **光度+深度残差**:每个像素贡献一个堆叠残差$\mathbf{r} = (r_{\mathcal{I}}, r_{\mathcal{Z}})^\top$,其中

$$r_{\mathcal{I}} = \mathcal{I}_2\big(\tau(\mathbf{x},\boldsymbol{T})\big) - \mathcal{I}_1(\mathbf{x}), \qquad r_{\mathcal{Z}} = \mathcal{Z}_2\big(\tau(\mathbf{x},\boldsymbol{T})\big) - \big[\boldsymbol{T}\,\pi^{-1}(\mathbf{x},\mathcal{Z}_1(\mathbf{x}))\big]_Z ,$$

  其中$[\cdot]_Z$表示Z分量;深度误差等价于带投影查找的点到平面ICP。与早期工作用手动调节的权重线性组合两个误差不同,这里将它们联合建模。
- **概率化稳健估计**:MAP估计$\boldsymbol{\xi}^* = \arg\max_{\boldsymbol{\xi}} p(\boldsymbol{\xi} \mid \mathbf{r})$,其中双变量残差服从t分布$p_t(\mathbf{0}, \boldsymbol{\Sigma}, \nu)$——一个具有覆盖外点的重尾特性的无穷高斯混合分布。这引出了迭代重加权最小二乘:

$$\boldsymbol{\xi}^* = \arg\min_{\boldsymbol{\xi}} \sum_{i}^{n} w_i\, \mathbf{r}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i, \qquad w_i = \frac{\nu+1}{\nu + \mathbf{r}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i},$$

  自由度取$\nu = 5$,尺度矩阵$\boldsymbol{\Sigma}$在每次迭代中通过期望最大化重新估计——无需手动调节稳健核阈值。高斯-牛顿正规方程$\sum_i w_i \boldsymbol{J}_i^\top \boldsymbol{\Sigma}^{-1} \boldsymbol{J}_i\, \Delta\boldsymbol{\xi} = -\sum_i w_i \boldsymbol{J}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i$(2×6雅可比矩阵$\boldsymbol{J}_i$)在图像金字塔上以粗到细的方式求解。可以加入匀速运动先验,将更新式变为$(J^\top W J + \Sigma^{-1})\Delta\boldsymbol{\xi} = -J^\top W \mathbf{r}(\mathbf{0}) + \Sigma^{-1}(\boldsymbol{\xi}_{t-1} - \boldsymbol{\xi}_t^{(k)})$。
- **基于熵的关键帧和回环检测(DVO-SLAM)**:近似Hessian矩阵$\boldsymbol{A}$给出位姿协方差$\boldsymbol{\Sigma}_{\boldsymbol{\xi}} = \boldsymbol{A}^{-1}$,其熵为$H(\boldsymbol{\xi}) \propto \ln \lvert\boldsymbol{\Sigma}_{\boldsymbol{\xi}}\rvert$。各帧与当前关键帧匹配,直到熵比

$$\alpha = \frac{H(\boldsymbol{\xi}_{k:k+j})}{H(\boldsymbol{\xi}_{k:k+1})}$$

  低于阈值,此时插入一个新的关键帧。回环检测候选通过在每个关键帧周围的球形区域内进行度量最近邻搜索来发现,先在粗分辨率下测试,再用相同的熵比测试进行验证;经验证的约束进入关键帧位姿图,用g2o优化,并在结束时对所有关键帧重新搜索一次。

## 实验结果

在TUM RGB-D基准上(ICRA论文,漂移以平移RPE的RMSE衡量):在fr1/desk上,t分布加权将漂移降低至0.0458 m/s,而未加权为0.0551;在四个"desk"序列上取平均,t分布+时间先验达到0.0428 m/s——相对参考方法(0.2425 m/s)提升了82.35%——在fr3的"sitting"动态物体序列上则为0.0316 m/s。运行速度在单个CPU核心上达到实时(30 Hz),加权变体每帧约50毫秒。对于完整的DVO-SLAM(IROS论文,freiburg1数据集):仅关键帧跟踪就能平均降低16%的漂移,位姿图优化再降低20%;绝对轨迹误差从0.19米(逐帧)降至0.07米。系统间比较(ATE RMSE平均值):DVO-SLAM达到0.034米,而RGB-D SLAM为0.054米、MRSMap为0.043米、KinFu为0.297米,例如fr1/desk为0.021米,fr1/xyz为0.011米。逐关键帧跟踪耗时约32毫秒(Intel i7-2600);平均地图更新耗时135毫秒。

## 对SLAM的意义

DVO确立了直接RGB-D里程计作为基于特征方法的一个可靠替代方案,它也依然是学习直接对齐机制——变形、堆叠残差、稳健权重、粗到细的IRLS——的最清晰论文,是理解更复杂稠密系统的先修课。其t分布加权和基于熵的关键帧/回环检测标准成为标准要素;现代SLAM中的直接法半边(LSD-SLAM、DSO,以及神经SLAM内部的稠密跟踪器)都可以看作这一主题的变体。

## 相关条目

- [RGBD-SLAM-V2](rgbd-slam-v2.md) —— 与其同期、被其超越的基于特征的RGB-D方法
- [KinectFusion](kinectfusion.md) —— 基于ICP的针对体素模型的稠密跟踪
- [ICP](icp.md) —— DVO深度残差的纯几何祖先
- [MRS-Map](mrs-map.md) —— 同一基准中作为比较对象的基于面元统计的配准方法
- [LSD-SLAM](../level-03-monocular-slam/lsd-slam.md) —— 将直接对齐延伸到单目半稠密SLAM
- [DSO](../level-03-monocular-slam/dso.md) —— 采用了稳健直接对齐的稀疏直接法里程计
