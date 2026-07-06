# CLIP

> Radford (OpenAI) 2021 · [Paper](https://arxiv.org/abs/2103.00020)

**One-line summary** — CLIP trains an image encoder and a text encoder jointly on 400 million web image-text pairs with a contrastive objective, producing a shared embedding space that enables zero-shot visual recognition of essentially arbitrary concepts described in natural language.

## Key ideas

- **Natural language as supervision**: instead of fixed closed-set labels (ImageNet's 1000 classes), CLIP's training task is simply predicting which caption goes with which image — a supervision signal available at internet scale without manual annotation.
- **Contrastive pre-training**: in each batch of $N$ image-text pairs, matched pairs are pulled together and mismatched pairs pushed apart in a shared embedding space via a symmetric InfoNCE-style loss over normalized embeddings, with a learned temperature.
- **Zero-shot transfer**: at test time, class names are embedded as text prompts ("a photo of a {class}") and an image is assigned to the nearest text embedding. No task-specific training data is needed — the paper reports matching the accuracy of the original supervised ResNet-50 on ImageNet zero-shot.
- **Scale is the method**: the 400M-pair WebImageText dataset and large ViT/ResNet encoders are what make the simple objective work; the paper benchmarks transfer across more than 30 downstream tasks (OCR, action recognition, geo-localization, fine-grained classification).
- **Open-vocabulary embeddings as a reusable asset**: beyond classification, the frozen CLIP encoders became a universal semantic feature extractor — the visual vocabulary underlying a generation of multimodal and robotics systems.

## Why it matters for SLAM

CLIP is the enabling technology of open-vocabulary SLAM: by attaching CLIP features to 3D map elements, systems like LERF and ConceptFusion let you query a reconstructed scene with free-form text ("find the fire extinguisher") instead of a fixed detector class list. It is also upstream of the VLM/VLA stack (BLIP-2, LLaVA, OpenVLA) that increasingly sits on top of SLAM in modern robot architectures. For vision-language pretraining what BERT was for NLP, CLIP is the reference point — with SigLIP as its direct technical successor.

## Related

- [SigLIP](siglip.md)
- [BLIP-2](blip-2.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [LERF](../level-03-monocular-slam/lerf.md)
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
