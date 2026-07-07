# AirVO
> Xu 2023 · [Paper](https://arxiv.org/abs/2212.07595)

**One-line summary** — An illumination-robust stereo visual odometry that combines accelerated learned point features (SuperPoint + SuperGlue) with LSD line features matched *through* the points, running in real time (~15 Hz) on low-power embedded platforms.

## Problem
Hand-crafted front-ends (ORB, FAST, BRISK) and optical-flow tracking assume brightness roughly constant between frames. In dynamic-illumination environments — onboard lights in tunnels, lights switching off, auto-exposure swings — tracking quality collapses exactly when a robot needs it most. Learned features are far more robust but "often require huge computational resources," making them impractical on lightweight platforms like UAVs. Line features add structure in low-texture scenes, but classic line matching (LBD descriptors, tracked sample points) is itself unstable under changing light. AirVO targets all three gaps at once: a hybrid learned/classical point-line VO that is illumination-robust *and* embedded-real-time.

## Method & architecture
A hybrid pipeline: learned front-end + traditional optimization back-end, split into a **feature thread** (SuperPoint on GPU in one sub-thread, LSD line detection on CPU in parallel) and an **optimization thread** (initial pose estimation, keyframe decision, local BA). CNN/GNN inference is converted from FP32 to FP16, making feature extraction + matching >5× faster than the original code.

- **Learned points, keyframe-based tracking.** SuperPoint features on the left image are matched with SuperGlue directly against the *last keyframe* (not frame-by-frame) — learned matching survives large baselines, so this reduces accumulated tracking error.
- **Longer lines from LSD.** LSD segments are merged when nearly collinear (angle < $\delta_\theta$, midpoint-to-line distance < $\delta_d$, endpoint gap < $\delta_{ep}$); short leftovers are filtered out, keeping only stable long segments.
- **Lines matched through points.** Each point $\mathbf{p}_i = (x_i, y_i)$ is associated to line $\mathbf{l}_j$ (parameters $A_j, B_j, C_j$) if its distance
  $$d_{ij} = \frac{\lvert A_j x_i + B_j y_i + C_j \rvert}{\sqrt{A_j^2 + B_j^2}}$$
  is small. Two lines in frames $k$ and $k{+}1$ are declared the same if the score $S_{mn} = \frac{N_{pm}}{\min({}^k N_m,\, {}^{k+1} N_n)}$ (matched shared points over the smaller per-line point count) and $N_{pm}$ exceed thresholds — no line descriptor needed, so the point matcher's illumination robustness transfers to lines for free.
- **3D lines.** Plücker coordinates $\mathbf{L} = [\mathbf{n}^T, \mathbf{v}^T]^T$ for triangulation/transformation/projection; the minimal 4-DoF orthonormal representation $(\mathbf{U}, \mathbf{W}) \in SO(3) \times SO(2)$ during optimization. Triangulation intersects the two back-projected planes; if that degenerates, the line is built from two associated triangulated points: $\mathbf{n} = \mathbf{X}_1 \times \mathbf{X}_2$, $\mathbf{v} = (\mathbf{X}_1 - \mathbf{X}_2)/\lVert \mathbf{X}_1 - \mathbf{X}_2 \rVert$ — nearly free, since the points already exist.
- **Joint optimization.** A co-visibility graph (ORB-SLAM-style) over keyframes, map points and 3D lines. The line reprojection error stacks point-to-line distances of the two detected endpoints $\bar{\mathbf{p}}_{i,1}, \bar{\mathbf{p}}_{i,2}$ from the reprojected line ${}^k\mathbf{l}_i$:
  $$e_l = \begin{bmatrix} d(\bar{\mathbf{p}}_{i,1},\, {}^k\mathbf{l}_i) & d(\bar{\mathbf{p}}_{i,2},\, {}^k\mathbf{l}_i) \end{bmatrix}^T,$$
  alongside the standard point reprojection error $\mathbf{E}_p = \bar{\mathbf{x}}_q - \pi\left({}_w^c\mathbf{R}\, {}^w\mathbf{X}_q + {}_w^c\mathbf{t}\right)$.
- **Keyframes** are selected on distance/angle to the last keyframe or drops in tracked map points; keyframe right images are then processed for stereo triangulation.

## Results
Evaluated (loop closure and relocalization disabled in all baselines) on two illumination-challenging datasets:

- **OIVIO** (tunnels/mines, onboard 1300–9000 lm light): best translational RMSE on 7 of 9 sequences and second-best on the other 2 — e.g. MN_015_GV_01: 0.0537 m vs. OKVIS 0.0663, ORB-SLAM2 0.0762, Basalt-VIO 0.2157; VINS-Fusion, StructVIO and UV-SLAM lose track or exceed 10 m error on many sequences.
- **UMA-VI** (lights switched off mid-sequence): average error 0.2479 m — 6.7% of PL-SLAM (3.7096 m) and 48.2% of OKVIS (0.5141 m); ORB-SLAM2 and Basalt-VIO lost track on all 4 sequences. On conference-csc2 drift is ~1.0% vs. OKVIS 1.5% and PL-SLAM 7.1%.
- **Ablation**: adding the line pipeline beats point-only AirVO on 12 of 13 sequences, reducing translational error by 58.2% on average.
- **Runtime** (Jetson AGX Xavier, 640×480, 200 points): point detection + tracking 64 ms vs. 342 ms unaccelerated (5.3×); whole system ~15 Hz on the Jetson and ~40 Hz on a notebook PC.

## Why it matters for SLAM
AirVO was, per the authors, the first VO using both learned feature detection *and* learned matching in real time on low-power embedded hardware — demonstrating that learned front-ends pay off in real deployments, not just on matching benchmarks. Its point-anchored line matching is an elegant trick that sidesteps fragile line descriptors entirely. It is a good template for modernizing a classical indirect VO/VIO pipeline with deep components (the same group's follow-up, AirSLAM, extends it with loop closure and map reuse).

## Related
- [SuperPoint](../level-05-deep-learning/superpoint.md) — the learned feature at AirVO's core.
- [SuperGlue](../level-05-deep-learning/superglue.md) — the GNN matching paradigm the point front-end builds on.
- [PL-SLAM](../level-03-monocular-slam/pl-slam.md) — earlier point+line SLAM with hand-crafted features (the main baseline).
- [VINS-Mono](vins-mono.md) — the classical tightly-coupled baseline this line of work upgrades.
- [Learned vs hand-crafted](../level-05-deep-learning/learned-vs-hand-crafted.md) — the front-end design question AirVO answers empirically.
- [LightGlue](../level-05-deep-learning/lightglue.md) — efficient learned matching for this class of front-end.
