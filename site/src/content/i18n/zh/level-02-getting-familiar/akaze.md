# AKAZE

**AKAZE（Accelerated-KAZE）**是一种基于**非线性尺度空间**构建的特征检测器与二值描述子。SIFT和ORB通过高斯模糊构建多尺度表示——这种方式对噪声和物体边界一视同仁地进行平滑——而KAZE和AKAZE则进行自适应平滑：在平坦区域平滑力度大，在边缘处平滑力度小。其结果是特征点在结构边界上能保持更好的定位精度。

## 非线性扩散尺度空间

高斯尺度空间是线性热方程的解。KAZE用**非线性扩散**取而代之：

$$\frac{\partial L}{\partial t} = \mathrm{div}\big(c(x, y, t)\, \nabla L\big)$$

其中 $L$ 是随时间演化的图像，$t$ 是尺度参数，$c$ 是一个**导电系数函数（conductivity function）**，根据局部图像内容来控制平滑程度。遵循Perona-Malik的思路，导电系数由对图像做轻微预平滑后 $L_\sigma$ 的梯度驱动，例如

$$g_2 = \frac{1}{1 + \dfrac{\lvert \nabla L_\sigma \rvert^2}{\lambda^2}}$$

对比度参数 $\lambda$ 决定哪些梯度被视为"边缘"：当 $\lvert \nabla L_\sigma \rvert \gg \lambda$ 时，导电系数趋近于零，扩散停止，从而保留边缘；在梯度较低的区域，扩散照常进行，噪声被平滑掉。

## FED：让它变快

非线性扩散没有闭式解，必须通过数值方法进行积分。KAZE（Alcantarilla等，2012）使用了AOS（加性算子分裂）方案，该方案稳定但计算开销大。AKAZE（2013）用**快速显式扩散（Fast Explicit Diffusion, FED）**取而代之：通过若干轮简单的显式扩散步骤，每轮采用精心选择的变化步长，其综合效果既稳定又准确，同时开销大幅降低且易于并行化。这正是名称中"Accelerated（加速）"的由来——以极小的代价获得与KAZE相近的质量。AKAZE还在金字塔（在各八度之间进行降采样）上构建尺度空间，以进一步节省计算量。

## 检测与描述

- **检测器**：在每个演化层级，AKAZE计算经尺度归一化的**Hessian矩阵行列式**响应 $\sigma^2 \big(L_{xx} L_{yy} - L_{xy}^2\big)$，并保留空间与尺度上的极值点，随后进行亚像素精炼——这是一种类似SIFT的DoG的斑点式检测器，只不过是在非线性尺度空间中计算的。
- **描述子**：**M-LDB（Modified Local Difference Binary）**，一种二值描述子，比较特征点周围网格各单元之间的平均强度*及*一阶导数值。该网格会根据特征点的主方向进行旋转，并根据检测尺度进行缩放，从而在保持描述子为二值形式的同时获得旋转和尺度不变性——像ORB一样通过XOR加popcount的Hamming距离进行匹配。

## 实践要点

- 对比度参数 $\lambda$ 是根据图像梯度幅值直方图（固定的百分位数）自动设定的，因此"边缘还是平坦"的判断会根据每张图像的对比度自动调整，而无需手动调参。
- OpenCV在AKAZE中提供了多种描述子选项：完整的M-LDB、一种*直立（upright）*变体（当相机不发生滚转时，跳过旋转不变性以提升速度——地面机器人上很常见），以及以牺牲区分度为代价换取更小内存占用的缩减尺寸描述子。
- 由于描述子是二值的，AKAZE可以接入与ORB相同的基于Hamming距离的暴力匹配或LSH匹配框架——替换特征时无需改动流程。

## 在各类检测器中的定位

在实践中，AKAZE处于中间地带：明显比ORB更具可重复性和精度，尤其是在存在运动模糊、低对比度或可形变场景的情况下——同时仍远比SIFT便宜。它随OpenCV自带，无需专利授权，其二值描述子可以直接接入任何基于Hamming距离的匹配流程。它的主要代价是尺度空间的构建仍比ORB的简单图像金字塔慢，这也是为什么高帧率的SLAM前端倾向于坚持使用ORB/FAST，而在匹配质量比原始速度更重要的场合才使用AKAZE。

## 对SLAM的意义

特征质量限制了下游一切环节——跟踪的稳定性、地图精度、回环检测的召回率。AKAZE表明*尺度空间本身*就是一个可以设计的选择：在平滑过程中保留边缘会带来在物体边界附近定位更好的特征点，而这恰恰是SLAM特征常常所处的位置。对于因运动模糊或弱纹理而导致ORB性能下降的流程，AKAZE是在转向学习型特征之前值得尝试的标准"更强经典特征"升级方案之一。

## 动手实践

- [Classical local feature detection](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_03)

## 相关条目

- [SIFT](sift.md)
- [ORB](orb.md)
- [FAST](fast.md)
- [Image pyramid](image-pyramid.md)
- [Brute-force matching](brute-force-matching.md)
