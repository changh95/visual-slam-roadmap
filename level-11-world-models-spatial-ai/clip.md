# CLIP

> Radford (OpenAI) 2021 · [Paper](https://arxiv.org/abs/2103.00020)

**One-line summary** — CLIP trains an image encoder and a text encoder jointly on 400 million web image-text pairs with a contrastive objective, producing a shared embedding space that enables zero-shot visual recognition of essentially arbitrary concepts described in natural language.

## Problem

State-of-the-art computer vision systems were trained to predict a fixed set of predetermined object categories (canonically ImageNet's 1000 classes). This restricted form of supervision limits generality and usability: specifying *any other* visual concept requires collecting new labeled data and retraining. Learning directly from raw text about images is a promising alternative that taps a much broader source of supervision — the caption is already attached to the image, at internet scale, for free. The question CLIP answers is whether this weak, noisy signal can train visual representations that transfer to arbitrary downstream tasks.

## Key ideas

- **Natural language as supervision**: the pre-training task is simply predicting which caption goes with which image — a supervision signal available at internet scale without manual annotation. The dataset, 400 million (image, text) pairs collected from the internet, is what makes the simple objective work.
- **Contrastive pre-training**: in each batch of $N$ image-text pairs, matched pairs are pulled together and mismatched pairs pushed apart in a shared embedding space via a symmetric InfoNCE-style loss over $L_2$-normalized embeddings $\mathbf{z}^I, \mathbf{z}^T$ with a learned temperature $\tau$:

  $$\mathcal{L} = -\frac{1}{N}\sum_{i}\left[\log \frac{e^{\langle \mathbf{z}_i^I, \mathbf{z}_i^T\rangle/\tau}}{\sum_j e^{\langle \mathbf{z}_i^I, \mathbf{z}_j^T\rangle/\tau}} + \log \frac{e^{\langle \mathbf{z}_i^T, \mathbf{z}_i^I\rangle/\tau}}{\sum_j e^{\langle \mathbf{z}_j^I, \mathbf{z}_i^T\rangle/\tau}}\right]$$

- **Zero-shot transfer**: at test time, class names are embedded as text prompts and an image is assigned to the nearest text embedding — $\hat{y} = \arg\max_c \langle f_I(I), f_T(\text{"a photo of a } c\text{"})\rangle$ — so natural language *references* learned visual concepts (or describes new ones) with no task-specific training data.
- **Prompt engineering matters**: performance improves markedly with prompt templates and prompt ensembling — an early sign that interfacing with vision through language is itself a design surface.
- **Open-vocabulary embeddings as a reusable asset**: beyond classification, the frozen CLIP encoders became a universal semantic feature extractor — the visual vocabulary underlying a generation of multimodal and robotics systems.

## Results & impact

- Zero-shot CLIP matches the accuracy of the original supervised ResNet-50 on ImageNet *without using any of the 1.28 million training examples* it was trained on.
- Benchmarked on over 30 existing computer-vision datasets — OCR, action recognition in videos, geo-localization, many kinds of fine-grained classification — CLIP transfers non-trivially to most tasks and is often competitive with fully supervised baselines, with notably better robustness to distribution shift than supervised models.
- Code and pre-trained weights were released, and CLIP features became the standard visual backbone for open-vocabulary systems across 2D and 3D vision (LERF, OpenMask3D, ConceptFusion) and for VLM/VLA stacks (BLIP-2, LLaVA, OpenVLA).
- The contrastive internet-scale paradigm it validated was adopted across multimodal AI; SigLIP is its direct technical successor, replacing the softmax contrastive loss with a pairwise sigmoid loss for better scalability.

## Why it matters for SLAM

CLIP is the enabling technology of open-vocabulary SLAM: by attaching CLIP features to 3D map elements, systems like LERF and ConceptFusion let you query a reconstructed scene with free-form text ("find the fire extinguisher") instead of a fixed detector class list. It is also upstream of the VLM/VLA stack (BLIP-2, LLaVA, OpenVLA) that increasingly sits on top of SLAM in modern robot architectures. For vision-language pretraining what BERT was for NLP, CLIP is the reference point — with SigLIP as its direct technical successor.

## Related

- [SigLIP](siglip.md)
- [BLIP-2](blip-2.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [LERF](../level-03-monocular-slam/lerf.md)
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
