# DSAC\*

> Brachmann 2021 · [论文](https://arxiv.org/abs/2002.12324)

**一句话总结** — DSAC系列的整合版TPAMI论文:一个统一的场景坐标回归框架,可从RGB或RGB-D图像进行视觉重定位,训练稳定性和效率都大幅提升。

## 问题

到2020年,DSAC系列已经为不同场景积累了各自独立的方案——RGB与RGB-D输入、有无3D场景模型的训练——每种方案都有自己的初始化阶段和稳定性注意事项。DSAC\*将这些变体整合为一个统一、可靠的框架,使场景坐标回归能够在不同输入模态和监督方式下统一应用。

## 方法与架构

**场景坐标回归+鲁棒位姿求解。** 一个全卷积网络$f$将灰度图像$I$映射为稠密场景坐标$\mathcal{Y}=f(I;\mathbf{w})$——即每个像素所观测到的场景空间中的3D点,与相机空间点的关系为$\mathbf{y}_i = \mathbf{h}\mathbf{e}_i$。输出经过8倍下采样,每个预测有81像素的感受野,而这张"地图"实际上就是28MB的网络权重。位姿优化采用经典RANSAC:用最小求解器$\mathbf{h}_j = g(\mathcal{C}_j)$采样$M{=}64$个假设——对RGB使用基于2D-3D对应关系的P3P/PnP求解器(残差$r^{\text{RGB}}(\mathbf{y}_i,\mathbf{h}) = ||\mathbf{p}_i - K\mathbf{h}^{-1}\mathbf{y}_i||$),对RGB-D使用基于3D-3D对应关系的Kabsch求解器($r^{\text{RGB-D}}(\mathbf{y}_i,\mathbf{h}) = ||\mathbf{e}_i - \mathbf{h}^{-1}\mathbf{y}_i||$)——然后选择内点数最多的假设$s(\mathbf{h},\mathcal{Y})=\sum_{\mathbf{y}_i\in\mathcal{Y}}\mathbf{1}[\,r(\mathbf{y}_i,\mathbf{h})<\tau\,]$($\tau{=}10$像素RGB / 10厘米RGB-D),并在其内点上迭代精化(Levenberg-Marquardt PnP或Kabsch)。

**面向三种设置的统一初始化目标。** DSAC\*可在以下任一设置下训练:RGB-D;RGB+3D模型(渲染出真值坐标$\mathbf{y}^*_i$);或仅RGB。统一的逐像素损失一旦预测变得有效,就*按像素动态*从3D距离切换为重投影误差:

$$\ell^{\text{RGB+M}}(\mathbf{y}_{i},\mathbf{y}^{*}_{i},\mathbf{h}^{*})=\begin{cases}\hat{r}^{\text{RGB}}(\mathbf{y}_{i},\mathbf{h}^{*})&\text{if }\mathbf{y}_{i}\in\mathcal{V}\\ ||\mathbf{y}^{*}_{i}-\mathbf{y}_{i}||&\text{otherwise},\end{cases}$$

其中$\hat{r}^{\text{RGB}}$对重投影误差做软钳位(超过100像素后取平方根)。如果没有3D模型,$\mathbf{y}^*_i$会被替换为在恒定10米深度处虚构出的启发式目标$\bar{\mathbf{y}}_i = \mathbf{h}^*\bar{\mathbf{e}}_i$。这取代了DSAC++中浪费资源的两个独立初始化阶段,将预训练时间从4天减半为2天。

**通过可微RANSAC进行端到端训练。** 整个流水线随后在位姿损失$\ell^{\text{Pose}}(\hat{\mathbf{h}},\mathbf{h}^{*})=||\hat{\mathbf{t}}-\mathbf{t}^{*}||+\gamma\measuredangle(\hat{\bm{\theta}},\bm{\theta}^{*})$上训练,$\gamma{=}100$。每个组件都被做成可微的:Kabsch通过SVD梯度;PnP通过最后一次Gauss-Newton迭代的解析梯度,$\frac{\partial}{\partial\mathcal{Y}}\mathbf{h}(\mathcal{Y})\approx-J_{\mathbf{r}}^{+}\frac{\partial}{\partial\mathcal{Y}}\mathbf{r}_{\mathcal{I}}(\mathcal{Y},\mathbf{h}^{t=\infty})$;内点计数通过sigmoid松弛$s(\mathbf{h},\mathcal{Y})=\sum_{i}\sigma[\beta\tau-\beta r(\mathbf{y}_{i},\mathbf{h})]$,$\beta = 5/\tau$;假设选择则通过DSAC——从分数的softmax分布中采样$j\sim p(j|\mathcal{Y})$,并最小化期望位姿损失

$$\mathcal{L}^{\text{Pose}}(\mathcal{Y},\mathbf{h}^{*})=\mathbb{E}_{j\sim p(j|\mathcal{Y})}\left[\hat{\ell}^{\text{Pose}}(\mathbf{R}(\cdot),\mathbf{h}^{*})\right],$$

其梯度结合了得分函数项$\hat{\ell}^{\text{Pose}}(\cdot)\,\partial_{\mathcal{Y}}\log p(j|\mathcal{Y})$与路径导数。训练中还加入了几何数据增强(±30°旋转,66-150%缩放)。

## 实验结果

- **7Scenes**(5厘米/5°内的帧百分比):在RGB+3D模型设置下达到85.2%——达到最优水平,与SCoCR相当,但模型大小仅为其一小部分(28MB对165MB);仅RGB训练相比DSAC++提升+27.6%;RGB-D精度略超OtF Forests的93.4%(未使用其ICP后处理)。数据增强根据设置带来+9.1/+7.7/+4.1%的提升(在Stairs场景、仅RGB设置下达+51.5%)。
- **12Scenes**:在所有设置下均达到最优水平,约99%——"已解决",即便DSAC\*仅用RGB也是如此。
- **Cambridge Landmarks**(平移中位数厘米/旋转中位数度,带3D模型):St Mary's Church 13/0.4,Great Court 49/0.3,Old Hospital 21/0.4,King's College 15/0.3,Shop Facade 5/0.3——与DSAC++相当,但训练时间为2.5天而非6天。*没有*3D模型时,DSAC\*在所有场景上都超过DSAC++(例如Great Court 34/0.2——优于任何"有"模型训练的方法,因为其SfM重建含有大量离群点)。
- **效率**:前向传播50毫秒(对比DSAC++的150毫秒),总推理时间75毫秒(对比200毫秒);一个4MB的"Tiny"变体仍能达到73.6%(7Scenes)和98.1%(12Scenes);在Cambridge场景压缩对比中,28MB的DSAC\*给出了最高的平均精度。

## 对SLAM的意义

重定位——在已建图场景中恢复6自由度相机位姿——是SLAM系统在跟踪丢失后或在已知环境中重启时所需要的能力。DSAC\*是场景坐标回归这一方案的成熟形态:地图隐式存储在网络权重中,同时几何PnP/Kabsch+RANSAC求解器仍在闭环中,从单张图像即可实现厘米级室内精度。其稳定、整合的训练方案成为后来ACE系列大幅加速训练的参照基线。

## 相关条目

- [DSAC](dsac.md) — 用于相机定位的原始可微RANSAC
- [DSAC++](dsacpp.md) — 仅从相机位姿进行自监督训练
- [ACE](ace.md) — 以数分钟训练时间达到DSAC\*的精度
- [ACE Zero](ace-zero.md) — 扩展SCR以从零开始联合学习位姿和地图
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — 为何SCR优于直接位姿回归
