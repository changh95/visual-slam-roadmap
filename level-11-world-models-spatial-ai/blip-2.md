# BLIP-2

> Li (Salesforce) 2023 · [Paper](https://arxiv.org/abs/2301.12597)

**One-line summary** — BLIP-2 bridges a *frozen* pre-trained image encoder and a *frozen* large language model with a lightweight Querying Transformer (Q-Former), achieving strong vision-language capabilities at a fraction of the training cost of end-to-end multimodal models.

## Key ideas

- **Don't retrain the giants**: powerful image encoders and LLMs already exist; end-to-end vision-language pre-training at their scale is prohibitively expensive. BLIP-2 keeps both frozen and trains only a small bridge between them.
- **Q-Former as information bottleneck**: a compact transformer with a fixed set of learnable query tokens cross-attends to the frozen image encoder's patch features and distills the most relevant visual information into a handful of output tokens, which are then fed to the LLM as soft visual prompts.
- **Two-stage pre-training**: stage 1 trains the Q-Former for vision-language representation learning against the frozen image encoder (contrastive, matching, and captioning objectives); stage 2 trains vision-to-language generation by prepending Q-Former outputs to the frozen LLM.
- **Extreme parameter efficiency**: only the Q-Former is trainable — the paper reports outperforming Flamingo-80B by 8.7% on zero-shot VQAv2 with 54x fewer trainable parameters.
- **Instruction-followable vision**: with an instruction-tuned frozen LLM, BLIP-2 supports zero-shot image-to-text generation following natural-language prompts — an early step toward general visual assistants.

## Why it matters for SLAM

BLIP-2's frozen-encoder + lightweight-adapter + frozen-LLM pattern became the standard recipe for building vision-language systems cheaply (InstructBLIP, MiniGPT-4, many robotics VLMs), and it defines the practical path for adding language-based reasoning to spatial systems: rather than retraining a giant model, a small bridge can connect a SLAM system's visual (or rendered-map) features to an off-the-shelf LLM. In the VLM-to-VLA lineage that runs through this level, BLIP-2 is the efficiency milestone between CLIP's contrastive embeddings and LLaVA/OpenVLA's instruction-following stacks.

## Related

- [CLIP](clip.md)
- [LLaVA](llava.md)
- [SigLIP](siglip.md)
- [VLM vs VLA](vlm-vs-vla.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
