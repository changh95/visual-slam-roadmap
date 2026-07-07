# DSAC++

> Brachmann 2018 · [论文](https://arxiv.org/abs/1711.10228)

**一句话总结** — "学得更少即更多":将DSAC流水线精简为单一可学习组件——一个回归场景坐标的FCN——由一个无参数的软内点计数打分,并证明它可以仅从RGB图像和真值位姿训练,而无需任何3D模型即可发现场景几何。

## 问题

DSAC存在三个缺点。其评分CNN容易过拟合——它记住的是重投影误差在图像中*出现的位置*这一模式,而这种模式无法泛化到未见过的视角。其初始化需要来自RGB-D数据或3D场景模型的场景坐标真值,而这种真值可能并不存在(尤其是室外场景,重建往往需要繁琐的参数搜索)。而且其端到端训练不稳定,因为位姿精化的梯度是通过有限差分计算的,梯度方差很高。DSAC++探究的问题是:是否只学习定位流水线中的*单一*组件就足够——以及它能否仅从相机位姿中学习。

## 方法与架构

DSAC风格的流水线被保留——场景坐标回归、通过4元组PnP进行假设采样、概率化选择、精化——但只保留一个可学习组件:

- **全卷积坐标网络**(VGG风格,约3000万参数):将640x480图像映射为80x60的场景坐标$\mathbf{y}_i(\mathbf{w})$,感受野为41x41像素——这是复用计算的稠密预测,与DSAC中相互独立的图块不同。
- **软内点计数取代评分CNN**:假设的一致性是对重投影误差进行sigmoid平滑后的内点计数$r_i(\mathbf{h},\mathbf{w})=\lVert C\mathbf{h}^{-1}\mathbf{y}_i(\mathbf{w})-\mathbf{p}_i\rVert$:

$$s(\mathbf{h})=\sum_i \mathrm{sig}\left(\tau-\beta\, r_i(\mathbf{h},\mathbf{w})\right)$$

  假设$j$通过softmax选出,$P(j;\mathbf{w},\alpha) \propto \exp(\alpha\, s(\mathbf{h}_j(\mathbf{w})))$,其中$\alpha$通过对$|S(\alpha)-S^{*}|$做梯度下降自动调节,$S(\alpha)$是$P$的Shannon熵——这样能保持分布较宽,使端到端训练保持稳定而不至于坍缩。
- **三步训练**:(1)*初始化*坐标,以目标$\mathbf{y}^{*}$为监督——若有3D模型则由其渲染得到,否则采用恒定深度启发式$\mathbf{y}_i^{*} \approx \mathbf{h}^{*}(\frac{d x_i}{f}, \frac{d y_i}{f}, d, 1)^T$,该方法仅用于区分不同相机视角;(2)*优化重投影误差*,针对真值位姿$\tilde{\mathbf{w}}=\arg\min_{\mathbf{w}}\sum_i r_i(\mathbf{h}^{*},\mathbf{w})$——网络从单视图约束中恢复真实深度,即在没有3D模型的情况下发现场景几何;(3)*端到端*训练,像DSAC一样最小化期望位姿损失$\mathbb{E}_{j\sim P}[\ell(\mathbf{R}(\mathbf{h}_j(\mathbf{w})),\mathbf{h}^{*})]$。
- **解析精化梯度**:精化是对内点重投影误差做Gauss-Newton迭代,$\mathbf{R}^{t+1}=\mathbf{R}^{t}-(J_{\mathbf{r}}^{T}J_{\mathbf{r}})^{-1}J_{\mathbf{r}}^{T}\mathbf{r}(\mathbf{R}^{t},\mathbf{w})$,其梯度通过在最优点$\mathbf{h}_\mathrm{O}$附近线性化来近似:$\frac{\partial}{\partial\mathbf{w}}\mathbf{R}(\mathbf{h})\approx-(J_{\mathbf{r}}^{T}J_{\mathbf{r}})^{-1}J_{\mathbf{r}}^{T}\frac{\partial}{\partial\mathbf{w}}\mathbf{r}(\mathbf{h}_{\mathrm{O}},\mathbf{w})$——取代了DSAC中不稳定的有限差分方法。

## 实验结果

- **7Scenes**(5厘米/5度以内的帧百分比,完整数据集):有3D模型时为**76.1%**——相比在RGB-D上训练的DSAC提升+13.6%;从渲染模型训练的DSAC再下降6.6%,因此DSAC++在*没有任何3D模型*的情况下(60.4%)仍比使用模型训练的DSAC高4.5%。
- **12Scenes**:有3D模型时为96.4%,比DSAC高16.7个百分点;无3D模型时为60.9%,与SIFT+PnP基线相当。
- **误差中位数**:例如7Scenes的Chess场景为0.02米/0.5度;Cambridge的King's College为0.18米/0.3度,Great Court为0.40米/0.2度——在许多场景上比PoseNet系列方法好约10倍,比基于特征的Active Search方法好约2倍;即便没有3D模型,它仍超过大多数基于模型的竞争方法(例如King's College为0.23米/0.4度)。与DSAC一样,它在数量级更大的Cambridge Street场景上失败。
- **消融实验**:仅将DSAC的评分CNN替换为软内点计数,就能使7Scenes从55.9%提升到58.9%(Heads +19%,Stairs +8%),12Scenes从79.7%提升到89.6%——说明得分*回归*泛化能力差,而坐标回归泛化能力好。

## 对SLAM的意义

DSAC++消除了场景坐标回归在实践中最大的障碍——对3D真值的需求——使该方法能够兼容任何提供位姿的SLAM/SfM系统的输出。它的方案(单一FCN+经典几何求解、软内点评分、解析Gauss-Newton梯度、基于重投影的自监督)成为DSAC\*和ACE系列所采用的模板,并早早证明了仅凭单视图重投影约束就能发现一个隐式神经场景地图——这一思想在神经建图领域反复出现。

## 相关条目

- [DSAC](dsac.md) — 原始的可微RANSAC公式
- [DSAC\*](dsac-star.md) — 统一并进一步改进的框架(TPAMI)
- [ACE](ace.md) — 将SCR训练时间从数小时加速到数分钟
- [ACE Zero](ace-zero.md) — 进一步去除位姿监督,从零学习地图
- [PoseNet](posenet.md) — 被SCR超越的绝对位姿回归方法
