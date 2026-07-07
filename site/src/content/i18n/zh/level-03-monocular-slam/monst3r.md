# MonST3R

> Zhang 2024 · [论文](https://arxiv.org/abs/2410.03825)

**一句话总结** — 将DUSt3R式点图（pointmap）估计扩展到*动态*场景，通过为每个时间步预测一张点图，从而能够对含有运动物体的视频进行视频深度、相机位姿和4D重建。

## 问题

从动态场景中估计几何结构通常依赖多阶段流水线或全局优化，将问题分解为若干子任务（深度、光流、运动分割），"导致系统复杂且容易出错"。DUSt3R的点图表示将静态重建统一为单次前馈预测，但它假设场景是刚性的：如果输入一段含有运动物体的视频，它会把运动内容强行塞进一个不一致的静态重建中（即便给出真实运动掩码，也无法可靠地求解相机位姿）。MonST3R（Motion DUSt3R）提出的问题是：点图这一思路能否在不引入显式运动模型的情况下经受住运动的考验。

## 方法与架构

**逐时间步点图。** 对于一对帧 $\mathbf{I}^t, \mathbf{I}^{t'}$，网络预测点图 $\mathbf{X}^{t;t\rightarrow t'}$ 和 $\mathbf{X}^{t';t\rightarrow t'} \in \mathbb{R}^{H\times W\times 3}$（附带置信度 $\mathbf{C}$），两者都表示在帧 $t$ 的相机坐标系中——这与DUSt3R的设定完全相同，只是现在每张点图对应*单一时间点*，因此运动内容会被表示在它每一时刻所处的位置。

**面向动态场景的微调。** 障碍在于数据：需要带深度标注的动态、已知位姿视频。作者汇集了四个数据集——PointOdyssey（采样权重50%）、TartanAir（25%）、Waymo（20%）、Spring（5%）——并只微调ViT-Base解码器和DPT头（编码器保持冻结以保留CroCo的几何特征），帧对以时间步长1–9采样（步长越大概率越高），并使用视场角增强以及DUSt3R的置信度感知回归损失。训练25轮 × 每轮2万对，在2块RTX 6000上耗时一天。

**下游工具。** 内参估计沿用DUSt3R的方法（逐帧求解焦距）。相对位姿估计避免使用被动态物体污染的2D-2D对应关系，转而在单一视图内利用逐像素的2D-3D对应关系，结合PnP + RANSAC求解：

$$\mathbf{R^{*}},\mathbf{T^{*}} = \arg\min_{\mathbf{R},\mathbf{T}} \sum_{i\in\mathcal{I}} \big\| \mathbf{x}_i - \pi\big(\mathbf{K}^{t'}(\mathbf{R}\,\mathbf{X}^{t';t\rightarrow t'}_i + \mathbf{T})\big) \big\|^2 .$$

一个可信的*静态掩码*将仅由相机运动引起的光流与估计的光流进行比较：$\mathbf{S}^{t\rightarrow t'} = \big[\alpha > \|\mathbf{F}^{t\rightarrow t'}_{\mathrm{cam}} - \mathbf{F}^{t\rightarrow t'}_{\mathrm{est}}\|_{L1}\big]$。

**动态全局点云与位姿。** 不同于DUSt3R的全对全（all-pairs）图，帧对是在一个滑动时间窗口内形成的（采用步长采样）。全局点图被重新参数化为 $\mathbf{P}^t = [\mathbf{R}^t|\mathbf{T}^t]$、$\mathbf{K}^t$ 以及逐帧深度 $\mathbf{D}^t$，然后进行如下优化：

$$\hat{\mathbf{X}} = \arg\min_{\mathbf{X},\mathbf{P}_W,\sigma}\; \mathcal{L}_{\mathrm{align}}(\mathbf{X},\sigma,\mathbf{P}_W) + w_{\mathrm{smooth}}\,\mathcal{L}_{\mathrm{smooth}}(\mathbf{X}) + w_{\mathrm{flow}}\,\mathcal{L}_{\mathrm{flow}}(\mathbf{X}),$$

其中 $\mathcal{L}_{\mathrm{align}} = \sum_{e}\sum_{t\in e}\|\mathbf{C}^{t;e}\cdot(\mathbf{X}^{t}-\sigma^{e}\mathbf{P}^{t;e}\mathbf{X}^{t;e})\|_1$ 是DUSt3R的对齐项，$\mathcal{L}_{\mathrm{smooth}} = \sum_t \big(\|\mathbf{R}^{t\top}\mathbf{R}^{t+1}-\mathbf{I}\|_f + \|\mathbf{T}^{t+1}-\mathbf{T}^{t}\|_2\big)$ 平滑轨迹，而 $\mathcal{L}_{\mathrm{flow}}$ 使重投影后的全局几何在可信静态区域内与估计的光流相匹配（$w_{\mathrm{smooth}} = w_{\mathrm{flow}} = 0.01$；300次Adam迭代）。直接返回 $\hat{\mathbf{D}}$ 即可得到时间上一致的视频深度。推理耗时：对一段60帧视频（窗口9、步长2）计算成对点图约需30秒，加上在一块RTX 6000上约1分钟的优化。

## 实验结果

- **视频深度**（经尺度与平移对齐，Abs Rel / δ<1.25）：Sintel 0.335/58.5，Bonn **0.063**/96.4，KITTI **0.104**/89.5——在Bonn和KITTI上超过同期的专用方法DepthCrafter（0.075/97.1、0.110/88.1），并超过所有联合深度-位姿基线（CasualSAM：Abs Rel 分别为0.387、0.169、0.246）。仅进行尺度对齐时差距进一步拉大（0.345/0.065/0.106，对比DepthCrafter的0.692/0.217/0.141）。
- **相机位姿**（ATE）：Sintel 0.108、ScanNet 0.068——在联合深度+位姿方法中表现最佳（CasualSAM为0.141/0.158；DUSt3R即便*配合*真实运动掩码仍为0.417/0.081），并可与需要真实内参的纯位姿跟踪方法相媲美（LEAP-VO在Sintel上为0.089）；TUM-dynamics上ATE为0.074。
- **单帧深度**在微调后仍保持DUSt3R的水平（Sintel 0.345对比0.424，Bonn 0.076对比0.141，KITTI 0.101对比0.112 Abs Rel；在静态数据集NYU-v2上略有退化，0.091对比0.080）。
- 消融实验：每个训练数据集均有贡献；解码器+头部微调优于其他替代方案；平滑损失/光流损失能提升位姿精度，且对深度影响很小。定性来看，DAVIS上的前馈式4D重建在DUSt3R的刚性对齐崩溃之处依然能够成功。

## 对SLAM的意义

动态环境一直是基于几何的SLAM的常见失效模式，传统做法是将运动物体掩蔽掉（DynaSLAM、DS-SLAM）。MonST3R展示了一条不同的路径：一个基础模型能够在*存在运动*的情况下原生估计几何结构，位姿、视频深度和运动分割都能从同一个表示中一并得出——并且它表明，只需一次适度、精心选择的微调（主要使用合成数据、冻结编码器）即可实现，无需任何显式运动模型。它是从静态的DUSt3R/MASt3R系列迈向4D场景理解的关键垫脚石，表明静态世界假设可以在表示层面被消解，而不必在流水线层面进行修补。

## 相关条目

- [DUSt3R](dust3r.md)
- [MASt3R](mast3r.md)
- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [SEA-RAFT](../level-05-deep-learning/sea-raft.md) — 它所依赖的现成光流方法类别
- [Align3R](../level-05-deep-learning/align3r.md)
