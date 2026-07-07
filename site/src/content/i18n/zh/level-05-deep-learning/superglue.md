# SuperGlue

> Sarlin 2020 · [论文](https://arxiv.org/abs/1911.11763)

**一句话总结** — 一种图神经网络特征匹配器，使用自注意力和交叉注意力，加上可微的Sinkhorn最优传输(带一个用于处理未匹配点的垫箱dustbin)，取代脆弱的最近邻匹配。

## 问题

经典特征匹配是一条由手工设计的启发式规则组成的流水线：在描述子空间中做最近邻搜索、比率测试、互检验，再用RANSAC清理结果。每个描述子都被独立比较——没有对其他关键点、场景几何或哪些点在另一张图像中根本*不可见*进行推理。在强烈的视角变化、重复结构或部分重叠情况下，这套流程会失效。SuperGlue将匹配本身重新构造为一个可学习的优化问题：联合寻找对应关系*并*剔除不可匹配的点，利用两个物理约束——一个关键点最多只有一个对应关系，且某些关键点由于遮挡或检测器失效而不可匹配。

## 方法与架构

给定图像$A, B$，各有$M$和$N$个局部特征(位置$\mathbf{p}_i := (x, y, c)_i$，$c$为检测置信度，描述子$\mathbf{d}_i \in \mathbb{R}^D$，例如SuperPoint或SIFT)，SuperGlue预测一个部分软分配矩阵$\mathbf{P} \in [0,1]^{M \times N}$，满足$\mathbf{P}\mathbf{1}_N \leq \mathbf{1}_M$和$\mathbf{P}^\top \mathbf{1}_M \leq \mathbf{1}_N$。分为两个模块：

**1. 注意力图神经网络。** 一个关键点编码器将位置嵌入到描述子中，使外观和布局被联合推理：

$$ {}^{(0)}\mathbf{x}_i = \mathbf{d}_i + \mathrm{MLP}_{\mathrm{enc}}(\mathbf{p}_i) $$

两张图像的所有关键点构成一个完整的*多路复用*图，包含自身边(图像内)和交叉边(图像间)。一个残差消息传递更新运行$L$层，在自身边和交叉边之间交替：

$$ {}^{(\ell+1)}\mathbf{x}_i^A = {}^{(\ell)}\mathbf{x}_i^A + \mathrm{MLP}\big(\big[{}^{(\ell)}\mathbf{x}_i^A \,\Vert\, \mathbf{m}_{\mathcal{E}\rightarrow i}\big]\big) $$

消息是注意力聚合，$\mathbf{m}_{\mathcal{E}\rightarrow i} = \sum_{j} \alpha_{ij} \mathbf{v}_j$，权重为$\alpha_{ij} = \mathrm{Softmax}_j(\mathbf{q}_i^\top \mathbf{k}_j)$，在边集合上计算——自注意力使一个关键点能够关注自身图像中的显著点，交叉注意力使其能够关注另一图像中的候选匹配点。最终的匹配描述子是线性投影$\mathbf{f}_i^A = \mathbf{W}\,{}^{(L)}\mathbf{x}_i^A + \mathbf{b}$。

**2. 最优匹配层。** 成对分数为内积$\mathbf{S}_{i,j} = \langle \mathbf{f}_i^A, \mathbf{f}_j^B \rangle$。分数矩阵被扩充一行一列的垫箱(dustbin)，填充一个单一的可学习标量$z$，使被遮挡/未检测到的点能够被显式分配。该熵正则化最优传输问题通过$T$次可微的Sinkhorn迭代求解(对$\exp(\bar{\mathbf{S}})$进行迭代的行/列归一化)，得到$\bar{\mathbf{P}}$；去掉垫箱后即恢复出$\mathbf{P}$。

**监督。** 基于真值匹配集$\mathcal{M}$(来自位姿+深度或单应性)以及未匹配集合$\mathcal{I}, \mathcal{J}$的负对数似然：

$$ \mathrm{Loss} = -\sum_{(i,j)\in\mathcal{M}} \log \bar{\mathbf{P}}_{i,j} - \sum_{i\in\mathcal{I}} \log \bar{\mathbf{P}}_{i,N+1} - \sum_{j\in\mathcal{J}} \log \bar{\mathbf{P}}_{M+1,j} $$

**细节：** $D = 256$，$L = 9$层4头注意力，$T = 100$次Sinkhorn迭代，1200万参数；在GTX 1080 GPU上，室内图像对的前向传播平均耗时69 ms(15 FPS)。测试时匹配置信度阈值为0.2。

## 实验结果

- **单应性估计**(在Oxford/Paris 100万干扰图像上做合成单应性变换)：召回率98.3%，精度90.7%；使用普通DLT时AUC为65.85，而RANSAC为53.67——对应关系干净到一个非鲁棒的最小二乘求解器就能超过RANSAC。NN匹配的DLT AUC为0.00；OANet为52.29。
- **室内位姿(ScanNet，1500个宽基线测试对)：** SuperPoint+SuperGlue的位姿AUC@5°/10°/20°为16.16/33.81/51.84，而SuperPoint+OANet为11.76/26.90/43.85，NN+互检验为9.43/21.53/36.40；精度84.4%。使用SIFT时为6.71/15.70/28.67，正确匹配数量最多可达比率测试匹配的10倍。
- **室外位姿(PhotoTourism)：** SuperPoint+SuperGlue的AUC@5°/10°/20°为34.18/50.32/64.16，而OANet为21.03/34.08/46.88；精度84.9%。SIFT+SuperGlue为23.68/36.44/49.44，而比率测试为15.19/24.72/35.30。
- **消融实验：** GNN解释了大部分性能提升；将梯度反向传播到SuperPoint描述子中，可将AUC@20°从51.84提升到53.38，展示出通往端到端学习的路径。

## 对SLAM的意义

SuperGlue改变了困难数据关联问题的前端方案：SuperPoint + SuperGlue通过hloc流水线成为视觉定位、宽基线回环检测和建图的主流基线。就SLAM而言，它使得在描述子距离匹配失效的昼夜变化和强视角变化场景下的重定位成为可能。论文本身将这一可学习的中间端(middle-end)描述为"迈向端到端深度SLAM的重要里程碑"。其代价——每帧都要对所有关键点做全注意力——催生了LightGlue这一更高效的后继者，如今已成为实时场景下的标准选择。

## 相关条目

- [SuperPoint](superpoint.md) — 它通常搭配匹配的检测器/描述子
- [LightGlue](lightglue.md) — 更快的自适应后继者
- [LoFTR](loftr.md) — 无检测器的稠密替代方案
- [HF-Net](hf-net.md) — 围绕它构建的分层定位流水线
- [hloc](hloc.md) — 将其作为标准匹配器的定位工具箱
