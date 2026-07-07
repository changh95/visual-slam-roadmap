# MaskFusion

> Rünz 2018 · [Paper](https://arxiv.org/abs/1804.09194)

**One-line summary** — A real-time RGB-D SLAM system that recognises, segments, tracks, and reconstructs multiple *moving* objects as individual semantic surfel models instead of treating the world as one rigid scene.

## Problem

Traditional SLAM systems "output a purely geometric map of a static scene": anything that moves is treated as an outlier to be ignored, and the map says nothing about what objects it contains. Earlier recognition-based SLAM (e.g., SLAM++) could track objects but only ones with pre-scanned 3D models, and semantics-enabled dense SLAM (SemanticFusion) labelled map points into fixed categories without differentiating instances. MaskFusion targets the combination: object-aware, semantic, *and* dynamic — recognising, segmenting, and reconstructing multiple independently moving objects without known models, in real time.

## Method & architecture

MaskFusion is a multi-model SLAM system: it maintains a background model plus one surfel model $\mathcal{M}_m$, $m \in \{0..N\}$, per recognised object (the ElasticFusion representation — each surfel stores position, normal, colour, weight, radius, timestamps). Each model carries a rigid pose $\mathbf{R}_{tm}, \mathbf{t}_{tm}$ and a static/dynamic flag; only non-static objects are tracked separately (an object is declared dynamic by motion inconsistency, or when a person touches it). Three stages run per frame:

**Tracking.** Each tracked model's pose increment $\xi_m \in \mathfrak{se}(3)$ minimises a joint geometric-photometric energy against the model rendered at its previous pose:

$$E_m = \min_{\xi_m}\,(E^{icp}_m + \lambda E^{rgb}_m)$$

with a projective point-to-plane ICP term and a brightness-constancy term

$$E^{icp}_m = \sum_i \left((\mathbf{v}^i - \exp(\xi_m)\,\mathbf{v}^i_t)\cdot\mathbf{n}^i\right)^2, \qquad E^{rgb}_m = \sum_{\mathbf{u}\in\Omega}\left(\mathcal{I}_t(\mathbf{u}) - \mathcal{I}^a_{t-1}\big(\pi(\exp(\xi_m)\,\pi^{-1}(\mathbf{u},\mathcal{D}_t))\big)\right)^2,$$

where $\mathbf{v}^i,\mathbf{n}^i$ are the rendered model vertex/normal, $\mathbf{v}^i_t$ the back-projected current vertex, $\mathcal{D}_t,\mathcal{I}_t$ the current depth/intensity maps and $\pi$ the perspective projection; solved by Gauss–Newton on a 4-level coarse-to-fine pyramid (CUDA).

**Segmentation.** Mask R-CNN gives instance masks with class labels (80 COCO classes) but runs at only ~5 Hz with boundaries that leak into the background, so it runs asynchronously on a frame queue (length 12, ≈400 ms latency) while a per-frame *geometric* segmentation supplies crisp real-time boundaries: a pixel is an edge if $\phi_d + \hat{\lambda}\phi_c > \tau$, with depth-discontinuity term $\phi_d = \max_{i\in\mathcal{N}} |(\mathbf{v}_i - \mathbf{v})\cdot\mathbf{n}|$ and an analogous concavity term $\phi_c$ over a local neighbourhood $\mathcal{N}$. Connected components of the edge map are mapped to semantic masks (≥65% overlap), masks to existing models (projected model labels, matching class IDs), and leftover components directly to models; classes such as *person* can be excluded from fusion entirely.

**Fusion.** Surfels are updated by projective data association as in ElasticFusion, stencilled by the final segmentation so each new surfel belongs to exactly one model, with a confidence penalty for surfels outside the stencil to absorb imperfect masks.

## Results

- TUM RGB-D dynamic sequences, AT-RMSE (cm): on highly dynamic *f3w_xyz* / *f3w_halfsphere*, MaskFusion (exploiting person detection to ignore people) scores **10.4 / 10.6** vs Co-Fusion 69.6 / 80.3, ElasticFusion 21.6 / 20.9, VO-SF 87.4 / 73.9, StaticFusion 12.7 / 39.1. In slightly dynamic scenes plain ElasticFusion remains best (0.9 on f3s_static vs MaskFusion's 2.1) — over-eager outlier rejection discards points still useful for tracking.
- Object tracking: the teddy bear in f3_long_office is tracked with 2.2 cm AT-RMSE while the camera reaches 8.9 cm (7.2 cm if the bear were fused into the background).
- Reconstruction: a YCB bleach bottle (250 mm tall) is reconstructed with mean surfel error 7.0 mm (std 5.8 mm).
- Segmentation IoU over a 600-frame annotated sequence: projected fused-model masks beat Mask R-CNN + geometric refinement, which beats Mask R-CNN alone.
- Runtime: SLAM pipeline >30 Hz with one model, ~20 Hz with 3 non-static models; Mask R-CNN at 5 Hz on a dedicated second GPU (2× GTX Titan X, i7 3.5 GHz). AR demos (calorie estimation, a character riding a moving skateboard) and a grasping sequence exercise the instance-aware dynamic map.

## Why it matters for SLAM

MaskFusion is a landmark in the shift from "SLAM in a static world" to dynamic, object-aware SLAM: it showed that per-object dense models with semantic labels can be maintained in real time, without known object models. This line of work underpins robot manipulation and AR scenarios where the interesting parts of the scene are precisely the things that move — a map that deletes moving objects is useless to a robot that must grasp one. Together with MID-Fusion it established the object-level dynamic SLAM template that VDO-SLAM and DynaSLAM II later formalised in the optimisation backend.

## Related

- [MID-Fusion](mid-fusion.md)
- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md)
- [SLAM++](../level-04-rgbd-slam/slampp.md)
