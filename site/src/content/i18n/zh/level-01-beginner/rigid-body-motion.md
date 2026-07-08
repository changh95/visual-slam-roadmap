# Rigid body motion

**刚体运动（rigid body motion，刚性变换）**保持所有点之间的距离不变。在三维空间中，它由一个旋转和一个平移组成，而表示它的数学结构——$SO(3)$ 和 $SE(3)$——在SLAM中处于核心地位：相机位姿*本身*就是 $SE(3)$ 的一个元素。

## 旋转的表示方法

**欧拉角（Euler angles）。** 一个旋转可以由三个角度 $(\phi, \theta, \psi)$ 参数化，表示绕固定轴或绕体坐标轴依次进行的旋转；12 种可能的约定（ZYX、XYZ 等）各自给出不同的角度序列。**万向锁（gimbal lock）**问题发生在两个旋转轴对齐时，使得有效自由度降为 2。欧拉角在显示时很直观，但在数值上存在问题——在迭代优化中应避免使用。

**旋转矩阵（Rotation matrices）。** 旋转矩阵满足 $R^TR = I$ 且 $\det(R) = +1$。所有这样的矩阵构成**特殊正交群（Special Orthogonal Group）**：

$$SO(3) = \{R \in \mathbb{R}^{3\times3} \mid R^TR = I,\ \det(R) = +1\}$$

旋转矩阵是用于计算的首选表示方式：矩阵乘法即是复合运算，而逆运算只需简单地取转置。

**四元数（Quaternions）。** 单位四元数 $q = w + xi + yj + zk$（满足 $w^2+x^2+y^2+z^2 = 1$）表示绕轴 $[x,y,z]^T/\sin(\theta/2)$ 旋转角度 $\theta = 2\arccos(w)$。它们很紧凑（4 个数字对比 9 个），没有万向锁问题，并通过哈密顿积（Hamilton product）进行复合。请注意其双重覆盖性质：$q$ 与 $-q$ 表示同一个旋转。

从四元数转换为旋转矩阵：

$$
R = \begin{bmatrix}
1 - 2(y^2+z^2) & 2(xy - wz) & 2(xz + wy) \\
2(xy + wz) & 1 - 2(x^2+z^2) & 2(yz - wx) \\
2(xz - wy) & 2(yz + wx) & 1 - 2(x^2+y^2)
\end{bmatrix}
$$

一个快速的 NumPy 检验，用于确认某矩阵是否为合法的旋转矩阵：

```python
import numpy as np
# R is a rotation iff R^T R = I and det(R) = +1
print(np.allclose(R.T @ R, np.eye(3)), np.isclose(np.linalg.det(R), 1.0))
```

## 齐次变换：$T \in SE(3)$

刚体运动将旋转 $R$ 和平移 $\mathbf{t}$ 组合成一个作用于齐次坐标的 $4\times4$ 矩阵：

$$
T = \begin{bmatrix} R & \mathbf{t} \\ \mathbf{0}^T & 1 \end{bmatrix} \in SE(3), \qquad
T\begin{bmatrix}\mathbf{X}\\1\end{bmatrix} = \begin{bmatrix} R\mathbf{X} + \mathbf{t} \\ 1 \end{bmatrix}
$$

复合运算即为矩阵乘法，其中旋转和平移相互交织：

$$T_1 T_2 = \begin{bmatrix} R_1R_2 & R_1\mathbf{t}_2 + \mathbf{t}_1 \\ \mathbf{0}^T & 1 \end{bmatrix}$$

——注意 $\mathbf{t}_2$ 会被 $R_1$ 旋转，这也是为什么链式变换的平移量*不会*简单地相加。其逆运算有闭合形式：

$$T^{-1} = \begin{bmatrix} R^T & -R^T\mathbf{t} \\ \mathbf{0}^T & 1 \end{bmatrix}$$

齐次坐标来自**投影空间（projective space）**：在点坐标后添加 1（或在方向向量后添加 0），使得一个矩阵就能同时表达旋转和平移。在投影几何中，三维空间里平行的直线会在图像中相交于一个**消失点（vanishing point）**——这在人造环境中的旋转估计中是一个有用的线索，也提醒我们成像过程是投影性的，而非欧几里得式的。

## 保持坐标系清晰

最有效的习惯是采用一种能够自我检查复合运算的下标约定：令 $T_{AB}$ 表示*把坐标从坐标系 $B$ 映射到坐标系 $A$*。那么

$$T_{AC} = T_{AB}\,T_{BC}, \qquad \mathbf{X}_A = T_{AB}\,\mathbf{X}_B$$

相邻的下标必须像单位一样能够"相消"。如果不能相消，那么这个表达式就是错的——这一点能一眼看出相当大比例的位姿运算错误。要明确地说明所存储的"相机位姿"到底指的是 $T_{world,cam}$（从相机到世界的变换，即相机在世界中的位置）还是它的逆 $T_{cam,world}$（投影中所使用的外参）；这两种约定在各代码库中都很常见。

## 常见陷阱

- **哈密顿（Hamilton）与 JPL 四元数约定之分**：文献中同时存在两种互不兼容的四元数乘法定义（Eigen 和 ROS 使用哈密顿约定）；混用它们会在不知不觉中把旋转共轭化。
- **四元数存储顺序**：`(w, x, y, z)` 与 `(x, y, z, w)` 在不同库之间存在差异（例如 Eigen 的构造函数与其内部布局、ROS 消息格式）；使用前务必用一个已知的旋转进行测试。
- **偏离流形（manifold）**：反复对旋转矩阵做乘法或对四元数做积分会累积数值误差；应定期对矩阵重新正交化（例如通过 SVD）或对四元数重新归一化。
- **双重覆盖下的符号翻转**：在 $q$ 与邻近的 $-q'$ 之间插值会绕远路；如果点积为负，应先翻转符号。

## 对SLAM的意义

每一个SLAM系统本质上都是在估计一条由 $SE(3)$ 元素构成的轨迹。链式组合相对运动（$T_{world,cam} = T_{world,kf}\,T_{kf,cam}$）、求变换的逆，以及在四元数（紧凑存储、ROS 消息）与旋转矩阵（计算）之间相互转换，都是日常操作。正确处理坐标系约定——一个变换是从哪个坐标系映射到哪个坐标系——是新手最常见的 bug 来源，因此在继续学习之前务必把这一点搞清楚。

## 相关条目

- [Logarithm & Exponential](logarithm-and-exponential.md)
- [Pinhole camera model](pinhole-camera-model.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
