# OpenVLA

> Kim 2024 · [Paper](https://arxiv.org/abs/2406.09246)

**One-line summary** — OpenVLA is a 7B-parameter open-source vision-language-action model trained on 970k real-world robot demonstrations from Open X-Embodiment, matching or beating much larger closed VLAs while being efficiently fine-tunable on consumer GPUs.

## Key ideas

- **Open everything**: RT-2 demonstrated the VLA recipe but remained closed. OpenVLA releases weights, training code, and fine-tuning recipes, making VLA research reproducible outside industrial labs.
- **Dual vision encoder**: Visual features fuse DINOv2 (spatial, object-centric structure) with SigLIP (semantic, text-aligned) — a complementary combination that became an influential design pattern for robot perception.
- **Llama-based action generation**: A Llama 2 7B backbone predicts discretized action tokens autoregressively, which are decoded into continuous robot commands — the actions-as-tokens paradigm inherited from RT-2.
- **Diverse real-robot data**: Training on 970k demonstrations spanning many tasks, scenes, and robot embodiments gives out-of-the-box control for multiple robots and strong generalization to new instructions.
- **Practical adaptation**: The paper explicitly studies efficient fine-tuning — LoRA adaptation and quantized serving let a lab adapt and deploy the model on modest GPU hardware, rather than treating the VLA as a frozen monolith.

## Why it matters for SLAM

OpenVLA is the reference open VLA and the base model for a large body of follow-on robot-learning work, showing that a 7B open model can outperform far larger closed systems. For the SLAM community it matters in two ways: it validates SigLIP/DINOv2-style foundation features as robot perception backbones, and it defines the action side of the emerging autonomy stack — SLAM supplies localization and metric maps while a VLA closes the loop from perception and language to physical action.

## Related

- [RT-2](rt-2.md)
- [SigLIP](siglip.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [NaVILA](navila.md)
- [WorldVLA](worldvla.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
