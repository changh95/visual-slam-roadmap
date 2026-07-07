# EGG-Fusion

> Pan 2025 · [论文](https://arxiv.org/abs/2512.01296)

**一句话总结** — SIGGRAPH Asia 2025的实时RGB-D重建方法,在线融合几何感知的高斯surfel,并通过显式建模传感器噪声的信息滤波更新,使可微优化只需对一个已接近收敛的地图进行打磨。

## 问题

可微渲染SLAM(基于NeRF与3DGS)能够输出照片级真实感的地图,但"当前的可微渲染方法在实时计算和传感器噪声敏感性方面面临双重挑战,导致场景重建的几何精度下降,实用性受限。"3DGS椭球体的高自由度带来了几何歧义,通过反向传播进行建图每帧需要大量梯度迭代,而将带噪声的消费级深度当作真实值处理会破坏恢复出的表面。EGG-Fusion的目标是同时实现实时吞吐量与噪声感知的高精度表面几何。

## 方法与架构

场景由一组二维高斯surfel表示$\mathcal{S}=\{S_{i}:(\textbf{p}_{i},\textbf{s}_{i},\textbf{r}_{i},o_{i},\textbf{c}_{i})\}$——具有中心、两个椭圆轴尺度、旋转、透明度和SH颜色的圆盘状基元,通过深度排序的alpha合成渲染($T_{i}=\prod_{j<i}(1-\alpha_{j})$,$\hat{C}=\sum_{i}T_{i}\alpha_{i}\textbf{c}_{i}$,深度/法线图以类似方式混合)。每帧运行两个模块:从稀疏到稠密的相机跟踪,随后是显式surfel融合,再接一个简短的可微优化。

- **几何感知的surfel初始化**:新surfel只在低透明度区域以及深度差为正的区域(新出现的前景)生成,采用与深度相关的自适应尺度$\mathbf{s}=[\alpha_{s}\cdot d/f_{x},\,\alpha_{s}\cdot d/f_{y}]$($d$为深度,$\alpha_s=2.0$),因此远处的surfel更大,但投影到图像上的覆盖范围保持一致——在相同surfel数量下渲染效果优于固定尺度方案。
- **带信息滤波器的surfel融合**(核心贡献):每个surfel的几何状态$\mathbf{x}^{t}=[\mathbf{p},\mathbf{n}]^{\top}\in\mathbb{R}^{6}$携带协方差$\boldsymbol{\Sigma}^{t}$;一次再观测$\mathbf{z}^{t}=[V_{t}(\mathbf{u}),N_{t}(\mathbf{u})]^{\top}$满足$\mathbf{z}^{t}=\mathbf{H}\mathbf{x}^{t}+\bar{\mathbf{t}}+\boldsymbol{\epsilon}$,$\boldsymbol{\epsilon}\sim\mathcal{N}(0,\boldsymbol{\Sigma}_{\mathbf{z}}^{t})$,其中$\mathbf{H}$包含相机旋转,噪声方差$\sigma_p,\sigma_n$随深度的平方增长(传感器模型)。递归贝叶斯更新以信息形式进行:

$$\boldsymbol{\Lambda}^{t}=\boldsymbol{\Lambda}^{t-1}+\mathbf{H}^{\top}\boldsymbol{\Lambda}^{t}_{\mathbf{z}}\mathbf{H},\qquad \boldsymbol{\eta}^{t}=\boldsymbol{\eta}^{t-1}+\mathbf{H}^{\top}\boldsymbol{\Lambda}^{t}_{\mathbf{z}}\mathbf{z}^{t},\qquad \hat{\mathbf{x}}^{t}=(\boldsymbol{\Lambda}^{t})^{-1}\boldsymbol{\eta}^{t},$$

  这是每次观测都可闭式求解的单次计算(对角协方差使其计算代价很低)。更新后的法线定义了一个绕$\mathbf{n}_{tg}=\mathbf{n}_{g}\times\mathbf{n}_{t}$的唯一旋转增量$\Delta\textbf{R}(\textbf{n}_{tg},\theta)$,并施加到该surfel上;$\text{tr}(\boldsymbol{\Lambda})$同时也作为每个surfel的置信度,用于提取可靠表面。
- **可微surfel优化**:对最近$N_{\text{batch}}$帧的局部地图进行精细化,损失为$\mathcal{L}_{total}=\mathcal{L}_{c}+w_{d}\mathcal{L}_{d}+w_{n}\mathcal{L}_{n}+w_{reg}\cdot\mathcal{L}_{reg}$,其中$\mathcal{L}_{c},\mathcal{L}_{d}$为$L_1$颜色/深度损失,$\mathcal{L}_{n}=|1-\gamma|$惩罚法线偏差,$\mathcal{L}_{reg}=|\textbf{p}-\textbf{p}_{f}|+w^{n}_{reg}\cdot|1-\textbf{n}\cdot\textbf{n}_{f}|$将surfel锚定到其经滤波融合的几何$\textbf{p}_f,\textbf{n}_f$上。由于融合已使surfel接近收敛,每个建图步骤只需约9次迭代。
- **从稀疏到稠密的跟踪**:先通过LM对稀疏2D-3D重投影误差求初始位姿,$\boldsymbol{\xi}_{t}^{(0)}=\arg\min\sum_{\mathcal{M}}\rho(|\mathbf{u}_{i}-\Pi(\exp(\boldsymbol{\xi}_{t})\cdot\textbf{X}_{i}^{w})|^{2})$,再通过稠密联合对齐$E_{\text{dense}}=E_{\text{icp}}+\lambda_{\text{photo}}E_{\text{photo}}$(针对全局模型的点到面ICP加光度误差)进行细化,并设置收敛检验以拒绝退化的细化结果。

## 实验结果

在Replica、TUM-RGBD、ScanNet++以及三个自采集的Azure Kinect室外场景上进行评估:

- **表面重建(从高斯采样的点)**:在Replica上精度为0.60 cm,在ScanNet++上为0.67 cm,3 cm以内的精度比率分别为99.99% / 99.98%——相比之下RTG-SLAM为0.80/1.06 cm,SplaTAM为2.87/1.71 cm;这印证了摘要中"相比最新的GS方法精度提升超过20%"的说法。
- **跟踪**:Replica平均ATE为0.17 cm(RTG-SLAM为0.18,SplaTAM为0.39);TUM在线平均为4.47 cm——在实时可微系统中最佳(RTG-SLAM为5.12,SplaTAM为5.48)——离线变体加入全局优化后为1.98 cm。
- **渲染(ScanNet++)**:新视角PSNR为25.70 / SSIM为0.907,相比RTG-SLAM的24.77/0.882和SplaTAM的24.75/0.900;训练视角PSNR为29.06。
- **速度/内存(Replica off0)**:24.21 FPS,建图每帧耗时0.071 s(7.5 ms × 9次迭代),内存占用1.8 GB——相比RTG-SLAM为15.73 FPS / 2.7 GB,SplaTAM为0.19 FPS / 9.1 GB。
- **消融实验**:去掉稀疏初始化后,稠密跟踪在fr1/room和fr3/office上直接失败;去掉信息滤波融合会使ScanNet++的点精度从0.67降至0.73 cm,并在远处、噪声较大的物体上出现明显更粗糙的表面。

## 对SLAM的意义

大多数3DGS-SLAM系统(SplaTAM、MonoGS)通过对渲染器反向传播来优化地图,迭代直到损失收敛。EGG-Fusion展示了另一条路线:将高斯视为*需要被滤波的状态*,而非*需要被训练的参数*——把经典surfel SLAM(ElasticFusion)中基于估计理论、置信度加权的融合方式,升级为一种可微、可渲染的表示。闭式融合加少量打磨迭代,使稠密照片级真实感地图能够兼容真正的实时增量运行,并给出了原理性的逐基元不确定性,这两点对于可部署的高斯地图SLAM都至关重要。

## 相关条目

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
