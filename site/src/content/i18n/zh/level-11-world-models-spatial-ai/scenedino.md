# SceneDINO

> Jevtić 2025 · [论文](https://arxiv.org/abs/2507.06230)

**一句话总结** — SceneDINO 将自监督的二维 DINO 特征提升为一个前馈式三维特征场，从单张图像预测几何和富有表达力的三维特征，并将其蒸馏成首个完全无监督的语义场景补全（SSC）系统——不依赖任何形式的语义或几何真值。

## 问题

语义场景补全要求模型从单张图像推断出场景的三维几何*及*语义——包括被遮挡、从未被观测过的区域。此前的 SSC 方法依赖昂贵的三维体素真值标签，并且常常需要额外的 LiDAR 监督；即便是"无标签"的变体，如 GaussTR，也依赖于高度监督的基础模型（SAM、Metric3Dv2）。SceneDINO 是首个在*完全无监督*设定下解决 SSC 的方法：训练仅使用无标签的多视角图像并采用自监督，推理则使用单张 RGB 图像。

## 方法与架构

该流水线在 Behind the Scenes（BTS）的基础上增加了一个特征头，然后加入一个三维蒸馏阶段：

1. **前馈式特征场。** 一个二维编码器-解码器 $\xi$（DINO ViT-B/8 骨干网络 + 稠密预测解码器）将输入图像 $I_0$ 映射为逐像素嵌入 $E \in \mathbb{R}^{D_E \times H \times W}$。对于一个三维点 $x$，投影到像素 $u = \pi_0(x)$，相机距离为 $d_x$，一个两层 MLP $\phi$ 预测密度和一个 $D{=}768$ 维的类 DINO 特征：
$$(\sigma_x, f_x) = \phi\big(e_u,\, \gamma(u, d_x)\big)$$
其中 $e_u$ 是 $E$ 在 $u$ 处双线性插值的结果，$\gamma$ 是位置编码。
2. **特征与深度的体渲染。** 沿每条光线以间距 $\delta_i$ 采样 $L{=}32$ 个点，可见性遵循标准体渲染，$\alpha_i = 1 - \exp(-\sigma_{x_i}\delta_i)$，$V_i = \prod_{j=1}^{i-1}(1-\alpha_j)$，给出渲染特征和渲染深度：
$$\tilde{f}_{u_r} = \sum_{i=1}^{L} V_i\, \alpha_i\, f_{x_i}, \qquad \tilde{d}_{u_r} = \sum_{i=1}^{L} V_i\, \alpha_i\, d_{x_i}.$$
3. **多视角自监督训练。** 视角被分为源集和目标集；目标视角由源视角重建得出。损失结合了一个光度项 $\mathcal{L}_p = \min_{I_s}\big(\lambda_1 L_1 + \lambda_{\text{SSIM}} L_{\text{SSIM}}\big)$（如 BTS 中那样从其他视角采样颜色）、边缘感知的深度平滑项 $\mathcal{L}_s$、针对二维 DINO 特征 $F_t$ 的特征重建项，
$$\mathcal{L}_f = 1 - \text{cos-sim}\big(F_t,\ \psi(\hat{F}_t) + F\big),$$
其中 $\psi$ 是一个特征下采样器，$F$ 是一个用于补偿 ViT 位置编码伪影的可学习常数分解项，再加上特征平滑项 $\mathcal{L}_{fs}$；总损失为 $\mathcal{L} = \lambda_p\mathcal{L}_p + \lambda_s\mathcal{L}_s + \lambda_f\mathcal{L}_f + \lambda_{fs}\mathcal{L}_{fs}$。
4. **三维特征蒸馏。** 一个逐点头 $h$ 将 $f_x \in \mathbb{R}^D$ 映射为一个低维编码 $z_x \in \mathbb{R}^K$（$K{=}19$），使用 STEGO 的对比相关性损失在特征相似度矩阵 $S_{ij}$（输入空间）和 $S^h_{ij}$（蒸馏空间）上进行训练：
$$\mathcal{L}_{\text{corr}}(f_X, f_Y, b) = -\sum_{i,j} (S_{ij} - b)\, \max(S^h_{ij}, 0)$$
在自身对、kNN 对和随机对上求和。特征批次是*在三维空间中*采样的：深度分层的表面中心点，半径 $r = 0.5\,$米内的邻居，仅保留密度 $\sigma > 0.5$ 的样本。
5. **无监督探针评测。** 小批量余弦 k-means 对蒸馏空间进行聚类；$p_x = \text{softmax}(\text{cos-sim}(h(f_x), \theta))$ 给出伪类别，仅在评测时通过匈牙利匹配与真值对齐。训练在单块 V100 上耗时约 2 天；相机位姿可来自无监督的 ORB-SLAM3。

## 实验结果

在 **SSCBench-KITTI-360**（范围 12.8/25.6/51.2 米，匈牙利匹配 mIoU，单位 %）上：

| 方法 | 12.8 米 | 25.6 米 | 51.2 米 |
|---|---|---|---|
| S4C + STEGO（无监督基线） | 10.53 | 9.26 | 6.60 |
| **SceneDINO（无监督）** | **10.76** | **10.01** | **8.00** |
| S4C（二维监督参照） | 16.94 | 13.94 | 10.19 |

几何 IoU 为 49.54/42.27/37.60，而监督式 S4C 为 54.64/45.57/39.35。在 KITTI-360 上的**二维无监督分割**中，SceneDINO 达到 77.74 Acc / 25.81 mIoU，超过使用 DINO 特征的 STEGO（73.32/23.57）和 U2Seg（72.89/23.43）。对蒸馏特征进行**线性探测**（以 DINOv2 为目标）得到 15.85/13.70/10.57 mIoU——缩小了与完全监督 S4C 之间的差距，在 51.2 米处甚至略有超越。使用 ORB-SLAM3 估计的位姿而非数据集位姿，仅带来 0.12 mIoU 的代价；将 DINO 目标切换为 DINOv2 目标可提升 +1.08 mIoU。在 Cityscapes/BDD100K 上的域泛化能力，以及跨视角特征一致性（相对于 DINO、DINOv2、FiT3D）也均达到了最先进水平。

## 对SLAM的意义

SLAM 地图在传感器未曾观测的地方是空洞的；场景补全用学习到的结构先验填补这一空白，直接惠及部分观测环境中的探索、路径规划和安全导航。SceneDINO 体现了这一层级上 Spatial AI 的一个趋势——复用自监督基础模型特征，在不依赖三维标注的情况下获得开放世界的三维理解——其流水线更是字面意义上与 SLAM 兼容：作者表明，使用 ORB-SLAM3 位姿进行训练所付出的代价微乎其微，从而使整套流程保持完全无监督。

## 相关条目

- [Spatial AI](spatial-ai.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)
- [OpenScene](../level-03-monocular-slam/openscene.md)
- [NeRF](../level-05-deep-learning/nerf.md)
- [World Labs / Marble](world-labs-marble.md)
