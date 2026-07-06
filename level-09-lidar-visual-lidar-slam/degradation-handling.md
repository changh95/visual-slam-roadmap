# Degradation handling

A multi-sensor SLAM system is only as robust as its ability to notice when one of its sensors is lying. **Degradation handling** is the machinery for detecting that a modality has become unreliable and falling back gracefully to the remaining sensors — then recovering when the degraded sensor becomes useful again.

Typical degradation scenarios:

- **LiDAR** in rain, fog, or snow (beam scatter), or in *geometrically degenerate* scenes: a long featureless corridor constrains motion along the corridor axis poorly; an open field offers few planes or edges to lock onto.
- **Camera** in darkness, overexposure at tunnel exits, texture-less walls, or motion blur under aggressive motion.
- **IMU** is always available but drifts within seconds if neither exteroceptive sensor corrects it.

Detection is usually done in one of two ways:

- **Residual monitoring**: if a subsystem's registration or reprojection residuals spike (or the number of usable measurements collapses), it flags itself as degraded. LVI-SAM uses this pattern: each subsystem monitors its own health, and a failure in one does not bring down the other.
- **Degeneracy analysis of the estimation problem**: examine the information (Hessian) matrix of the registration problem; near-zero eigenvalues indicate directions in which the measurements do not constrain the state (the classic corridor case). The estimator can then freeze or de-weight updates along the degenerate directions only.

Fallback strategies range from re-weighting (increase the trust in the healthy modality's factors or measurement noise), through subsystem isolation (drop degraded measurements entirely and run on the remaining sensors), to **cross-system re-initialization** — LVI-SAM restarts its LiDAR-inertial subsystem from the visual-inertial pose estimate after degenerate geometry, and bootstraps visual-inertial initialization from LiDAR-inertial estimates at startup.

## Why it matters for SLAM

Fusion systems are sold on the promise that "the sensors cover each other's weaknesses," but that promise is only realized if degradation is detected and handled explicitly — a tightly-coupled estimator fed confident garbage from a degenerate LiDAR scan will happily corrupt the whole state. Degradation handling is what separates demo-grade fusion from systems that survive tunnels, night driving, and rain, and it is a major evaluation axis for LVI systems such as LVI-SAM and FAST-LIVO2.

## Related

- [LVI-SAM](lvi-sam.md) — explicit cross-subsystem failure detection and re-initialization
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the complementary-sensor argument
- [Tightly-coupled LiDAR-camera](tightly-coupled-lidar-camera.md) — why bad measurements are dangerous in joint optimization
- [Observability](../level-06-vio-vins/observability.md) — the theory behind unconstrained state directions

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
