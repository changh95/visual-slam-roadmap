# PnP (Perspective-n-Point)

**PnP（Perspective-n-Point，n 点透视）**问题：给定在已知地图（世界）坐标系中表示的 $n$ 个 3D 点 $\mathbf{X}_i$、它们在相机图像中的 2D 投影 $\mathbf{u}_i$，以及内参矩阵 $\mathbf{K}$，估计满足下式的相机位姿 $[R \mid \mathbf{t}]$

$$
\lambda_i \begin{bmatrix} \mathbf{u}_i \\ 1 \end{bmatrix} = \mathbf{K} \left( R \mathbf{X}_i + \mathbf{t} \right)
$$

其中 $\lambda_i$ 为某些正的深度值。PnP 是**2D–3D 对应关系**的主力方法：与基于 2D–2D 匹配的本质矩阵估计不同，它能够以**度量尺度（metric scale）**恢复平移，因为 3D 点本身已经携带了尺度信息。

## 主要求解方法

**P3P（最小求解器）。** 三组对应关系就足够了（位姿有 6 个自由度；每个 2D 点提供 2 个约束）。每一对图像射线之间夹角 $\theta_{ij}$ 是已知的（由标定后的方向向量计算得到），余弦定理约束了未知的点深度 $d_i = \lVert R\mathbf{X}_i + \mathbf{t} \rVert$：

$$
d_i^2 + d_j^2 - 2 d_i d_j \cos\theta_{ij} = \lVert \mathbf{X}_i - \mathbf{X}_j \rVert^2
$$

这三个方程可以化简为一个四次多项式，**最多有 4 个实数解**。第 4 组对应关系用于消除歧义。P3P 是 RANSAC 内部使用的最小求解器——较小的样本量能使所需的迭代次数保持在较低水平。

**DLT（直接线性变换）。** 从 $n \geq 6$ 组对应关系出发，线性求解 $3 \times 4$ 的投影矩阵 $P$（每个点给出 2 个齐次线性方程；将其堆叠起来，通过 SVD 求解 $A\mathbf{p} = 0$）。然后通过分解 $P = \mathbf{K}[R \mid \mathbf{t}]$（RQ 分解）提取位姿。方法简单，但在求解过程中忽略了已知的内参，且最小化的是代数误差（而非几何误差），因此精度不如专用求解器。

**EPnP。** 将所有 $n$ 个 3D 点表示为 **4 个虚拟控制点**的加权和：

$$
\mathbf{X}_i = \sum_{j=1}^{4} \alpha_{ij} \mathbf{c}_j, \qquad \sum_j \alpha_{ij} = 1
$$

重心权重 $\alpha_{ij}$ 对刚体变换是不变的，因此问题被简化为在相机坐标系中估计控制点的 12 个坐标，与 $n$ 的大小无关。复杂度为 $O(n)$，这使得 EPnP 成为处理大规模对应集合（例如重定位）的标准非最小求解器。

**迭代精化。** 无论初始位姿由哪种求解器给出，最终答案都通过最小化总的**重投影误差**加以精化

$$
\min_{R, \mathbf{t}} \sum_i \left\lVert \mathbf{u}_i - \pi\!\left(\mathbf{K}, R\mathbf{X}_i + \mathbf{t}\right) \right\rVert^2
$$

使用高斯-牛顿或列文伯格-马夸尔特方法（这正是带迭代标志的 `cv::solvePnP` 以及 ORB-SLAM 中的"仅运动光束法平差（motion-only bundle adjustment）"所做的事情）。

## 鲁棒估计

真实的 2D–3D 匹配集合中包含外点（错误的描述子匹配、被移动的物体）。标准流程是**P3P + RANSAC**：采样 3 组对应关系，求解 P3P，按重投影误差阈值（几个像素）统计内点数量，保留最佳模型，然后用 M 估计器或普通最小二乘对所有内点进行精化。

## 对SLAM的意义

- **跟踪**：基于特征的 SLAM（PTAM、ORB-SLAM）通过将当前帧的关键点与已经三角化的地图点进行匹配，并求解 PnP，来估计每一帧的位姿——这正是跟踪线程的核心。
- **重定位与回环闭合**：在跟踪丢失或找到回环候选之后，针对存储的地图求解 PnP 可以从头恢复位姿。
- **度量尺度**：由于 3D 点确定了尺度，基于 PnP 的跟踪不会遭受纯 2D–2D 运动估计所存在的尺度不确定性问题。
- 一个实用的 VO 流程是：检测 ORB 特征、匹配、用 RANSAC 剔除外点、用 EPnP/P3P 估计位姿，再用高斯-牛顿/LM 进行精化。

## 动手实践

- [Perspective-n-points hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_09)

## 相关条目

- [2D-3D correspondence](2d-3d-correspondence.md)
- [RANSAC](ransac.md)
- [Reprojection error](reprojection-error.md)
- [Gauss-Newton](gauss-newton.md)
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md)
