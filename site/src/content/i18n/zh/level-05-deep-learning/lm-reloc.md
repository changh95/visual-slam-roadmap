# LM-Reloc

> von Stumberg 2020 · [论文](https://arxiv.org/abs/2010.06323)

**一句话总结** — 深度直接法重定位：学习专为基于Levenberg-Marquardt的直接图像配准而设计的CNN特征，在无需特征匹配或RANSAC的情况下估计查询图像与参考图像之间的相对位姿。

## 问题

视觉重定位几乎普遍采用基于特征的方法来解决——检测特征点、匹配描述子、用RANSAC剔除外点、求解位姿。这条流水线除了角点之外抛弃了所有信息。直接图像配准可以利用*任何*具有梯度的图像区域，但原始的光度配准在光照、天气和季节变化下会失效，其狭窄的收敛域也使其在重定位常见的大基线下变得脆弱。LM-Reloc提出的问题是：如何在保留直接法表述的同时，使其在不同条件下保持鲁棒。

## 方法与架构

LM-Reloc在给定来自直接法SLAM系统（Stereo DSO）的稀疏深度的情况下，估计图像$I$和$I'$之间的6自由度位姿$\boldsymbol{\xi} \in SE(3)$。三个组件协同工作：**LM-Net**（生成多尺度特征图$F_l, F'_l$，$l = 1,\dots,4$的孪生编码器-解码器）、**CorrPoseNet**（粗略位姿初始化），以及一个经典的**Levenberg-Marquardt优化器**。

**在学习特征上进行直接配准。** 优化器最小化的不是原始像素强度，而是粗到细金字塔中的特征度量能量（$F_1$位于$(w/8, h/8)$，直至$F_4$位于全分辨率）：

$$E(\boldsymbol{\xi})=\sum_{\mathbf{p}\in P}\big\lVert F_{l}^{\prime}(\mathbf{p}^{\prime})-F_{l}(\mathbf{p})\big\rVert_{\gamma}, \qquad \mathbf{p}^{\prime}=\Pi\left(\mathbf{R}\,\Pi^{-1}(\mathbf{p},d_{\mathbf{p}})+\mathbf{t}\right),$$

采用Huber范数$\lVert\cdot\rVert_\gamma$以及逐点深度$d_{\mathbf{p}}$。每次LM迭代构建高斯-牛顿系统$\mathbf{H}=\mathbf{J}^{T}\mathbf{W}\mathbf{J}$，$\mathbf{b}=-\mathbf{J}^{T}\mathbf{W}\mathbf{r}$，通过$\mathbf{H}'=\mathbf{H}+\lambda\mathbf{I}$（Levenberg）或$\mathbf{H}'=\mathbf{H}+\lambda\,\mathrm{diag}(\mathbf{H})$（Marquardt）对其进行阻尼处理，并更新$\boldsymbol{\delta}=\mathbf{H}'^{-1}\mathbf{b}$，$\boldsymbol{\xi}^{i}=\boldsymbol{\delta}\boxplus\boldsymbol{\xi}^{i-1}$；$\lambda$在成功步骤后减半，在失败步骤后翻两番。

**围绕优化器设计的损失。** 核心思想：训练特征使LM在其上表现良好，区分投影点在优化过程中可能处于的四种状态，每种状态有各自采样的对应关系和损失项：

1. 正确位置：$E_{\text{pos}}=\lVert F^{\prime}(\mathbf{p}_{\text{gt}}^{\prime})-F(\mathbf{p})\rVert^{2}$应趋于零。
2. 外点（在任意位置采样的负样本）：$E_{\text{neg}}=\max\left(M-\lVert F^{\prime}(\mathbf{p}_{\text{neg}}^{\prime})-F(\mathbf{p})\rVert^{2},0\right)$，边界$M=1$——错误匹配必须产生较大的残差。
3. 远离最优解（负样本约5像素外，$\lambda$较大，处于梯度下降区域）：一次阻尼后的逐点光流步$\mathbf{p}_{\text{after}}^{\prime}=\mathbf{p}_{\nabla}^{\prime}+(\mathbf{H}_{\mathbf{p}}+\lambda_{f}\mathbf{I})^{-1}\mathbf{b}_{\mathbf{p}}$必须朝真值方向移动：$E_{\text{GD}}=\max\left(\lVert\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime}\rVert^{2}-\lVert\mathbf{p}_{\nabla}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime}\rVert^{2}+\delta,0\right)$（扩大收敛域；$\lambda_f{=}2.0$，$\delta{=}0.1$）。
4. 接近最优解（负样本在1像素以内，$\lambda$较小，处于高斯-牛顿区域）：来自GN-Net的概率性高斯-牛顿损失，$E_{\text{GN}}=\frac{1}{2}(\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime})^{T}\mathbf{H}_{\mathbf{p}}(\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime})+\log(2\pi)-\frac{1}{2}\log(|\mathbf{H}_{\mathbf{p}}|)$（使最小值更陡峭，提升亚像素精度）。

**用于初始化的CorrPoseNet。** 一个带相关层的回归网络，$\mathbf{c}(i,j,(i^{\prime},j^{\prime}))=\mathbf{f}_{\text{corr}}(i,j)^{T}\mathbf{f}_{\text{corr}}^{\prime}(i^{\prime},j^{\prime})$，回归欧拉角和平移量，用于在大基线/大旋转下为LM提供初始化；它鲁棒但不精确，因此最终估计始终来自几何优化。

## 实验结果

在重定位跟踪基准（CARLA + Oxford RobotCar）上评估，报告累积位姿误差曲线在0.5米/0.5°以内的AUC：

- **CARLA（测试集）**：LM-Reloc达到$t_{\text{AUC}}/R_{\text{AUC}}$为**80.65 / 77.83**，而SuperGlue为78.99 / 59.31，R2D2为73.47 / 54.42，SuperPoint为72.76 / 53.38，D2-Net为47.62 / 16.47；不使用CorrPoseNet时为63.88 / 61.9，GN-Net为43.72 / 44.08——仅LM损失本身已大幅超越GN-Net。
- **Oxford RobotCar**（晴天/多云/雨天/雪天之间的6个跨条件配对）：LM-Reloc在旋转AUC上几乎全面胜出（例如Sunny-Overcast为55.48，而SuperGlue为52.83），同时在平移方面保持竞争力；LiDAR-ICP真值本身就有约16厘米的RMS误差，掩盖了低于0.15米的平移提升。
- **与GN-Net的直接对比**（不使用CorrPoseNet，相同的配准流水线）：在全部六个序列上均更优，例如Sunny-Rainy为70.46 / 42.86，而GN-Net为64.58 / 37.27。
- **消融实验**：$E_{\text{GD}}$主要提升鲁棒性，$E_{\text{GN}}$提升精度；只有两者结合才能同时获得两方面的收益。

## 对SLAM的意义

LM-Reloc源自TUM直接法SLAM谱系（DSO及其衍生系统），解决了直接法的一个核心弱点：外观变化下的重定位与地图复用。它展示了一种富有成效的设计模式——保留经典的几何优化器，但学习其运算所依赖的表征，并围绕优化器实际的收敛行为来设计训练损失。当你需要直接法的精度，但又必须跨会话或跨条件重定位时，可以采用这一类思路。

## 相关条目

- [DSO](../level-03-monocular-slam/dso.md) — 本文所依托的直接法里程计谱系
- [D3VO](../level-03-monocular-slam/d3vo.md) — 同一团队的深度直接法里程计；启发了CorrPoseNet
- [PoseNet](posenet.md) — 纯位姿回归，此处仅用于初始化
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — 为什么单靠回归还不够
- [HF-Net](hf-net.md) — 基于特征匹配的重定位替代方案
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — 检索用于重定位的参考图像
