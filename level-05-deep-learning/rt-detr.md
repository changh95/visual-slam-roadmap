# RT-DETR

> Zhao (Baidu) 2023 · [Paper](https://arxiv.org/abs/2304.08069)

**One-line summary** — First real-time end-to-end Transformer detector, matching YOLO speed while keeping DETR's clean NMS-free set prediction ("DETRs Beat YOLOs on Real-time Object Detection").

## Problem

The YOLO series dominates real-time detection through a reasonable speed/accuracy trade-off, but both its speed and its accuracy are negatively affected by NMS post-processing: two thresholds (confidence and IoU) must be tuned per scenario, and NMS execution time varies with the number of boxes. The paper quantifies this — with YOLOv8, moving the confidence threshold from 0.001 to 0.05 drops AP from 52.9% to 51.2% while NMS time falls from 2.36 ms to 1.06 ms; anchor-based YOLOs produce ~3x more boxes and thus need more NMS time than anchor-free ones. End-to-end Transformer detectors (DETRs) eliminate NMS via bipartite matching, but their computational cost — especially the multi-scale Transformer encoder, which accounts for 49% of Deformable-DETR's GFLOPs while contributing only 11% of its AP — kept them out of the real-time regime.

## Method & architecture

RT-DETR = backbone + efficient hybrid encoder + Transformer decoder with auxiliary prediction heads. The last three backbone stages $\{\mathcal{S}_3, \mathcal{S}_4, \mathcal{S}_5\}$ feed the encoder; the decoder iteratively refines a fixed set of object queries into (category, box) pairs — no anchors, no NMS.

**Efficient hybrid encoder** decouples the two jobs the vanilla multi-scale encoder does at once:

- **AIFI** (Attention-based Intra-scale Feature Interaction): a single-layer Transformer self-attention applied *only* to the highest-level feature $\mathcal{S}_5$ — high-level features carry the semantic concepts worth relating, while intra-scale attention on lower levels is redundant (restricting attention to $\mathcal{S}_5$ makes variant D 35% faster *and* +0.4% AP).
- **CCFF** (CNN-based Cross-scale Feature Fusion): a PANet-style convolutional fusion path whose fusion blocks (two $1\times1$ convs + $N$ RepBlocks, element-wise add) merge adjacent scales.

$$\mathcal{Q}=\mathcal{K}=\mathcal{V}=\texttt{Flatten}(\mathcal{S}_5),\quad \mathcal{F}_5=\texttt{Reshape}(\texttt{AIFI}(\mathcal{Q},\mathcal{K},\mathcal{V})),\quad \mathcal{O}=\texttt{CCFF}(\{\mathcal{S}_3,\mathcal{S}_4,\mathcal{F}_5\})$$

**Uncertainty-minimal query selection**: prior query-selection schemes pick top-$K$ ($K=300$) encoder features by classification score alone, so features with poor localization become initial queries. RT-DETR defines the uncertainty of encoder feature $\hat{\mathcal{X}}$ as the discrepancy between its predicted localization distribution $\mathcal{P}$ and classification distribution $\mathcal{C}$, and optimizes it in the loss:

$$\mathcal{U}(\hat{\mathcal{X}})=\|\mathcal{P}(\hat{\mathcal{X}})-\mathcal{C}(\hat{\mathcal{X}})\|,\quad \hat{\mathcal{X}}\in\mathbb{R}^{D}$$

$$\mathcal{L}(\hat{\mathcal{X}},\hat{\mathcal{Y}},\mathcal{Y})=\mathcal{L}_{box}(\hat{\mathbf{b}},\mathbf{b})+\mathcal{L}_{cls}(\mathcal{U}(\hat{\mathcal{X}}),\hat{\mathbf{c}},\mathbf{c})$$

where $\hat{\mathbf{c}},\hat{\mathbf{b}}$ are predicted category and box, $\mathbf{c},\mathbf{b}$ ground truth. This roughly doubles the fraction of selected features that are high-quality in both classification and IoU (0.67% vs 0.30% of features with both scores > 0.5).

**Flexible speed tuning**: because decoder layers are homogeneous, dropping trailing decoder layers at inference trades accuracy for speed without retraining — e.g., using layer 5 of a 6-layer RT-DETR-R50 loses 0.1% AP (53.1 → 53.0) while cutting 0.5 ms. Width/depth of encoder and decoder scale with the backbone (R18/R34/CSPResNet down to S/M-class models).

## Results

COCO val2017, speed on T4 GPU with TensorRT FP16, end-to-end (NMS time included for YOLOs via the paper's proposed end-to-end speed benchmark):

- **RT-DETR-R50: 53.1% AP, 108 FPS (42M params); RT-DETR-R101: 54.3% AP, 74 FPS** — beating the L/X models of YOLOv5/PP-YOLOE/YOLOv6/YOLOv7/YOLOv8 in both speed and accuracy (e.g., YOLOv8-L: 52.9% AP at 71 FPS; YOLOv8-X: 53.9% AP at 50 FPS).
- vs. DETRs with the same backbone: RT-DETR-R50 beats DINO-Deformable-DETR-R50 by **+2.2% AP (53.1 vs 50.9) at ~21x the FPS (108 vs 5)**.
- Encoder ablation: the hybrid encoder (variant E, 47.9% AP, 9.3 ms) vs coupled multi-scale encoder (variant C, 45.6% AP, 13.3 ms) — decoupling is both faster and more accurate.
- Query-selection ablation: uncertainty-minimal selection gives **+0.8% AP (48.7 vs 47.9)** over vanilla score-based selection.
- With Objects365 pre-training: RT-DETR-R50/R101 reach **55.3% / 56.2% AP**.
- Stated limitation: small-object AP still trails the best YOLOs (RT-DETR-R50 is 0.5% AP-S below YOLOv8-L).

## Why it matters for SLAM

Semantic SLAM front-ends need object detection at frame rate; historically that meant YOLO plus NMS heuristics. RT-DETR delivers Transformer-quality detection in the same compute envelope, and its NMS-free deterministic output is simpler to integrate into SLAM pipelines (stable instance counts for data association, no threshold tuning, predictable latency). It is a natural detector choice for real-time semantic mapping and dynamic-object filtering.

## Related

- [DETR](detr.md) — the original end-to-end Transformer detector
- [YOLO](yolo.md) — the real-time CNN baseline it competes with
- [Grounding DINO](grounding-dino.md) — open-vocabulary DETR-style detection
- [SAM](sam.md) — promptable segmentation often paired with detectors
