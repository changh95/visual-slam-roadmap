# Sora / DiT

> OpenAI 2024 · [论文](https://openai.com/index/sora/)

**一句话总结** — Sora 将 Diffusion Transformer（DiT）架构扩展到视频的时空补丁（spacetime patch）上，从文本生成长时间、时间上连贯的视频——其输出展现出涌现的三维一致性，这表明大规模视频生成本身隐式地学到了场景几何。

## 问题

这里汇合了两个问题。第一，图像扩散模型此前都建立在卷积 U-Net 骨干网络之上，而其缩放行为一直未被充分理解；DiT（Peebles 和 Xie，"Scalable Diffusion Models with Transformers"，[arXiv:2212.09748](https://arxiv.org/abs/2212.09748)）提出的问题是：一个作用于潜在补丁（latent patch）之上的普通 Transformer 能否充当去噪器，并像 Transformer 在其他领域那样实现良好的缩放。第二，此前的视频生成器只能生成固定分辨率和时长的短片段。Sora 作为 OpenAI 的文本生成视频系统，将 DiT 风格的骨干网络与一种统一的视频表示相结合，并在互联网规模的数据上训练——OpenAI 明确将其定位为迈向"世界模拟器"的一步。

## 方法与架构

DiT 论文工作在潜在扩散模型（LDM）框架中：一个冻结的 VAE 编码器 $E$ 将 $256\times 256\times 3$ 的图像映射为形状为 $32\times 32\times 4$ 的潜变量 $z = E(x)$，扩散模型在该潜在空间中训练。整体流程为：

- **补丁化（Patchify）**：形状为 $I\times I\times C$ 的带噪潜变量被切分为大小为 $p\times p$ 的补丁，并线性嵌入为一个长度为 $T=(I/p)^2$、宽度为 $d$ 的 token 序列，同时配以 ViT 式正余弦位置编码。将 $p$ 减半会使 token 数量（以及 Gflops）变为四倍，而参数量基本不变。
- **DiT 模块**：由 $N$ 个标准 Transformer 模块堆叠而成，共有四种配置（DiT-S/B/L/XL，Gflops 范围从 0.3 到 118.6）。论文比较了四种对扩散时间步 $t$ 和类别 $c$ 进行条件化的设计——上下文内 token（in-context tokens）、交叉注意力（约带来 15% 的 Gflops 开销）、自适应层归一化（adaLN），以及 **adaLN-Zero**：尺度/偏移参数 $\gamma, \beta$ 以及每个模块的残差门 $\alpha$ 都由 $t$ 和 $c$ 的嵌入回归得到，其中 $\alpha$ 初始化为零，使每个模块起始时都等价于恒等函数。
- **训练目标**：标准的 DDPM 噪声预测。在前向过程 $x_t = \sqrt{\bar{\alpha}_t}\, x_0 + \sqrt{1-\bar{\alpha}_t}\, \epsilon_t$、$\epsilon_t \sim \mathcal{N}(0,\mathbf{I})$ 下，去噪器最小化

$$\mathcal{L}_{simple}(\theta) = \lVert \epsilon_\theta(x_t) - \epsilon_t \rVert_2^2$$

  同时反向过程的协方差 $\Sigma_\theta$ 用完整的 KL 项训练；一个线性解码器将每个 token 映射回一个 $p\times p\times 2C$ 的噪声与协方差预测。
- **无分类器引导（Classifier-free guidance）**：$\hat{\epsilon}_\theta(x_t, c) = \epsilon_\theta(x_t, \emptyset) + s\cdot\big(\epsilon_\theta(x_t, c) - \epsilon_\theta(x_t, \emptyset)\big)$，其中引导强度 $s > 1$。
- **Sora**（依据 OpenAI 的技术报告；目前没有带公式的论文）：视频经由一个视觉编码器压缩为时空潜变量，并切分成*时空补丁 token*——这是 DiT 补丁化操作在视频上的对应版本——从而形成一种统一的 token 格式，使单一模型能够在可变时长、分辨率和宽高比的视频上训练与生成。

## 实验结果

DiT 的核心发现是模型 Gflops 与 FID-50K 之间存在强烈的负相关：在 12 个模型（配置 S/B/L/XL，补丁大小 8/4/2，均在类别条件 ImageNet 上）中，增加深度/宽度或 token 数量都能持续改善 FID，而总 Gflops 相近的模型（例如 DiT-S/2 和 DiT-B/4）会达到相近的 FID——起决定作用的是算力而非参数量。adaLN-Zero 在所有训练阶段都优于交叉注意力和上下文内条件化；在 400K 迭代时，其 FID 几乎是上下文内变体的一半。训练 7M 步后，DiT-XL/2（118.6 Gflops）在类别条件 ImageNet 256×256 上、配合无分类器引导达到 **FID 2.27**，超过此前扩散模型的最好成绩 3.60（LDM）以及此前的最优方法 StyleGAN-XL，同时每次前向传播的成本远低于像素空间的 U-Net（ADM：1120 Gflops）；它在 512×512 分辨率下同样达到最优，并且在 2.35M 步时已经达到 FID 2.55。Sora 本身只以技术报告和产品形式发布，仅有定性结果——长时长、高保真、时间上连贯的视频，具备涌现的三维一致性和物体持久性；完整的展示效果请见 OpenAI 的报告。

## 对SLAM的意义

Sora 是"互联网规模的视频训练能够在没有任何三维监督的情况下产生隐式三维场景理解"这一论断最有力的公开证据——这与 GAIA-1 在自动驾驶场景中观察到的涌现特性是同一种性质。这对 SLAM 的意义体现在两个方向：DiT 风格的生成模型正在成为世界基础模型（Cosmos 及其后续工作）背后的引擎，用来为具身系统合成训练数据；而"能否把视频生成器内部的三维知识提取为一个显式的、度量一致的地图"这一问题，如今已成为 SLAM 与生成式 AI 交界处一个活跃的研究前沿。NVIDIA Cosmos 甚至在其扩散世界模型中采用了 DiT 的 adaLN 层（配合 LoRA）。

## 相关条目

- [World model](world-model.md)
- [GAIA-1](gaia-1.md)
- [NVIDIA Cosmos](nvidia-cosmos.md)
- [DreamFusion](dreamfusion.md)
