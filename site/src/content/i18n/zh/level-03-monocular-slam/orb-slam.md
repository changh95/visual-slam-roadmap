# ORB-SLAM

> Mur-Artal 2015 · [论文](https://arxiv.org/abs/1502.00956)

**一句话总结** — 一个完整、通用的单目SLAM系统，在跟踪、建图、重定位和回环检测的每一个任务中都使用ORB特征点，并具备自动初始化和"适者生存"式的地图管理机制。

## 问题

早期的单目SLAM系统各自只解决了问题的一部分：PTAM有关键帧光束法平差，但没有回环检测，其patch特征对于场景识别毫无用处，且需要手动初始化；其他系统则无法处理大规模环境，也无法从跟踪丢失中恢复。ORB-SLAM（IEEE TRO 2015，萨拉戈萨大学）在PTAM的核心思想、DBoW2场景识别和尺度感知回环检测的基础上，将这些问题统一在一个框架中解决，能够在室内外、大小规模环境中实时运行。

## 方法与架构

**一种特征，服务所有任务。** 同一套ORB特征（定向FAST + 旋转BRIEF，通过汉明距离匹配）同时服务于跟踪、建图、重定位和回环检测，因此不会有重复的工作。

**自动初始化。** 从同一组对应点 $\mathbf{x}_c \leftrightarrow \mathbf{x}_r$ 并行计算单应矩阵和基础矩阵，即 $\mathbf{x}_c = \mathbf{H}_{cr}\,\mathbf{x}_r$ 与 $\mathbf{x}_c^{\top}\mathbf{F}_{cr}\,\mathbf{x}_r = 0$，各自通过带有异常值截断核的对称转移误差打分：

$$
S_M = \sum_i \Big( \rho_M\big(d_{cr}^2(\mathbf{x}_c^i, \mathbf{x}_r^i, M)\big) + \rho_M\big(d_{rc}^2(\mathbf{x}_c^i, \mathbf{x}_r^i, M)\big) \Big), \qquad
\rho_M(d^2) = \begin{cases} \Gamma - d^2 & \text{if } d^2 < T_M \\ 0 & \text{if } d^2 \geq T_M \end{cases}
$$

其中 $\chi^2$ 阈值为 $T_H = 5.99$，$T_F = 3.84$。启发式指标 $R_H = \frac{S_H}{S_H + S_F}$ 在 $R_H > 0.45$（平面/低视差场景）时选择单应矩阵，否则选择基础矩阵（$\mathbf{E}_{rc} = \mathbf{K}^{\top}\mathbf{F}_{rc}\,\mathbf{K}$）；系统会检测退化或模糊的配置，并推迟初始化。

**三个并行线程。**
- *跟踪*线程通过匹配局部地图并用仅优化运动的BA来定位每一帧。所有优化都是在位姿 $\mathbf{T}_{iw} \in \mathrm{SE}(3)$ 和地图点 $\mathbf{X}_{w,j} \in \mathbb{R}^3$ 上最小化鲁棒重投影误差：

$$
C = \sum_{i,j} \rho_h\big(\mathbf{e}_{i,j}^{\top}\,\mathbf{\Omega}_{i,j}^{-1}\,\mathbf{e}_{i,j}\big), \qquad
\mathbf{e}_{i,j} = \mathbf{x}_{i,j} - \pi_i(\mathbf{T}_{iw}, \mathbf{X}_{w,j}),
$$

  使用Huber核 $\rho_h$，且 $\mathbf{\Omega}_{i,j} = \sigma_{i,j}^2 \mathbf{I}_{2\times 2}$ 与关键点所在的金字塔尺度相关联。关键帧的插入条件较宽松（例如，当该帧跟踪到的参考关键帧的点少于90%时即插入）。
- *局部建图*三角化新的地图点，在共视邻域上运行局部BA，并进行严格的剔除：一个新点必须在预测能看到它的帧中的超过25%中被找到，并且要被至少三个关键帧观测到；如果某关键帧90%的点都被至少三个其他关键帧观测到，则该关键帧会被删除。*共视图*连接了共享至少15个点观测的关键帧（边权重 $\theta$ = 共享点的数量）。
- *回环检测*使用DBoW2检测候选回环，从双视图约束 $\mathbf{e}_1 = \mathbf{x}_{1,i} - \pi_1(\mathbf{S}_{12}, \mathbf{X}_{2,j})$，$\mathbf{e}_2 = \mathbf{x}_{2,j} - \pi_2(\mathbf{S}_{12}^{-1}, \mathbf{X}_{1,i})$ 计算7自由度的 $\mathrm{Sim}(3)$ 对齐（单目存在尺度漂移），然后通过在*本质图*（essential graph，即生成树 + $\theta_{\min} = 100$ 的共视边 + 回环边）上进行位姿图优化来纠正漂移，最小化

$$
C = \sum_{i,j} \mathbf{e}_{i,j}^{\top} \mathbf{\Lambda}_{i,j}\, \mathbf{e}_{i,j}, \qquad
\mathbf{e}_{i,j} = \log_{\mathrm{Sim}(3)}\big(\mathbf{S}_{ij}\,\mathbf{S}_{jw}\,\mathbf{S}_{iw}^{-1}\big) \in \mathbb{R}^7,
$$

  之后再进行一次可选的全局BA。

## 实验结果

所有实验均在Intel Core i7-4700MQ（4核 @ 2.40 GHz）、8 GB内存上进行，图像以其真实帧率处理：

- **NewCollege（2.2公里机器人序列）**：报道中首个能处理完整序列的单目系统。跟踪时间中位数为30.57毫秒/帧（ORB提取11.10毫秒，初始位姿3.38毫秒，局部地图跟踪14.84毫秒）；局部建图中位数为383.59毫秒/关键帧，主要由局部BA的296.08毫秒占据。
- **TUM RGB-D（16个序列）**：关键帧轨迹RMSE，例如fr1_xyz为0.90厘米（PTAM为1.15，LSD-SLAM为9.00），fr2_xyz为0.30厘米，fr2_desk_person为0.63厘米（LSD-SLAM为31.73）。PTAM在8个序列中跟踪丢失，LSD-SLAM在3个序列中丢失；ORB-SLAM除fr3_nstr_tex_far外均能正常运行——在该序列中它能正确检测到平面双重歧义并拒绝初始化。
- **重定位**：从fr2_xyz地图出发，召回率为78.4%，而PTAM为34.9%；在严重遮挡情况下（针对sitting_xyz地图重定位walking_xyz帧），召回率为77.9%，而PTAM为0%。
- **长期运行**：关键帧数量会趋于饱和，而PTAM式策略的关键帧数量会无限增长——地图规模随场景内容增长，而非随时间增长。
- **KITTI（10个序列）**：除高速公路序列01外，均能以10 fps实时处理；轨迹误差通常在地图尺度的约1%左右（03序列为0.3%，无回环的08序列为5%），经过20次全局BA迭代后会略有改善。

## 对SLAM的意义

ORB-SLAM将十年来的最佳思想——PTAM的并行跟踪/建图、关键帧BA、词袋场景识别、共视性、Sim(3)回环检测——统一到了一个健壮的开源系统中，并在多年间成为事实上的单目SLAM基准标准。它的H/F初始化、共视图/本质图机制以及"适者生存"式剔除策略被后续几乎所有基于特征的系统所采用，并催生了至今仍是SLAM评测基准的ORB-SLAM2/3系列。

## 相关条目

- [PTAM](ptam.md)
- [ORB-SLAM2](orb-slam2.md)
- [ORB-SLAM3](orb-slam3.md)
- [Covisibility graph](covisibility-graph.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — 本质图纠正步骤
