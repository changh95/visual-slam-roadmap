# LVI-SAM

> Shan 2021 · [论文](https://arxiv.org/abs/2104.10831)

**一句话总结** — LVI-SAM 在一个共享的因子图上将 VINS-Mono 风格的视觉-惯性子系统与 LIO-SAM 风格的激光-惯性子系统紧耦合起来，两个子系统互相引导、互相救援。

## 问题

基于激光雷达的方法能在远距离捕获精细的环境细节，但在无结构环境（如长走廊或空旷的平地）中通常会失效；基于视觉的方法在场景识别和纹理丰富的场景中表现出色，但对光照变化、快速运动和初始化很敏感。将两者分别与 IMU 结合能有所帮助，但单独任何一对传感器组合在真实部署中都无法做到稳健。LVI-SAM 将三种传感器融合在一个框架内，使系统在视觉或激光雷达任一部分退化时仍能保持运转。

## 方法与架构

两个子系统共享一个因子图，用 iSAM2 进行优化：

- **视觉-惯性系统（VIS）**，改编自 VINS-Mono：用 KLT 跟踪 Shi-Tomasi 角点，在状态 $\mathbf{x} = [\,\mathbf{R},\ \mathbf{p},\ \mathbf{v},\ \mathbf{b}\,]$ 上进行滑动窗口光束法平差，其中 $\mathbf{R} \in SO(3)$ 为旋转，$\mathbf{p} \in \mathbb{R}^3$ 为位置，$\mathbf{v}$ 为速度，$\mathbf{b} = [\,\mathbf{b}_a, \mathbf{b}_w\,]$ 为加速度计/陀螺仪偏置；机体到世界坐标系的变换为 $\mathbf{T} = [\mathbf{R}\,|\,\mathbf{p}] \in SE(3)$。
- **激光-惯性系统（LIS）**，改编自 LIO-SAM：经过 IMU 去畸变后，边缘和平面特征与保存在滑动窗口关键帧中的特征地图进行匹配；当位姿变化超过阈值时添加一个新关键帧（图节点）。四种因子类型被联合优化：IMU 预积分、视觉里程计、激光里程计和回环检测。

跨系统辅助是核心设计：

- **初始化**：VINS-Mono 风格的初始化在小速度或匀速情况下常常失败（没有加速度激励时尺度不可观测），因此深度可直接观测的 LIS 先完成初始化，并将其估计的 $\mathbf{x}$ 和 $\mathbf{b}$ 作为初始猜测传给 VIS。
- **来自激光雷达的特征深度**：将若干激光雷达帧堆叠成一张密集深度图；将特征点和深度点投影到相机周围的单位球面上，通过极坐标下的二维 K-D 树找到三个最近的深度点，特征深度即为从相机中心出发的射线与这三点所在平面交点的长度。若这三点间的最大距离超过 2 米（由堆叠引起的深度歧义），则不关联深度。
- **扫描匹配的初始猜测**：视觉-惯性里程计为激光雷达扫描匹配提供种子值；在 LIS 初始化之前，只要初始线速度低于 10 m/s、角速度低于 180°/s，单纯的 IMU 积分即已足够。
- **失效检测**：当跟踪特征数低于阈值或估计的 IMU 偏置超过阈值时，VIS 会报告失效并重新初始化；LIS 将扫描匹配视为迭代求解 $\min_{\mathbf{T}} \|\mathbb{A}\mathbf{T} - \mathbf{b}\|^2$，当 $\mathbb{A}^{\mathsf{T}}\mathbb{A}$ 的最小特征值低于阈值时报告失效，此时不添加激光雷达因子。
- **两阶段回环检测**：VIS 中用带 BRIEF 描述子的 DBoW2 提出候选回环，LIS 在这些候选进入图之前通过扫描匹配进行精化。

## 实验结果

在三个自采数据集（*Urban*、*Jackal*、*Handheld*）上评估，使用 Velodyne VLP-16、FLIR 相机、MicroStrain 3DM-GX5-25 IMU，以及 RTK GPS 作为真值，在 Intel i7-10710U 笔记本上与 VINS-Mono、LOAM、LIO-mapping、LINS、LIO-SAM 进行对比。

- **Urban 消融实验**（端到端误差）：仅 VIS 为 239.19 m → 加入激光雷达深度后为 142.12 m；仅 LIS 为 290.43 m（在退化区域发散）；无回环的完整 LVIO 为 45.42 m → 加入深度后为 32.18 m（降低 29%）；启用所有模块：平移 0.28 m，旋转 5.77°。
- **Jackal（无人地面车）**：带回环的 LVI-SAM 在相对 GPS 的 RMSE 上取得最佳成绩 0.67 m（对比 LIO-SAM 的 1.52 m、LINS 的 0.77 m、VINS-Mono 的 4.49 m），端到端旋转误差也最优，为 1.52°。
- **Handheld**（穿越一片开阔的棒球场）：所有基于激光雷达的方法均彻底失效；LVI-SAM 顺利完成该轨迹，带回环的 RMSE 为 0.83 m、端到端平移误差为 0.27 m（对比带回环的 VINS-Mono 的 73.07 m RMSE）。

## 对SLAM的意义

LVI-SAM 是激光-视觉-惯性融合的经典因子图实现，也是*双向*传感器辅助最清晰的示范：深度从激光雷达流向相机，初始化和初始猜测在两个方向上都流动。作为 LIO-SAM 作者们打造的自然延伸，它成为标准的开源 LVI 基线，直接的基于滤波器的竞争者（R3LIVE、FAST-LIVO）都以它作为对比对象，也是三重融合中退化处理的首选案例研究。

## 相关条目

- [LIO-SAM](lio-sam.md) — 其激光-惯性子系统与因子图骨架
- [VINS-Mono](../level-06-vio-vins/vins-mono.md) — 其视觉-惯性子系统的设计基础
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — 它所示范的融合概念
- [Degradation handling](degradation-handling.md) — 其跨子系统的回退行为
- [FAST-LIVO](fast-livo.md) — 直接法、基于滤波器的替代方案
- [Tightly-coupled LiDAR-camera](tightly-coupled-lidar-camera.md) — 它用因子图实现的架构原则
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md) — 其图中四种因子类型之一
