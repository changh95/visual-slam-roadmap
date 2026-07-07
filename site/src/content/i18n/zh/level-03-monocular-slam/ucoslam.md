# UcoSLAM

> Muñoz-Salinas 2019 · [论文](https://arxiv.org/abs/1902.03729)

**一句话总结** —— 在同一个 SLAM 框架中将自然特征点与方形平面基准标记(ArUco)融合起来,将标记所具备的可靠性与度量尺度和自然特征所提供的覆盖范围结合在一起。

## 问题

大多数 SLAM 系统使用诸如特征点之类的自然路标,但这些路标"随时间不稳定、在许多情况下具有重复性,或者不足以支持鲁棒的跟踪(例如在室内建筑中)",而基于词袋(BoW)的重定位在视角变化和重复模式下的表现也有限。仅基于标记的 SLAM(作者早期的 SPM-SLAM)能提供无歧义的数据关联和正确的度量尺度,但每张图像中至少需要看到两个标记,因此无法扩展到大型环境。UcoSLAM 在单一地图中整合了这两种路标类型:一旦看到一个标记,尺度即被固定;标记只需放置在策略性位置,而特征点则在其他地方提供覆盖。

## 方法与架构

地图为 $\mathcal{W}=\{\mathcal{K},\mathcal{P},\mathcal{M},\mathcal{G},\mathcal{D}\}$:关键帧 $\mathcal{K}$、三角化的地图点 $\mathcal{P}$、标记 $\mathcal{M}$(每个标记都有边长 $s$、位姿 $\mathrm{M}\in\mathbb{SE}(3)$ 以及四个已知角点)、共视图 $\mathcal{G}$(共享一个点会为一条边增加权重 1,共享一个标记则增加 4)以及一个 FBoW 关键帧数据库 $\mathcal{D}$。整体流水线是经典的 ORB-SLAM 风格循环——初始化、跟踪、关键帧插入、局部/全局优化、回环检测、重定位——外加一个并行运行的地图管理线程,以及用于部署的地图保存/加载功能。

- **初始化**并行运行基于特征点的初始化(单应矩阵与本质矩阵对比,与 ORB-SLAM2 相同)和基于标记的初始化(SPM-SLAM);标记胜出平局,从而立即获得度量尺度,而标记位姿歧义(远距离平面标记的两种几乎相同的重投影)通过多视角来解决。
- **跟踪**联合最小化点和标记角点的重投影误差。以重投影误差 $e(\mathrm{T},\mathbf{x},\delta,\mathbf{u})=\Psi(\mathrm{T},\mathbf{x},\delta)-\mathbf{u}$(投影函数 $\Psi$,相机内参 $\delta$)为基础,帧位姿为

$$\mathbf{f}_{\mathrm{T}}=\arg\min_{\mathrm{T}}\left(\mathbf{w_p^f}\,H(\Upsilon_p^{\mathbf{f}},\mathrm{T})+\mathbf{w_m^f}\,H(\Upsilon_m^{\mathbf{f}},\mathrm{T})\right),$$

  其中 $H(\Upsilon_p^{\mathbf{f}},\mathrm{T})$ 是经 Huber 鲁棒化处理的点重投影误差之和(由 $\Omega_{\mathbf{g}}=\eta^{-\mathbf{g}_l}\mathrm{I}$ 加权,对来自较粗金字塔层级的特征点降权),而 $H(\Upsilon_m^{\mathbf{f}},\mathrm{T})$ 则对每个有效标记的四个角点的平方重投影误差求和。由于点的数量远远多于标记,两者的权衡由以下公式设定:

$$\mathbf{w_m^f}=\frac{1}{2}\min\left(1,\frac{\mathbf{n_f}}{\tau_m}\right),\qquad \mathbf{w_p^f}=1-\mathbf{w_m^f},$$

  其中 $\mathbf{n_f}$ 为该帧中有效标记的数量,默认 $\tau_m=5$。
- **地图优化**是在关键帧位姿、点位置和标记位姿上进行的稀疏 Levenberg-Marquardt 光束法平差:$\arg\min_{\mathbf{k}_{\mathrm{T}},\mathbf{p}_{\mathbf{x}},\mathbf{m}_{\mathrm{M}}} E(\Upsilon_p)+E(\Upsilon_m)$,在关键帧插入后局部运行(共视关键帧),在回环检测后全局运行。
- **回环检测和重定位**以标记为先:一个未在参考关键帧附近被观测到的标记再次被观测到时,会立即触发无歧义的回环检测——在标记被允许进入跟踪流程*之前*,通过 $\mathrm{Sim}(3)$ 位姿图优化进行校正——而基于特征点的回环检测则通过 FBoW 异步运行。重定位首先尝试已知标记,失败后再回退到 BoW + RANSAC PnP。
- **剔除**为每个标记保留观测到它的三个最远关键帧,然后移除那些其匹配点在至少三个其他关键帧中也能看到的关键帧。

## 实验结果

在 KITTI(20 个单目序列)、EuRoC-MAV(20 个)、TUM RGB-D(10 个)和 SPM(8 个)数据集上与 ORB-SLAM2 和 LDSO 进行比较,使用了论文提出的一种成对评分 $\mathbf{S}_{\rho}(\mathbf{a},\mathbf{b})\in[-1,1]$,该评分结合了 ATE(在共同跟踪的帧上计算)与被跟踪帧的百分比。在不同置信水平 $\rho$ 下,ORB-SLAM2 相对于 UcoSLAM 的得分为 $-0.10$ 到 $-0.14$(UcoSLAM 略胜一筹);LDSO 相对于 UcoSLAM 的得分为 $-0.37$ 到 $-0.40$(明显更差)。在配备标记的 SPM 数据集上,特征点+标记方案胜过仅使用标记的方案($\mathbf{S}$ 相对于其为 $-0.187$ 到 $-0.625$)以及仅使用特征点的方案(例如 video1:特征点+标记方案在 100% 跟踪率下 ATE 为 0.057 m,而仅特征点方案在 64.5% 跟踪率下为 0.601 m)。平均速度(按跟踪帧数计的 fps):UcoSLAM 为 2.6(SLAM)/19.8(跟踪),对比 ORB-SLAM2 为 1.6/12.5,LDSO 为 3.0/2.4,Wilcoxon 检验确认了相对于 ORB-SLAM2 的显著性。在一个重复性很强的办公楼环境中(天花板上 50 个标记,四条约 20 米的走廊,一段 12,000 帧的手机拍摄序列),ORB-SLAM2、LDSO 以及两种仅使用单一路标类型的 UcoSLAM 模式均失败;只有特征点+标记组合模式构建出了一致的地图,而 BoW 重定位每帧最多返回六个由标记 ID 消除歧义的错误候选。

## 对SLAM的意义

UcoSLAM 表明人工路标和自然路标是互补的:标记贡献度量尺度、无漂移的锚点以及可靠的重定位/回环检测,而特征点则在标记之间提供连续的覆盖。这使其在你能够控制的环境中——仓库、实验室、工业 AR 场景——非常实用,在这些场景中放置少量标记是一种廉价的保险,而其地图保存/加载设计也使其在同时代的研究系统中显得格外便于部署。

## 相关条目

- [ORB-SLAM2](orb-slam2.md) —— UcoSLAM 所依托的基于特征点的 SLAM 设计
- [尺度歧义](scale-ambiguity.md) —— 标记免费解决的单目问题
- [视觉地点识别(VPR)](visual-place-recognition-vpr.md) —— 标记所取代的基于外观的回环检测
- [路标](../level-02-getting-familiar/landmark.md) —— 地图路标的一般概念
- [LDSO](ldso.md) —— 与之比较的直接法基线系统
