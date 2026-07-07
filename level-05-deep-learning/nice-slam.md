# NICE-SLAM

> Zhu & Peng 2022 · [Paper](https://arxiv.org/abs/2112.12130)

**One-line summary** — Introduced a hierarchical scene representation with multi-level local feature grids (coarse, mid, fine) for scalable neural implicit SLAM, overcoming iMAP's limitations in large scenes.

## Problem

Neural implicit representations had just entered SLAM with iMAP, but "existing methods produce over-smoothed scene reconstructions and have difficulty scaling up to large scenes" — limitations "mainly due to their simple fully-connected network architecture that does not incorporate local information in the observations" (abstract). A single global MLP must be updated globally with every new, potentially partial RGB-D observation, so it forgets old regions when learning new ones. NICE-SLAM (CVPR 2022) fixes this with a representation that stores information *locally* in multi-level feature grids decoded by pre-trained networks.

## Method & architecture

The scene is encoded in **four feature grids**: three geometry grids $\phi^l_\theta$ with frozen MLP decoders $f^l$, $l\in\{0,1,2\}$ for coarse (2 m voxels, extrapolates unobserved geometry), mid (32 cm) and fine (16 cm) levels, plus one colour grid $\psi_\omega$ with decoder $\mathbf{g}_\omega$. A point $\mathbf{p}\in\mathbb{R}^3$ is decoded via tri-linear interpolation; the mid level gives occupancy $o^1_{\mathbf{p}}=f^1(\mathbf{p},\phi^1_\theta(\mathbf{p}))$, the fine level adds a residual conditioned on the mid feature,

$$\Delta o^{1}_{\mathbf{p}}=f^{2}(\mathbf{p},\phi^{1}_{\theta}(\mathbf{p}),\phi^{2}_{\theta}(\mathbf{p})),\qquad o_{\mathbf{p}}=o^{1}_{\mathbf{p}}+\Delta o^{1}_{\mathbf{p}},$$

and colour is $\mathbf{c}_{\mathbf{p}}=\mathbf{g}_\omega(\mathbf{p},\psi_\omega(\mathbf{p}))$. The coarse/mid/fine decoders are **pre-trained as part of ConvONet** and then frozen — only grid features are optimised — which stabilises optimisation and injects learned indoor-geometry priors; the coarse grid can predict occupancy outside observed regions, which keeps tracking alive when much of the view is new.

**Rendering**: along each ray, $N=N_{\text{strat}}+N_{\text{imp}}$ points are sampled (stratified plus samples near the measured depth); ray termination probability at point $\mathbf{p}_i$ is $w_i=o_{\mathbf{p}_i}\prod_{j=1}^{i-1}(1-o_{\mathbf{p}_j})$, and depth/colour render as

$$\hat{D}=\sum_{i=1}^{N}w_i d_i,\qquad \hat{I}=\sum_{i=1}^{N}w_i\mathbf{c}_i,$$

with per-ray depth variance $\hat{D}_{var}=\sum_i w_i(\hat{D}-d_i)^2$ also computed at coarse and fine level.

**Mapping** samples $M$ pixels from the current frame and selected keyframes, then optimises in stages: mid grid only with the $L_1$ depth loss $\mathcal{L}_g$, then mid+fine, then a local bundle adjustment $\min_{\theta,\omega,\{\mathbf{R}_i,\mathbf{t}_i\}}(\mathcal{L}^c_g+\mathcal{L}^f_g+\lambda_p\mathcal{L}_p)$ that also refines the poses of $K$ keyframes ($\mathcal{L}_p$ is an $L_1$ colour loss). **Tracking** runs in parallel, optimising $\{\mathbf{R},\mathbf{t}\}$ of the current frame with $\min(\mathcal{L}_{g\_var}+\lambda_{pt}\mathcal{L}_p)$, where

$$\mathcal{L}_{g\_var}=\frac{1}{M_t}\sum_{m=1}^{M_t}\frac{|D_m-\hat{D}^{c}_m|}{\sqrt{\hat{D}^{c}_{var}}}+\frac{|D_m-\hat{D}^{f}_m|}{\sqrt{\hat{D}^{f}_{var}}}$$

down-weights uncertain regions such as object edges. Pixels whose loss exceeds 10× the frame median are dropped, giving robustness to dynamic objects. Keyframes are selected only among frames with visual overlap of the current view — possible because grid updates are local, so geometry outside the view stays fixed (no catastrophic forgetting by construction). The system runs in three threads: coarse mapping, mid/fine + colour mapping, and tracking.

## Results

Evaluated on five datasets: Replica, ScanNet, TUM RGB-D, Co-Fusion, and a self-captured multi-room apartment.

- **Replica (avg of 8 scenes)**: Depth L1 3.53 cm, accuracy 2.85 cm, completion 3.00 cm, completion ratio 89.33% — vs iMAP* at 7.64 / 6.95 / 5.33 / 66.60% and DI-Fusion at 23.33 / 19.40 / 10.19 / 72.96% — with a 12.02 MB model.
- **ScanNet tracking**: ATE RMSE averaged over 6 scenes 9.63 cm vs 36.67 for iMAP* and 78.89 for DI-Fusion; ablations show local BA and colour loss both matter (w/o local BA: 37.74).
- **TUM RGB-D**: ATE RMSE 2.7 / 1.8 / 3.0 cm on fr1/desk, fr2/xyz, fr3/office — best among implicit methods (iMAP: 4.9 / 2.0 / 5.8), though classical ORB-SLAM2 remains better (1.6 / 0.4 / 1.0).
- **Compute**: 104.16×10³ FLOPs per query point vs 443.91×10³ for iMAP; tracking 47 ms and mapping 130 ms per iteration vs iMAP's 101 / 448 ms.

## Why it matters for SLAM

NICE-SLAM made neural implicit SLAM scalable to room-sized and larger environments, moving the field past iMAP's proof-of-concept stage. Its hierarchical feature-grid design became a standard pattern adopted by follow-ups such as ESLAM (tri-planes), Co-SLAM (hash grids), and Point-SLAM (neural points). Together with iMAP, it cemented the Replica / TUM RGB-D / ScanNet evaluation protocol used by most later neural SLAM papers.

## Related

- [iMAP](imap.md)
- [Co-SLAM](co-slam.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)
- [NICER-SLAM](nicer-slam.md)
- [NeRF](nerf.md)
