# Visual Odometry

> Nistér 2004 · [论文](https://ieeexplore.ieee.org/document/1315094)

**一句话总结** — 提出了"视觉里程计"这一术语，并展示了基于单目和双目视频的实时、逐帧相机位姿估计，将VO确立为一种实用的导航能力。

## 问题

在这项工作之前，基于相机的自我运动估计主要以离线运动恢复结构（structure-from-motion）的形式存在：批处理流程需要花费数分钟甚至数小时来处理图像集合。而自主导航所需要的恰恰相反——从视频流中进行增量式、实时、逐帧的位姿估计，且要足够鲁棒，可以在运动中的车辆上运行。Nistér、Naroditsky和Bergen（CVPR 2004）证明了这是可行的：他们的系统"基于视频输入估计双目相机头或单个运动相机的运动"，能够以低延迟实时运行，使得运动估计可用于导航目的——他们类比车轮里程计，将这一能力命名为*visual odometry（视觉里程计）*。

## 方法与架构

该流程是一个逐帧循环的四阶段过程（其中没有任何全局优化）：

1. **特征检测与匹配** — 在每一帧中检测Harris角点，并使用局部图像块的归一化相关性在连续帧之间进行匹配，从而以视频帧率生成特征轨迹。
2. **鲁棒的相对位姿估计** — 标定视图之间的相对位姿是在RANSAC假设-检验循环中，使用Nistér的*五点算法*计算得到的，该算法作为配套论文发表（"An Efficient Solution to the Five-Point Relative Pose Problem"，同样发表于2004年）。给定标定后的图像点 $\mathbf{q} \leftrightarrow \mathbf{q}'$，每一组对应关系都通过对极约束来约束本质矩阵：

$$
\mathbf{q}'^\top \mathbf{E}\,\mathbf{q} = 0, \qquad \mathbf{E} \equiv [\mathbf{t}]_\times \mathbf{R},
$$

   一个有效的本质矩阵还必须额外满足三次约束（五点算法论文的定理1）：

$$
\mathbf{E}\mathbf{E}^\top\mathbf{E} - \tfrac{1}{2}\,\mathrm{trace}\big(\mathbf{E}\mathbf{E}^\top\big)\,\mathbf{E} = \mathbf{0}.
$$

   五组对应关系给出一个 $5 \times 9$ 的线性系统，其4维零空间 $\mathbf{E} = x\mathbf{X} + y\mathbf{Y} + z\mathbf{Z} + w\mathbf{W}$ 通过三次约束被化简为一个**十次多项式**，其实数根即为候选运动。使用*最小*的五个点使得每一次RANSAC假设的计算成本很低，并最大化抽取到全内点样本的概率；假设在所有匹配上进行打分，外点被剔除。随后从 $\mathbf{E}$ 的SVD分解中恢复出 $\mathbf{R}, \mathbf{t}$。
3. **三角化** — 内点匹配被三角化为3D点（在双目配置中，已知基线确定了度量尺度；而在单目情况下，尺度是不可观测的）。
4. **增量位姿链接** — 每帧到帧的相对位姿被依次组合，得到全局轨迹。

其架构上最具决定性的特点是*缺失*的部分：没有回环检测，没有全局优化，没有位置识别，没有地图复用——漂移会无限累积，这正是VO与完整SLAM的区别所在。

## 实验结果

已发表的评估结果（IEEE付费墙内容；本笔记无法获取完整文本——完整评估请参见论文）证明了在双目相机头和单个运动相机拍摄的真实视频上，系统能够以低延迟实时运行，其估计结果被用于地面车辆平台的导航；扩展的期刊版本发表为"Visual odometry for ground vehicle applications"（Journal of Field Robotics，2006年）。其持久的量化遗产体现在架构层面：与该工作同时提出的五点求解器成为标定双视图几何的标准工具（OpenCV的`findEssentialMat`即源自此算法），而"visual odometry"也成为了整个子领域公认的名称。

## 对SLAM的意义

这篇论文将视觉里程计定义为一个独立的问题，并证明了相机可以作为主要的导航传感器，为后续所有单目SLAM系统奠定了基础。其流程——特征、最小求解器+RANSAC、三角化、位姿组合——至今仍是大多数几何前端的骨架（PTAM甚至使用同样的五点算法进行地图初始化）。理解它所缺失的部分（回环检测、全局一致性）是理解SLAM在VO之上添加了什么的最清晰途径。

## 动手实践

- [MonoVO动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_05)

## 相关条目

- [VO vs SLAM](vo-vs-slam.md) — 本文引出的这一概念性区分
- [MonoSLAM](monoslam.md) — 首个实时单目SLAM，发表时间稍晚
- [对极几何](../level-01-beginner/epipolar-geometry.md) — 本质矩阵背后的理论
- [三角化](../level-01-beginner/triangulation.md) — 从两个视图恢复3D点
- [2D-2D对应关系](../level-02-getting-familiar/2d-2d-correspondence.md) — VO背后的匹配问题
- [角点检测器](../level-01-beginner/corner-detector.md) — 原始流程所跟踪的Harris特征
