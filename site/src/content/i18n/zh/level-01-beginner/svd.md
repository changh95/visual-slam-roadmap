# SVD (Singular Value Decomposition)

**奇异值分解（singular value decomposition）**可以说是SLAM中最重要的矩阵分解方法。任意矩阵 $A \in \mathbb{R}^{m \times n}$ 都可以写成

$$A = U \Sigma V^T$$

其中 $U \in \mathbb{R}^{m \times m}$ 和 $V \in \mathbb{R}^{n \times n}$ 是正交矩阵（$U^T U = I$，$V^T V = I$），$\Sigma \in \mathbb{R}^{m \times n}$ 是对角矩阵，其非负元素 $\sigma_1 \geq \sigma_2 \geq \cdots \geq 0$ 称为**奇异值（singular values）**。$U$ 和 $V$ 的列分别是左奇异向量和右奇异向量。

**几何解释**：每一个线性映射都是一次旋转/反射（$V^T$），接着是一次沿坐标轴方向的缩放（$\Sigma$），再接着是另一次旋转/反射（$U$）。奇异值衡量该映射沿其主方向对空间的拉伸程度。

## SVD 能告诉你关于一个矩阵的哪些信息

- **秩（Rank）**：非零奇异值的数量。一个接近于零的末尾奇异值表明系统（在数值上）秩不足——例如一个退化的点配置。
- **条件数（Conditioning）**：比值 $\sigma_1 / \sigma_r$（最大值除以最小非零值）就是条件数；数值较大意味着相应的最小二乘问题条件不良，解对噪声敏感。
- **零空间（Null space）**：与零奇异值相对应的右奇异向量张成了 $A$ 的零空间——这正是几何中的齐次线性系统所需要的。

## SVD 在SLAM中的主力用途

**齐次最小二乘（DLT）。** 三角化、单应性估计、相机标定以及八点法等问题都可以归结为

$$\min_{\mathbf{x}} \lVert A\mathbf{x} \rVert \quad \text{subject to} \quad \lVert \mathbf{x} \rVert = 1$$

其解为 $A$ 对应于最小奇异值的右奇异向量。

**施加矩阵约束。** 在 Frobenius 范数意义下，与估计得到的基础矩阵最接近的秩为 2 的矩阵，可以通过将其最小奇异值置零来获得。类似地，一个合法的本质矩阵必须具有 $(s, s, 0)$ 形式的奇异值，可以通过用 $\mathrm{diag}(1, 1, 0)$ 替换 $\Sigma$ 来强制实现。

**本质矩阵分解。** 给定 $E = U \Sigma V^T$，其中 $\Sigma = \mathrm{diag}(1,1,0)$，四个候选相对位姿由 $R_1 = U W V^T$、$R_2 = U W^T V^T$ 以及 $\mathbf{t} = \pm\mathbf{u}_3$（$U$ 的第三列）构成，其中

$$W = \begin{bmatrix} 0 & -1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & 1 \end{bmatrix}$$

正确的位姿由旋向性检验（cheirality check）来选定（三角化得到的点必须位于两个相机的前方）。

**点集的刚性对齐（Kabsch / Procrustes）。** 给定已匹配、已中心化的三维点集，构造交叉协方差 $H = \sum_i \mathbf{p}_i \mathbf{q}_i^T$，并计算 $H = U \Sigma V^T$。最优旋转为

$$R = V\, \mathrm{diag}\big(1,\, 1,\, \det(V U^T)\big)\, U^T$$

其中的行列式修正项用于防止出现反射。这个闭式解是 ICP 的内部步骤，也是三维-三维对应关系的标准求解方法。

**投影到旋转群上。** 一个带噪声的"近似旋转"矩阵（例如来自平均运算或数值漂移）可以用同样的方法修复：对其求 SVD，并用单位奇异值和行列式修正重建它。

**伪逆与低秩近似。** Moore-Penrose 伪逆为 $A^{+} = V \Sigma^{+} U^T$（对非零奇异值取逆），可以给出最小范数的最小二乘解。将 SVD 在第 $k$ 项之后截断，可以得到 $A$ 的最优秩 $k$ 近似（Eckart-Young 定理），用于降维和矩阵条件分析。

## 对SLAM的意义

SVD 出现在SLAM流水线中几乎每一个几何环节：从本质矩阵初始化相对位姿、通过 DLT 三角化地图点、在 ICP 内部进行点云对齐、对估计得到的基础矩阵/本质矩阵施加内部约束，以及通过检查奇异值间隔来诊断退化情形（平面场景、纯旋转）。熟练掌握"答案就是最小奇异值对应的奇异向量"这一点，能解开多视图几何中相当大一部分的问题。

## 相关条目

- [Basic Linear Algebra](basic-linear-algebra.md)
- [Triangulation](triangulation.md)
- [Epipolar geometry](epipolar-geometry.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [ICP](../level-04-rgbd-slam/icp.md)
