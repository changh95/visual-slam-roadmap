# maplab

> Schneider 2018 · [论文](https://arxiv.org/abs/1711.10250)

**一句话总结** — 一个面向视觉惯性*建图*的开放研究框架：围绕ROVIOLI（带定位集成功能的ROVIO，ROVIO with Localization Integration）构建，支持多会话地图融合、离线批量优化以及无漂移重定位，将地图视为一种持久的、可操作的资产，而非某次运行产生的一次性副产品。

## 问题

大多数VIO系统只产生单次会话的局部地图，运行结束后即被丢弃。实际部署则需要持久化地图、针对先验地图进行重定位以获得无漂移的全局位姿估计、融合由不同机器人或在不同时间构建的地图，以及在采集完成后能提升整个地图质量的离线优化。正如论文所指出的，现有方案"要么只专注于单会话使用场景，要么缺乏定位能力，要么缺乏端到端的流水线"——只有将最先进的算法、可扩展的多会话工具与灵活的用户界面结合起来的完整系统，才能成为一个高效的研究平台。

## 方法与架构

maplab包含两大部分：**在线前端ROVIOLI**和**离线maplab控制台**。

**ROVIOLI**将定位与地图构建功能封装在ROVIO滤波器之上。其模块包括：*特征跟踪*检测并跟踪BRISK或FREAK关键点，在由积分陀螺仪测量值预测出的窗口内逐帧匹配描述子；在LOC模式下，*帧定位*针对给定的定位地图建立2D-3D匹配，并在RANSAC内用P3P计算全局位姿$\mathbf{T}_{GI_k}$；这些原始的全局位姿被输入ROVIO，与里程计约束融合，用以估计全局到任务（mission）的变换$\mathbf{T}_{GM}$，同时估计局部位姿$\mathbf{T}_{MI}$；*地图构建器（Map Builder）*将所有输出同步整合为一个VI-map。共有两种模式：VIO模式（在有漂移的局部估计上构建地图）和LOC模式（额外跟踪一个无漂移的全局位姿）。

**VI-map结构。** 一个地图包含多个*任务（mission）*（每次会话对应一个）。每个任务是一个图：顶点保存状态估计（位姿$\mathbf{T}_{MI_k}$、IMU偏置、速度）以及关键点、二进制描述子和跟踪信息；边（最常见的是IMU边）保存顶点之间的惯性测量数据。地标（landmark）由多顶点观测三角化得到，并存储在其首次被观测到的顶点中。每个任务通过单一变换$\mathbf{T}_{GM_i}$锚定到全局坐标系——因此对齐整个会话只需调整这一个变换，而不必逐个顶点调整。位姿遵循标准约定

$$\begin{bmatrix} {}_{A}\mathbf{p} \\ 1 \end{bmatrix} = \mathbf{T}_{AB} \begin{bmatrix} {}_{B}\mathbf{p} \\ 1 \end{bmatrix} = \begin{bmatrix} \mathbf{R}_{AB} & {}_{A}\mathbf{p}_{AB} \\ \mathbf{0} & 1 \end{bmatrix} \begin{bmatrix} {}_{B}\mathbf{p} \\ 1 \end{bmatrix}$$

地图序列化为Protobuf格式；较大的资源（图像、稠密重建结果）则保存在独立的缓存资源系统中。

**控制台算法**（均可通过插件扩展，基于Ceres）：*VIWLS*——视觉惯性加权最小二乘批量优化，其代价项与OKVIS类似，可选地包含轮式里程计或GPS先验；*回环检测/定位*——基于投影二进制描述子的倒排多索引检索；*位姿图松弛（relaxation）*——可选使用Cauchy损失以对抗错误的回环检测；*地图稀疏化*——基于ILP的地标选择与关键帧化；*稠密重建*——立体块匹配、voxblox TSDF融合、CMVS/PMVS2导出。多会话工作流本质上就是一段控制台脚本：加载并合并地图，关键帧化（`kfh`），优化（`optvi`），锚定各任务，`relax`，`lc`，`optvi`。

## 实验结果

在EuRoC上（定位地图来自MH2，在MH1上评测）：纯ROVIO的位置RMSE为0.178 m，ROVIOLI针对先验地图定位后为0.082 m，完整VIWLS批量优化后为0.036 m；ORB-SLAM2（立体）在批处理模式下达到0.084 m，但在实时模式下为0.464 m / 13.34°。在V2-easy上使用V2-medium的定位地图：0.064 → 0.057 → 0.027 m（ORB-SLAM2实时模式发散）。在Intel Xeon E3-1505M上的耗时：ROVIOLI处理一帧需44毫秒，CPU负载105%，而ORB-SLAM2需63毫秒，CPU负载162%。多会话应用场景：某大学建筑的4次会话（总长超过1,000米，约463,000个地标）融合成一个一致的8.2 MB定位地图。地图维护：关键帧化加ILP摘要将地图缩小13倍，而召回率仅从60%降至51%。大规模示例：苏黎世老城区的45次Google Tango会话——共231分钟、16.48公里轨迹、435,000个地标、730万次观测、480 MB——在一台32 GB的台式机上经过一夜对齐与优化。

## 对SLAM的意义

maplab是第一个针对视觉惯性地图*全生命周期*——构建、离线优化、重定位、跨会话与跨机器人融合——的综合性开源框架，而这些能力此前只存在于专有的AR/机器人系统栈中。它在多旋翼飞行器、飞机、汽车、水下航行器以及步行机器人上经过实地测试，成为地图摘要化、定位以及去中心化建图研究的通用基础；maplab 2.0进一步将其扩展到多机器人和语义建图领域。当你面对的问题是"多次会话、一张地图"而非"单次运行、低漂移"时，值得研究这一框架。

## 相关条目

- [ROVIO](rovio.md) — ROVIOLI内部使用的VIO滤波器。
- [maplab 2.0](../level-08-collaborative-slam/maplab-2-0.md) — 多机器人的后继版本。
- [CCM-SLAM](../level-08-collaborative-slam/ccm-slam.md) — 同期的集中式协同SLAM系统。
- [VINS-Fusion](vins-fusion.md) — 实现地图级一致性的另一条路径（全局位姿图）。
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — 支撑重定位的检索组件。
- [Map merging](../level-08-collaborative-slam/map-merging.md) — maplab工具链所解决的一般性问题。
