# Basic Linear Algebra

线性代数是 SLAM 的通用语言：点、位姿、残差和观测都是向量和矩阵，每一种求解器最终都归结为矩阵计算。

## 向量与矩阵

**向量** $\mathbf{v} \in \mathbb{R}^n$ 是由 $n$ 个实数组成的列。在 SLAM 中，向量表示点、平移、速度和残差。**矩阵** $A \in \mathbb{R}^{m \times n}$ 表示从 $\mathbb{R}^n$ 到 $\mathbb{R}^m$ 的线性映射。SLAM 几何中的核心对象就是矩阵-向量乘积 $A\mathbf{x} = \mathbf{b}$。

## 行列式

方阵的行列式 $\det(A)$ 度量线性映射 $A$ 带符号的体积缩放因子。关键事实：

- $\det(A) \neq 0 \Leftrightarrow A$ 可逆。
- 对于旋转矩阵 $R \in SO(3)$：$\det(R) = +1$。
- $\det(AB) = \det(A)\det(B)$。

## 点积与叉积

$\mathbf{u}, \mathbf{v} \in \mathbb{R}^3$ 的**点积**为 $\mathbf{u} \cdot \mathbf{v} = \mathbf{u}^T\mathbf{v} = \|\mathbf{u}\|\|\mathbf{v}\|\cos\theta$；它用于投影和检验正交性。**叉积** $\mathbf{u} \times \mathbf{v}$ 产生一个同时垂直于两者的向量，其模长为 $\|\mathbf{u}\|\|\mathbf{v}\|\sin\theta$。它出现在本质矩阵的反对称矩阵表达形式中，也用于计算表面法向量。

叉积可以用**反对称矩阵**写成矩阵-向量乘积的形式：

$$\mathbf{u} \times \mathbf{v} = [\mathbf{u}]_\times \mathbf{v}, \qquad [\mathbf{u}]_\times = \begin{bmatrix} 0 & -u_3 & u_2 \\ u_3 & 0 & -u_1 \\ -u_2 & u_1 & 0 \end{bmatrix}$$

这个小小的恒等式在 SLAM 中随处可见：本质矩阵为 $E = [\mathbf{t}]_\times R$，而 $\mathfrak{so}(3)$ 的李代数元素就是反对称矩阵。

## 秩、逆矩阵与转置

$A$ 的**秩**是其列空间的维数。在 SLAM 中，基础矩阵按构造具有秩 2，而当所有点共面时（这是 SLAM 初始化中的一种退化配置），点云矩阵是秩缺失的。**逆矩阵** $A^{-1}$ 满足 $AA^{-1} = I$，当且仅当 $\det(A) \neq 0$ 时存在。对于旋转矩阵，$R^{-1} = R^T$（正交性）——这一点被反复利用以避免计算完整的逆矩阵。

下面是一个用 NumPy 快速检验矩阵是否为有效旋转矩阵的例子：

```python
import numpy as np

theta = np.pi / 4
R = np.array([[np.cos(theta), -np.sin(theta), 0],
              [np.sin(theta),  np.cos(theta), 0],
              [0,              0,             1]])

print(np.allclose(R.T @ R, np.eye(3)))  # True: orthogonal
print(np.linalg.det(R))                 # 1.0: proper rotation
```

## 求解线性系统

SLAM 后端从不显式地对矩阵求逆；它们通过**分解**来求解：

- **Cholesky 分解**（$A = LL^T$）用于对称正定系统——光束法平差的正规方程 $J^TJ\,\Delta\mathbf{x} = -J^T\mathbf{e}$ 就是这样求解的（实践中使用稀疏 Cholesky 分解）。
- **QR 分解**是最小二乘问题在数值上更安全的替代方案，它直接作用于 $J$，而不需要构造 $J^TJ$（后者会使条件数平方）。
- **SVD** 是最稳健（也最昂贵）的选择，也是唯一能干净地处理秩缺失、齐次系统 $A\mathbf{x} = \mathbf{0}$ 的方法。

## 奇异值分解（SVD）

SVD 是 SLAM 中最重要的矩阵分解。任意矩阵 $A \in \mathbb{R}^{m \times n}$ 可以分解为

$$A = U \Sigma V^T$$

其中 $U$ 和 $V$ 是正交矩阵，$\Sigma$ 是对角矩阵，其对角元为非负的**奇异值** $\sigma_1 \geq \sigma_2 \geq \cdots \geq 0$。从几何上看，任何线性映射都可以看作一次旋转/反射，接着是逐坐标的缩放，再接着是另一次旋转/反射。SVD 在 SLAM 中的应用：

- **本质矩阵分解**：对 $E$ 做 SVD 得到四个候选相对位姿 $[R|\pm\mathbf{t}]$。
- **DLT 三角化**：解是 $A$ 对应最小奇异值的右奇异向量。
- **ICP 对齐**：对交叉协方差矩阵 $H = \sum_i \mathbf{p}_i \mathbf{q}_i^T$ 做 SVD 可得到最优旋转。

比值 $\sigma_1/\sigma_n$ 是**条件数**：它衡量线性求解对输入噪声的放大程度。病态系统（条件数巨大）正是坐标归一化在 8 点法和 DLT 中如此重要的原因。

## 特征值与特征向量

满足 $A\mathbf{v} = \lambda\mathbf{v}$ 的非零向量 $\mathbf{v}$ 和标量 $\lambda$ 分别是 $A$ 的**特征向量**和**特征值**。Harris 角点检测器根据结构张量的特征值对图像局部区域进行分类，而点云的 PCA 则利用协方差矩阵的特征向量来找到主方向（例如拟合一个平面）。对于对称矩阵（协方差矩阵、结构张量、$J^TJ$），特征值是实数且特征向量相互正交——此时特征分解与 SVD 是一致的。

## 常见陷阱

- **显式地对矩阵求逆**（`inv(A) @ b`）而不是直接求解（`np.linalg.solve`、Cholesky 分解）：速度更慢、精度更低。
- **求解齐次系统前忘记归一化**——DLT 和 8 点法在原始像素坐标上的表现会严重退化。
- **基于 SVD 的旋转恢复中的符号/反射歧义**：务必检查 $\det(R) = +1$，如果得到的是反射，则通过翻转符号来纠正。

## 对SLAM的意义

SLAM 流水线的每一个阶段本质上都是伪装过的线性代数：点的投影使用矩阵乘积，最小求解器（8 点法、DLT、ICP）都归结为 SVD，而光束法平差的正规方程则是一个大型稀疏线性系统。熟练掌握这些内容——尤其是 SVD、正交矩阵和秩——是能够读懂 SLAM 论文并调试几何代码的基础。

## 相关条目

- [Basic Calculus](basic-calculus.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Triangulation](triangulation.md)
- [Math libraries](../level-02-getting-familiar/math-libraries.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
