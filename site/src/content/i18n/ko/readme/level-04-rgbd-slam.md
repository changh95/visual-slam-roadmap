### 핵심 개념
- **[센서로부터의 깊이](level-04-rgbd-slam/depth-from-sensor.md)** — 구조광 vs 능동 IR(ToF); 별도 작업 없이 미터 스케일을 확보하지만, 거리/재질에 제약이 있음
- **[프레임-대-모델 추적](level-04-rgbd-slam/frame-to-model-tracking.md)** — 프레임 간 정렬 대신 각 프레임을 누적된 모델에 대해 정렬([ICP](level-04-rgbd-slam/icp.md))
- **[TSDF vs 서펠 맵](level-04-rgbd-slam/tsdf-vs-surfel-maps.md)** — 볼류메트릭 signed-distance 융합(KinectFusion) vs 점 기반 서펠 융합(ElasticFusion)

### RGB-D 카메라 장치
- Intel RealSense D 시리즈
- Orbbec Femto 시리즈(Azure Kinect 후속), Orbbec Astra
- Luxonis OAK-D
- 레거시(단종): Microsoft Kinect v1/v2, Azure Kinect DK, Occipital Structure Core

### GPGPU 프로그래밍
- [CUDA, OpenGL GLSL](level-04-rgbd-slam/gpgpu-programming.md)

### 시스템

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [ICP](level-04-rgbd-slam/icp.md) | [Besl & McKay 1992](https://ieeexplore.ieee.org/document/121791) | Iterative Closest Point, 최근접점 대응, 닫힌 형태의 강체 변환, 지역적 수렴(초기화 필요), 3D-3D 정합의 토대 |
| **DTAM** | Newcombe 2011 | → 레벨 3 직접 방법 SLAM 참고 |
| [**KinectFusion**](level-04-rgbd-slam/kinectfusion.md) | [Newcombe 2011](https://ieeexplore.ieee.org/document/6162880) | GPGPU, 추적(깊이를 3D로 투영, 표면 법선, 거친-세밀 ICP), 매핑(볼류메트릭 통합, TSDF), 작은 장면 변화에 강건, 변형 모델링 불가, 맵 증가가 3차식, 실내 방 크기 규모만 가능 |
| [Double Window Optimisation](level-04-rgbd-slam/double-window-optimisation.md) | [Strasdat 2011](https://ieeexplore.ieee.org/document/6126517) | 내부 윈도우(로컬 BA) + 외부 윈도우(포즈 그래프), 공시야성 그래프, 상수 시간 최적화 |
| [Kintinuous](level-04-rgbd-slam/kintinuous.md) | [Whelan 2012](https://ieeexplore.ieee.org/document/6907054) | 볼륨 시프트, 기하학적, 광도적, dBoW+SURF, 최적화, 루프 클로저 |
| [RGBD-SLAM-V2](level-04-rgbd-slam/rgbd-slam-v2.md) | [Endres 2013](https://felixendres.github.io/rgbdslam_v2/) | 추적(컬러 이미지, 시각 특징, 깊이 이미지, 포인트 클라우드, 변환), 매핑(OctoMap 2013) |
| [SLAM++](level-04-rgbd-slam/slampp.md) | [Salas-Moreno 2013](https://ieeexplore.ieee.org/document/6619022) | 객체 지향 SLAM |
| [DVO](level-04-rgbd-slam/dvo.md) | [Kerl 2013](https://vision.in.tum.de/data/software/dvo) | 키프레임, 깊이, 직접 방법, 최적화, 루프 클로저 |
| [**RTAB-Map**](level-04-rgbd-slam/rtab-map.md) | [Labbé 2014](https://introlab.github.io/rtabmap/) | 루프 클로저, 맵 병합, 다중 세션 메모리 관리 |
| [MRS-Map](level-04-rgbd-slam/mrs-map.md) | [Stückler 2014](https://doi.org/10.1016/j.jvcir.2013.02.008) | 옥트리 기반 다중 해상도 서펠 맵, 서펠별 형태 + 색상 통계, 노이즈 인식 RGB-D 정합, CPU에서 실시간 |
| [**ElasticFusion**](level-04-rgbd-slam/elasticfusion.md) | [Whelan 2015](https://ieeexplore.ieee.org/document/7274882) | 활성: 프레임-대-모델 추적(광도적 + 기하학적), 공동 최적화, 융합된 서펠 기반 모델 재구성 · 비활성: 지역 루프 클로저(모델-대-모델 지역 표면, 서브모델 분리), 전역 루프 클로저(무작위 펀 인코딩, 비강체 공간 변형) |
| [DynamicFusion](level-04-rgbd-slam/dynamicfusion.md) | [Newcombe 2015](https://ieeexplore.ieee.org/document/7298631) | 6D 모션 필드, 변형 가능한 장면 |
| **ORB-SLAM2** (RGB-D 모드) | Mur-Artal 2017 | 번들 조정, 희소 재구성 (→ 레벨 3에도 등장) |
| [**BundleFusion**](level-04-rgbd-slam/bundlefusion.md) | [Dai 2016](https://arxiv.org/abs/1604.01093) | 로컬-투-글로벌 최적화, 희소 RGB 특징, 거친 전역 포즈 추정, 정밀 포즈 정제(기하학적 + 광도적) |
| [SemanticFusion](level-04-rgbd-slam/semanticfusion.md) | [McCormac 2016](https://arxiv.org/abs/1609.05130) | 딥러닝 CNN, 딥 시맨틱 SLAM |
| [InfiniTAM v3](level-04-rgbd-slam/infinitam-v3.md) | [Prisacariu 2017](https://arxiv.org/abs/1708.00783) | 추적(장면 레이캐스트, 깊이 이미지, RGB 이미지), 재지역화(무작위 펀), 매핑(TSDF 재구성, 복셀 해싱, 서펠 재구성) |
| [Fusion++](level-04-rgbd-slam/fusionpp.md) | [McCormac & Clark 2018](https://arxiv.org/abs/1808.08378) | 딥러닝 CNN, Mask-RCNN 인스턴스 분할, 객체 수준 SLAM, 사전 정보 없음, 객체 수준 TSDF 재구성 |
| [PointFusion / DenseFusion](level-04-rgbd-slam/pointfusion-densefusion.md) | [Xu 2018](https://arxiv.org/abs/1711.10871) / [Wang 2019](https://arxiv.org/abs/1901.04780) | RGB-D 객체 6자유도 포즈 추정, 포인트 클라우드 + 이미지 특징 융합(객체 수준 SLAM을 위한 객체 프론트엔드) |
| [BAD SLAM](level-04-rgbd-slam/bad-slam.md) | [Schöps 2019](https://openaccess.thecvf.com/content_CVPR_2019/html/Schops_BAD_SLAM_Bundle_Adjusted_Direct_RGB-D_SLAM_CVPR_2019_paper.html) | 직접 RGB-D 번들 조정, 서펠 맵, 실시간 GPU BA, ETH3D 벤치마크 |
| [**RTAB-Map**](level-04-rgbd-slam/rtab-map.md) (RGB-D / LiDAR) | [Labbé 2019](https://doi.org/10.1002/rob.21831) | 다중 센서 RGB-D/LiDAR 지원, 광원 감지 (2016) |
| [**MoreFusion**](level-04-rgbd-slam/morefusion.md) | [Wada 2020](https://arxiv.org/abs/2004.04336) | 딥러닝 인스턴스 분할, 객체 수준 볼류메트릭 융합, 볼류메트릭 포즈 예측, 3D 장면 재구성, 충돌 기반 정제, 시맨틱 SLAM, 객체 포즈 추정, CAD 객체 피팅 |
| **NodeSLAM** | Sucar 2020 | 점유 VAE, 객체 수준 SLAM (→ 레벨 5 잠재 표현에도 등장) |
| [**DSP-SLAM**](level-04-rgbd-slam/dsp-slam.md) | [Wang (UCL) 2021](https://arxiv.org/abs/2108.09481) | DeepSDF 형태 사전 정보 + ORB-SLAM2, 객체 수준 밀도 재구성(단안/스테레오/LiDAR) |
