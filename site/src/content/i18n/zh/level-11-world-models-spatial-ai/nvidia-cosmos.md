# NVIDIA Cosmos

> NVIDIA 2025 · [论文](https://github.com/NVIDIA/Cosmos)

**一句话总结** — Cosmos 是 NVIDIA 面向 Physical AI 的世界基础模型平台：一套预训练的生成式世界模型、分词器和处理流水线，能够生成物理上合理的合成视频/传感器数据，用于训练自动驾驶车辆和机器人。

## 问题

Physical AI 需要先在数字世界中完成训练——它需要一个自身的数字孪生（策略模型），以及一个世界的数字孪生（世界模型）。收集多样化的真实传感器数据（尤其是罕见和危险场景）既缓慢又不安全，而手工构建的仿真器又存在仿真到真实的差距（sim-to-real gap）。Cosmos 技术报告（[arXiv:2501.03575](https://arxiv.org/abs/2501.03575)）将*世界基础模型*（World Foundation Model, WFM）——一个通用的、预训练的视觉世界演化生成模型——定位为一种共享基础设施，开发者可以将其微调为适配自身 Physical AI 场景的定制化世界模型。

## 方法与架构

该平台包含五大组成部分：视频筛选器、视频分词器、预训练 WFM、后训练示例，以及安全护栏（guardrails）。

- **数据筛选**：一个由 Ray 编排的流水线（分割、过滤、标注、去重、分片）从 2000 万小时的原始视频集合中提取约 1 亿段片段（时长 2–60 秒）；一个 VLM 每 256 帧为每段片段生成一段描述文本。大约 $10^8$ 段片段用于预训练，$10^7$ 段用于微调。所有 WFM 均在一个由 1 万块 H100 GPU 组成的集群上训练了三个月。
- **Cosmos 分词器**：一个时序上因果的编码器-解码器，在两级小波空间中运行，由时空分解卷积和因果自注意力构建而成。因果性意味着单一网络既能对图像分词也能对视频分词，并与 Physical AI 的因果设定相匹配。连续型分词器使用普通自编码器潜变量（维度 16）；离散型分词器使用有限标量量化（Finite-Scalar Quantization），层级为 $(8,8,8,5,5,5)$，即词表大小为 64,000。
- **扩散式 WFM 系列**：在连续的 CV8×8×8 词元上运行的潜变量视频扩散模型，包括 Text2World（7B、14B）和 Video2World 变体（微调后可根据过去帧加文本提示预测未来视频）。训练遵循 EDM 去噪分数匹配：在噪声水平 $\sigma$ 下，去噪器 $D_\theta$ 最小化

$$\mathcal{L}(D_\theta,\sigma) = \mathbb{E}_{\mathbf{x}_0,\mathbf{n}}\Big[\big\lVert D_\theta(\mathbf{x}_0+\mathbf{n};\sigma) - \mathbf{x}_0 \big\rVert_2^2\Big]$$

  其中 $\mathbf{x}_0 \sim p_{\rm data}$、$\mathbf{n} \sim \mathcal{N}(\mathbf{0},\sigma^2\mathbf{I})$，此外还有一个跨噪声水平的可学习不确定性加权 $u(\sigma)$。文本条件使用 T5-XXL；AdaLN-LoRA 压缩了 DiT 风格的自适应层归一化，在同等质量下将 7B 模型的参数量从 11B 削减下来。
- **自回归式 WFM 系列**：Llama3 风格的 Transformer（4B、12B），在离散的 DV8×16×16 词元上做下一词元预测，

$$\mathcal{L}_{NLL} = \sum_i -\log P(v_i \mid v_1, v_2, \dots, v_{i-1}; \Theta)$$

  可选地通过 T5 交叉注意力引入文本条件。一个 7B 的扩散解码器将离散词元映射回连续词元空间以去除量化伪影；Medusa 推测解码可将词元吞吐量提升至 3.2 倍，一个低分辨率适配版本可实现实时 10 FPS 的生成速度。
- **后训练示例**：相机可控的 Video2World（一个学习得到的、以位姿为条件的渲染器）、机器人操作（以指令和动作为条件的预测），以及从基础 WFM 微调而来的多视角自动驾驶模型。

## 实验结果

Cosmos 分词器大幅超越此前的分词器——在 DAVIS 视频上的重建 PSNR 提高约 +4 dB，速度提升最多达 12 倍，能够在单块 A100 80GB 上一次性编码长达 8 秒的 1080p 视频。WFM 评测聚焦于三维一致性和物理对齐：在来自 RealEstate10K 的 500 段静态场景视频上，Cosmos-Predict1-7B-Text2World 的 Sampson 极线误差为 0.355，而 VideoLDM 基线为 0.841，相机位姿估计成功率为 62.6%（Video2World 为 68.4%），远高于 4.4%——真实视频的对应数值为 0.431 和 56.4%——基于 3DGS 的新视角合成 PSNR 为 33.02，高于 26.23（真实视频为 35.38），即生成的世界在几何一致性上接近真实视频的水平。相机控制微调版本在 FID/FVD 以及基于 SfM 重新估计轨迹与指令轨迹之间的旋转/平移误差方面均优于 CamCo。模型和代码均在 NVIDIA Open Model License 下开放权重/开源。

## 对SLAM的意义

Cosmos 代表着由 GAIA-1 等系统率先提出的世界模型理念的产业化：垂直整合的硬件、仿真（Omniverse）以及面向 Physical AI 的基础模型。引人注意的是，其头条评测完全基于多视角几何——Sampson 误差、SfM 位姿估计成功率、3DGS 视图合成——这正是 SLAM 的工具集，此处被用来评判一个生成模型作为“世界仿真器”的表现。对 SLAM 而言，其直接相关性在于训练数据生成（用于学习式 SLAM 组件的合成多传感器序列），以及那些以位姿为条件的 Video2World 模型，它们的表现类似于对想象出的、但几何一致的场景进行学习式渲染的渲染器。

## 相关条目

- [World model](world-model.md)
- [GAIA-1](gaia-1.md)
- [Sora / DiT](sora-dit.md)
- [World Labs / Marble](world-labs-marble.md)
