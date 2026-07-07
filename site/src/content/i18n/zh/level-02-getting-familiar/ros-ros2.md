# ROS/ROS2

**ROS (Robot Operating System)** 并不是一个操作系统——它是一套发布/订阅中间件，外加一个庞大的工具和软件包生态系统，已经成为机器人软件领域的通用语言。对于SLAM来说，ROS解决的是那些不起眼但又必不可少的"管道"问题：把传感器数据从驱动传递到你的算法、维护坐标系的一致性、录制数据集，以及可视化结果。

你需要掌握的核心概念：

- **节点（Nodes）**——互相通信的进程；你的SLAM系统通常是一个节点，每个传感器驱动是另一个节点。
- **话题与消息（Topics and messages）**——带类型的发布/订阅通道。你会经常见到这些：`sensor_msgs/Image`、`sensor_msgs/CameraInfo`、`sensor_msgs/Imu`、`sensor_msgs/PointCloud2`、`nav_msgs/Odometry`、`geometry_msgs/PoseStamped`。
- **TF (tf2)**——坐标系树。每个传感器和本体坐标系（`map`、`odom`、`base_link`、`camera_link`、`imu_link`）都是带时间戳变换树中的一个节点；SLAM系统通常从TF中*读取*外参，并*发布* `map -> odom` 的修正量。
- **Bag文件（Bags）**——录制的消息流（`rosbag` / `ros2 bag`）。像EuRoC这样的数据集就是以bag形式发布的，重放bag是确定性地开发和评测SLAM系统的标准方式。
- **工具**——RViz用于轨迹、点云和TF的3D可视化；`rqt`用于内部状态检查；launch文件用于携带参数启动多节点系统。

**ROS 1 与 ROS 2**：ROS 1（最终版本：Noetic）已经进入生命周期终点；新开发都面向 **ROS 2**，它用DDS替代了自定义传输层，增加了服务质量（QoS）控制（对有损无线链路和高频传感器至关重要），支持对实时友好的执行器，原生支持多平台，并去掉了单master架构。上述概念几乎原样延续；API分别是 `rclcpp`（C++）和 `rclpy`（Python）。

对SLAM而言，实践中的工作流程是：把算法写成一个完全不依赖ROS的库，然后添加一个薄薄的ROS封装节点，订阅传感器话题、驱动你的库、并发布里程计、TF修正量和可视化标记。这样能保持算法的可测试性和可移植性——ORB-SLAM3、VINS-Fusion、RTAB-Map以及大多数提供ROS支持的开源系统都采用这种模式。

一个用Python写的最简ROS 2封装展示了每个SLAM节点的基本形态：

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

值得记住的日常命令：`ros2 bag record -a` / `ros2 bag play <bag>`、`ros2 topic hz <topic>`（数据到底有没有到达，速率是多少？）、`ros2 topic echo`、`ros2 run tf2_tools view_frames`（导出TF树），以及用 `ros2 node info <node>` 做接线检查。对于多传感器输入，`message_filters` 提供了近似时间同步器，用于把图像与深度或IMU批数据配对。

## 常见陷阱

- **QoS不匹配（ROS 2）**——一个尽力而为（best-effort）的传感器发布者和一个可靠QoS的订阅者会*连接上但什么也交换不到*，且没有任何错误提示。对传感器话题使用 `qos_profile_sensor_data`，并用 `ros2 topic info -v` 检查。
- **滥用TF**——直接发布 `map -> base_link` 而不是 `map -> odom` 会破坏下游控制器所依赖的里程计契约（连续的odom、跳变的地图修正）。同时要留意向TF请求比最新发布变换更新的时间戳时产生的外推误差。
- **时间戳问题**——始终用*传感器*时间而不是到达时间为消息打时间戳，并使用单一时钟源；重放bag时要始终统一使用 `use_sim_time`，否则任何基于时间的查询都会悄悄出错。
- **在回调中做重活**——在订阅回调里做跟踪计算会阻塞执行器并丢消息；应把数据交给工作线程/队列处理。
- **对带宽视而不见**——通过WiFi（甚至是进程间）传输全分辨率未压缩图像会占满传输带宽；使用压缩话题、组合/进程内通信，或者把SLAM节点和驱动跑在同一台机器上。

## 对SLAM的意义

几乎你会部署的每个机器人都说ROS：传感器数据以ROS话题到达，外参存在TF里，下游消费者（导航、规划）期望 `nav_msgs/Odometry` 和一个 `map` 坐标系。能够把一个SLAM系统封装成ROS 2节点、重放bag、并用RViz调试，是科研和工业机器人工作的基本技能。

## 动手实践

- [ROS基础](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_09)

## 相关条目

- [Docker](docker.md)
- [Simulation](simulation.md)
- [C++](cpp.md)
- [Python](python.md)
