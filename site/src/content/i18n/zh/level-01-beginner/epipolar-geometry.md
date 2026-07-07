# Epipolar geometry

当同一场景从两个不同的视角被观测时，**极线约束**限制了某个 3D 点在一幅图像中的投影，在另一幅图像中只能出现在一条称为**极线**的直线上。这是双视图重建和单目 SLAM 初始化的几何基础。

## 几何关系

两个相机中心与该 3D 点共同张成**极平面**。这个平面与每幅图像相交形成一条极线；连接两个相机中心的直线（基线）与每幅图像相交的点称为**极点**。图像中所有的极线都经过其极点。这带来的实际结果是：给定图像 1 中的一个特征，它在图像 2 中的匹配点必定位于一条已知的直线上——2D 搜索由此坍缩为 1D 搜索。

## Essential Matrix

对于两个*已标定*的相机（内参已知），**本质矩阵** $E$ 编码了两相机之间的相对旋转 $R$ 和平移 $\mathbf{t}$：

$$E = [\mathbf{t}]_\times R$$

其中 $[\mathbf{t}]_\times$ 是 $\mathbf{t} = [t_1, t_2, t_3]^T$ 的反对称矩阵：

$$[\mathbf{t}]_\times = \begin{bmatrix} 0 & -t_3 & t_2 \\ t_3 & 0 & -t_1 \\ -t_2 & t_1 & 0 \end{bmatrix}$$

对于在相机 1 的归一化坐标 $\mathbf{x}_1$ 和相机 2 的归一化坐标 $\mathbf{x}_2$ 处观测到的一个 3D 点，**极线约束**为：

$$\mathbf{x}_2^T E\, \mathbf{x}_1 = 0$$

**它从何而来。** 射线方向 $\mathbf{x}_2$、$R\mathbf{x}_1$ 与基线 $\mathbf{t}$ 必须共面（它们都位于极平面内）。三个向量共面意味着标量三重积为零：$\mathbf{x}_2 \cdot (\mathbf{t} \times R\mathbf{x}_1) = 0$，将叉积写成 $[\mathbf{t}]_\times$ 的形式，就恰好得到 $\mathbf{x}_2^T E\,\mathbf{x}_1 = 0$。

$E$ 具有**5 个自由度**（旋转 3 个，平移 3 个，减去尺度的 1 个），这正是最小求解器需要 5 对对应点的原因。它的 SVD 具有特殊形式 $\Sigma = \mathrm{diag}(\sigma, \sigma, 0)$——两个相等的奇异值和一个零奇异值。

**从 $E$ 恢复位姿。** 给定 $E = U\Sigma V^T$，其中 $\Sigma = \mathrm{diag}(1,1,0)$，四个候选位姿为 $[R_1|\pm\mathbf{t}]$ 和 $[R_2|\pm\mathbf{t}]$，其中

$$R_1 = UWV^T, \quad R_2 = UW^TV^T, \quad \mathbf{t} = \mathbf{u}_3, \quad W = \begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}$$

真实位姿通过**共视性检验（cheirality check）**来消除歧义：三角化出的点必须位于两个相机的前方。平移只能恢复到一个尺度因子——这正是单目尺度歧义的根源。

## Fundamental Matrix

对于两个*未标定*的相机，**基础矩阵** $F$ 关联原始像素坐标 $\mathbf{p}_1, \mathbf{p}_2$：

$$F = \mathbf{K}_2^{-T} E\, \mathbf{K}_1^{-1}, \qquad \mathbf{p}_2^T F\, \mathbf{p}_1 = 0$$

$F$ 是一个秩为 2 的 $3 \times 3$ 矩阵，具有 7 个自由度（在尺度意义下定义，且 $\det(F) = 0$）。它可以通过 8 点法（Longuet-Higgins, 1981）从 8 对或更多点对应中估计出来。图像 2 中对应于点 $\mathbf{p}_1$ 的极线就是 $\boldsymbol{\ell}_2 = F\,\mathbf{p}_1$，而极点则是 $F$ 和 $F^T$ 的零空间向量。

## Homography

当场景中所有点都共面，或相机只做纯旋转运动时，**单应性** $H$ 可以直接把图像点相互映射：

$$\lambda\mathbf{p}_2 = H\,\mathbf{p}_1, \qquad H \in \mathbb{R}^{3 \times 3}$$

单应性在 ORB-SLAM 中用于地图初始化：对特征匹配同时拟合单应性模型和基础矩阵模型，并选择得分更好的那一个——这是一种同时应对平面场景和一般场景的稳健方法。

## 需要留意的退化情形

- **纯旋转**（$\mathbf{t} = \mathbf{0}$）：$E = [\mathbf{0}]_\times R = 0$——此时本质矩阵未定义，无法恢复深度；此时应改用单应性来解释这种运动。
- **平面场景**：来自单一平面的对应关系满足单应性约束，此时 $F$/$E$ 的估计会变得存在歧义；这正是 ORB-SLAM 同时拟合两种模型的原因。
- **极小基线**：$E$ 的估计在数值上不稳定，三角化得到的深度也毫无意义；初始化过程需要等待足够的视差累积。

## 对SLAM的意义

极线几何是单目 SLAM 系统自举的方式：仅凭 2D-2D 特征匹配，它就能恢复相对相机位姿并三角化出最初的地图点。它还为立体匹配和引导式特征匹配提供了极线作为一维搜索约束，而极线约束正是 RANSAC 内部用来剔除错误匹配的标准几何验证手段。

## 动手实践

- [Epipolar geometry hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_02)
- [Homography hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_04)

## 相关条目

- [Pinhole camera model](pinhole-camera-model.md)
- [Triangulation](triangulation.md)
- [Rigid body motion](rigid-body-motion.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md)
