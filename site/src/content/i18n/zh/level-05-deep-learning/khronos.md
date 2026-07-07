# Khronos

> Schmid (MIT SPARK) 2024 · [论文](https://arxiv.org/abs/2402.13817)

**一句话总结** — 统一的时空度量-语义SLAM,通过追踪物体的完整历史——何时出现、移动或被移除——将Hydra场景图脉络扩展到动态环境中。

## 问题

动态SLAM研究在于变化环境中精确估计机器人位姿方面已取得长足进展,但对于构建环境本身的稠密*时空*表示,关注则要少得多。长期自主运行需要同时对短期动态(一个人走过)和长期变化(两次访问之间家具被重新摆放)进行推理,而这两方面的文献——运动物体跟踪与变化检测——此前一直是割裂的。Khronos定义了时空度量-语义SLAM(SMS)问题:在当前每个时刻$T$,估计场景在*所有*先前时刻$t \leq T$的状态。

## 方法与架构

场景被表示为一组物体 $O_i^t = \{\Omega_i^t,\ T_{WO_i}^t,\ L_i\}$(表面、位姿、语义标签;背景是一个特殊的静态物体$O_{BG}$),通过表面测量$Z$和里程计$\Phi$进行观测。SMS被表述为MAP估计问题:

$$O^{\star}, X^{\star} = \arg\max_{O,X}\ \mathbb{P}(O, X \mid Z, \Phi).$$

直接求解是难以处理的——测量值与地图之间的不一致可能源于噪声、漂移、运动,*也*可能源于变化。其关键假设是**时空局部一致性**:在短时间间隔$\tau$内,状态估计误差和场景变化都很小。这使得Khronos引入了潜在的**物体片段** $Y_k = \{\Omega_k,\ T_{RY_k},\ L_k\}$(在局部一致的时间窗口内累积得到的物体局部观测),并将问题因子化(公式16):

$$\mathbb{P}(O, X, Y, A \mid Z, \Phi) = \underbrace{\prod_i \mathbb{P}(O_i \mid \bar{Y}_i, X)}_{\text{片段协调}}\ \underbrace{\mathbb{P}(X, A \mid Y, \Phi)}_{\text{SLAM}}\ \underbrace{\prod_k \mathbb{P}(Y_k \mid \bar{Z}_k, \bar{\Phi}_k)}_{\text{局部估计}},$$

其中$A$将片段关联到物体。短期动态完全存在于快速的局部项中;长期变化存在于较慢的全局项中。该系统包含三个组成部分:

- **活动窗口(局部估计)。** 增量式TSDF融合重建背景网格$\Omega_{BG}$;每帧的候选物体来自语义掩码加几何运动检测(落入此前观测到的自由空间中的点必定是动态的)。观测通过体积IoU贪心地关联到物体假设;观测次数少于$\tau_Z = 15$的假设,或移动距离小于$\tau_D = 1$米的"动态"假设,都会被剔除。静态物体成为自适应分辨率的网格,动态物体则成为点云序列。
- **全局优化。** 在机器人位姿$X$、网格控制点$P_M$和片段位姿$T_{WY_k}$(每个都与其首次/末次被观测到的位姿相关联)之上构建变形图,并作为带二元开关$\omega_{ij}$的候选边(片段-片段关联$\mathcal{E}_{YY}$和回环$\mathcal{E}_{LC}$)的鲁棒位姿图优化问题求解:

$$\mathcal{T}^{*} = \arg\min_{\mathbf{T}_1,\dots,\mathbf{T}_n,\ \omega_{ij}\in\{0,1\}} \sum_{(i,j)\in\mathcal{E}_{obs}} \lVert \mathbf{T}_i^{-1}\mathbf{T}_j \boxminus \bar{\mathbf{T}}_{ij} \rVert^2_{\Lambda_{ij}} + \sum_{(i,j)\in\mathcal{E}_{can}} \Big( \omega_{ij} \lVert \mathbf{T}_i^{-1}\mathbf{T}_j \boxminus \bar{\mathbf{T}}_{ij} \rVert^2_{\Lambda_{ij}} + (1-\omega_{ij})\,\bar{c}^2 \Big).$$

- **协调(变化检测)。** 一个"射线库"为每个背景顶点$\mathbf{p}_v$存储观测到它的机器人位置$\mathbf{p}_r$。用一个片段表面点$\mathbf{p}_q$去查询邻近射线,可得到其离射线的偏移距离 $d_r = \lVert (\mathbf{p}_q - \mathbf{p}_r) \times (\mathbf{p}_r - \mathbf{p}_v) \rVert / \lVert \mathbf{p}_q - \mathbf{p}_r \rVert$,以及沿射线方向的深度$d_d$:较短的深度是*不存在的证据*,相近的深度(30厘米以内)则是存在的证据。物体出现/消失的时间被估计为最后一次不存在证据与首次存在证据之间时间窗口的中点(在均匀先验下的最小期望误差估计)。

## 实验结果

在两个具有稠密时空真值的照片级真实感TESSE模拟场景上评测——**Apartment**(87秒,约39米,64个静态+10个动态物体,6次长期变化)和**Office**(217秒,约181米,196个物体,6个动态物体,8次变化)——每个场景都同时使用真值位姿和Kimera VIO里程计,并与Hydra、Dynablox和Panoptic Mapping对比(均为8厘米分辨率、5米范围):

- **Apartment(真值位姿),F1分数:** 背景重建91.2(Hydra 87.7,Dynablox 86.2,Panoptic Mapping 70.3);物体75.3(Hydra 42.3,Panoptic Mapping 64.3);动态物体84.1(Dynablox 61.3);变化64.6(Panoptic Mapping 56.1)。
- **使用存在漂移的Kimera里程计的Office场景:** Khronos保持了最佳的背景(F1 67.6)和物体(F1 73.1)得分;若没有Khronos的联合时空优化和可形变变化检测,Panoptic Mapping的变化检测精度会崩溃(9.6对Khronos的25.8)。
- **与分割方法无关:** 将真值语义替换为开放集的SAM+CLIP前端后,仍能保持高性能(Apartment真值位姿场景下:变化F1为64.4对64.6)。
- **真实机器人:** 在一台Jackal UGV(夹层场景)和一台波士顿动力Spot(横穿整层大学教学楼)上,Khronos正确捕捉到了预先安排好的物体出现/消失以及短期运动(行人、被推动的手推车)。
- **实时性:** 得益于该因子化分解,活动窗口的每帧处理耗时为$45.5 \pm 9.2$毫秒(平均22.2 FPS),且时间复杂度近似为常数。

## 对SLAM的意义

几乎所有经典SLAM都假设一个静态世界,而这在家庭、仓库和办公室等物体不断移动的长期运行场景中会失效。Khronos将动态性重新定义为需要被*建模并记住*的东西,而不是被过滤掉的噪声,其片段因子化展示了如何实时做到这一点:传感噪声、机器人漂移、运动和场景变化各自拥有独立的项。这是在Kimera→Hydra这条度量-语义场景图脉络之上实现长期自主运行的一块关键基石。

## 相关条目

- [Hydra](hydra.md) — Khronos所扩展的实时场景图系统
- [Clio](clio.md) — 出自同一实验室的任务驱动开放集场景图
- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — 动态场景图理念的起源
- [SAM 2](sam-2.md) — 对跟踪动态实体有用的视频分割方法
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — Khronos所超越的经典"过滤动态"方法
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — 公式17背后的可切换约束机制
