# Foundation models

A *foundation model* is a large network pretrained once on massive, diverse data, then reused across many downstream tasks — either frozen as a feature extractor, lightly fine-tuned, or prompted. The term entered SLAM vocabulary because a wave of such models turned out to be directly useful as perception backbones: CLIP (image-text embeddings), SAM (promptable segmentation), DINOv2 (self-supervised visual features), Depth Anything (monocular depth), and the DUSt3R family (two-view 3D reconstruction from raw image pairs).

Why this matters is best seen against the previous norm. Classical learned modules (SuperPoint, MonoDepth) were trained per-task on modest datasets and inherited their biases; deploying them in a new domain often meant retraining. Foundation models change the economics:

- **Zero-shot robustness**: features pretrained on internet-scale data survive appearance changes (lighting, season, style) that break both hand-crafted and small-scale learned features. RoMa, for example, builds dense matching on frozen DINOv2 features precisely for this robustness.
- **Reusable backbones**: one frozen encoder can serve place recognition, matching, segmentation, and depth heads simultaneously — attractive when compute on a robot is shared across tasks.
- **Open-vocabulary semantics**: CLIP-style embeddings let a map answer language queries ("find the fire extinguisher") without a fixed label set — the basis of ConceptFusion, ConceptGraphs, and language-driven scene graphs.
- **Geometry priors at scale**: DUSt3R and MASt3R show that even 3D reconstruction itself — traditionally the domain of multi-view geometry — can be absorbed into a pretrained model that outputs pointmaps directly from image pairs, with SLAM systems (MASt3R-SLAM) built on top.

There are trade-offs to respect. Foundation models are heavy: real-time SLAM on embedded hardware may not afford a ViT-L per frame, so systems often run them at keyframe rate or distill them into smaller students. Their outputs are typically coarse (patch-level features at 1/14 resolution) and may need a precision-oriented refinement stage. And their failure modes are statistical rather than geometric — they can be confidently wrong in ways a reprojection-error check would catch, which is a good argument for keeping classical verification in the loop.

The practical recipe emerging across Level 5 and beyond: use foundation-model features for the *robustness-critical, semantic, or ill-posed* parts of the pipeline (place recognition, wide-baseline matching, monocular depth, open-vocabulary labels), and keep classical estimation for the *precision-critical* parts (pose optimization, mapping consistency).

## Why it matters for SLAM

Foundation models are reshaping what a SLAM front-end is: instead of training task-specific networks, modern systems increasingly compose frozen pretrained backbones — and the most recent SLAM systems (MASt3R-SLAM, ConceptGraphs-style semantic mapping) are thin geometric layers over such models. Knowing what each family provides (CLIP: semantics, SAM: masks, DINOv2: robust features, Depth Anything: depth, DUSt3R: geometry) tells you what you can now get "for free" when designing a system.

## Related

- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [SAM](sam.md)
- [Depth Anything](depth-anything.md)
- [DUSt3R](../level-03-monocular-slam/dust3r.md)
- [RoMa](roma.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
