# GLOMAP

> Pan 2024 · [Paper](https://arxiv.org/abs/2407.20219)

**One-line summary** — Revisited global Structure-from-Motion and showed it can match incremental SfM (COLMAP) in accuracy while being dramatically faster, by replacing separate translation averaging with a joint camera-and-point global positioning step.

## Problem

SfM solutions split into two paradigms. *Incremental* SfM (COLMAP) registers images one at a time with repeated bundle adjustment; it is accurate and robust but its "costly repeated bundle adjustments" limit scalability. *Global* SfM recovers all cameras at once and is "orders of magnitude faster", but had never matched incremental accuracy — the gap "lies in the global translation averaging step", which suffers from scale ambiguity of two-view translations (skewed triplets amplify noise), dependence on accurate intrinsics to decompose two-view geometry, and degeneracy under near-collinear (forward) motion common in sequential data. GLOMAP set out to close that gap.

## Method & architecture

Two components: **correspondence search** (features, matching, two-view geometry $\mathbf{F}/\mathbf{E}/\mathbf{H}$, view-graph calibration, relative pose estimation) and **global estimation**.

- **Feature track construction**: only inlier correspondences of the best-fitting two-view model are kept, followed by cheirality tests; matches near epipoles or with small triangulation angles are removed before concatenating matches into tracks.
- **Rotation averaging first**: absolute orientations solve the classical robust objective

$$\operatorname*{arg\,min}_{\mathbf{R}}\sum_{i,j}\rho\left(d(\mathbf{R}_{j}^{\top}\mathbf{R}_{ij}\mathbf{R}_{i},\mathbf{I})^{p}\right)$$

  using the authors' implementation of Chatterjee et al.; relative poses inconsistent with the result (angular distance between $\mathbf{R}_{ij}$ and $\mathbf{R}_{j}\mathbf{R}_{i}^{\top}$) are filtered out.
- **Global positioning instead of translation averaging** — the core contribution. Camera positions $\mathbf{c}_i$ and 3D points $\mathbf{X}_k$ are estimated *jointly* from globally rotated camera rays $\mathbf{v}_{ik}$, discarding relative-translation constraints entirely:

$$\operatorname*{arg\,min}_{\mathbf{X},\mathbf{c},d}\sum_{i,k}\rho\left(\|\mathbf{v}_{ik}-d_{ik}(\mathbf{X}_{k}-\mathbf{c}_{i})\|_{2}\right),\quad\text{s.t.}\quad d_{ik}\geq 0$$

  with Huber loss $\rho$, Levenberg–Marquardt (Ceres), all variables initialised *uniformly at random* in $[-1,1]$ and $d_{ik}=1$. For optimal $d_{ik}$ the per-term error equals $\sin\theta$ for angle $\theta<\pi/2$ and saturates at $1$ beyond — a bounded, outlier-robust error that converges reliably from random initialisation thanks to its bilinear form. Because errors are defined on camera rays rather than relative translations, bad intrinsics only bias individual cameras, and forward/sideward motion is no longer degenerate.
- **Global bundle adjustment**: several rounds of LM with Huber loss; within each round rotations are first fixed, then optimised jointly with intrinsics and points (important for sequential data). Tracks are pre-filtered by angular error, then by reprojection error; iterations stop when fewer than 0.1% of tracks are filtered. Optional structure refinement (re-triangulation + more BA) boosts accuracy further.
- **Camera clustering**: a covisibility graph post-process finds strongly connected components and merges them conservatively, splitting wrongly matched, non-overlapping internet collections into separate coherent reconstructions.
- **COLMAP-compatible by construction**: consumes the same database and produces the same output format, so it drops into existing NeRF/3DGS data-prep workflows.

## Results

- **ETH3D SLAM** (sequential, millimetre GT): ~8% higher recall and +9/+8 AUC points at 0.1 m/0.5 m vs COLMAP, which is "one order of magnitude slower"; vs global-SfM baselines, 18%/4% higher recall and ~11 points higher AUC@0.1m.
- **ETH3D MVS rig**: reconstructs all scenes (COLMAP fails one, OpenMVG fails badly on all); similar or higher accuracy than COLMAP where it succeeds, ~3.5x faster.
- **LaMAR** (tens of thousands of AR-device images per scene): significantly more accurate than all baselines including COLMAP on HGE and LIN while being orders of magnitude faster; all methods struggle on CAB (forward motion, day–night changes, symmetries).
- **IMC 2023** (uncalibrated internet images): AUC at 3°/5°/10° several times higher than other global SfM baselines and about 4 points higher than COLMAP, at ~8x faster runtime; on MIP360 it matches re-run COLMAP while being >1.5x faster.
- Known failure mode: scenes with rotational symmetry (e.g., `exhibition_hall`) can collapse rotation averaging.
- Open source at [github.com/colmap/glomap](https://github.com/colmap/glomap) — hosted inside the COLMAP organisation, which accelerated its adoption as the default "fast mapper".

## Why it matters for SLAM

SfM tools like COLMAP are the standard way to generate ground-truth trajectories, offline maps, and training data for NeRF/3DGS and learning-based SLAM. GLOMAP makes this offline mapping step much cheaper at scale and rehabilitated global SfM as a serious general-purpose paradigm after a decade in which incremental pipelines were assumed to be the only robust option — a line continued by GPU-native systems like InstantSfM. Conceptually, its "solve everything at once" stance mirrors the SLAM backend's global bundle adjustment, and its ray-based global positioning shows how reformulating a fragile estimation step (translation averaging) can matter more than optimising it harder.

## Related

- [COLMAP](colmap.md)
- [InstantSfM](instantsfm.md)
- [VGGT](../level-05-deep-learning/vggt.md)
- [MASt3R](../level-05-deep-learning/mast3r.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md)
