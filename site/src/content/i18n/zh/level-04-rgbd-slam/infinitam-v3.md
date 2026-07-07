# InfiniTAM v3

> Prisacariu 2017 · [论文](https://arxiv.org/abs/1708.00783)

**一句话总结** — 一个模块化、跨设备的开源RGB-D重建框架，结合了体素哈希TSDF（或面元）建图、鲁棒的ICP/RGB跟踪、基于随机蕨（random-fern）的重定位，以及基于子图的全局一致重建。

## 问题

将重建体积化地表示为TSDF，能带来KinectFusion风格系统的GPU实现所享有的简洁性和高效性——但稠密的均匀网格占用内存很大，限制了规模的扩展，而研究社区当时缺乏一个统一、快速、灵活的流水线，能够在其中替换和调整相机跟踪、场景表示以及数据融合。InfiniTAM正是这样一个框架；v3技术报告记录了它的第三次迭代，其中的重点新增功能包括带有失效检测的鲁棒跟踪器、随机蕨重定位器、通过子图实现的全局一致TSDF重建，以及一个面元后端。

## 方法与架构

**引擎架构。** 一种责任链设计：无状态的处理引擎（跟踪、分配、融合、光线投射、换页）在彼此之间传递状态对象，每个引擎又分为一个抽象层、一个设备专用层（CPU/CUDA/Metal），以及一个由共享的内联C代码组成的设备无关层。存在两条流水线：`ITMBasicEngine`（标准融合）和`ITMMultiEngine`（全局一致，带回环检测）。

**体素哈希。** 体素（TSDF值、权重、可选的RGB）被组织为 $8\times 8\times 8$ 的块，存储在一个连续的体素块数组中（$2^{18}$个条目）；一个哈希表通过以下方式将某个块的角坐标 $\mathbf{b}$ 映射到其存储索引

$$h(\mathbf{b}) = \big( (b_x \cdot 73856093) \oplus (b_y \cdot 19349669) \oplus (b_z \cdot 83492791) \big) \bmod n$$

冲突由一个无序的溢出列表处理。分配阶段对每个深度像素 $d$，将从 $d-\mu$ 到 $d+\mu$ 的线段进行反投影，并分三个非阻塞阶段为相交的块分配空间；融合阶段随后按照KinectFusion的方式，用加权滑动平均更新每个可见体素。

**跟踪。** 经典的`ITMDepthTracker`针对模型的光线投射结果最小化点到面距离，$d = (\mathbf{R}\mathbf{p} + \mathbf{t} - \mathcal{V}(\bar{\mathbf{p}}))^{\top} \mathcal{N}(\bar{\mathbf{p}})$，在一个分辨率层级上进行；`ITMColorTracker`则改为最小化颜色差异 $d = \| I(\pi(\mathbf{R}\,\mathcal{V}(i) + \mathbf{t})) - \mathcal{C}(i) \|_2$。v3中新增的默认`ITMExtendedTracker`使ICP更加鲁棒：对逐像素误差使用Huber范数、对较远（噪声更大）的测量按深度做降权、以距离阈值进行离群点门限过滤，并对强度 $I = 0.299R + 0.587G + 0.114B$ 施加一个可选的帧间光度项（Tukey损失，缩放系数为0.3），全部通过从粗到细的Levenberg-Marquardt方法最小化。在ICP统计量（内点百分比、Hessian矩阵的行列式、残差）上训练的SVM分类器可检测跟踪失败并触发重定位。

**重定位（随机蕨）。** 每张RGB-D图像被编码为 $m$ 个由 $n$ 次特征测试组成的二值码块；两张图像之间的相似度是按块计算的Hamming距离 $\mathrm{BlockHD}(b_C^I, b_C^J) = \frac{1}{m}\sum_{k=1}^{m} (b_{F_k}^I \equiv b_{F_k}^J)$。码表将码映射到关键帧ID，因此可以在常数时间内检索出最接近的已存储关键帧（及其位姿）——这既用于位姿恢复，也用于回环检测。

**全局一致重建。** 场景被划分为若干刚性子图（活动的子图每帧都被跟踪，非活动的子图则处于休眠状态；当相机离开当前子图时会生成新的子图）。子图间的约束由跟踪结果和蕨检测到的回环闭合累积得到，并在一个后台线程中优化子图位姿图。渲染时通过对一个即时融合的隐式合并TSDF做光线投射，

$$\hat{F}(\mathbf{X}) = \sum_i F_w(\mathbf{P}_i \mathbf{X})\, F(\mathbf{P}_i \mathbf{X})$$

其中 $\mathbf{P}_i$ 是子图 $i$ 的位姿，$F, F_w$ 是其TSDF值和权重——全局地图只是子图之上的一个*视图（view）*，从未被显式构建出来。

**面元后端与换页。** Keller等人基于点的融合方法的一个beta实现，通过置信度加权平均来更新匹配到的面元，$\bar{\mathbf{v}}_k \leftarrow (\bar{c}_k \bar{\mathbf{v}}_k + \alpha \mathbf{v}^g) / (\bar{c}_k + \alpha)$，最多支持500万个面元。一个具有固定大小主机/设备传输缓冲区的换页引擎，将体素块从GPU显存中换出，并在换回时重新融合，因此地图规模可以超过GPU容量的限制。

## 实验结果

v3论文是关于该框架实现的一篇技术报告，而不是一项基准测试研究——其中不包含定量评估表格；其底层的全局一致子图方法在其配套发表的论文中（Kähler等，ECCV 2016）得到了评估。报告自身的结论属于工程层面的说明：该流水线在GPU上实时运行（优化程度较低的面元后端在一块性能不错的GPU上"仍然是实时的"）；一块现成的显卡在4毫米体素分辨率下，即便使用了哈希，主动内存也大致只能容纳一个房间大小的场景，换页子系统则可以将其扩展到更大的场景；整个软件栈可以跨CPU、CUDA和Metal设备层运行，并支持多种传感器（Kinect、PrimeSense、RealSense、Structure）。完整的跟踪精度评估请参见配套论文。它长久以来的影响在于成为使用最广泛、最易于修改的开源RGB-D重建代码库之一。

## 对SLAM的意义

InfiniTAM v3把KinectFusion之后的一系列最新进展——体素哈希、带失效检测的鲁棒frame-to-model跟踪、蕨重定位、基于子图的回环检测——打包进了一个模块化框架中。如果你想理解一个生产级质量的稠密SLAM流水线是如何被工程化实现的（内存管理、GPU核函数、可替换的地图后端、主机-设备换页），阅读InfiniTAM的代码是这个层级上最好的练习之一；它同时也是像BundleFusion这类可扩展TSDF系统所依赖的体素哈希存储方案的参考实现。

## 相关条目

- [KinectFusion](kinectfusion.md)
- [BundleFusion](bundlefusion.md)
- [ElasticFusion](elasticfusion.md)
- [Kintinuous](kintinuous.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
