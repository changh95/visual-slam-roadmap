### キーコンセプト
- **[センサーからの深度取得](level-04-rgbd-slam/depth-from-sensor.md)** — ストラクチャードライト対アクティブIR(ToF);メトリックスケールが無償で得られる一方、測定範囲・対象素材に制約がある
- **[フレーム対モデルトラッキング](level-04-rgbd-slam/frame-to-model-tracking.md)** — フレーム間対応ではなく、各フレームを蓄積されたモデル([ICP](level-04-rgbd-slam/icp.md))に対して位置合わせする手法
- **[TSDF対サーフェルマップ](level-04-rgbd-slam/tsdf-vs-surfel-maps.md)** — 体積的な符号付き距離場融合(KinectFusion)対点ベースのサーフェル融合(ElasticFusion)

### RGB-Dカメラデバイス
- Intel RealSense Dシリーズ
- Orbbec Femtoシリーズ(Azure Kinectの後継)、Orbbec Astra
- Luxonis OAK-D
- レガシー(生産終了): Microsoft Kinect v1/v2、Azure Kinect DK、Occipital Structure Core

### GPGPUプログラミング
- [CUDA, OpenGL GLSL](level-04-rgbd-slam/gpgpu-programming.md)

### システム

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [ICP](level-04-rgbd-slam/icp.md) | [Besl & McKay 1992](https://ieeexplore.ieee.org/document/121791) | Iterative Closest Point、最近傍点対応、閉形式の剛体変換、局所収束(初期化が必要)、3D-3Dレジストレーションの基礎 |
| **DTAM** | Newcombe 2011 | → Level 3の直接法SLAMを参照 |
| [**KinectFusion**](level-04-rgbd-slam/kinectfusion.md) | [Newcombe 2011](https://ieeexplore.ieee.org/document/6162880) | GPGPU、トラッキング(深度を3Dへ投影、表面法線、coarse-to-fine ICP)、マッピング(体積的統合、TSDF)、小規模なシーン変化にロバスト、変形をモデル化できない、地図の成長が立方的、部屋サイズのみ対応 |
| [Double Window Optimisation](level-04-rgbd-slam/double-window-optimisation.md) | [Strasdat 2011](https://ieeexplore.ieee.org/document/6126517) | 内側ウィンドウ(ローカルBA)+外側ウィンドウ(ポーズグラフ)、共視グラフ、定数時間最適化 |
| [Kintinuous](level-04-rgbd-slam/kintinuous.md) | [Whelan 2012](https://ieeexplore.ieee.org/document/6907054) | ボリュームシフト、幾何、輝度、dBoW+SURF、最適化、ループクロージング |
| [RGBD-SLAM-V2](level-04-rgbd-slam/rgbd-slam-v2.md) | [Endres 2013](https://felixendres.github.io/rgbdslam_v2/) | トラッキング(カラー画像、視覚特徴、深度画像、点群、変換)、マッピング(OctoMap 2013) |
| [SLAM++](level-04-rgbd-slam/slampp.md) | [Salas-Moreno 2013](https://ieeexplore.ieee.org/document/6619022) | オブジェクト指向SLAM |
| [DVO](level-04-rgbd-slam/dvo.md) | [Kerl 2013](https://vision.in.tum.de/data/software/dvo) | キーフレーム、深度、直接法、最適化、ループクロージング |
| [**RTAB-Map**](level-04-rgbd-slam/rtab-map.md) | [Labbé 2014](https://introlab.github.io/rtabmap/) | ループクロージング、地図統合、マルチセッションのメモリ管理 |
| [MRS-Map](level-04-rgbd-slam/mrs-map.md) | [Stückler 2014](https://doi.org/10.1016/j.jvcir.2013.02.008) | Octree内のマルチ解像度サーフェルマップ、サーフェルごとの形状・色統計、ノイズを考慮したRGB-Dレジストレーション、CPUでリアルタイム動作 |
| [**ElasticFusion**](level-04-rgbd-slam/elasticfusion.md) | [Whelan 2015](https://ieeexplore.ieee.org/document/7274882) | アクティブ:フレーム対モデルトラッキング(輝度+幾何)、同時最適化、融合されたサーフェルベースのモデル再構成 · 非アクティブ:ローカルループクロージング(モデル対モデルの局所表面、サブモデル分離)、グローバルループクロージング(ランダム化Fern符号化、非剛体空間変形) |
| [DynamicFusion](level-04-rgbd-slam/dynamicfusion.md) | [Newcombe 2015](https://ieeexplore.ieee.org/document/7298631) | 6次元運動場、変形可能なシーン |
| **ORB-SLAM2**(RGB-Dモード) | Mur-Artal 2017 | バンドル調整、疎な再構成(→ Level 3にも掲載) |
| [**BundleFusion**](level-04-rgbd-slam/bundlefusion.md) | [Dai 2016](https://arxiv.org/abs/1604.01093) | ローカルからグローバルへの最適化、疎なRGB特徴、粗いグローバル姿勢推定、精密な姿勢のリファインメント(幾何+輝度) |
| [SemanticFusion](level-04-rgbd-slam/semanticfusion.md) | [McCormac 2016](https://arxiv.org/abs/1609.05130) | 深層学習CNN、深層セマンティックSLAM |
| [InfiniTAM v3](level-04-rgbd-slam/infinitam-v3.md) | [Prisacariu 2017](https://arxiv.org/abs/1708.00783) | トラッキング(シーンのレイキャスト、深度画像、RGB画像)、リローカリゼーション(ランダムFern)、マッピング(TSDF再構成、ボクセルハッシング、サーフェル再構成) |
| [Fusion++](level-04-rgbd-slam/fusionpp.md) | [McCormac & Clark 2018](https://arxiv.org/abs/1808.08378) | 深層学習CNN、Mask-RCNNによるインスタンスセグメンテーション、物体レベルSLAM、事前形状なし、物体レベルTSDF再構成 |
| [PointFusion / DenseFusion](level-04-rgbd-slam/pointfusion-densefusion.md) | [Xu 2018](https://arxiv.org/abs/1711.10871) / [Wang 2019](https://arxiv.org/abs/1901.04780) | RGB-Dによる物体の6自由度姿勢推定、点群+画像特徴の融合(物体レベルSLAMのための物体フロントエンド) |
| [BAD SLAM](level-04-rgbd-slam/bad-slam.md) | [Schöps 2019](https://openaccess.thecvf.com/content_CVPR_2019/html/Schops_BAD_SLAM_Bundle_Adjusted_Direct_RGB-D_SLAM_CVPR_2019_paper.html) | 直接RGB-Dバンドル調整、サーフェルマップ、リアルタイムGPU BA、ETH3Dベンチマーク |
| [**RTAB-Map**](level-04-rgbd-slam/rtab-map.md)(RGB-D / LiDAR) | [Labbé 2019](https://doi.org/10.1002/rob.21831) | マルチセンサーRGB-D/LiDAR対応、光源検出(2016) |
| [**MoreFusion**](level-04-rgbd-slam/morefusion.md) | [Wada 2020](https://arxiv.org/abs/2004.04336) | 深層学習によるインスタンスセグメンテーション、物体レベルの体積融合、体積的姿勢予測、3次元シーン再構成、衝突を考慮したリファインメント、セマンティックSLAM、物体姿勢推定、CADモデルのフィッティング |
| **NodeSLAM** | Sucar 2020 | Occupancy VAE、物体レベルSLAM(→ Level 5の潜在表現にも掲載) |
| [**DSP-SLAM**](level-04-rgbd-slam/dsp-slam.md) | [Wang (UCL) 2021](https://arxiv.org/abs/2108.09481) | DeepSDF形状事前分布+ORB-SLAM2、物体レベルの高密度再構成(モノキュラ/ステレオ/LiDAR) |
