# NodeSLAM

> Sucar 2020 · [Paper](https://arxiv.org/abs/2004.04485)

**One-line summary** — Object-level SLAM that represents each detected object as a compact learned occupancy code decoded by a class-conditional VAE, and uses a novel probabilistic differentiable renderer to jointly optimize object shapes, object poses, and the camera trajectory.

## Problem

The choice of scene representation determines both the inference algorithms a SLAM system needs and the applications it enables. Point or surfel maps carry no notion of object identity, pose, or complete shape — yet robots need exactly those to grasp a mug or pack a box. Classical reconstruction only recovers directly observed surfaces; feed-forward shape prediction cannot integrate multiple measurements in a principled way. NodeSLAM asks for principled *full* object shape inference from one or more RGB-D images inside a SLAM-style joint estimation, filling the gap between per-object TSDF systems (Fusion++) and CAD-model instance systems.

## Method & architecture

**Shape model.** A single class-conditional 3D CNN VAE (5 conv layers, kernel 4, stride 2; mirrored decoder) is trained on ShapeNet occupancy grids of size $32\times 32\times 32$ for four table-top classes (mug, bowl, bottle, can), with a KL latent loss and binary cross-entropy reconstruction loss. Each object in the map is a latent code $\mathbf{d}$ of size 16 plus a 9-DoF pose (rotation, translation, scale).

**Probabilistic rendering** (the measurement function). For each pixel, $M$ depths $\hat{\delta}_i$ are sampled along the back-projected ray and trilinearly interpolated occupancies $o_i$ are gathered from the decoded grid. The ray-termination and escape probabilities are

$$\phi_i = p(\mathbf{D}[u,v] = \hat{\delta}_i) = o_i \prod_{j=1}^{i-1}(1-o_j), \qquad \phi_{M+1} = \prod_{j=1}^{M}(1-o_j),$$

giving rendered depth and per-pixel uncertainty as the distribution's mean and variance:

$$\hat{\delta}_{\mu}[u,v] = \sum_{i=1}^{M+1}\phi_i\,\hat{\delta}_i, \qquad \hat{\delta}_{var}[u,v] = \sum_{i=1}^{M+1}\phi_i\,(\hat{\delta}_i - D[u,v])^2 .$$

Multi-object renders are combined by minimum depth (occlusion handling), and a 4-level Gaussian pyramid widens the receptive field for coarse-to-fine optimization.

**Inference.** With a Gaussian prior on the code, the MAP problem is a least-squares objective solved with Levenberg–Marquardt:

$$\min_{\mathbf{d},\,T_{CG}} \sum_{u,v} \frac{(\delta[u,v] - \hat{\delta}_{\mu}[u,v])^2}{\hat{\delta}_{var}[u,v]} + \sum_i \mathbf{d}_i^2 .$$

Translation/scale are initialized from the masked point cloud, orientation from the detected support plane (plus a CNN for the mug's yaw), and $\mathbf{d}=0$ (the mean class shape).

**SLAM loop.** Mask R-CNN masks are associated to map objects in two stages (previous-frame mask IoU > 0.2, then rendered-mask IoU); unmatched masks spawn new objects. Camera tracking minimizes the same render loss with the map fixed. Keyframes (created when an object is initialized or viewpoint change exceeds 13°) enter a sliding-window joint optimization over 3 keyframes of camera poses, object poses, and shape codes: $L_{joint} = \sum_j L_{render}^j + \sum_i L_{prior}^i$. Timings: 7 ms per object render, ~1.5 s full object reconstruction, 7 fps tracking, 2 s joint optimization.

## Results

- Multi-view shape optimization on ShapeNet mugs (Table 1): with 3 views, accuracy 3.48 mm, chamfer-$L_1$ 3.65 mm, completion 96.1%, vs DVR's local-receptive-field renderer at 8.28 mm / 10.91 mm / 44.8%; removing uncertainty or the Gaussian pyramid consistently degrades all metrics, and convergence is much faster than DVR.
- Against a Fusion++-style TSDF baseline on 5 synthetic scenes of 10 unseen ModelNet40 objects each: shape completion jumps to near-full from the first views (TSDF completes slowly with each fused frame), with comparable surface accuracy close to 5 mm.
- Tracking ablation (Table 2): full system mean absolute pose error 0.81–1.73 cm over the 5 scenes; without joint optimization errors grow up to 10.17 cm, without uncertainty rendering up to 6.99 cm.
- Real-world demonstrations: cluttered table-top SLAM with a noisy depth camera, an AR demo, and a real-time robot that packs and sorts reconstructed mugs/bowls/bottles using the completed meshes.

## Why it matters for SLAM

NodeSLAM established the modern object-level SLAM paradigm: learned shape priors as optimizable map variables inside a classical joint estimation, with differentiable rendering as the measurement model — the same inverted-renderer idea that later powers neural-field SLAM. Complete object models with poses are exactly what robot manipulation needs, unlike raw geometry fragments. It is the conceptual bridge from code-based dense SLAM (CodeSLAM) to object-centric neural-field mapping (vMAP) and DeepSDF-based systems like DSP-SLAM.

## Related

- [CodeSLAM](codeslam.md) — the frame-level latent-code idea NodeSLAM lifts to objects
- [DSP-SLAM](../level-04-rgbd-slam/dsp-slam.md) — DeepSDF object priors on an ORB-SLAM2 backbone
- [vMAP](../level-03-monocular-slam/vmap.md) — object-level neural-field successor
- [Fusion++](../level-04-rgbd-slam/fusionpp.md) — object-level TSDF mapping without learned shape priors
- [MoreFusion](../level-04-rgbd-slam/morefusion.md) — object-level fusion for manipulation from the same lab era
