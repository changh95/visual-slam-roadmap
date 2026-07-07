# DeepFactors

> Czarnowski 2020 · [Paper](https://arxiv.org/abs/2001.05049)

**One-line summary** — DeepFactors (RA-L 2020) turns CodeSLAM's learned compact depth codes into the first real-time probabilistic dense monocular SLAM system, using photometric, reprojection, and sparse geometric errors simultaneously as factors in standard factor-graph software.

## Problem

Monocular SLAM had fragmented along three axes: scene geometry representation (sparse landmarks vs dense maps), the consistency metric used to optimize the multi-view problem (photometric vs reprojection vs geometric), and whether learned priors are used. Sparse methods allow real-time joint probabilistic inference but yield maps useless for interaction; dense methods discard cross-correlations and alternate tracking/mapping; CodeSLAM proved the compact-code idea but "lacked features of full SLAM, was not capable of real-time performance and did not generalise to real handheld camera scenes". DeepFactors unifies these paradigms "in a probabilistic framework while still maintaining real-time performance".

## Method & architecture

Each keyframe carries a pose variable $p_i$ and a code variable $\mathbf{c}_i$; depth decodes *linearly* from the code so factors never need costly relinearization:

$$D_i = f(\mathbf{c}_i, I_i) = D_i^0 + J(I_i)\,\mathbf{c}_i ,$$

where $D_i^0$ is the zero-code depth and $J(I_i) = \partial D_i / \partial \mathbf{c}_i$ is an image-conditioned Jacobian. The network (U-Net feature extractor + linear-decoder VAE, plus an explicit code-prediction encoder for initialization and a per-pixel uncertainty $b$) is trained on ~1.4M ScanNet images at 256×192 with code size 32.

Three pairwise consistency errors become factors, all built on the warp $\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) = \pi(T_{ji}\,\pi^{-1}(\mathbf{x}, D_i(\mathbf{x})))$ with $T_{ji} \in SE(3)$:

$$e_{pho}^{ij} = \sum_{\mathbf{x}\in\Omega_i} \| I_i(\mathbf{x}) - I_j(\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i)) \|^2 \qquad \text{(dense, direct)}$$

$$e_{rep}^{ij} = \sum_{(\mathbf{x},\mathbf{y})\in M_{ij}} \| \omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) - \mathbf{y} \|^2 \qquad \text{(BRISK matches, Cauchy robust cost)}$$

$$e_{geo}^{ij} = \sum_{\mathbf{x}\in\Omega_i} \| \left[ T_{ji}\,\pi^{-1}(\mathbf{x}, D_i(\mathbf{x})) \right]_z - D_j(\hat{\mathbf{x}}) \|^2 \qquad \text{(depth consistency, Huber, sparse pixel samples)}$$

Zero-code prior factors keep codes inside the VAE's Gaussian latent region. The system flow: incoming frames are tracked against the nearest keyframe with a GPGPU SE(3) Lucas–Kanade aligner (~250 Hz); new keyframes are initialized from the code-prediction network and connected to the last N keyframes with pairwise factors; the *whole* map is optimized as a batch MAP problem with iSAM2's incremental Bayes-tree updates (GTSAM). Lightweight "one-way" frames (no own depth) feed extra photometric evidence into the latest keyframe and are then marginalized out. Local loops (pose criteria within the last 10 keyframes) and global loops (bag-of-words + tracking verification, reprojection factors only) are closed online.

## Results

- Factor ablation on ScanNet validation scenes (Table I): every factor helps, reprojection mainly trajectory, geometric mainly reconstruction; on scene0084_00 ATE-RMSE drops from 0.131 m (photometric only) to 0.061 m combined and pc110 rises 69.14% → 73.66%.
- Reconstruction (ICL-NUIM + TUM, % of depth within 10% of ground truth, whole estimated trajectory): average 27.10 vs CNN-SLAM 19.77, Laina 14.62, LSD-BS 3.44 (Table II).
- Trajectory (TUM fr1, ATE m): fr1/360 0.142 vs CNN-SLAM 0.500; fr1/rpy 0.047 vs 0.261; beats CodeSLAM on all sequences (fr1/desk 0.119 vs 0.654) and is comparable to non-real-time DeepTAM (fr1/desk 0.078) while running in real time (Table III).
- Timing on a single GTX 1080: tracking ~250 Hz; per-keyframe network pass ~340 ms, of which only 16 ms is the forward pass (rest is the code Jacobian via tf.gradients). Released open source.

## Why it matters for SLAM

DeepFactors is the bridge between the latent-code mapping line (CodeSLAM) and mainstream factor-graph SLAM engineering: it showed learned dense geometry can live inside the same probabilistic back-end as classical constraints rather than in a bespoke optimizer. Practically, it demonstrated that combining direct, feature-based, and learned-prior cues makes dense monocular SLAM both more robust and uncertainty-aware — and its standard-factor-graph design makes adding other sensor modalities straightforward, a design philosophy echoed by later hybrid systems.

## Related

- [CodeSLAM](codeslam.md)
- [SceneCode](scenecode.md)
- [CodeMapping](codemapping.md)
- [CNN-SLAM](../level-03-monocular-slam/cnn-slam.md) — the real-time learned-prior baseline it compares against
- [DeepTAM](deeptam.md) — learned dense tracking/mapping baseline
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
