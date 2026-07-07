### 핵심 개념
- **[학습 기반 vs 수작업 설계](level-05-deep-learning/learned-vs-hand-crafted.md)** — 개별 고전 모듈(특징, 깊이, 매칭)을 신경망으로 대체하는 것 vs 종단간 학습
- **[미분 가능성](level-05-deep-learning/differentiability.md)** — 고전적 최적화(RANSAC, BA)를 미분 가능하게 만들어 학습을 통과시킬 수 있도록 하는 것
- **[파운데이션 모델](level-05-deep-learning/foundation-models.md)** — 재사용 가능한 인식 백본으로서의 대규모 사전학습 모델(CLIP, SAM, DUSt3R 계열)

> 레벨 5는 다섯 개의 축으로 구성됩니다:
> **A. 프론트엔드** — 수작업 설계 모듈을 대체하는 학습된 인식 구성 요소
> **B. 백엔드** — 고전적 솔버를 대체하는 학습된/인증 가능한 최적화
> **C. 시스템** — 종단간 딥 VO/SLAM 파이프라인
> **D. 장면 이해** — SLAM 지도에 대한 시맨틱, 언어, 관계적 추론
> **E. 파운데이션 모델 및 신경망 SLAM** — 포인트맵 Transformer, NeRF 및 3DGS 기반 밀도 SLAM 시스템

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

#### 학습 기반 SLAM 시스템

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**DROID-SLAM**](level-05-deep-learning/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 미분 가능 BA, 밀도 옵티컬 플로우, 종단간 학습 |
| [TartanVO](level-05-deep-learning/tartanvo.md) | [Wang 2021](https://arxiv.org/abs/2011.00359) | 일반화 가능한 시각 오도메트리 |
| [**DPV-SLAM**](level-05-deep-learning/dpv-slam.md) | [Lipson 2024](https://arxiv.org/abs/2408.01654) | DPVO + 루프 클로저, 완전한 SLAM (ECCV 2024) |
| [MAC-VO](level-05-deep-learning/mac-vo.md) | [Qiu 2024](https://arxiv.org/abs/2409.09479) | 학습 기반 VO, 메트릭 인식 |
| [**VoT**](level-05-deep-learning/vot.md) | [Yugay 2025](https://arxiv.org/abs/2510.03348) | Transformer 기반 시각 오도메트리 (이후 FVO로 재명명) |

#### 잠재 표현 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**CodeSLAM**](level-05-deep-learning/codeslam.md) | [Bloesch 2018](https://arxiv.org/abs/1804.00874) | 128차원 잠재 코드로서의 깊이, 코드 + 포즈에 대한 광도 BA |
| [**SceneCode**](level-05-deep-learning/scenecode.md) | [Zhi 2019](https://arxiv.org/abs/1903.06482) | 단일 잠재 코드 내 깊이 + 시맨틱, 교차 모달 제약 |
| [**DeepFactors**](level-05-deep-learning/deepfactors.md) | [Czarnowski 2020](https://arxiv.org/abs/2001.05049) | 확률적 깊이 코드 + 팩터 그래프, GPU에서 30+ FPS |
| [**NodeSLAM**](level-05-deep-learning/nodeslam.md) | [Sucar 2020](https://arxiv.org/abs/2004.04485) | 객체 수준 DeepSDF 코드, 객체별 점유 VAE |
| [**CodeMapping**](level-05-deep-learning/codemapping.md) | [Matsuki 2021](https://arxiv.org/abs/2107.08994) | 희소 SLAM + 학습된 밀도 매핑, 하이브리드 접근법 |

#### 신경 렌더링 (참조)

> NeRF/3DGS 기반 SLAM 시스템 → 아래 **E축** 참고

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
| [**ConceptGraphs**](level-05-deep-learning/conceptgraphs.md) | [Gu 2023](https://arxiv.org/abs/2309.16650) | 오픈 어휘 3D 장면 그래프, SAM + CLIP + LLM 관계 |

---


#### 의미론적 / 언어 기반 SLAM

| 시스템 | 저자/연도 | 핵심 개념 |
|--------|-------------|--------------|
| [**ConceptFusion**](level-05-deep-learning/conceptfusion.md) | [Jatavallabhula (MIT) 2023](https://arxiv.org/abs/2302.07241) | CLIP 특징을 3D 지도에 융합, 오픈 어휘 언어 질의 |
| [**LERF**](level-05-deep-learning/lerf.md) | [Kerr 2023](https://arxiv.org/abs/2303.09553) | 언어가 내재된 래디언스 필드, DINO 멀티스케일, NeRF + CLIP |
| [**OpenScene**](level-05-deep-learning/openscene.md) | [Peng (ETH) 2023](https://arxiv.org/abs/2211.15654) | 언어 특징을 3D 포인트 클라우드로 역투영 |
| [**SpatialLM**](level-05-deep-learning/spatiallm.md) | [Mao 2025](https://github.com/manycore-research/SpatialLM) | 포인트 클라우드 → LLM, Python 스크립트로서의 구조화된 실내 모델링 |

> 참고: [**LEGS**](https://arxiv.org/abs/2409.18108), [**OpenGS-SLAM**](https://arxiv.org/abs/2503.01646) (위의 E축); [**Open-YOLO 3D**](https://arxiv.org/abs/2406.02548) (레벨 5 객체 검출)

### E. 파운데이션 모델 및 신경망 표현 SLAM

#### 파운데이션 모델 SLAM

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
