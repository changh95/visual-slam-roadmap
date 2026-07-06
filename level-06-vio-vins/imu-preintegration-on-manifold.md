# IMU Preintegration on Manifold
> Forster 2015 · [Paper](https://arxiv.org/abs/1512.02363)

**One-line summary** — Derives a theoretically rigorous preintegration of IMU measurements on the $SO(3)$ manifold, enabling optimization-based VIO to correct for bias changes analytically without ever re-integrating raw IMU data.

## Key ideas
- **Preintegration theory on the manifold**: IMU measurements between keyframes $i$ and $j$ are compounded into relative motion terms $\Delta\mathbf{R}_{ij} = \prod_t \mathrm{Exp}((\tilde{\boldsymbol{\omega}}_t - \mathbf{b}^g_i)\delta t)$, $\Delta\mathbf{v}_{ij}$, $\Delta\mathbf{p}_{ij}$ that are independent of the absolute poses — properly treating rotation as an element of $SO(3)$ rather than a vector, with the correct characterization of rotation noise.
- **A-posteriori bias correction without re-integration**: analytically derived Jacobians of the preintegrated terms w.r.t. the biases allow a first-order update, e.g. $\Delta\tilde{\mathbf{R}}_{ij}(\mathbf{b}+\delta\mathbf{b}) \approx \Delta\mathbf{R}_{ij}\,\mathrm{Exp}\!\big(\tfrac{\partial\Delta\mathbf{R}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g\big)$ — the key to keeping IMU factors cheap inside an iterative optimizer.
- **IMU factor in a factor graph**: the preintegrated measurement becomes one relative constraint between consecutive keyframe states $(\mathbf{R}, \mathbf{v}, \mathbf{p}, \mathbf{b}^g, \mathbf{b}^a)$, with residuals for rotation, velocity, and position, integrating seamlessly with incremental smoothers (iSAM2/GTSAM).
- **Structureless vision integration**: combined with structureless (landmark-marginalizing) visual factors, the formulation supports real-time full smoothing rather than fixed-lag filtering.
- **MAP estimation framing**: the paper formally derives the generative measurement model and the maximum-a-posteriori estimator, putting VIO on the same probabilistic footing as bundle adjustment.

## Why it matters for SLAM
This is the foundational theory underlying essentially all modern optimization-based VIO: VINS-Mono, ORB-SLAM3, Kimera-VIO, Basalt, and OKVIS2 all use Forster-style on-manifold preintegration for their IMU factors, and the reference implementation lives in GTSAM. It upgraded Lupton's original preintegration idea (2012) with correct manifold treatment — avoiding Euler-angle singularities — and made high-rate inertial sensing compatible with keyframe-rate nonlinear optimization. If you implement one piece of VIO theory by hand, make it this one.

## Related
- [IMU preintegration](imu-preintegration.md) — the concept note with the surrounding context.
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md) — companion reference for on-manifold state estimation.
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — the mathematical machinery ($\mathrm{Exp}/\mathrm{Log}$, Jacobians).
- [VINS-Mono](vins-mono.md) — a widely used system built on these IMU factors.
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — the iSAM2 back-end the paper pairs with.

[Back to Level 6](../README.md#level-6-vio--vins)
