# Foundation models

A *foundation model* is a large network pretrained once on massive, diverse data, then reused across many downstream tasks — either frozen as a feature extractor, lightly fine-tuned, or prompted. The term entered SLAM vocabulary because a wave of such models turned out to be directly useful as perception backbones: CLIP (image-text embeddings), SAM (promptable segmentation), DINOv2 (self-supervised visual features), Depth Anything (monocular depth), and the DUSt3R family (two-view 3D reconstruction from raw image pairs).

## What changed

Why this matters is best seen against the previous norm. Classical learned modules (SuperPoint, MonoDepth) were trained per-task on modest datasets and inherited their biases; deploying them in a new domain often meant retraining. Foundation models change the economics:

- **Zero-shot robustness**: features pretrained on internet-scale data survive appearance changes (lighting, season, style) that break both hand-crafted and small-scale learned features. RoMa, for example, builds dense matching on frozen DINOv2 features precisely for this robustness.
- **Reusable backbones**: one frozen encoder can serve place recognition, matching, segmentation, and depth heads simultaneously — attractive when compute on a robot is shared across tasks.
- **Open-vocabulary semantics**: CLIP-style embeddings let a map answer language queries ("find the fire extinguisher") without a fixed label set — the basis of ConceptFusion, ConceptGraphs, and language-driven scene graphs.
- **Geometry priors at scale**: DUSt3R and MASt3R show that even 3D reconstruction itself — traditionally the domain of multi-view geometry — can be absorbed into a pretrained model that outputs pointmaps directly from image pairs, with SLAM systems (MASt3R-SLAM) built on top.

## The families and what each provides

| Family | Trained on / how | What SLAM gets from it |
|---|---|---|
| CLIP / SigLIP | image-text pairs, contrastive | open-vocabulary semantics for maps and place descriptions |
| SAM / SAM 2 | promptable segmentation at scale | class-agnostic instance masks for object-level and dynamic SLAM |
| DINOv2 | self-supervised ViT | robust dense features for matching, VPR, and correspondence |
| Depth Anything (V1/V2), Metric3D | large-scale depth (self-)supervision | dense monocular depth priors where no depth sensor exists |
| DUSt3R / MASt3R / VGGT | posed image pairs/collections | feed-forward pointmaps, matches, and poses — geometry as inference |

Knowing this menu tells you what you can now get "for free" when designing a system — and which of the classical Level 3/4 modules each model could replace.

## How SLAM systems actually consume them

- **Frozen features + classical estimation**: extract foundation features, then run classical matching/RANSAC/BA on top (RoMa on DINOv2; open-vocabulary maps fusing CLIP features per surfel or Gaussian). The geometry stays exact; the perception becomes robust.
- **Feed-forward geometry + thin SLAM layer**: DUSt3R-family models output pointmaps directly; systems like MASt3R-SLAM add keyframing, filtering, and global optimization around the network — the model is the front-end *and* most of the mid-end.
- **Keyframe-rate scheduling and distillation**: because a ViT-L per frame is unaffordable on embedded hardware, systems run foundation models only on keyframes, cache their outputs in the map, or distill them into small students for the per-frame path.

## Trade-offs to respect

- **Compute weight**: real-time SLAM on embedded hardware may not afford large ViT inference per frame; plan for keyframe-rate use or distillation from the start.
- **Coarse outputs**: features typically come at patch resolution (e.g. 1/14 of the image), and depth predictions are often relative/affine rather than metric — a precision-oriented refinement or scale-alignment stage is usually needed before geometric optimization.
- **Statistical failure modes**: foundation models can be confidently wrong in ways a reprojection-error check would catch — hallucinated depth on reflective surfaces, semantically plausible but geometrically inconsistent matches. This is a strong argument for keeping classical geometric verification in the loop rather than trusting network outputs blindly.
- **Licensing and reproducibility**: model weights, training data, and usage terms vary; a system built on a frozen third-party backbone inherits its update cadence and biases.

## The practical recipe

The pattern emerging across Level 5 and beyond: use foundation-model features for the *robustness-critical, semantic, or ill-posed* parts of the pipeline (place recognition, wide-baseline matching, monocular depth, open-vocabulary labels), and keep classical estimation for the *precision-critical* parts (pose optimization, mapping consistency). The most recent systems — MASt3R-SLAM, ConceptGraphs-style semantic mapping — are exactly this: thin geometric layers over large pretrained models.

## Why it matters for SLAM

Foundation models are reshaping what a SLAM front-end is: instead of training task-specific networks, modern systems increasingly compose frozen pretrained backbones — and the most recent SLAM systems (MASt3R-SLAM, ConceptGraphs-style semantic mapping) are thin geometric layers over such models. Knowing what each family provides (CLIP: semantics, SAM: masks, DINOv2: robust features, Depth Anything: depth, DUSt3R: geometry) tells you what you can now get "for free" when designing a system.

## Related

- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [SAM](sam.md)
- [Depth Anything](depth-anything.md)
- [DUSt3R](../level-03-monocular-slam/dust3r.md)
- [RoMa](roma.md)
- [MASt3R-SLAM](../level-03-monocular-slam/mast3r-slam.md)
- [ConceptGraphs](conceptgraphs.md)
