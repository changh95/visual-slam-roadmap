# OpenVLA

> Kim 2024 · [Paper](https://arxiv.org/abs/2406.09246)

**One-line summary** — OpenVLA is a 7B-parameter open-source vision-language-action model trained on 970k real-world robot demonstrations from Open X-Embodiment, matching or beating much larger closed VLAs while being efficiently fine-tunable on consumer GPUs.

## Problem

Large policies pretrained on Internet-scale vision-language data plus diverse robot demonstrations promise a new way to teach robots: fine-tune a general vision-language-action (VLA) model instead of training each new behavior from scratch. But adoption was blocked on two fronts — existing VLAs (RT-2 and kin) were largely closed with limited visibility into architecture, training procedure, and data mixture, and prior work had not explored how to *efficiently fine-tune* VLAs for new tasks on commodity hardware, the key step for practical use. OpenVLA set out to remove both blockers.

## Method & architecture

- **Backbone**: the Prismatic-7B VLM — (1) a ~600M-parameter **dual vision encoder** in which each image patch passes through both pretrained **SigLIP** (semantic, text-aligned) and **DINOv2** (low-level spatial) and the feature vectors are concatenated channel-wise; (2) a 2-layer MLP projector into the LLM embedding space; (3) a **Llama 2 7B** language backbone. Prismatic itself was tuned on the LLaVA-1.5 data mixture (~1M samples).
- **Actions as tokens**: each dimension of an $N$-dimensional continuous action is discretized separately into one of 256 bins, giving $N$ integers $\in [0 \dots 255]$; bin widths uniformly divide the interval between the **1st and 99th quantile** of training actions (rather than RT-2's min-max bounds, so outliers cannot destroy granularity). Since Llama's tokenizer reserves only 100 special tokens, the 256 *least-used* tokens are overwritten as action tokens. Training minimizes standard next-token cross-entropy on the action tokens only.
- **Training data**: 970k trajectories curated from Open X-Embodiment (70+ datasets, 2M+ raw trajectories), filtered to single-arm end-effector-control manipulation with at least one third-person camera, re-weighted with Octo's data-mixture heuristics (DROID was trialed at 10% weight but dropped for the final third of training due to persistently low action-token accuracy).
- **Design decisions found empirically**: fine-tuning the vision encoder is *crucial* for VLA performance (contrary to VLM practice); 224×224 px input matches 384×384 at 3x less compute; VLA training needs many epochs — the final run does **27 epochs** until action-token accuracy exceeds 95%; fixed lr 2e-5.
- **Infrastructure**: trained on 64 A100s for 14 days (21,500 A100-hours, batch 2048); inference needs 15GB in bfloat16 and runs at ~6 Hz on an RTX 4090; a remote inference server streams actions to the robot.
- **Efficient adaptation**: LoRA learns low-rank updates on all linear layers (rank $r=32$ suffices), and quantized int4 serving halves memory — both studied as first-class contributions.

## Results

- **Out-of-the-box generalist control**: across 29 tasks on WidowX (BridgeData V2, 170 rollouts/method) and the Google robot (60 rollouts/method), OpenVLA outperforms the closed 55B RT-2-X by **16.5% absolute success rate** with 7x fewer parameters, beating it in all BridgeData V2 categories except semantic generalization (RT-2-X co-fine-tunes with web data; OpenVLA does not). RT-1-X and Octo trail far behind.
- **Fine-tuning to new robots** (Franka-Tabletop 5 Hz and Franka-DROID 15 Hz, 10-150 demos/task): fine-tuned OpenVLA achieves the highest aggregate performance and is the only method above **50% success on every tested task**; it outperforms from-scratch Diffusion Policy by **20.4%** on average, which retains an edge only on narrow single-instruction dexterous tasks.
- **Parameter-efficient fine-tuning**: LoRA r=32 reaches 68.2 ± 7.5% vs full fine-tuning's 69.7 ± 7.2% while training just **1.4% of parameters** (97.6M vs 7,188M) — 10-15 h on a single A100, an 8x compute reduction.
- **Quantized inference**: int4 scores 71.9 ± 4.7% vs bfloat16's 71.3 ± 4.8% at **7.0GB vs 16.8GB** VRAM; int8 drops to 58.1% because its 1.2 Hz inference breaks the 5 Hz controller dynamics.
- All model checkpoints, fine-tuning notebooks, and the PyTorch training codebase (FSDP, FlashAttention, HuggingFace integration) are released.

## Why it matters for SLAM

OpenVLA is the reference open VLA and the base model for a large body of follow-on robot-learning work, showing that a 7B open model can outperform far larger closed systems. For the SLAM community it matters in two ways: it validates SigLIP/DINOv2-style foundation features as robot perception backbones, and it defines the action side of the emerging autonomy stack — SLAM supplies localization and metric maps while a VLA closes the loop from perception and language to physical action.

## Related

- [RT-2](rt-2.md)
- [SigLIP](siglip.md)
- [VLM vs VLA](vlm-vs-vla.md)
- [NaVILA](navila.md)
- [WorldVLA](worldvla.md)
