### 프로그래밍 (핵심)
- **[C++](level-02-getting-familiar/cpp.md)**: OOP, Modern C++, 자료구조와 알고리즘, 컴파일러, CMake/Makefile/Ninja, 디자인 패턴, OpenCV C++
- **[C](level-02-getting-familiar/c.md)**
- **[Git/GitHub](level-02-getting-familiar/git-github.md)**
- **[OpenCV](level-02-getting-familiar/opencv.md)** (opencv-python)
- **[Python](level-02-getting-familiar/python.md)**: 딥러닝, 그래프 플롯, 시스템 스크립트
- **[Bash/Linux](level-02-getting-familiar/bash-linux.md)**: ssh, CLI 텍스트 에디터/Vim/tmux
- **[수학 라이브러리](level-02-getting-familiar/math-libraries.md)**: Eigen, Ceres-solver/GTSAM/g2o
- **[C++/Python 상호운용](level-02-getting-familiar/cpp-python-interop.md)**: PyBind11, nanobind
- **[ROS/ROS2](level-02-getting-familiar/ros-ros2.md)**
- **[Docker](level-02-getting-familiar/docker.md)**

### 프로그래밍 (선택 — SLAM 취업을 위한 엔지니어링 역량)
- **[동시성](level-02-getting-familiar/concurrency.md)**: SIMD-SSE/AVX/Neon, OpenMP, CUDA
- **[엣지 배포](level-02-getting-familiar/edge-deployment.md)**: 학습된 프론트엔드의 TensorRT/ONNX 내보내기, Jetson 벤치마킹
- **[모바일](level-02-getting-familiar/mobile.md)**: Android (Java/Kotlin), iOS (Objective-C/Swift)
- **[C#](level-02-getting-familiar/csharp.md)**: Unity AR, Microsoft HoloLens
- **[CI/CD](level-02-getting-familiar/ci-cd.md)**: GitHub Actions
- **[시뮬레이션](level-02-getting-familiar/simulation.md)**: Gazebo, Isaac Sim

### 이미지 처리
- **[키포인트](level-02-getting-familiar/keypoints.md)** → 검출기/디스크립터
  - [SIFT](level-02-getting-familiar/sift.md), [FAST](level-02-getting-familiar/fast.md), [ORB](level-02-getting-familiar/orb.md), [AKAZE](level-02-getting-familiar/akaze.md)
  - 딥 특징점: [R2D2](level-05-deep-learning/r2d2.md), [SuperPoint](level-05-deep-learning/superpoint.md)
- [이미지 피라미드](level-02-getting-familiar/image-pyramid.md), [oFAST](level-02-getting-familiar/orb.md), [rBRIEF](level-02-getting-familiar/orb.md)

### 지역 특징 매칭
- [브루트 포스](level-02-getting-familiar/brute-force-matching.md), [FLANN](level-02-getting-familiar/flann.md), [Kd-트리](level-02-getting-familiar/kd-tree.md)
- [LSH](level-02-getting-familiar/lsh.md), [Multi-probe LSH](level-02-getting-familiar/lsh.md), [HBST](level-02-getting-familiar/hbst.md)
- [SuperGlue](level-05-deep-learning/superglue.md)

### 전역 특징 매칭
- [시각적 단어 가방(BoVW)](level-02-getting-familiar/bag-of-visual-words.md), [NetVLAD](level-05-deep-learning/netvlad.md)
- [딥러닝 기반 이미지 검색](level-02-getting-familiar/deep-image-retrieval.md), [계층적 위치 추정](level-05-deep-learning/hloc.md)

### 특징 추적
- [옵티컬 플로우](level-02-getting-familiar/optical-flow.md), [KLT 추적기](level-02-getting-familiar/klt-tracker.md)

### 다중 뷰 기하학
- **[2D-2D 대응점](level-02-getting-familiar/2d-2d-correspondence.md)**: [Essential/Fundamental](level-01-beginner/epipolar-geometry.md), [호모그래피](level-01-beginner/epipolar-geometry.md)
- **[2D-3D 대응점](level-02-getting-familiar/2d-3d-correspondence.md)**: [P3P](level-02-getting-familiar/pnp.md), [PnP](level-02-getting-familiar/pnp.md), [SVD](level-01-beginner/svd.md)
- **[3D-3D 대응점](level-02-getting-familiar/3d-3d-correspondence.md)**: [ICP](level-04-rgbd-slam/icp.md)

### 이상치 제거
- [RANSAC](level-02-getting-familiar/ransac.md), [PROSAC](level-02-getting-familiar/prosac.md), [M-Estimator](level-02-getting-familiar/m-estimator.md), [MAXCON](level-02-getting-familiar/maxcon.md), [볼록 완화](level-02-getting-familiar/convex-relaxation.md)
- **[강건 포즈 그래프 최적화](level-02-getting-familiar/robust-pose-graph-optimization.md)**: 전환 가능한 제약 조건, 동적 공분산 스케일링(DCS), 쌍별 일관성 최대화(PCM)

### 최소제곱 최적화
- [재투영 오차](level-02-getting-familiar/reprojection-error.md), [번들 조정](level-02-getting-familiar/bundle-adjustment.md)
- [비선형 최적화](level-02-getting-familiar/non-linear-optimization.md), [리 대수](level-02-getting-familiar/lie-groups.md)
- **[리 군](level-02-getting-familiar/lie-groups.md)**: SO(3), SE(3)
- [가우스-뉴턴](level-02-getting-familiar/gauss-newton.md), [레벤버그-마쿼트](level-02-getting-familiar/levenberg-marquardt.md)
- **[포즈 그래프 최적화](level-02-getting-familiar/pose-graph-optimization.md)**
- **[슈어 보완 / 희소성](level-02-getting-familiar/schur-complement-sparsity.md)**

### 운동 모델
- **[고유수용 센서](level-02-getting-familiar/proprioceptive-sensor.md)**: IMU, 휠
- **[오도메트리](level-02-getting-familiar/odometry.md)** (포즈)

### 관측 모델
- **[외부수용 센서](level-02-getting-familiar/exteroceptive-sensor.md)**: 카메라, LiDAR
- **[랜드마크](level-02-getting-familiar/landmark.md)** (맵)
- [공동 최적화](level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md), [MLE와 MAP](level-02-getting-familiar/mle-and-map.md)

### 팩터 그래프 최적화
- **[팩터 그래프](level-02-getting-familiar/factor-graph.md)**: 변수(포즈, 랜드마크)와 팩터(관측값)로 이루어진 이분 그래프로서의 SLAM
- **[희소 비선형 최소제곱으로서의 MAP 추론](level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)**; 변수 제거와 베이즈 트리
- **[증분 스무딩](level-02-getting-familiar/incremental-smoothing.md)**: iSAM / iSAM2
- **[주변화](level-02-getting-familiar/marginalization.md)**와 고정 래그 스무딩
- 참고 자료: [Dellaert & Kaess, *Factor Graphs for Robot Perception* (2017)](https://www.cs.cmu.edu/~kaess/pub/Dellaert17fnt.pdf); GTSAM 튜토리얼

### 맵 표현
- [포인트 클라우드](level-02-getting-familiar/point-cloud.md), [점유 격자 매핑](level-02-getting-familiar/occupancy-grid-mapping.md), [TSDF](level-04-rgbd-slam/tsdf-vs-surfel-maps.md), [서펠](level-04-rgbd-slam/tsdf-vs-surfel-maps.md), [복셀 맵](level-02-getting-familiar/voxel-map.md)

### 센서
- **[카메라 장치](level-02-getting-familiar/camera-device.md)**: 광각/텔레센트릭 렌즈, 렌즈 MTF, CCD/CMOS, 롤링/글로벌 셔터, 노출/ISO, [스테레오비전](level-01-beginner/stereo-vision.md), [RGB-D](level-04-rgbd-slam/depth-from-sensor.md), [구조광](level-04-rgbd-slam/depth-from-sensor.md), [능동 IR/ToF](level-04-rgbd-slam/depth-from-sensor.md)
- **[LiDAR](level-02-getting-familiar/lidar.md)** → [Visual-LiDAR 융합](level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)
- **[IMU](level-02-getting-familiar/imu.md)** → VIO
- **[RADAR](level-02-getting-familiar/radar.md)** → [센서](level-02-getting-familiar/camera-device.md) 융합, [확장 칼만 필터](level-02-getting-familiar/extended-kalman-filter.md)
- **[소나](level-02-getting-familiar/sonar.md)**
- **[다중 센서 캘리브레이션](level-02-getting-familiar/multi-sensor-calibration.md)**: 카메라-IMU, 카메라-LiDAR ([Kalibr](https://github.com/ethz-asl/kalibr))

### 평가
- **[지표](level-02-getting-familiar/metrics.md)**: ATE (절대 궤적 오차), RPE (상대 자세 오차)
- **[일관성](level-02-getting-familiar/consistency.md)**: NEES (정규화된 추정 오차 제곱)
- **데이터셋**: [KITTI](https://www.cvlibs.net/datasets/kitti/), [TUM RGB-D](https://cvg.cit.tum.de/data/datasets/rgbd-dataset), [EuRoC](https://projects.asl.ethz.ch/datasets/euroc-mav/), [TartanAir](https://arxiv.org/abs/2003.14338), [TUM-VI](https://arxiv.org/abs/1804.06120), [4Seasons](https://arxiv.org/abs/2009.06364), [Hilti SLAM Challenge](https://hilti-challenge.com/), [Newer College](https://arxiv.org/abs/2003.05691), [Project Aria](https://www.projectaria.com/)
- **도구**: [evo](https://github.com/MichaelGrupp/evo) (궤적 평가)
