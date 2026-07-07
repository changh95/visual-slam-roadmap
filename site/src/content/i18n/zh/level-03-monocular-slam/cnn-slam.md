# CNN-SLAM

> Tateno 2017 · [论文](https://arxiv.org/abs/1704.03489)

**一句话总结** — 将CNN预测的稠密深度图与LSD-SLAM风格的半稠密光度深度精化融合，从单目相机中恢复绝对尺度、稠密重建以及融合的语义标签。

## 问题

直接法单目SLAM（LSD-SLAM）能生成半稠密深度图，但在低纹理区域会失效，在纯旋转下（没有立体基线）会失败，并且无法恢复绝对尺度。CNN单图深度预测可以在任何位置给出稠密、具备度量尺度的深度，但深度边界局部模糊，且缺乏多视角一致性。CNN-SLAM（"CNN-SLAM: Real-time dense monocular SLAM with learned depth prediction"，Tateno、Tombari、Laina、Navab）探讨了如何融合这两个互补的信息源，使得"深度预测在单目SLAM方法容易失效的图像区域（例如低纹理区域）中占主导，反之亦然"。

## 方法与架构

这是一个基于LSD-SLAM构建的关键帧直接法SLAM系统。每个关键帧 $k_i$ 保存一个位姿 $\mathbf{T}_{k_i}$、一个*稠密*深度图 $\mathcal{D}_{k_i}$，以及一个不确定性图 $\mathcal{U}_{k_i}$。两个CNN（Laina等人提出的ResNet-50全卷积架构，ImageNet初始化；一个用berHu损失回归深度，另一个用softmax/交叉熵预测语义标签）**仅在每个关键帧运行一次**，在GPU上运行，而跟踪与精化则在CPU上按帧运行（两个线程），从而保持系统的实时性。

**跟踪** — 每一帧 $t$ 都通过高斯-牛顿法对光度残差进行优化，与最近的关键帧对齐，且仅限于高梯度像素 $\tilde{\mathbf{u}}$：

$$E(\mathbf{T}^{k_i}_t)=\sum_{\tilde{\mathbf{u}}\in\Omega}\rho\left(\frac{r(\tilde{\mathbf{u}},\mathbf{T}^{k_i}_t)}{\sigma(r(\tilde{\mathbf{u}},\mathbf{T}^{k_i}_t))}\right),\qquad r(\tilde{\mathbf{u}},\mathbf{T})=\mathcal{I}_{k_i}(\tilde{\mathbf{u}})-\mathcal{I}_t\big(\pi(\mathbf{K}\,\mathbf{T}\,\mathcal{V}_{k_i}(\tilde{\mathbf{u}}))\big)$$

其中 $\rho$ 是Huber范数，$\sigma$ 是残差不确定性函数，$\pi$ 是透视投影，$\mathcal{V}_{k_i}(\mathbf{u})=\mathbf{K}^{-1}\dot{\mathbf{u}}\,\mathcal{D}_{k_i}(\mathbf{u})$ 是关键帧的顶点图。

**关键帧初始化** — 回归得到的深度 $\tilde{\mathcal{D}}_{k_i}$ 会根据当前相机焦距 $f_{cur}$ 与训练传感器焦距 $f_{tr}$ 之间的差异进行调整，这修正了绝对尺度误差的大部分：

$$\mathcal{D}_{k_i}(\mathbf{u})=\frac{f_{cur}}{f_{tr}}\,\tilde{\mathcal{D}}_{k_i}(\mathbf{u})$$

与LSD-SLAM采用较大的常数初始不确定性不同，$\mathcal{U}_{k_i}$ 被初始化为该关键帧CNN深度与最近关键帧变形深度之间差值的平方——即每个预测深度值的跨帧置信度。

**逐帧深度精化** — 每一帧都通过小基线5像素对极线立体匹配（Engel等人2013）产生一个深度/不确定性估计 $(\mathcal{D}_t,\mathcal{U}_t)$，并通过不确定性加权融合到关键帧中：

$$\mathcal{D}_{k_i}(\mathbf{u})=\frac{\mathcal{U}_t(\mathbf{u})\,\mathcal{D}_{k_i}(\mathbf{u})+\mathcal{U}_{k_i}(\mathbf{u})\,\mathcal{D}_t(\mathbf{u})}{\mathcal{U}_{k_i}(\mathbf{u})+\mathcal{U}_t(\mathbf{u})},\qquad \mathcal{U}_{k_i}(\mathbf{u})=\frac{\mathcal{U}_t(\mathbf{u})\,\mathcal{U}_{k_i}(\mathbf{u})}{\mathcal{U}_{k_i}(\mathbf{u})+\mathcal{U}_t(\mathbf{u})}$$

高梯度像素（立体不确定性低）会收敛到精化后的多视角深度——恰恰是CNN边界模糊的地方——而低纹理像素则保留CNN先验。关键帧位姿通过位姿图优化（g2o）进行全局精化；一个全局分割模型逐步将每个关键帧的语义图融合进3D重建中。

## 实验结果

在ICL-NUIM（合成数据集）和TUM RGB-D上进行评估，CNN仅在NYU Depth v2（不同传感器和环境）上训练以测试泛化能力；运行在Xeon 2.4 GHz + Quadro K5200上，网络输入为304×228，SLAM运行分辨率为320×240。在9个序列上，平均绝对轨迹误差为**0.246 m**，而*使用真值尺度启动*的LSD-SLAM为0.562 m，LSD-SLAM为0.772 m，ORB-SLAM为0.643 m，将Laina的CNN深度输入基于点的融合方法为0.512 m。深度估计正确率（与真值相差在10%以内的比例）平均为**22.5%**，而原始CNN+融合为18.5%，REMODE为7.6%，LSD-SLAM（真值尺度启动）为3.0%，LSD-SLAM为0.2%。在以纯旋转为主的TUM fr1/rpy序列上，CNN-SLAM仍能重建场景，而LSD-SLAM噪声严重、ORB-SLAM则初始化失败。论文还展示了首个从单目相机得到的联合3D+语义重建（4个NYU超类）。

## 对SLAM的意义

CNN-SLAM是最早将深度学习深度预测与经典SLAM流水线结合的系统之一，开创了DVSO、D3VO及许多后续系统所遵循的"经典+学习"范式。其核心方法——将学习到的深度视为带不确定性的逐像素测量值，并通过逆方差加权将其与多视角深度融合——证明了学习深度可以恢复度量尺度并在纯旋转下存活，也证明了几何与语义可以在单个单目系统中联合重建。

## 相关条目

- [LSD-SLAM](lsd-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [DeepFusion](deepfusion.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Self-supervised depth](self-supervised-depth.md)
