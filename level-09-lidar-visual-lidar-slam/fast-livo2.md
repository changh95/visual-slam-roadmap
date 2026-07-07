# FAST-LIVO2

> Zheng 2024 · [Paper](https://arxiv.org/abs/2408.14035)

**One-line summary** — FAST-LIVO2 fuses IMU, LiDAR, and camera through an error-state iterated Kalman filter with a *sequential* update that resolves the dimension mismatch between heterogeneous LiDAR and image measurements, setting the bar for direct LVI odometry on onboard compute.

## Problem

A LiDAR scan contributes thousands of low-dimensional geometric residuals per update while a camera frame contributes photometric residuals of a completely different structure — jointly updating both in one Kalman step is awkward, and FAST-LIVO's simplifications (constant depth per patch for affine warping, no exposure handling, no fallback when LiDAR points are missing) left accuracy and robustness on the table. FAST-LIVO2 re-architects the fusion to be rigorous and efficient enough for real-time, fully onboard robotic use.

## Method & architecture

State on the 19-dimensional manifold $\mathcal{M} = SO(3)\times\mathbb{R}^{16}$: $\mathbf{x} = [{^G}\mathbf{R}_I^T\ {^G}\mathbf{p}_I^T\ {^G}\mathbf{v}_I^T\ \mathbf{b}_g^T\ \mathbf{b}_a^T\ {^G}\mathbf{g}^T\ \tau]^T$, where $\tau$ is the **inverse camera exposure time** (relative to the first frame, $\tau_0 = 1$ fixed for observability), modeled as a random walk. Scan recombination re-segments the LiDAR stream into scans at camera sampling instants, so both sensors update at the same 10 Hz.

- **Sequential ESIKF update**: factorizing the posterior as

$$p(\mathbf{x} \mid \mathbf{y}_l, \mathbf{y}_c) \propto p(\mathbf{y}_c \mid \mathbf{x})\, \underbrace{p(\mathbf{y}_l \mid \mathbf{x})\, p(\mathbf{x})}_{\propto\, p(\mathbf{x} \mid \mathbf{y}_l)},$$

  the filter first iterates the LiDAR update against the IMU-propagated prior, then the visual update against the LiDAR-converged state and covariance — theoretically equivalent to the joint update when the two noises are independent, but each module keeps its own iteration and structure. Each step uses the standard iterated-Kalman gain $\mathbf{K} = ((\mathbf{H}^\kappa)^T\mathbf{R}^{-1}\mathbf{H}^\kappa + \widehat{\mathbf{P}}^{-1})^{-1}(\mathbf{H}^\kappa)^T\mathbf{R}^{-1}$.
- **LiDAR measurement model**: raw (temporally 1:3 downsampled) points, point-to-plane residuals $\mathbf{0} = \mathbf{n}_j^T({^G}\mathbf{T}_I\,{^I}\mathbf{T}_L\,{^L}\mathbf{p}_j - \mathbf{q}_j)$ against planes stored in a hash-indexed voxel map (0.5 m root voxels, 3-layer octree), with noise that models ranging, bearing, *and laser beam divergence* — noise grows with the incidence angle to the plane.
- **Visual measurement model** (sparse-direct, one-step frame-to-map): each visual map point is a LiDAR point with patch pyramids; the residual compares exposure-normalized patches between current and reference frames,

$$\mathbf{0} = \tau_k\,\mathbf{I}_k(\mathbf{u}_i + \Delta\mathbf{u}) - \tau_r\,\mathbf{I}_r(\mathbf{u}'_i + \mathbf{A}^r_i\,\Delta\mathbf{u}),$$

  where $\mathbf{A}^r_i$ is an affine warp computed from the **LiDAR plane prior** (normal optionally refined by multi-patch photometric optimization) instead of FAST-LIVO's constant-depth assumption. An inverse compositional formulation puts the pose increment on the reference side so Jacobians are computed once, and alignment runs coarse-to-fine over three pyramid levels. Because $\tau_k$ appears in the residual, exposure is estimated in the same update.
- **Unified voxel map**: LiDAR constructs and updates the geometry (planes); vision attaches patch pyramids to LiDAR points. Reference patches are re-scored by NCC similarity to sibling patches and view-angle orthogonality; new patches are added after >20 frames or >40 pixels of motion; new map points fill empty 30×30-pixel grid cells with the highest-gradient candidates.
- **On-demand voxel raycasting**: when LiDAR returns few points (close-proximity blind zones, FoV mismatch), rays are cast through unoccupied image grid cells, sampling voxels along depth until map points are recalled — keeping the visual update constrained.

## Results

- **Benchmarks** (25 sequences: NTU-VIRAL, Hilti'22, Hilti'23; loop closure removed from LVI-SAM): average absolute translational RMSE of **0.044 m** — roughly three times more accurate than second-place FAST-LIVO (0.137 m), and far ahead of FAST-LIO2 (0.151 m), R3LIVE (0.278 m), LVI-SAM (1.928 m, fails on nine sequences), SDV-LOAM (7.416 m). Best on nearly all sequences except two dim/blurred ones where FAST-LIO2 is millimeters better.
- **Ablations**: removing online exposure estimation costs 6 mm average accuracy; removing reference-patch update costs 44 mm; normal refinement adds ~1 mm (helps only in well-lit structured scenes).
- **Runtime** (i7-10700K): 30.03 ms average per frame-pair (17.13 ms LiDAR + 12.90 ms image) — real time at 10 Hz with margin; 78.44 ms on the ARM RB5 (Qualcomm Kryo585), still real time. FAST-LIO2 is only ~10.35 ms faster despite processing no images.
- **Mapping**: real-time colored point maps whose closeups are akin to the actual RGB images; end-to-end position error under 0.01 m on the showcased mapping sequences; exposure-normalized coloring largely eliminates overexposed map points.
- **Applications**: fully onboard autonomous UAV navigation (a pioneering real-world LIV-based closed-loop flight, with raycasting keeping localization stable in near-wall blind zones), airborne mapping, and mesh/texturing plus NeRF/3D-Gaussian-splatting model generation from the dense colored maps. Code, dataset, and applications are open source.

## Why it matters for SLAM

FAST-LIVO2 is widely regarded as the strongest open-source direct LVI odometry — the culmination of the HKU MARS line (FAST-LIO2 → FAST-LIVO → FAST-LIVO2). Its sequential-update trick is a generally useful pattern for fusing sensors whose measurements differ wildly in dimension and structure, and its demonstrated UAV deployments show direct triple fusion is production-ready at edge-compute budgets. If you are choosing a modern LVI system for a robot today, this is the default candidate to beat.

## Hands-on

- [Run FAST-LIVO2](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/fast_livo2)

## Related

- [FAST-LIVO](fast-livo.md) — the predecessor whose fusion it makes rigorous
- [FAST-LIO2](fast-lio2.md) — the direct LiDAR-inertial core
- [R3LIVE++](r3livepp.md) — shares the online exposure-estimation mindset
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — the underlying principle
- [LVI-SAM](lvi-sam.md) — the factor-graph counterpart in the LVI design space
- [NeRF](../level-05-deep-learning/nerf.md) — one of the rendering pipelines its dense maps feed
