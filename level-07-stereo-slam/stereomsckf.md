# StereoMSCKF

> Sun 2018 · [Paper](https://arxiv.org/abs/1712.00036)

**One-line summary** — StereoMSCKF (S-MSCKF) adapts the MSCKF filter-based VIO framework to stereo cameras, matching the computational cost of monocular solutions while providing significantly greater robustness — enabling fast autonomous MAV flight on embedded processors.

## Problem

Vision-aided inertial odometry had matured, but computational efficiency and robustness remained open challenges for autonomous flight with micro aerial vehicles, whose size and weight constraints rule out high-quality sensors and powerful processors. Monocular filter-based VIO is fragile during aggressive maneuvers because feature depth only emerges from multi-view triangulation over the pose window; stereo fixes that, but previous stereo visual-inertial solutions were computationally expensive. The goal: stereo-level robustness at monocular-level cost, on hardware a small drone can carry.

## Key ideas

- **Stereo observations in a structureless filter**: each tracked feature carries a stereo observation
  $$\mathbf{z} = (u_L,\, v_L,\, u_R,\, v_R)^\top,\qquad u_R = f\frac{X - b}{Z} + c_x,$$
  and, as in MSCKF, feature positions are triangulated when tracks end and projected out via null-space projection — landmarks never enter the EKF state, so cost stays linear in the feature count.
- **Lightweight stereo front-end**: corners are tracked over time with KLT optical flow on the left image and matched to the right image with an epipolar-constrained search, avoiding expensive descriptor extraction and matching.
- **Instantaneous depth stabilizes the filter**: stereo gives metric depth from a single frame, removing the multi-view triangulation degeneracy that makes monocular filter-based VIO fragile during aggressive maneuvers and rapid attitude changes, and speeding up filter initialization.
- **Designed for resource-constrained platforms**: the filter runs in real time on the embedded-class computers carried by micro aerial vehicles, where sliding-window optimizers were too expensive at the time — the whole point of choosing an EKF back-end.
- **Demonstrated in the air**: evaluated on EuRoC against OKVIS, ROVIO, and VINS-Mono, and validated in real autonomous flights reaching speeds up to 17.5 m/s in indoor and outdoor environments — robustness under fast motion was the headline result.
- Open-source implementation (`msckf_vio`) that became a popular lightweight stereo VIO starting point.

## Results & impact

The paper demonstrates that S-MSCKF is comparable to state-of-the-art *monocular* solutions in computational cost while providing significantly greater robustness — the key trade the stereo configuration buys. Benchmarked on EuRoC against OKVIS, ROVIO, and VINS-Mono and stress-tested in fast autonomous flight up to 17.5 m/s, it established filter-based stereo VIO as the practical choice for agile, compute-limited aerial robots. The open-source release was widely adopted and its architecture (stereo KLT front-end + MSCKF back-end) was later systematized in OpenVINS.

## Why it matters for SLAM

S-MSCKF established the standard stereo filter-based VIO recipe: stereo front-end for depth, MSCKF back-end for efficiency. It demonstrated concretely that for compute-limited aerial robots a well-engineered EKF can rival optimization-based systems at a fraction of the cost, a trade-off later systematized by OpenVINS. If your platform is a small drone or an embedded board, this lineage — MSCKF → S-MSCKF → OpenVINS — is usually where you start.

## Related

- [MSCKF](../level-06-vio-vins/msckf.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md)
- [Scale observability](scale-observability.md)

[Back to Level 7](../README.md#level-7-stereo-slam)
