# Triangulation

给定相机位姿以及两个或更多视图中的对应图像点，**三角化（triangulation）**恢复出生成这些观测的三维点。这一步把匹配的二维观测转变为地图几何结构。

## DLT 方法

对于投影矩阵为 $P_i$ 的相机 $i$，以及观测到的齐次点 $\mathbf{p}_i = [u_i, v_i, 1]^T$，投影关系给出 $\lambda_i \mathbf{p}_i = P_i\mathbf{X}$。通过叉乘消去未知的尺度 $\lambda_i$：

$$\mathbf{p}_i \times (P_i\mathbf{X}) = \mathbf{0}$$

将 $P_i$ 的各行写作 $\mathbf{r}_1^T, \mathbf{r}_2^T, \mathbf{r}_3^T$，每个视图给出两个独立方程：

$$\big(u_i\,\mathbf{r}_3^T - \mathbf{r}_1^T\big)\mathbf{X} = 0, \qquad \big(v_i\,\mathbf{r}_3^T - \mathbf{r}_2^T\big)\mathbf{X} = 0$$

将来自 $N$ 个视图的方程堆叠起来,得到一个齐次系统：

$$A\mathbf{X} = \mathbf{0}, \qquad A \in \mathbb{R}^{2N \times 4}$$

最小二乘解是 $A$ 对应于最小奇异值的右奇异向量——这是 SVD 的一个直接应用。这就是**直接线性变换（Direct Linear Transform, DLT）**方法。将齐次解除以其第四个分量,即可得到欧几里得点。

## 中点法

中点法寻找使到各投影射线的距离平方和最小的三维点：

$$\mathbf{X}^* = \arg\min_{\mathbf{X}} \sum_i d^2(\mathbf{X},\ \mathrm{ray}_i)$$

该方法有闭式解，在各射线近乎平行时（例如接近纯前向运动，此时 DLT 的条件会变差）是更优的选择。对于两个视图，它简化为寻找两条射线之间的最短线段并取其中点。

## 双目特殊情形

对于基线为 $b$、焦距为 $f_x$ 的已校正双目相机对，三角化简化为一行公式。深度为 $Z$ 的一个点在两幅图像之间出现的水平**视差（disparity）**为 $d$，且

$$Z = \frac{b\, f_x}{d}$$

由于深度与视差成反比,一个固定的、只占一个像素一小部分的匹配误差,会转化为随距离迅速增长的深度误差——这正是双目视觉（以及三角化本身）在远距离点和小基线情况下性能退化的原因。

## 实际系统中使用的质量检查

- **视差角（Parallax angle）**：两条观测射线之间的夹角。较宽的基线能给出条件良好的交点；极小的视差会产生深度不确定性极大的点。SLAM系统在接受一个新的地图点之前会检查该角度。
- **正深度（旋向性，cheirality）**：三角化得到的点必须位于*两个*相机的前方；负深度意味着匹配或位姿假设有误。
- **重投影误差**：将三角化得到的点重新投影回每个视图，并与观测值进行比较；如果残差超过阈值则拒绝该点。
- 线性方法（DLT、中点法）给出一个初始估计；对精度要求较高的流水线会通过最小化重投影误差来精化该点,这正是光束法平差对所有点和位姿联合执行的操作。

## 常见陷阱

- **对一切都进行三角化**：保留低视差的点会用深度基本不受约束的地图点污染地图,使后续优化变得不稳定。
- **混用坐标约定**：DLT 期望的是一致的投影矩阵 $P_i = \mathbf{K}[R|\mathbf{t}]$，将世界坐标映射到图像坐标；如果传入从相机到世界的位姿，会产生看起来似乎合理、实则错误的结果。
- **过度信任 DLT 的代数误差**：DLT 最小化的是一个代数量，而非几何量；为了保证精度，应在其后接一次重投影误差的精化。

## 对SLAM的意义

三角化是SLAM地图增长的方式：在对极几何（或 PnP）提供相机位姿之后，每一个新的特征匹配都可以通过三角化成为候选的三维地图点。它也是经典单目自举方案的一半——先从本质矩阵恢复相对位姿，再三角化出初始地图——而围绕它的质量检查（视差、重投影误差、正深度）正是区分稳健系统与脆弱系统的关键所在。

## 动手实践

- [Triangulation hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_07)

## 相关条目

- [Epipolar geometry](epipolar-geometry.md)
- [Pinhole camera model](pinhole-camera-model.md)
- [Basic Linear Algebra](basic-linear-algebra.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)
- [Landmark](../level-02-getting-familiar/landmark.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
