# LoFTR

> Sun 2021 · [论文](https://arxiv.org/abs/2104.00680)

**一句话总结** — 使用Transformer实现无检测器的密集特征匹配：自注意力和交叉注意力使特征同时依赖于两幅图像，即使在特征检测器失效的低纹理区域也能产生可靠的匹配。

## 问题

经典流水线*依次*执行特征检测、描述和匹配，因此一切都取决于检测器能否在两幅图像中都产生可重复的兴趣点——而检测器在低纹理区域（空白墙面、地面）和重复图案下众所周知会失败。现有的密集替代方案通过代价体（cost volume）搜索对应关系，这种方式开销大，且仍然依赖局部证据。LoFTR完全跳过检测步骤：先在粗略层级上建立逐像素的密集匹配，然后细化其中好的部分——利用Transformer的全局感受野，同时依据两幅图像来决定匹配内容。

## 方法与架构

**骨干网络。** 一个ResNet-18+FPN的CNN以1/8分辨率提取粗特征$\tilde{F}^A, \tilde{F}^B$，以1/2分辨率提取细特征$\hat{F}^A, \hat{F}^B$。

**LoFTR模块。** 二维正弦位置编码（只添加一次）使特征具有位置依赖性——这对于匹配缺乏区分度的区域至关重要。随后$N_c = 4$个交替的自注意力和交叉注意力层将粗特征转换为$\tilde{F}^A_{tr}, \tilde{F}^B_{tr}$。普通注意力$\mathrm{Attention}(Q,K,V) = \mathrm{softmax}(QK^T)\,V$的开销为$O(N^2)$，因此LoFTR使用线性Transformer核：

$$ \mathrm{sim}(Q,K) = \phi(Q)\cdot\phi(K)^{T}, \quad \phi(\cdot) = \mathrm{elu}(\cdot) + 1 $$

利用矩阵乘积的结合性（先计算$\phi(K)^T V$，特征维度$D \ll N$），将开销降至$O(N)$。

**粗匹配。** 得分矩阵$\mathcal{S}(i,j) = \frac{1}{\tau} \langle \tilde{F}^A_{tr}(i), \tilde{F}^B_{tr}(j) \rangle$被送入一个最优传输层（如SuperGlue中）或*双softmax*：

$$ \mathcal{P}_c(i,j) = \mathrm{softmax}\big(\mathcal{S}(i,\cdot)\big)_j \cdot \mathrm{softmax}\big(\mathcal{S}(\cdot,j)\big)_i $$

粗匹配是在$\mathcal{P}_c$中互为最近邻且置信度$\geq \theta_c = 0.2$的点对。

**粗到细的细化。** 对每个粗匹配，从细特征图中裁剪出$w \times w = 5 \times 5$的局部窗口，并通过一个更小的LoFTR模块（$N_f = 1$）进行变换；将查询窗口的中心向量与另一个窗口进行相关运算，得到一个匹配概率热图，其期望值给出亚像素位置$\hat{j}'$。

**监督。** $\mathcal{L} = \mathcal{L}_c + \mathcal{L}_f$：对真实粗网格匹配（来自位姿+深度，如SuperGlue中所用）的负对数似然，加上对细偏移量的热图方差加权$\ell_2$损失：

$$ \mathcal{L}_f = \frac{1}{|\mathcal{M}_f|} \sum_{(\hat{i},\hat{j}')\in\mathcal{M}_f} \frac{1}{\sigma^2(\hat{i})} \big\lVert \hat{j}' - \hat{j}'_{gt} \big\rVert_2 $$

**开销。** 在RTX 2080Ti上，使用双softmax处理一对640×480图像耗时116毫秒（使用最优传输时为130毫秒）；端到端从头训练，室内模型在64块GTX 1080Ti GPU上训练24小时。

## 实验结果

- **HPatches单应变换：** AUC@3px为65.9，而SuperPoint+SuperGlue为53.9，DRC-Net为50.6；在更严格的阈值下差距进一步扩大。
- **室内位姿（ScanNet，1500个测试对）：** LoFTR-DS的AUC@5°/10°/20° = 22.06/40.8/57.62，而SuperPoint+SuperGlue为16.16/33.81/51.84，DRC-Net为7.69/17.93/30.49——最大的提升恰恰出现在低纹理、宽基线的室内场景中。
- **室外位姿（MegaDepth）：** LoFTR-DS为52.8/69.19/81.18，而SuperPoint+SuperGlue为42.18/61.16/75.96（AUC@10°提升13%），比无检测器的DRC-Net在AUC@10°上高出61%。
- **视觉定位：** 发表时，在长期视觉定位基准的两条赛道上于已发表方法中排名第一——在Aachen v1.1夜间局部特征赛道上最佳（LoFTR-DS 72.8/88.5/99.0），在InLoc上（配合hloc）为已发表方法中最佳（DUC1 47.5/72.2/84.8，DUC2 54.2/74.8/85.5）。
- **消融实验：** 用参数量相当的卷积替换LoFTR模块会大幅降低AUC（14.98 vs 22.06 @5°）；DETR风格的逐层位置编码也会造成损害。

## 对SLAM的意义

室内SLAM在没有可检测目标的地方（空白墙面、地面、重复表面）经常失败。LoFTR证明了具有全局上下文的匹配器仍能在此类场景中产生对应关系，并确立了无检测器范式，RoMa、EfficientLoFTR和许多其他方法都建立在此基础之上。在实践中，当稀疏匹配过于脆弱时，它是室内重建、宽基线重定位和回环检测验证的首选方案，代价是比稀疏匹配器需要更多计算。

## 相关条目

- [SuperGlue](superglue.md) — 对应的稀疏学习型匹配方案
- [LightGlue](lightglue.md) — 快速稀疏匹配器；注重效率的替代方案
- [RoMa](roma.md) — 使用基础模型特征的密集匹配
- [SuperPoint](superpoint.md) — LoFTR所规避的基于检测器的范式
- [HF-Net](hf-net.md) — 无检测器匹配器可嵌入的视觉定位流水线
