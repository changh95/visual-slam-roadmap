# NetVLAD

> Arandjelović 2016 · [论文](https://arxiv.org/abs/1511.07247)

**一句话总结** — 一种用于大规模视觉场景识别的端到端可训练 CNN，其核心是一个可微的 VLAD 池化层，通过带有 GPS 标签的弱监督街景图像进行训练。

## 问题

大规模视觉场景识别——快速准确地识别一张查询照片是在哪里拍摄的——需要一个紧凑而具有判别力的图像级描述子。经典的 VLAD（局部聚合描述子向量）方法能很好地聚合局部描述子，但使用的是硬聚类分配，因此无法端到端训练，而现成的 CNN 特征也从未针对场景识别任务进行过优化（其 conv5 激活值甚至没有被训练成在欧氏距离下可比较）。另一个障碍是监督信号：没有人会手工标注哪些图像描绘的是同一个地方，因此训练必须依赖带噪声的弱监督 GPS 标签数据。

## 方法与架构

一个基础 CNN（VGG-16 或 AlexNet，在 conv5 的 ReLU 之前截断）将图像转化为 $N$ 个 D 维局部描述子 $\mathbf{x}_i$；NetVLAD 层随后将它们相对于 $K$ 个聚类中心 $\mathbf{c}_k$ 进行聚合。经典 VLAD 存储的是每个聚类的残差和，$V(j,k)=\sum_{i=1}^{N}a_{k}(\mathbf{x}_{i})\left(x_{i}(j)-c_{k}(j)\right)$，其中硬分配 $a_k \in \{0,1\}$ 正是不可微的来源。NetVLAD 用一种学习得到的软分配（对到各中心距离的一个 softmax，其中描述子范数项相互抵消）取而代之：

$$\bar{a}_{k}(\mathbf{x}_{i})=\frac{e^{\mathbf{w}_{k}^{T}\mathbf{x}_{i}+b_{k}}}{\sum_{k'}e^{\mathbf{w}_{k'}^{T}\mathbf{x}_{i}+b_{k'}}}, \qquad V(j,k)=\sum_{i=1}^{N}\bar{a}_{k}(\mathbf{x}_{i})\left(x_{i}(j)-c_{k}(j)\right)$$

从聚类初始化时，$\mathbf{w}_{k}=2\alpha\mathbf{c}_{k}$ 且 $b_{k}=-\alpha\lVert\mathbf{c}_{k}\rVert^{2}$，当 $\alpha\to\infty$ 时可以恢复出 VLAD；关键在于，$\{\mathbf{w}_k\},\{b_k\},\{\mathbf{c}_k\}$ 是三组*相互解耦*的可训练参数集合，这比 VLAD 提供了更大的灵活性（锚点可以移动，从而使不匹配图像的残差变得不相似）。该层可分解为标准操作——一个 $1{\times}1$ 卷积、一个 softmax、残差聚合核心、内部归一化以及最终的 L2 归一化——因此可以插入任何 CNN 中并进行反向传播。当 $K=64$ 时，输出为 32k 维（VGG-16），经 PCA 白化后得到一个 4096 维的全局描述子用于最近邻检索。

训练使用谷歌街景 Time Machine 全景图：同一地点相隔数年拍摄的图像为每个查询 $q$ 提供了基于 GPS 的*潜在*正样本 $\{p_i^q\}$（距离很近，但可能朝向不同方向）以及确定的负样本 $\{n_j^q\}$（距离很远）。一种弱监督三元组排序损失通过取最小值自动挑选出最佳匹配的正样本：

$$L_{\theta}=\sum_{j}l\Big(\min_{i}d_{\theta}^{2}(q,p_{i}^{q})+m-d_{\theta}^{2}(q,n_{j}^{q})\Big)$$

其中 $l(x)=\max(x,0)$ 是铰链损失，$m$ 是边界值——这是对三元组损失的一种多示例学习式改进，能够容忍带噪声的 GPS 标签。整个网络使用 SGD 进行训练。

## 实验结果

评测使用 recall@N 指标（若前 N 个数据库图像中有一张位于查询点 25 米范围内，则视为正确），在 Pittsburgh 250k（25 万张数据库图像，2.4 万条查询）和 Tokyo 24/7（7.6 万张数据库图像，315 条手机拍摄查询，包括与白天数据库进行匹配的日落/夜间图像）上进行。端到端训练效果显著：在 Pitts250k-test 上，经过训练的 AlexNet+NetVLAD 达到 81.0% 的 recall@1，而使用标准 VLAD 的现成 AlexNet 特征仅为 55.0%——相对提升达 47%。4096 维的 VGG-16 NetVLAD+白化描述子在所有基准上都创造了当时的最先进水平，超越了最好的局部特征紧凑描述子（密集 RootSIFT+VLAD+白化）以及 Torii 等人的视角合成方法。NetVLAD 还表现出优雅的降级特性：128 维的 NetVLAD 与 512 维的最大池化性能相当（在 Tokyo 24/7 上分别为 42.9% 和 38.4% 的 recall@1）。Time Machine 数据本身也至关重要——在 Pitts30k-val 上使用 AlexNet 最大池化，recall@1 从 33.5%（现成特征）提升到 38.7%（不使用 Time Machine 训练）再提升到 68.5%（使用 Time Machine 训练），因为同一时间拍摄的查询/数据库图像对会让网络学到诸如记住停放车辆之类的捷径。

## 对SLAM的意义

回环检测和重定位本质上就是场景识别问题，而 NetVLAD 的描述子多年来一直是这两项任务事实上的标准——它是 hloc 流程以及无数 SLAM 系统中全局检索阶段所采用的方法。它还确立了学习式场景识别的模板（CNN 骨干网络 + 可训练聚合层 + 弱监督度量学习），这一模板至今仍被 Patch-NetVLAD、CosPlace、MixVPR 以及当今基于基础模型的视觉场景识别方法所沿用。

## 动手实践

- [深度全局特征检测](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_10)

## 相关条目

- [Patch NetVLAD](patch-netvlad.md) — 带空间重排序的多尺度图块级后续工作
- [HF-Net](hf-net.md) — 建立在 NetVLAD 检索基础上的分层定位方法
- [视觉场景识别（VPR）](../level-03-monocular-slam/visual-place-recognition-vpr.md) — 该任务在 SLAM 语境下的介绍
- [SuperPoint](superpoint.md) — 学习式定位流程中对应的局部特征方法
