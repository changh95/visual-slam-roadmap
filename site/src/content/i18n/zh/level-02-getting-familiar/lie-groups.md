# Lie groups

相机位姿存在于$\mathrm{SE}(3)$中，旋转存在于$\mathrm{SO}(3)$中——这些是**流形（manifolds）**，而不是向量空间。你不能把两个旋转矩阵相加得到一个旋转矩阵，所以标准的"更新$x \leftarrow x + \Delta x$"优化方式不能直接应用。**李理论（Lie theory）**弥合了这一差距：每个李群（旋转/位姿所在的弯曲空间）都有一个关联的**李代数（Lie algebra）**（在单位元处与该群相切的平坦向量空间），二者通过指数映射和对数映射相连接。优化器在平坦的代数空间中工作，再将更新映射回群上。

**so(3)与SO(3)。**李代数$\mathfrak{so}(3)$由$3 \times 3$的反对称矩阵$[\boldsymbol{\phi}]_\times$组成，由向量$\boldsymbol{\phi} \in \mathbb{R}^3$参数化（轴乘以角度）。指数映射就是罗德里格斯旋转公式（Rodrigues' rotation formula）：

$$
R = \exp([\boldsymbol{\phi}]_\times) = I + \frac{\sin\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|}[\boldsymbol{\phi}]_\times + \frac{1-\cos\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^2}[\boldsymbol{\phi}]_\times^2
$$

对数映射$\log: \mathrm{SO}(3) \to \mathfrak{so}(3)$是其逆运算——它从旋转矩阵恢复出旋转向量。

**se(3)与SE(3)。**对于刚体位姿，$\mathfrak{se}(3)$的元素由$\boldsymbol{\xi} = [\boldsymbol{\rho}^T, \boldsymbol{\phi}^T]^T \in \mathbb{R}^6$参数化（平移部分$\boldsymbol{\rho}$，旋转部分$\boldsymbol{\phi}$）：

$$
\hat{\boldsymbol{\xi}} = \begin{bmatrix} [\boldsymbol{\phi}]_\times & \boldsymbol{\rho} \\ \mathbf{0}^T & 0 \end{bmatrix}, \qquad
T = \exp(\hat{\boldsymbol{\xi}}) = \begin{bmatrix} \exp([\boldsymbol{\phi}]_\times) & J\boldsymbol{\rho} \\ \mathbf{0}^T & 1 \end{bmatrix}
$$

其中$J$是$\mathrm{SO}(3)$的**左雅可比（left Jacobian）**：

$$
J = I + \frac{1 - \cos\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^2}[\boldsymbol{\phi}]_\times + \frac{\|\boldsymbol{\phi}\| - \sin\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^3}[\boldsymbol{\phi}]_\times^2
$$

**为什么这种参数化能胜出。**一个位姿恰好有6个自由度，$\boldsymbol{\xi} \in \mathbb{R}^6$是用于局部更新的*最小*、处理了奇异性的参数化：不需要维持任何约束（不同于$3\times4$矩阵或单位四元数），也没有万向锁问题（不同于欧拉角在其奇异点处的问题）。在SLAM优化中，每次迭代都在代数中求解一个小的更新量$\boldsymbol{\xi}$，并将其作为**扰动（perturbation）**施加到群上：

$$
T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}}) \quad \text{（右扰动）} \qquad \text{或} \qquad T \leftarrow \exp(\hat{\boldsymbol{\xi}}) \cdot T \quad \text{（左扰动）}
$$

残差（例如重投影误差）的雅可比是相对于$\boldsymbol{\xi}$求导得到的，并在$\boldsymbol{\xi} = 0$处求值。

## 一个完整的扰动雅可比推导实例

整套微积分都归结为一个操作：将$\exp$展开到一阶，$\exp([\delta\boldsymbol{\phi}]_\times) \approx I + [\delta\boldsymbol{\phi}]_\times$，并使用$[\mathbf{a}]_\times \mathbf{b} = -[\mathbf{b}]_\times \mathbf{a}$。对于一个在左扰动下被旋转的点$R\mathbf{p}$：

$$
\exp([\delta\boldsymbol{\phi}]_\times)\, R\,\mathbf{p} \;\approx\; (I + [\delta\boldsymbol{\phi}]_\times) R \mathbf{p}
= R\mathbf{p} + [\delta\boldsymbol{\phi}]_\times R\mathbf{p}
= R\mathbf{p} - [R\mathbf{p}]_\times\, \delta\boldsymbol{\phi}
$$

因此$\partial(R\mathbf{p})/\partial\,\delta\boldsymbol{\phi} = -[R\mathbf{p}]_\times$。右扰动版本遵循同样的两行推导，得到$-R[\mathbf{p}]_\times$。将其与投影雅可比$\partial\pi/\partial\mathbf{p}$链式相乘，你就推导出了每个光束法平差实现所使用的重投影误差雅可比——完全不需要查矩阵微积分表。

## 代码中的体现

Sophus是这套机制的独立C++实现（基于Eigen），其API与数学表达一一对应：

```cpp
#include <sophus/se3.hpp>

Eigen::Matrix<double, 6, 1> xi = ...;      // twist in se(3)
Sophus::SE3d T = Sophus::SE3d::exp(xi);    // exp map: algebra -> group
Eigen::Matrix<double, 6, 1> back = T.log();// log map: group -> algebra

T = T * Sophus::SE3d::exp(delta);          // right-perturbation update step
```

同样的模式内置于每一个SLAM库中：g2o的`SE3`顶点、Ceres的manifold（局部参数化），以及GTSAM的`Pose3`。这套机制还扩展到$\mathrm{Sim}(3)$（位姿+尺度），单目SLAM在回环检测中使用它,因为尺度会沿轨迹漂移。

## 常见陷阱

- **小角度数值问题**：$\exp$、$\log$和$J$中形如$\sin\theta/\theta$的系数在$\theta = 0$处是$0/0$；实现必须在接近零时切换到泰勒展开（库会做这件事——你自己的手写实现也必须这样做）。
- **接近$\pi$处的$\log$**：从接近$180°$的旋转中恢复轴向是病态的；在对大旋转进行平均或插值时要格外小心。
- **左右约定**：论文和库常常混用左/右扰动；两者的雅可比不同（见上面的推导实例），悄悄混用约定是"优化器收敛到垃圾结果"这类bug的经典来源。
- **四元数的双重覆盖**：$q$和$-q$编码同一个旋转；残差和插值必须处理符号问题,否则在接近$2\pi$处会出现误差。
- **在求解器中遗忘了流形约束**：将一个原始的4参数四元数或9参数旋转矩阵直接喂给优化器,而不使用局部参数化,会让更新脱离流形——Ceres的manifold API、g2o的顶点实现,以及GTSAM的类型,正是为了防止这种情况而存在。

## 对SLAM的意义

每一个基于优化的SLAM组件——光束法平差、位姿图优化、IMU预积分、直接图像对齐——都需要对位姿求残差的导数,而李群机制正是*如何*正确完成这件事的方法。位姿之间的残差本身就是通过$\log$来表达的（例如位姿图代价$\|\log(T_{ij}^{-1} T_i^{-1} T_j)\|^2$）。如果你不能流畅地读懂$\exp$/$\log$/扰动的符号表示,后端论文就无法读懂;一旦你能读懂,它们看起来都令人愉快地相似。

## 动手实践

- [Eigen + Sophus动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch03_05)

## 相关条目

- [刚体运动](../level-01-beginner/rigid-body-motion.md)
- [作为稀疏非线性最小二乘的MAP推断](map-inference-as-sparse-nonlinear-least-squares.md)
- [位姿图优化](pose-graph-optimization.md)
- [误差状态卡尔曼滤波的四元数动力学](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
- [Lietorch](../level-05-deep-learning/lietorch.md)
