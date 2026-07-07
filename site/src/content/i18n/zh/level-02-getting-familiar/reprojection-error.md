# 重投影误差

**重投影误差(Reprojection error)**是视觉SLAM中最基本的几何残差：它衡量一个假设的三维点和相机位姿在多大程度上能够解释一次实际的二维特征观测。取一个三维点 $\mathbf{X}_j$(世界坐标系)、一个相机位姿 $T_i \in SE(3)$(世界到相机),以及该点在图像 $i$ 中被观测到的像素位置 $\mathbf{z}_{ij}$：

$$
\mathbf{e}_{ij} = \mathbf{z}_{ij} - \pi\!\left(T_i \mathbf{X}_j\right)
$$

其中 $\pi : \mathbb{R}^3 \to \mathbb{R}^2$ 是相机投影函数。对于内参为 $(f_x, f_y, c_x, c_y)$ 的针孔相机,以及相机坐标系下的点 $\mathbf{X}^c = (X, Y, Z)^T = T_i \mathbf{X}_j$：

$$
\pi(\mathbf{X}^c) = \begin{bmatrix} f_x \, X / Z + c_x \\ f_y \, Y / Z + c_y \end{bmatrix}
$$

该误差以**像素**为单位——可以直接与特征检测器的定位噪声(通常约为一个像素)相比较,这使得设置阈值和协方差变得容易。

## 从残差到代价函数

在观测噪声为高斯分布 $\mathbf{z}_{ij} \sim \mathcal{N}\left(\pi(T_i\mathbf{X}_j), \Sigma_{ij}\right)$ 的假设下,对位姿和地图点的最大似然估计恰好就是加权非线性最小二乘问题

$$
C = \sum_{(i,j) \in \mathcal{O}} \mathbf{e}_{ij}^T \, \Omega_{ij} \, \mathbf{e}_{ij}
$$

其中 $\Omega_{ij} = \Sigma_{ij}^{-1}$ 是**信息矩阵**,$\mathcal{O}$ 是(位姿,地图点)观测对的集合。每一项都是一个平方马氏距离;实践中 $\Sigma_{ij}$ 通常是各向同性的,并根据该特征被检测到的图像金字塔层级进行缩放(层级越粗糙=噪声越大=权重越低)。

由于错误匹配会产生巨大的残差,足以主导二次代价函数,实际系统会将每一项包裹在一个**鲁棒核函数** $\rho$(Huber、Cauchy)中,得到 $\sum \rho\left(\mathbf{e}_{ij}^T \Omega_{ij} \mathbf{e}_{ij}\right)$,并剔除卡方值超过阈值的观测。

## 优化

该代价函数在位姿上是非线性的(通过 $SE(3)$ 作用以及透视除法)。围绕当前估计将 $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J \Delta\mathbf{x}$ 线性化,并迭代求解高斯-牛顿正则方程 $\left(J^T \Omega J\right)\Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$,是标准做法。根据链式法则,雅可比矩阵可分解为

$$
\frac{\partial \mathbf{e}}{\partial (\cdot)} = -\frac{\partial \pi}{\partial \mathbf{X}^c} \cdot \frac{\partial \mathbf{X}^c}{\partial (\cdot)}
$$

其中 $\partial \pi / \partial \mathbf{X}^c$ 是一个 $2 \times 3$ 矩阵,包含 $1/Z$ 以及 $-X/Z^2$、$-Y/Z^2$ 项;第二个因子则根据我们对位姿求导(通过李代数扰动,得到 $2 \times 6$)还是对地图点求导(得到 $2 \times 3$)而有所不同。

## 哪些问题在最小化它

- **仅优化运动**(PnP细化/跟踪)：固定地图点,优化单个位姿。
- **仅优化结构**(三角化细化)：固定位姿,优化地图点。
- **完整光束法平差**：联合优化所有位姿和地图点——这是黄金标准。

可供对比的替代方案：**光度误差**(直接法比较像素强度而非特征位置)以及**三维点到点/点到面误差**(ICP)。当存在可靠的特征对应关系时,重投影误差是首选,因为它的像素空间噪声模型与测量实际产生的方式相匹配。

## 对SLAM的意义

- 它是视觉SLAM的观测模型：几乎每一个基于特征的估计器——PnP细化、三角化、局部和全局光束法平差、因子图中的视觉因子——都在最小化它。
- 它的卡方统计量为匹配剔除和RANSAC内点计数提供了原理性的**离群点检验**方法。
- 它的雅可比结构(每个误差项恰好耦合一个位姿和一个地图点)造就了通过Schur补使光束法平差可处理的稀疏性。

## 相关条目

- [光束法平差](bundle-adjustment.md)
- [PnP(透视n点法)](pnp.md)
- [高斯-牛顿法](gauss-newton.md)
- [M估计量](m-estimator.md)
- [针孔相机模型](../level-01-beginner/pinhole-camera-model.md)
