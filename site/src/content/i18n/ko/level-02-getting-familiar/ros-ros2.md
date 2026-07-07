# ROS/ROS2

**ROS (Robot Operating System)** 는 운영체제가 아닙니다 — 발행/구독 미들웨어와 방대한 도구 및 패키지 생태계로, 로보틱스 소프트웨어의 공통 언어가 되었습니다. SLAM에서 ROS는 화려하지는 않지만 필수적인 배관 작업을 해결해 줍니다: 센서 데이터를 드라이버에서 알고리즘으로 전달하고, 좌표 프레임을 일관되게 유지하며, 데이터셋을 기록하고, 결과를 시각화하는 일입니다.

알아야 할 핵심 개념:

- **노드(Node)** — 서로 통신하는 프로세스들. 여러분의 SLAM 시스템은 일반적으로 하나의 노드이고, 각 센서 드라이버는 또 다른 노드입니다.
- **토픽과 메시지** — 타입이 지정된 발행/구독 채널. 자주 보게 될 것들: `sensor_msgs/Image`, `sensor_msgs/CameraInfo`, `sensor_msgs/Imu`, `sensor_msgs/PointCloud2`, `nav_msgs/Odometry`, `geometry_msgs/PoseStamped`.
- **TF (tf2)** — 좌표 프레임 트리. 모든 센서 및 본체 프레임(`map`, `odom`, `base_link`, `camera_link`, `imu_link`)은 타임스탬프가 찍힌 변환들로 이루어진 트리의 노드입니다. SLAM 시스템은 일반적으로 외부 파라미터(extrinsics)를 TF에서 *소비*하고, `map -> odom` 보정값을 *발행*합니다.
- **백(Bag)** — 기록된 메시지 스트림(`rosbag` / `ros2 bag`). EuRoC와 같은 데이터셋은 백 형태로 제공되며, 백을 재생하는 것이 SLAM 시스템을 결정론적으로 개발하고 벤치마킹하는 표준적인 방법입니다.
- **도구** — 궤적, 포인트 클라우드, TF의 3D 시각화를 위한 RViz; 인트로스펙션을 위한 `rqt`; 파라미터와 함께 다중 노드 시스템을 구동하기 위한 launch 파일.

**ROS 1 대 ROS 2**: ROS 1(마지막 릴리스: Noetic)은 수명이 끝났고, 새로운 개발은 **ROS 2**를 대상으로 합니다. ROS 2는 커스텀 전송 계층을 DDS로 대체하고, 서비스 품질(QoS) 제어를 추가하며(손실이 있는 무선 링크와 고속 센서에 결정적으로 중요합니다), 실시간에 친화적인 실행자(executor)를 지원하고, 여러 플랫폼에서 네이티브로 동작하며, 단일 마스터 아키텍처를 제거합니다. 위의 개념들은 거의 그대로 이어지며, API는 `rclcpp`(C++)와 `rclpy`(Python)입니다.

SLAM에 특화된 실용적인 작업 흐름은 다음과 같습니다: ROS를 전혀 모르는 라이브러리로 알고리즘을 작성한 다음, 센서 토픽을 구독하고 라이브러리에 데이터를 공급하며 오도메트리, TF 보정, 시각화 마커를 발행하는 얇은 ROS 래퍼 노드를 추가합니다. 이렇게 하면 알고리즘을 테스트 가능하고 이동 가능하게 유지할 수 있습니다 — ORB-SLAM3, VINS-Fusion, RTAB-Map 등 ROS 지원을 제공하는 대부분의 오픈소스 시스템이 사용하는 패턴입니다.

Python으로 작성된 최소한의 ROS 2 래퍼는 모든 SLAM 노드의 형태를 보여줍니다:

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

외워둘 만한 일상적인 명령어: `ros2 bag record -a` / `ros2 bag play <bag>`, `ros2 topic hz <topic>`(데이터가 실제로 들어오고 있는지, 어떤 속도로?), `ros2 topic echo`, `ros2 run tf2_tools view_frames`(TF 트리를 덤프), 그리고 배선 확인을 위한 `ros2 node info <node>`. 다중 센서 입력의 경우, `message_filters`가 이미지와 깊이 또는 IMU 배치를 짝지어주는 근사 시간 동기화기를 제공합니다.

## 흔한 함정

- **QoS 불일치 (ROS 2)** — best-effort 센서 발행자와 reliable QoS 구독자는 연결은 되지만 *아무것도 교환하지 않으며*, 에러 메시지도 없습니다. 센서 토픽에는 `qos_profile_sensor_data`를 사용하고 `ros2 topic info -v`로 확인하세요.
- **TF 오용** — `map -> odom` 대신 `map -> base_link`를 직접 발행하면 다운스트림 컨트롤러가 의존하는 오도메트리 계약이 깨집니다(연속적인 odom, 튀는 map 보정). 또한 TF에 가장 최근 발행 시점보다 더 최신인 변환을 요청할 때 발생하는 외삽 오류에도 주의해야 합니다.
- **타임스탬프** — 메시지에는 도착 시간이 아닌 *센서* 시간을 항상 찍고, 단일 클록 소스를 사용해야 합니다. 백을 재생할 때는 `use_sim_time`을 일관되게 사용하지 않으면 시간 기반 조회가 조용히 오작동합니다.
- **콜백 안에서 무거운 작업 수행** — 구독자 콜백 안의 추적 파이프라인은 실행자를 정체시키고 메시지를 누락시킵니다. 대신 워커 스레드/큐로 데이터를 넘기세요.
- **대역폭에 대한 무감각** — WiFi(또는 프로세스 간에도)를 통한 전체 해상도 비압축 이미지는 전송을 포화시킬 수 있습니다. 압축된 토픽, 컴포지션/프로세스 내 통신을 사용하거나, SLAM 노드를 드라이버와 같은 머신에서 실행하세요.

## SLAM에서의 의미

여러분이 배치하게 될 거의 모든 로봇이 ROS를 사용합니다: 센서 데이터는 ROS 토픽으로 도착하고, 외부 파라미터는 TF에 존재하며, 다운스트림 소비자(내비게이션, 계획)는 `nav_msgs/Odometry`와 `map` 프레임을 기대합니다. SLAM 시스템을 ROS 2 노드로 래핑하고, 백을 재생하며, RViz로 디버깅할 수 있는 능력은 연구와 산업 로보틱스 작업 모두에서 기본이 되는 역량입니다.

## 실습

- [ROS 기초](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_09)

## 관련 문서

- [Docker](docker.md)
- [Simulation](simulation.md)
- [C++](cpp.md)
- [Python](python.md)
