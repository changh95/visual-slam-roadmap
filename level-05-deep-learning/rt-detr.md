# RT-DETR

> Zhao (Baidu) 2023 · [Paper](https://arxiv.org/abs/2304.08069)

**One-line summary** — First real-time end-to-end Transformer detector, matching YOLO speed while keeping DETR's clean NMS-free set prediction ("DETRs Beat YOLOs on Real-time Object Detection").

## Key ideas

- **Attacking DETR's bottleneck**: DETR's multi-scale Transformer encoder is quadratic in spatial positions. RT-DETR replaces it with an *efficient hybrid encoder*: self-attention only within each scale (cheap), plus a lightweight FPN-style cross-scale fusion.
- **IoU-aware query selection**: Initial object queries are chosen as the top-k encoder features by predicted quality, giving the decoder a much better starting point than learned static queries.
- **No NMS**: Retains Hungarian-matching set prediction — exactly one prediction per object, no anchor tuning, no non-maximum suppression post-processing.
- **Tunable speed/accuracy**: Swappable backbones and adjustable decoder depth at inference time let one design span edge devices to server GPUs.
- On COCO, RT-DETR variants outperformed comparable YOLO models on both accuracy and speed — the first Transformer detector to do so.

## Why it matters for SLAM

Semantic SLAM front-ends need object detection at frame rate; historically that meant YOLO plus NMS heuristics. RT-DETR delivers Transformer-quality detection in the same compute envelope, and its NMS-free deterministic output is simpler to integrate into SLAM pipelines (stable instance counts for data association, differentiable end-to-end). It is a natural detector choice for real-time semantic mapping and dynamic-object filtering.

## Related

- [DETR](detr.md) — the original end-to-end Transformer detector
- [YOLO](yolo.md) — the real-time CNN baseline it competes with
- [Grounding DINO](grounding-dino.md) — open-vocabulary DETR-style detection
- [SAM](sam.md) — promptable segmentation often paired with detectors

[Back to Level 5](../README.md#level-5-applying-deep-learning)
