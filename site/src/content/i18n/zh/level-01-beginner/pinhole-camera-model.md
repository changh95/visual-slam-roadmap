# Pinhole camera model

针孔相机（pinhole camera）是SLAM中大多数相机所采用的标准模型。来自三维点的光线穿过一个小孔（光心，optical centre）并投影到图像平面上。该模型描述的是**图像投影（image projection）**：三维世界中的一个点如何映射到二维像素。

## 坐标系

涉及四个坐标系：

1. **世界坐标系（World frame）** $\mathbf{X}_w = [X_w, Y_w, Z_w]^T$：固定的参考坐标系。
2. **相机坐标系（Camera frame）** $\mathbf{X}_c = [X_c, Y_c, Z_c]^T$：$Z_c$ 是光轴方向（向前）。
3. **图像平面（Image plane）** $\mathbf{x}' = [x', y']^T$：图像平面上的度量坐标。
4. **像素坐标系（Pixel frame）** $\mathbf{u} = [u, v]^T$：离散的像素坐标。

通常的约定是 $X_c$ 指向右方，$Y_c$ 指向下方，$Z_c$ 指向前方——这与像素坐标 $u$（向右）、$v$（向下）相匹配，原点位于图像的左上角。

## 投影流程

**第一步：世界坐标到相机坐标。** 刚体变换（外参，extrinsic parameters）将世界坐标点转换到相机坐标系：

$$\mathbf{X}_c = R\mathbf{X}_w + \mathbf{t}$$

**第二步：相机坐标到图像平面（透视除法，perspective division）。**

$$x' = \frac{X_c}{Z_c}, \qquad y' = \frac{Y_c}{Z_c}$$

这种对深度的除法正是透视效应的来源——也正是使视觉几何变得有趣的那种非线性性的来源。坐标 $(x', y')$ 被称为**归一化坐标（normalized coordinates）**：它们是一个像素在剔除内参之后所剩下的东西，大多数几何推导（本质矩阵、三角化）在这个坐标系下最为简洁。

**第三步：图像平面到像素坐标（内参，intrinsic parameters）。**

$$u = f_x \cdot x' + c_x, \qquad v = f_y \cdot y' + c_y$$

其中 $f_x, f_y$ 是以像素为单位的焦距，$(c_x, c_y)$ 是主点（principal point）。像素焦距把以毫米为单位的物理焦距 $f$ 与像素尺寸联系起来：$f_x = f / (\text{像素宽度})$，这也是为什么当像素不是正方形时 $f_x \neq f_y$。

## 矩阵形式

将所有步骤组合在齐次坐标下：

$$Z_c \begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \underbrace{\begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix}}_{\mathbf{K}} \begin{bmatrix} R & \mathbf{t} \end{bmatrix} \begin{bmatrix} X_w \\ Y_w \\ Z_w \\ 1 \end{bmatrix}$$

矩阵 $\mathbf{K}$ 是**相机内参矩阵（camera intrinsic matrix）**，而 $P = \mathbf{K}[R|\mathbf{t}]$ 是 $3 \times 4$ 的**相机投影矩阵（camera projection matrix）**。在一般情形下，$\mathbf{K}$ 还包含一个倾斜参数（skew，对现代相机通常为零）。

该流程的一个直接的 NumPy 翻译：

```python
import numpy as np

def project(K, R, t, X_w):
    X_c = R @ X_w + t          # world -> camera
    x_n = X_c[:2] / X_c[2]     # perspective division (normalized coords)
    u   = K[0, 0] * x_n[0] + K[0, 2]
    v   = K[1, 1] * x_n[1] + K[1, 2]
    return np.array([u, v])
```

## 反投影：逆过程是一条射线

投影会丢失一个维度：一个像素并不能确定一个三维点，只能确定一条**射线（ray）**。给定像素 $\mathbf{u}$，其在相机坐标系中可能对应的三维点所构成的射线为

$$\mathbf{X}_c(\lambda) = \lambda\,\mathbf{K}^{-1}\begin{bmatrix}u\\v\\1\end{bmatrix}, \qquad \lambda > 0$$

恢复缺失的深度 $\lambda$，正是三角化（多视图）、立体视觉（第二个已标定的相机）或深度传感器所提供的功能。视场角（field of view）可以由同样的几何关系得出：对于图像宽度 $W$，$\mathrm{FoV}_x = 2\arctan\!\big(\tfrac{W}{2f_x}\big)$。

## 常见陷阱

- **坐标轴约定**：计算机视觉中使用 $Z$ 向前 / $Y$ 向下；机器人学（ROS）的机体坐标系使用 $X$ 向前 / $Z$ 向上。把这二者搞混，是把相机接入机器人时最典型的第一个 bug。
- **主点不是图像中心**：$(c_x, c_y)$ 接近 $(W/2, H/2)$，但必须通过标定得到，不能想当然地假设。
- **手动实现投影时忘记透视除法**：$P\mathbf{X}$ 的齐次输出必须除以其第三个分量。
- **将该模型直接应用于有畸变的像素**：真实图像必须先去畸变（或者将畸变模型包含在 $\pi$ 中）；纯粹的针孔方程只在理想坐标下才成立。

## 对SLAM的意义

该模型定义的投影函数 $\pi(\cdot)$ 是每一个视觉SLAM系统的核心：光束法平差（bundle adjustment）中最小化的重投影误差 $\mathbf{e} = \mathbf{z} - \pi(T\mathbf{X})$，说穿了就是"用针孔模型投影地图点，再与测量得到的像素比较"。三角化、PnP 和对极几何都是从同一个方程推导而来，因此从零开始推导这一整套流程，是这一阶段最值得做的练习。

## 相关条目

- [Camera calibration](camera-calibration.md)
- [Camera models beyond pinhole](camera-models-beyond-pinhole.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Triangulation](triangulation.md)
- [Rigid body motion](rigid-body-motion.md)
- [Camera device](../level-02-getting-familiar/camera-device.md)
