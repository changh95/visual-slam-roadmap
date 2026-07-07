# RF-DETR

> Robinson 2025 · [Paper](https://arxiv.org/abs/2511.09554)

**One-line summary** — A lightweight specialist detection transformer (from Roboflow + CMU) that couples a DINOv2 pre-trained backbone with end-to-end weight-sharing neural architecture search, so one training run yields a whole accuracy-latency Pareto curve of deployable sub-nets — and its 2x-large variant is the first real-time detector to pass 60 AP on COCO.

## Problem

Open-vocabulary VLM detectors (GroundingDINO, YOLO-World) are accurate but too slow for real-time use and generalize poorly to out-of-distribution classes; specialist real-time detectors (D-FINE, RT-DETR, YOLOv8/v11) are fast but underperform fine-tuned VLMs — and the authors argue they have implicitly *overfit to COCO* via bespoke architectures, learning-rate schedulers, and augmentation schedulers that bias models toward COCO-like dataset statistics. Separately, latency benchmarking across papers is irreproducible (e.g., D-FINE reports LW-DETR 25% faster than LW-DETR itself did), which the authors trace to GPU power throttling. RF-DETR aims to combine internet-scale pre-training with a real-time architecture, transfer to *any* target dataset, and specialize to any hardware budget without re-training.

## Method & architecture

The base model modernizes LW-DETR: a pre-trained ViT backbone extracts multi-scale features with interleaved windowed / non-windowed attention blocks; a multi-scale projector (layer norm instead of batch norm, enabling gradient accumulation on consumer GPUs) feeds a deformable-cross-attention DETR decoder; detection and segmentation losses are applied at *every* decoder layer so layers can be dropped at inference.

- **Internet-scale priors** — LW-DETR's CAEv2 backbone (10 layers, patch 16) is replaced with DINOv2 (12 layers); initializing from DINOv2 weights markedly helps small datasets. A low learning rate ($10^{-4}$), gradient clipping at 0.1, and per-layer LR decay of 0.8 preserve the pre-trained knowledge; extra Objects-365 pre-training compensates for the slower optimization.
- **Weight-sharing NAS, end-to-end** — at every training iteration a model configuration is uniformly sampled from the search space and one gradient update is performed, training thousands of sub-nets in parallel (an "architecture augmentation" that also acts as a regularizer, akin to dropout-style ensembling). The five tunable knobs: **patch size** (FlexiViT-style interpolation between sizes), **number of decoder layers** (droppable thanks to per-layer losses — removing the whole decoder turns RF-DETR into a single-stage detector), **number of query tokens** (dropped at test time ranked by the maximum sigmoid of each token's class logit; the Pareto-optimal count implicitly encodes objects-per-image statistics), **image resolution** (positional embeddings pre-allocated at max resolution / min patch size, interpolated down), and **windows per attention block**. Search happens *after* training: grid search over configurations on a validation set, no re-training — even sub-nets never sampled during training (e.g., patch sizes 27 and 18) perform well.
- **Scheduler-free training** — no cosine LR schedule (which assumes a fixed optimization horizon) and no augmentation schedules; augmentations are limited to horizontal flips and random crops (e.g., VerticalFlip can cause puddle-reflection false positives in driving), with batch-level resizing to minimize padding. EMA of weights replaces the LR scheduler.
- **RF-DETR-Seg** — a lightweight instance segmentation head bilinearly interpolates the projector output into a pixel embedding map; masks are the dot product of FFN-projected query embeddings (from each decoder layer) with that map, interpretable as YOLACT-style prototypes. Pre-trained on Objects-365 pseudo-labeled with SAM 2 masks.
- **Standardized latency protocol** — buffering 200 ms between forward passes prevents power throttling on the NVIDIA T4 (TensorRT 10.4, CUDA 12.4), and accuracy + latency must be reported from the *same* model artifact: naive FP16 quantization drops D-FINE to 0.5 AP, and YOLOv8/v11 lose accuracy going FP32 to FP16.

## Results

- **COCO detection (val)**: RF-DETR (nano) hits **48.0 AP at 2.3 ms**, beating D-FINE (nano, 42.7 AP) by **5.3 AP** at similar latency and matching YOLOv8/v11 *medium*; small gets 52.9 AP at 3.5 ms; medium 54.7 AP at 4.4 ms; **2x-large reaches 60.1 AP at 17.2 ms — the first real-time detector past 60 AP on COCO**. All points on the Pareto curve come from a single training run.
- **RF100-VL (100 diverse real-world datasets)**: RF-DETR (2x-large) scores **63.3 AP (63.5 with optional fine-tuning) at 15.6 ms**, outperforming fine-tuned GroundingDINO (tiny, 62.3 AP at 309.9 ms) by 1.2 AP while running $20\times$ as fast; YOLOv8/v11 plateau and scaling them larger does not help, and D-FINE falls behind RT-DETR at AP50 — evidence of COCO overfitting.
- **COCO instance segmentation**: RF-DETR-Seg (nano) gets **40.3 mask AP at 3.4 ms**, beating every reported YOLOv8/v11 size and FastInst (34.9 AP) by 5.4 while running nearly $10\times$ as fast; the medium (45.3 AP, 5.9 ms) approaches MaskDINO (46.3 AP, 242 ms).
- **Ablation (COCO, medium)**: gentler hyperparameters cost 1.0 AP vs LW-DETR (52.6 → 51.6), the DINOv2 backbone recovers +2.0 (53.6), Objects-365 pre-training adds +0.7 (54.3), weight-sharing NAS +0.3 (54.6) — net **+2 AP over LW-DETR at equal latency**, and NAS-mined configs need no fine-tuning on COCO.
- **Backbone ablation**: DINOv2 ViT-S/14 (54.3 AP, 4.7 ms) beats CAEv2 (52.3), SigLIPv2 ViT-B/32 (50.4), and SAM 2's Hiera-S (53.6 AP but 11.2 ms — Hiera's speed claims do not hold once TensorRT's Flash-Attention kernels favor plain ViTs).
- **Discovered configs**: the COCO Pareto family spans nano (384 res, patch 16, 2 decoder layers, DINOv2-S) to 2x-large (880 res, patch 20, 5 decoder layers, DINOv2-B), all with 300 queries — NAS trades resolution, patch size, windowing, and depth rather than parameters.

## Why it matters for SLAM

Semantic SLAM runs a detector *alongside* tracking, mapping, and optimization on the same embedded GPU, so the detector must sit at a precise latency budget — RF-DETR's weight-sharing NAS turns that from "pick the nearest YOLO size" into "dial in a sub-net within 10% of your target latency from one training run," including after deployment when the compute budget changes. Its end-to-end NMS-free design (inherited from [DETR](detr.md) and made real-time by [RT-DETR](rt-detr.md)) gives more predictable per-frame latency than NMS pipelines, which matters for real-time scheduling; the RF100-VL results speak directly to robotics, where deployment domains (warehouses, agriculture, inspection) look nothing like COCO — exactly where [YOLO](yolo.md)-family detectors used for dynamic-object masking in SLAM tend to degrade. High-accuracy real-time detection and instance masks feed dynamic-object removal, object-level landmarks, and semantic mapping; and the paper's power-throttling-aware latency protocol is worth adopting for any robotics benchmark. The caveat cuts the other way too: RF-DETR is a *closed-vocabulary* specialist — you fine-tune per deployment rather than prompting with text as with open-vocabulary detectors.

## Related

- [DETR](detr.md) — the end-to-end, NMS-free detection transformer this line descends from
- [RT-DETR](rt-detr.md) — first DETR to reach real-time; RF-DETR builds on its successor LW-DETR
- [YOLO](yolo.md) — the classical real-time family RF-DETR outperforms, especially off-COCO
- [Grounding DINO](grounding-dino.md) — the fine-tuned open-vocabulary baseline RF-DETR beats at $20\times$ the speed
- [SAM 2](sam-2.md) — provides the pseudo-label masks for RF-DETR-Seg's Objects-365 pre-training
