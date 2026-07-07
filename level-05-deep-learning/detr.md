# DETR

> Carion 2020 · [Paper](https://arxiv.org/abs/2005.12872)

**One-line summary** — Frames object detection as a direct set prediction problem solved by a Transformer encoder-decoder with a bipartite matching loss, eliminating anchors, NMS, and hand-designed detection pipelines.

## Problem

Classical detectors such as Faster R-CNN and YOLO are not truly end-to-end: they depend on hand-designed components — anchor generation, non-maximum suppression (NMS), multi-stage proposal pipelines — that explicitly encode prior knowledge about the detection task and each need tuning. These exist because the networks produce many near-duplicate candidate boxes that must be deduplicated after the fact. DETR asks whether detection can be cast as a clean *set prediction* problem: an image in, a set of (box, class) pairs out of one network trained with one loss, with duplicates suppressed by the training objective itself rather than by post-processing.

## Method & architecture

Three components in sequence: a **CNN backbone** (ResNet-50/101) extracts a feature map, which is flattened and supplemented with fixed positional encodings; a **Transformer encoder** (6 layers, width 256, 8 heads in the base model) applies global self-attention over all spatial positions; a **Transformer decoder** transforms $N$ learned embeddings — *object queries* — via self-attention and encoder-decoder cross-attention, decoding all $N$ objects **in parallel** (not autoregressively); finally a shared **feed-forward network** maps each output embedding to normalized box coordinates $b \in [0,1]^4$ and a class label, including a special "no object" class $\varnothing$. $N$ is fixed and much larger than the typical object count. Auxiliary Hungarian losses after every decoder layer help training.

**Bipartite matching.** Training first finds the lowest-cost one-to-one assignment between the $N$ predictions and the padded ground-truth set:

$$\hat{\sigma} = \arg\min_{\sigma \in \mathfrak{S}_N} \sum_{i}^{N} \mathcal{L}_{\text{match}}\big(y_i, \hat{y}_{\sigma(i)}\big),$$

computed with the Hungarian algorithm, where for $y_i = (c_i, b_i)$ the matching cost is $-\mathbf{1}_{\{c_i \neq \varnothing\}}\, \hat{p}_{\sigma(i)}(c_i) + \mathbf{1}_{\{c_i \neq \varnothing\}}\, \mathcal{L}_{\text{box}}\big(b_i, \hat{b}_{\sigma(i)}\big)$.

**Hungarian loss.** Given the optimal assignment, the loss is a negative log-likelihood for class prediction plus a box loss over matched pairs:

$$\mathcal{L}_{\text{Hungarian}}(y, \hat{y}) = \sum_{i=1}^{N} \Big[ -\log \hat{p}_{\hat{\sigma}(i)}(c_i) + \mathbf{1}_{\{c_i \neq \varnothing\}}\, \mathcal{L}_{\text{box}}\big(b_i, \hat{b}_{\hat{\sigma}(i)}\big) \Big],$$

with the log-probability of $\varnothing$ down-weighted by a factor 10 for class imbalance. Because boxes are predicted directly (not as deltas w.r.t. anchors), a pure $\ell_1$ loss would scale badly, so the box loss mixes $\ell_1$ with the scale-invariant generalized IoU: $\mathcal{L}_{\text{box}} = \lambda_{\text{iou}}\, \mathcal{L}_{\text{iou}}\big(b_i, \hat{b}_{\sigma(i)}\big) + \lambda_{\text{L1}}\, \lVert b_i - \hat{b}_{\sigma(i)} \rVert_1$. The one-to-one matching makes duplicate predictions costly during training — so no NMS is needed at inference.

**Panoptic extension.** Adding a mask head on the decoder outputs, with a pixel-wise argmax over mask scores, yields unified panoptic segmentation of "things" and "stuff" with no overlap heuristics.

## Results

- On COCO val, DETR (ResNet-50, 41M params, 86 GFLOPS, 28 FPS) reaches **42.0 AP**, matching the heavily tuned Faster R-CNN-FPN+ baseline (42.0 AP, 42M params) — achieved by much better large-object detection ($\text{AP}_L$ 61.1 vs 53.4) while lagging on small objects ($\text{AP}_S$ 20.5 vs 26.6). DETR-DC5-R101 reaches 44.9 AP.
- Training needed 500 epochs (lr drop at 400); the long schedule adds 1.5 AP over the short one. Ablations: removing the encoder costs 3.9 AP overall and 6.0 AP on large objects — global self-attention is doing real work.
- Panoptic segmentation: DETR-R101 obtains **45.1 PQ** on COCO val vs 44.1 for a PanopticFPN++ baseline retrained with the same augmentation, dominating especially on stuff classes ($\text{PQ}^{\text{st}}$ 37.0 vs 33.6), and 46 PQ on COCO test.
- Its main weaknesses at release — slow convergence and small-object AP — were fixed by follow-ups (Deformable DETR, DINO, RT-DETR), and the bipartite-matching set loss became a standard tool for any set-to-set prediction task.

## Why it matters for SLAM

DETR started the Transformer takeover of object detection, and its descendants (RT-DETR, DINO, Grounding DINO) are the detectors that modern semantic and object-level SLAM systems build on. Its bipartite matching idea generalizes to any set-to-set prediction problem — keypoints, segments, object landmarks — which shows up repeatedly in learned SLAM front-ends. When a SLAM system needs object detections for semantic mapping, dynamic-object filtering, or scene graphs, the detector is very often a DETR-family model.

## Related

- [RT-DETR](rt-detr.md) — real-time DETR variant that beats YOLO-class detectors
- [Grounding DINO](grounding-dino.md) — open-vocabulary, text-prompted DETR descendant
- [YOLO](yolo.md) — the classical real-time detector family DETR contrasts with
- [SAM](sam.md) — promptable segmentation often paired with DETR-style detectors
