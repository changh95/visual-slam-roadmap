# DreamFusion

> Poole 2023 · [论文](https://arxiv.org/abs/2209.14988)

**一句话总结** — DreamFusion 使用一个预训练的二维文生图扩散模型（Imagen）作为冻结先验，通过分数蒸馏采样（Score Distillation Sampling, SDS）损失，仅凭文本提示即可优化出一个 NeRF，从而在没有任何三维训练数据的情况下实现文本到三维的生成。

## 问题

文生图合成因在数十亿图文对上训练的扩散模型而发生了变革，但将这一方案迁移到三维需要两个当时并不存在的东西：大规模标注三维数据，以及能够直接对三维数据去噪的高效架构。NeRF 已经证明，一个三维场景可以是仅通过其渲染图像上的图像空间损失优化出的网络。DreamFusion 提出的问题是：一个冻结的二维扩散模型能否*充当*这种图像空间损失——即在 NeRF 参数空间而非像素空间中采样，从而使全部三维知识都从纯二维先验中蒸馏出来。

## 方法与架构

**扩散先验。** 一个文本条件扩散模型使用如下加权去噪目标进行训练：
$$\mathcal{L}_{\text{Diff}}(\phi, \mathbf{x}) = \mathbb{E}_{t \sim \mathcal{U}(0,1),\, \epsilon \sim \mathcal{N}(\mathbf{0},\mathbf{I})}\big[ w(t)\, \| \epsilon_\phi(\alpha_t \mathbf{x} + \sigma_t \epsilon; t) - \epsilon \|_2^2 \big],$$
DreamFusion 使用其无分类器引导（classifier-free-guided）噪声预测 $\hat{\epsilon}_\phi(\mathbf{z}_t; y, t) = (1+\omega)\,\epsilon_\phi(\mathbf{z}_t; y, t) - \omega\,\epsilon_\phi(\mathbf{z}_t; t)$，并采用异常大的引导权重 $\omega = 100$。

**分数蒸馏采样。** 一个可微图像参数化 $\mathbf{x} = g(\theta)$（此处为 NeRF 渲染器）被优化，使其渲染结果看起来像是扩散模型的采样结果。若通过 U-Net 对 $\mathcal{L}_{\text{Diff}}$ 求导，代价高昂且条件数很差；省去 U-Net 的雅可比矩阵便得到 SDS 梯度：
$$\nabla_\theta \mathcal{L}_{\text{SDS}}(\phi, \mathbf{x} = g(\theta)) \triangleq \mathbb{E}_{t,\epsilon}\Big[ w(t)\big(\hat{\epsilon}_\phi(\mathbf{z}_t; y, t) - \epsilon\big) \tfrac{\partial \mathbf{x}}{\partial \theta} \Big],$$
论文证明这正是一个加权概率密度蒸馏损失的梯度，即 $\nabla_\theta\, \mathbb{E}_t\big[ (\sigma_t / \alpha_t)\, w(t)\, \text{KL}\big(q(\mathbf{z}_t \mid g(\theta); y, t)\ \|\ p_\phi(\mathbf{z}_t; y, t)\big)\big]$。因此不需要对扩散模型进行反向传播——它充当一个冻结的评判器，其噪声残差指向该提示 $y$ 下密度更高的图像方向。

**带光照的 NeRF。** 三维画布是 mip-NeRF 360 的一个变体，其 MLP 输出密度和*反照率（albedo）*，$(\tau, \boldsymbol{\rho}) = \text{MLP}(\boldsymbol{\mu}; \theta)$，并用标准体渲染权重 $w_i = \alpha_i \prod_{j<i}(1-\alpha_j)$、$\alpha_i = 1 - \exp(-\tau_i\|\boldsymbol{\mu}_i - \boldsymbol{\mu}_{i+1}\|)$ 进行合成。表面法向量来自密度梯度，$\mathbf{n} = -\nabla_{\boldsymbol{\mu}}\tau / \|\nabla_{\boldsymbol{\mu}}\tau\|$，每个点由一个随机放置的点光源 $\boldsymbol{\ell}$ 进行朗伯着色：
$$\mathbf{c} = \boldsymbol{\rho} \circ \big(\boldsymbol{\ell}_\rho \circ \max(0,\ \mathbf{n} \cdot (\boldsymbol{\ell} - \boldsymbol{\mu}) / \|\boldsymbol{\ell} - \boldsymbol{\mu}\|) + \boldsymbol{\ell}_a\big).$$
随机将反照率替换为白色，可得到“无纹理”渲染图，从而避免场景内容被绘制到平面几何上的退化解（平面广告牌解）。

**逐提示优化循环。** 每次迭代：（1）随机采样一个相机（俯仰角 $-10°$ 到 $90°$，全方位角，距离 1–1.5）以及一个光源；（2）在 64×64 分辨率下渲染带光照的 NeRF，在带光照渲染、仅反照率渲染和无纹理渲染之间进行选择；（3）在提示词后附加视角相关文本（“正面/侧面/背面/俯视视图”），并使用冻结的 64×64 Imagen 基础模型（$w(t)=\sigma_t^2$，$t \sim \mathcal{U}(0.02, 0.98)$）计算 SDS 梯度；（4）用 Distributed Shampoo 更新 NeRF 权重。15,000 次迭代在 4 芯片 TPUv4 上耗时约 1.5 小时；不透明度和朝向正则化项使密度场保持干净。

## 实验结果

使用 **CLIP R-Precision**（CLIP 能否从渲染图中检索出正确的描述文本？）在 Dream Fields 的 153 个以物体为中心的 COCO 提示词上评估，同时评估彩色渲染和*无纹理几何*（“Geo”）渲染：

| 方法 | B/32 彩色 | B/32 几何 | B/16 彩色 | B/16 几何 | L/14 彩色 | L/14 几何 |
|---|---|---|---|---|---|---|
| 真实 MS-COCO 图像 | 77.1 | – | 79.1 | – | – | – |
| Dream Fields | 68.3 | – | 74.2 | – | – | – |
| CLIP-Mesh | 67.8 | – | 75.8 | – | 74.5 | – |
| **DreamFusion** | **75.1** | **42.5** | **77.5** | **46.6** | **79.7** | **58.5** |

DreamFusion 在彩色渲染上接近真实图像的一致性，同时是唯一在几何得分上表现强劲的方法（基于 CLIP 训练的基线在 Geo 得分上崩溃到约 1，暴露出纹理被绘制在平面形状上的问题）。消融实验表明，视角增强、视角相关提示词、光照和无纹理渲染都能提升几何质量，完整渲染方案总体提升 +12.5%。优化得到的模型可以从任意角度观看，重新打光，并合成到三维环境中。论文指出的已知局限：SDS 具有模式寻优（mode-seeking）特性，导致结果过饱和/过度平滑，且不同随机种子之间缺乏多样性。

## 对SLAM的意义

DreamFusion 将两条此前独立的技术路线——神经渲染（NeRF）与生成式扩散模型——连接了起来，其 SDS 损失随即被大量后续文本到三维工作（Magic3D、ProlificDreamer 等）复用。对于 SLAM 而言，它确立了一个理念：生成式二维先验可以幻想出合理的三维结构——同样的机制原则上可以在 SLAM 地图中未观测的区域补全纹理和几何，这是生成式地图补全和 Spatial AI 研究中反复出现的主题。

## 相关条目

- [NeRF](../level-05-deep-learning/nerf.md)
- [World Labs / Marble](world-labs-marble.md)
- [Sora / DiT](sora-dit.md)
- [Spatial AI](spatial-ai.md)
- [World model](world-model.md)
