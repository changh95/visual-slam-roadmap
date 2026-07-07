# BLIP-2

> Li (Salesforce) 2023 · [Paper](https://arxiv.org/abs/2301.12597)

**One-line summary** — BLIP-2 bridges a *frozen* pre-trained image encoder and a *frozen* large language model with a lightweight Querying Transformer (Q-Former), achieving strong vision-language capabilities at a fraction of the training cost of end-to-end multimodal models.

## Problem

The cost of vision-and-language pre-training had become increasingly prohibitive because it meant end-to-end training of large-scale models — every new VLM re-trained billions of visual and language parameters from scratch or near-scratch. Yet powerful ingredients already existed off the shelf: large pre-trained image encoders and large pre-trained LLMs, each excellent in its own modality. The open question was whether a small trainable module could bridge the *modality gap* between them — feeding visual information into an LLM that has never seen an image — without unfreezing either giant.

## Key ideas

- **Don't retrain the giants**: BLIP-2 bootstraps vision-language pre-training from off-the-shelf *frozen* image encoders and *frozen* LLMs, training only a lightweight bridge between them.
- **Q-Former as information bottleneck**: a compact transformer with a fixed set of learnable query tokens (typically 32) cross-attends to the frozen image encoder's patch features and distills the most relevant visual information into a handful of output tokens, which are projected and prepended to the LLM as soft visual prompts.
- **Two-stage pre-training**: stage 1 bootstraps vision-language *representation* learning from the frozen image encoder (contrastive, image-text matching, and image-grounded generation objectives train the Q-Former); stage 2 bootstraps vision-to-language *generative* learning by connecting the Q-Former's outputs to the frozen LLM.
- **Extreme parameter efficiency**: only the Q-Former's weights (a few hundred million parameters) are trainable — under a percent of the full stack that includes a ViT-G-scale encoder and an LLM of up to ~11B parameters.
- **Mix-and-match modularity**: because both ends stay frozen, encoders and LLMs can be swapped without full retraining — the pattern that made rapid VLM iteration possible across the community.

## Results & impact

- BLIP-2 achieves state-of-the-art performance on various vision-language tasks despite having significantly fewer trainable parameters than existing methods.
- The headline number from the abstract: it outperforms Flamingo-80B by 8.7% on zero-shot VQAv2 with 54× fewer *trainable* parameters.
- With an instruction-tuned frozen LLM, BLIP-2 demonstrates emerging zero-shot image-to-text generation that follows natural-language instructions — an early step toward general visual assistants.
- The frozen-encoder + lightweight-adapter + frozen-LLM recipe became the template for efficient VLM construction (InstructBLIP, MiniGPT-4, and many robotics VLMs trace their architecture to it).

## Why it matters for SLAM

BLIP-2's frozen-encoder + lightweight-adapter + frozen-LLM pattern became the standard recipe for building vision-language systems cheaply (InstructBLIP, MiniGPT-4, many robotics VLMs), and it defines the practical path for adding language-based reasoning to spatial systems: rather than retraining a giant model, a small bridge can connect a SLAM system's visual (or rendered-map) features to an off-the-shelf LLM. In the VLM-to-VLA lineage that runs through this level, BLIP-2 is the efficiency milestone between CLIP's contrastive embeddings and LLaVA/OpenVLA's instruction-following stacks.

## Related

- [CLIP](clip.md)
- [LLaVA](llava.md)
- [SigLIP](siglip.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
