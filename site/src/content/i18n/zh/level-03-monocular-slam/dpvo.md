# DPVO

> Teed 2023 · [论文](https://arxiv.org/abs/2208.04726)

**一句话总结** — DROID-SLAM的一种基于补丁、轻量化的变体，表明稀疏补丁跟踪加可微光束法平差能以远小于稠密光流的内存和算力，达到甚至超越其精度。

## 问题

基于稠密光流构建的深度视觉里程计（DROID-SLAM）大幅提升了精度，但"使用稠密光流会带来巨大的计算开销，使得这些方法在许多实际场景中不可行"：DROID的VO前端需要8.7 GB的GPU显存，且在快速运动时帧率会崩溃。业界一直认为这种开销是必要的——稠密光流"能针对错误匹配提供额外的冗余保护"。深度补丁视觉里程计（Deep Patch Visual Odometry，DPVO）正是要检验、并最终推翻这一假设。

## 方法与架构

**补丁表示。** 场景由一组位姿 $\mathbf{T} \in \mathbb{SE}(3)^N$ 和一组 $p \times p$ 的正方形图像补丁构成，每个补丁存储为一个 $4 \times p^2$ 的齐次数组，包含像素坐标 $(\mathbf{x}, \mathbf{y})$ 以及该补丁共享的单一逆深度 $\mathbf{d}$（一个正对平面，与DSO中的做法相同）。帧 $i$ 中的补丁 $k$ 重投影到帧 $j$ 中为

$$\mathbf{P}'_{kj} \sim \mathbf{K} \mathbf{T}_j \mathbf{T}_i^{-1} \mathbf{K}^{-1} \mathbf{P}_k$$

其中 $\mathbf{K}$ 是标定矩阵。一个双部图**补丁图**将每个补丁与其源帧距离 $r$ 以内的每一帧相连；补丁轨迹就是这些重投影的集合，图会随新帧到来而增长或收缩。

**特征与补丁。** 一对孪生残差网络在1/4分辨率下（两层金字塔）给出匹配特征和上下文特征。补丁在*随机*像素位置进行裁剪——每帧96个（Default配置）或48个（Fast配置）——消融实验表明这种做法优于SIFT、ORB、SuperPoint或基于梯度的选取方式。

**循环更新算子。** 在补丁图上，每条边维护一个隐藏状态，每次迭代执行：（1）*相关性计算*——对重投影补丁的每个像素，与帧特征的 $7\times 7$ 网格做内积，$\mathbf{C}_{uv\alpha\beta} = \langle \mathbf{g}_{uv},\ \mathbf{f}(\mathbf{P}'_{kj}(u,v) + \Delta_{\alpha\beta}) \rangle$；（2）沿每条补丁轨迹进行*一维时序卷积*；（3）*softmax聚合*——在共享同一补丁或同一帧的边之间进行消息传递，取代了稠密方法天然具备的空间卷积；（4）一个*转移模块*（门控残差单元加LayerNorm）；（5）一个*因子头*，为每条边预测二维轨迹修正量 $\delta_{kj}$ 和置信度 $\Sigma_{kj} \in (0,1)^2$。

**可微光束法平差。** 位姿和补丁逆深度通过两次高斯-牛顿迭代（利用Schur补，梯度通过反向传播）来更新，目标为

$$\sum_{(k,j)\in\mathcal{E}} \left\lVert \hat{\omega}_{ij}(\mathbf{T}, \mathbf{P}_k) - [\hat{\mathbf{P}}'_{kj} + \delta_{kj}] \right\rVert^2_{\Sigma_{kj}}$$

即诱导重投影与预测的补丁中心重投影之间的马氏距离——这本质上是DROID-SLAM的DBA，只是问题规模大幅缩小。

**训练与系统。** 在TartanAir上端到端训练（24万次迭代，单张RTX-3090，耗时3.5天），损失为 $\mathcal{L} = 10\mathcal{L}_{pose} + 0.1\mathcal{L}_{flow}$，其中 $\mathcal{L}_{pose}$ 在经过Umeyama尺度对齐后比较相对位姿。推理阶段：8帧初始化、恒速位姿预测、每帧一次更新加两次BA迭代，滑动窗口为10个关键帧（Fast配置为7个），基于光流的关键帧移除策略。没有回环检测或全局BA——这一空缺由DPV-SLAM填补。

## 实验结果

以下为5次运行的中位数；两种配置：Default（60 FPS，4.9 GB）和Fast（120 FPS，2.5 GB），均在RTX-3090上运行，对比DROID-VO的40 FPS / 8.7 GB。

- **TartanAir**（ECCV 2020 SLAM竞赛测试集）：平均ATE为0.21——比完整版DROID-SLAM（0.33）低40%，比DROID-VO（0.58）低64%；经典方法DSO平均为7.32，ORB-SLAM3为14.38。在验证集上，AUC为0.80，DROID-SLAM为0.71，而运行速度快4倍。
- **EuRoC**：平均ATE为0.105，DROID-VO为0.186（低43%）；即便是120 FPS的Fast配置（0.129）在大多数序列上也胜过DROID-VO。
- **TUM-RGBD**（freiburg1，单目）：平均ATE为0.089，DROID-VO为0.098（低9%），且没有出现灾难性失败，而ORB-SLAM3和DSO在多个序列上均失败。
- **稳定性**：帧率几乎恒定（95%的帧帧率高于48 FPS；Fast配置始终高于98 FPS），而DROID-VO在最差情况下会降至11 FPS——差距达8.9倍。

## 对SLAM的意义

DPVO使得基于可微BA的视觉里程计从一个离线、高GPU消耗的方案，变成了适用于实时机器人应用的实用技术，其"在稀疏补丁上进行循环更新"的设计被后续工作（如MAC-VO和DPV-SLAM）采纳（并在DEVO中被改造用于事件相机）。它是当今学习型单目VO的标准现代基线。该条目同时出现在第3层级（作为单目系统）和第5层级（作为深度学习方法）中。

## 相关条目

- [DROID-SLAM](droid-slam.md)
- [DPV-SLAM](dpv-slam.md)
- [MAC-VO](mac-vo.md)
- [DSO](dso.md) — 补丁表示的来源
- [RAFT](../level-05-deep-learning/raft.md)
- [DEVO](../level-10-event-camera-slam/devo.md)
