# COLMAP

> Schönberger 2016 · [Paper](https://colmap.github.io/)

**One-line summary** — The de-facto standard open-source incremental Structure-from-Motion and Multi-View Stereo pipeline ("Structure-from-Motion Revisited", CVPR 2016), used as the offline reconstruction and ground-truth-poses workhorse across 3D vision.

## Problem

Incremental SfM — register images one at a time, triangulating structure and bundle-adjusting as you go — was the prevalent strategy for unordered photo collections by 2016, but "robustness, accuracy, completeness, and scalability remain the key problems towards building a truly general-purpose pipeline". Existing systems (Bundler, VisualSFM) often failed to register a large fraction of registrable images or produced broken models from mis-registrations and drift. Schönberger and Frahm revisited each stage of the incremental pipeline and hardened it, releasing the result as COLMAP.

## Method & architecture

The pipeline has two stages: **correspondence search** (feature extraction, matching, geometric verification producing a *scene graph*) and **incremental reconstruction** (initialization, image registration via PnP, triangulation, bundle adjustment, outlier filtering). The paper's contributions harden each step:

- **Scene graph augmentation**: multi-model geometric verification estimates a fundamental matrix ($N_F$ inliers), homography ($N_H$), and essential matrix ($N_E$) per pair, classifying each edge as *general*, *panoramic* (pure rotation), or *planar* via inlier ratios such as $N_H/N_F$ and the median triangulation angle $\alpha_m$; watermark/timestamp/frame ("WTF") pairs are detected by a border-region similarity transform and dropped. Reconstruction seeds only from non-panoramic, preferably calibrated pairs, and panoramic pairs are never triangulated.
- **Next-best-view selection**: candidate images are scored with a multi-resolution pyramid ($L$ levels, $K_l = 2^l$ cells per side, weight $w_l = K_l^2$): each cell that contains a visible triangulated point contributes once per level, so the score $S$ rewards both *many* and *uniformly distributed* 2D-3D correspondences — an efficient approximation of uncertainty-driven view planning.
- **Robust multi-view triangulation**: feature tracks (transitively chained matches) can be heavily outlier-contaminated, so triangulation is posed as recursive RANSAC over track elements: sample two measurements, triangulate $X_{ab} \sim \tau(\bar{x}_a, \bar{x}_b, P_a, P_b)$ with $a \neq b$ (DLT), and accept a model only if well-conditioned — sufficient triangulation angle $\alpha$ with

$$\cos\alpha=\frac{t_{a}-X_{ab}}{\left\|t_{a}-X_{ab}\right\|_{2}}\cdot\frac{t_{b}-X_{ab}}{\left\|t_{b}-X_{ab}\right\|_{2}}$$

  plus positive depths (cheirality) and reprojection error below threshold $t$. Recursion on the remaining measurements recovers multiple independent points falsely merged into one track.
- **Iterative BA, re-triangulation, filtering**: bundle adjustment minimizes the robustified reprojection error

$$E=\sum_{j}\rho_{j}\left(\left\|\pi\left(P_{c},X_{k}\right)-x_{j}\right\|_{2}^{2}\right)$$

  over poses $P_c \in \mathrm{SE}(3)$ and points $X_k \in \mathbb{R}^3$ (Cauchy loss $\rho_j$ in local BA; Ceres with sparse direct solver or PCG). Local BA runs after each registration; global BA only after the model grows by a set percentage. COLMAP adds *post-BA* re-triangulation on top of VisualSFM's pre-BA RT, and iterates BA → RT → filtering until filtered observations diminish, fighting drift.
- **Redundant view mining**: for dense collections, unaffected images with high mutual overlap $V_{ab}=\left\|v_{a}\wedge v_{b}\right\| / \left\|v_{a}\vee v_{b}\right\|$ (binary point-visibility vectors) are clustered into groups $G_r$ collapsed to a single camera in BA, with grouped cost $E_g$ using projection $\pi_g(G_r, P_c, X_k)$ and $P_{cr}=P_{c}G_{r}$ — shrinking the reduced camera system.

A companion PatchMatch-based MVS stage ("Pixelwise View Selection for Unstructured Multi-View Stereo", ECCV 2016) densifies the output; the whole system ships as a maintained C++/CUDA codebase with GUI, CLI, and `pycolmap` bindings.

## Results

Evaluated on 17 datasets totalling 144,953 unordered Internet photos against Bundler, VisualSFM, Theia, and DISCO:

- **Completeness**: registers the most images on essentially every dataset — e.g., Rome: 20,918 of 74,394 images vs 14,797 (Bundler) and 13,455 (Theia); Quad: 5,860 vs 5,624/5,028.
- **Accuracy**: best pose accuracy on Quad's ground-truth camera locations — median error 0.85 m vs VisualSFM 0.89 m, Bundler 1.01 m, DISCO 1.16 m; average reprojection errors of roughly 0.6–0.8 px vs roughly 1.5–3.2 px for Bundler/Theia.
- **Efficiency**: more than 50x faster than Bundler (slightly slower than VisualSFM; Theia fastest). RANSAC triangulation is 10–40x faster than exhaustive sampling with marginally shorter tracks; on Dubrovnik (2.9M tracks from 47M verified matches) recursive RANSAC recovers 906,501 points with average track length 8.8 vs Bundler's 713,824 at 7.8.
- **Redundant view mining**: total-runtime speedups of 5%/14%/32% for overlap thresholds $V$ = 0.6/0.3/0.1, with average reprojection error degrading only from 0.26 px to 0.27–0.29 px; on Colosseum, $V$ = 0.4 cuts full-pipeline runtime by 36% with an equivalent reconstruction.

## Why it matters for SLAM

COLMAP is the reference point against which both SLAM systems and learned reconstruction methods are measured, and it is the standard tool for generating camera poses used to train and evaluate them — most NeRF and 3D Gaussian Splatting pipelines start from COLMAP poses. Understanding its incremental design clarifies what SLAM does differently (sequential input, real-time budgets, loop closure), and its per-image cost growth is exactly the pain point that global-SfM (GLOMAP), GPU-parallel (InstantSfM), and feed-forward (DUSt3R, VGGT) successors target.

## Related

- [GLOMAP](glomap.md)
- [InstantSfM](instantsfm.md)
- [DUSt3R](../level-05-deep-learning/dust3r.md)
- [hloc](../level-05-deep-learning/hloc.md)
- [BARF](../level-05-deep-learning/barf.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
