# Degradation handling

A multi-sensor SLAM system is only as robust as its ability to notice when one of its sensors is lying. **Degradation handling** is the machinery for detecting that a modality has become unreliable and falling back gracefully to the remaining sensors — then recovering when the degraded sensor becomes useful again.

## Typical degradation scenarios

- **LiDAR** in rain, fog, or snow (beam scatter), or in *geometrically degenerate* scenes: a long featureless corridor constrains motion along the corridor axis poorly; an open field offers few planes or edges to lock onto.
- **Camera** in darkness, overexposure at tunnel exits, texture-less walls, or motion blur under aggressive motion.
- **IMU** is always available but drifts within seconds if neither exteroceptive sensor corrects it.

Note the distinction between the two LiDAR failure classes: weather degradation produces *noisy or missing* measurements (detectable as outliers), while geometric degeneracy produces *clean, self-consistent* measurements that simply fail to constrain some direction of motion. The second class is far more dangerous, because nothing about the individual residuals looks wrong.

## Detecting degradation

**Residual monitoring.** If a subsystem's registration or reprojection residuals spike — or the number of usable measurements collapses — it flags itself as degraded. LVI-SAM uses this pattern: each subsystem monitors its own health, and a failure in one does not bring down the other.

**Degeneracy analysis of the estimation problem.** Registration is solved by iterating on the linearized normal equations, whose information matrix is

$$
\mathbf{H} \;=\; \mathbf{J}^\top \mathbf{J} \;=\; \sum_i \mathbf{J}_i^\top \mathbf{J}_i ,
$$

where each $\mathbf{J}_i$ is the Jacobian of one (e.g., point-to-plane) residual with respect to the pose. Eigen-decomposing $\mathbf{H} = \sum_k \lambda_k \mathbf{v}_k \mathbf{v}_k^\top$ reveals how well each direction of the state space is constrained: a near-zero eigenvalue $\lambda_k$ means the measurements say almost nothing about motion along $\mathbf{v}_k$.

Worked example — the corridor: with only two parallel walls in view, every point-to-plane residual has its normal $\mathbf{n}_i$ perpendicular to the corridor axis. Translation along the axis leaves every residual unchanged, so the corresponding row space of $\mathbf{J}$ has no component in that direction and the associated eigenvalue of $\mathbf{H}$ collapses. The optimizer will still "converge" — to an arbitrary position along the corridor. A degeneracy-aware estimator compares $\lambda_{\min}$ against a threshold and then freezes or de-weights the update *along the degenerate directions only* (solution remapping), keeping the well-constrained components.

## Falling back and recovering

Fallback strategies form a spectrum:

- **Re-weighting**: inflate the degraded modality's measurement covariance (or shrink its factor weights) so the healthy sensors dominate the fused estimate without a hard switch.
- **Directional gating**: apply updates only in the well-conditioned subspace, as above — the surgical option for geometric degeneracy.
- **Subsystem isolation**: drop the degraded measurements entirely and run on the remaining sensors; the IMU bridges the gap at high rate while it lasts.
- **Cross-system re-initialization**: LVI-SAM restarts its LiDAR-inertial subsystem from the visual-inertial pose estimate after degenerate geometry, and bootstraps visual-inertial initialization from LiDAR-inertial estimates at startup — recovery flows in both directions.

Recovery deserves as much care as detection: when a sensor comes back, its subsystem must be re-initialized consistently with the current fused state (pose *and* uncertainty), or the re-admitted measurements will fight the estimate they are supposed to refine.

## Common pitfalls

- **Trusting residuals alone.** In a degenerate scene the residuals can be tiny while the pose slides freely along the null space — "confident garbage." Degeneracy analysis of $\mathbf{H}$ catches what residual monitoring cannot.
- **Static thresholds.** An eigenvalue threshold tuned in an office fails in a warehouse; scale-aware or normalized conditioning measures transfer better than raw magnitudes.
- **Binary switching.** Hard on/off transitions between modalities cause estimate jumps; covariance-based re-weighting degrades and recovers smoothly.
- **Testing only benign data.** Degradation handling is exactly the code path that standard benchmarks rarely exercise; tunnels, night runs, and rain are where fusion systems earn their keep.

## Why it matters for SLAM

Fusion systems are sold on the promise that "the sensors cover each other's weaknesses," but that promise is only realized if degradation is detected and handled explicitly — a tightly-coupled estimator fed confident garbage from a degenerate LiDAR scan will happily corrupt the whole state. Degradation handling is what separates demo-grade fusion from systems that survive tunnels, night driving, and rain, and it is a major evaluation axis for LVI systems such as LVI-SAM and FAST-LIVO2.

## Related

- [LVI-SAM](lvi-sam.md) — explicit cross-subsystem failure detection and re-initialization
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the complementary-sensor argument
- [Tightly-coupled LiDAR-camera](tightly-coupled-lidar-camera.md) — why bad measurements are dangerous in joint optimization
- [Observability](../level-06-vio-vins/observability.md) — the theory behind unconstrained state directions
- [FAST-LIVO2](fast-livo2.md) — robustness machinery (raycast, exposure estimation) against visual degradation
