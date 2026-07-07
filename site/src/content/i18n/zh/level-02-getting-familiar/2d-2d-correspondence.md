# 2D-2D correspondence

在两幅图像之间已知特征匹配、但尚无任何3D信息的情况下，2D-2D几何用于估计相机的相对运动。三种主力模型是**本质矩阵（essential matrix）**、**基础矩阵（fundamental matrix）**和**单应矩阵（homography）**，每一种都由一个最小或线性求解器结合RANSAC来估计。

## 五点法估计本质矩阵

在相机已标定的情况下，本质矩阵 $E$ 可以由5对点对应关系估计得到（Nister, 2004）。约束条件如下：

- 对极约束：$\mathbf{x}_2^T E\,\mathbf{x}_1 = 0$（对 $E$ 的9个元素是线性的）。
- 内部约束：$\det(E) = 0$ 以及 $2EE^TE - \mathrm{trace}(EE^T)E = 0$（三次多项式）。

结果最多有10个实数解，需要用额外的点来消除歧义。结合RANSAC，五点法在实践中是本质矩阵估计的首选方法：更小的最小样本集意味着在相同内点比例下所需的RANSAC迭代次数要少得多。

## 八点法估计基础矩阵

基础矩阵 $F$ 有7个自由度。在有8个或更多对应关系的情况下，八点法（Longuet-Higgins, 1981；Hartley, 1997）通过SVD求解一个线性齐次方程组 $A\mathbf{f} = 0$，其中 $\mathbf{f} = \mathrm{vec}(F)$。Hartley指出，在求解之前对点坐标进行**归一化**（零均值、单位方差）能极大改善数值条件——这种"归一化八点法"是大家实际都在使用的版本。求解之后，通过将估计出的 $F$ 的最小奇异值置零来施加秩为2的约束。

## 直接线性变换求解单应矩阵

当场景是平面场景，或运动是纯旋转时，单应矩阵 $H$ 可以解释这些对应关系。每对对应关系 $\mathbf{x}' \sim H\mathbf{x}$ 给出关于 $H$ 的8个自由度的2个线性方程；当有 $N \geq 4$ 对对应关系时，DLT将它们堆叠成一个 $2N \times 9$ 的矩阵，并通过SVD求解 $A\mathbf{h} = 0$。归一化同样至关重要。

## 为什么最小求解器很重要：RANSAC迭代次数

特征匹配中含有外点，因此上述每种求解器都运行在RANSAC内部：采样一个最小集合，拟合模型，统计内点数，重复此过程。在内点比例为 $w$、样本大小为 $s$ 的情况下，$N$ 次迭代中至少产生一次全内点样本的概率为 $1 - (1 - w^s)^N$；要求成功概率为 $1 - \eta$ 可得

$$N = \frac{\log \eta}{\log(1 - w^s)}$$

以 $w = 0.5$ 为例：八点法（$s = 8$）需要约 $N \approx 1177$ 次迭代，而五点法（$s = 5$）只需约 $N \approx 145$ 次。对 $s$ 的指数依赖正是青睐最小求解器的全部理由——这也是为什么一旦存在3D信息，P3P（$s = 3$）会成为首选。

## 从模型到运动

RANSAC在内点上选出最优模型之后：

- $E$ 通过SVD分解为4个候选姿态 $[R|\pm\mathbf{t}]$；通过cheirality检验（三角化的点位于两个相机前方）来挑选正确的那个。平移只能恢复到**尺度未知**的程度。
- $H$ 同样可以分解为旋转、平面法向量和带尺度的平移（有其自身的多解歧义）。
- 内点对应关系随后被三角化，生成最初的地图点（landmark）。

## 选择模型

退化配置很重要：平面场景或纯旋转会使 $F$/$E$ 的估计成为病态问题，而一般的3D场景则会打破单应假设。ORB-SLAM在单目初始化时著名地同时拟合这两种模型，并通过每个模型自身的评分来挑选胜者。

## 常见陷阱

- **在八点法或DLT之前跳过归一化**：原始像素坐标（数值在几百到几千之间）会使 $A$ 的条件数变得极其糟糕。
- **在纯旋转下估计 $E$**：当 $\mathbf{t} \to \mathbf{0}$ 时本质矩阵会退化；应检测这种情形（或改用单应矩阵拟合），而不是相信一个垃圾姿态。
- **只依赖内点数量**：即使场景是3D的，单应矩阵也可能在一个主导平面上收集到大量内点；应使用逐模型评分/模型选择，而非仅看内点原始数量。

## 对SLAM的意义

2D-2D对应关系是单目SLAM的入口：它在还没有地图存在时启动第一个相对姿态（尺度未知），此后三角化生成地图点，流程切换为2D-3D（PnP）跟踪。同样的求解器还用于在几何上验证回环检测候选，并支撑着诸如COLMAP这样的运动恢复结构（structure-from-motion）流程。

## 动手实践

- [Epipolar geometry hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_02)

## 相关条目

- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)
- [2D-3D correspondence](2d-3d-correspondence.md)
- [3D-3D correspondence](3d-3d-correspondence.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [Keypoints](keypoints.md)
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md)
