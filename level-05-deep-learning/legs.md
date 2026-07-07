# LEGS

> Yu 2024 · [Paper](https://arxiv.org/abs/2409.18108)

**One-line summary** — Language-Embedded Gaussian Splats: a mobile robot incrementally builds a room-scale 3DGS map with a scale-conditioned CLIP feature field *online* as it drives, matching LERF's open-vocabulary query success while training 3.5x faster.

## Problem

Semantic 3D maps are valuable for "searching for objects of interest in offices, warehouses, stores, and homes", but LERF — the reference method for language-embedded 3D — requires offline per-scene NeRF optimization with all poses known in advance (as does LangSplat, which must train a scene-specific autoencoder over all images first). A robot needs the opposite workflow: build the semantic map *while* traversing a previously unseen environment (>= 750 sq ft in this paper), from constrained trajectories where cameras run near-parallel to shelves and walls, with accumulating pose drift, and answer queries immediately. Point-cloud approaches (ConceptFusion, CLIP-Fields) fuse a single feature per point, losing the multi-scale object-vs-part reasoning that LERF's scale-conditioned field provides.

## Method & architecture

A Fetch robot with a forward RGB-D Realsense D455 and two side-facing ZED 2 stereo cameras (known extrinsics); processing streams to a desktop with two RTX 4090s (one for LEGS training, ~15 GB; one for DROID-SLAM, up to 18 GB):

- **Multi-camera reconstruction**: offline SfM fails to register the barely-overlapping side cameras, so DROID-SLAM tracks *one* side ZED stream online and the mount's CAD extrinsics extrapolate poses for the other two cameras — tripling effective field of view for free. Tracking runs at 30 fps.
- **Incremental 3DGS construction**: Nerfstudio's Splatfacto is modified to consume a *stream* of image-pose pairs. New Gaussians are initialized per keyframe by sampling 500 pixels of the depth image and deprojecting them with metric depth from a learned stereo model (accurate on thin and transparent objects).
- **Global bundle adjustment in the loop**: every 150 keyframes, DROID-SLAM's global BA re-optimizes all past poses over the keyframe graph (minimizing Mahalanobis distance between reprojected points and revised optical-flow correspondences), and the 3DGS training cameras are updated accordingly — mitigating the drift that otherwise produces duplicated objects, fuzzy geometry, and ghosting. (Pose-tracking inside the splat, as in SplaTAM, takes up to a second per frame — too slow here.)
- **Language embedding (hybrid explicit-implicit)**: geometry is explicit Gaussians; semantics live in a scale-conditioned field $F_{lang}(\vec{x}, s)\in\mathbb{R}^{D}$ — position $\vec{x}$ goes through a multi-resolution hash encoding producing $z$, then an MLP $m_{\theta}(z,s)$ outputs a $D$-dimensional language feature. Features are rasterized into feature images with the tile-based rasterizer and supervised against multi-scale CLIP crops of the training images (as in LERF, and unlike FMGS which averages CLIP across scales). Inference runs at roughly 50 Hz at 1080p.
- **Querying**: a text prompt is CLIP-encoded, a LERF-style relevancy map is computed, and the query is localized in the world frame as the argmax relevancy over the 3D Gaussian means — no volumetric rendering of a dense point cloud needed.

## Results

- **Object recall** (4 scenes; 15 GPT-4V-generated open-vocabulary queries each; success = argmax point projects inside a hand-annotated box in a novel view): LEGS vs LERF — Office Kitchen 10/15 vs 9/15, Office Dining Area 11/15 vs 11/15, Office Workspace 9/15 vs 10/15, Grocery Store Testbed 10/15 vs 12/15 — comparable success, "up to 66% accuracy" on open-vocabulary and long-tail queries.
- **Training time** (to 20 average PSNR): LEGS 12 min vs LERF 44 min — over 3.5x faster, and LEGS receives poses incrementally while LERF got final poses.
- **Bundle-adjustment ablation** (training-view PSNR, w/o BA → w/ BA): D435 18.6 → 22.7, D455 20.0 → 23.5, ZED 2 19.2 → 23.8 — BA removes ghost duplicates (e.g. a doubled volleyball) across all cameras.
- **Multi-camera vs single camera**: the 3-camera rig reconstructs low-view objects (trash chutes, wet-floor sign) that a single ZED misses.
- Stated failure modes: small/far-field objects in training views, object-background color similarity, false positives on semantically similar objects, and the static-scene assumption.

## Why it matters for SLAM

LEGS is a concrete step from "SLAM as geometry" toward Spatial AI: a robot maps a store or warehouse and can immediately be asked "where is the first aid kit?". It was among the first systems to combine online 3DGS training with language-aligned feature supervision, showing that the LERF idea survives the move from capture-then-optimize to incremental robot mapping — with classical SLAM machinery (DROID-SLAM tracking + periodic global BA) supplying the pose consistency that makes online splat training work at room scale.

## Related

- [LERF](lerf.md)
- [ConceptFusion](conceptfusion.md)
- [DROID-SLAM](droid-slam.md)
- [SplaTAM](splatam.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [OpenScene](openscene.md)
