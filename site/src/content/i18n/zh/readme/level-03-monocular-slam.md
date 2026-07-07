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


### SfM工具

| 系统 | 作者/年份 | 关键概念 |
|--------|-------------|--------------|
| [**COLMAP**](level-03-monocular-slam/colmap.md) | [Schönberger 2016](https://colmap.github.io/) | 事实标准的增量式SfM+MVS流水线(C++/CUDA, pycolmap绑定) |
| [**GLOMAP**](level-03-monocular-slam/glomap.md) | [Pan 2024](https://arxiv.org/abs/2407.20219) | 重新审视全局SfM — 与COLMAP兼容，建图速度大幅提升 |
| [**InstantSfM**](level-03-monocular-slam/instantsfm.md) | [Zhong 2025](https://arxiv.org/abs/2510.13310) | GPU原生的稀疏感知SfM流水线，相比COLMAP大幅提速 |

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
