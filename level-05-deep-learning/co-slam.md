# Co-SLAM

> Wang 2023 · [Paper](https://arxiv.org/abs/2304.14377)

**One-line summary** — Combined Instant-NGP-style multi-resolution hash grids with smooth one-blob coordinate encoding for neural SLAM, running at 10-17 Hz — far faster than NICE-SLAM — while keeping coherent surfaces.

## Problem

Coordinate-encoding MLPs carry coherence and smoothness priors that give high-fidelity, hole-filling reconstruction, but "suffer from slow convergence and catastrophic forgetting" when optimised sequentially; parametric encodings (feature grids) are fast but "fall short of hole filling and smoothness". NICE-SLAM was scalable but far from real-time, and its local grids cannot complete unobserved regions. Co-SLAM ("Joint Coordinate and Sparse Parametric Encodings for Neural Real-Time SLAM") asks for both properties at once in a single real-time RGB-D SLAM system.

## Method & architecture

Given an RGB-D stream with known intrinsics, Co-SLAM jointly optimises camera poses $\{\xi_t\}$ and a neural field $f_\theta(\mathbf{x})\mapsto(\mathbf{c},s)$ mapping world coordinates to colour and truncated signed distance (TSDF). The **joint encoding** concatenates a smooth One-blob coordinate encoding $\gamma(\mathbf{x})$ with features from an Instant-NGP multi-resolution hash grid $\mathcal{V}_\alpha$ (levels spanning $R_{min}$ to $R_{max}$, tri-linearly interpolated). Two tiny MLPs decode:

$$f_\tau(\gamma(\mathbf{x}),\mathcal{V}_\alpha(\mathbf{x}))\mapsto(\mathbf{h},s),\qquad f_\phi(\gamma(\mathbf{x}),\mathbf{h})\mapsto\mathbf{c},$$

with learnable parameters $\theta=\{\alpha,\phi,\tau\}$ — "fast convergence, efficient memory use, and hole filling needed for online SLAM". Colour and depth are rendered along rays $\mathbf{x}_i=\mathbf{o}+d_i\mathbf{r}$ as normalised weighted sums $\hat{\mathbf{c}}=\tfrac{1}{\sum_i w_i}\sum_i w_i\mathbf{c}_i$, $\hat{d}=\tfrac{1}{\sum_i w_i}\sum_i w_i d_i$, with a simple bell-shaped SDF-to-weight conversion

$$w_i=\sigma\!\left(\frac{s_i}{tr}\right)\sigma\!\left(-\frac{s_i}{tr}\right),$$

where $tr$ is the truncation distance (10 cm) and $\sigma$ the sigmoid. Sampling is depth-guided: $M_c$ uniform samples plus $M_f$ near-surface samples around the measured depth.

**Losses**: $\ell_2$ colour/depth rendering losses; an approximate SDF loss inside the truncation region, $\mathcal{L}_{sdf}$ pulling predictions toward $D[u,v]-d$; a free-space loss forcing $s_p=tr$ far from surfaces; and a smoothness regulariser on feature-metric differences of adjacent hash-grid vertices, $\mathcal{L}_{smooth}=\tfrac{1}{|\mathcal{G}|}\sum_{\mathbf{x}\in\mathcal{G}}\Delta_x^2+\Delta_y^2+\Delta_z^2$, computed on small random regions to suppress hash-collision noise in unobserved space.

**Tracking** initialises each frame with a constant-speed motion model $\mathbf{T}_t=\mathbf{T}_{t-1}\mathbf{T}_{t-2}^{-1}\mathbf{T}_{t-1}$, then optimises $\xi_t$ over $N_t$ sampled pixels. **Global bundle adjustment** is the second key idea: instead of storing full keyframe images and selecting ~10 of them (iMAP/NICE-SLAM), Co-SLAM stores only ~5% of pixels per keyframe, inserts keyframes frequently (every 5th frame), and samples $N_g$ rays from the *entire* keyframe database to jointly optimise the map and all poses, alternating $k_m$ map steps with pose updates from accumulated gradients.

## Results

- **Replica**: Depth L1 1.51 cm, accuracy 2.10 cm, completion 2.08 cm, completion ratio 93.44% at **17.4 FPS** with 0.26 M parameters — vs NICE-SLAM 1.90 / 2.37 / 2.64 / 91.13% at 0.91 FPS with 17.4 M parameters, and iMAP 4.64 / 3.62 / 4.93 / 80.51%.
- **NeuralRGBD synthetic** (noisy depth, thin structures): Depth L1 3.02 cm vs NICE-SLAM 6.32 and iMAP* 43.91, at 15.6 FPS.
- **ScanNet tracking**: average ATE RMSE 9.37 cm (8.75 with doubled tracking iterations) vs NICE-SLAM 9.63, at 6.4-12.8 FPS vs 0.68.
- **TUM RGB-D**: 2.7 / 1.9 / 2.6 cm on fr1/desk, fr2/xyz, fr3/office (2.4 / 1.7 / 2.4 with more iterations) — best of the neural systems, still behind ORB-SLAM2 (1.6 / 0.4 / 1.0).
- **Ablations**: dropping the one-blob encoding hurts completion (2.13→2.08 cm full model, ratio 93.17→93.44%), dropping the hash grid hurts accuracy (3.69 cm); global BA reaches ATE 8.75±0.33 vs 9.69 for NICE-SLAM-style local BA and 16.81 without BA, at the same total ray budget.

## Why it matters for SLAM

Co-SLAM brought neural implicit SLAM to real-time rates, making the NeRF-SLAM family practical for interactive use, and showed that Instant-NGP's hash grids are viable for online mapping when paired with a smooth coordinate encoding that restores hole filling. Its joint parametric + coordinate encoding and its sparse-pixel global bundle adjustment became influential design patterns in the NICE-SLAM lineage, alongside ESLAM's tri-planes and Point-SLAM's neural point clouds.

## Related

- [NICE-SLAM](nice-slam.md)
- [iMAP](imap.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)
- [NeRF](nerf.md)
