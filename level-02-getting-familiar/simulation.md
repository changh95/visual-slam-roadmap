# Simulation

A simulator gives you a robot, sensors, and a world that you fully control — which for SLAM development means something priceless: **perfect ground truth**. Every pose, every depth map, every landmark position is known exactly, so you can measure your system's error precisely, reproduce failures deterministically, and iterate without touching hardware.

The two simulators named on the roadmap:

- **Gazebo** — the long-standing open-source robotics simulator, tightly integrated with ROS/ROS 2. Physics-based simulation of robots described in URDF/SDF, with plugins for cameras, depth cameras, IMUs, LiDAR, and wheel odometry. The default choice for mobile-robot and navigation-stack development; rendering is functional rather than photorealistic.
- **NVIDIA Isaac Sim** — built on Omniverse with GPU ray-traced rendering. Aimed at photorealistic sensor simulation and large-scale **synthetic data generation** (RGB, depth, segmentation, bounding boxes with exact labels), plus robot learning workflows. Attractive for vision-heavy work where rendering fidelity matters to whether results transfer.

Other tools you will encounter: AirSim and Flightmare (drones), CARLA (autonomous driving), and Habitat (embodied AI indoors — used by active-mapping papers like ActiveSplat).

What simulation buys a SLAM developer, concretely:

- **Ground-truth evaluation** — exact trajectories for ATE/RPE, exact depth and meshes for reconstruction accuracy, without a motion-capture room.
- **Controlled stress-testing** — sweep lighting, texture, motion speed, and sensor noise independently to find where your system breaks.
- **Repeatability and CI** — run the same sequence on every commit; regressions show up as metric changes, not anecdotes.
- **Rare and dangerous scenarios** — aggressive drone maneuvers, sensor dropouts, dynamic crowds — cheap in sim, expensive or unsafe in reality.

The caveat is the **sim-to-real gap**: simulated images are cleaner than reality (simplified noise, motion blur, rolling shutter, lighting), physics is idealised, and IMU/encoder error models are approximations. A system that works in Gazebo is not proven; a system that fails there is definitely broken. Use simulation as a filter and a measurement tool, then validate on real datasets (EuRoC, TUM, KITTI) and real hardware.

## Why it matters for SLAM

Simulation shortens the develop-test loop from hours of hardware fiddling to seconds, and it is the only place you get dense, exact ground truth for free. It is also increasingly a *data source*: synthetic datasets rendered in simulators (e.g. TartanAir-style data) train the learned front-ends and depth networks that modern SLAM systems rely on.

## Related

- [ROS/ROS2](ros-ros2.md)
- [Docker](docker.md)
- [Metrics](metrics.md)
- [CI/CD](ci-cd.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
