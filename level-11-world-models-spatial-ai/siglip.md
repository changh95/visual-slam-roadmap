# SigLIP

> Zhai (Google) 2023 · [Paper](https://arxiv.org/abs/2303.15343)

**One-line summary** — SigLIP replaces CLIP's softmax contrastive loss with a simple pairwise sigmoid loss that needs no global view of the batch, so language-image pretraining scales to huge batches, works better at small batches, and reaches 84.5% zero-shot ImageNet on just four TPUv4 chips.

## Problem

Standard contrastive language-image pretraining (CLIP/ALIGN) normalizes similarity scores with a batch-level softmax, applied twice (across images, then across texts). This requires a global view of all pairwise similarities: expensive all-gathers, materialization of a $|\mathcal{B}| \times |\mathcal{B}|$ similarity matrix, and an extra stabilization pass (max-subtraction) over the batch — coupling loss quality to batch size and putting CLIP-grade pretraining out of reach without datacenter-scale clusters. SigLIP asks whether the global normalization is necessary at all.

## Method & architecture

**Softmax baseline (what is being replaced).** With normalized embeddings $x_i = f(I_i)/\|f(I_i)\|_2$, $y_i = g(T_i)/\|g(T_i)\|_2$ and learned temperature $t$, CLIP minimizes
$$-\frac{1}{2|\mathcal{B}|} \sum_{i=1}^{|\mathcal{B}|} \left( \log \frac{e^{t\, x_i \cdot y_i}}{\sum_{j} e^{t\, x_i \cdot y_j}} + \log \frac{e^{t\, x_i \cdot y_i}}{\sum_{j} e^{t\, x_j \cdot y_i}} \right).$$

**Sigmoid loss.** SigLIP treats every image-text pair independently as binary classification — matched or not — over all $|\mathcal{B}|^2$ combinations:
$$\mathcal{L} = -\frac{1}{|\mathcal{B}|} \sum_{i=1}^{|\mathcal{B}|} \sum_{j=1}^{|\mathcal{B}|} \log \frac{1}{1 + e^{z_{ij}\,(-t\, x_i \cdot y_j + b)}}$$
where the label $z_{ij} = 1$ if $(I_i, T_j)$ are paired and $-1$ otherwise, $t = \exp(t')$ is a learned temperature, and $b$ is a learned bias. No normalization over the rest of the batch is needed.

**Bias initialization.** With $|\mathcal{B}|^2 - |\mathcal{B}|$ negatives against $|\mathcal{B}|$ positives, the untamed loss is initially dominated by negatives, causing massive corrective steps. Initializing $t' = \log 10$ and $b = -10$ starts training near the prior that a random pair is unmatched.

**Chunked distributed implementation.** With data parallelism over $D$ devices and per-device batch $b = |\mathcal{B}|/D$, the loss is computed blockwise: each device scores its local $b \times b$ block, then text representations are permuted across devices so negatives rotate through, summing per-device losses. No all-gather, and only a $b \times b$ matrix is ever materialized — the sigmoid loss is symmetric and needs just a single pass.

**Two recipes.** *SigLIP* trains both towers (ViT image encoder + Transformer text encoder, unchanged from CLIP) on WebLI; *SigLiT* follows Locked-image Tuning, training only the text tower against a frozen pretrained image encoder. The disentanglement of batch size from the loss also enables studying examples-vs-pairs trade-offs and training at extreme batch sizes.

## Results

- **SigLiT** with a frozen public B/8 checkpoint, trained on the LiT dataset with **four TPUv4 chips for one day**, reaches **79.7%** zero-shot ImageNet; with a g/14 checkpoint, **84.5%** in two days.
- **SigLIP** B/16 on WebLI reaches **71.0%** zero-shot ImageNet with 16 TPUv4 chips in three days; 72.1% at batch 32k in 2 days and 73.4% in 5 days on 32 chips.
- Sweeping batch size from 512 to **one million**: the sigmoid loss outperforms softmax **by a large margin below 16k batch**; the gap closes as batch grows, and performance saturates for both — a batch size of **32k is sufficient**, a conclusion that also holds for multilingual mSigLIP trained on over 100 languages (evaluated on XM3600 retrieval).
- The sigmoid loss is more memory-efficient than softmax, which is what unlocks the million-batch experiments and small-chip training; models were publicly released in `big_vision`.

## Why it matters for SLAM

SigLIP became the default CLIP replacement in the multimodal stack: it is the vision encoder (often paired with DINOv2) inside OpenVLA and many post-2024 VLMs, so its text-aligned features are what most modern robot perception systems actually see. For SLAM, SigLIP features serve the same role CLIP features do in open-vocabulary mapping — embedding language-queryable semantics into 3D maps — with better accuracy per compute, which matters for onboard robotic deployment.

## Related

- [CLIP](clip.md)
- [LLaVA](llava.md)
- [OpenVLA](openvla.md)
- [BLIP-2](blip-2.md)
