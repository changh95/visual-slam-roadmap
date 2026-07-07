# VGGT-SLAM 2.0

> Maggio 2026 · [Paper](https://arxiv.org/abs/2601.19887)

**One-line summary** — The successor to VGGT-SLAM: a keyframe-level factor graph that removes 15-DoF drift and planar degeneracy, training-free loop-closure verification read out of VGGT's attention layers, and real-time operation onboard a Jetson Thor.

## Problem

VGGT-SLAM solved the uncalibrated submap-alignment problem by optimizing 15-DoF homographies on SL(4), but that solution carries its own costs: the high-dimensional alignment introduces rapid drift between loop closures that can severely warp the scene, and solving for the full homography is degenerate in planar scenes (a camera facing a wall or floor), causing divergence. Its factor graph also only estimated per-submap homographies, so keyframe-level rotation/translation errors from VGGT were handled sub-optimally, and image retrieval for loop closure trusted an external network (SALAD) without any verification. VGGT-SLAM 2.0 redesigns the backend to remove these failure modes while still respecting the reconstruction ambiguity of VGGT under unknown intrinsics — and makes the whole system run online on a robot.

## Method & architecture

- **Setup**: each submap comes from one VGGT pass over $n$ keyframes, giving calibrations $\mathcal{K}$, poses $\mathcal{T}$, depths $\mathcal{D}$, and confidences $\mathcal{C}$; points are back-projected per camera frame as $\mathbf{X}_i$ using $\mathbf{K}_i^{-1}$ and $\mathbf{D}_i$. Consecutive submaps share one *overlapping frame*. The general alignment object is the full $4\times 4$ homography
  $$\mathbf{H}_i = \begin{bmatrix} \mathbf{K}\mathbf{R} & \mathbf{t} \\ \mathbf{v}^{T} & s \end{bmatrix},$$
  with 15 DoF: 3 translation $\mathbf{t}$, 3 rotation $\mathbf{R}$, 1 scale $s$, 5 affine (calibration $\mathbf{K}$), 3 projective ($\mathbf{v}$).
- **New factor graph — keyframes as nodes**: every keyframe is an $\mathrm{SL}(4)$ node. *Intra* edges connect keyframes inside a submap and carry only $\mathrm{SE}(3)$ components, taken directly from VGGT's poses: $\mathbf{H}^i_j = \mathbf{T}_i^{-1}\mathbf{T}_j$ — projective distortion is consistent within a submap, and these edges let optimization correct VGGT's own pose drift. *Inter* edges connect the two estimates of an overlapping frame and carry only calibration and scale:
  $$\mathbf{H}^i_j = \begin{bmatrix} \mathbf{K}_i^{-1}\mathbf{K}_j & 0 \\ \mathbf{0}^{T} & s \end{bmatrix},$$
  enforcing that both submaps' estimates of the same physical camera agree in pose and calibration (even if VGGT's calibration guess is wrong, it must be *identical*). This restriction to SL(4) subgroups removes the 15-DoF drift and the planar degeneracy. The scale $s$ is the median ratio of corresponding 3D point distances after warping the two point clouds to a common calibration — the only place raw VGGT points are used.
- **Loop-closure verification from VGGT's attention, for free**: layer 22 of VGGT exhibits a "spotlight" attention pattern between corresponding regions of two images (absent in layers 21/23, present even on textureless walls). A match score is computed as
  $$\gamma_t = \max_{q \in Q^{(2)}} \left( \frac{\operatorname{Softmax}\left(Q^{(2)} {K^{(1)}}^{\top}\right)}{\max_{q \in Q^{(1)}} \operatorname{Softmax}\left(Q^{(1)} {K^{(1)}}^{\top}\right)} \right), \qquad \alpha_{match} = \operatorname{Mean}_{\text{top }25\%}\left(\{\gamma_t\}\right),$$
  where $Q$, $K$ are query/key tokens (head-averaged) of the retrieved and query image. SALAD candidates are only accepted when $\alpha_{match}$ passes a threshold, which allows *relaxing* the SALAD threshold (0.80 → 0.95) to harvest more loop closures while rejecting false positives. Loop closures are handled as two-frame mini-submaps passed to VGGT, connected by an inter edge.
- **Global optimization and map recovery**: the graph is optimized on the SL(4) manifold with GTSAM (the SL(4) solver has been upstreamed into GTSAM). Projection matrices are recovered as $\mathbf{P}_i = \mathbf{K}_i^{3\times 4} (\mathbf{H}^w_i)^{-1}$ and decomposed into global poses; global points follow from applying $\mathbf{H}^w_i$.

## Results

Constant parameters across all experiments (50 px min disparity, 25% confidence threshold, SALAD 0.95, $\alpha_{match}$ 0.85).

- **TUM RGB-D (uncalibrated, submaps of 32)**: best average ATE RMSE of **0.041 m** — about 23% lower than VGGT-SLAM SL(4) (0.053 m) and 22% lower than ViSTA-SLAM (0.052 m); MASt3R-SLAM* 0.060 m. On the planar `floor` scene: 0.102 m vs VGGT-SLAM's 0.141 m.
- **Loop-closure verification**: on the Clio datasets, verification raises accepted loop closures from 2 → 5 (Cubicle) and 0 → 9 (Apartment), and turns a diverging Office run (false positives from lookalike desk cubicles) into 4 correct closures with zero false positives. On LaMAR HGE, Recall@1 improves for SALAD 88.45 → 90.13 and NetVLAD 85.92 → 89.08.
- **Runtime**: about 8.4 FPS with 16-frame submaps on an RTX 3090 (6.3 FPS with open-set CLIP embeddings); per-submap time is dominated by VGGT inference (1248 ms). On the same machine, MASt3R-SLAM runs 7.2 FPS and VGGT-SLAM 6.9 FPS. Running fully onboard a Jetson Thor on a Jackal ground robot with a RealSense D455: 3.5 FPS with 4-frame submaps, live.
- **Open-set object detection**: Perception Encoder CLIP embeddings per keyframe + SAM 3 segmentation give 3D oriented bounding boxes from text queries in about 0.36 s per query (RTX 3090).
- **Scale**: reconstructs a 4,200-square-foot barn (34 submaps) and a KITTI driving sequence (44 submaps) on which VGGT-SLAM diverges — both larger than the biggest scene in the original paper (22 submaps).

## Why it matters for SLAM

The first wave of foundation-model SLAM systems (MASt3R-SLAM, VGGT-SLAM) proved the concept but ran offline or below sensor rate. VGGT-SLAM 2.0 closes the remaining gap — dense feed-forward reconstruction that runs online on embedded robot hardware — which is the actual requirement for robotics and AR. Its attention-layer analysis is also a notable pattern: extracting loop-closure verification from a frozen foundation model without any training hints at how much latent SLAM machinery these models already contain. Because nothing is trained, faster or better VGGT variants can be dropped in directly.

## Related

- [VGGT-SLAM](vggt-slam.md) — the original system this version supersedes
- [VGGT](vggt.md) — the underlying feed-forward geometry model
- [MASt3R-SLAM](mast3r-slam.md) — contemporary foundation-model SLAM
- [DROID-SLAM](droid-slam.md) — earlier learned SLAM baseline in this lineage
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the retrieval problem VGGT's attention verifies for free
- [Clio](clio.md) — the task-driven scene-graph datasets used for loop-closure evaluation
