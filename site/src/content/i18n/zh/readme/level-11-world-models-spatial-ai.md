### 关键概念
- **[世界模型](level-11-world-models-spatial-ai/world-model.md)** — 一种学习得到的环境动力学生成式模型，可用于预测与规划
- **[VLM与VLA](level-11-world-models-spatial-ai/vlm-vs-vla.md)** — 视觉-语言模型对图像进行推理；视觉-语言-动作模型在此基础上额外输出机器人动作
- **[Spatial AI](level-11-world-models-spatial-ai/spatial-ai.md)** — SLAM、场景理解与学习型世界表征的融合(Davison的FutureMapping愿景)

### 世界模型

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**GAIA-1**](level-11-world-models-spatial-ai/gaia-1.md) | [Wayve 2023](https://arxiv.org/abs/2309.17080) | 驾驶世界模型，动作条件下的未来场景生成 |
| [**Sora / DiT**](level-11-world-models-spatial-ai/sora-dit.md) | [OpenAI 2024](https://openai.com/index/sora/) | 扩散Transformer，时空图像块(spacetime patches)，涌现出的3D理解能力 |
| [**NVIDIA Cosmos**](level-11-world-models-spatial-ai/nvidia-cosmos.md) | [NVIDIA 2025](https://github.com/NVIDIA/Cosmos) | 面向物理AI的世界基础模型平台，为自动驾驶/机器人生成合成数据 |
| [**World Labs / Marble**](level-11-world-models-spatial-ai/world-labs-marble.md) | [Fei-Fei Li 2025](https://www.worldlabs.ai/) | 从图像/视频/文本提示生成生成式3D世界(持久化的高斯溅射场景) |
| [**WorldVLA**](level-11-world-models-spatial-ai/worldvla.md) | [Cen (Alibaba) 2025](https://arxiv.org/abs/2506.21539) | 自回归动作世界模型，为动作生成学习物理规律 |
| [**SceneDINO**](level-11-world-models-spatial-ai/scenedino.md) | [Jevtić 2025](https://arxiv.org/abs/2507.06230) | 前馈式无监督语义场景补全 |

### 生成式3D

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**DreamFusion**](level-11-world-models-spatial-ai/dreamfusion.md) | [Poole 2023](https://arxiv.org/abs/2209.14988) | 通过分数蒸馏采样(SDS)+NeRF实现文本生成3D |

### 视觉-语言模型(VLM)

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**CLIP**](level-11-world-models-spatial-ai/clip.md) | [Radford (OpenAI) 2021](https://arxiv.org/abs/2103.00020) | 对比图文预训练，4亿图文对，零样本 |
| [**SigLIP**](level-11-world-models-spatial-ai/siglip.md) | [Zhai (Google) 2023](https://arxiv.org/abs/2303.15343) | Sigmoid损失版CLIP，更高效，在较小模型规模下表现更好 |
| [**BLIP-2**](level-11-world-models-spatial-ai/blip-2.md) | [Li (Salesforce) 2023](https://arxiv.org/abs/2301.12597) | Q-Former连接冻结的LLM与图像编码器 |
| [**LLaVA**](level-11-world-models-spatial-ai/llava.md) | [Liu 2023](https://arxiv.org/abs/2304.08485) | LLaMA+视觉，对话式VLM |

### 视觉-语言-动作模型(VLA)

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**RT-2**](level-11-world-models-spatial-ai/rt-2.md) | [Brohan (DeepMind) 2023](https://arxiv.org/abs/2307.15818) | 将机器人动作表示为文本token，涌现出的泛化能力 |
| [**OpenVLA**](level-11-world-models-spatial-ai/openvla.md) | [Kim 2024](https://arxiv.org/abs/2406.09246) | 开源VLA，SigLIP+Llama 7B+动作头 |
| [**NaVILA**](level-11-world-models-spatial-ai/navila.md) | [Cheng 2024](https://arxiv.org/abs/2412.04453) | 面向导航的腿式/轮式机器人视觉-语言-动作模型 |

### 资料

| 资料 | 作者/年份 | 关键概念 |
|----------|-------------|--------------|
| [Awesome-Transformer-based-SLAM](https://github.com/KwanWaiPang/Awesome-Transformer-based-SLAM) | KwanWaiPang | 基于Transformer的SLAM方法GitHub精选列表 |
