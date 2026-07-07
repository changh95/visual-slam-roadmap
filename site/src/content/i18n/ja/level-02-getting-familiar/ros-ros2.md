# ROS/ROS2

**ROS (Robot Operating System)** はオペレーティングシステムではない。パブリッシュ/サブスクライブ型のミドルウェアと、巨大なツール・パッケージ群のエコシステムであり、ロボティクスソフトウェアの共通言語となっている。SLAMにおいて、ROSは地味だが不可欠な配管作業を解決する。つまり、センサデータをドライバからアルゴリズムへ渡し、座標フレームを整合させ、データセットを記録し、結果を可視化することだ。

必要な中心概念:

- **ノード (Nodes)** — 互いに通信するプロセス。SLAMシステムは通常1つのノードで、各センサドライバがそれぞれ別のノードになる。
- **トピックとメッセージ (Topics and messages)** — 型付きのパブリッシュ/サブスクライブチャンネル。よく目にするものは `sensor_msgs/Image`、`sensor_msgs/CameraInfo`、`sensor_msgs/Imu`、`sensor_msgs/PointCloud2`、`nav_msgs/Odometry`、`geometry_msgs/PoseStamped` である。
- **TF (tf2)** — 座標フレームの木構造。すべてのセンサおよび機体フレーム(`map`、`odom`、`base_link`、`camera_link`、`imu_link`)は、タイムスタンプ付き変換の木の中のノードである。SLAMシステムは通常TFから外部パラメータ(extrinsics)を*受け取り*、`map -> odom` の補正を*発行*する。
- **バグ (Bags)** — 記録されたメッセージストリーム(`rosbag` / `ros2 bag`)。EuRoCのようなデータセットはバグとして提供され、バグを再生することがSLAMシステムを決定論的に開発・ベンチマークする標準的な方法である。
- **ツール (Tools)** — 軌跡、点群、TFの3D可視化にはRViz、内部確認には`rqt`、複数ノードシステムをパラメータ付きで立ち上げるにはlaunchファイルを使う。

**ROS 1 対 ROS 2**: ROS 1(最終リリースはNoetic)はサポートが終了しており、新規開発はすべて**ROS 2**を対象とする。ROS 2は独自トランスポートをDDSに置き換え、QoS(サービス品質)制御(不安定な無線リンクや高頻度センサにとって重要)を追加し、リアルタイムに適したエグゼキュータをサポートし、複数プラットフォームでネイティブに動作し、単一マスター構成を廃止した。上記の概念はほぼそのまま引き継がれ、APIは`rclcpp`(C++)と`rclpy`(Python)である。

SLAMに特化した実務上のワークフローは次の通りである。ROSを一切意識しないライブラリとしてアルゴリズムを書き、センサトピックをサブスクライブしてライブラリに渡し、オドメトリ、TF補正、可視化マーカーを発行する薄いROSラッパーノードを追加する。これによりアルゴリズムはテスト可能かつ移植可能になる。これはORB-SLAM3、VINS-Fusion、RTAB-Mapなど、ROSサポートを提供するほとんどのオープンソースシステムで使われているパターンである。

Pythonによる最小限のROS 2ラッパーは、すべてのSLAMノードの基本形を示している。

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

覚えておくべき日常的なコマンド: `ros2 bag record -a` / `ros2 bag play <bag>`、`ros2 topic hz <topic>`(データが実際にどのレートで届いているか)、`ros2 topic echo`、`ros2 run tf2_tools view_frames`(TFツリーをダンプする)、配線確認のための`ros2 node info <node>`。複数センサ入力の場合、`message_filters`が画像とデプス、あるいはIMUバッチをペアリングするための近似時間同期器を提供する。

## よくある落とし穴

- **QoSの不一致(ROS 2)** — ベストエフォートのセンサパブリッシャと信頼性重視(reliable)QoSのサブスクライバは接続はするが*何も交換されない*、しかもエラーメッセージは出ない。センサトピックには`qos_profile_sensor_data`を使い、`ros2 topic info -v`で確認すること。
- **TFの誤用** — `map -> odom`の代わりに`map -> base_link`を直接発行すると、下流のコントローラが依存するオドメトリの契約(連続的なodom、飛躍するmap補正)が破壊される。また、TFに対して最新の発行済み変換より新しい時刻の変換を要求すると外挿誤差が発生する点にも注意。
- **タイムスタンプ** — メッセージには常に到着時刻ではなく*センサ*時刻を刻み、単一のクロックソースを使うこと。バグを再生する際は`use_sim_time`を一貫して使わないと、時間ベースのルックアップがすべて静かに誤動作する。
- **コールバック内での重い処理** — サブスクライバのコールバック内にトラッキングパイプラインを置くとエグゼキュータが停止し、メッセージが落ちる。データはワーカースレッド/キューに渡すこと。
- **帯域幅への無自覚** — WiFi(あるいはプロセス間でも)経由で非圧縮フル解像度画像を送るとトランスポートが飽和しうる。圧縮トピック、コンポジション/プロセス内通信を使うか、SLAMノードをドライバと同じマシン上で動かすこと。

## SLAMにおける意義

これから展開するほとんどのロボットはROSを話す。センサデータはROSトピックとして届き、外部パラメータはTFに存在し、下流の利用者(ナビゲーション、プランニング)は`nav_msgs/Odometry`と`map`フレームを期待する。SLAMシステムをROS 2ノードにラップし、バグを再生し、RViz でデバッグできることは、研究と産業ロボティクスの両方における基礎スキルである。

## ハンズオン

- [ROSの基礎](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_09)

## 関連ノート

- [Docker](docker.md)
- [Simulation](simulation.md)
- [C++](cpp.md)
- [Python](python.md)
