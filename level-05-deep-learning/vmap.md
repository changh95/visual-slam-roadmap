# vMAP

> Kong 2023 · [Paper](https://arxiv.org/abs/2302.01838)

**One-line summary** — Object-level neural-field SLAM in which every detected object gets its own tiny MLP, all trained simultaneously through vectorised operations — watertight, model-free per-object reconstruction at 5 Hz map updates with up to 50 objects per scene.

## Problem

Neural-field SLAM systems like iMAP and NICE-SLAM represent the whole scene as one monolithic field with no object-level structure, and extracting individual objects is hard because "the correspondences between network parameters and specific scene regions are complicated". Object-level SLAM, meanwhile, needed CAD models or category-level shape priors to complete unseen surfaces — without priors only the directly observed parts get reconstructed, leaving holes. vMAP targets the no-prior case: efficient, watertight, per-object reconstruction inside a live RGB-D SLAM system.

## Method & architecture

**Object initialisation & association.** Each frame carries dense instance masks (ground truth, or Detic pre-trained on LVIS). Detections are associated across frames by two criteria — semantic consistency (same predicted class) and spatial consistency (mean IoU of 3D object bounds); unmatched detections spawn a new object MLP appended to the model stack. Per-object 3D bounds come from the depth-backprojected point cloud and are refined as observations accumulate. Camera poses are provided externally by ORB-SLAM3 — found "more accurate and robust compared to jointly optimising pose and geometry".

**Vectorised training** (the key contribution). All object MLPs share one architecture (4 layers, hidden size 32; the background model uses 128), so they can be stacked and optimised as a single batched computation with PyTorch's vectorised operations instead of a Python loop. Each object samples pixels from its own independent keyframe buffer, so any object's training can stop or resume with no inter-object interference.

**Depth-guided sampling.** Along each ray, $N_c$ points are stratified-uniform between the near bound $t_n$ and the depth-map surface $t_s$, and $N_s$ points concentrate near the surface:

$$t_i \sim \mathcal{U}\Bigl(t_n + \tfrac{i-1}{N_c}(t_s - t_n),\; t_n + \tfrac{i}{N_c}(t_s - t_n)\Bigr), \qquad t_i \sim \mathcal{N}(t_s, d_{\sigma}^{2}),$$

with $d_\sigma = 3$ cm; invalid depth falls back to the far bound.

**Occupancy rendering.** View direction is omitted (surfaces over view-dependent appearance) and each point has occupancy probability $o_\theta(\mathbf{x}_i) \in [0,1]$, giving termination probability $T_i = o(\mathbf{x}_i)\prod_{j<i}\bigl(1-o(\mathbf{x}_j)\bigr)$ and renders

$$\hat{O}(\mathbf{r}) = \sum_{i=1}^{N} T_i, \qquad \hat{D}(\mathbf{r}) = \sum_{i=1}^{N} T_i d_i, \qquad \hat{C}(\mathbf{r}) = \sum_{i=1}^{N} T_i c_i.$$

**Losses.** For object $k$, pixels are sampled only inside its 2D bounding box $R^k$; depth and colour are supervised inside the mask $M^k$ (L1), while the rendered occupancy is pushed to match the mask everywhere in $R^k$ — so the field learns to be empty outside the object:

$$L = \sum_{k=1}^{K} L^{k}_{\text{depth}} + \lambda_{1} L^{k}_{\text{colour}} + \lambda_{2} L^{k}_{\text{occupancy}}, \qquad \lambda_1 = 5,\ \lambda_2 = 10.$$

**Compositional rendering.** Any object can be queried inside its 3D bounds, frozen, removed, or recomposed; scene-level novel views use Ray-Box intersection per object and rank rendered depths along each ray for occlusion-aware compositing.

## Results

- **Replica** (8 scenes, 2000 RGB-D frames each, GT-pose baselines marked \*): object-level Accuracy 2.23 cm, Completion 1.44 cm, Completion Ratio 94.55% (<5 cm) and 69.23% (<1 cm) — vs iMAP\* (3.57 / 2.38 / 90.19 / 47.79) and NICE-SLAM\* (3.91 / 3.27 / 83.97 / 37.79); "more than 50–70% improvement over iMAP and NICE-SLAM for object-level completion". Scene-level Completion Ratio 92.99% vs 90.85 (iMAP\*) and 86.52 (NICE-SLAM\*).
- **TUM RGB-D tracking** (joint pose-map mode, ATE RMSE): 2.6 / 1.6 / 3.0 cm on fr1-desk / fr2-xyz / fr3-office — better than iMAP (4.9 / 2.0 / 5.8) and NICE-SLAM, but behind ORB-SLAM2 (1.6 / 0.4 / 1.0), which is why ORB-SLAM3 is used as the external tracker.
- **Efficiency** (Replica Room-0, RTX 3090): 0.66M total parameters (~40 KB per object) vs NICE-SLAM's 12.12M; 226 ms mapping per frame (~5 Hz) — 1.5x faster than iMAP, 4x faster than NICE-SLAM. Vectorised training keeps each optimisation step under 15 ms even with 200 objects, where sequential for-loop training explodes.
- On ScanNet and live Azure Kinect data it produces sharper object boundaries than NICE-SLAM\* and finer detail than offline ObjSDF, with realistic hole-filling — though fully out-of-view regions (e.g. the back of a chair) remain beyond reach without a 3D prior.

## Why it matters for SLAM

vMAP brought object-level decomposition to neural-field SLAM, bridging the object-SLAM lineage (SLAM++, Fusion++, NodeSLAM) with the implicit-mapping lineage (iMAP, NICE-SLAM). The resulting map is not just geometry but a set of independently trainable, manipulable object entities — exactly what robotic manipulation and scene editing need — and the vectorised-training trick showed that "many networks" scales on a single GPU. It became the reference design for object-centric neural-field mapping and influenced subsequent object-aware dense SLAM work.

## Related

- [iMAP](imap.md) — the single-MLP neural-field SLAM vMAP decomposes
- [NICE-SLAM](nice-slam.md) — hierarchical-grid neural SLAM baseline
- [SLAM++](../level-04-rgbd-slam/slampp.md) — the original object-level SLAM idea
- [Fusion++](../level-04-rgbd-slam/fusionpp.md) — per-object TSDF volumes without shape priors
- [DSP-SLAM](../level-04-rgbd-slam/dsp-slam.md) — object SLAM with learned shape priors, the step before per-object fields
