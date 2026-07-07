# LightGlue

> Lindenberger 2023 · [论文](https://arxiv.org/abs/2306.13643)

**一句话总结** — 重新设计的SuperGlue，通过自适应深度和宽度大幅提速：简单的图像对提前退出网络，而被自信匹配或拒绝的特征点则从后续计算中被剪除。

## 问题

SuperGlue确立了学习型稀疏匹配作为最先进技术的地位，但它花费的是*固定*的计算预算：无论图像对的难度如何，每个特征点都要经过每一层，其Sinkhorn最优传输头开销很大且众所周知难以训练——后续工作未能达到原始模型的性能。LightGlue逐一重新审视SuperGlue的设计决策，推导出简单但有效的改进，并使推理能够根据每对图像的难度自适应调整。

## 方法与架构

给定来自图像$A$和$B$的局部特征（归一化位置$\mathbf{p}_i \in [0,1]^2$，描述子$\mathbf{d}_i \in \mathbb{R}^d$，$d{=}256$），LightGlue堆叠了$L = 9$个相同的层，每层由一个自注意力+一个交叉注意力单元（4个头）组成，用于更新逐点状态$\mathbf{x}_i$（初始化为$\mathbf{d}_i$）：

$$ \mathbf{x}^{I}_{i} \leftarrow \mathbf{x}^{I}_{i} + \mathrm{MLP}\big(\big[\mathbf{x}^{I}_{i} \,\Vert\, \mathbf{m}^{I\leftarrow S}_{i}\big]\big) $$

其中$\mathbf{m}^{I\leftarrow S}_i$是源图像$S$中状态的注意力加权平均。

- **相对旋转位置编码（自注意力）：** $a_{ij} = \mathbf{q}_i^\top\, \mathbf{R}(\mathbf{p}_j - \mathbf{p}_i)\, \mathbf{k}_j$，其中$\mathbf{R}$通过投影到学习到的基上，将$d/2$个二维子空间旋转——只捕捉*相对*位置（对相机平面内平移具有等变性），在每一层都应用，而不是SuperGlue那种网络容易遗忘的绝对MLP编码。
- **双向交叉注意力：** 仅用键，不用查询：$a^{IS}_{ij} = \mathbf{k}_i^{I\top} \mathbf{k}_j^{S} = a^{SI}_{ji}$，因此$O(NMd)$的相似度只需计算一次即可用于两个方向（节省20%运行时间）。
- **轻量级匹配头，取代Sinkhorn+dustbin：** 逐对相似度$\mathbf{S}_{ij} = \mathrm{Linear}(\mathbf{x}_i^A)^\top \mathrm{Linear}(\mathbf{x}_j^B)$与逐点可匹配性$\sigma_i = \mathrm{Sigmoid}(\mathrm{Linear}(\mathbf{x}_i))$*解耦*，组合为：

$$ \mathbf{P}_{ij} = \sigma_i^A\, \sigma_j^B\, \mathrm{Softmax}_{k \in \mathcal{A}}(\mathbf{S}_{kj})_i\, \mathrm{Softmax}_{k \in \mathcal{B}}(\mathbf{S}_{ik})_j $$

  对应关系是那些$\mathbf{P}_{ij}$超过阈值且在其行和列上均为最大值的点对——这是互近邻搜索与学习到的内点分类器的融合，比最优传输便宜得多。
- **自适应深度（提前退出）：** 一个紧凑的MLP在每一层之后预测逐点置信度$c_i = \mathrm{Sigmoid}(\mathrm{MLP}(\mathbf{x}_i))$；当满足$c_i > \lambda_\ell$的点的比例超过比率$\alpha$时，推理停止。
- **自适应宽度（点剪除）：** 既自信又不可匹配的点会从后续层中被剔除，从而降低二次方的注意力开销。
- **深度监督：** 由于匹配头开销低，因此在*每一层*都用负对数似然预测并监督分配结果（加上不可匹配集合$\bar{\mathcal{A}}, \bar{\mathcal{B}}$上的平衡可匹配性项）；置信度分类器随后训练，用于预测某一层的匹配是否已经等同于最后一层的匹配。
- **训练方案：** 先在100万张图像的合成单应变换上预训练，再在MegaDepth上微调；每张图像2000个点，梯度检查点+混合精度使32对图像能在一块24GB GPU上训练——在几个GPU天内即达到最先进精度。

## 实验结果

- **MegaDepth-1500相对位姿（SuperPoint特征，2048个特征点）：** LightGlue的RANSAC AUC@5°/10°/20° = 49.9/67.0/80.1，耗时44.2毫秒，而SuperGlue为49.7/67.1/80.6，耗时70.0毫秒；用LO-RANSAC时为66.7/79.3/87.9，而SuperGlue为65.8/78.7/87.5。自适应变体在31.4毫秒内保持49.4/67.2/80.1——比SuperGlue和SGMNet快2倍以上,比密集匹配器（LoFTR 181毫秒，ASpanFormer 369毫秒）快5–11倍。
- **HPatches单应变换：** 在稀疏匹配器中精度最高（P 88.9 vs SuperGlue的87.4），DLT AUC也最好（35.9/78.6 @1/5px）。
- **Aachen昼夜定位（hloc，4096个特征点）：** 白天90.2/96.0/99.4，夜晚77.0/91.1/100——与SuperGlue（89.8/96.1/99.4，77.0/90.6/100）相当，速度为17.3 vs 6.4对/秒（约2.5倍；使用优化过的flash-attention变体时为4倍，可实时匹配4096个特征点）。
- **消融实验（相同的单应变换训练）：** LightGlue精度达到86.8/召回率96.3，而SuperGlue为74.6/90.5（精度+12%，召回率+4%），耗时19.4 vs 29.1毫秒，且收敛速度快得多。
- **自适应性：** 简单图像对在9层中约4.7层后即退出，实现1.86倍加速；困难图像对仍能剪除约28%的点。在IMC 2021上，DISK(8K)+LightGlue排名第一（平均AUC@5°/10° = 58.8/70.0）。

## 对SLAM的意义

SuperGlue证明了学习型匹配比最近邻+比率检验更鲁棒，但其固定的计算预算使其在实时SLAM中显得笨拙。LightGlue的核心洞见——按问题难度分配计算量，在高重叠的跟踪帧上节省算力，在宽基线回环检测上深入计算——使学习型匹配在延迟敏感的流水线中变得实用，并取代SuperGlue成为hloc定位工具箱中的默认匹配器。如果你今天要构建一个现代的基于特征的SLAM或重定位流水线，SuperPoint（或DISK/SIFT）+ LightGlue是标准的起点。

## 相关条目

- [SuperGlue](superglue.md) — 它加速的前身
- [SuperPoint](superpoint.md) — 与其配对最常见的特征
- [DISK](disk.md) — 原生支持LightGlue的替代特征骨干网络
- [LoFTR](loftr.md) — 无检测器的密集替代方案
- [XFeat](xfeat.md) — 追求同样效率目标的轻量级特征
- [hloc](hloc.md) — 如今以它为默认匹配器的定位工具箱
