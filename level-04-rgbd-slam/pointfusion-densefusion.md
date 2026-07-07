# PointFusion / DenseFusion

> Xu 2018 · [Paper](https://arxiv.org/abs/1711.10871) / Wang 2019 · [Paper](https://arxiv.org/abs/1901.04780)

**One-line summary** — Two influential RGB-D object pose networks that fuse image features with point-cloud features per point, forming the learned object front-end that object-level SLAM systems build on.

## Problem

Estimating 3D object pose from RGB-D data requires combining two very different modalities: dense, appearance-rich images and sparse, metrically accurate 3D points. Existing methods either used multi-stage pipelines or baked in sensor- and dataset-specific assumptions (e.g. collapsing depth into an extra image channel, or tuning separately for LiDAR driving scenes versus indoor RGB-D). What was needed was a conceptually simple, application-agnostic architecture that processes each modality with the network suited to it and fuses the results — per point, so that partially occluded objects can still be posed from their visible fragments.

## Key ideas

- **Heterogeneous feature fusion**: both methods process the RGB crop with a CNN and the depth-derived 3D points with a PointNet-style network *independently*, then combine the two feature streams with a fusion network — rather than collapsing depth into a fourth image channel and losing its geometric structure.
- **PointFusion (Xu 2018)**: a generic 3D object detection method whose fusion network predicts multiple 3D bounding-box hypotheses and their confidences, using the input 3D points as *spatial anchors* — each point predicts corner offsets relative to itself plus a confidence score. Conceptually simple and free of sensor- or dataset-specific assumptions.
- **Dataset-agnostic by design**: PointFusion was evaluated on two very different benchmarks — KITTI (outdoor driving, LiDAR + camera) and SUN-RGBD (indoor scenes, RGB-D camera) — with the *same* architecture and no dataset-specific tuning.
- **DenseFusion (Wang 2019)**: takes the fusion one step further — each point receives a per-pixel appearance embedding and a geometric embedding, plus a global feature; the network predicts a 6-DoF pose per point with a learned confidence, and a lightweight iterative refinement module polishes the winning estimate. The dense per-point structure means a partially occluded object can be posed from whichever fragment is visible.
- **Confidence-weighted prediction**: in both networks, per-point confidences let the model learn *which* observations to trust — an implicit robust estimator that echoes the role RANSAC plays in classical pipelines.
- **Object front-end, not a SLAM system**: these networks estimate poses of known object instances per frame; SLAM systems consume their outputs as measurements attached to object nodes in a map or factor graph, fusing them across views for persistence and consistency.

## Results & impact

PointFusion was the first model able to perform better than or on par with the state of the art on both KITTI and SUN-RGBD — two datasets with entirely different sensors and scene statistics — without any dataset-specific model tuning, validating the modality-split-then-fuse design. DenseFusion refined that design into the standard learned 6-DoF pose estimator for tabletop manipulation research, widely adopted as a baseline on the standard 6D-pose benchmarks and as the per-frame pose source in object-level mapping pipelines. Together they established the architecture pattern (CNN + PointNet + per-point fusion with confidences) that object-level SLAM systems such as MoreFusion build their volumetric pose predictors on.

## Why it matters for SLAM

Object-level SLAM needs a reliable way to turn raw RGB-D into 6-DoF object observations, and the PointFusion/DenseFusion line established the standard learned architecture for that role: dense image-geometry feature fusion with confidence-aware pose regression. Systems like MoreFusion use exactly this style of volumetric/learned pose prediction as initialization for multi-view, collision-aware refinement, and any modern object-SLAM pipeline is likely to feature a descendant of these networks in its front-end.

## Related

- [Fusion++](fusionpp.md)
- [MoreFusion](morefusion.md)
- [SLAM++](slampp.md)
- [DSP-SLAM](dsp-slam.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
