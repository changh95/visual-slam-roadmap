# ROS/ROS2

**ROS (Robot Operating System)** is not an operating system — it is publish/subscribe middleware plus a huge ecosystem of tools and packages that has become the lingua franca of robotics software. For SLAM, ROS solves the unglamorous but essential plumbing: getting sensor data from drivers to your algorithm, keeping coordinate frames straight, recording datasets, and visualising results.

Core concepts you need:

- **Nodes** — processes that communicate; your SLAM system is typically one node, each sensor driver another.
- **Topics and messages** — typed publish/subscribe channels. The ones you will see constantly: `sensor_msgs/Image`, `sensor_msgs/CameraInfo`, `sensor_msgs/Imu`, `sensor_msgs/PointCloud2`, `nav_msgs/Odometry`, `geometry_msgs/PoseStamped`.
- **TF (tf2)** — the coordinate-frame tree. Every sensor and body frame (`map`, `odom`, `base_link`, `camera_link`, `imu_link`) is a node in a tree of timestamped transforms; SLAM systems typically *consume* extrinsics from TF and *publish* the `map -> odom` correction.
- **Bags** — recorded streams of messages (`rosbag` / `ros2 bag`). Datasets like EuRoC ship as bags, and replaying a bag is the standard way to develop and benchmark a SLAM system deterministically.
- **Tools** — RViz for 3D visualisation of trajectories, point clouds and TF; `rqt` for introspection; launch files for bringing up multi-node systems with parameters.

**ROS 1 vs ROS 2**: ROS 1 (final release: Noetic) reached end of life; new development targets **ROS 2**, which replaces the custom transport with DDS, adds quality-of-service controls (crucial for lossy wireless links and high-rate sensors), supports real-time-friendly executors, works natively on multiple platforms, and drops the single-master architecture. The concepts above carry over almost unchanged; APIs are `rclcpp` (C++) and `rclpy` (Python).

For SLAM specifically, the practical workflow is: write your algorithm as a library that knows nothing about ROS, then add a thin ROS wrapper node that subscribes to sensor topics, feeds your library, and publishes odometry, the TF correction, and visualisation markers. This keeps the algorithm testable and portable — the pattern used by ORB-SLAM3, VINS-Fusion, RTAB-Map and most open-source systems that offer ROS support.

## Why it matters for SLAM

Nearly every robot you will deploy on speaks ROS: sensor data arrives as ROS topics, extrinsics live in TF, and downstream consumers (navigation, planning) expect `nav_msgs/Odometry` and a `map` frame. Being able to wrap a SLAM system into a ROS 2 node, replay bags, and debug with RViz is a baseline skill for both research and industry robotics work.

## Related

- [Docker](docker.md)
- [Simulation](simulation.md)
- [C++](cpp.md)
- [Python](python.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
