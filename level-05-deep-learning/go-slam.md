# GO-SLAM

> Zhang 2023 · [Paper](https://arxiv.org/abs/2309.02436)

**One-line summary** — Brought online loop closing and full bundle adjustment to neural implicit SLAM: DROID-SLAM-style learned tracking with a global keyframe graph, plus an Instant-NGP SDF map that is re-fitted on the fly as poses are globally corrected.

## Problem

Neural implicit SLAM had shown compelling dense results, but iMAP/NICE-SLAM-generation systems optimise only locally: "due to the lack of global online optimization, such as loop closure (LC) and global bundle adjustment (BA), camera drift error accumulates as the number of processed frames grows, and the 3D reconstruction quickly collapses". Even NeRF-SLAM, which shares the DROID-SLAM frontend, "lacks online loop closing and full BA". GO-SLAM's goal is a deep-learning dense SLAM framework that globally optimises poses and reconstruction together, in real time — and re-fits the neural map after every correction, so the trajectory and the surface never diverge.

## Method & architecture

**Front-end tracking + loop closing.** A RAFT-based recurrent update operator computes optical flow against the last keyframe; a new keyframe is created when mean flow exceeds $\tau_{flow}$. A keyframe graph $(\mathcal{V},\mathcal{E})$ is built from a co-visibility matrix ($N_{local} \times N_{KF}$), where co-visibility is the mean rigid flow between keyframe pairs (pairs with flow above $\tau_{co}=25$ are dropped). Loop edges are sampled from the historical part of the matrix in descending co-visibility, with neighbour suppression of radius $r_{loop}=N_{local}/2$; a loop is accepted only after three consecutive candidates validate. Edges are capped at $s_{edge}\cdot N_{local}$ for real-time optimisation. All edges feed DROID-SLAM's differentiable dense bundle adjustment layer, minimised by damped Gauss-Newton over poses $\mathbf{G} \in SE(3)$ and per-pixel inverse depths $\mathbf{d}$:

$$\mathbf{E}(\mathbf{G},\mathbf{d})=\sum_{(i,j)\in\mathcal{E}}\bigl\lVert\mathbf{p}_{ij}^{*}-\Pi_{c}\bigl(\mathbf{G}_{ij}\circ\Pi_{c}^{-1}(\mathbf{p}_{i},\mathbf{d}_{i})\bigr)\bigr\rVert_{\Sigma_{ij}}^{2}, \qquad \Sigma_{ij}=\operatorname{diag}\,\mathbf{w}_{ij},$$

with $\mathbf{p}^*_{ij}$ the predicted flow, $\mathbf{w}_{ij}$ its confidence, and $\Pi_c$/$\Pi_c^{-1}$ projection/back-projection.

**Back-end full BA** runs in a separate thread over the *complete* keyframe history (its own graph of high-co-visibility plus temporally adjacent pairs, redundancy-suppressed with radius $r_{global}$), staying efficient "up to tens of thousands of input frames" because loop closing has already removed most of the error.

**Instant mapping.** The mapping thread snapshots all keyframe poses/depths, then selects keyframes to update: always the latest two and any never-mapped ones, the top 10 by pose change since their last mapping, and 10 stratified-sampled ones against forgetting. Each 3D sample $\mathbf{x}$ gets a multi-resolution hash encoding (Instant-NGP); a one-layer SDF MLP predicts $\Phi(\mathbf{x}), \mathbf{g} = f_{\Theta_{sdf}}(\mathbf{x}, h_{\Theta_{hash}}(\mathbf{x}))$ and a two-layer colour MLP predicts $\Omega(\mathbf{x}) = f_{\Theta_{color}}(\mathbf{x}, \mathbf{n}, \mathbf{g})$ from the SDF gradient $\mathbf{n}$. Rendering is NeuS-style unbiased volume rendering with weights $w_i = \alpha_i \prod_{j=1}^{i-1}(1-\alpha_j)$, where

$$\alpha_{i}=\max\left(\frac{\sigma(\Phi(\mathbf{x}_{i}))-\sigma(\Phi(\mathbf{x}_{i+1}))}{\sigma(\Phi(\mathbf{x}_{i}))},\,0\right), \qquad \hat{\mathbf{c}}=\sum_{i=1}^{N_{ray}}w_{i}\,\Omega(\mathbf{x}_{i}), \quad \hat{\mathbf{D}}=\sum_{i=1}^{N_{ray}}w_{i}\,D_{i}^{ray}.$$

Training minimises $\mathcal{L}=\lambda_{c}\mathcal{L}_{c}+\lambda_{dep}\mathcal{L}_{dep}+\lambda_{eik}\mathcal{L}_{eik}+\lambda_{sdf}\mathcal{L}_{sdf}$ (weights 1.0, 1.0, 0.1, 1.0): an L1 colour loss; a depth loss down-weighted by rendered depth variance, $\mathcal{L}_{dep}=\frac{1}{M}\sum_{m}\lvert\mathbf{D}_{m}-\hat{\mathbf{D}}_{m}\rvert/\sqrt{\hat{\mathbf{D}}_{m}^{var}}$; an Eikonal term; and an SDF loss using $\mathbf{b}(\mathbf{x}_i)=\mathbf{D}_m - D^{ray}_{m,i}$ as pseudo ground truth — $\mathcal{L}_{near}=\lvert\Phi(\mathbf{x}_{i})-\mathbf{b}(\mathbf{x}_{i})\rvert$ within the 16 cm truncation band, and in free space the relaxed $\mathcal{L}_{free}=\max(e^{-\beta\Phi(\mathbf{x}_{i})}-1,\ \Phi(\mathbf{x}_{i})-\mathbf{b}(\mathbf{x}_{i}),\ 0)$ with $\beta=5$. Mapping uses the globally optimised poses/depths *without* further refinement. The same framework runs monocular ($N_{local}=50$), stereo, and RGB-D ($N_{local}=25$); meshes come from marching cubes on the SDF.

## Results

- **ScanNet** (long real sequences, avg ATE RMSE over 8 scenes): monocular 17.59 cm vs DROID-SLAM 52.60, DROID-SLAM (VO) 63.61, ORB-SLAM3 119.74; RGB-D 7.02 cm vs DROID-SLAM 7.15 and NICE-SLAM 13.05.
- **Ablation** (ScanNet): baseline without LC/full BA 11.59 cm at 30 FPS; +LC 8.83 at 20 FPS; +full BA 7.11 at 12 FPS; both 7.02 cm at 10 FPS — LC removes most drift almost for free.
- **Replica** (avg 8 scenes): RGB-D — ATE 0.34 cm, depth L1 3.38 cm, Completion Ratio 88.09%, at 8 FPS, vs NICE-SLAM (ATE 1.95, L1 3.53, well below 1 FPS); monocular — ATE 0.39 cm, depth L1 4.39 cm vs concurrent NeRF-SLAM's 4.49 and NICER-SLAM's ATE 1.88.
- **TUM RGB-D** (RGB-D mode): 0.015 / 0.006 / 0.013 m ATE across the freiburg1/2/3 sets vs NICE-SLAM's 0.027 / 0.018 / 0.030; on EuRoC stereo it is comparable to state-of-the-art stereo SLAM while also delivering dense consistent reconstruction.
- Hardware: RTX 3090, ~15.6 GB GPU on Replica RGB-D (max 18 GB), 8 FPS; skipping frames to run 2-8x faster degrades F-score and ATE only minimally.

## Why it matters for SLAM

GO-SLAM addressed the most glaring gap between neural-rendering SLAM and mature systems like ORB-SLAM: global consistency. The ScanNet monocular numbers (17.59 vs 52.60 cm) show how catastrophic missing loop closure is on long trajectories, and the on-the-fly map refit demonstrated that a neural map need not be frozen after pose corrections. Its DROID-SLAM-frontend + neural-map-backend pattern (shared with NeRF-SLAM, plus the global optimisation NeRF-SLAM lacked) became a standard recipe for globally consistent dense neural SLAM, and monocular/stereo/RGB-D support makes it one of the more deployable NeRF-based systems.

## Related

- [DROID-SLAM](droid-slam.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [Co-SLAM](co-slam.md)
- [iMAP](imap.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
