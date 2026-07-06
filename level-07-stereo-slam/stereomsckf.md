# StereoMSCKF

> Sun 2018 · [Paper](https://arxiv.org/abs/1712.00036)

**One-line summary** — StereoMSCKF (S-MSCKF) adapts the MSCKF filter-based VIO framework to stereo cameras, matching the computational cost of monocular solutions while providing significantly greater robustness — enabling fast autonomous MAV flight on embedded processors.

## Key ideas

- **Stereo observations in a structureless filter**: each tracked feature carries left+right image observations $(u_L, v_L, u_R, v_R)$; as in MSCKF, feature positions are triangulated when tracks end and projected out via null-space projection, so landmarks never enter the EKF state and cost stays linear in feature count.
- **Instantaneous depth stabilizes the filter**: stereo gives metric depth from a single frame, removing the multi-view triangulation degeneracy that makes monocular filter-based VIO fragile during aggressive maneuvers and rapid attitude changes.
- **Designed for resource-constrained platforms**: the filter runs in real time on the embedded-class computers carried by micro aerial vehicles, where sliding-window optimizers were too expensive at the time.
- **Demonstrated in the air**: evaluated on EuRoC against OKVIS, ROVIO, and VINS-Mono, and validated in real autonomous flights reaching speeds up to 17.5 m/s — robustness under fast motion was the headline result.
- Open-source implementation (msckf_vio) that became a popular lightweight stereo VIO starting point.

## Why it matters for SLAM

S-MSCKF established the standard stereo filter-based VIO recipe: stereo front-end for depth, MSCKF back-end for efficiency. It demonstrated concretely that for compute-limited aerial robots a well-engineered EKF can rival optimization-based systems at a fraction of the cost, a trade-off later systematized by OpenVINS. If your platform is a small drone or an embedded board, this lineage — MSCKF → S-MSCKF → OpenVINS — is usually where you start.

## Related

- [MSCKF](../level-06-vio-vins/msckf.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md)
- [Scale observability](scale-observability.md)

---
[Back to Level 7](../README.md#level-7-stereo-slam)
