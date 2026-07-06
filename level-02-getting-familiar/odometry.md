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

## Why it matters for SLAM

Odometry is the backbone of every SLAM system: it provides the high-rate, locally accurate motion estimate that tracking, mapping, and loop-closure modules build on. Understanding its error characteristics — locally smooth, globally drifting — explains the architecture of modern SLAM: trust odometry over short horizons, and correct it globally whenever a loop closure or absolute measurement becomes available.

## Related

- [Proprioceptive sensor](proprioceptive-sensor.md)
- [Visual Odometry](../level-03-monocular-slam/visual-odometry.md)
- [VO vs SLAM](../level-03-monocular-slam/vo-vs-slam.md)
- [Pose graph optimization](pose-graph-optimization.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
