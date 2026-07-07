# NeRF

> Mildenhall 2020 · [论文](https://arxiv.org/abs/2003.08934)

**一句话总结** — 将场景表示为一个 MLP 中的连续函数——将三维位置加观察方向映射为颜色和密度——并通过可微体渲染进行渲染，从有位姿信息的图像生成照片级真实感的新视角图像。

## 问题

新视角合成——从未曾拍摄过的视角渲染一个复杂场景——长期以来一直用显式表示（网格、体素网格、多平面图像）来解决，这些方法或是对场景进行离散化处理，或是由于时间/空间的糟糕缩放特性而限制了可达到的分辨率，或是在复杂几何和视角相关外观上表现不佳。NeRF 提出的问题是：能否将场景存储为一个*连续的*体积函数，仅通过一组稀疏的输入视角，并借助一个可微渲染器，仅凭光度监督直接进行优化。

## 方法与架构

**表示方式。** 一个单一的全连接（非卷积）MLP $F_{\Theta}: (\mathbf{x}, \mathbf{d}) \to (\mathbf{c}, \sigma)$ 将一个 5 维坐标——位置 $(x,y,z)$ 加观察方向——映射为体密度 $\sigma$ 和视角相关的 RGB 辐射亮度 $\mathbf{c}$。在架构上，8 个全连接层（256 通道，ReLU）处理 $\gamma(\mathbf{x})$ 并输出 $\sigma$ 以及一个 256 维特征；该特征与 $\gamma(\mathbf{d})$ 拼接后经过一个 128 通道的层得到 RGB。仅从位置预测 $\sigma$ 保证了几何在多视角下的一致性。

**可微体渲染。** 相机光线 $\mathbf{r}(t) = \mathbf{o} + t\mathbf{d}$ 的颜色由经典的体渲染积分给出，

$$C(\mathbf{r}) = \int_{t_n}^{t_f} T(t)\,\sigma(\mathbf{r}(t))\,\mathbf{c}(\mathbf{r}(t), \mathbf{d})\,dt, \qquad T(t) = \exp\Big(-\int_{t_n}^{t} \sigma(\mathbf{r}(s))\,ds\Big),$$

通过在分层采样点 $t_i$ 上求积估计（每个区间内均匀抽取一个样本，因此 MLP 是在连续位置上被查询的）：

$$\hat{C}(\mathbf{r}) = \sum_{i=1}^{N} T_i\,\big(1 - e^{-\sigma_i \delta_i}\big)\,\mathbf{c}_i, \qquad T_i = \exp\Big(-\sum_{j=1}^{i-1} \sigma_j \delta_j\Big), \quad \delta_i = t_{i+1} - t_i .$$

**位置编码。** 原始的 $xyz\theta\phi$ 输入会使 MLP 平滑掉高频信息，因此每个坐标通过 $\gamma(p) = \big(\sin(2^0 \pi p), \cos(2^0 \pi p), \ldots, \sin(2^{L-1}\pi p), \cos(2^{L-1}\pi p)\big)$ 提升维度，其中 $\mathbf{x}$ 取 $L{=}10$，$\mathbf{d}$ 取 $L{=}4$——这是一个看似微小却证明至关重要的技巧。

**分层采样。** 一个粗网络和一个细网络被联合优化：粗网络的合成权重 $w_i = T_i(1 - e^{-\sigma_i\delta_i})$ 被归一化为一个分段常数概率密度函数，用于通过逆变换采样在表面附近引导 $N_f$ 个额外采样点（$N_c{=}64$，$N_f{=}128$）。

**训练。** 损失是渲染像素颜色与真实像素颜色之间的总平方误差，同时对粗、细两个渲染结果计算，每批次 4096 条光线；使用 Adam，学习率从 $5\times 10^{-4}$ 衰减至 $5\times 10^{-5}$；每个场景训练 10 万至 30 万次迭代（在 V100 上约需 1-2 天）。真实场景的相机位姿来自 COLMAP。

## 实验结果

- 表 1（PSNR/SSIM/LPIPS）：在 Realistic Synthetic 360° 数据集上，NeRF 得分为 31.01 / 0.947 / 0.081，对比 LLFF 的 24.88、NV 的 26.05、SRN 的 22.26；在 Real Forward-Facing 数据集上为 26.50 / 0.811 / 0.250，对比 LLFF 的 24.13 / 0.798 / 0.212（LLFF 仅在该 LPIPS 指标上略优）；在 Diffuse Synthetic 360° 数据集上为 40.15，对比 LLFF 的 34.38。
- 消融实验（Realistic Synthetic）：去掉位置编码使 PSNR 降至 28.77，去掉视角相关性降至 27.66，一个既无位置编码又无视角相关性、也无分层采样的极简模型则降至 26.67；即便仅使用 25 张输入图像，NeRF 仍优于使用 100 张图像的 NV、SRN 和 LLFF。
- 存储/时间权衡：每个场景仅需 5 MB 网络权重，而单个 LLFF 场景需要超过 15 GB（相对压缩比约 3000 倍），代价是每个场景需要不少于 12 小时的训练时间。

## 对SLAM的意义

NeRF 是整个神经隐式 SLAM 浪潮的奠基性工作：iMAP、NICE-SLAM、Co-SLAM 和 NeRF-SLAM 都使用在线优化的辐射场式地图表示，而可微渲染损失同时也可以充当跟踪目标函数（反转渲染器即可得到相机位姿）。即便在 3D 高斯溅射（3D Gaussian Splatting）取代 NeRF 成为实时渲染的主流方法之后，其核心思想——将场景视为可优化的场、通过可微渲染器进行光度监督、类似位置编码的输入提升方式——仍然是现代稠密神经建图的概念基础。

## 相关条目

- [iMAP](../level-03-monocular-slam/imap.md) — 首个 NeRF 风格的 SLAM 系统
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md) — 分层特征网格后续工作
- [NeRF-SLAM](../level-03-monocular-slam/nerf-slam.md) — 将辐射场与 DROID-SLAM 跟踪相融合
- [BARF](../level-03-monocular-slam/barf.md) — 位姿与 NeRF 联合优化
- [Co-SLAM](../level-03-monocular-slam/co-slam.md) — 面向实时神经 SLAM 的联合坐标/参数化编码
