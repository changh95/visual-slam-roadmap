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
| [**Stella-VSLAM**](level-03-monocular-slam/stella-vslam.md) | [커뮤니티 2021](https://github.com/stella-cv/stella_vslam) | OpenVSLAM 후속, 라이선스 재정비 (→ 레벨 7에도 등장) |
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

### 하이브리드 (특징점 + 직접 방법)

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [SVO](level-03-monocular-slam/svo.md) | [Forster 2014](https://ieeexplore.ieee.org/document/6906584) | FAST 특징 검출, 희소 직접 이미지 정렬, 깊이 필터 |
| [SVO2](level-03-monocular-slam/svo2.md) | [Forster 2017](https://rpg.ifi.uzh.ch/svo2.html) | 다중 카메라/어안, 확률적 깊이 추정, 직접 방법 수렴성, 희소 방법, 번들 조정 |
| [**Stereo DSO**](level-07-stereo-slam/stereo-dso.md) | [Wang 2017](https://arxiv.org/abs/1708.07878) | → 스테레오 SLAM |
| [VI-DSO](level-06-vio-vins/vi-dso.md) | [von Stumberg 2018](https://arxiv.org/abs/1804.05625) | → VIO/VINS |

### 학습 기반 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**DROID-SLAM**](level-05-deep-learning/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 미분 가능 BA, 밀도 옵티컬 플로우, 종단간 학습 (→ 레벨 5에도 등장) |
| [TartanVO](level-05-deep-learning/tartanvo.md) | [Wang 2021](https://arxiv.org/abs/2011.00359) | 일반화 가능한 시각 오도메트리 |
| [**DPVO**](level-05-deep-learning/dpvo.md) | [Teed 2023](https://arxiv.org/abs/2208.04726) | 패치 기반 경량 DROID-SLAM, 실시간 VO (→ 레벨 5에도 등장) |
| [**DPV-SLAM**](level-05-deep-learning/dpv-slam.md) | [Lipson 2024](https://arxiv.org/abs/2408.01654) | DPVO + 루프 클로저, 완전한 SLAM (ECCV 2024) |
| [MAC-VO](level-05-deep-learning/mac-vo.md) | [Qiu 2024](https://arxiv.org/abs/2409.09479) | 학습 기반 VO, 메트릭 인식 |
| [**VoT**](level-05-deep-learning/vot.md) | [Yugay 2025](https://arxiv.org/abs/2510.03348) | Transformer 기반 시각 오도메트리 (이후 FVO로 재명명) |

### 파운데이션 모델 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**DUSt3R**](level-05-deep-learning/dust3r.md) | [Wang 2024](https://arxiv.org/abs/2312.14132) | 이미지 쌍으로부터 포인트맵 회귀, 캘리브레이션 불필요 |
| [**MASt3R**](level-05-deep-learning/mast3r.md) | [Leroy 2024](https://arxiv.org/abs/2406.09756) | DUSt3R + 지역 특징 매칭 |
| [**MASt3R-SLAM**](level-05-deep-learning/mast3r-slam.md) | [Murai 2024](https://arxiv.org/abs/2412.12392) | MASt3R 사전 정보 기반 실시간 밀도 SLAM |
| [**VGGT**](level-05-deep-learning/vggt.md) | [Wang (Meta) 2025](https://arxiv.org/abs/2503.11651) | N개 뷰로부터 포즈, 깊이, 포인트맵, 트랙을 피드포워드로 추론 (**CVPR 2025 최우수 논문상**) |
| [**VGGT-SLAM**](level-05-deep-learning/vggt-slam.md) | [Maggio 2025](https://arxiv.org/abs/2505.12549) | SL(4) 매니폴드 위에서 최적화된 밀도 RGB SLAM, VGGT 프론트엔드 |
| [**VGGT-SLAM 2.0**](level-05-deep-learning/vggt-slam-2-0.md) | [Maggio 2026](https://arxiv.org/abs/2601.19887) | 실시간 밀도 피드포워드 장면 재구성 |
| [**VGGT-Geo**](level-05-deep-learning/vggt-geo.md) | [Qin 2026](https://www.mdpi.com/2220-9964/15/2/85) | 밀도 실내 SLAM을 위한 VGGT 사전 정보의 확률적 기하 융합 |
| [**IGGT**](level-05-deep-learning/iggt.md) | [Li 2025](https://arxiv.org/abs/2510.22706) | 인스턴스 기반 기하 Transformer — 통합 3D 재구성 + 인스턴스 수준 이해 |
| [**AMB3R**](level-05-deep-learning/amb3r.md) | [Wang 2025](https://arxiv.org/abs/2511.20343) | 백엔드를 갖춘 정확한 피드포워드 미터 스케일 3D 재구성, SfM/SLAM 지원 |
| [**MASt3R-Fusion**](level-05-deep-learning/mast3r-fusion.md) | [Zhou 2025](https://arxiv.org/abs/2509.20757) | MASt3R 피드포워드 시각 모델 + IMU + GNSS 융합 |

#### SfM 도구

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**COLMAP**](level-03-monocular-slam/colmap.md) | [Schönberger 2016](https://colmap.github.io/) | 사실상 표준인 증분 SfM + MVS 파이프라인 (C++/CUDA, pycolmap 바인딩) |
| [**GLOMAP**](level-03-monocular-slam/glomap.md) | [Pan 2024](https://arxiv.org/abs/2407.20219) | 전역 SfM의 재조명 — COLMAP과 호환되며 훨씬 빠른 매핑 |
| [**InstantSfM**](level-03-monocular-slam/instantsfm.md) | [Zhong 2025](https://arxiv.org/abs/2510.13310) | GPU 네이티브 희소성 인식 SfM 파이프라인, COLMAP 대비 큰 속도 향상 |

### 신경망 표현 SLAM

#### NeRF 기반

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**iMAP**](level-05-deep-learning/imap.md) | [Sucar 2021](https://arxiv.org/abs/2103.12352) | 최초의 NeRF-SLAM, 단일 MLP, 실시간 추적/매핑 |
| [**BARF**](level-05-deep-learning/barf.md) | [Lin 2021](https://arxiv.org/abs/2104.06405) | 번들 조정 NeRF, 거친-세밀 위치 인코딩, 포즈+NeRF 공동 최적화 (완전한 SLAM은 아님 — 포즈+NeRF 공동 최적화) |
| [**NICE-SLAM**](level-05-deep-learning/nice-slam.md) | [Zhu & Peng 2022](https://arxiv.org/abs/2112.12130) | 계층적 특징 그리드(거침/중간/세밀), 확장 가능 |
| [**Co-SLAM**](level-05-deep-learning/co-slam.md) | [Wang 2023](https://arxiv.org/abs/2304.14377) | 해시 그리드(Instant-NGP) + 좌표 인코딩, NICE-SLAM보다 5~10배 빠름 |
| [**ESLAM**](level-05-deep-learning/eslam.md) | [Johari 2023](https://arxiv.org/abs/2211.11704) | 트라이플레인 표현, O(N²) vs O(N³) 메모리 |
| [**Point-SLAM**](level-05-deep-learning/point-slam.md) | [Sandström 2023](https://arxiv.org/abs/2304.04278) | 신경망 포인트 클라우드 기반 |
| [**NeRF-SLAM**](level-05-deep-learning/nerf-slam.md) | [Rosinol 2023](https://arxiv.org/abs/2210.13641) | NeRF + 고전적 SLAM 파이프라인 |
| [**NICER-SLAM**](level-05-deep-learning/nicer-slam.md) | [Zhu 2024](https://arxiv.org/abs/2302.03594) | RGB 전용 NeRF-SLAM(깊이 센서 없음), 단안 깊이 통합 |
| [**vMAP**](level-05-deep-learning/vmap.md) | [Kong 2023](https://arxiv.org/abs/2302.01838) | 객체 수준 NeRF-SLAM, 객체별 신경 필드 |
| [**GO-SLAM**](level-05-deep-learning/go-slam.md) | [Zhang 2023](https://arxiv.org/abs/2309.02436) | 전역 최적화 + NeRF-SLAM, 루프 클로저 + 전역 BA |

#### 3DGS 기반

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**SplaTAM**](level-05-deep-learning/splatam.md) | [Keetha 2024](https://arxiv.org/abs/2312.02126) | 최초의 3DGS SLAM 시스템 중 하나(GS-SLAM, MonoGS와 동시기), RGB-D, 실루엣 기반 밀집화 |
| [**MonoGS**](level-05-deep-learning/monogs.md) | [Matsuki 2024](https://arxiv.org/abs/2312.06741) | 최초의 단안 3DGS SLAM(CVPR 2024 하이라이트), 직접 래스터화 기반 추적, 해석적 카메라 야코비안 |
| [**GS-ICP SLAM**](level-05-deep-learning/gs-icp-slam.md) | [Ha 2024](https://arxiv.org/abs/2403.12550) | 가우시안-대-가우시안 ICP(마할라노비스 거리), 기하학적 추적 |
| [**Photo-SLAM**](level-05-deep-learning/photo-slam.md) | [Huang 2024](https://arxiv.org/abs/2311.16728) | 명시적 기하 + 암시적 외관(MLP 색상), 안티앨리어싱 |
| [**RTG-SLAM**](level-05-deep-learning/rtg-slam.md) | [Peng 2024](https://arxiv.org/abs/2404.19706) | 실시간에 초점, 적응형 가우시안 예산, Jetson Orin에서 25 FPS |
| [**EGG-Fusion**](level-05-deep-learning/egg-fusion.md) | [Pan 2025](https://arxiv.org/abs/2512.01296) | 즉석 기하 인식 가우시안 서펠 융합, 정보 필터 기반, 실시간 |
| [**Online 3DGS Modeling**](level-05-deep-learning/online-3dgs-modeling.md) | [Lee 2025](https://arxiv.org/abs/2508.14014) | 새로운 뷰 선택을 활용한 온라인 3D 가우시안 스플래팅 모델링 |
| [**ActiveSplat**](level-05-deep-learning/activesplat.md) | [Li 2025](https://arxiv.org/abs/2410.21955) | 3DGS + Voronoi 기반 경로 계획을 활용한 능동 매핑 |
| [**OpenGS-SLAM**](level-05-deep-learning/opengs-slam.md) | [Yang 2025](https://arxiv.org/abs/2503.01646) | 오픈셋 밀도 시맨틱 3DGS SLAM, 객체 수준 장면 이해 |
| [**LEGS**](level-05-deep-learning/legs.md) | [Yu 2024](https://arxiv.org/abs/2409.18108) | 언어가 내재된 가우시안 스플랫, 실시간 언어 질의 가능 3D |

### 의미론적 / 언어 기반 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**ConceptFusion**](level-05-deep-learning/conceptfusion.md) | [Jatavallabhula (MIT) 2023](https://arxiv.org/abs/2302.07241) | CLIP 특징을 3D 지도에 융합, 오픈 어휘 언어 질의 |
| [**LERF**](level-05-deep-learning/lerf.md) | [Kerr 2023](https://arxiv.org/abs/2303.09553) | 언어가 내재된 래디언스 필드, DINO 멀티스케일, NeRF + CLIP |
| [**OpenScene**](level-05-deep-learning/openscene.md) | [Peng (ETH) 2023](https://arxiv.org/abs/2211.15654) | 언어 특징을 3D 포인트 클라우드로 역투영 |
| [**ConceptGraphs**](level-05-deep-learning/conceptgraphs.md) | [Gu 2023](https://arxiv.org/abs/2309.16650) | 오픈 어휘 3D 장면 그래프, SAM + CLIP + LLM 공간 관계 |
| [**SpatialLM**](level-05-deep-learning/spatiallm.md) | [Mao 2025](https://github.com/manycore-research/SpatialLM) | 포인트 클라우드 → LLM, Python 스크립트로서의 구조화된 실내 모델링 |

> 참고: [**LEGS**](https://arxiv.org/abs/2409.18108), [**OpenGS-SLAM**](https://arxiv.org/abs/2503.01646) (위의 3DGS 기반 섹션); [**Open-YOLO 3D**](https://arxiv.org/abs/2406.02548) (레벨 5 객체 검출)

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
