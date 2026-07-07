### キーコンセプト
- **[ワールドモデル](level-11-world-models-spatial-ai/world-model.md)** — 環境の力学を学習した生成モデルであり、予測や計画に利用できる
- **[VLM対VLA](level-11-world-models-spatial-ai/vlm-vs-vla.md)** — 視覚言語モデル(VLM)は画像について推論する;視覚言語行動モデル(VLA)はさらにロボットの行動を出力する
- **[Spatial AI](level-11-world-models-spatial-ai/spatial-ai.md)** — SLAM、シーン理解、学習されたワールド表現の融合(Davisonの提唱するFutureMappingのビジョン)

### ワールドモデル

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**GAIA-1**](level-11-world-models-spatial-ai/gaia-1.md) | [Wayve 2023](https://arxiv.org/abs/2309.17080) | 運転向けワールドモデル、行動条件付きの未来シーン生成 |
| [**Sora / DiT**](level-11-world-models-spatial-ai/sora-dit.md) | [OpenAI 2024](https://openai.com/index/sora/) | Diffusion Transformer、時空間パッチ、3次元理解の自然発生 |
| [**NVIDIA Cosmos**](level-11-world-models-spatial-ai/nvidia-cosmos.md) | [NVIDIA 2025](https://github.com/NVIDIA/Cosmos) | Physical AIのためのワールド基盤モデルプラットフォーム、自動運転車/ロボット向けの合成データ |
| [**World Labs / Marble**](level-11-world-models-spatial-ai/world-labs-marble.md) | [Fei-Fei Li 2025](https://www.worldlabs.ai/) | 画像/動画/テキストプロンプトから生成される3次元世界(持続的なガウシアンスプラットシーン) |
| [**WorldVLA**](level-11-world-models-spatial-ai/worldvla.md) | [Cen (Alibaba) 2025](https://arxiv.org/abs/2506.21539) | 自己回帰的な行動ワールドモデル、行動生成のために物理法則を学習 |
| [**SceneDINO**](level-11-world-models-spatial-ai/scenedino.md) | [Jevtić 2025](https://arxiv.org/abs/2507.06230) | フィードフォワードな教師なしセマンティックシーン補完 |

### 生成3D

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**DreamFusion**](level-11-world-models-spatial-ai/dreamfusion.md) | [Poole 2023](https://arxiv.org/abs/2209.14988) | Score Distillation Sampling(SDS)+NeRFによるText-to-3D |

### 視覚言語モデル(VLM)

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**CLIP**](level-11-world-models-spatial-ai/clip.md) | [Radford (OpenAI) 2021](https://arxiv.org/abs/2103.00020) | 対照学習による画像・テキスト事前学習、4億ペア、ゼロショット |
| [**SigLIP**](level-11-world-models-spatial-ai/siglip.md) | [Zhai (Google) 2023](https://arxiv.org/abs/2303.15343) | シグモイド損失によるCLIP、より効率的、小型モデルでも高性能 |
| [**BLIP-2**](level-11-world-models-spatial-ai/blip-2.md) | [Li (Salesforce) 2023](https://arxiv.org/abs/2301.12597) | Q-Formerが固定LLMと画像エンコーダを橋渡し |
| [**LLaVA**](level-11-world-models-spatial-ai/llava.md) | [Liu 2023](https://arxiv.org/abs/2304.08485) | LLaMA+視覚、対話型VLM |

### 視覚言語行動モデル(VLA)

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**RT-2**](level-11-world-models-spatial-ai/rt-2.md) | [Brohan (DeepMind) 2023](https://arxiv.org/abs/2307.15818) | ロボットの行動をテキストトークンとして表現、汎化能力の自然発生 |
| [**OpenVLA**](level-11-world-models-spatial-ai/openvla.md) | [Kim 2024](https://arxiv.org/abs/2406.09246) | オープンソースVLA、SigLIP+Llama 7B+Action Head |
| [**NaVILA**](level-11-world-models-spatial-ai/navila.md) | [Cheng 2024](https://arxiv.org/abs/2412.04453) | 脚式/車輪式ロボットのナビゲーション向け視覚言語行動モデル |

### リソース

| リソース | 著者/年 | キーコンセプト |
|----------|-------------|--------------|
| [Awesome-Transformer-based-SLAM](https://github.com/KwanWaiPang/Awesome-Transformer-based-SLAM) | KwanWaiPang | Transformerベースの手法を厳選したGitHubリスト |
