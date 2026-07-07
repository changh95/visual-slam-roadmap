# ACE-SLAM

> Alzugaray 2025 · [论文](https://arxiv.org/abs/2512.14032)

**一句话总结** — 第一个以场景坐标回归作为核心地图表示的神经隐式RGB-D SLAM系统,以网络权重本身充当地图,实现了严格意义上的实时运行。

## 问题

iMAP/NICE-SLAM这一路线的神经隐式SLAM系统表明,一个网络可以充当稠密地图,但它们基于渲染的跟踪与建图需要沿相机射线进行代价高昂的体积积分,因此无法满足严格的实时预算,还需要额外的机制(解耦的前端、光束法平差、回环检测模块、针对动态物体的语义掩码)。与此同时,场景坐标回归(SCR)已经发展成熟(DSAC → ACE → ACE Zero),成为一种高效、低内存、保护隐私的隐式表示,重定位速度极快——但一直只是一种*离线*建图工具。悬而未决的问题是:SCR能否在一个实时SLAM闭环内*在线*训练,作为跟踪、建图与重定位的统一表示?

## 方法与架构

**以SCR作为地图。** 每一帧RGB-D图像$\{\mathcal{I}^t, \mathcal{D}^t\}$被送入一个冻结的特征提取器,得到$M$个特征$\{(\mathbf{f}_i^t, \mathbf{x}_i^t, d_i^t)\}$(描述子、二维关键点、深度);关键点通过$\mathbf{y}_i^t = \boldsymbol{\pi}^{-1}_{\mathbf{K}}(\mathbf{x}_i^t, d_i^t)$反投影为局部三维坐标。地图$\mathcal{M}$是一个小型的场景特定网络,直接对每个特征回归出全局坐标$\tilde{\mathbf{y}}_i = \mathcal{M}(\mathbf{f}_i) \in \mathbb{R}^3$——完全并行,无需沿射线采样。SLAM即为在逐像素残差上对位姿与地图进行联合自监督优化:

$$r_i^t(\mathcal{M}, \mathbf{P}^t) = \lVert \mathcal{M}(\mathbf{f}_i^t) - \mathbf{P}^t \mathbf{y}_i^t \rVert^2, \qquad \{\mathcal{M}^\ast, \mathbf{P}^\ast\} = \arg\min_{\mathcal{M}, \mathbf{P}} \sum_{\mathbf{P}^t \in \mathcal{P}} \sum_i r_i^t(\mathcal{M}, \mathbf{P}^t),$$

不需要任何真实标签的监督,也没有显式的特征匹配——各帧仅通过共享的隐式地图相互作用,从而涌现出隐式的匹配关系以及*软回环检测*。

**TriMLP头。** 与ACE直接回归的MLP(HomMLP)不同,这里用一个紧凑的MLP在三个正交平面上预测离散化网格上的分类逻辑值,$C_i^{XY}, C_i^{XZ}, C_i^{YZ} = \mathrm{softmax}(\mathrm{MLP}(\mathbf{f}_i))$;每个平面通过对其基准网格进行加权平均来对坐标进行投票,例如$(\tilde{x}_i^{XZ}, \tilde{z}_i^{XZ}) = \sum B^{XZ} \odot C_i^{XZ}$,而最终坐标则是跨平面对兼容分量取平均得到(即$\tilde{x}_i = \tfrac{1}{2}(\tilde{x}_i^{XY} + \tilde{x}_i^{XZ})$,依此类推)。这种投票机制为特征提供了通向同一三维点的多条有效路径,这种归纳偏置有助于加速在线适应。

**跟踪即重定位。** 每一帧的位姿通过对预测坐标与观测坐标进行刚性配准来估计,$\mathbf{P}^t = \arg\min_{\mathbf{P}} \sum_i \lVert \tilde{\mathbf{y}}_i^t - \mathbf{P}\mathbf{y}_i^t \rVert^2$,在RANSAC框架内对采样的三元组以闭式解法(Kabsch–Umeyama)求解(最多$H$个假设)。获胜假设的内点比例$\lambda^t$同时充当质量信号;无需任何位姿先验,因此跟踪丢失后的重定位、跳帧以及对动态物体的鲁棒性都是自然获得的。

**PTAM风格的闭环。** 优化循环在一个窗口$\mathcal{W}$上交替进行位姿估计与建图:最新的$W_L$个关键帧、最新一帧,以及以概率$p^t \propto \tfrac{1}{|\mathcal{P}|} + \alpha(1 - \lambda^t)$采样出的至多$W_G$个关键帧——偏向于选择配准较差的帧(即软回环检测)。特征采样也采用同样的偏置方式,而建图则是在每个循环内对残差损失进行少量SGD小批量迭代,因此每个循环的计算量恒定。默认使用1/8分辨率的稠密ACE编码器特征(也支持稀疏的SuperPoint特征);特征提取器始终保持冻结。

## 实验结果

所有实验均在RTX 4090 + i7-12700K上进行,结果为3次运行的平均值;若处理耗时超过一个帧间隔,则会*跳过*该帧,以真实模拟实时视频流。

- **效率**(Replica,默认配置):ACE-SLAM运行速度为29.71等效FPS = 99.0%实时因子,地图大小1.11 MB,而ESLAM为7.35 FPS / 24.5% / 45.46 MB,NICE-SLAM为0.33 FPS / 1.1% / 95.86 MB,Point-SLAM为0.27 FPS / 0.9% / 27.23 MB,iMAP*为0.15 FPS / 0.5%——最多快出两个数量级。端到端定位一帧新图像耗时11毫秒(ACE特征)或13毫秒(SuperPoint)。
- **静态场景ATE RMSE**:与iMAP*相当,并接近NICE-SLAM,例如Replica room-0为0.027米(NICE-SLAM为0.017,iMAP*为0.031),TUM fr2/xyz为0.016米,fr1/desk为0.083米——在精度上落后于最新的基于渲染的方法,但是唯一能以严格实时运行的系统。TriMLP明显优于HomMLP(例如ScanNet 0000:0.164对比0.364米;0106:0.319对比0.765米)。
- **动态场景TUM-RGBD**,*不使用*任何语义先验:fr3/w/xyz为0.072米,而NICE-SLAM为0.302,基于语义的NID-SLAM为0.071;fr3/s/static为0.007米——与专门的动态SLAM方案相当甚至更优,因为始终开启的RANSAC重定位天然地会剔除运动区域。

## 对SLAM的意义

ACE-SLAM表明,经由DSAC、ACE与ACE Zero逐步发展成熟、原本仅作为离线重定位技术的场景坐标回归,能够在一个实时SLAM闭环中充当跟踪、建图、重定位以及(软)回环检测的*统一*表示,其地图规模仅为兆字节量级且能保护隐私。它清晰地展示了以重定位为核心的SLAM设计理念,是对基于渲染的神经隐式SLAM的一种严格实时的对照方案,也是(截至目前)ACE这一脉络发展的自然终点。

## 相关条目

- [ACE](ace.md)
- [ACE Zero](ace-zero.md)
- [iMAP](../level-03-monocular-slam/imap.md)
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md)
- [ACE-G](ace-g.md)
- [SuperPoint](superpoint.md)
