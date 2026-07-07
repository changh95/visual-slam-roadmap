### 핵심 개념
- **[학습 기반 vs 수작업 설계](level-05-deep-learning/learned-vs-hand-crafted.md)** — 개별 고전 모듈(특징, 깊이, 매칭)을 신경망으로 대체하는 것 vs 종단간 학습
- **[미분 가능성](level-05-deep-learning/differentiability.md)** — 고전적 최적화(RANSAC, BA)를 미분 가능하게 만들어 학습을 통과시킬 수 있도록 하는 것
- **[파운데이션 모델](level-05-deep-learning/foundation-models.md)** — 재사용 가능한 인식 백본으로서의 대규모 사전학습 모델(CLIP, SAM, DUSt3R 계열)

> 레벨 5는 네 개의 축으로 구성됩니다:
> **A. 프론트엔드** — 수작업 설계 모듈을 대체하는 학습된 인식 구성 요소
> **B. 백엔드** — 고전적 솔버를 대체하는 학습된/인증 가능한 최적화
> **C. 시스템** — 종단간 딥 VO/SLAM 파이프라인
> **D. 장면 이해** — SLAM 지도에 대한 시맨틱, 언어, 관계적 추론

### A. 딥러닝 프론트엔드 — 인식

#### 특징 검출 및 매칭

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**NetVLAD**](level-05-deep-learning/netvlad.md) | [Arandjelović 2016](https://arxiv.org/abs/1511.07247) | VLAD, 장소 인식 |
| [**SuperPoint**](level-05-deep-learning/superpoint.md) | [DeTone 2017](https://arxiv.org/abs/1712.07629) | Homographic Adaptation, 자기지도 학습, VGG 인코더 + 검출기/디스크립터 헤드 |
| [HardNet](level-05-deep-learning/hardnet.md) | [Mishchuk 2017](https://arxiv.org/abs/1705.10872) | 학습된 지역 디스크립터 |
| [**R2D2**](level-05-deep-learning/r2d2.md) | [Revaud 2019](https://arxiv.org/abs/1906.06195) | 반복 가능성 + 신뢰성을 갖춘 검출기/디스크립터, 명시적 반복성/신뢰도 맵 |
| [KeyNet](level-05-deep-learning/keynet.md) | [Barroso-Laguna 2019](https://arxiv.org/abs/1904.00889) | 학습된 키포인트 검출기 |
| [**HF-Net**](level-05-deep-learning/hf-net.md) | [Sarlin 2019](https://arxiv.org/abs/1812.03506) | 전역 특징, 지역 특징, 시각적 위치 추정 |
| [**SuperGlue**](level-05-deep-learning/superglue.md) | [Sarlin 2020](https://arxiv.org/abs/1911.11763) | Self/Cross-attention GNN, Sinkhorn 최적 할당, 이상치를 위한 dustbin |
| [**DISK**](level-05-deep-learning/disk.md) | [Tyszkiewicz 2020](https://arxiv.org/abs/2006.13566) | 정책 그래디언트(RL) 학습, 매칭 성공/실패를 보상으로 사용 |
| [Patch NetVLAD](level-05-deep-learning/patch-netvlad.md) | [Hausler 2021](https://arxiv.org/abs/2103.01486) | 멀티스케일 패치 수준 VLAD |
| [**LoFTR**](level-05-deep-learning/loftr.md) | [Sun 2021](https://arxiv.org/abs/2104.00680) | 검출기 없는(detector-free) Transformer 기반 거친-세밀 밀도 매칭 |
| [**LightGlue**](level-05-deep-learning/lightglue.md) | [Lindenberger 2023](https://arxiv.org/abs/2306.13643) | 적응형 깊이/너비, SuperGlue보다 5~10배 빠름 |
| [**XFeat**](level-05-deep-learning/xfeat.md) | [Potje 2024](https://arxiv.org/abs/2404.19174) | 0.3M 파라미터, 1400 FPS(RTX 4090), 64차원 디스크립터, 임베디드 친화적 |
| [**RoMa**](level-05-deep-learning/roma.md) | [Edstedt 2024](https://arxiv.org/abs/2305.15404) | DINOv2 파운데이션 특징 + 거친-세밀 밀도 매칭 |
| [**DeDoDe**](level-05-deep-learning/dedode.md) | [Edstedt 2024](https://arxiv.org/abs/2308.08479) | 단일 단계에서의 검출-기술 공동 수행 |
| [**RoMa v2**](level-05-deep-learning/roma-v2.md) | [Edstedt 2025](https://arxiv.org/abs/2511.15706) | 더 어렵고, 더 좋고, 더 빠르고, 더 밀도 있는 밀도 특징 매칭 |

#### 깊이 추정

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [MonoDepth](level-05-deep-learning/monodepth.md) | [Godard 2016](https://arxiv.org/abs/1609.03677) | 좌우 광도 일관성, 자기지도 학습 |
| [**MiDaS**](level-05-deep-learning/midas.md) | [Ranftl 2020](https://arxiv.org/abs/1907.01341) | 다중 데이터셋 혼합, 스케일-이동 불변 손실, 상대 깊이 |
| [**DPT**](level-05-deep-learning/dpt.md) | [Ranftl 2021](https://arxiv.org/abs/2103.13413) | Dense Prediction Transformer(ViT 백본), 전역 컨텍스트 |
| [**ZoeDepth**](level-05-deep-learning/zoedepth.md) | [Bhat 2023](https://arxiv.org/abs/2302.12288) | 제로샷 미터 깊이, Metric Bins Module |
| [**Metric3D**](level-05-deep-learning/metric3d.md) | [Yin 2023](https://arxiv.org/abs/2307.10984) | 카메라 내부 파라미터 조건화 미터 깊이, Canonical Camera Space |
| [**Depth Anything**](level-05-deep-learning/depth-anything.md) | [Yang 2024](https://arxiv.org/abs/2401.10891) | 6,200만 개 이미지, 단안 깊이를 위한 파운데이션 모델 |
| [**Depth Anything V2**](level-05-deep-learning/depth-anything-v2.md) | [Yang 2024](https://arxiv.org/abs/2406.09414) | 합성 데이터로 개선, 더 나은 에지 보존 |
| [**Marigold**](level-05-deep-learning/marigold.md) | [Ke 2024](https://arxiv.org/abs/2312.02145) | 깊이 추정을 위한 Stable Diffusion, 미세한 디테일, 샘플링을 통한 불확실성 |
| [**Align3R**](level-05-deep-learning/align3r.md) | [Lu 2025](https://arxiv.org/abs/2412.03079) | 비디오 시간적 일관성, DUSt3R 기반, CVPR 2025 하이라이트 |
| [**Masked Depth Modeling (LingBot-Depth)**](level-05-deep-learning/masked-depth-modeling-lingbot-depth.md) | [Tan 2026](https://arxiv.org/abs/2601.17895) | 유리/거울/금속에서의 RGB-D 실패 해결 |

#### 옵티컬 플로우 및 장면 플로우

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**FlowNet**](level-05-deep-learning/flownet.md) | [Dosovitskiy 2015](https://arxiv.org/abs/1504.06852) | 최초의 종단간 딥러닝 옵티컬 플로우 (SimpleNet / CorrNet) |
| [**FlowNet 2.0**](level-05-deep-learning/flownet-2-0.md) | [Ilg 2017](https://arxiv.org/abs/1612.01925) | 스택형 네트워크, 고전적 방법 수준의 정확도 |
| [**PWC-Net**](level-05-deep-learning/pwc-net.md) | [Sun 2018](https://arxiv.org/abs/1709.02371) | 피라미드-워핑-비용 볼륨, 거친-세밀, 840만 파라미터 |
| [**FlowNet3D**](level-05-deep-learning/flownet3d.md) | [Liu 2019](https://arxiv.org/abs/1806.01411) | 포인트 클라우드 장면 플로우, PointNet++ 기반 |
| [**RAFT**](level-05-deep-learning/raft.md) | [Teed 2020](https://arxiv.org/abs/2003.12039) | All-Pairs 상관 + 반복적 ConvGRU 업데이트, **ECCV 최우수 논문상** |
| [**RAFT-3D**](level-05-deep-learning/raft-3d.md) | [Teed 2021](https://arxiv.org/abs/2012.00726) | RAFT로부터 얻는 장면 플로우(3D 모션) |
| [**FlowFormer**](level-05-deep-learning/flowformer.md) | [Huang 2022](https://arxiv.org/abs/2203.16194) | 비용 볼륨 토큰에 대한 Transformer, 전역 컨텍스트 |
| [**SEA-RAFT**](level-05-deep-learning/sea-raft.md) | [Wang 2024](https://arxiv.org/abs/2405.14793) | 실시간을 위한 효율적인 RAFT 변형 |

#### 카메라 포즈 회귀 및 재위치 추정

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**PoseNet**](level-05-deep-learning/posenet.md) | [Kendall 2015](https://arxiv.org/abs/1505.07427) | CNN 기반 6자유도 포즈 회귀(APR), GoogLeNet 백본 |
| [**DSAC**](level-05-deep-learning/dsac.md) | [Brachmann 2017](https://arxiv.org/abs/1611.05705) | 미분 가능 RANSAC, Scene Coordinate Regression(SCR) |
| [**DSAC++**](level-05-deep-learning/dsacpp.md) | [Brachmann 2018](https://arxiv.org/abs/1711.10228) | 자기지도 학습, RGB-D 지원 |
| [CNN Pose Regression Limitations](level-05-deep-learning/cnn-pose-regression-limitations.md) | [Sattler 2019](https://arxiv.org/abs/1903.07504) | 포즈 회귀 ≈ 이미지 검색 성능 |
| [LM-Reloc](level-05-deep-learning/lm-reloc.md) | [von Stumberg 2020](https://arxiv.org/abs/2010.06323) | 딥러닝 기반 직접 재지역화 |
| [**DSAC\***](level-05-deep-learning/dsac-star.md) | [Brachmann 2021](https://arxiv.org/abs/2002.12324) | RGB/RGB-D로부터의 시각적 재지역화, 향상된 학습 안정성(TPAMI) |
| [**ACE**](level-05-deep-learning/ace.md) | [Brachmann 2023](https://arxiv.org/abs/2305.14059) | Accelerated Coordinate Encoding, 장면당 5분 학습 |
| [**ACE Zero**](level-05-deep-learning/ace-zero.md) | [Brachmann 2024](https://arxiv.org/abs/2404.14351) | 제로샷 SCR, 사전 구축된 3D 지도 불필요 |
| [**ACE-G**](level-05-deep-learning/ace-g.md) | [Bruns 2025](https://arxiv.org/abs/2510.11605) | 쿼리 사전학습을 통한 일반화 가능 SCR, 미세조정 없이 새로운 장면에 적용 |
| [**ACE-SLAM**](level-05-deep-learning/ace-slam.md) | [Alzugaray 2025](https://arxiv.org/abs/2512.14032) | 신경망 암시적 실시간 SLAM, 네트워크 가중치 = 지도 |
| [**hloc**](level-05-deep-learning/hloc.md) | [Sarlin 2019](https://github.com/cvg/Hierarchical-Localization) | HF-Net의 계층적 위치 추정을 구현한 툴박스: 거침(NetVLAD) → 세밀(SuperGlue) |

#### SLAM을 위한 객체 검출 및 분할

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**YOLO**](level-05-deep-learning/yolo.md) (v1→v11) | [Redmon 2016→2024](https://arxiv.org/abs/1506.02640) | 실시간 객체 검출, Ultralytics 생태계 |
| [**DETR**](level-05-deep-learning/detr.md) | [Carion 2020](https://arxiv.org/abs/2005.12872) | Transformer 검출, 앵커 없는(anchor-free) 방식, NMS 없음 |
| [**RT-DETR**](level-05-deep-learning/rt-detr.md) | [Zhao (Baidu) 2023](https://arxiv.org/abs/2304.08069) | 실시간 DETR, YOLO 수준의 속도 + Transformer 수준의 품질 |
| [**SAM**](level-05-deep-learning/sam.md) | [Kirillov 2023](https://arxiv.org/abs/2304.02643) | Segment Anything, 프롬프트 기반, 파운데이션 모델 |
| [**SAM 2**](level-05-deep-learning/sam-2.md) | [Meta 2024](https://arxiv.org/abs/2408.00714) | 비디오 분할, Memory Attention, 시간적 일관성 |
| [**Grounding DINO**](level-05-deep-learning/grounding-dino.md) | [Liu 2023](https://arxiv.org/abs/2303.05499) | 텍스트 프롬프트 기반 검출 → SAM 파이프라인 (Grounded SAM) |
| [**Open-YOLO 3D**](level-05-deep-learning/open-yolo-3d.md) | [Boudjoghra 2024](https://arxiv.org/abs/2406.02548) | 2D 오픈 어휘 검출 → 3D 인스턴스 분할, 16배 빠름 |

### B. 딥러닝 백엔드 — 최적화

#### 미분 가능 번들 조정

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**BA-Net**](level-05-deep-learning/ba-net.md) | [Tang 2019](https://arxiv.org/abs/1806.04807) | FPN + 미분 가능 LM 레이어, 종단간 SfM (ICLR) |
| [**DROID-SLAM**](level-05-deep-learning/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 밀도 옵티컬 플로우 + 미분 가능 밀도 BA, 모든 픽셀 재투영 |
| [**DPVO**](level-05-deep-learning/dpvo.md) | [Teed 2023](https://arxiv.org/abs/2208.04726) | 패치 기반 DROID-SLAM, 30+ FPS 실시간 |
| [**Theseus**](level-05-deep-learning/theseus.md) | [Pineda (Meta) 2022](https://arxiv.org/abs/2207.09442) | 미분 가능 비선형 최적화 라이브러리(PyTorch) |
| [**Lietorch**](level-05-deep-learning/lietorch.md) | [Teed 2021](https://github.com/princeton-vl/lietorch) | PyTorch를 위한 리 군 연산(SE(3)/SO(3)) |

#### 인증 가능한 최적 알고리즘

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**SE-Sync**](level-02-getting-familiar/se-sync.md) | [Rosen 2019](https://arxiv.org/abs/1611.00128) | SDP + 리만 최적화를 통한 인증 가능한 포즈 그래프 최적화 (arXiv 2016, IJRR 2019) |
| [**TEASER++**](level-02-getting-familiar/teaserpp.md) | [Yang 2020](https://arxiv.org/abs/2001.07715) | 포인트 클라우드 정합, 90%+ 이상치에 강건, TLS + Max Clique (T-RO/RSS 2020) |
| [**GNC**](level-02-getting-familiar/gnc.md) | [Yang 2020](https://arxiv.org/abs/1909.08605) | Graduated Non-Convexity, 볼록 → 강건 비용으로의 연속화(continuation) |
| [**QUASAR**](level-02-getting-familiar/quasar.md) | [Yang 2019](https://arxiv.org/abs/1905.12536) | 인증 가능한 최적 회전 탐색(이상치가 있는 Wahba 문제), 쿼터니언 QCQP + SDP 완화 |

#### 가우시안 신뢰 전파 및 그래프 프로세서

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**FutureMapping 1**](level-02-getting-familiar/futuremapping-1.md) | [Davison 2018](https://arxiv.org/abs/1803.11288) | 공간 AI의 연산 구조, SLAM을 위한 GBP |
| [**FutureMapping 2**](level-02-getting-familiar/futuremapping-2.md) | [Davison 2019](https://arxiv.org/abs/1910.14139) | 핵심 공간 AI 프리미티브로서의 GBP, GBP에 대한 시각적 입문 |
| [**BA on Graph Processor**](level-02-getting-familiar/ba-on-graph-processor.md) | [Ortiz 2020](https://arxiv.org/abs/2003.03134) | Graphcore IPU에서의 번들 조정, 타일 기반 병렬성 |
| [**DANCeRS**](level-02-getting-familiar/dancers.md) | [Patwardhan 2025](https://arxiv.org/abs/2508.18153) | 로봇 군집에서의 GBP 기반 분산 합의 |

### C. 종단간 딥 VO / SLAM 시스템

#### 자기지도 학습 및 학습 기반 VO

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [DeepVO](level-05-deep-learning/deepvo.md) | [Wang 2017](https://arxiv.org/abs/1709.08429) | 지도 학습 |
| [SfM-Learner](level-05-deep-learning/sfm-learner.md) | [Zhou 2017](https://arxiv.org/abs/1704.07813) | 비지도 학습, 딥 깊이 + 딥 포즈 |
| [DeMoN](level-05-deep-learning/demon.md) | [Ummenhofer 2017](https://arxiv.org/abs/1612.02401) | 두 프레임으로부터의 깊이 + 모션, 인코더-디코더 |
| [UndeepVO](level-05-deep-learning/undeepvo.md) | [Li 2018](https://arxiv.org/abs/1709.06841) | 스테레오 자기지도 학습, 절대 스케일 복원 |
| [DeepTAM](level-05-deep-learning/deeptam.md) | [Zhou 2018](https://arxiv.org/abs/1808.01900) | 딥러닝 기반 추적 및 매핑, 비용 볼륨 기반 |
| [DeepV2D](level-05-deep-learning/deepv2d.md) | [Teed 2018](https://arxiv.org/abs/1812.04605) | 비디오로부터의 반복적 깊이 추정, 미분 가능 기하 레이어 |
| [Depth from Videos in the Wild](level-05-deep-learning/depth-from-videos-in-the-wild.md) | [Gordon 2019](https://arxiv.org/abs/1904.04998) | 제약 없는 비디오 깊이 추정, 학습된 카메라 내부 파라미터 |
| [Neural Ray Surfaces](level-05-deep-learning/neural-ray-surfaces.md) | [Vasiljevic 2020](https://arxiv.org/abs/2008.06630) | 학습된 레이 표면 모델, 비핀홀 카메라 |
| [GradSLAM](level-05-deep-learning/gradslam.md) | [Murthy 2020](https://arxiv.org/abs/1910.10672) | 미분 가능 SLAM 프레임워크 (PyTorch, 여러 SLAM 백엔드 지원) |
| [DeepSLAM](level-05-deep-learning/deepslam.md) | [Li 2020](https://ieeexplore.ieee.org/document/9047170) | TrackingNet, MappingNet, LoopNet |
| [MonoRec](level-05-deep-learning/monorec.md) | [Wimbauer 2021](https://arxiv.org/abs/2011.11814) | 자기지도 학습 단안 3D 재구성, 움직이는 객체 |
| [TANDEM](level-05-deep-learning/tandem.md) | [Koestler 2021](https://arxiv.org/abs/2111.07418) | MVS 깊이를 통한 실시간 추적 + 밀도 매핑, DSO 기반 |
| [**DROID-SLAM**](level-05-deep-learning/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 밀도 BA + 상관, TartanAir/EuRoC에서 SOTA (→ 미분 가능 BA 참고) |
| [**DPVO**](level-05-deep-learning/dpvo.md) | [Teed 2023](https://arxiv.org/abs/2208.04726) | 패치 기반 경량 DROID (→ 미분 가능 BA 참고) |

#### 잠재 표현 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**CodeSLAM**](level-05-deep-learning/codeslam.md) | [Bloesch 2018](https://arxiv.org/abs/1804.00874) | 128차원 잠재 코드로서의 깊이, 코드 + 포즈에 대한 광도 BA |
| [**SceneCode**](level-05-deep-learning/scenecode.md) | [Zhi 2019](https://arxiv.org/abs/1903.06482) | 단일 잠재 코드 내 깊이 + 시맨틱, 교차 모달 제약 |
| [**DeepFactors**](level-05-deep-learning/deepfactors.md) | [Czarnowski 2020](https://arxiv.org/abs/2001.05049) | 확률적 깊이 코드 + 팩터 그래프, GPU에서 30+ FPS |
| [**NodeSLAM**](level-05-deep-learning/nodeslam.md) | [Sucar 2020](https://arxiv.org/abs/2004.04485) | 객체 수준 DeepSDF 코드, 객체별 점유 VAE |
| [**CodeMapping**](level-05-deep-learning/codemapping.md) | [Matsuki 2021](https://arxiv.org/abs/2107.08994) | 희소 SLAM + 학습된 밀도 매핑, 하이브리드 접근법 |

#### 신경 렌더링 (참조)

> NeRF/3DGS 기반 SLAM 시스템 → **레벨 3: 신경망 표현 SLAM** 참고

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**NeRF**](level-05-deep-learning/nerf.md) | [Mildenhall 2020](https://arxiv.org/abs/2003.08934) | Neural Radiance Fields, 새로운 뷰 합성 (토대 논문) |
| [**DIFIX3D+**](level-05-deep-learning/difix3d.md) | [Wu 2025](https://arxiv.org/abs/2503.01774) | 3D 재구성 아티팩트 제거를 위한 단일 스텝 디퓨전 (후처리) |

### D. 장면 이해

#### 벤치마크 및 기초

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**EFM3D**](level-05-deep-learning/efm3d.md) | [Straub (Meta) 2024](https://arxiv.org/abs/2406.10224) | Egocentric Foundation Model 3D 벤치마크, 1인칭 비디오로부터의 깊이/표면/시맨틱 |

#### 3D 장면 그래프

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [Kimera / 3D Dynamic Scene Graph](level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) | [Rosinol 2020](https://arxiv.org/abs/2002.06289) | Kimera-VIO, Kimera-Mesher, Kimera-PGMO, Kimera-Semantics, Kimera-DSG (스테레오/단안 시각-관성 파이프라인) |
| [**Hydra**](level-05-deep-learning/hydra.md) | [Hughes (MIT SPARK) 2022](https://arxiv.org/abs/2201.13360) | 실시간 계층적 장면 그래프 (메시→객체→장소→방→건물) |
| [**Hydra-Multi**](level-05-deep-learning/hydra-multi.md) | [Chang 2023](https://arxiv.org/abs/2304.13487) | 분산 멀티로봇 3D 장면 그래프 |
| [**Clio**](level-05-deep-learning/clio.md) | [Maggio (MIT SPARK) 2024](https://arxiv.org/abs/2404.13696) | 오픈셋 작업 지향 장면 그래프, 노드별 CLIP 임베딩 |
| [**Khronos**](level-05-deep-learning/khronos.md) | [Schmid (MIT SPARK) 2024](https://arxiv.org/abs/2402.13817) | 시공간 장면 그래프, 동적 객체 이력 추적 |
| [**ConceptGraphs**](level-05-deep-learning/conceptgraphs.md) | [Gu 2023](https://arxiv.org/abs/2309.16650) | 오픈 어휘 3D 장면 그래프, SAM + CLIP + LLM 관계 (→ 레벨 3 의미론적 SLAM에도 등장) |
