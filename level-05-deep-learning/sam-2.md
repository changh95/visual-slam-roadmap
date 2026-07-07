# SAM 2

> Meta 2024 · [Paper](https://arxiv.org/abs/2408.00714)

**One-line summary** — Extends Segment Anything to video with a streaming memory-attention architecture that tracks and segments objects consistently across frames, while also being more accurate and 6x faster than SAM on still images.

## Problem

SAM segments each image independently, so running it on video loses object identity across frames — yet robotics, AR, and video editing all need *the same object* segmented consistently over time, through motion, deformation, occlusion, and lighting change, and often at lower per-frame quality (blur, camera motion). SAM 2 poses **Promptable Visual Segmentation (PVS)**: given clicks/boxes/masks on *any* frame of a video, predict the object's spatio-temporal mask (a "masklet") across the entire video, refinable with further prompts on any frame. Existing VOS models were not promptable in this sense, and video mask annotations were scarce — so the model and the dataset had to be built together.

## Method & architecture

A streaming generalization of SAM — frames are consumed one at a time, and when the memory is empty the model *is* SAM on an image:

- **Image encoder**: an MAE pre-trained **Hiera** hierarchical ViT runs once per frame, producing unconditioned multi-scale embeddings; hierarchy enables high-resolution skip connections into the decoder (bypassing memory attention) for crisp masks.
- **Memory attention**: $L$ transformer blocks condition the current frame's features on the past — each block does self-attention, then cross-attention to the memory bank's entries (spatial memories of prompted and unprompted frames, plus object pointers), then an MLP; vanilla attention so efficient kernels apply.
- **Prompt encoder + mask decoder**: as in SAM (points/boxes/masks; ambiguity handled by multiple candidate masks), plus a new **occlusion head** predicting whether the object is even present on the current frame — in video, a valid prompt can have no visible target.
- **Memory encoder**: downsamples the predicted mask with a convolutional module, sums it element-wise with the unconditioned frame embedding, and fuses with light conv layers.
- **Memory bank**: a FIFO queue of up to $N$ recent-frame memories plus up to $M$ prompted-frame memories (e.g., in VOS the first frame's memory is always retained), stored as spatial feature maps, alongside a list of **object pointers** — lightweight vectors from the mask decoder's output tokens carrying high-level object semantics.

Training is joint on images and video: 8-frame sequences with up to 2 prompted frames, corrective clicks sampled from ground truth and model predictions; the initial prompt is a ground-truth mask (p=0.5), a positive click (p=0.25), or a box (p=0.25).

**Data engine** (three phases): Phase 1, per-frame SAM annotation at 6 FPS — 37.8 s/frame, 16K masklets; Phase 2, SAM 2 Mask propagates first-frame masks — 7.4 s/frame (5.1x speedup), 63.5K masklets; Phase 3, full SAM 2 in the loop with occasional refinement clicks — 4.5 s/frame (**8.4x speedup** at comparable quality), 197K masklets, with a separate verification pass and automatic grid-prompted masklets for coverage. Result: **SA-V — 50.9K videos, 642.6K masklets, 35.5M masks**, 53x more masks (15x without auto) than any prior VOS dataset, released under CC-BY 4.0.

## Results

- **Interactive video segmentation**: over 9 datasets, SAM 2 beats SAM+XMem++ and SAM+Cutie in $\mathcal{J}\&\mathcal{F}$ across offline and online settings, achieving better accuracy with **more than 3x fewer interactions**.
- **Semi-supervised VOS** (first-frame mask prompt), $\mathcal{J}\&\mathcal{F}$: SAM 2 (Hiera-L) scores **77.9 MOSE val, 90.7 DAVIS 2017 val, 78.0 LVOS val, 77.9/78.4 SA-V val/test, 89.3 YouTube-VOS 2019** — vs the best prior method Cutie-base+ at 71.7 MOSE and ~61/63 on SA-V, showing how far prior VOS was from "segment anything in videos".
- **Speed**: 43.8 FPS (Hiera-B+) / 30.2 FPS (Hiera-L) on a single A100 — real-time streaming.
- **Image segmentation**: on the 37-dataset SA benchmark, SAM 2 gets 58.9 1-click mIoU on SA-23 vs SAM's 58.1 without extra data while being **6x faster** (smaller but more effective Hiera encoder); training on the SA-1B + video mix lifts it to 61.4.
- Data ablations: adding data-engine data gives +12.1 $\mathcal{J}\&\mathcal{F}$ average on 9 zero-shot VOS datasets over training on DAVIS/MOSE/YouTube-VOS alone; accuracy follows a power law in SA-V training data size.

## Why it matters for SLAM

Frame-by-frame masks are not enough for SLAM — the system must know it is seeing the *same* object over time to build semantic maps and handle dynamic scenes. SAM 2's streaming memory design matches the sequential nature of SLAM pipelines: temporally consistent masklets enable dynamic-object removal, object-level mapping, and persistent instance identity for data association, and the occlusion head explicitly models disappearance/re-appearance that map maintenance must handle. Spatio-temporal semantic mapping systems (e.g., Khronos-style) are natural consumers of this capability.

## Related

- [SAM](sam.md) — the image-only predecessor
- [Grounding DINO](grounding-dino.md) — text prompts for what to track
- [Khronos](khronos.md) — spatio-temporal metric-semantic mapping
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — dynamic-object masking in classical SLAM
