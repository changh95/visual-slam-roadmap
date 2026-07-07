# Kimera-VIO

> Rosinol 2020 · [论文](https://arxiv.org/abs/1910.02490)

**一句话总结** — Kimera库中快速的立体视觉-惯性里程计模块：基于流形的IMU预积分加上通过iSAM2固定滞后平滑求解的GTSAM无结构视觉因子——它是一套实时、仅需CPU的度量-语义SLAM流水线的状态估计核心。

## 问题

在人类周围工作的机器人需要的不仅是一条轨迹：它们需要一个度量精确*且带有语义标签*的场景模型。现有的开源库（ORB-SLAM、VINS-Mono、OKVIS、ROVIO）仅止步于位姿和稀疏点，而实时的度量-语义系统（SLAM++、SemanticFusion、Voxblox++）则依赖RGB-D传感并大多需要GPU。Kimera的目标是"超越现有的视觉与视觉惯性SLAM库……通过在3D中实现网格重建与语义标注"——依靠视觉惯性传感、在CPU上、实时运行——其支撑点是一个足够快速、准确、可以支撑起整个系统栈的VIO前端。

## 方法与架构

Kimera接收立体帧和高频IMU数据，并在承载四个模块的四条线程中并行运行：

- **Kimera-VIO** 将Forster等人提出的基于关键帧的最大后验视觉惯性估计器实现为一个固定滞后（也可选择全量）平滑器。*前端*在关键帧之间执行基于流形的IMU预积分，在视觉方面则检测Shi-Tomasi角点，用Lucas-Kanade跟踪器进行跟踪，寻找左右立体匹配，并进行几何验证——单目使用5点RANSAC，立体使用3点RANSAC，也可选择利用IMU旋转信息的2点/1点变体。检测、立体匹配和验证仅在关键帧上运行；中间帧则只做跟踪。*后端*将预积分IMU因子和**无结构视觉模型**加入一个用iSAM2求解的GTSAM因子图：每次迭代时，观测到的特征都会根据当前位姿估计通过DLT进行三角化，三维点在剔除退化点（位于相机之后、视差过小）和外点（重投影误差过大）后被解析地从VIO状态中消去。超出平滑窗口的状态被边缘化掉；前端以IMU频率发布状态估计。
- **Kimera-RPGO** 通过DBoW2词袋模型加上单目/立体几何验证来检测回环，随后应用一种鲁棒的位姿图优化，采用*增量式成对一致测量集最大化（incremental Pairwise Consistent Measurement set maximization, PCM）*：每个回环必须与其环路上的里程计一致（通过卡方检验），并与之前的回环成对一致，这些信息以增量方式维护在邻接矩阵$\boldsymbol{A}\in\mathbb{R}^{L\times L}$中；在进行Gauss–Newton优化之前，通过快速的最大团搜索选出最大的一致集合。
- **Kimera-Mesher** 通过对使用后端深度反投影的跟踪特征进行2D Delaunay三角化，在不到5毫秒内构建出每帧的3D网格，并对VIO窗口内的多帧构建多帧网格；检测到的平面表面会将正则化因子反馈回VIO——实现网格正则化与状态估计的紧密耦合。
- **Kimera-Semantics** 对每个关键帧运行稠密立体匹配（半全局匹配），通过捆绑光线投射（bundled raycasting）将点云融合进Voxblox TSDF，同时基于2D分割结果对每个体素的语义标签概率进行贝叶斯更新，并使用移动立方体算法（marching cubes）提取全局的度量-语义网格。

这些模块"可以单独运行，也可以组合运行，因此Kimera可以轻松退化为一个最先进的VIO系统或一个完整的SLAM系统。"

## 实验结果

在EuRoC数据集上（RMSE ATE，SE(3)对齐），Kimera在各个类别中都取得了顶尖性能：在固定滞后平滑模式下，Kimera-VIO达到0.05–0.35 m（例如MH_1为0.11，V1_3为0.07），而OKVIS为0.09–0.47，MSCKF为0.10–1.13，ROVIO为0.10–0.52，VINS-Mono为0.08–0.32；在全量平滑模式下，MH_1上达到0.04 m，而SVO-GTSAM在其中三个V序列上失败；在加入回环检测后，Kimera-RPGO在V2_3上取得0.19 m，而VINS-LC报告的误差为1.39 m。鲁棒性方面：若不使用PCM，随着DBoW2阈值$\alpha$放宽，PGO误差会暴涨至1.74 m，而Kimera-RPGO在任何$\alpha$下都保持约0.05 m的误差——无需任何参数调优。几何精度方面：全局语义网格相对于EuRoC真值点云的精度为0.35–0.48 m；快速多帧网格的噪声高出多达24%，但速度快两个数量级。在一个照片级真实感仿真器中，Kimera-Semantics在使用真值深度和Kimera-VIO位姿（ATE为0.04 m）时达到80.03%的mIoU，而使用稠密立体匹配时降至57.23%。耗时（CPU）：IMU预积分约40 µs（状态输出频率超过200 Hz），跟踪每帧4.5毫秒，关键帧处理45毫秒，后端小于40毫秒，RPGO约55毫秒，语义处理每关键帧约0.1秒。

## 对SLAM的意义

Kimera证明了一个干净、模块化的开源系统栈能够在CPU上实时地将原始的立体+IMU数据转化为带语义标签的3D网格——这使它既是一个实用的VIO基线，也成为了整整一系列研究的基础：3D Dynamic Scene Graphs、Hydra以及Kimera-Multi都建立在这一前端之上。它的GTSAM智能因子（smart-factor）加iSAM2的组合方案，现已成为Ceres式滑动窗口优化的标准替代方案，而Kimera-RPGO的鲁棒位姿图优化也被作为独立库使用。

## 动手实践

- [运行Kimera](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/kimera)

## 相关条目

- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — Kimera-VIO所使用的IMU因子。
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) — 建立在这一VIO之上的场景理解层。
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — 多机器人扩展版本。
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — 底层使用的iSAM2机制。
- [GNC](../level-02-getting-familiar/gnc.md) — 后来被Kimera-RPGO采用的鲁棒优化方法。
- [MSCKF](msckf.md) — 无结构测量思想的滤波器先祖。
