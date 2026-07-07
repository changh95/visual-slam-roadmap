# 3D-3D correspondence

给定两组相互对应的3D点 $\{\mathbf{p}_i\}$（源）和 $\{\mathbf{q}_i\}$（目标），3D-3D配准问题要求找到将它们对齐的刚体变换：

$$\min_{R,\mathbf{t}} \sum_i \|\mathbf{q}_i - (R\mathbf{p}_i + \mathbf{t})\|^2$$

只要两个帧都提供3D数据——RGB-D或双目立体帧、LiDAR扫描，或是需要合并的两张点云地图——就会出现这个问题。经典算法是**ICP（迭代最近点，Iterative Closest Point）**。

## 已知对应关系时的闭式SVD解

当对应关系已知时，最优对齐有闭式解：

1. 计算质心：$\bar{\mathbf{p}} = \frac{1}{n}\sum_i \mathbf{p}_i$，$\bar{\mathbf{q}} = \frac{1}{n}\sum_i \mathbf{q}_i$。
2. 计算交叉协方差：$H = \sum_i (\mathbf{p}_i - \bar{\mathbf{p}})(\mathbf{q}_i - \bar{\mathbf{q}})^T$。
3. SVD分解：$H = U\Sigma V^T$。
4. 旋转：$R = VU^T$（若 $\det(R) = -1$ 则需做符号修正）。
5. 平移：$\mathbf{t} = \bar{\mathbf{q}} - R\bar{\mathbf{p}}$。

**为什么先算质心？** 将代价函数对 $\mathbf{t}$ 的导数置零可以证明，最优平移总是将源质心映射到目标质心。将其代回后问题被解耦：旋转仅在*中心化*后的点上求解，然后平移在第5步中随之得出。同样的构造再加上一个最优尺度因子 $s$（即**Umeyama**对齐法）正是轨迹评估工具在计算ATE之前，用来将估计轨迹与真值对齐所使用的方法——对于尺度不可观测的单目SLAM而言，尺度对齐的变体是必不可少的。

## ICP中的迭代部分

当对应关系*未知*时，ICP在以下两步之间交替进行：

1. **对应步骤**：对每个源点，在目标点集中找到最近邻（借助kd-树加速）。
2. **对齐步骤**：求解上述闭式问题并应用该变换。

重复直至收敛。ICP需要一个合理的初始猜测（它会收敛到局部最优），并且对外点敏感，因此实际变体会加入距离阈值、稳健核以及基于法向量的剔除。

## 点到平面及其它变体

**点到平面ICP（Point-to-plane ICP）**使用目标点的法向量 $\mathbf{n}_i$，将点到点度量替换为点到面度量：

$$\min_{R,\mathbf{t}} \sum_i \big(\mathbf{n}_i^T\,(R\mathbf{p}_i + \mathbf{t} - \mathbf{q}_i)\big)^2$$

允许点沿表面滑动，只惩罚垂直于表面方向的偏差——这更符合实际情况，因为"最近点"很少是真正的对应点。这种方法在光滑表面上收敛速度快得多，在RGB-D和LiDAR流程中占主导地位（KinectFusion使用的正是这种方法）。其代价是不再有闭式解；需要通过将旋转线性化（小角度近似）为每次迭代求解一个6x6的线性方程组。同一族方法的进一步改进包括Generalized-ICP（面到面，按协方差加权）以及LiDAR里程计（如LOAM）中使用的点到线度量。

## 常见陷阱

- **初始化不佳**：ICP的收敛域很小；应从里程计、匀速运动模型或全局方法给出初值——在发生大幅运动后，绝不要从单位变换开始。
- **部分重叠**：没有真实对应点的点会拖累估计结果；应按距离百分位数或稳健核裁剪对应关系。
- **退化几何**：单一平面会留下3个自由度不受约束（2个平移+1个平面内旋转）；狭长走廊和隧道同样会使解欠约束——可通过6x6正规方程矩阵的特征值来检测退化。
- **SVD带来的反射（镜像）**：务必施加 $\det(R) = -1$ 的符号修正；遗漏这一步会在含噪声或平面数据上得到一个镜像的"对齐"结果。

## 对SLAM的意义

ICP是稠密RGB-D SLAM的跟踪引擎（KinectFusion用点到平面ICP将每个深度帧与模型对齐），也是大多数LiDAR里程计系统的跟踪引擎，而SVD对齐步骤在每当两个子地图需要合并时的回环检测中也会再次出现。与2D-2D（无深度）和2D-3D（单侧有深度）一起，它补全了整套对应关系工具箱：具体使用哪一种，仅取决于3D信息在哪一侧可用。

## 动手实践

- [ICP hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch03_06)

## 相关条目

- [2D-2D correspondence](2d-2d-correspondence.md)
- [2D-3D correspondence](2d-3d-correspondence.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
- [Basic Linear Algebra](../level-01-beginner/basic-linear-algebra.md)
- [Metrics](metrics.md)
