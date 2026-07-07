# Basalt

> Usenko 2020 · [Paper](https://arxiv.org/abs/1904.06504)

**One-line summary** — Splits visual-inertial estimation into a real-time odometry layer and a mapping layer, and uses non-linear factor recovery (NFR) to convert the VIO's linearized marginalization prior into a small set of nonlinear relative-pose and roll-pitch factors that global bundle adjustment can re-linearize freely.

## Problem

Cameras and IMUs are complementary, but combining them *for globally consistent mapping* is not straightforward: bundle adjustment wants keyframes with large baselines and long time intervals, while "inertial data on the other hand quickly degrades with the duration of the intervals and after several seconds of integration, it typically contains only little useful information." Systems that preintegrate IMU data directly between keyframes must therefore cap the keyframe spacing and drag velocities and biases into the global problem, where sparse keyframes constrain them poorly. Meanwhile sliding-window VIO compresses history into a Schur-complement prior frozen at its linearization point. How do you carry the odometry's accumulated information into global optimization without freezing linearization points or hauling along all raw measurements?

## Method & architecture

**VIO layer (fixed-lag smoother).** FAST corners are extracted in a 50-pixel grid (80–120 active features) and tracked by pyramidal inverse-compositional KLT estimating an $\mathrm{SE}(2)$ patch warp with a locally-scaled SSD norm (intensity-scale invariant); tracking back to the source frame filters outliers. Landmarks are stored relative to their host keyframe as a unit bearing vector in stereographic-projection coordinates $(u,v)$ plus inverse distance $d$, giving the reprojection residual

$$\mathbf{r}_{it} = \mathbf{z}_{it} - \pi_{c(t)}\big(\mathbf{T}_{t}^{-1} \mathbf{T}_{h(i)}\, \mathbf{q}_{i}(u,v,d)\big)$$

which stays numerically stable even at $d = 0$. IMU measurements are preintegrated into pseudo-measurements $(\Delta\mathbf{R}, \Delta\mathbf{v}, \Delta\mathbf{p})$ with recursively propagated covariance and bias Jacobians; e.g. the rotation residual is $\mathbf{r}_{\Delta\mathbf{R}} = \mathrm{Log}(\Delta\tilde{\mathbf{R}}\, \mathbf{R}_{j}^{\top} \mathbf{R}_{i})$. Every frame minimizes

$$E = \sum_{i\in\mathcal{P},\; t\in\mathrm{obs}(i)} \mathbf{r}_{it}^{\top} \boldsymbol{\Sigma}^{-1}_{it} \mathbf{r}_{it} + \sum_{(i,j)\in\mathcal{C}} \mathbf{r}_{ij}^{\top} \boldsymbol{\Sigma}^{-1}_{ij} \mathbf{r}_{ij} + E_{\text{m}}$$

over a window of 7 keyframe poses plus the 3 most recent full states (pose, velocity, biases); older states are removed by Schur-complement partial marginalization ($\mathbf{H}^{\text{m}}_{\alpha\alpha} = \mathbf{H}_{\alpha\alpha} - \mathbf{H}_{\alpha\beta}\mathbf{H}_{\beta\beta}^{-1}\mathbf{H}_{\beta\alpha}$) with first-estimate Jacobians preserving nullspaces.

**Mapping layer with NFR.** When a keyframe leaves the window, Basalt saves the linearization of its Markov blanket, marginalizes everything except keyframe poses, and *recovers* nonlinear factors approximating that dense prior by minimizing the Kullback-Leibler divergence between the original Gaussian $N(\boldsymbol{\mu}_{\text{o}}, \mathbf{H}_{\text{o}}^{-1})$ and the factorized approximation. The recovered residuals are relative pose and roll-pitch (plus position/yaw, dropped as unobservable):

$$\mathbf{r}_{\text{rel}}(\mathbf{s}, \mathbf{z}_{\text{rel}}) = \mathrm{Log}(\mathbf{z}_{\text{rel}}\, \mathbf{T}_{j}^{-1} \mathbf{T}_{i}), \qquad \mathbf{r}_{\text{rp}}(\mathbf{s}, \mathbf{z}_{\text{rp}}) = \lfloor \mathbf{z}_{\text{rp}}\, \mathbf{R}_{i}^{-1} (0,0,-1)^{\top} \rfloor_{xy}$$

with pseudo-measurements $\mathbf{z}$ read off the current estimate (so the mean is preserved) and information matrices in closed form, $\mathbf{H}_{i} = (\{\mathbf{J}_{\text{r}} \boldsymbol{\Sigma}_{\text{o}} \mathbf{J}_{\text{r}}^{\top}\}_{i})^{-1}$. Global mapping then detects and matches ORB features (statistically independent of the VIO's KLT points, giving implicit loop closure) and minimizes reprojection error plus the recovered factor energy $E_{\text{nfr}}$ — a bundle adjustment over keyframe poses and landmarks only, no velocities or biases, free to re-linearize everything. The roll-pitch factors keep the global map gravity-aligned, and relative-pose factors bridge segments without feature matches.

## Results

On EuRoC (RMS ATE, V2_03 excluded for >400 missing frames): the VIO layer is best on 8 of 10 sequences among odometry methods — e.g. 0.07 / 0.06 / 0.07 / 0.13 / 0.11 m on MH_01–05 and 0.04 / 0.05 / 0.10 / 0.04 / 0.05 m on V1_01–V2_02 — against VI-DSO (best on 5) and clearly ahead of OKVIS and VINS-Fusion. The full mapping system reaches 0.02–0.10 m, outperforming VI ORB-SLAM especially on the machine-hall sequences with large keyframe gaps (MH_04: 0.10 vs 0.22 m) and tracking V1_03 (0.03 m) where pure BA fails and BA with identity-weighted factors degrades to 0.56 m — showing that the KLD-recovered weights, not just the factor topology, matter. Timing (Intel E5-1620): VIO averages 7.83 ms/frame, ~11.5% of frames become keyframes, mapping costs 52.8 ms per keyframe; MH_05 (2273 stereo frames, 114 s) processes in 19.2 s VIO + 9.7 s mapping, ~4× faster than real time, with a 2.5× smaller global state than naive IMU integration.

## Why it matters for SLAM

Basalt gave a principled answer to a question every VIO-plus-mapping system faces: how to carry odometry information into global optimization without freezing linearization points or keeping raw measurements. Framing "what to keep from odometry" as a distribution-approximation problem (which nonlinear factors best match the accumulated information) made the idea transferable — it influenced later systems including OKVIS2's pose-graph-edge treatment of marginalized landmarks — and its high-quality open-source implementation is a common high-accuracy baseline on EuRoC and TUM-VI.

## Related

- [OKVIS](okvis.md) — the sliding-window architecture whose marginalization weakness Basalt targets.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — the underlying mechanism and its linearization pitfalls.
- [DM-VIO](dm-vio.md) — a different remedy (delayed marginalization) for the same inconsistency problem.
- [OKVIS2](okvis2.md) — successor-generation system with reactivatable marginalized information.
- [VI-DSO](vi-dso.md) — closest VIO competitor in the paper's evaluation.
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — background on the fisheye models used in Basalt's open-source implementation.
