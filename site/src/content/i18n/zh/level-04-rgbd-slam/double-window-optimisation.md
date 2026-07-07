# Double Window Optimisation

> Strasdat 2011 · [论文](https://ieeexplore.ieee.org/document/6126517)

**一句话总结** —— 一种分层后端,在一个小的内窗口中耦合完整的光束法平差,并在一个外窗口中采用软位姿图约束作为外围,从而在保持局部BA精度的同时实现恒定时间的视觉SLAM。

## 问题

完整的光束法平差(bundle adjustment)相对于关键帧数量呈线性到三次方的复杂度,这使其在长时间运行的SLAM中不可行。滑动窗口/主动窗口BA能保持恒定的计算成本,但会将边界关键帧固定为硬约束,这在闭环运动下会阻碍收敛;纯位姿图优化是有损的;相对光束法平差在闭环的局部区域内不能保证度量一致性。当时缺失的是一个能同时处理精确的闭环局部浏览和快速大范围探索、且计算时间恒定的单一后端。

## 方法与架构

**SLAM图。** 关键帧顶点$\mathcal{V}$(绝对位姿$T_i$)、3D点$\mathcal{P}$,以及边$\mathcal{E}$,其中每条边$E_{ij}$携带一个**共视权重(covisibility weight)**$w_{ij}$ = 两帧中都可见的点的数量。从当前参考关键帧$V_{\text{ref}}$开始,对共视关系进行统一代价搜索(优先选择$w_{ij}$最高的),选取前$M_1$个关键帧作为**内窗口**$W_1$,再选取接下来的$M_2$个作为**外窗口**$W_2$,其中$M_1 \ll M_2$。

**一个联合代价,两种约束类型。** 内窗口中所有可见的点都作为点-位姿(重投影)约束加入;所有外窗口帧则通过位姿-位姿约束与其共视邻居相连,两者被*同时*最小化:

$$\chi^2 = \sum_{z_{ik}} \big(z_{ik} - \hat{z}(T_i, \mathbf{x}_k)\big)^2 + \sum_{T_{ji}} \upsilon_{ji}^{\top} \Lambda_{T_{ji}} \upsilon_{ji}, \qquad \upsilon_{ji} := \log_{\mathrm{SE}(3)}\!\big(T_{ji} \cdot T_i \cdot T_j^{-1}\big)$$

其中$z_{ik}$是点$\mathbf{x}_k$在帧$i$中的观测值,$T_{ji}$是被边缘化边所存储的相对位姿。作者没有采用真正的边缘化,而是有意用一个廉价的、以共视度加权的对角矩阵来近似精度矩阵,

$$\Lambda_{T_{ji}} = w_{ij} \begin{pmatrix} \lambda^2_{\text{trans}} I_{3\times3} & O \\ O & \lambda^2_{\text{rot}} I_{3\times3} \end{pmatrix}$$

——作者表示,采用真正的边缘化并没有显著改善结果,他们将此归因于密集互联的共视结构。位姿图外围充当*软*约束以稳定BA核心,这与固定(硬)边界关键帧形成对比。优化使用g2o,并通过Levenberg-Marquardt阻尼吸收规范自由度(没有帧被固定);重新进入窗口的位姿会沿相对位姿路径$T_j = \pi_{ja} \cdot T_{\text{ref}}$重新初始化,随后进行仅优化结构的迭代。

**单目尺度处理。** 位姿存在于$\mathrm{Sim}(3)$(旋转、平移、尺度$s$)而非$\mathrm{SE}(3)$中;新关键帧的$s = 1$,尺度$s \neq 1$仅在基于外观的回环检测时才会引入,此时对3D-3D对应关系进行3点RANSAC以恢复相似变换——在恒定时间内修正尺度漂移。

**回环检测。** *度量*回环检测通过匹配在更大邻域$\mathcal{N}_2$中可见但不在直接邻域$\mathcal{N}_1$中的点来发现;如果有$\geq \theta$个点(通常为15-30个)共同对齐,则添加一条带约束$T_{\text{ref},i} = T_{\text{loop}} \cdot T_i^{-1}$的边缘化边。*大范围*回环检测则来自基于外观的检测,并通过3点RANSAC验证,匹配的3D点对被合并。

## 实验结果

在蒙特卡洛螺旋仿真中(500个关键帧,立体模型:焦距300,基线5厘米,640x480,1像素高斯噪声,10次试验,在Intel i7 960单核上运行g2o),恒定时间的cDWO(内窗口15,外窗口50)在内窗口范围内达到与完整BA相同的精度,而其计算成本保持平稳;gDWO(外窗口覆盖剩余全部485帧)则在全局范围内接近BA的表现。将外窗口在优化过程中*固定*的变体明显更差,验证了软约束的价值。在单目双环仿真中(内窗口30,外窗口100),平均1%的尺度漂移能在回环检测时以恒定时间被检测并修正。真实实验:在New College数据集上的立体SLAM(BRIEF + FAST前端)以5-7 FPS的速度接近实时运行,并进行大范围回环检测;改进版PTAM单目系统在单线程中以17 FPS运行,在回环检测时检测到6%的尺度变化;RGB-D(PrimeSensor)演示包括闭环式办公室浏览、轮式机器人建图和稠密物体模型构建。

## 对SLAM的意义

这篇论文提供了现代关键帧SLAM仍然沿用的后端蓝图:在精度重要的地方使用光束法平差,在尺度重要的地方使用共视度加权的位姿图,并将两者合并到同一个优化中。ORB-SLAM的局部BA/本质图划分及其共视图都是直接的后继,其$\mathrm{Sim}(3)$回环闭合也采用了本文所展示的、能在恒定时间内处理尺度漂移的方法。阅读本文可以理解现代后端*为何*采用这样的结构。

## 相关条目

- [Covisibility graph](../level-03-monocular-slam/covisibility-graph.md) —— 驱动窗口选择的图结构
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) —— 外窗口所使用的机制
- [Marginalization](../level-02-getting-familiar/marginalization.md) —— 对角精度近似所替代的内容
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md) —— 使这种后端设计广为流行的系统
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md) —— 同一作者的配套分析
