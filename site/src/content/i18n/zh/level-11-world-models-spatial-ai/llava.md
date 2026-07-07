# LLaVA

> Liu 2023 · [论文](https://arxiv.org/abs/2304.08485)

**一句话总结** — LLaVA（Large Language and Vision Assistant）通过一个单一的线性投影将冻结的 CLIP 视觉编码器与 Vicuna LLM 连接起来，并在 GPT-4 生成的视觉指令数据上进行指令微调，表明数据质量——而非架构复杂度——才是打造强大开源对话式 VLM 的关键。

## 问题

在机器生成的指令跟随数据上对 LLM 进行指令微调，已经显著提升了模型在新语言任务上的零样本能力，但这一思路在多模态领域基本上仍未被探索。当时的 VLM 要么需要巨大的计算量（Flamingo），要么使用复杂的桥接架构（BLIP-2 的 Q-Former、Flamingo 的门控交叉注意力），要么是闭源的（GPT-4V）——而人工大规模标注多模态对话数据既昂贵又界定不清。LLaVA 探究的问题是：一个*极简*架构加上*机器生成*的多模态指令数据，能否得到一个有竞争力、可复现的开源 VLM。

## 方法与架构

- **GPT 辅助的数据生成**：向仅处理语言的 GPT-4 提供一张 COCO 图像的两种*符号化*表示——其描述文本和物体边界框坐标——并要求其生成三种回应类型：多轮**对话**（58K）、**详细描述**（23K）和**复杂推理**（77K），总计 158K 条图文指令跟随样本。仅有少量人工设计的种子样例用于上下文学习，是唯一的人工标注。
- **架构**：输入图像 $\mathbf{X}_v$ 经过预训练的 CLIP ViT-L/14 编码器 $g(\cdot)$（取最后一个 Transformer 层之前的网格特征），随后由一个可训练的投影矩阵 $\mathbf{W}$ 将特征映射到 Vicuna LLM $f_{\boldsymbol{\phi}}$ 的词嵌入空间：

$$\mathbf{H}_v = \mathbf{W} \cdot \mathbf{Z}_v, \quad \text{其中 } \mathbf{Z}_v = g(\mathbf{X}_v)$$

  视觉词元 $\mathbf{H}_v$ 直接与文本一起被放入 LLM 的上下文中——没有 Q-Former，没有交叉注意力模块。
- **训练目标**：多轮数据 $(\mathbf{X}_q^1, \mathbf{X}_a^1, \dots, \mathbf{X}_q^T, \mathbf{X}_a^T)$ 被序列化为单一序列，模型仅在助手（answer）词元上进行自回归训练：

$$p(\mathbf{X}_a \mid \mathbf{X}_v, \mathbf{X}_{\text{instruct}}) = \prod_{i=1}^{L} p_{\boldsymbol{\theta}}\big(x_i \mid \mathbf{X}_v, \mathbf{X}_{\text{instruct},<i}, \mathbf{X}_{a,<i}\big)$$

  其中 $\mathbf{X}_{\text{instruct},<i}$ 和 $\mathbf{X}_{a,<i}$ 分别是当前预测词元 $x_i$ 之前的指令词元和回答词元。
- **两阶段训练**：**阶段一（特征对齐）**——将 CC3M 过滤为 595K 图文对，视为朴素的单轮指令；两个骨干网络均冻结，仅训练 $\boldsymbol{\theta} = \mathbf{W}$（1 个 epoch，学习率 2e-3，batch 128）——本质上是为冻结的 LLM 学习一个视觉分词器。**阶段二（端到端微调）**——视觉编码器保持冻结；在 158K 指令集上训练 $\boldsymbol{\theta} = \{\mathbf{W}, \boldsymbol{\phi}\}$（3 个 epoch，学习率 2e-5，batch 32），使用 8×A100。
- **评测协议**：GPT-4 将候选答案与由纯文本 GPT-4（给定真实描述）生成的参考答案进行对比评判，给出一个相对分数——这正是本文提出的 LLaVA-Bench (COCO) 和 LLaVA-Bench (In-the-Wild) 基准的基础。

## 实验结果

- **LLaVA-Bench (COCO)**（90 个问题）：全量数据训练的 LLaVA 相对纯文本 GPT-4 得分为 **85.1%**；去除指令微调后得分骤降至 21.5（−63.6），仅用对话数据训练得分为 73.8——数据配比至关重要。
- **LLaVA-Bench (In-the-Wild)**（24 张图像，60 个问题）：LLaVA 总体得分达 **67.3 ± 2.0**，高于 BLIP-2 的 38.1 ± 1.0（+29%）和 OpenFlamingo 的 19.1 ± 0.4（+48%），在复杂推理上得分为 81.7。
- **ScienceQA**：LLaVA 单独达到 **90.92%** 的准确率（接近当时的 SoTA MM-CoT-Large 的 91.68%）；用 GPT-4 作为裁判仲裁分歧后，得到新的 SoTA **92.53%**。仅使用两样本纯文本 GPT-4 得分为 82.69%。
- **消融实验**：不经过阶段一直接从头训练，准确率下降 5.11 个百分点至 85.81%；7B 模型得分 89.84%，低于 13B 模型的 90.92%；使用 CLIP 最后一层特征比使用倒数第二层特征低 0.96 分。
- 定性来看，LLaVA 在域外图像上（例如 GPT-4 演示中的“极限熨衣”场景）能够遵循指令，而 BLIP-2 和 OpenFlamingo 只能对场景进行描述。

## 对SLAM的意义

LLaVA 使对话式视觉语言模型走向大众化：“编码器 + 投影 + LLM”这一配方成为随后大多数机器人 VLM 和视觉-语言-动作系统的基础（包括导航类 VLA，如 NaVILA，其 VILA 骨干网络遵循相同模式，以及 OpenVLA 的 Prismatic 骨干网络，其在 LLaVA-1.5 数据混合集上训练）。对于 SLAM 而言，将 LLaVA 风格的 VLM 接入地图的渲染视图，可以提供场景理解、物体识别和空间问答能力——这是从几何 SLAM 地图通往开放词汇语义推理最直接的集成路径之一。

## 相关条目

- [CLIP](clip.md)
- [BLIP-2](blip-2.md)
- [SigLIP](siglip.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [OpenVLA](openvla.md)
