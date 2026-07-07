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

A minimal ROS 2 wrapper in Python shows the shape of every SLAM node:

```python
import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import Image, Imu
from nav_msgs.msg import Odometry

class SlamNode(Node):
    def __init__(self):
        super().__init__('my_slam')
        self.create_subscription(Image, '/camera/image_raw',
                                 self.on_image, qos_profile_sensor_data)
        self.create_subscription(Imu, '/imu/data',
                                 self.on_imu, qos_profile_sensor_data)
        self.odom_pub = self.create_publisher(Odometry, '/odom', 10)

    def on_imu(self, msg):   self.slam.feed_imu(msg)      # buffer at high rate
    def on_image(self, msg): self.odom_pub.publish(
                                 to_odom_msg(self.slam.track(msg)))

rclpy.init(); rclpy.spin(SlamNode())
```

Day-to-day commands worth memorising: `ros2 bag record -a` / `ros2 bag play <bag>`, `ros2 topic hz <topic>` (is data actually arriving, at what rate?), `ros2 topic echo`, `ros2 run tf2_tools view_frames` (dump the TF tree), and `ros2 node info <node>` for wiring checks. For multi-sensor input, `message_filters` provides approximate-time synchronisers to pair images with depth or IMU batches.

## Common pitfalls

- **QoS mismatches (ROS 2)** — a best-effort sensor publisher and a reliable-QoS subscriber will connect *and exchange nothing*, with no error message. Use `qos_profile_sensor_data` for sensor topics and check with `ros2 topic info -v`.
- **TF abuse** — publishing `map -> base_link` directly instead of `map -> odom` breaks the odometry contract that downstream controllers rely on (continuous odom, jumping map correction). Also beware of extrapolation errors from asking TF for transforms newer than the latest published one.
- **Timestamps** — always stamp messages with the *sensor* time, not the arrival time, and use a single clock source; use `use_sim_time` consistently when replaying bags, or every time-based lookup silently misbehaves.
- **Doing heavy work in callbacks** — a tracking pipeline inside the subscriber callback stalls the executor and drops messages; hand data to a worker thread/queue instead.
- **Bandwidth blindness** — full-resolution uncompressed images over WiFi (or even between processes) can saturate transport; use compressed topics, composition/intra-process communication, or run the SLAM node on the same machine as the driver.

## Why it matters for SLAM

Nearly every robot you will deploy on speaks ROS: sensor data arrives as ROS topics, extrinsics live in TF, and downstream consumers (navigation, planning) expect `nav_msgs/Odometry` and a `map` frame. Being able to wrap a SLAM system into a ROS 2 node, replay bags, and debug with RViz is a baseline skill for both research and industry robotics work.

## Related

- [Docker](docker.md)
- [Simulation](simulation.md)
- [C++](cpp.md)
- [Python](python.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
