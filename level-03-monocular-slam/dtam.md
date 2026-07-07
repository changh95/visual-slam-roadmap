# DTAM

> Newcombe 2011 · [Paper](https://ieeexplore.ieee.org/document/6126513)

**One-line summary** — The first system to perform dense 3D reconstruction and camera tracking from a single monocular camera in real time, by accumulating photometric cost volumes at keyframes, regularised primal-dual depth optimisation, and whole-image alignment against the dense model on a GPU.

## Problem

Prior real-time monocular systems — MonoSLAM and PTAM — produced only sparse point maps: enough to localise a camera, but useless for occlusion-aware AR, obstacle avoidance, or any task that needs surfaces. Dense multi-view reconstruction existed offline, but nobody had run it live against every incoming frame. DTAM ("Dense Tracking and Mapping in Real-Time", Newcombe, Lovegrove, Davison, ICCV 2011) argued that dense methods "make use of all of the data in an image" for both reconstruction and tracking, and that GPGPU parallelism finally made this feasible per-pixel and per-frame.

## Method & architecture

Two tightly interleaved dense processes: given the dense model, track every frame by whole-image alignment; given tracked poses, build and refine dense keyframe depth maps. Once bootstrapped (by a standard point-feature stereo initialiser), "no feature-based skeleton or tracking is required."

- **Cost volume**: each keyframe $r$ stores an average photometric error $C_r(\mathbf{u}, d)$ over inverse-depth samples $d \in [\xi_{\min}, \xi_{\max}]$, accumulated from tens to hundreds of overlapping narrow-baseline frames $m \in \mathcal{I}(r)$:

$$C_r(\mathbf{u},d) = \frac{1}{|\mathcal{I}(r)|}\sum_{m\in\mathcal{I}(r)} \big\| I_r(\mathbf{u}) - I_m\big(\pi(K\, T_{mr}\, \pi^{-1}(\mathbf{u},d))\big) \big\|_1 .$$

  Individual two-view costs have many minima, but the averaged L1 cost has few; occlusions become outliers. The running average is updated as each frame arrives, so images need not be stored.
- **Regularised depth**: the inverse depth map $\xi$ minimises a non-convex energy with a Huber-of-gradient regulariser weighted by image edges, $g(\mathbf{u}) = e^{-\alpha\|\nabla I_r(\mathbf{u})\|_2^{\beta}}$:

$$E_\xi = \int_\Omega \big\{ g(\mathbf{u})\, \|\nabla \xi(\mathbf{u})\|_\epsilon + \lambda\, C(\mathbf{u}, \xi(\mathbf{u})) \big\}\, d\mathbf{u} .$$

- **Primal-dual + exhaustive search**: data and smoothness terms are decoupled through an auxiliary variable $\alpha$ with coupling $\frac{1}{2\theta}(\xi - \alpha)^2$; as $\theta \to 0$ the original energy is recovered. The convex part is solved by a primal-dual (Legendre–Fenchel) scheme, the non-convex data term by per-pixel exhaustive search over the sampled depths — avoiding coarse-to-fine warping that loses small details. A shrinking bound $r^{n+1}_{\mathbf{u}} = \sqrt{2\theta^n \lambda (C^{\max}_{\mathbf{u}} - C^{\min}_{\mathbf{u}})}$ accelerates the search, and a single Newton step on the fitted parabola gives sub-sample depth accuracy (crucial: detailed surfaces even with only $S \le 64$ depth samples).
- **Dense tracking**: the model is projected into a virtual camera to synthesise view $I_v$ with depth $\xi_v$; the live pose is found by Lucas–Kanade style forward-compositional Gauss–Newton over *every* pixel, coarse-to-fine, with a rotation-only alignment first for blur resilience:

$$F(\boldsymbol{\psi}) = \frac{1}{2}\sum_{\mathbf{u}\in\Omega} f_{\mathbf{u}}(\boldsymbol{\psi})^2, \qquad f_{\mathbf{u}}(\boldsymbol{\psi}) = I_l\big(\pi(K\, T_{lv}(\boldsymbol{\psi})\, \pi^{-1}(\mathbf{u}, \xi_v(\mathbf{u})))\big) - I_v(\mathbf{u}),$$

  with $\boldsymbol{\psi} \in \mathbb{R}^6$ in $\mathfrak{se}(3)$. Pixels whose photometric error exceeds a threshold (ramped down over iterations) are discarded, so unmodelled objects such as a waving hand do not corrupt tracking. New keyframes are added when too few pixels of the prediction carry surface information.

## Results

Evaluated live in a desktop setting: Point Grey Flea2 at 30 Hz, 640×480 RGB, running on an NVIDIA GTX 480 GPU with an i7 quad-core CPU. The keyframe depth maps carry nearly $300{\times}10^3$ estimated points versus the ~1000 point features PTAM uses in the same frame. The evaluation is a qualitative comparison against PTAM: on a high-acceleration back-and-forth trajectory close to a cup, PTAM repeatedly lost tracking and resorted to relocalisation while DTAM (its relocaliser deliberately disabled) stayed locked with visibly smoother velocity estimates; DTAM also kept tracking through camera defocus and demonstrated a physics-enhanced AR application with correct occlusion handling. No trajectory-error benchmarks are reported — its legacy is the template (cost volume + regulariser + primal-dual + dense model-based tracking) later inherited by dense and direct SLAM.

## Why it matters for SLAM

Where PTAM produced sparse point maps, DTAM showed a single camera could deliver dense surfaces in real time, opening the door to richer scene understanding, occlusion-aware AR, and obstacle avoidance. It founded the direct/dense line of SLAM research — directly influencing LSD-SLAM, DSO, and (via the same first author) KinectFusion — and established GPU computing as a core tool of dense SLAM. Modern dense systems from ElasticFusion to NeRF- and 3DGS-based SLAM are descendants of its dense-tracking-and-mapping blueprint.

## Related

- [PTAM](ptam.md)
- [LSD-SLAM](lsd-slam.md)
- [DSO](dso.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
- [Frame-to-model tracking](../level-04-rgbd-slam/frame-to-model-tracking.md)
