### 关键概念
- **[VO与SLAM的区别](level-03-monocular-slam/vo-vs-slam.md)** — VO是局部的(无回环检测)，SLAM包含全局地图+回环检测
- **[尺度歧义](level-03-monocular-slam/scale-ambiguity.md)** — 单目SLAM的根本局限；从传统几何方法本身无法恢复绝对尺度(学习型度量深度先验，如Metric3D或MASt3R，可提供近似尺度)
- **[共视图(Covisibility graph)](level-03-monocular-slam/covisibility-graph.md)** — 关键帧之间共享地图点可见性；ORB-SLAM的核心数据结构
- **[视觉地点识别(VPR)](level-03-monocular-slam/visual-place-recognition-vpr.md)** — 识别曾到访过的地点，用于回环检测
- **[自监督深度估计](level-03-monocular-slam/self-supervised-depth.md)** — 在没有真值的情况下学习单目深度(Monodepth2, Godard 2019)

### 基于特征点的SLAM

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [视觉里程计(Visual Odometry)](level-03-monocular-slam/visual-odometry.md) | [Nistér 2004](https://ieeexplore.ieee.org/document/1315094) | 五点法本质矩阵求解器、RANSAC、三角化、VO(仅局部、无回环检测) |
| [**MonoSLAM**](level-03-monocular-slam/monoslam.md) | [Davison 2007](https://ieeexplore.ieee.org/document/4160954) | **首个实时单目SLAM**，基于EKF，单相机，稀疏3D地图，概率化特征初始化 |
| [PTAM](level-03-monocular-slam/ptam.md) | [Klein & Murray 2007](https://www.robots.ox.ac.uk/~gk/publications/KleinMurray2007ISMAR.pdf) | FAST特征、跟踪、**前端/后端分离**、并行线程、关键帧、建图、光束法平差、手动初始化 |
| [Visual-SLAM why filter?](level-03-monocular-slam/visual-slam-why-filter.md) | [Strasdat 2012](https://doi.org/10.1016/j.imavis.2012.02.009) | 光束法平差、尺度感知BA、仅运动BA(motion-only BA) |
| [**ORB-SLAM**](level-03-monocular-slam/orb-slam.md) | [Mur-Artal 2015](https://arxiv.org/abs/1502.00956) | ORB特征点、**自动初始化(单应矩阵与基础矩阵的选择)**、跟踪线程、基于共视图的局部BA + 回环检测时的全局BA、局部建图、大规模场景、回环检测、视觉词袋、全局优化、共视图、**地图点管理(剔除、合并)** |
| [Pop-up SLAM](level-03-monocular-slam/pop-up-slam.md) | [Yang 2016](https://arxiv.org/abs/1703.07334) | 线特征/面特征 |
| [PL-SLAM](level-03-monocular-slam/pl-slam.md) | [Pumarola 2017](https://www.albertpumarola.com/research/pl-slam/index.html) | 点特征/线特征 |
| [**ORB-SLAM2**](level-03-monocular-slam/orb-slam2.md) | [Mur-Artal 2017](https://arxiv.org/abs/1610.06475) | → 立体SLAM、→ RGB-D SLAM |
| [CubeSLAM](level-03-monocular-slam/cubeslam.md) | [Yang 2019](https://arxiv.org/abs/1806.00557) | 单目3D立方体检测+SLAM，9自由度物体表示 |
| [OpenVSLAM](level-03-monocular-slam/openvslam.md) | [Sumikura 2019](https://arxiv.org/abs/1910.01122) | 基于ORB的SLAM框架，透视/鱼眼/全景相机模型，地图保存/加载+定位模式 |
| [**Stella-VSLAM**](level-03-monocular-slam/stella-vslam.md) | [Community 2021](https://github.com/stella-cv/stella_vslam) | OpenVSLAM的继任者，重新采用新许可证(→ 也见于第7级) |
| [UcoSLAM](level-03-monocular-slam/ucoslam.md) | [Muñoz-Salinas 2019](https://arxiv.org/abs/1902.03729) | 基准标记(Fiducial markers) |
| [DeepFusion](level-03-monocular-slam/deepfusion.md) | [Laidlow 2019](https://arxiv.org/abs/2207.12244) | 稠密单目重建，半稠密MVS+CNN深度/梯度预测，基于学习不确定性的概率融合 |
| [**ORB-SLAM3**](level-03-monocular-slam/orb-slam3.md) | [Campos 2020](https://arxiv.org/abs/2007.11898) | 单目+立体+VIO，多地图，IMU集成 |
| [DXSLAM](level-03-monocular-slam/dxslam.md) | [Li 2020](https://arxiv.org/abs/2008.05416) | 用于SLAM的深度特征 |
| [**PyCuVSLAM**](level-03-monocular-slam/pycuvslam.md) | [NVIDIA 2025](https://github.com/NVlabs/pycuvslam) | Python+CUDA GPU加速VSLAM工具包(cuVSLAM封装；立体/多相机VIO) |

### 直接法SLAM

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**DTAM**](level-03-monocular-slam/dtam.md) | [Newcombe 2011](https://ieeexplore.ieee.org/document/6126513) | 稠密建图、关键帧建图、GPGPU |
| [**LSD-SLAM**](level-03-monocular-slam/lsd-slam.md) | [Engel 2014](https://cvg.cit.tum.de/research/vslam/lsdslam) | 光度误差最小化、高梯度像素/边缘、大规模场景、回环检测、位姿图优化 |
| [**DSO**](level-03-monocular-slam/dso.md) | [Engel 2016](https://arxiv.org/abs/1607.02565) | 光度光束法平差、滑动窗口BA、无回环检测/全局优化 |
| [**LDSO**](level-03-monocular-slam/ldso.md) | [Gao 2018](https://arxiv.org/abs/1808.01111) | DSO+回环检测(基于BoW)，弥补了DSO的主要短板 |
| [CNN-SLAM](level-03-monocular-slam/cnn-slam.md) | [Tateno 2017](https://arxiv.org/abs/1704.03489) | 深度来自LSD-SLAM+深度网络预测、语义标签 |
| [DVSO](level-03-monocular-slam/dvso.md) | [Yang 2018](https://arxiv.org/abs/1807.02570) | 深度单图像深度估计、StackNet |
| [D3VO](level-03-monocular-slam/d3vo.md) | [Yang 2020](https://arxiv.org/abs/2003.01060) | 深度单图像深度估计、深度位姿估计、深度不确定性(aleatoric uncertainty)建模 |

### 半直接法(混合方法)

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [SVO](level-03-monocular-slam/svo.md) | [Forster 2014](https://ieeexplore.ieee.org/document/6906584) | FAST特征检测、稀疏直接图像对齐、深度滤波器 |
| [SVO2](level-03-monocular-slam/svo2.md) | [Forster 2017](https://rpg.ifi.uzh.ch/svo2.html) | 多相机/鱼眼相机、概率深度估计、直接法收敛、稀疏方法、光束法平差 |
| [**Stereo DSO**](level-07-stereo-slam/stereo-dso.md) | [Wang 2017](https://arxiv.org/abs/1708.07878) | → 立体SLAM |
| [VI-DSO](level-06-vio-vins/vi-dso.md) | [von Stumberg 2018](https://arxiv.org/abs/1804.05625) | → VIO/VINS |

### 基于学习的SLAM

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**DROID-SLAM**](level-03-monocular-slam/droid-slam.md) | [Teed 2021](https://arxiv.org/abs/2108.10869) | 可微分BA、稠密光流、端到端学习(→ 也见于第5级) |
| [TartanVO](level-03-monocular-slam/tartanvo.md) | [Wang 2021](https://arxiv.org/abs/2011.00359) | 可泛化的视觉里程计 |
| [**DPVO**](level-03-monocular-slam/dpvo.md) | [Teed 2023](https://arxiv.org/abs/2208.04726) | 基于图像块(Patch)的轻量化DROID-SLAM，实时VO(→ 也见于第5级) |
| [**DPV-SLAM**](level-03-monocular-slam/dpv-slam.md) | [Lipson 2024](https://arxiv.org/abs/2408.01654) | DPVO+回环检测，完整SLAM(ECCV 2024) |
| [MAC-VO](level-03-monocular-slam/mac-vo.md) | [Qiu 2024](https://arxiv.org/abs/2409.09479) | 基于学习的VO，度量感知(metric-aware) |
| [**VoT**](level-03-monocular-slam/vot.md) | [Yugay 2025](https://arxiv.org/abs/2510.03348) | 基于Transformer的视觉里程计(后改名为FVO) |

### 基础模型SLAM

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**DUSt3R**](level-03-monocular-slam/dust3r.md) | [Wang 2024](https://arxiv.org/abs/2312.14132) | 从图像对回归点图(Pointmap)，无需标定 |
| [**MASt3R**](level-03-monocular-slam/mast3r.md) | [Leroy 2024](https://arxiv.org/abs/2406.09756) | DUSt3R+局部特征匹配 |
| [**MASt3R-SLAM**](level-03-monocular-slam/mast3r-slam.md) | [Murai 2024](https://arxiv.org/abs/2412.12392) | 基于MASt3R先验的实时稠密SLAM |
| [**VGGT**](level-03-monocular-slam/vggt.md) | [Wang (Meta) 2025](https://arxiv.org/abs/2503.11651) | 从N个视角前馈推断位姿、深度、点图、轨迹(**CVPR 2025最佳论文**) |
| [**VGGT-SLAM**](level-03-monocular-slam/vggt-slam.md) | [Maggio 2025](https://arxiv.org/abs/2505.12549) | 在SL(4)流形上优化的稠密RGB SLAM，VGGT前端 |
| [**VGGT-SLAM 2.0**](level-03-monocular-slam/vggt-slam-2-0.md) | [Maggio 2026](https://arxiv.org/abs/2601.19887) | 实时稠密前馈场景重建 |
| [**VGGT-Geo**](level-03-monocular-slam/vggt-geo.md) | [Qin 2026](https://www.mdpi.com/2220-9964/15/2/85) | 对VGGT先验进行概率几何融合，用于稠密室内SLAM |
| [**IGGT**](level-03-monocular-slam/iggt.md) | [Li 2025](https://arxiv.org/abs/2510.22706) | 实例基础几何Transformer(Instance-grounded geometry transformer) — 统一3D重建与实例级理解 |
| [**AMB3R**](level-03-monocular-slam/amb3r.md) | [Wang 2025](https://arxiv.org/abs/2511.20343) | 带后端的高精度前馈度量尺度3D重建，支持SfM/SLAM |
| [**MASt3R-Fusion**](level-03-monocular-slam/mast3r-fusion.md) | [Zhou 2025](https://arxiv.org/abs/2509.20757) | MASt3R前馈视觉模型+IMU+GNSS融合 |

#### SfM工具

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**COLMAP**](level-03-monocular-slam/colmap.md) | [Schönberger 2016](https://colmap.github.io/) | 事实标准的增量式SfM+MVS流水线(C++/CUDA, pycolmap绑定) |
| [**GLOMAP**](level-03-monocular-slam/glomap.md) | [Pan 2024](https://arxiv.org/abs/2407.20219) | 重新审视全局SfM — 与COLMAP兼容，建图速度大幅提升 |
| [**InstantSfM**](level-03-monocular-slam/instantsfm.md) | [Zhong 2025](https://arxiv.org/abs/2510.13310) | GPU原生的稀疏感知SfM流水线，相比COLMAP大幅提速 |

### 神经表征SLAM

#### 基于NeRF

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**iMAP**](level-03-monocular-slam/imap.md) | [Sucar 2021](https://arxiv.org/abs/2103.12352) | 首个NeRF-SLAM，单一MLP，实时跟踪/建图 |
| [**BARF**](level-03-monocular-slam/barf.md) | [Lin 2021](https://arxiv.org/abs/2104.06405) | 光束法平差式NeRF(Bundle-Adjusting NeRF)，由粗到精的位置编码，位姿与NeRF联合优化(非完整SLAM — 仅位姿+NeRF联合优化) |
| [**NICE-SLAM**](level-03-monocular-slam/nice-slam.md) | [Zhu & Peng 2022](https://arxiv.org/abs/2112.12130) | 分层特征网格(粗/中/细)，可扩展 |
| [**Co-SLAM**](level-03-monocular-slam/co-slam.md) | [Wang 2023](https://arxiv.org/abs/2304.14377) | 哈希网格(Instant-NGP)+坐标编码，比NICE-SLAM快5-10倍 |
| [**ESLAM**](level-03-monocular-slam/eslam.md) | [Johari 2023](https://arxiv.org/abs/2211.11704) | 三平面表征，O(N²)对比O(N³)的内存占用 |
| [**Point-SLAM**](level-03-monocular-slam/point-slam.md) | [Sandström 2023](https://arxiv.org/abs/2304.04278) | 基于神经点云 |
| [**NeRF-SLAM**](level-03-monocular-slam/nerf-slam.md) | [Rosinol 2023](https://arxiv.org/abs/2210.13641) | NeRF+传统SLAM流水线 |
| [**NICER-SLAM**](level-03-monocular-slam/nicer-slam.md) | [Zhu 2024](https://arxiv.org/abs/2302.03594) | 仅RGB的NeRF-SLAM(无深度传感器)，融合单目深度估计 |
| [**vMAP**](level-03-monocular-slam/vmap.md) | [Kong 2023](https://arxiv.org/abs/2302.01838) | 物体级NeRF-SLAM，逐物体神经场 |
| [**GO-SLAM**](level-03-monocular-slam/go-slam.md) | [Zhang 2023](https://arxiv.org/abs/2309.02436) | 全局优化+NeRF-SLAM，回环检测+全局BA |

#### 基于3D高斯溅射(3DGS)

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**SplaTAM**](level-03-monocular-slam/splatam.md) | [Keetha 2024](https://arxiv.org/abs/2312.02126) | 最早的3DGS SLAM系统之一(与GS-SLAM、MonoGS同期)，RGB-D，基于轮廓引导的稠密化 |
| [**MonoGS**](level-03-monocular-slam/monogs.md) | [Matsuki 2024](https://arxiv.org/abs/2312.06741) | 首个单目3DGS SLAM(CVPR 2024 highlight)，基于直接光栅化的跟踪，解析相机雅可比矩阵 |
| [**GS-ICP SLAM**](level-03-monocular-slam/gs-icp-slam.md) | [Ha 2024](https://arxiv.org/abs/2403.12550) | 高斯到高斯ICP(马氏距离)，几何跟踪 |
| [**Photo-SLAM**](level-03-monocular-slam/photo-slam.md) | [Huang 2024](https://arxiv.org/abs/2311.16728) | 显式几何+隐式外观(MLP颜色)，抗锯齿 |
| [**RTG-SLAM**](level-03-monocular-slam/rtg-slam.md) | [Peng 2024](https://arxiv.org/abs/2404.19706) | 专注实时性，自适应高斯预算，Jetson Orin上25 FPS |
| [**EGG-Fusion**](level-03-monocular-slam/egg-fusion.md) | [Pan 2025](https://arxiv.org/abs/2512.01296) | 在线几何感知高斯面元融合，基于信息滤波器，实时 |
| [**Online 3DGS Modeling**](level-03-monocular-slam/online-3dgs-modeling.md) | [Lee 2025](https://arxiv.org/abs/2508.14014) | 具备新视角选择的在线3D高斯溅射建模 |
| [**ActiveSplat**](level-03-monocular-slam/activesplat.md) | [Li 2025](https://arxiv.org/abs/2410.21955) | 结合3DGS与基于Voronoi的路径规划的主动建图 |
| [**OpenGS-SLAM**](level-03-monocular-slam/opengs-slam.md) | [Yang 2025](https://arxiv.org/abs/2503.01646) | 开放集稠密语义3DGS SLAM，物体级场景理解 |
| [**LEGS**](level-03-monocular-slam/legs.md) | [Yu 2024](https://arxiv.org/abs/2409.18108) | 语言嵌入高斯溅射(Language Embedded Gaussian Splats)，实时语言可查询的3D场景 |

### 语义/语言引导SLAM

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**ConceptFusion**](level-03-monocular-slam/conceptfusion.md) | [Jatavallabhula (MIT) 2023](https://arxiv.org/abs/2302.07241) | CLIP特征融合进3D地图，开放词汇语言查询 |
| [**LERF**](level-03-monocular-slam/lerf.md) | [Kerr 2023](https://arxiv.org/abs/2303.09553) | 语言嵌入辐射场(Language Embedded Radiance Fields)，DINO多尺度特征，NeRF+CLIP |
| [**OpenScene**](level-03-monocular-slam/openscene.md) | [Peng (ETH) 2023](https://arxiv.org/abs/2211.15654) | 语言特征反投影到3D点云 |
| [**ConceptGraphs**](level-05-deep-learning/conceptgraphs.md) | [Gu 2023](https://arxiv.org/abs/2309.16650) | 开放词汇3D场景图，SAM+CLIP+LLM空间关系 |
| [**SpatialLM**](level-03-monocular-slam/spatiallm.md) | [Mao 2025](https://github.com/manycore-research/SpatialLM) | 点云→LLM，将结构化室内建模表示为Python脚本 |

> 另见: [**LEGS**](https://arxiv.org/abs/2409.18108)、[**OpenGS-SLAM**](https://arxiv.org/abs/2503.01646)(见上文基于3DGS部分)；[**Open-YOLO 3D**](https://arxiv.org/abs/2406.02548)(第5级 物体检测)

### 动态环境SLAM

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**DynaSLAM**](level-03-monocular-slam/dynaslam.md) | [Bescós 2018](https://arxiv.org/abs/1806.05620) | Mask R-CNN动态物体剔除+背景补全(inpainting)，基于ORB-SLAM2 |
| [DS-SLAM](level-03-monocular-slam/ds-slam.md) | [Yu 2018](https://arxiv.org/abs/1809.08379) | 语义分割(SegNet)+运动一致性检查 |
| [MaskFusion](level-03-monocular-slam/maskfusion.md) | [Rünz 2018](https://arxiv.org/abs/1804.09194) | RGB-D场景中多个运动物体的识别、跟踪与重建 |
| [MID-Fusion](level-03-monocular-slam/mid-fusion.md) | [Xu 2019](https://arxiv.org/abs/1812.07976) | 基于八叉树的物体级多实例动态RGB-D SLAM |
| [**VDO-SLAM**](level-03-monocular-slam/vdo-slam.md) | [Zhang 2020](https://arxiv.org/abs/2005.11052) | 动态物体感知SLAM，相机运动与物体运动联合估计 |
| [DynaSLAM II](level-03-monocular-slam/dynaslam-ii.md) | [Bescós 2021](https://arxiv.org/abs/2010.07820) | 紧耦合的多物体跟踪与SLAM |
| [**MonST3R**](level-03-monocular-slam/monst3r.md) | [Zhang 2024](https://arxiv.org/abs/2410.03825) | 在存在运动的场景下进行DUSt3R系列点图估计 |
