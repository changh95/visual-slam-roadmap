# Deep Image Retrieval

**深度图像检索（Deep image retrieval）**用神经网络生成的嵌入向量取代了手工设计的全局图像描述子（视觉词袋、VLAD、Fisher向量）：图像 $I$ 被映射为一个紧凑的向量 $f(I) \in \mathbb{R}^D$，使得*同一地点*（或同一物体）的图像在嵌入空间中彼此靠近，而不同地点的图像则相距较远。检索问题于是简化为在数据库嵌入之间进行（近似）最近邻搜索——这正是SLAM系统在回环检测候选生成和重定位中所需要的操作。

## 从CNN特征到全局描述子

将卷积骨干网络应用于图像会得到一个 $H \times W \times C$ 的激活张量——本质上是一个由 $C$ 维局部特征组成的密集网格。深度检索方法之间的主要差异在于如何将这个张量**汇聚（pool）**为单一向量：

- **SPoC / 求和汇聚**：对空间网格上的激活求平均。
- **MAC / 最大值汇聚**：取每个通道的最大值；**R-MAC**在一组图像区域上聚合最大值汇聚描述子，以获得一定的平移容忍度。
- **GeM（广义平均）汇聚**用一个可学习的指数 $p$ 在两者之间插值：

$$
f_c = \left( \frac{1}{|\mathcal{X}_c|} \sum_{x \in \mathcal{X}_c} x^{\,p} \right)^{1/p}
$$

  其中 $\mathcal{X}_c$ 是通道 $c$ 中的激活集合。设 $p = 1$ 即为平均汇聚，$p \to \infty$ 即为最大值汇聚；实践中一个学到的 $p \approx 3$ 效果很好（Radenović 等）。
- **NetVLAD**（Arandjelović 等，2016）是VLAD的可微分版本：每个局部描述子 $\mathbf{x}_i$ 被*软性*地分配到 $K$ 个学习得到的聚类中心 $\mathbf{c}_k$ 上，残差按聚类累加：

$$
V(j,k) = \sum_i \bar{a}_k(\mathbf{x}_i)\,\big(x_i^{(j)} - c_k^{(j)}\big)
$$

  其中 $\bar{a}_k$ 是对聚类相似度的softmax。矩阵 $V$ 经过内部归一化、展平并做L2归一化。

得到的描述子通常会用**PCA + 白化**压缩到几百维，图像间用余弦/L2距离进行比较。

## 训练：度量学习

该嵌入使用排序目标而非分类损失来训练。经典选择是在锚点 $a$、正样本 $p$（同一地点）和负样本 $n$（不同地点）上的**三元组损失（triplet loss）**：

$$
L = \max\big(0,\; m + d(f_a, f_p) - d(f_a, f_n)\big)
$$

该损失会促使正样本比负样本更靠近锚点，且至少有一个边距 $m$。监督信号获取成本很低：

- **弱GPS监督**（NetVLAD）：带地理标签的街景全景图提供潜在的正样本；网络挑选最匹配的一张，而困难负样本则从远处的地点中挖掘。
- **基于SfM的监督**（GeM）：来自运动恢复结构的三维重建定义了哪些图像真正共同观察了同一场景，从而无需人工标注即可获得干净的正/负样本。

## 全局检索 + 局部重排序

单靠全局描述子可能会混淆视觉相似但实际不同的地点（感知混淆，perceptual aliasing）。因此现代流水线采用**两阶段**设计：

1. **检索**：按全局描述子距离取出前 $k$ 张数据库图像（快速、可扩展）。
2. **重排序/验证**：用局部特征匹配和几何验证（例如在对极模型或PnP模型上做RANSAC）对候选项进行重排序。

DELF/DELG将两个阶段耦合在一个网络中（注意力选择的深度局部特征加上一个全局头）；**HF-Net**将一个全局检索头和SuperPoint风格的局部特征蒸馏到同一个网络中，用于**层级定位（hierarchical localization）**——这正是`hloc`工具箱以及大规模视觉重定位系统所采用的模式。Patch-NetVLAD则用图像块的多尺度NetVLAD描述子来进行重排序。

## 对SLAM的意义

回环检测和重定位本质上是检索问题：给定当前帧，找到之前建图过程中显示同一地点的帧。经典的BoW（DBoW2）在外观稳定时效果良好，但在昼夜、季节或天气变化下会严重退化，因为它建立在手工设计的局部描述子之上。学习得到的全局描述子恰恰被训练为对这类条件变化具有不变性，并且每个关键帧只产生一个紧凑的向量——存储在关键帧数据库中的代价很低，搜索速度也很快。理解"先检索后验证"的结构也能解释现代重定位技术栈（HF-Net/hloc、Patch-NetVLAD）以及必须在多机器人之间匹配地点的协同SLAM系统的架构。

## 动手实践

- [Deep global feature detection](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_10)

## 相关条目

- [Bag of Visual Words](bag-of-visual-words.md)
- [NetVLAD](../level-05-deep-learning/netvlad.md)
- [HF-Net](../level-05-deep-learning/hf-net.md)
- [Patch NetVLAD](../level-05-deep-learning/patch-netvlad.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
