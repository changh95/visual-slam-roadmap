# RT-DETR

> Zhao (Baidu) 2023 · [Paper](https://arxiv.org/abs/2304.08069)

**One-line summary** — First real-time end-to-end Transformer detector, matching YOLO speed while keeping DETR's clean NMS-free set prediction ("DETRs Beat YOLOs on Real-time Object Detection").

## Problem

The YOLO series dominates real-time detection through a reasonable speed/accuracy trade-off, but both its speed and its accuracy are negatively affected by NMS post-processing (threshold tuning, variable latency, duplicate suppression heuristics). End-to-end Transformer detectors (DETRs) eliminate NMS via set prediction, but their computational cost — especially the multi-scale Transformer encoder, quadratic in the number of spatial positions — kept them out of the real-time regime and prevented them from fully exploiting the advantage of excluding NMS.

RT-DETR set out to build the first real-time end-to-end object detector, resolving this dilemma.

## Key ideas

- **Efficient hybrid encoder**: The expensive multi-scale encoder is decomposed into *intra-scale interaction* (self-attention only within each scale, which is cheap since each scale is small) and *cross-scale fusion* (a lightweight FPN-style path), expeditiously processing multi-scale features without full cross-scale attention.
- **Uncertainty-minimal query selection**: Initial object queries are selected as high-quality encoder features (rather than learned static queries), giving the decoder a much better starting point and improving accuracy.
- **No NMS**: Retains Hungarian-matching set prediction — exactly one prediction per object, no anchor tuning, no non-maximum suppression post-processing, and therefore deterministic latency.
- **Two-step design methodology**: First maintain accuracy while improving speed (encoder redesign), then maintain speed while improving accuracy (query selection) — an unusually explicit engineering recipe.
- **Flexible speed tuning**: Adjusting the number of decoder layers at inference time trades accuracy for speed *without retraining*, so one trained model adapts to various deployment scenarios.
- **Swappable backbones**: The design supports different backbones (ResNet variants and beyond) plus scaled-down models, spanning compute budgets from edge devices to server GPUs.

## Results & impact

- RT-DETR-R50 / R101 achieves 53.1% / 54.3% AP on COCO at 108 / 74 FPS on a T4 GPU, outperforming previously advanced YOLOs in both speed and accuracy — the first Transformer detector to do so.
- RT-DETR-R50 outperforms DINO-R50 by 2.2% AP while being about 21x faster; scaled-down RT-DETRs also beat the lighter YOLO S/M models.
- With Objects365 pre-training, RT-DETR-R50 / R101 reaches 55.3% / 56.2% AP.
- Adopted as a real-time detection backbone in perception stacks (e.g., paired with SAM-family models for grounded segmentation) where NMS-free deterministic output simplifies system design.

## Why it matters for SLAM

Semantic SLAM front-ends need object detection at frame rate; historically that meant YOLO plus NMS heuristics. RT-DETR delivers Transformer-quality detection in the same compute envelope, and its NMS-free deterministic output is simpler to integrate into SLAM pipelines (stable instance counts for data association, differentiable end-to-end). It is a natural detector choice for real-time semantic mapping and dynamic-object filtering.

## Related

- [DETR](detr.md) — the original end-to-end Transformer detector
- [YOLO](yolo.md) — the real-time CNN baseline it competes with
- [Grounding DINO](grounding-dino.md) — open-vocabulary DETR-style detection
- [SAM](sam.md) — promptable segmentation often paired with detectors

[Back to Level 5](../README.md#level-5-applying-deep-learning)
