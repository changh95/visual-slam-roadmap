# LSD-SLAM

> Engel 2014 · [Paper](https://cvg.cit.tum.de/research/vslam/lsdslam)

**One-line summary** — The first large-scale direct monocular SLAM: semi-dense probabilistic depth maps tracked by photometric error minimisation on a CPU, with scale-drift-aware $\mathrm{Sim}(3)$ keyframe alignment and pose-graph loop closure.

## Problem

By 2014 the two existing options for monocular SLAM each had a hard limitation. Feature-based systems (PTAM lineage) were accurate but discarded everything except keypoints — "information contained in straight or curved edges … is discarded." Direct dense methods (DTAM, variational VO) used all image data but were "computationally demanding and require a state-of-the-art GPU," and all existing direct methods were pure odometries with no global map or loop closure. On top of that, any monocular system drifts in *scale* over long trajectories, which a 6-DoF pose graph cannot represent. LSD-SLAM (Engel, Schöps, Cremers, ECCV 2014) targets all three: direct, large-scale-consistent, CPU real-time.

## Method & architecture

Three components run concurrently (Fig. 3 of the paper): **tracking**, **depth map estimation**, and **map optimization**.

- **Tracking (direct $\mathfrak{se}(3)$ alignment)**: each new frame $I_j$ is aligned to the current keyframe $K_i = (I_i, D_i, V_i)$ — image, semi-dense inverse depth map, and inverse depth *variance* — by minimising the variance-normalised photometric error over all pixels with valid depth:

$$E_p(\boldsymbol{\xi}_{ji}) = \sum_{\mathbf{p}\in\Omega_{D_i}} \left\| \frac{r_p^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}^{2}} \right\|_{\delta}, \qquad r_p := I_i(\mathbf{p}) - I_j\big(\omega(\mathbf{p}, D_i(\mathbf{p}), \boldsymbol{\xi}_{ji})\big),$$

$$\sigma_{r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}^{2} := 2\sigma_I^2 + \left(\frac{\partial r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}{\partial D_i(\mathbf{p})}\right)^{2} V_i(\mathbf{p}),$$

  where $\omega$ is the projective warp, $\|\cdot\|_\delta$ the Huber norm, and $\sigma_I^2$ image noise. Propagating each pixel's depth variance into the residual is the paper's second key novelty: pixels with uncertain depth are automatically down-weighted. Minimisation is iteratively re-weighted Gauss–Newton on the Lie manifold.
- **Depth map estimation**: tracked frames refine the keyframe by many per-pixel small-baseline stereo comparisons, probabilistically filtered into $D_i, V_i$ (following Engel 2013); depth exists only where image gradient is sufficient — *semi-dense*. When the camera moves too far ($\mathrm{dist}(\boldsymbol{\xi}_{ji}) = \boldsymbol{\xi}_{ji}^T \mathbf{W} \boldsymbol{\xi}_{ji}$ exceeds a threshold), a new keyframe is created by projecting the old depth map into it, and each keyframe is rescaled so its mean inverse depth is one.
- **$\mathfrak{sim}(3)$ keyframe alignment (key novelty 1)**: because keyframes are scale-normalised, edges between them are 7-DoF similarity transforms. Direct alignment on $\mathfrak{sim}(3)$ adds a depth residual — required since photometric error alone cannot observe scale:

$$E(\boldsymbol{\xi}_{ji}) := \sum_{\mathbf{p}\in\Omega_{D_i}} \left\| \frac{r_p^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_p}^{2}} + \frac{r_d^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_d}^{2}} \right\|_{\delta}, \qquad r_d := [\mathbf{p}']_3 - D_j\big([\mathbf{p}']_{1,2}\big),$$

  with $\mathbf{p}' = \omega_s(\mathbf{p}, D_i(\mathbf{p}), \boldsymbol{\xi}_{ji})$. Loop candidates are the ten closest keyframes plus an appearance-based (FAB-MAP) proposal; each is verified by a reciprocal tracking check that both directions $\boldsymbol{\xi}_{jk i}$ and $\boldsymbol{\xi}_{i jk}$ agree statistically. ESM and a coarse-to-fine pyramid starting at 20×15 pixels enlarge the convergence radius.
- **Map optimization**: the keyframe pose graph with $\mathrm{Sim}(3)$ constraints is continuously optimised in the background (g2o):

$$E(\boldsymbol{\xi}_{W1} \dots \boldsymbol{\xi}_{Wn}) := \sum_{(\boldsymbol{\xi}_{ji}, \Sigma_{ji}) \in \mathcal{E}} \big(\boldsymbol{\xi}_{ji} \circ \boldsymbol{\xi}_{Wi}^{-1} \circ \boldsymbol{\xi}_{Wj}\big)^T \Sigma_{ji}^{-1} \big(\boldsymbol{\xi}_{ji} \circ \boldsymbol{\xi}_{Wi}^{-1} \circ \boldsymbol{\xi}_{Wj}\big).$$

## Results

- **TUM RGB-D benchmark** (absolute trajectory RMSE in cm; monocular, bootstrapped with the first depth map for scale): fr2/desk **4.52** (116 keyframes) vs 13.50 for semi-dense mono-VO, tracking failure for keypoint-based mono-SLAM (PTAM), and 1.77 / 9.5 for the two RGB-D systems that use sensor depth; fr2/xyz **1.47** vs 3.79 (semi-dense VO) and 24.28 (PTAM). Simulated sequences: sim/desk 0.04, sim/slowmo 0.35.
- **Large-scale**: a roughly 500 m, 6-minute hand-held outdoor trajectory is closed correctly, and a sequence spanning average inverse depths from under 20 cm to over 10 m is mapped consistently — before the loop closure parts of the scene existed twice at different scales, after it they align.
- Runs in real time on a CPU (640×480 at 30 Hz); the odometry core had been shown to run on a smartphone. ESM and extra pyramid levels increase the $\mathfrak{sim}(3)$ convergence radius but not the converged accuracy.

## Why it matters for SLAM

LSD-SLAM proved that direct methods could be a serious, scalable alternative to feature-based SLAM: more of the image used, richer semi-dense maps, robustness where corners are scarce. Its two exports — variance-normalised photometric alignment as the tracking primitive, and $\mathrm{Sim}(3)$ pose graphs for monocular scale drift — are now standard vocabulary (ORB-SLAM adopted the $\mathrm{Sim}(3)$ essential-graph idea for loop closing). It directly seeded DSO (same group, replacing the pose graph with windowed photometric BA) and CNN-SLAM (learned depth on the LSD-SLAM skeleton).

## Related

- [DTAM](dtam.md)
- [DSO](dso.md)
- [CNN-SLAM](cnn-slam.md)
- [Scale ambiguity](scale-ambiguity.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [LDSO](ldso.md)
