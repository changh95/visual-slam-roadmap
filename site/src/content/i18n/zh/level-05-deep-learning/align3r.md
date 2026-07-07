# Align3R

> Lu 2025 · [论文](https://arxiv.org/abs/2412.03079)

**一句话总结** — Align3R通过将单目深度信息注入一个经过微调的DUSt3R,再由其成对3D点图对所有帧进行对齐,把闪烁不稳的逐帧单目深度预测转变为时间一致的视频深度*外加相机位姿*(CVPR 2025 Highlight)。

## 问题

现代单目深度估计器(Depth Pro、Depth Anything V2)能够产生高质量的单图深度,但无法在动态视频的各帧之间保持一致的尺度因子,因此估计出的深度序列会闪烁。早期的解决方法是在推理时用光流或匹配约束进行优化,这在大运动下会失效,且耗时数小时;近期的视频扩散方法(DepthCrafter、ChronoDepth)训练代价高昂,只能处理固定长度的片段,且只输出尺度不变的深度*而没有相机位姿*——这对4D重建或跟踪来说是不够的。Align3R探讨的问题是:如何在不付出扩散模型高昂代价的前提下,为动态单目视频获得一致的视频深度和位姿。

## 方法与架构

给定 $N$ 帧 $\mathbf{I}_k$,单目估计器首先预测逐帧深度 $\hat{\mathbf{D}}_k$;随后一个改进版的DUSt3R基于这些深度预测成对点图;最后全局对齐求解深度 $\mathbf{D}_k$ 和位姿 $\pi_k\in\mathbb{SE}(3)$。

- **DUSt3R骨干网络。** 对于帧对 $(\mathbf{I}_n,\mathbf{I}_m)$,一个ViT预测点图 $\mathbf{X}^e_n,\mathbf{X}^e_m$(均处于帧 $n$ 的坐标系下),以及置信度 $\mathbf{C}^e_n,\mathbf{C}^e_m$;在一个成对图 $\mathcal{G}(\mathcal{V},\mathcal{E})$ 上,全局对齐求解

$$\arg\min_{\mathbf{D},\pi,\sigma}\sum_{e\in\mathcal{E}}\sum_{v\in e}\mathbf{C}^{e}_{v}\left\|\mathbf{D}_{v}-\sigma_{e}P_{e}(\pi_{v},\mathbf{X}^{e}_{v})\right\|_{2}^{2}$$

  其中 $\sigma_e$ 是每条边的尺度因子,$P_e$ 将点图投影到视角 $v$ 下形成深度图。
- **ControlNet风格的深度注入。** 直接将深度与RGB输入拼接会"破坏性地毁坏"预训练DUSt3R编码器的特征。因此,单目深度被反投影为一个3D点图 $\hat{\mathbf{X}}_i$(使用Depth Pro预测的焦距,或Depth Anything V2的固定焦距;每个轴归一化到 $[-1,1]$),进行patch嵌入,并送入一个新的ViT,其多层特征 $\hat{\mathbf{F}}^{(l)}_i$ 通过零初始化卷积进入DUSt3R解码器:$\hat{\mathbf{E}}^{(l)}_i=\mathrm{ZeroConv}(\hat{\mathbf{F}}^{(l)}_i)+\mathbf{E}^{(l)}_i$,其中 $l=1,\dots,s$($s=6$),使初始化时原始预测保持不变。
- **面向动态场景的微调。** 编码器冻结;解码器和点图ViT在5个合成数据集(SceneFlow、VKITTI、TartanAir中保留静态区域、Spring、PointOdyssey)上微调,以时间步长1–10采样帧对,使用DUSt3R的回归损失 $L_{dust3r}=\left\|\frac{1}{z}\mathbf{X}^{e}_{v}-\frac{1}{\overline{z}}\overline{\mathbf{X}}^{e}_{v}\right\|_{2}$,并配以逐图像归一化因子 $z,\overline{z}$;超过400米的深度被过滤掉,以避免天空主导损失。训练:六块RTX 4090,批大小12,约20小时训练50个epoch,AdamW学习率 $5\times10^{-5}$。
- **面向长视频的分层优化。** 超过约30帧的视频在原始DUSt3R对齐方式下会超出4090的显存,因此视频被切分为长度 $M=10$ 或 $20$ 的片段:先对每个片段中的一个关键帧进行全局对齐,初始化关键帧的深度/位姿/焦距,再通过局部对齐填补每个片段内部的信息。在推理时加入MonST3R的RAFT光流损失——对深度几乎没有影响,但对位姿精度很重要。

## 实验结果

在6个数据集上评估,每个*序列*使用单一的尺度/偏移(比逐帧对齐更严格),Abs Rel $\downarrow$ / $\delta<1.25$ $\uparrow$:

- **视频深度**(表2):Sintel上0.253/0.681(使用Depth Anything V2)vs MonST3R 0.335/0.586,DUSt3R 0.422/0.542,DepthCrafter 0.292/0.697;PointOdyssey验证集0.077/0.930(Depth Pro变体)vs MonST3R 0.089/0.909;FlyingThings3D 0.102/0.895 vs MonST3R 0.132/0.836;Bonn 0.075/0.972,TUM dynamics 0.109/0.915——在所有数据集的所有指标上均超过DUSt3R和MonST3R,不过在简单的室内场景Bonn上,单帧Depth Pro(0.067/0.974)已经具有一致性。
- **相机位姿**(表3):在三个基准上均取得最佳RTE/RRE;TUM dynamics上ATE为0.011(相比MonST3R 0.020,DUSt3R 0.093,COLMAP 0.076),Bonn上为0.646×10⁻²;在Sintel上ATE为0.128–0.163,略逊于MonST3R的0.111,但RRE更优(0.419–0.432 vs 0.780)。
- **消融实验**(表4):零卷积ViT注入方式使Sintel的Abs Rel达到0.263,而不用深度为0.306,直接RGB-深度拼接则为0.399;分层优化将每个Bonn视频的显存占用从24.0降到5.9 GB,时间从2.9降到1.1分钟,而精度几乎不变(Abs Rel从0.054到0.056)。

## 对SLAM的意义

跨帧一致的深度恰恰是稠密视觉里程计和建图所需要的:一个在各帧之间自我矛盾的单目深度网络会毒害位姿估计和地图融合。Align3R展示了一套实用的方案——用基础模型深度提供细节,用DUSt3R风格的成对点图作为几何粘合剂,再用DUSt3R自身的全局对齐作为后端——使单图深度模型可以作为视频/SLAM的前端使用,而其在动态序列上的位姿精度可与DROID-SLAM等专用系统相媲美。它属于快速发展的DUSt3R家族(MonST3R、MASt3R-SLAM),该家族正被逐步适配到序列化和动态数据中。

## 相关条目

- [DUSt3R](../level-03-monocular-slam/dust3r.md)
- [MonST3R](../level-03-monocular-slam/monst3r.md)
- [Depth Anything V2](depth-anything-v2.md)
- [Marigold](marigold.md)
- [MASt3R-SLAM](../level-03-monocular-slam/mast3r-slam.md)
