# RoMa v2

> Edstedt 2025 · [论文](https://arxiv.org/abs/2511.15706)

**一句话总结** — RoMa的后继方法,将稠密特征匹配推向"更难、更好、更快、更密":一个DINOv3多视图Transformer匹配器,配合解耦的细化器和定制的CUDA相关性核,将RoMa的鲁棒性与类似UFM的速度相结合,同时新增了逐像素误差协方差。

## 问题

稠密特征匹配——为两幅图像间的每个像素估计一个变形场$\mathbf{W}^{A\mapsto B}\in\mathbb{R}^{H^A\times W^A\times 2}$及置信度$\mathbf{p}^{A\mapsto B}$——已成为双视图对应关系的黄金标准,但现有匹配器在许多真实世界的困难场景中仍会失效(RUBIK暴露了RoMa在极端视角变化下的弱点),而高精度模型速度较慢。UFM证明了稠密匹配可以大幅提速,但它对骨干网络进行了微调(损害了在WxBS上对极端外观变化的鲁棒性),并丧失了亚像素精度。RoMa v2旨在将两方面的优势结合起来。

## 方法与架构

**解耦的两阶段流水线。** 匹配和细化被分为两个独立阶段进行训练(UFM式),而非(如RoMa那样)联合训练并使用梯度截断,这使得能够快速实验:粗匹配器以128的batch size训练30万步(约3800万对图像),随后被冻结,三个细化器以64的batch size训练30万步(约1900万对图像)。

**粗匹配器(步幅4)。** 冻结的DINOv3 ViT-L取代了DINOv2(线性探测EPE为19.0对27.1,鲁棒性86.4%对77.0%)。两幅图像的特征经过一个ViT-B多视图Transformer,交替进行帧内注意力和全局注意力(VGGT式,归一化网格RoPE)。RoMa的高斯过程匹配编码器被替换为在相似度矩阵$\mathcal{S}_{mn}=\exp(\tfrac{1}{\tau}\,\text{cossim}(\mathbf{z}^A_m,\mathbf{z}^B_n))$上的单头注意力,并配有一个针对最佳匹配patch的辅助稠密NLL目标:

$$\mathcal{L}_{\text{NLL}}=\sum_{m=1}^{M}-\log(\operatorname{Softmax}(\mathcal{S}_m)_{n^*}),$$

其中$n^*$是最接近真值变形场的patch。一个DPT头将匹配嵌入+DINOv3特征解码为1/4分辨率下的变形场和置信度。完整的匹配器损失为:$\mathcal{L}_{\text{matcher}}=\mathcal{L}_{\text{NLL}}+\mathcal{L}_{\text{warp}}+10^{-2}\mathcal{L}_{\text{overlap}}$。

**细化器(步幅4、2、1)配合定制CUDA核。** 采用类似RoMa的ConvNet细化器,但将耗费内存的局部相关性操作重写为定制的CUDA/PyTorch扩展核,通道维度取2的幂。变形场监督使用广义Charbonnier损失$\mathcal{L}_{\text{warp}}=(ic)^{\alpha}\left(\lVert\mathbf{r}\rVert^{2}/(ic)^{2}+1\right)^{\alpha/2}$,其中$\alpha=0.5$、$c=10^{-3}$,步幅$i\in\{4,2,1\}$;重叠部分使用逐像素BCE。权重的EMA(衰减系数0.999)消除了训练过程中观察到的一个随机的±0.1像素亚像素预测偏差。

**预测协方差。** 与RoMa/UFM不同,细化器通过Cholesky因子($\Sigma^{-1}=LL^{\top}$,对角线经Softplus约束)预测残差$\mathbf{r}_\theta=\mathbf{W}^{A\mapsto B}_\theta-\mathbf{W}^{A\mapsto B}_{\text{GT}}$的逐像素$2\times 2$精度矩阵,通过高斯NLL训练:$\mathcal{L}_{\text{precision}}=\frac{1}{2}\mathbf{r}^{\top}\Sigma^{-1}\mathbf{r}-\frac{1}{2}\log\det(\Sigma^{-1})+\log(2\pi)$,作用于共视像素中$\lVert\mathbf{r}\rVert<8$像素的部分,并在各步幅间分层累加。

**精心整理的数据混合。** 相比RoMa仅使用MegaDepth,这里使用了十个数据集:宽基线数据(MegaDepth、AerialMD、BlendedMVS、Hypersim、TartanAir v2、Map-Free、ScanNet++ v2)加上小基线数据(FlyingThings3D、VKITTI2、UnrealStereo4k),共5069个场景——航拍数据带来了对大幅旋转和空对地视角的鲁棒性;小基线数据带来了细粒度细节和无纹理表面预测能力。

## 实验结果

- **MegaDepth-1500位姿**:AUC@5°/10°/20°为62.8/77.0/86.6,对比RoMa的62.6/76.7/86.3、UFM的41.5、MASt3R的42.4——在所有匹配器和前馈式3D模型中最佳。
- **ScanNet-1500位姿**:33.6/56.2/73.8,对比RoMa的31.8/53.4/70.9——与VGGT(33.9)和MASt3R相当。
- **稠密匹配(640×640,EPE越低越好)**:MegaDepth上1.47,对比RoMa的2.34;TartanAir-WB上13.82,对比UFM的15.85和RoMa的60.61;AerialMegaDepth上4.12,对比RoMa的25.05(降低84%);FlyingThings3D上0.93;ScanNet++ v2上4.00;MapFree上2.03——在全部六个数据集上均为最佳。
- **运行时间(batch 8,H200)**:30.9对/秒,占用4.8GB——比RoMa(18.5对/秒)快1.7倍,内存占用相近;UFM更快(43.0),但需要16.2GB。
- **WxBS**:mAA@10px为55.4——低于RoMa(60.8,差距可追溯到IR转RGB子集),但远高于UFM(42.3)。在新的SatAst宇航员对卫星基准上:AUC@10px为37.0,对比RoMa的23.5和UFM的1.8。
- **协方差带来的收益(Hypersim)**:协方差加权细化将位姿AUC@1°从54.9提升到76.4(约提升20个百分点)。

## 对SLAM的意义

稠密、带确定性度量的匹配正在成为重定位、回环检测以及极端外观变化下离线建图的首选前端方法,而RoMa这一系列工作正是其参考实现。速度曾是在SLAM中在线使用RoMa级匹配器的主要障碍;RoMa v2的1.7倍加速和更省内存的细化方式缩小了这一差距。逐像素误差协方差可以被SLAM后端直接使用——正如估计流水线所期望的那样,用于在RANSAC和位姿细化中对残差加权——而该模型也是MASt3R式双视图重建的天然特征骨干网络。

## 相关条目

- [RoMa](roma.md) — 前身方法及核心架构
- [LoFTR](loftr.md) — 更早的无检测器匹配谱系
- [Foundation models](foundation-models.md) — 鲁棒粗特征的来源
- [MASt3R](../level-03-monocular-slam/mast3r.md) — 与3D重建融合的稠密匹配
- [DeDoDe](dedode.md) — 同一团队的解耦式稀疏检测器/描述子方法
