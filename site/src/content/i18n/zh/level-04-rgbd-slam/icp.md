# ICP

> Besl & McKay 1992 · [论文](https://ieeexplore.ieee.org/document/121791)

**一句话总结** — 提出了迭代最近点（Iterative Closest Point，ICP）算法，这是通过迭代最小化点对距离来实现3D点集刚体对齐的奠基性方法。

## 问题

对齐从不同视角或不同传感器采集的3D形状，对于物体识别、检测和重建至关重要。此前的方法需要手工指定对应关系，或对形状拓扑做出限制性假设。当时需要一种通用的、自动的方法来对齐自由形式的3D数据——一种在不知道哪个点对应哪个点的情况下，直接对原始点进行操作的方法。

## 方法与架构

ICP在两个步骤之间交替进行，每个步骤都只会降低对齐误差：

1. **最近点对应关系。** 对源点集 $\mathcal{P}$ 中的每个点 $\mathbf{p}_i$，在当前变换估计下，在目标点集 $\mathcal{Q}$ 中找到最近的点 $\mathbf{q}_i$。未知的数据关联由最近邻*近似*得到，并随着对齐的改善而不断改善——不需要人工指定对应关系或特征匹配。
2. **最优刚体变换。** 给定这些对应关系，计算使均方目标函数

$$E(\mathbf{R}, \mathbf{t}) = \frac{1}{N}\sum_{i=1}^{N} \|\mathbf{q}_i - (\mathbf{R}\,\mathbf{p}_i + \mathbf{t})\|^2$$

   最小化的旋转 $\mathbf{R}$ 和平移 $\mathbf{t}$，以闭式形式求解——通过对中心化点集的交叉协方差矩阵做SVD，或等价地使用原论文中所用的单位四元数方法。
3. **迭代直至收敛。** 应用该变换，重新计算最近点对应关系，重复此过程直到均方误差的变化降到某个阈值以下。

由于两个步骤都在降低误差，该迭代会单调收敛到均方距离的一个*局部*极小值：

$$E(\mathbf{R}_{k+1}, \mathbf{t}_{k+1}) \leq E(\mathbf{R}_k, \mathbf{t}_k) \quad \forall k$$

定义了ICP在实践中如何被使用的关键特性和改进：

- **仅局部收敛**：ICP需要一个足够好的初始化；较大的初始偏差会导致收敛到错误的局部极小值。在SLAM中，这个初始化来自上一帧的位姿、匀速运动模型，或从粗到细的金字塔。
- **点到面变体**（Chen & Medioni 1992）：将点到点残差替换为 $\mathbf{n}_i^\top(\mathbf{T}\mathbf{v}_i - \mathbf{u}_i)$，其中 $\mathbf{n}_i$ 是目标表面法向，这使得平坦区域可以沿彼此滑动，并在结构化场景中收敛得更快——这正是KinectFusion用于frame-to-model跟踪的变体。
- **工程工具箱**（由Rusinkiewicz & Levoy 2001综述）：用于最近邻搜索的k-d树、子采样、基于距离/法向兼容性对不良点对的剔除、鲁棒加权。后续的变体包括广义ICP（Generalized ICP）、裁剪ICP（trimmed ICP，用于部分重叠情形）、对称ICP，以及彩色ICP。

## 实验结果

1992年发表于TPAMI的原始论文展示了几何基本形体（球体、圆柱体）以及复杂自由曲面的配准，通常在10到50次迭代内收敛，同时也记录了对初始化的敏感性，这至今仍是ICP的典型失效模式（全文需付费获取；结果总结见配套书籍章节——完整评估请参见原论文）。ICP成为3D点云配准的标准算法：几乎每一个RGB-D稠密SLAM系统都使用某种ICP变体进行跟踪，它也是LiDAR SLAM中扫描匹配的基础，并进一步扩展到医学影像和工业检测领域。

## 对SLAM的意义

ICP是3D-3D配准的基础：几乎每一个RGB-D稠密SLAM系统（KinectFusion、ElasticFusion、InfiniTAM）都通过在输入深度帧和地图之间运行某种ICP变体来跟踪相机。它对LiDAR SLAM同样至关重要，其中扫描匹配本质上就是带有工程改进的ICP。理解ICP——它的代价函数、闭式解以及失效模式——是理解第4级中所有frame-to-model跟踪内容的前提。

## 动手实践

- [ICP动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch03_06)
- [进阶ICP动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch03_07)

## 相关条目

- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [KinectFusion](kinectfusion.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [LOAM](../level-09-lidar-visual-lidar-slam/loam.md)
