# DSAC

> Brachmann 2017 · [论文](https://arxiv.org/abs/1611.05705)

**一句话总结** — 用概率化选择取代确定性假设选择,使RANSAC变得可微,从而能够通过鲁棒位姿估计器端到端训练一个基于场景坐标的相机定位流水线。

## 问题

RANSAC是几何视觉(多视图几何、位姿估计、SLAM)中鲁棒估计的核心工具,遵循"局部预测、全局拟合"的模式。但它的假设选择——选取具有最高一致性得分的模型假设,$\mathbf{h}_{\mathrm{AM}}=\arg\max_{\mathbf{h}_J} s(\mathbf{h}_J,Y)$——是不可微的,因此RANSAC无法嵌入端到端训练的深度流水线中。具体到相机重定位任务,深度学习此前一直未能超越传统方法:直接位姿回归(PoseNet)不够精确(每个场景的平移误差中位数约40厘米),而场景坐标回归虽保留了几何结构,但其可学习组件只能用替代损失训练,而不能用真正重要的位姿损失来训练。

## 方法与架构

该流水线遵循场景坐标回归(SCoRF)框架,估计一张RGB图像在已知场景中的6自由度位姿$\tilde{\mathbf{h}}$:

- **坐标CNN**($\mathbf{w}$;VGG风格,13层,3300万参数):对每个42x42图块预测一个场景坐标$\mathbf{y}_i \in \mathbb{R}^3$——即一个2D-3D对应关系;每张图像40x40个预测。
- **假设生成**:均匀采样$n{=}4$个对应关系的最小集合,通过PnP得到256个位姿假设$\mathbf{h}_J$组成的假设池。
- **评分CNN**($\mathbf{v}$;13层,600万参数):每个假设根据其40x40的重投影误差图$e_i = \lVert\mathbf{p}_i - C\mathbf{h}_J\mathbf{y}_i\rVert$打分,其中$\mathbf{p}_i$是像素$i$的2D位置,$C$是相机投影矩阵。
- **选择+精化**:选出一个假设,然后在内点坐标上(重投影误差低于$\tau=10$像素,最多100个内点)迭代精化8次。

论文比较了两条使选择步骤可微的路线:

- **SoftAM(软argmax)**:用softmax加权平均取代选择,$\mathbf{h}_{\mathrm{SoftAM}}=\sum_J P(J|\mathbf{v},\mathbf{w})\,\mathbf{h}_J$,$P(J|\mathbf{v},\mathbf{w}) \propto \exp(s(\mathbf{h}_J,Y;\mathbf{v}))$——但这放弃了RANSAC的硬性决策,转而学习一种鲁棒平均。
- **DSAC(概率化选择)**:保留硬性选择但对其进行采样,$\mathbf{h}_{\mathrm{DSAC}}=\mathbf{h}_J$,其中$J \sim P(J|\mathbf{v},\mathbf{w})$,并最小化*期望*任务损失,灵感来自策略梯度强化学习:

$$\tilde{\mathbf{w}},\tilde{\mathbf{v}}=\arg\min_{\mathbf{w},\mathbf{v}}\sum_{I\in\mathcal{I}}\mathbb{E}_{J\sim P(J|\mathbf{v},\mathbf{w})}\left[\ell(\mathbf{R}(\mathbf{h}_J^{\mathbf{w}},Y^{\mathbf{w}}))\right]$$

  其梯度本身也是一个期望:

$$\frac{\partial}{\partial\mathbf{w}}\mathbb{E}_{J}\left[\ell(\cdot)\right]=\mathbb{E}_{J}\left[\ell(\cdot)\frac{\partial}{\partial\mathbf{w}}\log P(J|\mathbf{v},\mathbf{w})+\frac{\partial}{\partial\mathbf{w}}\ell(\cdot)\right]$$

训练损失是位姿误差$\ell_{\text{pose}}(\mathbf{h},\mathbf{h}^{*})=\max(\measuredangle(\boldsymbol{\theta},\boldsymbol{\theta}^{*}),\lVert\mathbf{t}-\mathbf{t}^{*}\rVert)$(旋转以度为单位,平移以厘米为单位)。两个CNN先分别单独训练(坐标损失用$L_1$;得分回归目标为$-\beta\,\ell_{\text{pose}}$,$\beta{=}10$),再进行端到端训练;PnP和精化的导数通过中心差分计算。

## 实验结果

在7-Scenes数据集上(精度=5厘米/5度以内的测试帧百分比):

- **单独训练**:在完整数据集(17,000帧)上,RANSAC为61.0%,SoftAM为61.6%,DSAC为60.3%——均已超过稀疏特征基线(38.6%)和Brachmann等人的自动上下文森林流水线(55.2%),这主要得益于评分CNN。
- **端到端训练**:DSAC提升至**62.5%**(+2.2%,SEM ±0.4%),其中Kitchen +5.0%,Pumpkin +3.3%;SoftAM反而*下降*到57.8%(−3.8%),出现严重过拟合(Office −14.7%)——其平均化机制迫使得分分布被过度压窄而坍缩,而DSAC则保持分布较宽。端到端DSAC在完整数据集上比之前的最优结果高出7.3%(场景平均为4.9%)。
- **位姿误差中位数**:3.9厘米/1.6度,而Brachmann等人的方法为4.5厘米/2.0度;PoseNet(平移误差中位数约40厘米)不具竞争力。
- 端到端训练完成后,测试时可以恢复原始的argmax选择而不损失精度(62.4%)。弱点:Stairs场景(4.5%)在重复结构上因单模态点预测而表现不佳。

## 对SLAM的意义

DSAC确立了场景坐标回归作为室内相机重定位领域主流的学习范式,大幅超越绝对位姿回归,因为它在闭环中保留了几何求解器,并针对任务真正关心的位姿损失进行训练。可微RANSAC这一思想在几何深度学习中广泛传播——论文明确提出将其作为端到端学习SfM或SLAM的鲁棒优化组件——而DSAC正是DSAC++、DSAC\*以及当今快速训练重定位方法ACE系列的直接源头。

## 相关条目

- [PoseNet](posenet.md) — 被SCR超越的绝对位姿回归基线
- [DSAC++](dsacpp.md) — 后续版本:仅一个可学习组件,仅从位姿即可训练
- [DSAC\*](dsac-star.md) — 统一的RGB/RGB-D框架,训练更稳定
- [ACE](ace.md) — 场景坐标回归训练时间从数小时缩短到数分钟
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — 为何直接位姿回归表现不足
