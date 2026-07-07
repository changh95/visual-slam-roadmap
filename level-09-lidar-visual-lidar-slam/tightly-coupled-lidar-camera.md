# Tightly-coupled LiDAR-camera

A LiDAR-camera SLAM system is **tightly coupled** when point cloud registration residuals and visual residuals are optimized *jointly* in a single cost function (or a single filter update) over one shared state. It is **loosely coupled** when each modality runs its own odometry and only the resulting pose estimates are fused afterwards, e.g., in a pose graph or a simple filter.

## The joint problem

In a tightly-coupled optimization backend, the state $\mathbf{X}$ (poses, velocities, IMU biases, sometimes landmarks) minimizes a sum of heterogeneous terms:

$$
\mathbf{X}^* = \arg\min_{\mathbf{X}} \; \sum \|\mathbf{r}^{\text{IMU}}\|^2_{\Sigma_I} + \sum \|\mathbf{r}^{\text{visual}}\|^2_{\Sigma_V} + \sum \|\mathbf{r}^{\text{LiDAR}}\|^2_{\Sigma_L} + \sum \|\mathbf{r}^{\text{loop}}\|^2_{\Sigma_{lp}}
$$

where LiDAR residuals are typically point-to-plane or point-to-line distances, and visual residuals are reprojection or photometric errors. LVI-SAM realizes this with a factor graph on GTSAM. The filter-based equivalent puts the same residuals into an iterated Kalman update: FAST-LIVO stacks the Jacobians of both modalities, $\mathbf{H} = [\mathbf{H}^{\text{LiDAR}}; \mathbf{H}^{\text{Visual}}]$, into one update, while FAST-LIVO2 applies them *sequentially* within one iteration — LiDAR first, then vision on the intermediate state — to handle the very different dimensionalities of a LiDAR scan and an image.

By contrast, a loosely-coupled design would run LiDAR odometry and visual odometry independently and fuse only their 6-DoF pose outputs. That compression is exactly what tight coupling avoids.

## Tight vs loose at a glance

| | Tightly coupled | Loosely coupled |
|---|---|---|
| What is fused | raw residuals (points, pixels) | 6-DoF pose estimates (+ covariance) |
| Information retention | full — cross-correlations with biases kept | lossy — each modality pre-marginalized |
| Cross-modal aiding | automatic through the shared state | only via hand-designed interfaces |
| Sensitivity to calibration errors | high — errors enter every residual | lower — absorbed per subsystem |
| Failure isolation | poor by default — outliers corrupt the joint state | good — a failing odometry can be ignored |
| Implementation effort | high | low |

## Why bother with the extra complexity?

- **Information is not thrown away.** Loose coupling compresses each modality into a 6-DoF pose (plus covariance) before fusion; correlations between the raw measurements and the shared state (especially IMU biases) are lost.
- **Cross-modal aiding happens automatically.** LiDAR depth can constrain visual features directly (as in LVI-SAM's depth-enhanced features); the camera constrains the directions in which LiDAR geometry is degenerate.
- **Graceful degradation.** When one modality's residuals become uninformative, the joint problem is still well-conditioned as long as the other modality observes the weak directions.

## Common pitfalls

- **Calibration debt.** Extrinsics between LiDAR, camera, and IMU, plus time offsets, enter every residual; tightly-coupled systems convert calibration error directly into estimation bias, so calibration quality bounds achievable accuracy.
- **Outlier leverage.** A bad measurement in one modality pulls the *whole* state, not just its own subsystem — robust weighting and explicit degradation detection are mandatory, not optional.
- **Weighing apples against oranges.** The relative noise covariances $\Sigma_L$ vs $\Sigma_V$ decide which sensor "wins" disagreements; residuals in meters and residuals in intensity units have no natural common scale, and mis-tuned covariances silently bias the estimate.
- **Iterate or suffer linearization error.** Both LiDAR and photometric residuals are nonlinear in the pose; single-shot updates degrade under fast motion, which is why the strong systems use *iterated* filters or re-linearizing smoothers.

## Why it matters for SLAM

The tight-vs-loose distinction, familiar from VIO, is the single most important architectural axis in LiDAR-camera fusion: it largely determines a system's accuracy ceiling and its failure behavior. Every major LVI system (LVI-SAM, R3LIVE, FAST-LIVO2) advertises tight coupling as a headline feature, and reading their cost functions is the fastest way to understand what each system actually fuses.

## Related

- [Tightly-coupled vs Loosely-coupled](../level-06-vio-vins/tightly-coupled-vs-loosely-coupled.md) — the same concept in visual-inertial fusion
- [LVI-SAM](lvi-sam.md) — tightly-coupled factor-graph realization
- [FAST-LIVO](fast-livo.md) — tightly-coupled filter realization
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the broader triple-fusion picture
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the machinery behind joint optimization
- [Degradation handling](degradation-handling.md) — the safeguards tight coupling requires
