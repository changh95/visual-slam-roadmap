# ActiveSplat

> Li 2025 · [Paper](https://arxiv.org/abs/2410.21955)

**One-line summary** — An autonomous active-mapping system (RA-L 2025) that couples a dense 3D Gaussian Splatting map with a sparse Voronoi-graph abstraction of the workspace, so the robot itself decides where to go and where to look to maximise reconstruction completeness and fidelity.

## Problem

Rendering-based reconstruction (NeRF, 3DGS) is scene-specific and data-dependent, so it is "highly sensitive to noise and artifacts, which often emerge due to insufficient view coverage" — quality is at the mercy of the capture trajectory. Active mapping flips the problem: a mobile agent reconstructs on the fly, assesses instant map quality, and plans a path to cover the whole environment. This needs a representation that supports both fast realistic rendering (for view-quality assessment) and efficient, safe planning over the workspace — which a dense Gaussian map alone does not provide, and volumetric neural fields (ANM-S) converge too slowly for.

## Method & architecture

A perception-action loop over posed RGB-D input, with three modules that all reuse the same splatting operation:

- **Hybrid map updating**: each Gaussian has color $\mathbf{c}$, center $\boldsymbol{\mu}$, covariance $\Sigma$, opacity $o$, with pixel-wise influence $f_i(\mathbf{u}_k)=o\cdot\exp(-\frac{1}{2}(\mathbf{x}(\mathbf{u}_k)-\boldsymbol{\mu}_i)^{\top}\Sigma^{-1}(\mathbf{x}(\mathbf{u}_k)-\boldsymbol{\mu}_i))$. Color, depth, and *visibility* (accumulated opacity) are all rendered by front-to-back blending:

$$\hat{C}_k=\sum_{i=1}^{n_k}\mathbf{c}_i f_i(\mathbf{u}_k)\prod_{j=1}^{i-1}(1-f_j(\mathbf{u}_k)), \qquad \hat{O}_k=\sum_{i=1}^{n_k}f_i(\mathbf{u}_k)\prod_{j=1}^{i-1}(1-f_j(\mathbf{u}_k))$$

Optimization follows SplaTAM's losses, $L=w_c L_{pho}+w_d L_{geo}$ with $L_{pho}=\lambda_1|C_k-\hat{C}_k|+\lambda_2(1-\mathrm{SSIM}(C_k,\hat{C}_k))$, $L_{geo}=|D_k-\hat{D}_k|$ ($\lambda_1{=}0.8, \lambda_2{=}0.2, w_c{=}0.5, w_d{=}1.0$). New Gaussians are spawned where accumulated opacity falls below $\tau_{o1}=0.98$ or depth deviates beyond $\epsilon_{\mathrm{MDE}}$ (50x the median depth error).
- **Workspace abstraction**: a top-down orthographic render of the Gaussian map (large focal length) yields occupancy; navigable ground area minus obstacles gives the workspace, from which a Voronoi graph $\mathcal{G}=\{\mathcal{V},\mathcal{E}\}$ is tessellated — edges equidistant from obstacles, so paths along it are inherently safe.
- **Decoupled viewpoint selection**: position candidates are only Voronoi nodes; rotation is chosen per node by rendering a $360\times150$ panorama of visibility from three virtual cameras and clustering low-visibility regions with DBSCAN (cluster centers give yaw/pitch). Because 2D invisible-pixel area over-/under-states true unseen volume, contour pixels are back-projected and a convex hull approximates the missing 3D volume; a high-loss sample set is also maintained where opacity is confident ($\tau_{o2}=0.8$) but rendered depth disagrees with observation ($\epsilon_1=0.3$). The node score is

$$S_i = w_o\, s_o(i) + w_c\, s_c(i) + w_u\, s_u(i) + w_h\, s_h(i)$$

with $w_o{=}20$, $w_c{=}w_u{=}w_h{=}10$: $s_o,s_c$ are the 2D invisible-area and 3D convex-hull portions, $s_u,s_h$ boolean unvisited/in-horizon flags. Dijkstra plans the shortest path to the chosen node.
- **Hierarchical planning**: the Voronoi graph is dynamically partitioned into subregions via agglomerative clustering (UPGMA) over Euclidean + travel distances; the agent exhausts the local subregion before jumping to the next-best global one — avoiding the repetitive trajectories of greedy scoring in multi-room scenes.
- **Post-processing**: since Gaussians keep a consistent parameter space, stored keyframes allow offline refinement with 3DGS/2DGS density control plus depth/normal regularization.

## Results

Habitat simulator on Gibson and Matterport3D (13 single-floor scenes; 1000 steps for small, 2000 for medium scenes), RTX 3090, averaged over 5 trials:

- **Coverage** (completion ratio % / completion error cm): Gibson **92.24 / 2.43**, MP3D **92.48 / 2.84** — beating ANM-S (92.10/2.83, 89.74/4.14), NARUTO (79.16/3.52, 84.90/5.94), ANM (80.45/7.44), UPEN and frontier-based FBE (68.30/14.42, 74.30/9.29).
- **Rendering vs ANM-S** (test views, post-processed): e.g. Gibson-Eudora PSNR 27.82 vs 24.55, Depth L1 1.63 vs 5.34 cm; Gibson-Ribera 30.86 vs 26.51, 1.85 vs 13.90 cm.
- **Ablations**: Random node traversal 84.20% (Gibson) → position-only greedy 90.41 → decoupled viewpoint 91.76 → full with hierarchical planning **92.24**; visibility-only or convex-hull-only scoring both underperform the combination. Post-processing with 2DGS + depth loss improves test-view Depth L1 from 9.01 to 7.56 cm and PSNR from 21.72 to 27.58 on Gibson-Denmark; without depth loss geometry deteriorates (overfitting).
- **Runtime**: ~8 fps headless; mapper 45.14 ms and workspace extraction 43.87 ms per step dominate, planning itself is sub-millisecond.
- **Real world**: deployed on an Agile-X Ranger Mini with an Azure Kinect, poses from a line-based SLAM system running in a parallel thread.

## Why it matters for SLAM

Most 3DGS-SLAM work (SplaTAM, MonoGS, Photo-SLAM) treats the camera trajectory as given; ActiveSplat closes the loop between mapping and *acting*. Its core insight is architectural: one splatting operation serves map updating, viewpoint scoring, and workspace extraction, while a topological graph keeps planning sparse and safe — a division of labour that makes online active reconstruction tractable. It is representative of the shift from passive SLAM toward embodied, exploration-driven reconstruction for inspection, digital twins, and sim-data capture.

## Related

- [SplaTAM](splatam.md)
- [MonoGS](monogs.md)
- [Online 3DGS Modeling](online-3dgs-modeling.md)
- [OpenGS-SLAM](opengs-slam.md)
