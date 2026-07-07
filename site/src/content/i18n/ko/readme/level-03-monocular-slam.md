### 핵심 개념
- **[VO vs SLAM](level-03-monocular-slam/vo-vs-slam.md)** — VO는 로컬 방식(루프 클로저 없음), SLAM은 전역 지도 + 루프 클로저를 포함
- **[스케일 모호성](level-03-monocular-slam/scale-ambiguity.md)** — 단안 SLAM의 근본적 한계; 고전적으로는 기하 정보만으로 절대 스케일을 복원할 수 없음(Metric3D나 MASt3R 같은 학습된 미터 깊이 사전 정보가 근사 스케일을 제공할 수 있음)
- **[공시야성 그래프](level-03-monocular-slam/covisibility-graph.md)** — 키프레임 간 공유 맵 포인트 가시성; ORB-SLAM의 핵심 데이터 구조
- **[시각적 장소 인식(VPR)](level-03-monocular-slam/visual-place-recognition-vpr.md)** — 루프 클로저를 위해 이전에 방문한 장소를 인식하는 것
- **[자기지도 학습 기반 깊이 추정](level-03-monocular-slam/self-supervised-depth.md)** — 정답 데이터 없이 단안 깊이를 학습하는 것 (Monodepth2, Godard 2019)

### 특징점 기반 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [Visual Odometry](level-03-monocular-slam/visual-odometry.md) | [Nistér 2004](https://ieeexplore.ieee.org/document/1315094) | 5점 Essential 행렬 솔버, RANSAC, 삼각측량, VO (로컬 전용, 루프 클로저 없음) |
| [**MonoSLAM**](level-03-monocular-slam/monoslam.md) | [Davison 2007](https://ieeexplore.ieee.org/document/4160954) | **최초의 실시간 단안 SLAM**, EKF 기반, 단일 카메라, 희소 3D 지도, 확률적 특징점 초기화 |
| [PTAM](level-03-monocular-slam/ptam.md) | [Klein & Murray 2007](https://www.robots.ox.ac.uk/~gk/publications/KleinMurray2007ISMAR.pdf) | FAST 특징점, 추적, **프론트엔드/백엔드 분리**, 병렬 스레드, 키프레임, 매핑, 번들 조정, 수동 초기화 |
| [Visual-SLAM why filter?](level-03-monocular-slam/visual-slam-why-filter.md) | [Strasdat 2012](https://doi.org/10.1016/j.imavis.2012.02.009) | 번들 조정, 스케일 인식 BA, 모션 전용 BA |
| [**ORB-SLAM**](level-03-monocular-slam/orb-slam.md) | [Mur-Artal 2015](https://arxiv.org/abs/1502.00956) | ORB 키포인트, **자동 초기화(호모그래피 vs Fundamental 선택)**, 추적 스레드, 로컬(공시야성 기반) BA + 루프 클로저 시 전역 BA, 로컬 매핑, 대규모, 루프 클로저, Bag of Visual Words, 전역 최적화, 공시야성 그래프, **맵 포인트 관리(컬링, 병합)** |
| [Pop-up SLAM](level-03-monocular-slam/pop-up-slam.md) | [Yang 2016](https://arxiv.org/abs/1703.07334) | 선/평면 특징 |
| [PL-SLAM](level-03-monocular-slam/pl-slam.md) | [Pumarola 2017](https://www.albertpumarola.com/research/pl-slam/index.html) | 점/선 특징 |
| [**ORB-SLAM2**](level-03-monocular-slam/orb-slam2.md) | [Mur-Artal 2017](https://arxiv.org/abs/1610.06475) | → 스테레오 SLAM, → RGB-D SLAM |
| [CubeSLAM](level-03-monocular-slam/cubeslam.md) | [Yang 2019](https://arxiv.org/abs/1806.00557) | 단안 3D 직육면체 감지 + SLAM, 9자유도 객체 표현 |
| [OpenVSLAM](level-03-monocular-slam/openvslam.md) | [Sumikura 2019](https://arxiv.org/abs/1910.01122) | ORB 기반 SLAM 프레임워크, 원근/어안/등장방형 카메라 모델, 맵 저장/불러오기 + 위치 추정 모드 |
| [**Stella-VSLAM**](level-03-monocular-slam/stella-vslam.md) | [Community 2021](https://github.com/stella-cv/stella_vslam) | OpenVSLAM 후속, 라이선스 재정비 (→ 레벨 7에도 등장) |
| [UcoSLAM](level-03-monocular-slam/ucoslam.md) | [Muñoz-Salinas 2019](https://arxiv.org/abs/1902.03729) | 표지 마커(fiducial marker) |
| [DeepFusion](level-03-monocular-slam/deepfusion.md) | [Laidlow 2019](https://arxiv.org/abs/2207.12244) | 밀도 단안 재구성, 반밀도 MVS + CNN 깊이/기울기 예측, 학습된 불확실성을 이용한 확률적 융합 |
| [**ORB-SLAM3**](level-03-monocular-slam/orb-slam3.md) | [Campos 2020](https://arxiv.org/abs/2007.11898) | 단안 + 스테레오 + VIO, 다중 맵, IMU 통합 |
| [DXSLAM](level-03-monocular-slam/dxslam.md) | [Li 2020](https://arxiv.org/abs/2008.05416) | SLAM을 위한 딥 특징점 |
| [**PyCuVSLAM**](level-03-monocular-slam/pycuvslam.md) | [NVIDIA 2025](https://github.com/NVlabs/pycuvslam) | Python + CUDA GPU 가속 VSLAM 툴킷 (cuVSLAM 래퍼; 스테레오/다중 카메라 VIO) |

### 직접 방법 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**DTAM**](level-03-monocular-slam/dtam.md) | [Newcombe 2011](https://ieeexplore.ieee.org/document/6126513) | 밀도 매핑, 키프레임 매핑, GPGPU |
| [**LSD-SLAM**](level-03-monocular-slam/lsd-slam.md) | [Engel 2014](https://cvg.cit.tum.de/research/vslam/lsdslam) | 광도 오차 최소화, 높은 기울기 픽셀/에지, 대규모, 루프 클로저, 포즈 그래프 최적화 |
| [**DSO**](level-03-monocular-slam/dso.md) | [Engel 2016](https://arxiv.org/abs/1607.02565) | 광도 번들 조정, 슬라이딩 윈도우 BA, 루프 클로저/전역 최적화 없음 |
| [**LDSO**](level-03-monocular-slam/ldso.md) | [Gao 2018](https://arxiv.org/abs/1808.01111) | DSO + 루프 클로저(BoW 기반), DSO의 주요 약점 해결 |
| [CNN-SLAM](level-03-monocular-slam/cnn-slam.md) | [Tateno 2017](https://arxiv.org/abs/1704.03489) | LSD-SLAM + 딥러닝 깊이 추정에서 얻은 깊이, 시맨틱 레이블 |
| [DVSO](level-03-monocular-slam/dvso.md) | [Yang 2018](https://arxiv.org/abs/1807.02570) | 딥러닝 기반 단일 이미지 깊이 추정, StackNet |
| [D3VO](level-03-monocular-slam/d3vo.md) | [Yang 2020](https://arxiv.org/abs/2003.01060) | 딥러닝 기반 단일 이미지 깊이 추정, 딥 포즈, 딥 우연적 불확실성(aleatoric uncertainty) |

### 반직접 방법 (하이브리드)

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [SVO](level-03-monocular-slam/svo.md) | [Forster 2014](https://ieeexplore.ieee.org/document/6906584) | FAST 특징 검출, 희소 직접 이미지 정렬, 깊이 필터 |
| [SVO2](level-03-monocular-slam/svo2.md) | [Forster 2017](https://rpg.ifi.uzh.ch/svo2.html) | 다중 카메라/어안, 확률적 깊이 추정, 직접 방법 수렴성, 희소 방법, 번들 조정 |
| [**Stereo DSO**](level-07-stereo-slam/stereo-dso.md) | [Wang 2017](https://arxiv.org/abs/1708.07878) | → 스테레오 SLAM |
| [VI-DSO](level-06-vio-vins/vi-dso.md) | [von Stumberg 2018](https://arxiv.org/abs/1804.05625) | → VIO/VINS |


### SfM 도구

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**COLMAP**](level-03-monocular-slam/colmap.md) | [Schönberger 2016](https://colmap.github.io/) | 사실상 표준인 증분 SfM + MVS 파이프라인 (C++/CUDA, pycolmap 바인딩) |
| [**GLOMAP**](level-03-monocular-slam/glomap.md) | [Pan 2024](https://arxiv.org/abs/2407.20219) | 전역 SfM의 재조명 — COLMAP과 호환되며 훨씬 빠른 매핑 |
| [**InstantSfM**](level-03-monocular-slam/instantsfm.md) | [Zhong 2025](https://arxiv.org/abs/2510.13310) | GPU 네이티브 희소성 인식 SfM 파이프라인, COLMAP 대비 큰 속도 향상 |

### 동적 환경 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**DynaSLAM**](level-03-monocular-slam/dynaslam.md) | [Bescós 2018](https://arxiv.org/abs/1806.05620) | Mask R-CNN 기반 동적 객체 제거 + 배경 인페인팅, ORB-SLAM2 기반 |
| [DS-SLAM](level-03-monocular-slam/ds-slam.md) | [Yu 2018](https://arxiv.org/abs/1809.08379) | 시맨틱 분할(SegNet) + 모션 일관성 검사 |
| [MaskFusion](level-03-monocular-slam/maskfusion.md) | [Rünz 2018](https://arxiv.org/abs/1804.09194) | 여러 움직이는 객체에 대한 RGB-D 인식, 추적, 재구성 |
| [MID-Fusion](level-03-monocular-slam/mid-fusion.md) | [Xu 2019](https://arxiv.org/abs/1812.07976) | 옥트리 기반 객체 수준 다중 인스턴스 동적 RGB-D SLAM |
| [**VDO-SLAM**](level-03-monocular-slam/vdo-slam.md) | [Zhang 2020](https://arxiv.org/abs/2005.11052) | 동적 객체 인식 SLAM, 카메라 + 객체 모션 공동 추정 |
| [DynaSLAM II](level-03-monocular-slam/dynaslam-ii.md) | [Bescós 2021](https://arxiv.org/abs/2010.07820) | 긴밀 결합 다중 객체 추적 및 SLAM |
| [**MonST3R**](level-03-monocular-slam/monst3r.md) | [Zhang 2024](https://arxiv.org/abs/2410.03825) | 모션이 존재하는 상황에서의 DUSt3R 계열 포인트맵 추정 |
