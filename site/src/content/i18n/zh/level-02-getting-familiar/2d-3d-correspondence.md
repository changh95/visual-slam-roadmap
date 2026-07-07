# 2D-3D correspondence

给定一个已知地图中的 $n$ 个3D点 $\{\mathbf{X}_i\}$，以及它们在相机图像中的2D投影 $\{\mathbf{u}_i\}$，**Perspective-n-Point（PnP）**问题用于估计相机姿态 $[R|\mathbf{t}]$。这是SLAM系统在地图已存在的情况下对每个新帧进行定位的标准方式。

## P3P

Perspective-3-Point问题恰好使用3对对应关系——这是最小情形，与姿态的6个自由度相匹配（每个2D点提供2个约束）。该几何问题可以归结为经典的"余弦定理"方程组：三条视线之间的三个夹角可由图像得知，三个点间距离可由地图得知，从而得到一个最多有4个实数解的多项式方程组；第4对对应关系用于消除歧义。由于所需点数极少，P3P是RANSAC内部首选的最小求解器——所需迭代次数随样本大小呈指数增长，因此 $s = 3$ 相比更大的求解器具有巨大优势。

## EPnP

EPnP（Lepetit等，2009）将 $n$ 个3D点表示为4个虚拟控制点的加权和，从而将PnP归约为估计12个未知量（相机坐标系下控制点的坐标），且与 $n$ 无关。其 $O(n)$ 的复杂度使其在处理大规模对应集合时效率很高，并且是许多流程中的默认选择（`cv::solvePnP` 直接支持它）。

## DLT与SVD的作用

直接线性变换（DLT）从 $n \geq 6$ 对对应关系出发，将完整的 $3 \times 4$ 投影矩阵 $P$ 的求解转化为一个齐次线性系统，并用SVD求解：解即为最小奇异值对应的右奇异向量。随后通过对 $P = \mathbf{K}[R|\mathbf{t}]$ 的分解提取姿态（当内参也未知时使用RQ分解）。DLT比EPnP更简单但精度更低；在实践中，两者都可作为初始化结果，再通过最小化重投影误差来精炼。

## 非线性精炼（仅优化运动的光束法平差）

无论初始姿态来自哪种求解器，精确的答案都来自于在地图点保持固定的情况下，仅对姿态最小化重投影误差：

$$T^* = \arg\min_{T \in SE(3)} \sum_{i} \rho\!\left(\big\|\mathbf{u}_i - \pi(T\,\mathbf{X}_i)\big\|^2\right)$$

其中 $\pi$ 是相机投影函数，$\rho$ 是一个稳健核函数（例如Huber核），用于限制残余外点的影响。该问题通过高斯-牛顿法或列文伯格-马夸尔特法经过几次迭代求解——这就是特征法SLAM中每一帧都会运行的"仅运动光束法平差（motion-only BA）"步骤。

## 典型流程

1. 将当前帧的特征点与地图点进行匹配（描述子匹配或投影引导搜索）。
2. 使用带P3P的RANSAC剔除外点匹配，得到初始姿态。
3. 在所有内点上通过非线性最小二乘（对重投影误差施加稳健核）精炼姿态。

## 常见陷阱

- **退化的点配置**：当3D点共面（或更糟，共线）时，DLT会失效；EPnP和P3P对平面的处理更好，但仍需检查所用求解器的假设条件。
- **点数较少时解的歧义性**：P3P最多4个解，必须消除歧义——把错误的根喂给精炼步骤会收敛到一个残差很低但错误的姿态。
- **地图点质量限制了姿态质量**：PnP将3D点视为完美的；三角化质量差（视差小）的地图点会系统性地使姿态产生偏差。这正是为什么同时移动点的完整光束法平差最终会优于逐帧PnP。
- **未校正的畸变**：在未去畸变的像素坐标上直接做PnP会得到看起来一致但存在系统偏差的姿态。

## 对SLAM的意义

PnP是特征法SLAM的跟踪骨架：ORB-SLAM通过与局部地图点匹配并求解PnP来跟踪每一帧，跟踪丢失后的重定位就是针对场景识别候选进行PnP。视觉定位服务（查询图像对预先构建好的地图）也是通过这种方式计算相机姿态的。与2D-2D（初始化）和3D-3D（点云对齐）一起，它构成了每个SLAM工程师都必须掌握的三大对应问题。

## 动手实践

- [Perspective-n-points hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_09)

## 相关条目

- [2D-2D correspondence](2d-2d-correspondence.md)
- [3D-3D correspondence](3d-3d-correspondence.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [Landmark](landmark.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md)
