# ElasticFusion

> Whelan 2015 · [Paper](https://ieeexplore.ieee.org/document/7274882)

**One-line summary** — A surfel-based dense RGB-D SLAM system that achieves globally consistent reconstruction without a pose graph by applying non-rigid elastic deformations directly to the map at loop closure.

## Problem

Dense SLAM systems struggled with motion that is both extended and loopy — a person "painting" a room with a handheld depth camera. KinectFusion's fixed volume restricts scene size; Whelan's earlier Kintinuous scales to corridors via pose-graph deformation but performs poorly on locally loopy trajectories and cannot re-use revisited map areas; DVO-SLAM optimizes keyframe poses but builds no explicit continuous surface. ElasticFusion inverts the priority: instead of optimizing a camera trajectory (pose graph) and rebuilding the map, optimize the *map* itself — apply surface loop closures early and often so the system always stays near the mode of the map distribution.

## Method & architecture

Per-frame loop: RGB-D input → splatted surfel prediction → frame-to-model ICP+RGB tracking → surfel fusion → local (model-to-model) loop check → global (fern) loop check → non-rigid deformation. CUDA does tracking reductions and map management; OpenGL does view prediction.

- **Fused surfel map**: an unordered list $\mathcal{M}$ of surfels with position $\mathbf{p}\in\mathbb{R}^3$, normal $\mathbf{n}$, colour $\mathbf{c}$, weight $w$, radius $r$, initialisation timestamp $t_0$ and last-updated timestamp $t$. A time window $\delta_t$ splits $\mathcal{M}$ into **active** surfels $\Theta$ (recently observed; used for tracking and fusion) and **inactive** surfels $\Psi$ (not used until a loop reactivates them).
- **Joint frame-to-model tracking**: each frame is registered against a splatted rendering of the active model — depth *and* full colour. The geometric term is point-to-plane ICP between the live depth map and the predicted depth,

$$E_{\mathrm{icp}} = \sum_{k} \Big( \big(\mathbf{v}^k - \exp(\hat{\boldsymbol{\xi}})\,\mathbf{T}\,\mathbf{v}_t^k\big)\cdot\mathbf{n}^k \Big)^2 ,$$

  and the photometric term $E_{\mathrm{rgb}}$ penalizes intensity differences between the live colour image and the predicted active-model colour. The joint cost $E_{\mathrm{track}} = E_{\mathrm{icp}} + w_{\mathrm{rgb}} E_{\mathrm{rgb}}$ with $w_{\mathrm{rgb}} = 0.1$ is minimized by Gauss-Newton over a three-level coarse-to-fine pyramid (GPU tree reduction builds the 6×6 system, CPU Cholesky solves it).
- **Deformation graph, sampled and connected in time**: each frame a fresh graph $\mathcal{G}$ of nodes (position $\mathcal{G}^n_{\mathbf{g}}$, transform $\mathcal{G}^n_{\mathbf{R}}, \mathcal{G}^n_{\mathbf{t}}$, timestamp) is sampled from the surfels; connectivity follows initialisation-time order (k = 4 neighbours), which prevents temporally uncorrelated passes over the same surface from influencing each other. A surfel is deformed by its influencing nodes:

$$\hat{\mathcal{M}}^s_{\mathbf{p}} = \sum_{n\in I} w^n \big[ \mathcal{G}^n_{\mathbf{R}} (\mathcal{M}^s_{\mathbf{p}} - \mathcal{G}^n_{\mathbf{g}}) + \mathcal{G}^n_{\mathbf{g}} + \mathcal{G}^n_{\mathbf{t}} \big], \qquad w^n = \big(1 - \lVert \mathcal{M}^s_{\mathbf{p}} - \mathcal{G}^n_{\mathbf{g}} \rVert_2 / d_{\max} \big)^2 .$$

- **Deformation optimisation**: given surface correspondences $\mathcal{Q}$ (source point, destination point, timestamps), the graph parameters minimize $E_{\mathrm{def}} = w_{\mathrm{rot}} E_{\mathrm{rot}} + w_{\mathrm{reg}} E_{\mathrm{reg}} + w_{\mathrm{con}} E_{\mathrm{con}} + w_{\mathrm{con}} E_{\mathrm{pin}}$ with $w_{\mathrm{rot}}{=}1, w_{\mathrm{reg}}{=}10, w_{\mathrm{con}}{=}100$: a rigidity term $E_{\mathrm{rot}} = \sum_l \lVert \mathcal{G}^{l\top}_{\mathbf{R}}\mathcal{G}^{l}_{\mathbf{R}} - \mathbf{I} \rVert_F^2$, an embedded-deformation smoothness term $E_{\mathrm{reg}}$ over graph edges, a constraint term $E_{\mathrm{con}} = \sum_p \lVert \phi(\mathcal{Q}^p_{\mathbf{s}}) - \mathcal{Q}^p_{\mathbf{d}} \rVert_2^2$, and a pin term that anchors the inactive area so the active model deforms *into* the inactive coordinate frame. Solved with Gauss-Newton and sparse Cholesky on the CPU, then applied to all surfels on the GPU.
- **Local loop closure**: every frame (when no global loop fired), predicted renderings of the active and inactive model from the current pose are registered with the same ICP+RGB method; the registration is accepted only if the residual is small, inliers sufficient, and the eigenvalues of the Hessian-derived covariance stay below a threshold. Accepted constraints deform the map and reactivate the matched inactive surfels — many small loops are closed continuously.
- **Global loop closure**: a randomized fern encoding database (on 80×60 downsampled *predicted* views rather than raw frames) detects revisits after arbitrary drift; matched views are registered, checked (including on $E_{\mathrm{con}}$ after optimisation), and applied as a whole-map deformation — no pose graph, no trajectory bookkeeping.

## Results

- **Trajectory (TUM RGB-D, ATE RMSE)**: fr1/desk 0.020 m, fr2/xyz 0.011 m, fr3/office 0.017 m, fr3/nst 0.016 m — on par with or better than DVO SLAM (0.021/0.018/0.035/0.018), RGB-D SLAM (0.023/0.008/0.032/0.017), MRSMap (0.043/0.020/0.042/2.018) and Kintinuous (0.037/0.029/0.030/0.031).
- **Surface reconstruction (ICL-NUIM synthetic living room)**: mean distance to ground-truth model of 0.007 / 0.007 / 0.008 / 0.028 m on kt0-kt3 — superior to all compared systems (e.g. Kintinuous 0.011/0.008/0.009/0.150 m); trajectory ATE 0.009/0.009/0.014/0.106 m. Ablation on kt3: local loops only 0.099 m surface error, global loops only 0.103 m — both needed.
- **Scale and speed**: comprehensive room scans of over 4.5 million surfels captured in real time; the Hotel sequence runs 7725 frames to 4.1M surfels with 328 graph nodes, 11 local and 1 global loop closures. Average frame time 31 ms, peaking at 45 ms (worst-case ≈22 Hz) on an Intel Core i7-4930K with an NVIDIA GTX 780 Ti.

## Why it matters for SLAM

ElasticFusion made "the map is the state" a viable design: instead of correcting a camera trajectory and re-integrating measurements, it corrects the dense surface itself, staying close to the mode of the map distribution through frequent small deformations. It became the standard surfel-based dense SLAM backbone — SemanticFusion adds CNN semantics directly on its surfels — and its active/inactive model split, model-to-model local loops, and fern relocalisation recur throughout later dense systems. Study it for high-quality room-scale dense reconstruction with online loop closure.

## Related

- [KinectFusion](kinectfusion.md)
- [Kintinuous](kintinuous.md)
- [SemanticFusion](semanticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [BundleFusion](bundlefusion.md)
