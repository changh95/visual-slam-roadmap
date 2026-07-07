# MonoGS

> Matsuki 2024 · [论文](https://arxiv.org/abs/2312.06741)

**一句话总结** — "Gaussian Splatting SLAM"（CVPR 2024 highlight）：将3D高斯溅射首次应用于单目SLAM，仅用高斯作为3D表示，并通过对光栅化地图进行直接优化来跟踪相机，实时速度达3 fps。

## 问题

3D高斯溅射借助快速的可微光栅化生成照片级真实感地图，但原始3DGS算法"需要来自离线Structure from Motion（SfM）系统的精确位姿"——它是一种给定位姿的批处理方法。要在SLAM*内部*使用它，则意味着相反的方向：从高斯中估计位姿，同时从实时相机流中递增式地构建高斯，这是"视觉SLAM中最基础但也最困难的设置"——单一的单目RGB视频流，其中光栅化在视线方向上不施加任何约束，新插入的高斯在被多个视角约束之前几何上是模糊的。

## 方法与架构

地图由一组各向异性高斯$\mathcal{G}$构成，每个高斯具有颜色$c^i$、不透明度$\alpha^i$、世界坐标系下的均值$\boldsymbol{\mu}_W^i$和协方差$\boldsymbol{\Sigma}_W^i$（球谐函数被省略）。像素颜色通过溅射并对$\mathcal{N}$个按深度排序的高斯进行alpha混合合成：

$$\mathcal{C}_p=\sum_{i\in\mathcal{N}}c_i\alpha_i\prod_{j=1}^{i-1}(1-\alpha_j), \qquad \mathcal{D}_p=\sum_{i\in\mathcal{N}}z_i\alpha_i\prod_{j=1}^{i-1}(1-\alpha_j),$$

其中$z_i$是沿射线到高斯$i$的距离（深度以同样方式光栅化）。投影到图像的过程为$\boldsymbol{\mu}_I=\pi(\boldsymbol{T}_{CW}\cdot\boldsymbol{\mu}_W)$，$\boldsymbol{\Sigma}_I=\mathbf{J}\mathbf{W}\boldsymbol{\Sigma}_W\mathbf{W}^\top\mathbf{J}^\top$，其中$\boldsymbol{T}_{CW}\in SE(3)$为相机位姿，$\mathbf{J}$为线性化投影的雅可比，$\mathbf{W}$为$\boldsymbol{T}_{CW}$的旋转部分。

- **李群上的解析相机雅可比**（本文的关键推导）：跟踪每帧需要约50–100次梯度下降迭代，因此不使用自动微分，而是利用流形导数$\frac{\mathcal{D}f(\boldsymbol{T})}{\mathcal{D}\boldsymbol{T}}\triangleq\lim_{\tau\to 0}\frac{\mathrm{Log}(f(\mathrm{Exp}(\tau)\circ\boldsymbol{T})\circ f(\boldsymbol{T})^{-1})}{\tau}$以闭式形式推导$\boldsymbol{\mu}_I$和$\boldsymbol{\Sigma}_I$相对于$\boldsymbol{T}_{CW}$的导数，得到诸如

$$\frac{\mathcal{D}\boldsymbol{\mu}_C}{\mathcal{D}\boldsymbol{T}_{CW}}=\begin{bmatrix}\boldsymbol{I} & -\boldsymbol{\mu}_C^{\times}\end{bmatrix},$$

  这样的最小化雅可比，其中$\boldsymbol{\mu}_C^{\times}$是相机坐标系下高斯中心的反对称矩阵。这些可直接接入CUDA光栅化器。
- **跟踪**：仅优化当前位姿，最小化光度残差$E_{pho}=\lVert I(\mathcal{G},\boldsymbol{T}_{CW})-\bar{I}\rVert_1$（带用于处理曝光的仿射亮度参数）；若有深度可用，则加入几何残差$E_{geo}=\lVert D(\mathcal{G},\boldsymbol{T}_{CW})-\bar{D}\rVert_1$，形式为$\lambda_{pho}E_{pho}+(1-\lambda_{pho})E_{geo}$，$\lambda_{pho}=0.9$。
- **通过高斯共可见性进行关键帧管理**：使用两帧中可见高斯的交并比来管理一个窗口$\mathcal{W}_k$（8–10个关键帧）；当共可见性下降或平移超过中位深度的一定比例时，某帧成为关键帧。由于高斯是沿射线排序的，遮挡问题在设计上已被处理。
- **插入与剪枝**：新高斯从观测到的深度（RGB-D）初始化，或围绕渲染/中位深度按方差采样（单目）；在最近3个关键帧中插入但未被至少3个其他帧观测到的高斯，会被作为几何不稳定的高斯剪除。
- **带各向同性正则化的建图**：光栅化在视线方向上对高斯不加约束，因此建图阶段加入$E_{iso}=\sum_{i=1}^{|\mathcal{G}|}\lVert\mathbf{s}_i-\tilde{\mathbf{s}_i}\cdot\mathbf{1}\rVert_1$以惩罚拉长的尺度，并联合优化窗口内关键帧位姿和高斯：$\min\sum_{k\in\mathcal{W}}E^k_{pho}+\lambda_{iso}E_{iso}$，$\lambda_{iso}=10$，每次迭代使用两个随机选取的过去关键帧以防止遗忘。

## 实验结果

在配备RTX 4090的桌面系统上（多进程实现，单目实时3 fps）：

- **TUM RGB-D，单目ATE RMSE（厘米）**：fr1/desk、fr2/xyz、fr3/office分别为3.78/4.60/3.50（平均3.96），在没有任何深度学习先验的情况下优于DROID-VO（7.73）、DepthCov-VO（25.2）和DSO（11.0），并接近带回环检测的系统（ORB-SLAM2：1.60）。
- **TUM RGB-D模式**：平均1.47 cm——在基于渲染的方法中最佳（ESLAM为2.00，Point-SLAM为3.04），并优于带回环检测的BAD-SLAM（1.50）。
- **Replica RGB-D ATE**：平均0.58 cm（单进程为0.32 cm，在8个序列中的6个上优于Point-SLAM的0.53）。
- **Replica渲染**：PSNR 38.94 dB，SSIM 0.968，LPIPS 0.070，渲染速度769 FPS——相较Point-SLAM在35.17 dB下仅1.33 FPS（其需要深度引导的射线采样）。
- **内存占用**：在TUM上地图占用2.6 MB（单目）/3.97 MB（RGB-D），而NICE-SLAM为40 MB。
- **收敛域**：从偏移起点开始的位姿优化在79–82%的试验中收敛，而基于哈希网格SDF为14%，基于MLP SDF为33%——高斯在3D空间中形成了一个光滑的梯度场，不同于哈希或位置编码。
- 消融实验：去掉$E_{iso}$会使单目ATE从3.96恶化至4.83；去掉关键帧选择则恶化至8.73。从质量上看，它能重建出深度传感器无法捕捉到的细线和透明物体。

## 对SLAM的意义

MonoGS是高斯溅射SLAM中典范的*单目*入门系统：它表明渲染质量的地图与相机跟踪可以在交互速率下共享同一个可微表示。其解析雅可比、直接对齐的公式将溅射SLAM与直接法（DTAM、LSD-SLAM、DSO）联系了起来——同样的光度原理被应用于一个远为丰富的地图——而其共可见性关键帧管理方式则呼应了DSO的窗口管理策略。它来自与MonoSLAM和iMAP相同的帝国理工学院实验室，这些系统各自在其所处的时代重新定义了地图表示方式。

## 动手实践

- [运行 Gaussian Splatting SLAM](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/gaussian_splatting_slam)

## 相关条目

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [Photo-SLAM](photo-slam.md)
- [DTAM](dtam.md)
- [DSO](dso.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
