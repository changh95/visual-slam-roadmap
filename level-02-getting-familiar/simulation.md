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

A typical Gazebo/ROS 2 workflow, concretely: describe the robot in URDF/SDF, attach sensor plugins (camera, depth, IMU, LiDAR) that publish standard `sensor_msgs` topics, spawn it in a world, and drive it (teleop or a scripted trajectory). The simulator publishes ground-truth poses alongside, so a run produces exactly the inputs your SLAM node consumes *plus* the reference trajectory to score it with — record both to a bag and your evaluation pipeline is identical for sim and real data. Isaac Sim's equivalent workflow adds photoreal rendering and a synthetic-data pipeline that exports labelled RGB, depth, and segmentation at scale.

Two levers control how much a simulation teaches you:

- **Sensor noise modelling** — an ideal pinhole camera with perfect timestamps and a noise-free IMU makes every SLAM system look great. Inject realistic effects — Gaussian pixel noise, exposure changes, IMU bias random walks (matching a real datasheet's noise densities), timestamp jitter, dropped frames — and simulation starts predicting real-world behaviour instead of flattering it.
- **Domain randomization** — for learned components, randomising textures, lighting, and layouts across renders forces networks to generalise instead of memorising the simulator's look; it is the standard mitigation for the visual sim-to-real gap in synthetic training data.

The caveat is the **sim-to-real gap**: simulated images are cleaner than reality (simplified noise, motion blur, rolling shutter, lighting), physics is idealised, and IMU/encoder error models are approximations. A system that works in Gazebo is not proven; a system that fails there is definitely broken. Use simulation as a filter and a measurement tool, then validate on real datasets (EuRoC, TUM, KITTI) and real hardware.

## Common pitfalls

- **Perfect synchronisation hides real bugs** — in sim, all sensors share one clock and zero latency; the time-offset and sync failures that dominate real deployments never occur, so passing in sim says nothing about your timestamp handling.
- **Rendering artifacts masquerade as texture** — low-fidelity renderers produce repeated textures, aliasing, and unnaturally sharp edges that feature detectors love or choke on; feature statistics in sim can be very unlike reality in either direction.
- **Physics timestep vs sensor rate** — a 1 kHz IMU simulated from a 250 Hz physics loop is interpolated fiction; check that the sim can actually generate your sensor rates before trusting inertial results.
- **Tuning to the simulator** — parameters (thresholds, noise covariances) optimised against sim data encode the simulator's error model, not the sensor's; re-tune on real data before concluding anything.
- **GPU nondeterminism** — even in simulation, rendering and multi-threading can make runs non-identical; seed and configure carefully if you want CI-grade repeatability.

## Why it matters for SLAM

Simulation shortens the develop-test loop from hours of hardware fiddling to seconds, and it is the only place you get dense, exact ground truth for free. It is also increasingly a *data source*: synthetic datasets rendered in simulators (e.g. TartanAir-style data) train the learned front-ends and depth networks that modern SLAM systems rely on.

## Related

- [ROS/ROS2](ros-ros2.md)
- [Docker](docker.md)
- [Metrics](metrics.md)
- [CI/CD](ci-cd.md)
