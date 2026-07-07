# DETR

> Carion 2020 · [Paper](https://arxiv.org/abs/2005.12872)

**One-line summary** — Frames object detection as a direct set prediction problem solved by a Transformer encoder-decoder with a bipartite matching loss, eliminating anchors, NMS, and hand-designed detection pipelines.

## Problem

Classical detectors such as Faster R-CNN and YOLO are not truly end-to-end: they depend on hand-designed components — anchor generation, non-maximum suppression (NMS), multi-stage proposal pipelines — that explicitly encode prior knowledge about the detection task and each need tuning. These components exist because the networks produce many redundant candidate boxes that must be deduplicated after the fact. DETR asks whether detection can instead be cast as a clean *set prediction* problem: an image goes in, and a set of (box, class) pairs comes out of one network trained with one loss, with duplicates suppressed by the training objective itself rather than by post-processing.

## Key ideas

- **Detection as set prediction**: instead of classifying dense anchor boxes, DETR predicts a fixed-size set of detections in parallel and trains with a set-based global loss — a fundamentally cleaner formulation than Faster R-CNN or YOLO.
- **CNN + Transformer encoder**: a ResNet backbone extracts image features, then a Transformer encoder applies global self-attention over all spatial positions, letting every location reason about the whole image context.
- **Object queries**: a fixed small set of $N$ learned query embeddings ($N = 100$ in the paper) attend to the encoder output via cross-attention in the decoder, each producing one detection candidate (box + class) — all in parallel, not autoregressively.
- **Hungarian matching loss**: a unique one-to-one assignment between predictions and ground truth, $\hat{\sigma} = \arg\min_\sigma \sum_i \mathcal{L}_{\text{match}}(y_i, \hat{y}_{\sigma(i)})$, forces unique predictions — duplicate detections become costly during training, so no NMS post-processing is needed.
- **Set prediction loss**: for matched pairs, the loss combines class cross-entropy with an $\ell_1$ + generalized IoU box regression term; unmatched queries must predict a special "no object" class.
- **Anchor-free**: no anchor boxes, aspect-ratio priors, or scale heuristics to tune, and no specialized library required — the model is conceptually simple.
- **Generalizes beyond boxes**: adding a mask head yields unified panoptic segmentation, where DETR significantly outperforms competitive baselines.

## Results & impact

- On COCO, DETR reaches 42.0 AP — accuracy and run-time performance on par with the well-established, highly optimized Faster R-CNN baseline — with a far simpler architecture.
- Its main weakness at release was slow training convergence (500 epochs on COCO) and comparatively weaker small-object detection; follow-ups (Deformable DETR, DINO, RT-DETR) fixed both.
- The bipartite-matching set loss became a standard tool for any set-to-set prediction task (keypoints, segments, tracked objects), and Transformer-based detectors now dominate the field.

## Why it matters for SLAM

DETR started the Transformer takeover of object detection, and its descendants (RT-DETR, DINO, Grounding DINO) are the detectors that modern semantic and object-level SLAM systems build on. Its bipartite matching idea generalizes to any set-to-set prediction problem — keypoints, segments, object landmarks — which shows up repeatedly in learned SLAM front-ends. When a SLAM system needs object detections for semantic mapping, dynamic-object filtering, or scene graphs, the detector is very often a DETR-family model.

## Related

- [RT-DETR](rt-detr.md) — real-time DETR variant that beats YOLO-class detectors
- [Grounding DINO](grounding-dino.md) — open-vocabulary, text-prompted DETR descendant
- [YOLO](yolo.md) — the classical real-time detector family DETR contrasts with
- [SAM](sam.md) — promptable segmentation often paired with DETR-style detectors

[Back to Level 5](../README.md#level-5-applying-deep-learning)
