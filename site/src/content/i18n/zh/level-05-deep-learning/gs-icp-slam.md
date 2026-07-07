# GS-ICP SLAM

> Ha 2024 · [论文](https://arxiv.org/abs/2403.12550)

**一句话总结** —— "RGBD GS-ICP SLAM" 通过跟踪和建图共享的公共因子——高斯分布(均值+协方差)——将广义ICP(Generalized ICP)跟踪与3DGS建图融合在一起,使协方差在跟踪与建图之间双向流动,整个系统速度最高可达107 FPS。

## 问题

早期的3DGS SLAM系统(SplaTAM、MonoGS、GS-SLAM)通过渲染高斯地图并最小化稠密光度误差来跟踪相机——每帧需要数十次光栅化(rasterisation)——因此跟踪速度较慢;而解耦式系统(Photo-SLAM、Orbeez-SLAM、vMAP)则将ORB-SLAM前端嫁接到神经地图上,需要"包含用于跟踪的ORB特征信息的独立地图",其计算结果从未被建图复用。GS-ICP SLAM的观察是:一个3D高斯本身*就是*一个概率分布,而G-ICP配准恰好需要均值与协方差——因此"G-ICP与3DGS可以共享同一个高斯世界"。

## 方法与架构

场景由一组高斯 $\boldsymbol{G}=\{\boldsymbol{\mathcal{X}},\boldsymbol{\mathcal{C}}\}$ 表示(3D点加协方差,以及用于渲染的颜色和不透明度集合 $\boldsymbol{H},\boldsymbol{O}$)。每一帧:对深度图像进行下采样并反投影得到源高斯,用G-ICP相对地图进行跟踪,并(对关键帧而言)将源高斯插入为新的地图基元,同时由一个并行的建图线程通过光栅化对其进行优化。

- **G-ICP跟踪**:利用最近邻搜索得到的对应关系 $\boldsymbol{x}^s_i \leftrightarrow \boldsymbol{x}^t_i$ 及残差 $d_i=\boldsymbol{x}^t_i-\mathbf{T}\boldsymbol{x}^s_i$,每个点都是一个高斯随机变量,因此 $d_i\sim\mathcal{N}(0,\,C^t_i+\mathbf{T}C^s_i\mathbf{T}^\top)$,最大似然估计给出分布到分布(马氏距离,Mahalanobis)的目标函数

$$\mathbf{T}^{*}=\operatorname*{argmin}_{\mathbf{T}}\sum_i^N d_i^{\top}\left(C_i^{t}+\mathbf{T}C_i^{s}\mathbf{T}^{\top}\right)^{-1}d_i ,$$

  即按两个分布的联合不确定度加权的配准。跟踪过程中完全不渲染图像。
- **协方差共享**:G-ICP过程中为当前帧计算的协方差,直接成为新插入地图高斯的初始协方差,而地图中已优化的高斯又直接作为G-ICP的目标——无需重新计算,也不需要致密化(densification)或不透明度重置。
- **椭球尺度正则化(跟踪)**:通过SVD将 $C=\boldsymbol{R}\boldsymbol{\Lambda}^{2}\boldsymbol{R}^{\top}$ 分解,不同于经典的强制平面化 $\boldsymbol{S}=[1,1,\epsilon]^{\top}$,尺度被归一化为 $\boldsymbol{\Lambda}'=\frac{1}{median(\boldsymbol{S})}\,diag(s_2,s_1,s_0)$,从而保留每个地图高斯已优化的形状(直线、角点),而不是将一切压平为平面。
- **尺度对齐(建图)**:传感器点云随距离增大而变得更稀疏,因此距相机较远处的kNN协方差会偏大;新关键帧高斯在插入前按 $\boldsymbol{\Lambda}''=\frac{1}{z^{p}}\boldsymbol{\Lambda}'$ 归一化(取 $p=1.5$ 效果最佳)。
- **建图损失**:高斯的位置、协方差、颜色、不透明度通过 $\lambda_{I_1}\mathcal{L}_1(I,I_{gt})+\lambda_{I_2}\mathcal{L}_{D\text{-}SSIM}(I,I_{gt})+\lambda_{D}\mathcal{L}_1(D,D_{gt})$ 进行优化,每次迭代随机采样一个历史关键帧以避免视角局部最优,并对退化高斯进行剪枝。
- **两级关键帧**:跟踪关键帧根据G-ICP对应关系的比例来选取(这是跟踪过程的免费副产品);额外的*仅用于建图*的关键帧用于稠密化训练视角,而不会将扫描匹配误差反馈进跟踪环节。

## 实验结果

在Ryzen 7 7800X3D + RTX 4090上,RGB-D输入:

- **Replica ATE RMSE**:8个场景平均0.16厘米——在每个场景中均为最佳,不到此前最好成绩(SplaTAM 0.36、GS-SLAM 0.50、Point-SLAM 0.54厘米)的一半。
- **Replica地图质量/速度**:在跟踪限制为30 FPS时,PSNR 38.83 dB / SSIM 0.975 / LPIPS 0.041(所有场景中的最佳成绩;SplaTAM为33.89,Point-SLAM为35.62 dB)。不限速时整个系统平均达到98.11 FPS,峰值107.06 FPS(office1场景),此时仍为35.93 dB——而SplaTAM仅为0.23 FPS,Point-SLAM为0.30 FPS。
- **TUM RGB-D**:ATE平均2.4厘米,在耦合式系统中最佳(SplaTAM 3.2、GS-SLAM 3.7、NICE-SLAM 4.0);解耦式的ORB-SLAM3/Photo-SLAM可达1.3厘米,但需要单独的特征地图。系统在不限速时达到73.92 FPS,PSNR比SplaTAM低约11.7%——速度却是其约92倍(30 FPS模式)至227倍。
- **消融实验**:在TUM上比较椭球正则化、平面正则化与不做尺度正则化:ATE分别为2.37、29.12、236.54厘米;使用G-ICP协方差并配合 $z^{1.5}$ 尺度对齐,可将Replica的结果从8.89厘米ATE / 24.81 dB(原始kNN初始化)提升到0.157厘米 / 38.83 dB。

## 对SLAM的意义

GS-ICP SLAM表明,经典的几何配准方法与现代可微渲染可以共享同一套数据结构:用几何做跟踪,用外观做建图,一个概率化的高斯世界同时服务于两者。从概念上讲,它把3DGS浪潮与数十年来基于ICP的RGB-D SLAM(KinectFusion一脉)重新连接起来——而且由于跟踪过程从不渲染,它天然对困扰光度跟踪器的曝光变化具有鲁棒性。对实践者而言,它仍是证明稠密逼真SLAM不必以速度为代价的首选范例。

## 相关条目

- [SplaTAM](splatam.md)
- [MonoGS](monogs.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [RTG-SLAM](rtg-slam.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
