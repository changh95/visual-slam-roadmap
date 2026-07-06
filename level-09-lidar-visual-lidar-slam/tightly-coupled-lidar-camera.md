# Tightly-coupled LiDAR-camera

A LiDAR-camera SLAM system is **tightly coupled** when point cloud registration residuals and visual residuals are optimized *jointly* in a single cost function (or a single filter update) over one shared state. It is **loosely coupled** when each modality runs its own odometry and only the resulting pose estimates are fused afterwards, e.g., in a pose graph or a simple filter.

In a tightly-coupled optimization backend, the state $\mathbf{X}$ (poses, velocities, IMU biases, sometimes landmarks) minimizes a sum of heterogeneous terms:

$$
\mathbf{X}^* = \arg\min_{\mathbf{X}} \; \sum \|\mathbf{r}^{\text{IMU}}\|^2_{\Sigma_I} + \sum \|\mathbf{r}^{\text{visual}}\|^2_{\Sigma_V} + \sum \|\mathbf{r}^{\text{LiDAR}}\|^2_{\Sigma_L} + \sum \|\mathbf{r}^{\text{loop}}\|^2_{\Sigma_{lp}}
$$

where LiDAR residuals are typically point-to-plane or point-to-line distances, and visual residuals are reprojection or photometric errors. LVI-SAM realizes this with a factor graph; FAST-LIVO realizes the filter equivalent by stacking LiDAR and visual Jacobians in one iterated Kalman filter update (and FAST-LIVO2 refines this with a sequential update to handle the very different dimensionalities of a LiDAR scan and an image).

Why bother with the extra complexity?

- **Information is not thrown away.** Loose coupling compresses each modality into a 6-DoF pose (plus covariance) before fusion; correlations between the raw measurements and the shared state (especially IMU biases) are lost.
- **Cross-modal aiding happens automatically.** LiDAR depth can constrain visual features directly (as in LVI-SAM's depth-enhanced features); the camera constrains the directions in which LiDAR geometry is degenerate.
- **Graceful degradation.** When one modality's residuals become uninformative, the joint problem is still well-conditioned as long as the other modality observes the weak directions.

The costs are real too: tightly-coupled systems need careful extrinsic and temporal calibration between sensors, and a bug or outlier in one modality can corrupt the whole estimate — which is why robust weighting and degradation detection matter.

## Why it matters for SLAM

The tight-vs-loose distinction, familiar from VIO, is the single most important architectural axis in LiDAR-camera fusion: it largely determines a system's accuracy ceiling and its failure behavior. Every major LVI system (LVI-SAM, R3LIVE, FAST-LIVO2) advertises tight coupling as a headline feature, and reading their cost functions is the fastest way to understand what each system actually fuses.

## Related

- [Tightly-coupled vs Loosely-coupled](../level-06-vio-vins/tightly-coupled-vs-loosely-coupled.md) — the same concept in visual-inertial fusion
- [LVI-SAM](lvi-sam.md) — tightly-coupled factor-graph realization
- [FAST-LIVO](fast-livo.md) — tightly-coupled filter realization
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the broader triple-fusion picture
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the machinery behind joint optimization

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
