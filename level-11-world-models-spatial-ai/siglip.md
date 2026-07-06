# SigLIP

> Zhai (Google) 2023 · [Paper](https://arxiv.org/abs/2303.15343)

**One-line summary** — SigLIP replaces CLIP's softmax contrastive loss with a simple pairwise sigmoid loss, decoupling training from batch-level normalization so language-image pretraining scales to huge batches, works better at small batches, and trains efficiently on modest hardware.

## Key ideas

- **Pairwise sigmoid loss**: Every image-text pair $(i, j)$ in a batch is treated as an independent binary classification — matched ($y_{ij}=1$) or not ($y_{ij}=0$) — using $\sigma(z_{ij}/\tau + b)$ on the embedding similarity $z_{ij}$. No softmax normalization over the whole batch is required.
- **No global view needed**: Because each pair is scored independently, the loss needs no all-to-all communication across devices, removing a major distributed-training bottleneck of softmax CLIP and disentangling loss quality from batch size.
- **Bias initialization**: A learned bias $b$ initialized negative counteracts the overwhelming ratio of negative to positive pairs ($N^2 - N$ vs $N$) at the start of training.
- **Efficiency headline**: Combined with Locked-image Tuning, the authors train a SigLiT model reaching 84.5% ImageNet zero-shot accuracy in two days on only four TPUv4 chips — language-image pretraining without a datacenter-scale cluster.
- **Drop-in objective**: Architectures are unchanged from CLIP (ViT image encoder + Transformer text encoder); SigLIP is purely a better training objective.

## Why it matters for SLAM

SigLIP became the default CLIP replacement in the multimodal stack: it is the vision encoder (often paired with DINOv2) inside OpenVLA and many post-2024 VLMs, so its text-aligned features are what most modern robot perception systems actually see. For SLAM, SigLIP features serve the same role CLIP features do in open-vocabulary mapping — embedding language-queryable semantics into 3D maps — with better accuracy per compute, which matters for onboard robotic deployment.

## Related

- [CLIP](clip.md)
- [LLaVA](llava.md)
- [OpenVLA](openvla.md)
- [BLIP-2](blip-2.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
