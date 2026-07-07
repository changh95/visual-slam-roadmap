# Odometry

**Odometry** is the estimation of a robot's pose by integrating incremental motion measurements over time — dead reckoning. Starting from a known initial pose, each new measurement gives a small relative motion $\Delta T_k$, and the current pose is the composition of all increments:

$$T_k = T_0 \cdot \Delta T_1 \cdot \Delta T_2 \cdots \Delta T_k$$

The word "odometry" originally referred to **wheel odometry**: encoders count wheel rotations, and a kinematic model (differential drive, Ackermann) converts them into linear and angular velocity. The same idea generalises to any sensor that can measure relative motion:

- **Wheel odometry** — cheap and always available on wheeled robots, but corrupted by wheel slip, especially outdoors.
- **Inertial odometry** — integrate IMU accelerations and angular rates; drifts very quickly on its own because acceleration is integrated twice.
- **Visual odometry (VO)** — estimate frame-to-frame camera motion from image correspondences.
- **LiDAR odometry** — align consecutive point clouds (e.g. with ICP or feature-based registration).

The defining property of odometry is **drift**: every increment carries a small error, and because increments are chained multiplicatively, errors accumulate without bound. A 0.5% translational error per metre is invisible over a desk-sized motion and catastrophic over a kilometre. Odometry alone can therefore never produce a globally consistent map — that requires loop closure and global optimisation, which is exactly what separates odometry from SLAM.

In modern SLAM back-ends, odometry appears as a *relative pose constraint*: an edge between consecutive pose nodes in a pose graph or a motion-model factor in a factor graph,

$$\mathbf{x}_{t+1} = f(\mathbf{x}_t, \mathbf{u}_t) + \mathbf{w}_t, \qquad \mathbf{w}_t \sim \mathcal{N}(\mathbf{0}, Q_t)$$

where the control/measurement $\mathbf{u}_t$ comes from encoders, an IMU, or a VO front-end, and $Q_t$ models its uncertainty.

## Worked example: differential-drive odometry

For a two-wheeled differential-drive robot with wheel radius $r$, encoder-measured wheel angular velocities $\omega_l, \omega_r$, and wheel separation $L$, the body velocities are

$$v = \frac{r(\omega_r + \omega_l)}{2}, \qquad \omega = \frac{r(\omega_r - \omega_l)}{L}.$$

Integrating the planar pose $(x, y, \theta)$ over a timestep $\Delta t$ (simplest Euler form):

$$x_{k+1} = x_k + v\cos\theta_k\,\Delta t, \qquad y_{k+1} = y_k + v\sin\theta_k\,\Delta t, \qquad \theta_{k+1} = \theta_k + \omega\,\Delta t.$$

This ten-line integrator is a complete odometry system — and it exhibits every classic failure mode. Notice that the position update depends on $\theta_k$: any heading error rotates *all* subsequent translation into the wrong direction. After driving a distance $d$ with a heading error $\delta\theta$, the lateral position error is roughly $d \cdot \delta\theta$ — which is why heading (gyro quality, wheel-base calibration) dominates odometric accuracy, and why adding even a cheap gyro to wheel odometry helps so much.

## How drift behaves

- **Random errors accumulate as a random walk**: if each increment carries independent noise, the variance of the integrated pose grows with distance travelled — uncertainty ellipses inflate steadily and never shrink without an external correction.
- **Systematic errors grow linearly**: a mis-calibrated wheel radius (say from tyre pressure) or wheel base biases every increment the same way — a straight corridor comes back slightly curved every single run. Systematic errors are the ones you can and should calibrate away.
- **Heading error dominates**: as the worked example shows, angular error converts into position error proportional to distance travelled; translation-only errors just add up.
- **Error composition is multiplicative on $SE(3)$**: increments compose as transforms, so errors do not simply add — this is why odometry covariance propagation uses the Jacobians of the composition (or, more cleanly, Lie-group machinery).

Practically, odometry quality is quoted as *relative* error — percent of distance travelled and degrees per metre — which is exactly what the KITTI odometry benchmark and the relative pose error (RPE) metric measure. Absolute trajectory error (ATE) is the wrong lens for an odometry system, because absolute error is unbounded by design.

## Common pitfalls

- **Treating odometry output as ground truth downstream** — always propagate its covariance; a planner or fusion stack that ignores odometric uncertainty will be confidently wrong.
- **Wrong frame semantics (ROS)** — odometry should be published as a *continuous, drifting* `odom -> base_link` transform; the loop-closing SLAM correction lives in `map -> odom`. Making odometry jump when a correction arrives breaks every controller consuming it.
- **Timestamp sloppiness** — integrating encoder ticks against the wrong $\Delta t$, or pairing a velocity with the wrong image, injects errors that look exactly like sensor noise but are pure bookkeeping bugs.
- **Ignoring slip and kinematic mismatch** — differential-drive equations assume rolling without slipping; on carpet, gravel, or during aggressive turns this silently fails. Detect it (e.g. gyro vs encoder-implied yaw disagreement) rather than average over it.

## Why it matters for SLAM

Odometry is the backbone of every SLAM system: it provides the high-rate, locally accurate motion estimate that tracking, mapping, and loop-closure modules build on. Understanding its error characteristics — locally smooth, globally drifting — explains the architecture of modern SLAM: trust odometry over short horizons, and correct it globally whenever a loop closure or absolute measurement becomes available.

## Related

- [Proprioceptive sensor](proprioceptive-sensor.md)
- [Visual Odometry](../level-03-monocular-slam/visual-odometry.md)
- [VO vs SLAM](../level-03-monocular-slam/vo-vs-slam.md)
- [Pose graph optimization](pose-graph-optimization.md)
