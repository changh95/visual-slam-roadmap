# DETR

> Carion 2020 · [Paper](https://arxiv.org/abs/2005.12872)

**One-line summary** — Frames object detection as a direct set prediction problem solved by a Transformer encoder-decoder with a bipartite matching loss, eliminating anchors, NMS, and hand-designed detection pipelines.

## Key ideas

- **Detection as set prediction**: instead of classifying dense anchor boxes, DETR predicts a fixed-size set of detections in parallel and trains with a set-based loss — a fundamentally cleaner formulation than Faster R-CNN or YOLO.
- **CNN + Transformer encoder**: a ResNet backbone extracts image features, then a Transformer encoder applies global self-attention over all spatial positions.
- **Object queries**: $N$ learned query embeddings attend to the encoder output via cross-attention, each producing one detection candidate (box + class) in parallel.
- **Hungarian matching loss**: a unique one-to-one assignment between predictions and ground truth, $\hat{\sigma} = \arg\min_\sigma \sum_i \mathcal{L}_{\text{match}}(y_i, \hat{y}_{\sigma(i)})$, makes duplicate predictions costly — so no NMS post-processing is needed.
- **Anchor-free**: no anchor boxes, aspect-ratio priors, or scale heuristics to tune; unmatched queries simply predict "no object".
- Matches Faster R-CNN accuracy on COCO with a much simpler architecture, at the cost of slow training convergence (later fixed by DETR variants).

## Why it matters for SLAM

DETR started the Transformer takeover of object detection, and its descendants (RT-DETR, DINO, Grounding DINO) are the detectors that modern semantic and object-level SLAM systems build on. Its bipartite matching idea generalizes to any set-to-set prediction problem — keypoints, segments, object landmarks — which shows up repeatedly in learned SLAM front-ends. When a SLAM system needs object detections for semantic mapping, dynamic-object filtering, or scene graphs, the detector is very often a DETR-family model.

## Related

- [RT-DETR](rt-detr.md) — real-time DETR variant that beats YOLO-class detectors
- [Grounding DINO](grounding-dino.md) — open-vocabulary, text-prompted DETR descendant
- [YOLO](yolo.md) — the classical real-time detector family DETR contrasts with
- [SAM](sam.md) — promptable segmentation often paired with DETR-style detectors

[Back to Level 5](../README.md#level-5-applying-deep-learning)
