### 핵심 개념
- **[스테레오 정류(rectification)](level-07-stereo-slam/stereo-rectification.md)** — 효율적인 시차 탐색을 위한 에피폴라 정렬
- **[시차 vs 깊이](level-07-stereo-slam/disparity-vs-depth.md)** — d = f·B/Z, 기준선(baseline)이 깊이 범위/정확도를 결정
- **[스케일 관측 가능성](level-07-stereo-slam/scale-observability.md)** — 스테레오는 (단안과 달리) 미터 스케일을 제공

### 시스템

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**S-PTAM**](level-07-stereo-slam/s-ptam.md) | [Pire 2017](https://github.com/lrse/sptam) | 스테레오 PTAM, ROS 호환, 실시간 |
| [**ORB-SLAM2**](level-03-monocular-slam/orb-slam2.md) (스테레오) | [Mur-Artal 2017](https://arxiv.org/abs/1610.06475) | 스테레오 + RGB-D 모드, 루프 클로저, 재지역화 |
| [**StereoMSCKF**](level-07-stereo-slam/stereomsckf.md) | [Sun 2018](https://arxiv.org/abs/1712.00036) | 스테레오를 적용한 MSCKF, 자원이 제한된 플랫폼에 효율적 |
| [**RTAB-Map**](level-04-rgbd-slam/rtab-map.md) | [Labbé 2019](https://ieeexplore.ieee.org/document/6942560) | 다중 센서(스테레오/RGB-D/LiDAR), 메모리 관리, 대규모 (→ 레벨 4에도 등장) |
| [**ORB-SLAM3**](level-03-monocular-slam/orb-slam3.md) (스테레오) | [Campos 2020](https://arxiv.org/abs/2007.11898) | 다중 맵, Atlas, 스테레오 + IMU |
| [**Stella-VSLAM**](level-03-monocular-slam/stella-vslam.md) | [커뮤니티 2021](https://github.com/stella-cv/stella_vslam) | OpenVSLAM 후속, 스테레오 지원 (→ 레벨 3에도 등장) |
| [**Stereo DSO**](level-07-stereo-slam/stereo-dso.md) | [Wang 2017](https://arxiv.org/abs/1708.07878) | 직접 희소 스테레오 오도메트리, 대규모 (DSO 확장) |
