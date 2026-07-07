### プログラミング(コア)
- **[C++](level-02-getting-familiar/cpp.md)**: OOP、モダンC++、データ構造とアルゴリズム、コンパイラ、CMake/Makefile/Ninja、デザインパターン、OpenCV C++
- **[C](level-02-getting-familiar/c.md)**
- **[Git/GitHub](level-02-getting-familiar/git-github.md)**
- **[OpenCV](level-02-getting-familiar/opencv.md)** (opencv-python)
- **[Python](level-02-getting-familiar/python.md)**: 深層学習、グラフ描画、システムスクリプト
- **[Bash/Linux](level-02-getting-familiar/bash-linux.md)**: ssh、CLIテキストエディタ/Vim/tmux
- **[数学ライブラリ](level-02-getting-familiar/math-libraries.md)**: Eigen、Ceres-solver/GTSAM/g2o
- **[C++/Python相互運用](level-02-getting-familiar/cpp-python-interop.md)**: PyBind11、nanobind
- **[ROS/ROS2](level-02-getting-familiar/ros-ros2.md)**
- **[Docker](level-02-getting-familiar/docker.md)**

### プログラミング(任意 — SLAM関連職に役立つエンジニアリングスキル)
- **[並行処理](level-02-getting-familiar/concurrency.md)**: SIMD-SSE/AVX/Neon、OpenMP、CUDA
- **[エッジデプロイ](level-02-getting-familiar/edge-deployment.md)**: 学習済みフロントエンドのTensorRT/ONNXエクスポート、Jetsonでのベンチマーク
- **[モバイル](level-02-getting-familiar/mobile.md)**: Android(Java/Kotlin)、iOS(Objective-C/Swift)
- **[C#](level-02-getting-familiar/csharp.md)**: Unity AR、Microsoft HoloLens
- **[CI/CD](level-02-getting-familiar/ci-cd.md)**: GitHub Actions
- **[シミュレーション](level-02-getting-familiar/simulation.md)**: Gazebo、Isaac Sim

### 画像処理
- **[特徴点](level-02-getting-familiar/keypoints.md)** → 検出器・記述子
  - [SIFT](level-02-getting-familiar/sift.md)、[FAST](level-02-getting-familiar/fast.md)、[ORB](level-02-getting-familiar/orb.md)、[AKAZE](level-02-getting-familiar/akaze.md)
  - 深層特徴: [R2D2](level-05-deep-learning/r2d2.md)、[SuperPoint](level-05-deep-learning/superpoint.md)
- [画像ピラミッド](level-02-getting-familiar/image-pyramid.md)、[oFAST](level-02-getting-familiar/orb.md)、[rBRIEF](level-02-getting-familiar/orb.md)

### ローカル特徴マッチング
- [Brute-Force](level-02-getting-familiar/brute-force-matching.md)、[FLANN](level-02-getting-familiar/flann.md)、[Kd-Tree](level-02-getting-familiar/kd-tree.md)
- [LSH](level-02-getting-familiar/lsh.md)、[Multi-probe LSH](level-02-getting-familiar/lsh.md)、[HBST](level-02-getting-familiar/hbst.md)
- [SuperGlue](level-05-deep-learning/superglue.md)

### グローバル特徴マッチング
- [Bag of Visual Words](level-02-getting-familiar/bag-of-visual-words.md)、[NetVLAD](level-05-deep-learning/netvlad.md)
- [Deep image retrieval](level-02-getting-familiar/deep-image-retrieval.md)、[Hierarchical localization](level-05-deep-learning/hloc.md)

### 特徴点追跡
- [オプティカルフロー](level-02-getting-familiar/optical-flow.md)、[KLTトラッカー](level-02-getting-familiar/klt-tracker.md)

### 多視点幾何学
- **[2D-2D対応](level-02-getting-familiar/2d-2d-correspondence.md)**: [Essential/Fundamental](level-01-beginner/epipolar-geometry.md)、[Homography](level-01-beginner/epipolar-geometry.md)
- **[2D-3D対応](level-02-getting-familiar/2d-3d-correspondence.md)**: [P3P](level-02-getting-familiar/pnp.md)、[PnP](level-02-getting-familiar/pnp.md)、[SVD](level-01-beginner/svd.md)
- **[3D-3D対応](level-02-getting-familiar/3d-3d-correspondence.md)**: [ICP](level-04-rgbd-slam/icp.md)

### 外れ値除去
- [RANSAC](level-02-getting-familiar/ransac.md)、[PROSAC](level-02-getting-familiar/prosac.md)、[M-Estimator](level-02-getting-familiar/m-estimator.md)、[MAXCON](level-02-getting-familiar/maxcon.md)、[凸緩和](level-02-getting-familiar/convex-relaxation.md)
- **[ロバストなポーズグラフ最適化](level-02-getting-familiar/robust-pose-graph-optimization.md)**: 切替可能制約(Switchable constraints)、動的共分散スケーリング(DCS)、ペアワイズ整合性最大化(PCM)

### 最小二乗最適化
- [再投影誤差](level-02-getting-familiar/reprojection-error.md)、[バンドル調整](level-02-getting-familiar/bundle-adjustment.md)
- [非線形最適化](level-02-getting-familiar/non-linear-optimization.md)、[リー代数](level-02-getting-familiar/lie-groups.md)
- **[リー群](level-02-getting-familiar/lie-groups.md)**: SO(3)、SE(3)
- [ガウス・ニュートン法](level-02-getting-familiar/gauss-newton.md)、[レーベンバーグ・マルカート法](level-02-getting-familiar/levenberg-marquardt.md)
- **[ポーズグラフ最適化](level-02-getting-familiar/pose-graph-optimization.md)**
- **[シュア補行列・疎性](level-02-getting-familiar/schur-complement-sparsity.md)**

### 運動モデル
- **[内部センサー(プロプリオセプティブセンサー)](level-02-getting-familiar/proprioceptive-sensor.md)**: IMU、車輪
- **[オドメトリ](level-02-getting-familiar/odometry.md)** (姿勢)

### 観測モデル
- **[外部センサー(エクステロセプティブセンサー)](level-02-getting-familiar/exteroceptive-sensor.md)**: カメラ、LiDAR
- **[ランドマーク](level-02-getting-familiar/landmark.md)** (地図)
- [同時最適化](level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)、[最尤推定(MLE)と最大事後確率推定(MAP)](level-02-getting-familiar/mle-and-map.md)

### ファクターグラフ最適化
- **[ファクターグラフ](level-02-getting-familiar/factor-graph.md)**: SLAMを変数(姿勢、ランドマーク)とファクター(観測)からなる二部グラフとして表現する
- **[疎な非線形最小二乗としてのMAP推定](level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)**;変数消去とベイズ木
- **[インクリメンタルスムージング](level-02-getting-familiar/incremental-smoothing.md)**: iSAM / iSAM2
- **[マージナライゼーション(周辺化)](level-02-getting-familiar/marginalization.md)** と固定ラグスムージング
- 参考文献: [Dellaert & Kaess, *Factor Graphs for Robot Perception* (2017)](https://www.cs.cmu.edu/~kaess/pub/Dellaert17fnt.pdf); GTSAMチュートリアル

### マッピング
- [点群](level-02-getting-familiar/point-cloud.md)、[占有格子マッピング](level-02-getting-familiar/occupancy-grid-mapping.md)、[TSDF](level-04-rgbd-slam/tsdf-vs-surfel-maps.md)、[サーフェル](level-04-rgbd-slam/tsdf-vs-surfel-maps.md)、[ボクセルマップ](level-02-getting-familiar/voxel-map.md)

### センサー
- **[カメラデバイス](level-02-getting-familiar/camera-device.md)**: 広角/テレセントリックレンズ、レンズMTF、CCD/CMOS、ローリング/グローバルシャッター、露出/ISO、[ステレオビジョン](level-01-beginner/stereo-vision.md)、[RGB-D](level-04-rgbd-slam/depth-from-sensor.md)、[ストラクチャードライト](level-04-rgbd-slam/depth-from-sensor.md)、[アクティブIR/ToF](level-04-rgbd-slam/depth-from-sensor.md)
- **[LiDAR](level-02-getting-familiar/lidar.md)** → [Visual-LiDAR融合](level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)
- **[IMU](level-02-getting-familiar/imu.md)** → VIO
- **[RADAR](level-02-getting-familiar/radar.md)** → [センサー](level-02-getting-familiar/camera-device.md)融合、[拡張カルマンフィルタ](level-02-getting-familiar/extended-kalman-filter.md)
- **[ソナー](level-02-getting-familiar/sonar.md)**
- **[マルチセンサーキャリブレーション](level-02-getting-familiar/multi-sensor-calibration.md)**: Camera-IMU、Camera-LiDAR([Kalibr](https://github.com/ethz-asl/kalibr))

### 評価
- **[評価指標](level-02-getting-familiar/metrics.md)**: ATE(絶対軌跡誤差)、RPE(相対姿勢誤差)
- **[一貫性](level-02-getting-familiar/consistency.md)**: NEES(正規化推定誤差平方)
- **データセット**: [KITTI](https://www.cvlibs.net/datasets/kitti/)、[TUM RGB-D](https://cvg.cit.tum.de/data/datasets/rgbd-dataset)、[EuRoC](https://projects.asl.ethz.ch/datasets/euroc-mav/)、[TartanAir](https://arxiv.org/abs/2003.14338)、[TUM-VI](https://arxiv.org/abs/1804.06120)、[4Seasons](https://arxiv.org/abs/2009.06364)、[Hilti SLAM Challenge](https://hilti-challenge.com/)、[Newer College](https://arxiv.org/abs/2003.05691)、[Project Aria](https://www.projectaria.com/)
- **ツール**: [evo](https://github.com/MichaelGrupp/evo) (軌跡評価)
