### キーコンセプト
- **[ステレオレクティフィケーション](level-07-stereo-slam/stereo-rectification.md)** — 効率的な視差探索のためのエピポーラアライメント
- **[視差対深度](level-07-stereo-slam/disparity-vs-depth.md)** — d = f·B/Z、ベースラインが深度の範囲・精度を決定する
- **[スケールの可観測性](level-07-stereo-slam/scale-observability.md)** — ステレオはメトリックスケールを提供する(モノキュラとは異なる)

### システム

| システム | 著者/年 | キーコンセプト |
|--------|-------------|--------------|
| [**S-PTAM**](level-07-stereo-slam/s-ptam.md) | [Pire 2017](https://github.com/lrse/sptam) | ステレオ版PTAM、ROS対応、リアルタイム |
| [**ORB-SLAM2**](level-03-monocular-slam/orb-slam2.md) (stereo) | [Mur-Artal 2017](https://arxiv.org/abs/1610.06475) | ステレオ+RGB-Dモード、ループクロージング、リローカリゼーション |
| [**StereoMSCKF**](level-07-stereo-slam/stereomsckf.md) | [Sun 2018](https://arxiv.org/abs/1712.00036) | ステレオ対応MSCKF、リソース制約のあるプラットフォームでも効率的 |
| [**RTAB-Map**](level-04-rgbd-slam/rtab-map.md) | [Labbé 2019](https://ieeexplore.ieee.org/document/6942560) | マルチセンサー(ステレオ/RGB-D/LiDAR)、メモリ管理、大規模環境対応(→ Level 4にも掲載) |
| [**ORB-SLAM3**](level-03-monocular-slam/orb-slam3.md) (stereo) | [Campos 2020](https://arxiv.org/abs/2007.11898) | マルチマップ、Atlas、ステレオ+IMU |
| [**Stella-VSLAM**](level-03-monocular-slam/stella-vslam.md) | [Community 2021](https://github.com/stella-cv/stella_vslam) | OpenVSLAMの後継、ステレオ対応(→ Level 3にも掲載) |
| [**Stereo DSO**](level-07-stereo-slam/stereo-dso.md) | [Wang 2017](https://arxiv.org/abs/1708.07878) | 直接疎ステレオオドメトリ、大規模環境対応(DSOの拡張) |
