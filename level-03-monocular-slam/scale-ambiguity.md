# Scale ambiguity

**Scale ambiguity** is the fundamental limitation of monocular SLAM: from images alone, absolute metric scale is unrecoverable. A scene observed at distance $d$ with camera baseline $b$ produces *exactly* the same images as a scene at distance $\alpha d$ with baseline $\alpha b$, for any positive scalar $\alpha$. A dollhouse filmed up close and a real house filmed from far away are geometrically indistinguishable to a single moving camera.

Formally, a monocular reconstruction lives in a **similarity space** $\mathrm{Sim}(3)$ (rotation + translation + scale, 7 DoF) rather than the Euclidean $SE(3)$: the epipolar constraint fixes rotation and translation *direction*, but the translation magnitude — and with it the entire map scale — is a free parameter. Monocular systems simply pick a scale at initialisation (e.g. normalising the first baseline to 1).

Worse than the unknown global scale is **scale drift**: because scale is unobservable, small errors let the estimated scale slowly wander along the trajectory, so a long monocular loop may return to its start at a different scale. This is why monocular systems such as ORB-SLAM perform loop closure over $\mathrm{Sim}(3)$ — the loop correction must fix scale as well as pose.

How scale is recovered in practice:

- **IMU fusion (VIO)**: the accelerometer measures metric acceleration, making scale observable given sufficient motion — the approach used by VINS-Mono, ORB-SLAM3 inertial mode, and every phone/headset tracker.
- **Stereo or RGB-D**: a known baseline or direct depth measurement provides scale by construction.
- **Known object sizes / geometry priors**: recognised objects (CubeSLAM), known markers, camera height above the ground plane (common in driving).
- **Learned depth priors**: modern metric monocular depth networks (e.g. Metric3D) and metric-trained 3D foundation models (e.g. MASt3R) predict approximately metre-scaled geometry from a single image, giving monocular pipelines an approximate absolute scale — a learned prior, not a geometric guarantee, but often good in practice.

## Why it matters for SLAM

Scale ambiguity dictates system design: it is *the* reason phones and headsets add an IMU, cars add stereo/LiDAR, and monocular papers report trajectory error only after scale alignment with ground truth. Understanding which measurements make scale observable — and how scale drift corrupts long trajectories — is essential for reading any monocular or visual-inertial SLAM paper.

## Related

- [Scale observability](../level-07-stereo-slam/scale-observability.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [Metric3D](../level-05-deep-learning/metric3d.md)
- [MASt3R](mast3r.md)
- [CubeSLAM](cubeslam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
