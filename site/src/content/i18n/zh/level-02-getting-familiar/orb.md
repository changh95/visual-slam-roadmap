# ORB (Oriented FAST and Rotated BRIEF)

ORB（Rublee 等，2011）是驱动 ORB-SLAM 和许多实时视觉 SLAM 系统的关键点检测器 + 二值描述子组合。它被设计为 SIFT/SURF 的一种快速、无专利限制的替代方案：比 SIFT 快两个数量级，同时匹配质量足以胜任跟踪、重定位和回环检测的需求。正如其名字所暗示的，它是由两项改进拼接而成的：**oFAST**（带方向的 FAST）和 **rBRIEF**（带旋转感知的 BRIEF）。

## oFAST：带方向的 FAST 关键点

[FAST](fast.md) 通过检测候选点周围一圈 16 个像素来发现角点，但它既不提供尺度信息也不提供方向信息，其角点响应值在不同检测之间也无法比较。ORB 对这三个问题都作了修正：

- **尺度**：在[图像金字塔](image-pyramid.md)的每一层上都运行 FAST，因此同一个世界坐标点无论相机靠近还是远离都能被检测到。
- **排序**：用 Harris 角点度量对检测到的候选点打分，并保留得分最高的 $N$ 个——单独使用 FAST 往往会在边缘上误检。
- 通过**强度质心（intensity centroid）**获得**方向**。定义图像块的矩和方向：

$$
m_{pq} = \sum_{x, y \in \text{patch}} x^p y^q\, I(x, y), \qquad
\theta = \operatorname{atan2}(m_{01},\, m_{10})
$$

从角点中心指向图像块强度质心的向量给出了一个可重复的角度 $\theta$：旋转图像，$\theta$ 也随之旋转。正是这一个角度使得描述子具有旋转不变性。

## rBRIEF：经过引导且去相关的二值描述子

BRIEF 通过 $n$ 次二值强度比较来描述一个平滑后的图像块：对于一组预先定义的偏移对 $(\mathbf{a}_i, \mathbf{b}_i)$，第 $i$ 位为

$$
\tau_i = \begin{cases} 1 & I(\mathbf{a}_i) < I(\mathbf{b}_i) \\ 0 & \text{otherwise} \end{cases}
$$

从而给出一个 $n$ 位的比特串（ORB 中 $n = 256$，即 32 字节）。普通的 BRIEF 在旋转下会失效，因此 ORB 会**引导（steer）**测试模式：在采样之前，所有点对都按关键点的方向 $\theta$ 进行旋转（离散化到查找表中）。

然而，引导操作会破坏 BRIEF 一部分统计上的优良性质——经过旋转的测试变得更加相关，判别力也随之下降。ORB 的解决方案是**rBRIEF**：对大量候选测试对进行贪心的离线搜索，选出 256 个测试，使其同时具有高方差（均值接近 0.5，因此每一位都是有信息量的）和与已选测试低相关的特性。这样得到的结果在保留二值格式的同时，恢复了大部分损失掉的判别力。

## 匹配 ORB 描述子

二值描述子通过**Hamming 距离**（即不同位的数量）进行比较，其计算方式为 `popcount(x XOR y)`，每对描述子只需几条机器指令。这使得对成千上万个描述子进行[暴力匹配](brute-force-matching.md)在实时场景下也可行，而 [LSH](lsh.md) 或基于词袋的倒排索引则用于处理地图规模的搜索。常规的过滤手段同样适用：最优与次优距离之间的 Lowe 比值检验、交叉检查，以及用 RANSAC 进行几何验证。

## 实践中

OpenCV 将 ORB 作为 `cv::ORB::create()` 提供，并直接暴露了那些重要的可调参数：要保留的特征数量、金字塔缩放因子和层数，以及 FAST 阈值。ORB-SLAM 中有两个实用的习惯值得借鉴：

- **空间分布**：直接取响应最强的 N 个特征往往会使特征聚集在高纹理区域；将图像划分为网格（或者像 ORB-SLAM 那样使用四叉树分布）并强制每个网格单元的配额，能得到更符合几何分布、分布更均匀的特征。
- **金字塔感知匹配**：在金字塔第 $k$ 层提取的描述子应该与相近的层进行匹配——跨越差异很大的尺度进行比较，会把 Hamming 距离的计算预算浪费在错误的候选上。

## 对SLAM的意义

ORB 恰好命中了那个甜蜜点，使得基于特征的 SLAM 在 CPU 和嵌入式硬件上变得实用：在 30 fps 的预算内，轻松完成每帧约 1000 个特征的检测、描述与匹配，同时具备足够的不变性（金字塔带来的尺度不变性，oFAST/rBRIEF 带来的旋转不变性），足以支持宽基线匹配。ORB-SLAM 将其整个架构都建立在这一种特征之上——同一套 ORB 描述子既服务于帧间跟踪，也服务于局部地图匹配、重定位，以及通过[视觉词袋](bag-of-visual-words.md)词典进行的回环检测——这在很大程度上解释了该系统为何如此连贯而稳健。即便在深度学习时代，ORB 仍然是衡量学习型特征（SuperPoint 及其同类方法）的默认基线，在计算资源紧张时仍是务实的选择。

## 动手实践

- [Classical local feature detection](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_03)

## 相关条目

- [FAST](fast.md)
- [Image pyramid](image-pyramid.md)
- [Brute-force matching](brute-force-matching.md)
- [Bag of Visual Words](bag-of-visual-words.md)
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md)
