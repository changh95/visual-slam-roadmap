# Optical Flow

**光流（optical flow）**是连续帧之间图像亮度模式的表观 2D 运动：一个向量场 $(u, v)$，为每个像素（或每个被跟踪的点）指定从时刻 $t$ 到 $t+1$ 的位移。这是 SLAM 前端在不每帧都重新检测和重新匹配特征的情况下，跟踪视频中点的方式。

## 亮度恒常性与光流约束

其基本假设是**亮度恒常性（brightness constancy）**：场景中的一个点在运动过程中保持其亮度不变，

$$
I(x, y, t) = I(x + u,\, y + v,\, t + 1)
$$

假设运动是**微小的**，对右侧进行一阶（泰勒展开）近似，并消去 $I(x,y,t)$：

$$
I_x u + I_y v + I_t = 0
$$

其中 $I_x, I_y$ 是图像的空间梯度，$I_t$ 是帧间的时间差。这个**光流约束方程**对每个像素而言是两个未知量的一个方程——沿图像梯度*方向*的光流分量是可观测的，而与其垂直的分量则不可观测。这就是**光圈问题（aperture problem）**：通过一个小窗口观察一条移动的边缘，你无法判断它沿自身方向滑动了多少。

## Lucas-Kanade：局部最小二乘

Lucas-Kanade 通过第三条假设来消除这种歧义：一个小窗口 $W$（例如 $21\times 21$）内的所有像素共享相同的光流。将窗口内 $N$ 个像素的约束方程堆叠起来：

$$
\underbrace{\begin{bmatrix} I_x^{(1)} & I_y^{(1)} \\ \vdots & \vdots \\ I_x^{(N)} & I_y^{(N)} \end{bmatrix}}_{A}
\begin{bmatrix} u \\ v \end{bmatrix}
= -\underbrace{\begin{bmatrix} I_t^{(1)} \\ \vdots \\ I_t^{(N)} \end{bmatrix}}_{\mathbf{b}}
$$

这是一个超定系统，用最小二乘法求解：$(A^T A)\,\mathbf{v} = -A^T \mathbf{b}$。这个 $2\times 2$ 矩阵 $A^T A$ 恰好就是 Harris [角点检测器](../level-01-beginner/corner-detector.md)中的**结构张量（structure tensor）**——这是一个深刻而实用的联系：

- **角点**（两个特征值都大）：条件良好的方程组，光流可靠。这就是为什么跟踪器要选择角点（"良好的可跟踪特征"）。
- **边缘**（一个特征值接近零）：条件不良——矩阵形式下的光圈问题。
- **平坦区域**（两个特征值都接近零）：完全没有信息。

由于线性化假设了微小运动，实际实现中会对求解进行迭代（变形、重新线性化），并在[图像金字塔](image-pyramid.md)上进行**由粗到细（coarse-to-fine）**的处理：在较粗的尺度上，大运动会收缩为小运动，而每一层的估计结果都会作为下一层的初始化。这种金字塔式的 Lucas-Kanade 方案正是 [KLT 跟踪器](klt-tracker.md)的核心。

## 稀疏光流与稠密光流

- **稀疏光流**（Lucas-Kanade/KLT）只在选定的关键点上计算光流——计算代价低，正是基于特征的 VO/SLAM 在帧间跟踪时所需要的。
- **稠密光流**为每个像素估计一个光流向量。经典的表述方法（Horn-Schunck）通过加入一个平滑正则项，使问题在全局意义上是良定的，在整幅图像上最小化

$$
E(u, v) = \iint \left( I_x u + I_y v + I_t \right)^2 + \lambda \left( \|\nabla u\|^2 + \|\nabla v\|^2 \right) \, dx\, dy
$$

  从而使无纹理区域能够从其邻域继承光流。现代稠密光流已主要由学习方法主导（FlowNet、PWC-Net、RAFT），它们在处理大位移、遮挡和光照变化方面远远优于经典假设所能达到的效果。

跟踪中一种标准的可靠性过滤方法是**前后向检查（forward-backward check）**：将一个点从帧 $t$ 跟踪到 $t+1$，再将结果反向跟踪回 $t$，如果它没有回到起点附近，就舍弃这条轨迹。

## 对SLAM的意义

光流是获得帧间对应关系最廉价的方式，而对应关系正是视觉里程计的原始素材。基于 KLT 的跟踪前端（例如 VINS-Mono 及许多 VIO 系统中所用的）用金字塔 Lucas-Kanade 跟踪角点，而不是匹配描述子——更快，并且具有描述子匹配所缺乏的亚像素精度。同样的亮度恒常性机制，从 2D 窗口位移推广到完整的相机位姿变形，正是直接法（LSD-SLAM、DSO）的基础。而如今，稠密的学习式光流也在为 DROID-SLAM 等系统提供对应关系。理解约束方程、光圈问题以及结构张量的条件数，能够告诉你上述任何方法会在何处失效：快速运动、低纹理，以及光照变化。

## 动手实践

- [Feature tracking hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_07)

## 相关条目

- [KLT Tracker](klt-tracker.md)
- [Image pyramid](image-pyramid.md)
- [Corner detector](../level-01-beginner/corner-detector.md)
- [FlowNet](../level-05-deep-learning/flownet.md)
- [RAFT](../level-05-deep-learning/raft.md)
