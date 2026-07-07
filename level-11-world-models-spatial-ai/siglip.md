# SigLIP

> Zhai (Google) 2023 · [Paper](https://arxiv.org/abs/2303.15343)

**One-line summary** — SigLIP replaces CLIP's softmax contrastive loss with a simple pairwise sigmoid loss, decoupling training from batch-level normalization so language-image pretraining scales to huge batches, works better at small batches, and trains efficiently on modest hardware.

## Problem

Standard contrastive language-image pretraining (CLIP) uses a softmax cross-entropy loss whose normalization requires a *global view* of all pairwise similarities in the batch. This couples loss quality to batch size in both directions: large batches demand expensive all-to-all communication across accelerators, while small batches starve the softmax of negatives and degrade quality — putting CLIP-grade pretraining out of reach for labs without datacenter-scale clusters. SigLIP asks whether the global normalization is necessary at all.

## Key ideas

- **Pairwise sigmoid loss**: every image-text pair $(i,j)$ in a batch of $N$ is treated as an independent binary classification — matched ($y_{ij}=1$ when $i=j$) or not:
  $$\mathcal{L} = -\frac{1}{N}\sum_{i=1}^{N}\sum_{j=1}^{N}\Big[y_{ij}\log\sigma\big(\tfrac{z_{ij}}{\tau}+b\big) + (1-y_{ij})\log\big(1-\sigma\big(\tfrac{z_{ij}}{\tau}+b\big)\big)\Big]$$
  where $z_{ij}$ is the embedding similarity, $\tau$ a learned temperature, and $b$ a learned bias. The loss operates solely on image-text pairs and needs no normalization over the rest of the batch.
- **No global view needed**: because each pair is scored independently, no all-to-all similarity matrix normalization is required — removing a major distributed-training bottleneck and *disentangling batch size from the loss*.
- **Bias initialization**: with $N^2 - N$ negatives against $N$ positives, an untamed sigmoid loss is initially dominated by negative gradients; initializing $b$ to a suitably negative value encodes the prior that a random pair is almost surely unmatched, stabilizing early training.
- **Batch-size science**: the disentanglement lets the authors study examples-vs-pairs trade-offs and the negative-to-positive ratio directly. Pushing batch size to the extreme — up to one million — they find benefits quickly diminish, with a more reasonable batch size of 32k being sufficient.
- **Efficiency headline**: combined with Locked-image Tuning, a SigLiT model reaches 84.5% ImageNet zero-shot accuracy trained in two days on only four TPUv4 chips.
- **Drop-in objective**: architectures are unchanged from CLIP (ViT image encoder + Transformer text encoder); SigLIP is purely a better training objective, and the models were publicly released.

## Results & impact

SigLIP simultaneously allows further scaling up of batch size *and* performs better than softmax contrastive training at smaller batch sizes — the 84.5% ImageNet zero-shot SigLiT result on four TPUv4 chips made high-quality language-image pretraining accessible far outside big-lab infrastructure. SigLIP subsequently became the default CLIP replacement across the multimodal stack, serving as the vision encoder (often fused with DINOv2) in OpenVLA and many post-2024 VLMs.

## Why it matters for SLAM

SigLIP became the default CLIP replacement in the multimodal stack: it is the vision encoder (often paired with DINOv2) inside OpenVLA and many post-2024 VLMs, so its text-aligned features are what most modern robot perception systems actually see. For SLAM, SigLIP features serve the same role CLIP features do in open-vocabulary mapping — embedding language-queryable semantics into 3D maps — with better accuracy per compute, which matters for onboard robotic deployment.

## Related

- [CLIP](clip.md)
- [LLaVA](llava.md)
- [OpenVLA](openvla.md)
- [BLIP-2](blip-2.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
