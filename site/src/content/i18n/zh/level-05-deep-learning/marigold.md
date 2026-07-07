# Marigold

> Ke 2024 · [论文](https://arxiv.org/abs/2312.02145)

**一句话总结** — 通过仅微调Stable Diffusion的U-Net，使其在图像条件下对深度潜变量去噪，将Stable Diffusion改造为一个仿射不变的单目深度估计器；仅在7.4万个合成样本上训练约2.5个GPU天，并可通过对多个扩散采样结果进行集成来获得逐像素的不确定性估计。

## 问题

从单张图像恢复三维深度是几何上病态的问题——它需要*场景理解*，而不仅仅是几何。判别式深度估计器，从简单的CNN到大型Transformer，其能力仍受限于训练时所见的视觉世界，在训练中未见过的内容和布局上零样本表现挣扎。与此同时，Stable Diffusion已将互联网规模的图像集合（LAION-5B）提炼为对视觉世界的丰富先验知识。Marigold提出的问题是：如果对视觉世界的全面表征是单目深度的基石，那么能否在不遗忘该先验的情况下，从预训练的图像扩散模型*导出*一个广泛适用的深度估计器？

## 方法与架构

深度估计被表述为条件去噪扩散：在给定RGB图像$\mathbf{x}\in\mathbb{R}^{W\times H\times 3}$的条件下，建模深度$\mathbf{d}\in\mathbb{R}^{W\times H}$的条件分布$D(\mathbf{d}\,|\,\mathbf{x})$。前向过程在层级$t\in\{1,\dots,T\}$上对深度进行破坏：

$$\mathbf{d}_t=\sqrt{\bar{\alpha}_t}\,\mathbf{d}_0+\sqrt{1-\bar{\alpha}_t}\,\boldsymbol{\epsilon},\qquad \boldsymbol{\epsilon}\sim\mathcal{N}(0,I),\ \ \bar{\alpha}_t:=\textstyle\prod_{s=1}^{t}(1-\beta_s)$$

U-Net $\boldsymbol{\epsilon}_\theta$以标准去噪目标$\mathcal{L}=\mathbb{E}_{\mathbf{d}_0,\boldsymbol{\epsilon},t}\lVert\boldsymbol{\epsilon}-\hat{\boldsymbol{\epsilon}}\rVert_2^2$进行训练。一切都在Stable Diffusion v2的潜空间中运行，保持该空间不变：

- **两种模态共用冻结的VAE。** 深度图被复制为3个通道，由未修改的SD VAE编码（$\mathbf{d}\approx\mathcal{D}(\mathcal{E}(\mathbf{d}))$的误差可忽略）；推理时对解码后的3个通道取平均。
- **通过拼接实现条件化。** 图像潜变量$\mathbf{z}^{(\mathbf{x})}$和带噪深度潜变量沿特征维度拼接；U-Net第一层的输入通道数加倍，预训练的输入权重被复制并除以2。文本条件被禁用。仅微调U-Net。
- **仿射不变归一化。** 真值深度通过$\tilde{\mathbf{d}}=\left(\frac{\mathbf{d}-\mathbf{d}_2}{\mathbf{d}_{98}-\mathbf{d}_2}-0.5\right)\times 2$映射到$[-1,1]$，其中$\mathbf{d}_2,\mathbf{d}_{98}$是深度的第2和第98百分位——一种规范的、无关尺度/偏移的表征。
- **仅使用合成数据训练。** Hypersim（约5.4万室内）+ Virtual KITTI（约2万街景）——密集、无噪声的深度，VAE可直接接受（没有无效像素）。训练：1.8万次迭代，批量32，Adam学习率$3\cdot 10^{-5}$，在一块RTX 4090上约2.5天。
- **微调过程中的退火多分辨率噪声**（叠加的多尺度高斯噪声，在$t=0$退火为标准高斯）收敛更快，且大幅超越标准DDPM噪声。
- **推理与集成。** 从高斯噪声出发，使用重新排布步数为50的DDIM；通过联合优化每次运行的尺度$\hat{s}_i$和偏移$\hat{t}_i$以最小化成对距离$\lVert\hat{\mathbf{d}}'_i-\hat{\mathbf{d}}'_j\rVert_2$，再加上对逐像素中值合并图$\mathbf{m}$的正则项$\mathcal{R}=|\min(\mathbf{m})|+|1-\max(\mathbf{m})|$，将$N$次随机运行结果合并——不需要真值；样本间的分散程度同时充当不确定性度量。

## 实验结果

在五个训练中从未见过的真实数据集上进行零样本评估（指标以%表示，AbsRel越低越好，$\delta_1$越高越好）：

- **NYUv2**：AbsRel 5.5 / $\delta_1$ 96.4（带集成）vs 此前最佳HDN的6.9 / 94.8——摘要中提到的超过20%的相对提升。
- **KITTI**：9.9 / 91.6 vs DPT的10.0 / 90.1；**ETH3D**：6.5 / 96.0 vs DPT的7.8 / 94.6；**ScanNet**：6.4 / 95.1；**DIODE**：30.8 / 77.3。
- 在各基准上的平均排名为1.4，而HDN为3.2，DPT为3.9——仅用7.4万个合成样本，就超过了在30万至1200万张真实图像上训练的基线。
- 消融实验：多分辨率+退火噪声将NYUv2的AbsRel从7.7提升到5.6；对10个预测结果进行集成使NYUv2的AbsRel降低约8%（20个预测约9.5%，超过10个后收益递减）；精度在约10个DDIM步数时饱和，远少于图像生成所需的步数。

## 对SLAM的意义

Marigold证明了互联网规模的生成式先验可以迁移到几何任务上，开启了基于扩散的深度估计这一家族。对SLAM而言，其采样得到的不确定性是最突出的特点：将单目深度先验融合进SLAM后端需要一个噪声模型，而Marigold通过集成方差免费为每个像素提供了这样一个模型。其迭代式推理使其无法用于实时前端，但对于离线建图、稠密先验生成，以及作为衡量更快模型（例如Depth Anything V2）细节质量的参照标准而言，它很有价值。

## 相关条目

- [MiDaS](midas.md) — 多数据集相对深度基线
- [DPT](dpt.md) — 用于深度估计的判别式Transformer架构
- [Depth Anything V2](depth-anything-v2.md) — 用合成数据训练的更快判别式竞争者
- [Metric3D](metric3d.md) — 面向相机感知深度的度量尺度替代方案
- [Align3R](align3r.md) — 使逐帧深度（如Marigold的输出）在视频/SLAM中具备时间一致性
