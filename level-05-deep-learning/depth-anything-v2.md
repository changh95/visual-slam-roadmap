# Depth Anything V2

> Yang 2024 · [Paper](https://arxiv.org/abs/2406.09414)

**One-line summary** — Depth Anything V2 produces much finer and more robust monocular depth than V1 through three practices: train the teacher only on precise synthetic images, scale the teacher up to DINOv2-G, and teach student models through 62M pseudo-labeled real images.

## Problem

Depth Anything V1 generalized impressively, but its teacher was trained on labeled *real* images whose depth labels are noisy and coarse — depth sensors fail on transparent objects, stereo matching fails on repetitive patterns, SfM fails on dynamic objects — so trained models inherit those mistakes (MiDaS and V1 score only 25.9% and 53.5% on the Transparent Surface Challenge). Synthetic renderings have pixel-perfect depth ("truly GT") but bring two obstacles: a synthetic-to-real distribution shift (synthetic images are too "clean" and "ordered") and restricted scene coverage from pre-defined scene types. V2 asks how to get synthetic-label precision without paying the domain-gap penalty — "without pursuing fancy techniques".

## Method & architecture

The pipeline has three stages (Fig. 7 of the paper):

1. **Teacher on synthetic only.** A DINOv2-G (1.3B-param) encoder with a DPT depth decoder is trained purely on 595K precise synthetic images from five datasets (BlendedMVS 115K, Hypersim 60K, IRS 103K, TartanAir 306K, VKITTI 2 20K). A pilot study showed only DINOv2-G survives synthetic-to-real transfer; BEiT, SAM, SynCLR, and smaller DINOv2 encoders all suffer severe generalization issues.
2. **Pseudo-label real images.** The teacher assigns depth to 62M unlabeled real images drawn from eight public datasets (BDD100K, Google Landmarks, ImageNet-21K, LSUN, Objects365, Open Images V7, Places365, SA-1B). These pseudo-labels are finer and more complete than manual annotations.
3. **Students on pseudo-labels only.** Four student models (DINOv2 small/base/large/giant, 25M–1.3B params) are trained purely on the pseudo-labeled real images — an ablation shows dropping synthetic images at this stage even slightly helps smaller models. This is label-level distillation via extra unlabeled data, safer than feature-level distillation across a huge teacher-student scale gap.

Training objective on labeled (synthetic) images combines two MiDaS-style losses on affine-invariant inverse depth: a scale- and shift-invariant loss $\mathcal{L}_{ssi}$ and a gradient matching loss $\mathcal{L}_{gm}$, weighted $1{:}2$ — $\mathcal{L}_{gm}$ turns out to be "super beneficial to depth sharpness" when the labels are synthetic. On pseudo-labeled images, the top-$n$-largest-loss regions per sample ($n=10\%$) are ignored as potentially noisy, and a feature alignment loss (from V1) preserves DINOv2 semantics. All images train at $518\times 518$; teacher: batch 64 for 160K iterations, students: batch 192 for 480K iterations, Adam with encoder/decoder learning rates 5e-6/5e-5.

The paper also contributes **DA-2K**, an evaluation benchmark of 1K high-resolution, diverse images with 2K sparse relative-depth pixel pairs, built because existing test sets (NYU-D, KITTI) have noisy labels, single-scene bias, and ~500×500 resolution: SAM-prompted point pairs are voted on by four expert models, disagreements go to triple-checked human annotation.

## Results

- **Zero-shot relative depth** (Table 2): V2 ViT-L reaches AbsRel 0.074 / $\delta_1$ 0.946 on KITTI and 0.045 / 0.979 on NYU-D — better than MiDaS V3.1 (0.127/0.850 KITTI) but merely comparable to V1, which the authors argue reflects noise in these benchmarks rather than model quality.
- **DA-2K** (Table 3): V2 ViT-S scores 95.3% accuracy, ViT-B 97.0%, ViT-L 97.1%, ViT-G 97.4% — versus Marigold 86.8%, Geowizard 88.1%, DepthFM 85.8%, and Depth Anything V1 88.5%. Even the smallest V2 beats every community model; the largest is 10.6% above Marigold.
- **Transparent Surface Challenge**: 83.6% zero-shot, versus 53.5% (V1) and 25.9% (MiDaS).
- **Fine-tuned metric depth** (ZoeDepth pipeline, Table 4): ViT-L gets $\delta_1$ 0.984 / AbsRel 0.056 / RMSE 0.206 on NYU-D and $\delta_1$ 0.983 / AbsRel 0.045 / RMSE 1.861 on KITTI; even the ViT-S variant beats prior ViT-L-based methods like ZoeDepth.
- **Ablations**: adding pseudo-labeled real images lifts ViT-S DA-2K accuracy from 89.8% to 95.3% (Table 5); retraining on DIML with pseudo labels instead of its manual labels lifts DA-2K accuracy from 80.2% to 89.7% (Table 6). Versus SD-based models, V2 is more than $10\times$ faster and more accurate.

## Why it matters for SLAM

Sharp, edge-preserving depth matters directly for SLAM: crisp object boundaries mean cleaner TSDF/Gaussian maps and less depth bleeding across silhouettes, and the small variants run in real time on modest hardware. When a modern dense SLAM paper says "we use a monocular depth prior", it very often means Depth Anything V2 — making its failure modes and its relative-vs-metric distinction essential working knowledge. Its synthetic-data-first recipe (precision from rendering, realism from pseudo-labeled real data) also reshaped how supervision is sourced for geometric tasks.

## Related

- [Depth Anything](depth-anything.md)
- [Marigold](marigold.md)
- [Metric3D](metric3d.md)
- [MiDaS](midas.md)
- [Align3R](align3r.md)
