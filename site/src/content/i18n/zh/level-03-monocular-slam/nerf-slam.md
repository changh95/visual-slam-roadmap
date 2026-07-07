# NeRF-SLAM

> Rosinol 2023 · [论文](https://arxiv.org/abs/2210.13641)

**一句话总结** — 将稠密单目SLAM前端（DROID-SLAM）与Instant-NGP辐射场后端相结合，用SLAM深度的边缘协方差对NeRF深度损失进行加权——实现了实时、且在几何与光度上都精确的稠密单目重建。

## 问题

最早的神经隐式SLAM系统（iMAP、NICE-SLAM）需要RGB-D输入，而仅靠光度损失训练的辐射场容易出现"浮空物"（floaters）——由不良初始化或不良局部极小值产生的伪影几何；加入深度监督可以消除这一问题并加快收敛。稠密单目SLAM可以实时提供这样的深度，但其深度图"由于密集，噪声极大，因为即便是无纹理区域也会被赋予深度值"。NeRF-SLAM的洞见是：稠密单目SLAM恰好能提供拟合NeRF所需的正确信息——精确的位姿加上*带有相应不确定性*的稠密深度图，从而使地图只在估计器本身有把握的程度上信任每个深度值。

## 方法与架构

两个线程在一块GPU（RTX 2080 Ti，11 GB，PyTorch + CUDA）上并行运行：

**跟踪：带协方差的稠密SLAM。** DROID-SLAM使用类似RAFT的ConvGRU计算帧对之间的稠密光流 $\mathbf{p}_{ij}$，该网络同时输出逐测量权重 $\mathbf{\Sigma}_{\mathbf{p}_{ij}}$，然后求解一个稠密光束法平差（bundle adjustment），几何以逐关键帧逆深度图的形式参数化。线性化后得到分块稀疏系统

$$H\mathbf{x}=\mathbf{b}, \quad \begin{bmatrix} C & E \\ E^{T} & P \end{bmatrix} \begin{bmatrix} \Delta\boldsymbol{\xi} \\ \Delta\mathbf{d} \end{bmatrix} = \begin{bmatrix} \mathbf{v} \\ \mathbf{w} \end{bmatrix},$$

其中 $C$ 是相机块，$P$ 是（对角的）逆深度块，$E$ 是相机与深度的耦合项，$\Delta\boldsymbol{\xi}$ 是 $SE(3)$ 位姿更新，$\Delta\mathbf{d}$ 是逐像素逆深度更新。舒尔补（Schur complement）给出约化后的相机矩阵 $H_T$，通过Cholesky分解 $H_T = LL^{T}$ 求解。遵循Rosinol等人提出的概率体素融合方法（WACV 2022），深度与位姿的边缘协方差来自同一次分解：

$$\mathbf{\Sigma}_{\mathbf{d}} = P^{-1} + P^{-T}E^{T}\mathbf{\Sigma}_{\mathbf{T}}EP^{-1}, \qquad \mathbf{\Sigma}_{\mathbf{T}} = (LL^{T})^{-1}.$$

**建图：概率体素NeRF。** 一个Instant-NGP哈希网格辐射场在所有关键帧上（无滑动窗口）用建图损失进行训练，同时对位姿 $\mathbf{T}$ 和网络参数 $\Theta$ 进行最小化：

$$\mathcal{L}_{M}(\mathbf{T},\Theta) = \mathcal{L}_{\text{rgb}}(\mathbf{T},\Theta) + \lambda_{D}\,\mathcal{L}_{\text{D}}(\mathbf{T},\Theta), \qquad \lambda_D = 1.0,$$

其中深度损失以跟踪协方差进行马氏距离加权：

$$\mathcal{L}_{\text{D}}(\mathbf{T},\Theta) = \|D - D^{\star}(\mathbf{T},\Theta)\|^{2}_{\Sigma_{D}},$$

而 $\mathcal{L}_{\text{rgb}} = \|I - I^{\star}(\mathbf{T},\Theta)\|^{2}$。渲染深度是标准体渲染下射线终止距离的期望值：

$$d^{\star} = \sum_{i}\mathcal{T}_{i}\bigl(1-\exp(-\sigma_{i}\delta_{i})\bigr)d_{i}, \qquad \mathcal{T}_{i} = \exp\Bigl(-\sum_{j<i}\sigma_{j}\delta_{j}\Bigr),$$

其中 $\sigma_i$ 是采样点 $i$ 处的密度，$d_i$ 是其深度，$\delta_i = d_{i+1} - d_i$；颜色以同样的方式合成 $\mathbf{c}_i$。

**线程接口。** 跟踪线程维护一个最多8个关键帧的活动窗口，一旦平均光流超过2.5像素就生成一个新关键帧；每产生一个新关键帧，就把位姿、图像、深度图和深度协方差发送给建图线程——这是两个线程之间唯一的通信内容。

## 实验结果

在Replica数据集（8个场景，以深度L1和PSNR评估）上：

- **本方法（单目，使用自身深度）：平均4.49 cm深度L1，41.40 dB PSNR**——相较之下，NICE-SLAM在*使用真实深度*时为（4.08 cm，24.61 dB），不使用深度时为（14.18 cm，17.76 dB），iMAP使用真实深度为（7.64 cm，6.95 dB），在同样的估计深度上做TSDF-Fusion为（21.88 cm，7.07 dB），$\sigma$-Fusion为（20.10 cm，7.08 dB）。
- 相比NICE-SLAM，PSNR最高提升**179%**（office-1），深度L1最高提升**86%**（room-2）；office-1显示出最佳的综合增益（PSNR提升179%，L1提升80%）。
- 消融实验（Cube-Diorama）：120秒后，无加权的原始深度监督比协方差加权方案的PSNR差4 dB、L1差7 cm；仅用位姿在500秒后L1为7.8 cm，原始深度为4.1 cm但PSNR差3 dB——加权方案兼具两者优点。
- 运行速度：整个流水线在640x480分辨率下达到12 fps（跟踪约15 fps，建图约10 fps），GPU显存占用约11 GB。

## 对SLAM的意义

NeRF-SLAM（出自以Kimera闻名的Rosinol，与麻省理工的Leonard、Carlone合作）将这一混合方案凝练成型——用估计理论意义上的SLAM来求解位姿、几何与不确定性，用神经场来构建地图——表明二者是互补而非竞争关系。它是对iMAP"网络即整个系统"这一纯粹主张的对立观点，且可以说是更具影响力的蓝图：如今大多数实用的神经SLAM与高斯SLAM系统都以这种方式将稳健的跟踪器与可微地图配对，而其不确定性加权的深度监督也成为将带噪声的估计几何融合进神经表示中的一种常见技巧。

## 相关条目

- [DROID-SLAM](droid-slam.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [GO-SLAM](go-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)
