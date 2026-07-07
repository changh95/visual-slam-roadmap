# KLT Tracker

**Kanade-Lucas-Tomasi（KLT）跟踪器**通过直接对齐小的图像patch，在帧与帧之间跟踪稀疏特征点，而不是每帧都重新检测和重新匹配描述子。它结合了Lucas-Kanade光流解法（Lucas & Kanade, 1981）、Tomasi与Kanade的跟踪表述（1991），以及Shi与Tomasi的特征选择准则（1994），并且——以其金字塔形式（Bouguet）——是许多VIO系统（MSCKF实现、VINS-Mono）的前端，也是`cv::calcOpticalFlowPyrLK`背后的主力算法。

## Lucas-Kanade核心

假设**亮度恒定性（brightness constancy）**：特征周围的patch在帧间移动$(u, v)$时保持其强度不变，

$$
I(x, y, t) = I(x + u,\; y + v,\; t + 1).
$$

对于小运动，一阶泰勒展开给出**光流约束方程**：

$$
I_x u + I_y v + I_t = 0
$$

其中$I_x, I_y$是空间图像梯度，$I_t$是时间差分。一个方程，两个未知量——这就是孔径问题（aperture problem）。Lucas-Kanade增加了**空间一致性（spatial coherence）**：特征周围窗口$W$内的所有$N$个像素共享同一个$(u, v)$。将这$N$个约束堆叠并用最小二乘求解，得到$2 \times 2$的方程组

$$
A^T A \begin{bmatrix} u \\ v \end{bmatrix} = -A^T \mathbf{b},
\qquad
A^T A = \begin{bmatrix} \sum I_x^2 & \sum I_x I_y \\ \sum I_x I_y & \sum I_y^2 \end{bmatrix}
$$

其中$\mathbf{b}$是时间梯度组成的向量。因为运动并非真正的无穷小量，这个求解过程以高斯-牛顿方式**迭代**进行：用当前估计对patch进行warp、重新计算残差、求解增量，重复直到更新量低于阈值。

## 良好的可跟踪特征

矩阵$A^T A$正是Harris角点检测器中的**结构张量（structure tensor）**，其条件数决定了可跟踪性。设特征值$\lambda_1 \ge \lambda_2$：

- 两者都大——角点；系统条件良好，完整的2D运动可恢复；
- $\lambda_2 \approx 0$——边缘；沿边缘方向的运动不可观测（孔径问题）；
- 两者都小——平坦区域；没有可跟踪的内容。

Shi与Tomasi的准则选择满足$\min(\lambda_1, \lambda_2) > \tau$的特征——"良好的可跟踪特征"从构造上就是KLT求解稳定的点。这正是`cv::goodFeaturesToTrack`。

## 让它在真实运动中生效

- **金字塔式由粗到精**：原始LK只能容忍很小的位移（泰勒线性化的限制）。金字塔KLT先在图像金字塔的最粗层级上求解光流，然后逐层传播并细化估计——将捕获范围从几个像素扩展到几十个像素，同时保证每次求解都处于线性区间内。
- **正向-反向检查**：将每个点从帧$t$跟踪到$t+1$，再将结果反向跟踪回$t$；如果这个往返没有回到起始点附近，就丢弃该轨迹。这是一种廉价而有效的、用于剔除遮挡和漂移轨迹的过滤方法。
- **轨迹维护与漂移**：轨迹会因遮挡和外观变化而丢失，因此跟踪器需要补充特征（在特征稀少的网格单元中检测新的Shi-Tomasi/FAST角点）。因为每一步都是相对*前一帧*进行对齐的，小误差会不断累积——即模板漂移。Tomasi-Kanade的解决办法是监控patch与轨迹*第一帧*之间的相似度差异（通过仿射warp吸收视角变化），并终止质量下降的轨迹。

## 对SLAM的意义

对于*帧间*对应关系，KLT是描述子匹配的廉价、高精度替代方案：无需计算描述子，无需最近邻搜索，具有亚像素精度，且计算量与被跟踪点的数量成正比——非常适合嵌入式硬件上实时系统的跟踪线程。这正是为什么光流前端在VIO中占主导地位（VINS-Mono在正常运行中跟踪KLT角点，从不计算描述子），也是为什么像SVO这样的半直接方法建立在同样的patch对齐数学基础之上。它的局限同样定义了前端设计:KLT在大基线、光照变化（亮度恒定性被打破）和运动模糊下会退化，也没有办法重新找回丢失的特征——这恰恰是基于描述子的匹配和场景识别所擅长的。KLT的正规方程同样是高斯-牛顿模式最简单的实例，这种模式在SLAM的每个尺度上都会反复出现,直至完整的光度光束法平差。

## 动手实践

- [特征跟踪动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_07)

## 相关条目

- [光流](optical-flow.md)
- [图像金字塔](image-pyramid.md)
- [角点检测器](../level-01-beginner/corner-detector.md)
- [FAST](fast.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
