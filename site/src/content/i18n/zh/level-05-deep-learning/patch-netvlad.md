# Patch NetVLAD

> Hausler 2021 · [论文](https://arxiv.org/abs/2103.01486)

**一句话总结** — 从 NetVLAD 残差中提取多尺度图块级 VLAD 描述子，并通过空间验证对检索候选进行重排序，使视觉场景识别对视角变化和感知混淆（perceptual aliasing）具有更强的鲁棒性。

## 问题

视觉场景识别必须在一个不断变化的世界中同时克服*外观变化*（季节、结构、光照）和*视角变化*这两大难题。诸如 NetVLAD 之类的全局描述子将整幅图像压缩为单一向量，丢弃了空间布局信息——检索速度快，但对视角变化、部分遮挡和感知混淆很脆弱。完整的局部特征匹配（例如 SuperPoint + SuperGlue）保留了空间布局，但在面对大型数据库时速度太慢。Patch-NetVLAD 在一个可配置的流程中兼具了局部和全局描述子方法的优点。

## 方法与架构

**两阶段检索。** 原始 NetVLAD 首先为查询图像检索出排名前 $k$（$k{=}100$）的数据库候选图像；随后图块级匹配用一个空间一致性分数对这一候选列表进行重排序，因此跨图匹配的计算代价只需在 100 张图像上支付，而无需在整个数据库上支付。

**图块级 VLAD 描述子。** NetVLAD 的聚合层对 CNN 特征 $\mathbf{x}_i$ 与 $K$ 个学习得到的聚类中心 $\mathbf{c}_k$ 之间的软分配残差求和：

$$ f_{\mathrm{VLAD}}(F)(j,k) = \sum_{i=1}^{N} \bar{a}_k(\mathbf{x}_i)\,\big(x_i(j) - c_k(j)\big) $$

Patch-NetVLAD 并不对整个 $H \times W \times D$ 特征图（$N = H \times W$，即全局 NetVLAD）进行聚合，而是在特征空间网格上以步长 $s_p$ 对一组密集的 $d_x \times d_y$ 图块应用同样的聚合加投影 $\mathbf{f}_i = f_{\mathrm{proj}}(f_{\mathrm{VLAD}}(P_i))$，每幅图像共有

$$ n_p = \Big\lfloor \tfrac{H-d_y}{s_p} + 1 \Big\rfloor \cdot \Big\lfloor \tfrac{W-d_x}{s_p} + 1 \Big\rfloor $$

个图块——这是与空间位置绑定的"局部-全局"描述子，无需任何关键点检测。

**互最近邻加空间打分。** 查询/参考图块描述子进行穷举式交叉匹配；互最近邻匹配对集合 $\mathcal{P}$ 通过两种方式打分：一种是 RANSAC（拟合单应矩阵后的内点数，内点容差为 $s_p$，按 $n_p$ 归一化），另一种是*快速空间打分*，基于匹配图块的水平/垂直位移 $x_d, y_d$：

$$ s_{\mathrm{spatial}} = \frac{1}{n_p} \sum_{i \in \mathcal{P}} \Big( \big|\max_j x_{d,j}\big| - \big|x_{d,i} - \bar{x}_d\big| \Big)^2 + \Big( \big|\max_j y_{d,j}\big| - \big|y_{d,i} - \bar{y}_d\big| \Big)^2 $$

该打分方式会惩罚偏移量偏离平均运动的匹配——无需采样即可完成空间验证。

**通过 IntegralVLAD 实现多尺度融合。** 来自 $n_s$ 种图块尺寸的分数通过一个凸组合 $s_{\mathrm{spatial}} = \sum_i w_i\, s_{i,\mathrm{spatial}}$ 融合（所用配置：正方形图块尺寸 2、5、8，权重 $w_i = 0.45, 0.15, 0.4$；对于 640×480 的图像，尺寸为 5 的图块覆盖 228×228 像素）。由 $1{\times}1$ 图块 VLAD 构成的积分特征图 $\mathcal{I}(i,j) = \sum_{i' < i, j' < j} \mathbf{f}^1_{i',j'}$ 让任意大小的图块都能通过四次查找恢复出来，实现方式是使用核 $K = \begin{pmatrix} 1 & -1 \\ -1 & 1 \end{pmatrix}$ 的膨胀深度可分离卷积。对图块描述子进行 PCA 降维可以提供一个可配置的速度/精度权衡选项。

## 实验结果

在六个基准数据集（Nordland、Pittsburgh 30k、Tokyo 24/7、Mapillary MSLS、RobotCar Seasons v2、Extended CMU Seasons）上共约 30 万张图像上进行评测，使用同一套仅在 RobotCar Seasons v2 训练数据上调优过一次的配置：

- 平均绝对 R@1 分别以 17.5%、14.8% 和 22.3% 的优势超越全局描述子方法 NetVLAD、DenseVLAD 和 AP-GEM；在 Nordland 的极端季节变化场景下，相对 NetVLAD 的优势达到 34.5%（R@1 为 44.9 对比 10.4）。
- 平均绝对 R@1 以 3.1% 的优势（相对提升 6.0%）超过一个乐观的 NetVLAD→SuperPoint+SuperGlue 重排序基线，其中在 Nordland 上的绝对优势达到 15.8%（44.9 对比 29.1）——尽管 SuperGlue 在 Tokyo 24/7 和 Pittsburgh 的部分场景上略占优势。
- **在 ECCV 2020 上赢得了 Facebook Mapillary 视觉场景识别挑战赛**：在保留测试集上取得 48.1% 的 R@1，相比 NetVLAD 基线（35.1%）绝对提升 13.0%。
- 在多个图块尺寸上使用快速空间打分的速度比多重 RANSAC 打分快 3.1 倍，而 R@1 仅下降 1.1%；经速度优化的配置比此前的最先进方法快一个数量级以上。

## 对SLAM的意义

SLAM 中的回环检测和重定位本质上正是一个场景识别问题：一次错误匹配会破坏整个位姿图，因此对感知混淆的鲁棒性比原始检索速度更重要。Patch-NetVLAD 的"全局检索后空间重排序"方案是 SLAM 回环检测前端的一个实用即插即用方案——论文本身明确将目标定为提升"SLAM 系统的整体性能"——它也影响了长期定位系统中所使用的分层检索设计。

## 相关条目

- [NetVLAD](netvlad.md) — 该方法所构建于其上的全局描述子
- [HF-Net](hf-net.md) — 分层（由粗到细）定位流程
- [hloc](hloc.md) — 该方案所接入的检索后匹配定位工具箱
- [SuperGlue](superglue.md) — 在精度优先于速度时使用的完整局部特征匹配方法
- [视觉场景识别（VPR）](../level-03-monocular-slam/visual-place-recognition-vpr.md) — 本论文所针对的任务
