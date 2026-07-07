# VoT

> Yugay 2025 · [论文](https://arxiv.org/abs/2510.03348)

**一句话总结** — Visual Odometry with Transformers（后改名为FVO，"Fast Visual Odometry with Transformers"）：将单目VO表述为直接的相对位姿回归问题，使用高容量的时间-空间Transformer结合基于置信度的加权聚合，完全取代了"网络+光束法平差"的混合流程。

## 问题

将深度网络与经典优化相结合的混合流程主导着视觉里程计领域：神经网络预测加光束法平差可以得到高精度的轨迹。但这些混合方法在速度和能力上不如纯端到端方法——它们依赖庞大、冻结的、预训练的3D骨干网络，而这些骨干网络是在尺度模糊的情况下训练的，因此该流程"本质上继承了这一局限性，并且从设计上就无法估计绝对尺度"；而且其缓慢的优化和后处理步骤成为推理速度的瓶颈。基于光束法平差的方法通常还假定相机标定已知。FVO提出的问题是：如果完全去掉后处理步骤会怎样？

## 方法与架构

**流程**：重叠的帧窗口 → 冻结的编码器 → 时间-空间Transformer解码器 → 逐对相对位姿+置信度 → 基于置信度的轨迹融合。没有光束法平差，没有相机内参，没有测试时优化。

- **编码器**：一个在DUSt3R框架内训练的冻结的3亿参数CroCo ViT。每张图像被分割成 $h \cdot w$ 个patch（$h = H/p$，$w = W/p$），得到带正弦位置编码的特征 $F \in \mathbb{R}^{N \times (h \cdot w) \times d}$。
- **时间-空间解码器**：$L = 12$ 个模块（2亿参数），每个模块依次应用多头*时间*注意力（同一空间位置在各帧间）、*空间*注意力（每帧内部）和一个MLP——这是完全注意力的一种分解替代方案（163 vs 380 GFLOPs）。可学习的相机嵌入 $\mathrm{ce} \in \mathbb{R}^d$ 被拼接进来，$F_0 = [\mathrm{ce}, F]$，且只参与空间注意力（将其注入时间注意力会降低精度）。
- **位姿输出头**：对于每一个连续帧对 $(i, i+1)$，相机嵌入经过一次线性投影输出一个14维向量：原始旋转矩阵 $\mathbf{F}_{i,i+1} \in \mathbb{R}^{3\times3}$，平移 $\mathbf{t}_{i,i+1} \in \mathbb{R}^3$，以及置信度 $\mathbf{c}_R, \mathbf{c}_t$。旋转矩阵通过正交Procrustes问题投影到流形上，该问题通过SVD求解：

$$\text{Procrustes}(\mathbf{F}_R) = \arg\min_{\hat{\mathbf{R}} \in \mathbb{SO}(3)} \|\hat{\mathbf{R}} - \mathbf{F}_R\|_F^2$$

- **考虑不确定性的损失函数**：测地线旋转误差 $\mathcal{L}_{\text{rot}} = \cos^{-1}\big(\tfrac{\mathrm{Tr}(\mathbf{R}^\top \hat{\mathbf{R}}) - 1}{2}\big)$ 和L1平移误差 $\mathcal{L}_{\text{trans}} = \|\mathbf{t} - \hat{\mathbf{t}}\|_1$ 以异方差方式结合：

$$\mathcal{L} = \mathcal{L}_{\text{rot}} \exp(-\mathbf{c}_R) + \mathbf{c}_R + \mathcal{L}_{\text{trans}} \exp(-\mathbf{c}_t) + \mathbf{c}_t,$$

  因此置信度是仅从位姿标签中自监督学习得到的——不需要深度或对应关系的监督。平移量使用训练集统计量进行反归一化，从而得到*度量尺度*的轨迹。
- **基于置信度的推理**：视频被切分为重叠的窗口 $\{1,\dots,K\}, \{2,\dots,K+1\}, \dots$，因此每个相对位姿 $(i,j)$ 会被预测 $M$ 次。置信度被转化为归一化权重 $\tilde{w}^{(k)} = \exp(-\mathbf{c}^{(k)}) / \sum_{\ell} \exp(-\mathbf{c}^{(\ell)})$；旋转通过 $\mathbb{SO}(3)$ 上的加权Fréchet均值融合，$\bar{\mathbf{R}}_{i,j} = \arg\min_{\mathbf{R}} \sum_k \tilde{w}_R^{(k)} d^2(\mathbf{R}, \mathbf{R}_{i,j}^{(k)})$，平移通过加权平均融合，轨迹则通过组合 $\mathbf{T}_{i+1} = \mathbf{T}_i \bar{\mathbf{T}}_{i,i+1}$ 得到。
- **训练**：8个输入视图，分辨率224×224，AdamW优化器，250个epoch，在12块H100 GPU上训练5天；训练数据集为ARKitScenes、ScanNet、7-Scenes、TartanAir和KITTI。

## 实验结果

使用未对齐和对齐后的ATE（RMSE，单位米）进行评估——未对齐的指标很重要，因为真实部署场景中没有真值可供对齐：

- **FVO**：ARKit 0.54 / 0.26，ScanNet 0.34 / 0.16，KITTI 50.31 / 8.47，TUM（所有方法均为零样本）0.47 / 0.19——在各项基准上均为最优或次优。
- 基线方法：MASt3R-SLAM-VO 0.60 / 0.28（ARKit），0.99 / 0.22（ScanNet），在KITTI上失败；DPVO 5.48 / 0.49（ARKit），194.55 / 9.74（KITTI）——对齐后精度良好但绝对尺度较差；VGGT 2.94 / 2.26（ARKit）；CUT3R 2.42 / 0.67（ARKit）；大型3D模型在长序列上漂移严重。
- **速度**：在RTX 3090上比最快的基线快近2倍（为公平比较，VGGT仅运行其相机头）。
- 消融实验：FVO的异方差置信度方法得到1.04的ATE，相比DUSt3R风格的逐像素置信度为1.33，无置信度方案为1.21；SO(3)投影优于四元数（1.19）、6D（1.12）和Plücker射线（1.17）等旋转表示方式；CroCoV2-DUSt3R骨干网络（1.04）大幅优于DINOv2-VGGT（1.31）。随着训练数据增多和解码器层数增加，ATE持续下降。

## 对SLAM的意义

VoT/FVO是几何估计向Transformer架构迁移这一更广泛趋势的一部分——同样的趋势也催生了用于匹配的LoFTR和用于完整多视图几何的VGGT。对于一个SLAM学习者而言，它的价值在于成为设计空间中端到端极端方案的一个清晰案例研究：删除优化器所获得的收益（速度、度量尺度、无需标定）以及所付出的代价（可解释的几何骨架、动态场景中的鲁棒性）。请注意命名的变化：这项arXiv工作最初以"VoT"之名发表，后来改名为FVO。

## 相关条目

- [DROID-SLAM](droid-slam.md) — CNN+优化的学习型SLAM基线
- [DPVO](dpvo.md) — 基于稀疏patch的学习型VO基线
- [VGGT](vggt.md) — 同一趋势中的完整前馈Transformer几何方法
- [LoFTR](loftr.md) — 基于Transformer的无检测器匹配方法
- [TartanVO](tartanvo.md) — 更早期的、保留了几何风格输出的可泛化学习型VO
