### 关键概念
- **[学习型方法与手工设计方法](level-05-deep-learning/learned-vs-hand-crafted.md)** — 用网络替换单个传统模块(特征、深度、匹配) 对比 端到端学习
- **[可微分性](level-05-deep-learning/differentiability.md)** — 使传统优化方法(RANSAC、BA)可微分，从而能够进行端到端训练
- **[基础模型](level-05-deep-learning/foundation-models.md)** — 大型预训练模型(CLIP、SAM、DUSt3R系列)作为可复用的感知骨干网络

> 第5级分为四大支柱:
> **A. 前端** — 用学习型感知组件替代手工设计模块
> **B. 后端** — 用学习型/可证明最优的优化方法替代传统求解器
> **C. 系统** — 端到端深度VO/SLAM流水线
> **D. 场景理解** — 基于SLAM地图的语义、语言与关系推理

### A. 深度前端 — 感知

#### 特征检测与匹配

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**NetVLAD**](level-05-deep-learning/netvlad.md) | [Arandjelović 2016](https://arxiv.org/abs/1511.07247) | VLAD、地点识别 |
| [**SuperPoint**](level-05-deep-learning/superpoint.md) | [DeTone 2017](https://arxiv.org/abs/1712.07629) | 单应自适应(Homographic Adaptation)、自监督、VGG编码器+检测器/描述子头 |
| [HardNet](level-05-deep-learning/hardnet.md) | [Mishchuk 2017](https://arxiv.org/abs/1705.10872) | 学习型局部描述子 |
| [**R2D2**](level-05-deep-learning/r2d2.md) | [Revaud 2019](https://arxiv.org/abs/1906.06195) | 可重复且可靠的检测器/描述子，显式的重复性/可靠性图 |
| [KeyNet](level-05-deep-learning/keynet.md) | [Barroso-Laguna 2019](https://arxiv.org/abs/1904.00889) | 学习型关键点检测器 |
| [**HF-Net**](level-05-deep-learning/hf-net.md) | [Sarlin 2019](https://arxiv.org/abs/1812.03506) | 全局特征、局部特征、视觉定位 |
| [**SuperGlue**](level-05-deep-learning/superglue.md) | [Sarlin 2020](https://arxiv.org/abs/1911.11763) | 自注意力/交叉注意力图神经网络(GNN)、Sinkhorn最优分配、用于处理外点的垃圾箱(dustbin) |
| [**DISK**](level-05-deep-learning/disk.md) | [Tyszkiewicz 2020](https://arxiv.org/abs/2006.13566) | 策略梯度(强化学习)训练，将匹配成功/失败作为奖励 |
| [Patch NetVLAD](level-05-deep-learning/patch-netvlad.md) | [Hausler 2021](https://arxiv.org/abs/2103.01486) | 多尺度图像块级VLAD |
| [**LoFTR**](level-05-deep-learning/loftr.md) | [Sun 2021](https://arxiv.org/abs/2104.00680) | 无检测器(Detector-free)、Transformer由粗到精的稠密匹配 |
| [**LightGlue**](level-05-deep-learning/lightglue.md) | [Lindenberger 2023](https://arxiv.org/abs/2306.13643) | 自适应深度/宽度，比SuperGlue快5-10倍 |
| [**XFeat**](level-05-deep-learning/xfeat.md) | [Potje 2024](https://arxiv.org/abs/2404.19174) | 0.3M参数、1400 FPS(RTX 4090)、64维描述子，适合嵌入式设备 |
| [**RoMa**](level-05-deep-learning/roma.md) | [Edstedt 2024](https://arxiv.org/abs/2305.15404) | DINOv2基础特征+由粗到精稠密匹配 |
| [**DeDoDe**](level-05-deep-learning/dedode.md) | [Edstedt 2024](https://arxiv.org/abs/2308.08479) | 一阶段联合检测与描述 |
| [**RoMa v2**](level-05-deep-learning/roma-v2.md) | [Edstedt 2025](https://arxiv.org/abs/2511.15706) | 更难、更好、更快、更稠密的稠密特征匹配 |

#### 深度估计

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [MonoDepth](level-05-deep-learning/monodepth.md) | [Godard 2016](https://arxiv.org/abs/1609.03677) | 左右光度一致性，自监督 |
| [**MiDaS**](level-05-deep-learning/midas.md) | [Ranftl 2020](https://arxiv.org/abs/1907.01341) | 多数据集混合训练、尺度与偏移不变损失、相对深度 |
| [**DPT**](level-05-deep-learning/dpt.md) | [Ranftl 2021](https://arxiv.org/abs/2103.13413) | 稠密预测Transformer(ViT骨干网络)，全局上下文 |
| [**ZoeDepth**](level-05-deep-learning/zoedepth.md) | [Bhat 2023](https://arxiv.org/abs/2302.12288) | 零样本度量深度、度量分箱模块(Metric Bins Module) |
| [**Metric3D**](level-05-deep-learning/metric3d.md) | [Yin 2023](https://arxiv.org/abs/2307.10984) | 基于相机内参条件的度量深度、规范相机空间(Canonical Camera Space) |
| [**Depth Anything**](level-05-deep-learning/depth-anything.md) | [Yang 2024](https://arxiv.org/abs/2401.10891) | 6200万张图像、单目深度基础模型 |
| [**Depth Anything V2**](level-05-deep-learning/depth-anything-v2.md) | [Yang 2024](https://arxiv.org/abs/2406.09414) | 使用合成数据改进，边缘保持效果更佳 |
| [**Marigold**](level-05-deep-learning/marigold.md) | [Ke 2024](https://arxiv.org/abs/2312.02145) | 用Stable Diffusion做深度估计，细节丰富，通过采样获得不确定性 |
| [**Align3R**](level-05-deep-learning/align3r.md) | [Lu 2025](https://arxiv.org/abs/2412.03079) | 视频时序一致性，基于DUSt3R，CVPR 2025 Highlight |
| [**Masked Depth Modeling (LingBot-Depth)**](level-05-deep-learning/masked-depth-modeling-lingbot-depth.md) | [Tan 2026](https://arxiv.org/abs/2601.17895) | 修复了RGB-D在玻璃/镜面/金属材质上的失效问题 |

#### 光流与场景流

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**FlowNet**](level-05-deep-learning/flownet.md) | [Dosovitskiy 2015](https://arxiv.org/abs/1504.06852) | 首个端到端深度光流网络(SimpleNet / CorrNet) |
| [**FlowNet 2.0**](level-05-deep-learning/flownet-2-0.md) | [Ilg 2017](https://arxiv.org/abs/1612.01925) | 堆叠网络，达到传统方法级别的精度 |
| [**PWC-Net**](level-05-deep-learning/pwc-net.md) | [Sun 2018](https://arxiv.org/abs/1709.02371) | 金字塔-变形-代价体(Pyramid-Warping-Cost volume)，由粗到精，840万参数 |
| [**FlowNet3D**](level-05-deep-learning/flownet3d.md) | [Liu 2019](https://arxiv.org/abs/1806.01411) | 点云场景流，基于PointNet++ |
| [**RAFT**](level-05-deep-learning/raft.md) | [Teed 2020](https://arxiv.org/abs/2003.12039) | 全局对关联(All-Pairs Correlation)+迭代ConvGRU更新，**ECCV最佳论文** |
| [**RAFT-3D**](level-05-deep-learning/raft-3d.md) | [Teed 2021](https://arxiv.org/abs/2012.00726) | 基于RAFT的场景流(3D运动) |
| [**FlowFormer**](level-05-deep-learning/flowformer.md) | [Huang 2022](https://arxiv.org/abs/2203.16194) | 在代价体token上应用Transformer，全局上下文 |
| [**SEA-RAFT**](level-05-deep-learning/sea-raft.md) | [Wang 2024](https://arxiv.org/abs/2405.14793) | 面向实时应用的高效RAFT变体 |

#### 相机位姿回归与重定位

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**PoseNet**](level-05-deep-learning/posenet.md) | [Kendall 2015](https://arxiv.org/abs/1505.07427) | 基于CNN的6自由度位姿回归(APR)，GoogLeNet骨干网络 |
| [**DSAC**](level-05-deep-learning/dsac.md) | [Brachmann 2017](https://arxiv.org/abs/1611.05705) | 可微分RANSAC，场景坐标回归(SCR) |
| [**DSAC++**](level-05-deep-learning/dsacpp.md) | [Brachmann 2018](https://arxiv.org/abs/1711.10228) | 自监督，支持RGB-D |
| [CNN位姿回归的局限性](level-05-deep-learning/cnn-pose-regression-limitations.md) | [Sattler 2019](https://arxiv.org/abs/1903.07504) | 位姿回归性能≈图像检索性能 |
| [LM-Reloc](level-05-deep-learning/lm-reloc.md) | [von Stumberg 2020](https://arxiv.org/abs/2010.06323) | 深度直接法重定位 |
| [**DSAC\***](level-05-deep-learning/dsac-star.md) | [Brachmann 2021](https://arxiv.org/abs/2002.12324) | 基于RGB/RGB-D的视觉重定位，改进了学习稳定性(TPAMI) |
| [**ACE**](level-05-deep-learning/ace.md) | [Brachmann 2023](https://arxiv.org/abs/2305.14059) | 加速坐标编码(Accelerated Coordinate Encoding)，每场景仅需5分钟训练 |
| [**ACE Zero**](level-05-deep-learning/ace-zero.md) | [Brachmann 2024](https://arxiv.org/abs/2404.14351) | 零样本SCR，不需要预先构建3D地图 |
| [**ACE-G**](level-05-deep-learning/ace-g.md) | [Bruns 2025](https://arxiv.org/abs/2510.11605) | 通过查询预训练实现可泛化SCR，新场景无需微调 |
| [**ACE-SLAM**](level-05-deep-learning/ace-slam.md) | [Alzugaray 2025](https://arxiv.org/abs/2512.14032) | 神经隐式实时SLAM，网络权重即地图 |
| [**hloc**](level-05-deep-learning/hloc.md) | [Sarlin 2019](https://github.com/cvg/Hierarchical-Localization) | 实现HF-Net层次化定位思想的工具箱: 粗定位(NetVLAD)→精定位(SuperGlue) |

#### 面向SLAM的物体检测与分割

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**YOLO**](level-05-deep-learning/yolo.md)(v1→v11) | [Redmon 2016→2024](https://arxiv.org/abs/1506.02640) | 实时物体检测，Ultralytics生态系统 |
| [**DETR**](level-05-deep-learning/detr.md) | [Carion 2020](https://arxiv.org/abs/2005.12872) | Transformer检测，无锚框(anchor-free)，无需NMS |
| [**RT-DETR**](level-05-deep-learning/rt-detr.md) | [Zhao (Baidu) 2023](https://arxiv.org/abs/2304.08069) | 实时DETR，兼具YOLO的速度与Transformer的质量 |
| [**SAM**](level-05-deep-learning/sam.md) | [Kirillov 2023](https://arxiv.org/abs/2304.02643) | Segment Anything，基于提示，基础模型 |
| [**SAM 2**](level-05-deep-learning/sam-2.md) | [Meta 2024](https://arxiv.org/abs/2408.00714) | 视频分割，记忆注意力(Memory Attention)，时序一致性 |
| [**Grounding DINO**](level-05-deep-learning/grounding-dino.md) | [Liu 2023](https://arxiv.org/abs/2303.05499) | 文本提示检测→SAM流水线(Grounded SAM) |
| [**Open-YOLO 3D**](level-05-deep-learning/open-yolo-3d.md) | [Boudjoghra 2024](https://arxiv.org/abs/2406.02548) | 2D开放词汇检测→3D实例分割，速度提升16倍 |

### B. 深度后端 — 优化

#### 可微分光束法平差

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**BA-Net**](level-05-deep-learning/ba-net.md) | [Tang 2019](https://arxiv.org/abs/1806.04807) | FPN+可微分LM层，端到端SfM(ICLR) |
| [**DROID-SLAM**](level-03-monocular-slam/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 稠密光流+可微分稠密BA，全像素重投影 |
| [**DPVO**](level-03-monocular-slam/dpvo.md) | [Teed 2023](https://arxiv.org/abs/2208.04726) | 基于图像块的轻量化DROID-SLAM，30+ FPS实时 |
| [**Theseus**](level-05-deep-learning/theseus.md) | [Pineda (Meta) 2022](https://arxiv.org/abs/2207.09442) | 可微分非线性优化库(PyTorch) |
| [**Lietorch**](level-05-deep-learning/lietorch.md) | [Teed 2021](https://github.com/princeton-vl/lietorch) | 面向PyTorch的李群运算(SE(3)/SO(3)) |

#### 可证明最优算法

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**SE-Sync**](level-05-deep-learning/se-sync.md) | [Rosen 2019](https://arxiv.org/abs/1611.00128) | 通过SDP+黎曼优化实现可证明的位姿图优化(arXiv 2016, IJRR 2019) |
| [**TEASER++**](level-05-deep-learning/teaserpp.md) | [Yang 2020](https://arxiv.org/abs/2001.07715) | 点云配准，对90%以上外点鲁棒，TLS+最大团(T-RO/RSS 2020) |
| [**GNC**](level-05-deep-learning/gnc.md) | [Yang 2020](https://arxiv.org/abs/1909.08605) | 渐进非凸化(Graduated Non-Convexity)，从凸优化连续过渡到鲁棒代价函数 |
| [**QUASAR**](level-05-deep-learning/quasar.md) | [Yang 2019](https://arxiv.org/abs/1905.12536) | 可证明最优的旋转搜索(含外点的Wahba问题)，四元数QCQP+SDP松弛 |

#### 高斯信念传播与图处理器

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**FutureMapping 1**](level-05-deep-learning/futuremapping-1.md) | [Davison 2018](https://arxiv.org/abs/1803.11288) | Spatial AI的计算结构，用于SLAM的高斯信念传播(GBP) |
| [**FutureMapping 2**](level-05-deep-learning/futuremapping-2.md) | [Davison 2019](https://arxiv.org/abs/1910.14139) | 将GBP作为Spatial AI的核心基础，GBP的可视化介绍 |
| [**BA on Graph Processor**](level-05-deep-learning/ba-on-graph-processor.md) | [Ortiz 2020](https://arxiv.org/abs/2003.03134) | 在Graphcore IPU上进行光束法平差，基于分块(tile)的并行化 |
| [**DANCeRS**](level-05-deep-learning/dancers.md) | [Patwardhan 2025](https://arxiv.org/abs/2508.18153) | 基于GBP的机器人集群分布式共识 |

### C. 端到端深度VO/SLAM系统

#### 自监督与学习型VO

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [DeepVO](level-05-deep-learning/deepvo.md) | [Wang 2017](https://arxiv.org/abs/1709.08429) | 有监督学习 |
| [SfM-Learner](level-05-deep-learning/sfm-learner.md) | [Zhou 2017](https://arxiv.org/abs/1704.07813) | 无监督，深度深度估计+深度位姿估计 |
| [DeMoN](level-05-deep-learning/demon.md) | [Ummenhofer 2017](https://arxiv.org/abs/1612.02401) | 从两帧中估计深度+运动，编码器-解码器结构 |
| [UndeepVO](level-05-deep-learning/undeepvo.md) | [Li 2018](https://arxiv.org/abs/1709.06841) | 立体自监督，绝对尺度恢复 |
| [DeepTAM](level-05-deep-learning/deeptam.md) | [Zhou 2018](https://arxiv.org/abs/1808.01900) | 深度跟踪与建图，基于代价体 |
| [DeepV2D](level-05-deep-learning/deepv2d.md) | [Teed 2018](https://arxiv.org/abs/1812.04605) | 从视频中迭代估计深度，可微分几何层 |
| [Depth from Videos in the Wild](level-05-deep-learning/depth-from-videos-in-the-wild.md) | [Gordon 2019](https://arxiv.org/abs/1904.04998) | 无约束视频深度估计，学习型相机内参 |
| [Neural Ray Surfaces](level-05-deep-learning/neural-ray-surfaces.md) | [Vasiljevic 2020](https://arxiv.org/abs/2008.06630) | 学习型光线表面模型，非针孔相机 |
| [GradSLAM](level-05-deep-learning/gradslam.md) | [Murthy 2020](https://arxiv.org/abs/1910.10672) | 可微分SLAM框架(PyTorch，支持多种SLAM后端) |
| [DeepSLAM](level-05-deep-learning/deepslam.md) | [Li 2020](https://ieeexplore.ieee.org/document/9047170) | TrackingNet、MappingNet、LoopNet |
| [MonoRec](level-05-deep-learning/monorec.md) | [Wimbauer 2021](https://arxiv.org/abs/2011.11814) | 自监督单目3D重建，运动物体处理 |
| [TANDEM](level-05-deep-learning/tandem.md) | [Koestler 2021](https://arxiv.org/abs/2111.07418) | 通过MVS深度实现实时跟踪+稠密建图，基于DSO |
| [**DROID-SLAM**](level-03-monocular-slam/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 稠密BA+关联，TartanAir/EuRoC上SOTA(→ 见可微分BA部分) |
| [**DPVO**](level-03-monocular-slam/dpvo.md) | [Teed 2023](https://arxiv.org/abs/2208.04726) | 基于图像块的轻量化DROID(→ 见可微分BA部分) |

#### 潜表征SLAM

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**CodeSLAM**](level-05-deep-learning/codeslam.md) | [Bloesch 2018](https://arxiv.org/abs/1804.00874) | 深度表示为128维潜编码，在编码+位姿上进行光度BA |
| [**SceneCode**](level-05-deep-learning/scenecode.md) | [Zhi 2019](https://arxiv.org/abs/1903.06482) | 深度+语义共享单一潜编码，跨模态约束 |
| [**DeepFactors**](level-05-deep-learning/deepfactors.md) | [Czarnowski 2020](https://arxiv.org/abs/2001.05049) | 概率深度编码+因子图，GPU上30+ FPS |
| [**NodeSLAM**](level-05-deep-learning/nodeslam.md) | [Sucar 2020](https://arxiv.org/abs/2004.04485) | 物体级DeepSDF编码，逐物体占据VAE |
| [**CodeMapping**](level-05-deep-learning/codemapping.md) | [Matsuki 2021](https://arxiv.org/abs/2107.08994) | 稀疏SLAM+学习型稠密建图，混合方法 |

#### 神经渲染(参考)

> 基于NeRF/3DGS的SLAM系统 → 见 **第3级: 神经表征SLAM**

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**NeRF**](level-05-deep-learning/nerf.md) | [Mildenhall 2020](https://arxiv.org/abs/2003.08934) | 神经辐射场，新视角合成(奠基性工作) |
| [**DIFIX3D+**](level-05-deep-learning/difix3d.md) | [Wu 2025](https://arxiv.org/abs/2503.01774) | 单步扩散模型用于3D重建伪影去除(后处理) |

### D. 场景理解

#### 基准与基础

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**EFM3D**](level-05-deep-learning/efm3d.md) | [Straub (Meta) 2024](https://arxiv.org/abs/2406.10224) | 第一人称视角基础模型3D基准，从第一人称视频中提取深度/表面/语义 |

#### 3D场景图

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [Kimera / 3D动态场景图](level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) | [Rosinol 2020](https://arxiv.org/abs/2002.06289) | Kimera-VIO、Kimera-Mesher、Kimera-PGMO、Kimera-Semantics、Kimera-DSG(立体/单目视觉惯性流水线) |
| [**Hydra**](level-05-deep-learning/hydra.md) | [Hughes (MIT SPARK) 2022](https://arxiv.org/abs/2201.13360) | 实时分层场景图(网格→物体→区域→房间→建筑) |
| [**Hydra-Multi**](level-05-deep-learning/hydra-multi.md) | [Chang 2023](https://arxiv.org/abs/2304.13487) | 分布式多机器人3D场景图 |
| [**Clio**](level-05-deep-learning/clio.md) | [Maggio (MIT SPARK) 2024](https://arxiv.org/abs/2404.13696) | 开放集任务驱动场景图，每节点带CLIP嵌入 |
| [**Khronos**](level-05-deep-learning/khronos.md) | [Schmid (MIT SPARK) 2024](https://arxiv.org/abs/2402.13817) | 时空场景图，动态物体历史跟踪 |
| [**ConceptGraphs**](level-05-deep-learning/conceptgraphs.md) | [Gu 2023](https://arxiv.org/abs/2309.16650) | 开放词汇3D场景图，SAM+CLIP+LLM关系推理(→ 也见于第3级 语义) |
