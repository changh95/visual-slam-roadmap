# DROID-SLAM

> Teed 2021 · [论文](https://arxiv.org/abs/2108.10869)

**一句话总结** — 一种端到端学习的SLAM系统，通过迭代细化稠密光流，并通过一个可微的稠密光束法平差（Dense Bundle Adjustment）层来求解位姿和深度，相比经典系统大幅减少了灾难性失败。

## 问题

经典SLAM流水线依赖手工设计的特征提取与匹配，而这恰恰在机器人最需要鲁棒性的场景中显得脆弱：无纹理表面、运动模糊、重复结构——"失败可能有多种形式，例如特征跟踪丢失、优化算法发散，以及漂移累积"。此前的学习型系统（DeepVO、TartanVO、DeepV2D、BA-Net）"在常用基准测试上的精度远不及经典对手"，因为它们缺乏完整的光束法平差、回环检测和全局优化。DROID-SLAM提出的问题是：能否构建一个端到端可训练的系统，既保留使SLAM精确的优化结构，又学习那些使经典SLAM脆弱的部分？

## 方法与架构

**状态与帧图。** 对每张图像 $t$，系统维护一个位姿 $\mathbf{G}_t \in SE(3)$ 和一张逆深度图 $\mathbf{d}_t \in \mathbb{R}_+^{H\times W}$。帧图 $(\mathcal{V},\mathcal{E})$ 连接共视帧；当相机重新访问已建图区域时会加入长程边，从而在同一套机制内实现回环检测。

**特征与相关性。** RAFT风格的特征网络和上下文网络生成1/8分辨率的特征图。对每条边 $(i,j)\in\mathcal{E}$，通过全对点积构建一个4D相关性体，$C^{ij}_{u_1 v_1 u_2 v_2} = \langle g_\theta(I_i)_{u_1 v_1},\, g_\theta(I_j)_{u_2 v_2} \rangle$，池化为4层金字塔，并由一个半径为 $r$ 的查找算子进行索引。

**循环更新算子。** 每次迭代首先计算由当前几何结构诱导出的稠密对应场，

$$\mathbf{p}_{ij} = \Pi_c(\mathbf{G}_{ij} \circ \Pi_c^{-1}(\mathbf{p}_i, \mathbf{d}_i)), \qquad \mathbf{G}_{ij} = \mathbf{G}_j \circ \mathbf{G}_i^{-1}$$

其中 $\Pi_c$ 是相机投影，$\mathbf{p}_i$ 是像素网格。在 $\mathbf{p}_{ij}$ 处的相关性查找结果、诱导光流以及上一次BA残差，一起输入一个 $3\times 3$ 的ConvGRU，输出光流修正量 $\mathbf{r}_{ij}$ 和置信度 $\mathbf{w}_{ij} \in \mathbb{R}_+^{H\times W\times 2}$，得到修正后的对应关系 $\mathbf{p}^*_{ij} = \mathbf{r}_{ij} + \mathbf{p}_{ij}$，以及一个逐像素的阻尼因子 $\lambda$。

**稠密光束法平差（DBA）层。** 通过在整个帧图上最小化以下目标，将光流修正量映射为位姿/深度的更新：

$$\mathbf{E}(\mathbf{G}', \mathbf{d}') = \sum_{(i,j)\in\mathcal{E}} \left\lVert \mathbf{p}^*_{ij} - \Pi_c(\mathbf{G}'_{ij} \circ \Pi_c^{-1}(\mathbf{p}_i, \mathbf{d}'_i)) \right\rVert^2_{\Sigma_{ij}}, \qquad \Sigma_{ij} = \operatorname{diag} \mathbf{w}_{ij}$$

即一个按置信度加权（马氏距离）的重投影误差。一次高斯-牛顿步通过Schur补求解——深度块 $\mathbf{C}$ 是对角矩阵，因此 $\Delta\boldsymbol{\xi} = [\mathbf{B} - \mathbf{E}\mathbf{C}^{-1}\mathbf{E}^{T}]^{-1}(\mathbf{v} - \mathbf{E}\mathbf{C}^{-1}\mathbf{w})$，$\Delta\mathbf{d} = \mathbf{C}^{-1}(\mathbf{w} - \mathbf{E}^{T}\Delta\boldsymbol{\xi})$——并通过收缩映射（retraction）应用：$\mathbf{G}^{(k+1)} = \operatorname{Exp}(\Delta\boldsymbol{\xi}^{(k)}) \circ \mathbf{G}^{(k)}$，$\mathbf{d}^{(k+1)} = \Delta\mathbf{d}^{(k)} + \mathbf{d}^{(k)}$。该层是可微的，因此整个循环可以端到端训练（位姿损失 $\mathcal{L}_{pose} = \sum_i \lVert \operatorname{Log}_{SE3}(\mathbf{T}_i^{-1}\cdot\mathbf{G}_i) \rVert_2$ 加上光流损失，训练在7帧的TartanAir片段上进行，展开15次迭代，在4张RTX-3090上耗时1周）。

**系统。** 一个前端线程跟踪输入帧，并在关键帧窗口上运行局部BA；一个后端线程重建帧图，并在完整的关键帧历史上运行全局BA（自定义块稀疏CUDA核）。双目模式只需增加固定基线的跨相机边；RGB-D模式则在目标函数中增加一个深度残差项——同一套单目训练得到的权重可以处理这三种模态。

## 实验结果

只在合成数据集TartanAir上训练一次，且仅用单目数据；在4个数据集和3种模态上进行零样本评测：

- **TartanAir**（单目，Hard测试集）：平均ATE为0.24米，TartanVO为1.92，DeepV2D为5.03——分别低8倍和20倍，且零失败。在ECCV 2020 SLAM竞赛分割上：0.129（单目）和0.047（双目），比最优的基于COLMAP的提交方案误差低62%/60%，同时运行速度快16倍。
- **EuRoC**（单目）：在全部11个序列上平均ATE为0.022米，且零失败——比此前零失败方法低82%，比ORB-SLAM3在其能完成的10/11个序列上低43%；双目模式相比ORB-SLAM3误差降低71%。
- **TUM-RGBD**（freiburg1，单目）：平均ATE为0.038米，在全部9个序列上均能跟踪，而ORB-SLAM2/3在大多数序列上失败；比DeepFactors误差低83%，比DeepV2D低90%。
- **ETH3D-SLAM**（RGB-D）：在训练集和测试集排行榜上均排名第一（测试集AUC为207.79，BAD-SLAM为153.47），成功跟踪30/32个数据集，而次优方法仅为19/32。
- **成本**：实时运行需要2张RTX-3090（在EuRoC上约20 fps）；在长视频上后端可能需要多达24 GB的GPU显存——这正是DPVO/DPV-SLAM出现的直接动因。

## 对SLAM的意义

DROID-SLAM建立了学习型SLAM的可微BA范式，并证明了一个经过训练的系统能够匹敌甚至超越数十年手工设计的SLAM流水线，从而引发了一波基于学习的SLAM研究热潮。它的循环更新加DBA架构是DPVO、DPV-SLAM和MAC-VO的直接源头，并作为位姿/深度前端服务于像NeRF-SLAM和GO-SLAM这样的系统内部。

## 相关条目

- [RAFT](../level-05-deep-learning/raft.md)
- [DPVO](dpvo.md)
- [TartanVO](tartanvo.md)
- [ORB-SLAM3](orb-slam3.md)
- [NeRF-SLAM](nerf-slam.md)
- [GO-SLAM](go-slam.md)
