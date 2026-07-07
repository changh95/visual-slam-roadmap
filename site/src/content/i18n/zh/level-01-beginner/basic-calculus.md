# Basic Calculus

SLAM 的后端把大部分时间都花在最小化非线性代价函数上。微积分中的两个工具让这件事变得可行：**求导**（雅可比矩阵）和**泰勒展开**（线性化）。

## 求导与雅可比矩阵

标量函数 $f: \mathbb{R}^n \to \mathbb{R}$ 具有梯度 $\nabla f = \left[\frac{\partial f}{\partial x_1}, \ldots, \frac{\partial f}{\partial x_n}\right]^T$。向量函数 $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$ 具有**雅可比矩阵**：

$$J = \frac{\partial \mathbf{f}}{\partial \mathbf{x}} =
\begin{bmatrix}
\frac{\partial f_1}{\partial x_1} & \cdots & \frac{\partial f_1}{\partial x_n} \\
\vdots & \ddots & \vdots \\
\frac{\partial f_m}{\partial x_1} & \cdots & \frac{\partial f_m}{\partial x_n}
\end{bmatrix} \in \mathbb{R}^{m \times n}$$

雅可比矩阵是 SLAM 优化中的关键工具：给定一个残差 $\mathbf{e}(\mathbf{x})$（例如重投影误差），其雅可比矩阵 $J = \frac{\partial \mathbf{e}}{\partial \mathbf{x}}$ 告诉我们残差如何随状态的小扰动变化——这正是高斯-牛顿法和列文伯格-马夸尔特法所需要的信息。

## SLAM 残差中的链式法则

SLAM 残差几乎总是若干更简单函数的*复合*，因此它们的雅可比矩阵来自**链式法则**。在位姿 $T$ 下、在像素 $\mathbf{z}$ 处观测到的地图点 $\mathbf{X}$ 的重投影误差为

$$\mathbf{e} = \mathbf{z} - \pi\big(T\,\mathbf{X}\big)$$

这是（1）刚体变换、（2）透视除法和（3）内参映射三者的复合。其雅可比矩阵可以分解为乘积：

$$\frac{\partial \mathbf{e}}{\partial \mathbf{x}} = -\,\frac{\partial \pi}{\partial \mathbf{X}_c}\cdot\frac{\partial \mathbf{X}_c}{\partial \mathbf{x}}$$

其中 $\mathbf{X}_c = T\mathbf{X}$ 是相机坐标系下的点。分别推导每一项再相乘，比一次性对整个表达式求导要不容易出错得多——这也正是 SLAM 库组织其解析雅可比矩阵的方式。

## 泰勒展开

泰勒级数在点 $x_0$ 附近展开光滑函数 $f$：

$$f(x) = f(x_0) + f'(x_0)(x - x_0) + \frac{1}{2!}f''(x_0)(x - x_0)^2 + \cdots$$

对于多元函数 $f(\mathbf{x})$ 在 $\mathbf{x}_0$ 附近：

$$f(\mathbf{x}) \approx f(\mathbf{x}_0) + J(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0) + \frac{1}{2}(\mathbf{x} - \mathbf{x}_0)^T H(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0)$$

其中 $J$ 是雅可比矩阵（一阶项），$H$ 是海森矩阵（二阶项）。截断到一阶得到高斯-牛顿法所用的*线性近似*；截断到二阶得到牛顿法所用的*二次近似*。

## 从泰勒展开到高斯-牛顿法

考虑最小化残差平方和 $F(\mathbf{x}) = \frac{1}{2}\|\mathbf{e}(\mathbf{x})\|^2$。在当前估计值附近对残差线性化，$\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e} + J\Delta\mathbf{x}$，代入后得到：

$$F(\mathbf{x} + \Delta\mathbf{x}) \approx \frac{1}{2}\|\mathbf{e}\|^2 + \mathbf{e}^T J\,\Delta\mathbf{x} + \frac{1}{2}\Delta\mathbf{x}^T J^T J\,\Delta\mathbf{x}$$

这是关于 $\Delta\mathbf{x}$ 的二次函数；令其导数为零，得到**正规方程**：

$$(J^T J)\,\Delta\mathbf{x} = -J^T \mathbf{e}$$

因此高斯-牛顿法本质上是"用 $H \approx J^T J$ 近似的牛顿法"——真实海森矩阵中的二阶导数项被舍去了，当残差较小时这是一个很好的近似。列文伯格-马夸尔特法加入了一个阻尼项，求解 $(J^TJ + \lambda I)\Delta\mathbf{x} = -J^T\mathbf{e}$，在高斯-牛顿法（$\lambda \to 0$）和梯度下降法（$\lambda$ 较大）之间插值。

## 数值检查雅可比矩阵

解析雅可比矩阵出错是出了名的容易（一个符号、一个转置错位的分块）。标准的合理性检查是**中心差分法**：每次扰动一个状态维度，比较

$$J_{:,k} \approx \frac{\mathbf{e}(\mathbf{x} + h\,\mathbf{1}_k) - \mathbf{e}(\mathbf{x} - h\,\mathbf{1}_k)}{2h}$$

其中步长很小（例如 $h \sim 10^{-6}$）。每一个正规的 SLAM 代码库都会针对每种残差类型编写这样的单元测试。

## 常见陷阱

- **符号错误**：残差写成 $\mathbf{z} - \pi(\cdot)$ 还是 $\pi(\cdot) - \mathbf{z}$，会使 $J$ 的符号翻转；务必保持一致。
- **对旋转求导时的粗心处理**：旋转矩阵是有约束的，因此导数必须相对于局部扰动来求（参见[Lie groups](../level-02-getting-familiar/lie-groups.md)），而不是对 9 个矩阵元素直接求导。
- **在归一化或畸变函数中遗漏链式法则因子**——上面的数值检查会立刻发现这个问题。

## 对SLAM的意义

在光束法平差中，重投影误差 $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\Delta\mathbf{x}$ 在当前估计值附近被线性化。这把非线性最小二乘问题转化为一系列线性系统 $(J^T J)\Delta\mathbf{x} = -J^T \mathbf{e}$，通过迭代求解。每一个基于优化的 SLAM 系统——从位姿图优化到完整的光束法平差——都建立在这个"线性化-求解-更新"循环之上，因此能够手动推导雅可比矩阵（并用数值方法检验）是一项核心技能。

## 相关条目

- [Basic Linear Algebra](basic-linear-algebra.md)
- [Logarithm & Exponential](logarithm-and-exponential.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
