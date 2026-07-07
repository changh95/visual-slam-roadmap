# OpenVLA

> Kim 2024 · [Paper](https://arxiv.org/abs/2406.09246)

**One-line summary** — OpenVLA is a 7B-parameter open-source vision-language-action model trained on 970k real-world robot demonstrations from Open X-Embodiment, matching or beating much larger closed VLAs while being efficiently fine-tunable on consumer GPUs.

## Problem

Large policies pretrained on Internet-scale vision-language data plus diverse robot demonstrations promise a new way to teach robots: fine-tune a general vision-language-action (VLA) model instead of training each new behavior from scratch. But adoption was blocked on two fronts — existing VLAs (RT-2 and kin) were largely closed and inaccessible to the public, and prior work had not explored how to *efficiently fine-tune* VLAs for new tasks, which is the key step for practical use. OpenVLA set out to remove both blockers.

## Key ideas

- **Open everything**: a 7B-parameter VLA whose model checkpoints, fine-tuning notebooks, and PyTorch training codebase (with built-in support for training at scale on Open X-Embodiment data) are all released — making VLA research reproducible outside industrial labs.
- **Dual vision encoder**: the visual encoder fuses pretrained features from DINOv2 (spatial, object-centric structure) and SigLIP (semantic, text-aligned) — a complementary combination that became an influential design pattern for robot perception.
- **Llama-based action generation**: a Llama 2 7B language backbone predicts discretized action tokens autoregressively, decoded into continuous robot commands — the actions-as-tokens paradigm inherited from RT-2.
- **Diverse real-robot data**: training on a collection of 970k real-world robot demonstrations spanning many tasks, scenes, and robot embodiments yields a *generalist* manipulation policy rather than a single-robot controller.
- **Practical adaptation as a first-class topic**: the paper explicitly studies parameter-efficient fine-tuning via modern low-rank adaptation (LoRA), which learns a small update $\Delta\mathbf{W} = \mathbf{B}\mathbf{A}$ with rank $r \ll d$ on top of frozen weights — enabling fine-tuning on consumer GPUs — plus quantized serving for deployment on modest hardware.

## Results & impact

OpenVLA demonstrates strong generalist manipulation: it outperforms closed models such as RT-2-X (55B) by 16.5% in absolute task success rate across 29 tasks and multiple robot embodiments, with 7x fewer parameters. Fine-tuned for new settings, it shows especially strong generalization in multi-task environments involving multiple objects and strong language grounding, outperforming expressive from-scratch imitation learning methods such as Diffusion Policy by 20.4%. It can be fine-tuned on consumer GPUs via LoRA and served efficiently via quantization without a hit to downstream success rate. OpenVLA quickly became the reference open VLA and the base model for a large body of follow-on robot-learning research.

## Why it matters for SLAM

OpenVLA is the reference open VLA and the base model for a large body of follow-on robot-learning work, showing that a 7B open model can outperform far larger closed systems. For the SLAM community it matters in two ways: it validates SigLIP/DINOv2-style foundation features as robot perception backbones, and it defines the action side of the emerging autonomy stack — SLAM supplies localization and metric maps while a VLA closes the loop from perception and language to physical action.

## Related

- [RT-2](rt-2.md)
- [SigLIP](siglip.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [NaVILA](navila.md)
- [WorldVLA](worldvla.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
