### キーコンセプト
- **[密結合対疎結合](level-06-vio-vins/tightly-coupled-vs-loosely-coupled.md)** — 視覚情報と慣性情報を同時に最適化するか、個別に最適化するか
- **[フィルタベース対最適化ベース](level-06-vio-vins/filter-based-vs-optimization-based.md)** — EKFアプローチ対非線形最適化(BA)
- **[IMUプリインテグレーション](level-06-vio-vins/imu-preintegration.md)** — キーフレーム間でIMU観測値を積分する手法(Lupton 2012;多様体上での形式化: Forster 2015)
- **[IMUノイズモデル](level-06-vio-vins/imu-noise-model.md)** — バイアス、ランダムウォーク、Allan分散
- **[可観測性](level-06-vio-vins/observability.md)** — VIOには観測不能な4自由度が存在する(3自由度のグローバル並進+ヨー角);等加速度運動下ではスケールも追加的に観測不能になる
- **[実運用されているVIO](level-06-vio-vins/deployed-vio.md)** — 商用XRスタック(Meta Quest、ARKit/ARCore)は最も広く展開されているVIOシステムであり、ケーススタディとして学ぶ価値がある

### 基礎

| リソース | 著者/年 | キーコンセプト |
|----------|-------------|--------------|
| [**Introduction to Inertial Navigation**](level-06-vio-vins/introduction-to-inertial-navigation.md) | [Woodman 2007](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-696.html) | IMUの基礎、座標系、誤差要因 — 必須の前提知識 |
| [IMU Preintegration on Manifold](level-06-vio-vins/imu-preintegration-on-manifold.md) | [Forster 2015](https://arxiv.org/abs/1512.02363) | 多様体上でのプリインテグレーション、再積分不要のバイアス補正 |
| [Quaternion kinematics for error-state KF](level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md) | [Solà 2017](https://arxiv.org/abs/1711.02508) | クォータニオンの数学、誤差状態表現 |

### フィルタベース

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**MSCKF**](level-06-vio-vins/msckf.md) | [Mourikis 2007](https://ieeexplore.ieee.org/document/4209642) | Multi-State Constraint KF、状態にランドマークを持たない効率的なVIO |
| [ROVIO](level-06-vio-vins/rovio.md) | [Bloesch 2015](https://github.com/ethz-asl/rovio) | ロボット中心のVIO、直接輝度トラッキング+EKF |
| [**OpenVINS**](level-06-vio-vins/openvins.md) | [Geneva 2020](https://docs.openvins.com/) | オープンソースのMSCKF、モジュール式、拡張可能 |

### 最適化ベース

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [OKVIS](level-06-vio-vins/okvis.md) | [Leutenegger 2015](https://journals.sagepub.com/doi/10.1177/0278364914554813) | キーフレームベース、密結合、スライディングウィンドウ最適化 |
| [**VINS-Mono**](level-06-vio-vins/vins-mono.md) | [Qin 2018](https://arxiv.org/abs/1708.03852) | 密結合、リローカリゼーション、ループクロージング、ポーズグラフ最適化 |
| [VI-DSO](level-06-vio-vins/vi-dso.md) | [von Stumberg 2018](https://arxiv.org/abs/1804.05625) | 直接疎VIO、動的マージナライゼーション、輝度誤差 |
| [VINS-Fusion](level-06-vio-vins/vins-fusion.md) | [Qin 2019](https://arxiv.org/abs/1901.03638) | ステレオ+GPS融合の拡張 |
| [maplab](level-06-vio-vins/maplab.md) | [Schneider 2018](https://arxiv.org/abs/1711.10250) | マルチセッション視覚慣性マッピングフレームワーク |
| [**Kimera-VIO**](level-06-vio-vins/kimera-vio.md) | [Rosinol 2020](https://arxiv.org/abs/1910.02490) | Kimeraパイプライン向けの高速VIOフロントエンド、structureless視覚ファクター |
| [Basalt](level-06-vio-vins/basalt.md) | [Usenko 2020](https://arxiv.org/abs/1904.06504) | マージナライゼーション事前分布の非線形ファクター復元(NFR)、視覚慣性オドメトリ+マッピング |
| [**ORB-SLAM3**](level-03-monocular-slam/orb-slam3.md) | [Campos 2020](https://arxiv.org/abs/2007.11898) | VIOモード、マルチマップ、IMU初期化 |
| [**DM-VIO**](level-06-vio-vins/dm-vio.md) | [von Stumberg 2022](https://arxiv.org/abs/2201.04114) | 直接法(DSOベース)のモノキュラVIO、遅延マージナライゼーション、IMU初期化のためのポーズグラフBA |
| [**OKVIS2**](level-06-vio-vins/okvis2.md) | [Leutenegger 2022](https://arxiv.org/abs/2202.09199) | マルチセッション、改良されたマージナライゼーション |
| [AirVO](level-06-vio-vins/airvo.md) | [Xu 2023](https://arxiv.org/abs/2212.07595) | 点・線VIO、照明変化にロバスト |
| [**OKVIS2-X**](level-06-vio-vins/okvis2-x.md) | [Boche & Leutenegger 2025](https://arxiv.org/abs/2510.04612) | マルチセンサーSLAM(視覚+慣性+深度+LiDAR+GNSS)、高密度な体積占有地図、大規模環境向けのサブマッピング(9km以上)、EuRoC/Hilti22でSOTA |
