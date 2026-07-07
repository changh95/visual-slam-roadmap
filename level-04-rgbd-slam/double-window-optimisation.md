# Double Window Optimisation

> Strasdat 2011 · [Paper](https://ieeexplore.ieee.org/document/6126517)

**One-line summary** — A hierarchical backend that couples full bundle adjustment in a small inner window with a soft pose-graph periphery in an outer window, achieving constant-time visual SLAM while preserving local BA accuracy.

## Problem

Full bundle adjustment has linear-to-cubic complexity in the number of keyframes, making it infeasible for long-duration SLAM. Sliding-window/active-window BA keeps cost constant but fixes boundary keyframes as hard constraints, which hampers convergence under loopy motion; pure pose-graph optimization is lossy; relative bundle adjustment does not enforce metric consistency in loopy local areas. What was missing was a single backend that handles both accurate loopy local browsing and rapid large-scale exploration in constant time.

## Method & architecture

**SLAM graph.** Keyframe vertices $\mathcal{V}$ (absolute poses $T_i$), 3D points $\mathcal{P}$, and edges $\mathcal{E}$ where each edge $E_{ij}$ carries a **covisibility weight** $w_{ij}$ = number of points visible in both frames. Starting from the current reference keyframe $V_{\text{ref}}$, a uniform-cost search over covisibility (highest $w_{ij}$ first) selects the first $M_1$ keyframes as the **inner window** $W_1$ and the next $M_2$ as the **outer window** $W_2$, with $M_1 \ll M_2$.

**One joint cost, two constraint types.** All points seen from the inner window enter as point-pose (reprojection) constraints; all outer-window frames are tied to their covisible neighbours by pose-pose constraints, and both are minimized *simultaneously*:

$$\chi^2 = \sum_{z_{ik}} \big(z_{ik} - \hat{z}(T_i, \mathbf{x}_k)\big)^2 + \sum_{T_{ji}} \upsilon_{ji}^{\top} \Lambda_{T_{ji}} \upsilon_{ji}, \qquad \upsilon_{ji} := \log_{\mathrm{SE}(3)}\!\big(T_{ji} \cdot T_i \cdot T_j^{-1}\big)$$

where $z_{ik}$ is the observation of point $\mathbf{x}_k$ in frame $i$ and $T_{ji}$ the stored relative pose of a marginalized edge. Instead of proper marginalization, the precision matrix is deliberately approximated by a cheap covisibility-weighted diagonal,

$$\Lambda_{T_{ji}} = w_{ij} \begin{pmatrix} \lambda^2_{\text{trans}} I_{3\times3} & O \\ O & \lambda^2_{\text{rot}} I_{3\times3} \end{pmatrix}$$

— the authors report they could not reproduce significantly better results with proper marginalization, crediting the densely interconnected covisibility structure. The pose-graph periphery acts as *soft* constraints stabilizing the BA core, in contrast to fixed (hard) boundary keyframes. Optimization uses g2o with Levenberg-Marquardt damping absorbing the gauge freedom (no frame is fixed); poses re-entering the window are re-initialized along relative-pose paths $T_j = \pi_{ja} \cdot T_{\text{ref}}$ followed by structure-only iterations.

**Monocular scale handling.** Poses live in $\mathrm{Sim}(3)$ (rotation, translation, scale $s$) rather than $\mathrm{SE}(3)$; new keyframes get $s = 1$, and a scale $s \neq 1$ enters only at appearance-based loop closures, where 3-point RANSAC on 3D-3D correspondences recovers the similarity transform — correcting scale drift in constant time.

**Loop closures.** *Metric* loop closures are found by matching points visible in a larger neighbourhood $\mathcal{N}_2$ but not the immediate neighbourhood $\mathcal{N}_1$; if $\geq \theta$ points (typically 15-30) co-align, a marginalized edge with constraint $T_{\text{ref},i} = T_{\text{loop}} \cdot T_i^{-1}$ is added. *Large-scale* loop closures come from appearance-based detection verified by 3-point RANSAC, with matched 3D point pairs merged.

## Results

In Monte-Carlo spiral simulations (500 keyframes, stereo model: focal 300, 5 cm baseline, 640x480, 1-pixel Gaussian noise, 10 trials, g2o on one core of an Intel i7 960), constant-time cDWO (inner window 15, outer 50) reaches the same accuracy as full BA within the inner window while its cost stays flat; gDWO (outer window covering all 485 remaining frames) stabilizes close to BA globally. A variant with the outer window *fixed* during optimization is clearly inferior, validating soft constraints. In a monocular double-loop simulation (inner 30, outer 100), an average scale drift of 1% is detected and corrected at loop closure in constant time. Real experiments: stereo SLAM (BRIEF + FAST front-end) on the New College dataset runs near real-time at 5-7 FPS with large-scale loop closure; a modified-PTAM monocular system runs at 17 FPS in a single thread, detecting a 6% scale change at loop closure; RGB-D (PrimeSensor) demos include loopy office browsing, wheeled-robot mapping, and dense object model building.

## Why it matters for SLAM

This paper supplied the backend blueprint that keyframe SLAM still follows: bundle adjustment where accuracy matters, a covisibility-weighted pose graph where scale matters, combined in one optimization. ORB-SLAM's local-BA/essential-graph split and its covisibility graph are direct descendants, and its $\mathrm{Sim}(3)$ loop closing adopts the scale-drift treatment demonstrated here in constant time. Read it to understand *why* modern backends are structured the way they are.

## Related

- [Covisibility graph](../level-03-monocular-slam/covisibility-graph.md) — the graph structure driving window selection
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the outer-window machinery
- [Marginalization](../level-02-getting-familiar/marginalization.md) — what the diagonal precision approximation replaces
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md) — the system that popularized this backend design
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md) — companion analysis by the same author
