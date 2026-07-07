# RTG-SLAM

> Peng 2024 · [论文](https://arxiv.org/abs/2404.19706)

**一句话总结** — 实时高斯 SLAM（SIGGRAPH 2024），通过紧凑的二值不透明度高斯表示、类表面元（surfel）风格的深度渲染，以及一种仅优化不稳定高斯、仅渲染其像素的即时机制，将 3DGS 重建扩展到大场景。

## 问题

早期的 3DGS SLAM 系统在每帧都要优化每一个高斯并渲染每一个像素，因此计算代价随地图规模增长——同期最快的高斯 SLAM 在合成的 Replica 数据集上也只报告了 8.34 fps，且没有一个能展示完整的真实大场景。原生 3DGS 还会用许多相互重叠的半透明高斯来拟合表面，浪费内存与计算。RTG-SLAM 是"一个使用高斯溅射、配合 RGBD 相机用于大规模环境的实时 3D 重建系统"，其设计使每帧代价随场景*变化量*而非地图规模变化。

## 方法与架构

每个高斯携带位置 $\mathbf{p}_i$、协方差 $\boldsymbol{\Sigma}_i$（尺度 $\mathbf{s}_i$ + 四元数 $\mathbf{q}_i$）、不透明度 $\alpha_i$ 和球谐系数，此外还被视为一个带法向 $\mathbf{n}_i$、置信度计数 $\eta_i$ 和时间戳 $t_i$ 的椭球盘（表面元）。不透明度在创建时即固定：**不透明**（$\alpha=0.99$，拟合表面与主色）或**近乎透明**（$\alpha=0.1$，拟合残余颜色）——不使用深层的 alpha 混合堆栈。

- **颜色与深度渲染**：颜色采用标准 alpha 混合 $\hat{\mathbf{C}}(\mathbf{u})=\sum_{i=1}^{n}\mathbf{c}_{i}f_{i}(\mathbf{u})\prod_{j=1}^{i-1}(1-f_{j}(\mathbf{u}))$，其中 $f(\mathbf{u})=\alpha_{i}\exp(-\frac{1}{2}(\mathbf{u}-\boldsymbol{\mu})^{\top}\boldsymbol{\Sigma}_{2D,i}^{-1}(\mathbf{u}-\boldsymbol{\mu}))$，再加上一个透光率图 $\hat{\mathbf{T}}(\mathbf{u})=\prod_{i}(1-f_{i}(\mathbf{u}))$。深度的渲染方式*不同*：沿射线上第一个满足 $\alpha^{\mathbf{r}}_{j}>\delta_{\alpha}=e^{-0.5}$ 的不透明高斯被视为一个圆盘，像素深度由射线-平面交点给出

$$\mathbf{p}_{G_{j}^{\mathbf{r}},\mathbf{r}}=(\mathbf{R}_{g}\mathbf{K}^{-1}\dot{\mathbf{u}})\,\theta_{\mathbf{u}}+\mathbf{t}_{g},\qquad \theta_{\mathbf{u}}=\frac{(\mathbf{p}_{j}^{\mathbf{r}}-\mathbf{t}_{g})\cdot\mathbf{n}_{j}^{\mathbf{r}}}{(\mathbf{R}_{g}\mathbf{K}^{-1}\dot{\mathbf{u}})\cdot\mathbf{n}_{j}^{\mathbf{r}}},$$

  该表达式完全可微，使单个不透明高斯就能独自拟合一个局部表面片。法向图和索引图也在同一渲染过程中自然得到。
- **有针对性地新增高斯**：每帧中，掩膜挑选出需要新几何的像素：$M_{s}$ 对应透光率 $\hat{\mathbf{T}}_{k}(\mathbf{u})>\delta_{\mathbf{T}}=0.5$（新观测到的区域）或 $|\hat{\mathbf{D}}_{k}-\mathbf{D}_{k}|>\delta_{d}=0.1$（深度误差过大）的像素，$M_{c}$ 对应仅颜色误差超过 $\delta_{c}=0.1$ 的像素；对掩膜内 5% 的像素进行采样。$M_s$ 内的像素生成不透明高斯；$M_c$ 内的像素仅在其对应的不透明高斯已经稳定的情况下才生成小的透明高斯。
- **稳定/不稳定优化**：置信度 $\eta>\delta_{\eta}$ 的高斯被视为稳定并冻结；"我们只优化不稳定的高斯，且只渲染被不稳定高斯占据的像素"，损失函数为 $L=w_{c}L_{color}+w_{d}L_{depth}+w_{reg}L_{reg}$（颜色/深度采用 $L_1$ 损失；$L_{reg}$ 固定透明高斯的几何形态；$w_c=w_d=1$，$w_{reg}=1000$）。优化后的窗口通过加权平均 $G_{o}=(1-w_{curr})G_{o-1}+w_{curr}G^{\prime}_{o}$ 与先前状态融合以避免遗忘；反复出错的稳定高斯会退回不稳定状态，长期处于不稳定状态的高斯则作为异常值被删除。
- **跟踪**：经典的帧到模型 ICP，针对渲染出的深度/法向图，最小化点到平面误差 $E(\boldsymbol{\xi})=\sum\lVert(\mathbf{T}_{g,k}\mathbf{V}_{k}^{l}(\mathbf{u})-\hat{\mathbf{V}}_{k-1}^{g*}(\hat{\mathbf{u}}))\cdot\hat{\mathbf{N}}_{k-1}^{*}(\hat{\mathbf{u}})\rVert$，采用多层级 ICP，并配有类似 ORB-SLAM2 的地标/位姿图后端；关键帧（每 30° 或 0.3 m 触发一次）会触发对误差最高 40% 像素的全局优化。

## 实验结果

在配备 i9-13900KF + RTX 4090 的机器上，使用 Azure Kinect 进行实时扫描：

- **真实大场景**：走廊、储藏室、酒店房间、住宅、办公室（43–100 平方米）能以约 16 fps 的速度实时重建。在约 70 平方米的住宅场景中：17.9 fps、8.8 GB 显存，对比 Co-SLAM 的 8.65 fps / 17.3 GB（相当于当前最先进 NeRF SLAM"速度约两倍、内存开销约一半"）；SplaTAM 只能达到 0.31 fps 且内存溢出，在 OOM 前使用了 7,155,880 个高斯，而 RTG-SLAM 只用了 987,524 个。
- **Replica office0 吞吐量**：整体 17.24 FPS；跟踪 0.02 秒/帧，建图 3.5 毫秒/迭代，峰值内存 2751 MB——大约是 SplaTAM 重建速度的 46 倍。
- **TUM ATE RMSE**：1.66 / 0.38 / 1.13 cm（fr1_desk / fr2_xyz / fr3_office），平均 1.06 cm——优于 ESLAM（2.11）、Point-SLAM（2.38）、SplaTAM（3.39），接近 ORB-SLAM2（1.00）。
- **ScanNet++ 几何精度（已知真值位姿）**：精度 0.95 cm / 完整度 1.11 cm，优于 SplaTAM（1.32/1.54），也优于除 Point-SLAM 外的所有 NeRF 方法（Point-SLAM 在采样时使用了真值深度）。
- 消融实验表明，与 alpha 混合深度相比，紧凑高斯在达到相同深度精度时所需的基元数量要少得多；且纯不透明地图在新视角下会因缺乏透明残余层而出现颜色误差。

## 对SLAM的意义

RTG-SLAM 展示了如何让高斯 SLAM 的计算量与场景*变化量*成正比而非与地图规模成正比——这一思路正是让经典大规模 SLAM 变得可行的关键（局部 BA、共视窗口），在溅射（splatting）时代通过 KinectFusion 式的 ICP 跟踪与表面元式的置信度记账被重新演绎。其稳定/不稳定状态管理与基于圆盘的深度渲染，成为将高斯 SLAM 扩展到真实建筑和真实机器人上的参考设计。

## 相关条目

- [SplaTAM](splatam.md)
- [Photo-SLAM](photo-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [MonoGS](monogs.md)
- [EGG-Fusion](egg-fusion.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
