# CodeMapping

> Matsuki 2021 · [Paper](https://arxiv.org/abs/2107.08994)

**One-line summary** — CodeMapping (RA-L 2021) bolts a CodeSLAM-style learned dense mapper onto a reliable sparse SLAM system: a VAE conditioned on intensity, sparse depth, and reprojection-error images predicts an uncertainty-aware dense depth map for every keyframe, refined by multi-view code optimization in a parallel thread.

## Problem

State-of-the-art sparse visual SLAM systems provide accurate, reliable camera trajectories and landmark positions, but their sparse maps "cannot be used for other tasks such as obstacle avoidance or scene understanding". Fully dense SLAM is fragile (photometric noise) and cannot jointly optimize its huge parameter count in real time, while CodeSLAM/DeepFactors predict depth purely from a gray-scale image, which is inaccurate in practice. CodeMapping asks how to add dense, uncertainty-aware mapping to an arbitrary metric sparse SLAM system without touching — or delaying — its battle-tested tracking core.

## Method & architecture

**Two loosely coupled processes.** ORB-SLAM3 runs unmodified (tracking, local and global mapping). After every local bundle adjustment, the SLAM thread hands the dense mapping thread a window of 4 keyframes (the latest plus its top-3 covisible ones) with camera poses, sparse depth images (landmarks projected into the keyframe), and reprojection-error images (average reprojection distance per landmark; unmatched new points set to 10).

**Sparse-to-dense VAE.** A U-Net ingests the gray-scale image concatenated with the sparse depth and reprojection-error maps (proximity-parameterized to $[0,1]$) and conditions a VAE that outputs a latent code $\mathbf{c} \in \mathbb{R}^{32}$, a dense depth map $D$, and an uncertainty map $b$, trained with a KL loss plus the uncertainty-weighted reconstruction loss

$$\sum_{\mathbf{x}\in\Omega} \frac{\| D[\mathbf{x}] - D_{gt}[\mathbf{x}] \|}{b[\mathbf{x}]} + \log(b[\mathbf{x}]) .$$

The reprojection-error input lets the network down-weight outlier landmarks (which show higher average reprojection error). Training uses ~0.4M ScanNet images with 1000 ORB-selected sparse points each; reprojection errors are *simulated* by perturbing points along rays so errors follow the exponential-Gaussian distribution observed in real ORB-SLAM3 runs (10 epochs, lr 0.0001, 256×192).

**Multi-view code optimization.** Depth stays a compact code, so the mapper refines consistency with DeepFactors-style factors in GTSAM — optimizing only the codes (poses from sparse SLAM are trusted and fixed), with a Huber cost on all factors. With warp $\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) = \pi(\mathbf{T}_{ji}\,\pi^{-1}(\mathbf{x}, D_i[\mathbf{x}]))$:

$$E_{photo}^{ij}(\mathbf{c}_i) = \sum_{\mathbf{x}\in\Omega} \| I_i[\mathbf{x}] - I_j[\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i)] \|^2 \qquad E_{rep}^{ij}(\mathbf{c}_i) = \sum_{\mathbf{x},\mathbf{y}\in M_{ij}} \| \omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) - \mathbf{y} \|^2$$

$$E_{dpt}^{ij}(\mathbf{c}_i) = \sum_{\mathbf{x}\in\Omega'} \| \,|\mathbf{T}_{ji}\,\pi^{-1}(\mathbf{x}, D_i[\mathbf{x}])|_z - D_j[\hat{\mathbf{x}}] \,\|^2 ,$$

with BRISK matches $M_{ij}$ and sparsely sampled pixels $\Omega'$ for the geometric term. Refined keyframe depths can finally be fused into a globally consistent TSDF model, since the sparse SLAM trajectory is globally consistent.

## Results

- ScanNet test scenes (ORB-SLAM3 RGB-D; MAE/RMSE in meters vs rendered ground truth): the full method wins on all 7 sequences against DeepFactors (intensity-only conditioning) and Ma et al.'s sparse-to-dense network — e.g. scene0100_00 MAE 0.046 vs 0.185 (DeepFactors) and 0.141 (Ma et al.). Multi-view optimization improves single-view prediction by roughly 10%.
- EuRoC MAV (visual-inertial mode, LiDAR-rendered ground truth): full method V101 MAE 0.192 m vs DeepFactors 0.842 and Ma et al. 0.495; sparse-point conditioning markedly reduces the domain-shift penalty, and reprojection-error conditioning filters gross outliers common on EuRoC's textureless walls.
- Runtime (i9-10900 + RTX 3080, mean over both datasets): dense prediction 235 ms via the TensorFlow C++ API (11 ms via the Python API), multi-view optimization 170 ms for 4 keyframes — about 1 Hz dense map updates without delaying the SLAM process.
- Qualitative: smoother, more accurate local meshes than Kimera's Delaunay triangulation; TSDF-fused global reconstructions; even works on scale-corrected pure monocular ORB-SLAM output.

## Why it matters for SLAM

CodeMapping is a clean example of the pragmatic "hybrid" design that dominates deployable systems: keep the battle-tested sparse front-end, add learning only where classical methods are weak (dense geometry), and couple them loosely so a network failure can never kill tracking. It carried the CodeSLAM/DeepFactors latent-code lineage into a production-shaped architecture, and its author (Matsuki) later carried the dense-mapping-alongside-tracking philosophy into Gaussian-splatting SLAM (MonoGS).

## Related

- [CodeSLAM](codeslam.md)
- [DeepFactors](deepfactors.md)
- [TANDEM](tandem.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
- [MonoGS](monogs.md)
- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — the geometric real-time meshing approach it compares against
