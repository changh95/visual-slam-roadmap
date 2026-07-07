### キーコンセプト
- **[LiDAR-Visual-Inertial(LVI)](level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)** — ロバストな屋外SLAMのための三重融合
- **[密結合LiDAR-カメラ](level-09-lidar-visual-lidar-slam/tightly-coupled-lidar-camera.md)** — 点群と視覚特徴の同時最適化
- **[直接LiDAR-カメラアライメント](level-09-lidar-visual-lidar-slam/direct-lidar-camera-alignment.md)** — 特徴抽出を行わない輝度/幾何アライメント
- **[劣化への対応](level-09-lidar-visual-lidar-slam/degradation-handling.md)** — 一方のモダリティが機能しない場合の優雅なフォールバック(例:雨天時のLiDAR、暗所でのカメラ)
- **[レンジ画像](level-09-lidar-visual-lidar-slam/range-image.md)** — 効率的な処理のためのLiDARスキャンの2次元投影(SuMa、RangeNet++)

### LiDAR / LiDAR慣性SLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**LOAM**](level-09-lidar-visual-lidar-slam/loam.md) | [Zhang 2014](https://www.ri.cmu.edu/pub_files/2014/7/Ji_LidarMapping_RSS2014_v8.pdf) | LiDARオドメトリとマッピング(基礎的研究)、エッジ特徴+平面特徴 |
| [**SuMa**](level-09-lidar-visual-lidar-slam/suma.md) | [Behley (Bonn) 2018](http://www.roboticsproceedings.org/rss14/p16.pdf) | サーフェルベースのLiDAR SLAM、レンジ画像上での射影ICP |
| [**SuMa++**](level-09-lidar-visual-lidar-slam/sumapp.md) | [Chen (Bonn) 2019](https://www.ipb.uni-bonn.de/pdfs/chen2019iros.pdf) | SuMa+RangeNet++によるセマンティック情報、セマンティックICP重み付け、動的物体のフィルタリング |
| [**LIO-SAM**](level-09-lidar-visual-lidar-slam/lio-sam.md) | [Shan 2020](https://arxiv.org/abs/2007.00258) | 密結合LiDAR慣性、ファクターグラフ、GPS融合 |
| [**FAST-LIO2**](level-09-lidar-visual-lidar-slam/fast-lio2.md) | [Xu 2022](https://arxiv.org/abs/2107.06829) | 直接法によるLiDAR慣性、ikd-Tree、極めて高速 |
| [**PIN-SLAM**](level-09-lidar-visual-lidar-slam/pin-slam.md) | [Pan (Bonn) 2024](https://arxiv.org/abs/2401.09101) | ニューラル点群によるLiDAR SLAM、point-to-SDFレジストレーション、ループクロージングのための弾性地図変形 |

### Visual-LiDAR融合SLAM

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**LVI-SAM**](level-09-lidar-visual-lidar-slam/lvi-sam.md) | [Shan 2021](https://arxiv.org/abs/2104.10831) | ファクターグラフによるLiDAR-Visual-Inertial、LIO-SAM+VINS-Mono |
| [**R3LIVE**](level-09-lidar-visual-lidar-slam/r3live.md) | [Lin 2022](https://arxiv.org/abs/2109.07982) | リアルタイムLiDAR-Visual-Inertial、高密度RGB点群地図 |
| [**R3LIVE++**](level-09-lidar-visual-lidar-slam/r3livepp.md) | [Lin 2023](https://arxiv.org/abs/2209.03666) | メッシュ再構成を伴う改良版R3LIVE |
| [**FAST-LIVO**](level-09-lidar-visual-lidar-slam/fast-livo.md) | [Zheng 2022](https://arxiv.org/abs/2203.00893) | FAST-LIO+直接ビジュアルオドメトリ、密結合LVI |
| [**FAST-LIVO2**](level-09-lidar-visual-lidar-slam/fast-livo2.md) | [Zheng 2024](https://arxiv.org/abs/2408.14035) | 改良版、逐次的な画像処理、直接輝度融合 |
| [**OKVIS2-X**](level-06-vio-vins/okvis2-x.md) | [Boche 2025](https://arxiv.org/abs/2510.04612) | 視覚+慣性+深度+LiDAR+GNSSの構成が可能(Level 6にも掲載) |

### リソース

| リソース | 著者/年 | キーコンセプト |
|----------|-------------|--------------|
| [Multi-Sensor Fusion SLAM Survey](level-09-lidar-visual-lidar-slam/multi-sensor-fusion-slam-survey.md) | [Zhu 2024](https://www.sciopen.com/article/10.26599/TST.2023.9010010) | カメラ+LiDAR+IMU融合SLAM — 包括的サーベイ |
