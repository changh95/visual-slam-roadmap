# AMB3R

> Wang 2025 · [论文](https://arxiv.org/abs/2511.20343)

**一句话总结** ——一个属于DUSt3R/VGGT谱系的前馈式3D重建模型，它在冻结的VGGT基础上增加了一个度量尺度头和一个稀疏体积后端，使单个网络同时服务于多视图重建、无标定视觉里程计和大规模SfM——无需微调或测试时优化。

## 问题

点图（Pointmap）模型（DUSt3R、MASt3R、VGGT）逐像素回归3D几何，但网络是在2D网格上运作的：没有任何机制强制*空间紧凑性*——这一性质（TSDF、特征网格、坐标网络所共有）指的是一个3D位置只对应一个值，正是这一性质将同一点的多次观测融合成一致的几何。重叠像素的点图预测之间只是隐式地被鼓励保持一致。还有两个差距使这些模型与可部署的SfM/SLAM引擎有距离：预测是归一化尺度而非度量尺度的，并且此前的系统需要基于优化的后端（例如VGGT-SLAM的SL(4)因子图）或任务特定的调优才能作为VO/SfM运行。AMB3R（"Accurate feed-forward Metric-scale 3D reconstruction with Backend"，精确的前馈度量尺度3D重建及后端）在一个模型内同时解决这三个问题。

## 方法与架构

- **前端**：冻结的VGGT从图像 $\{I_t\}_{t=1}^{T}$ 预测点图 $P_t^{(1)}$（在第一帧坐标系下）、深度、相机参数以及置信度。
- **度量尺度头**：与回归一个全局尺度（不稳定——它会随帧组合和顺序变化）不同，一个轻量级头会对每一帧，利用编码器+深度分支特征，回归出预测深度中位数所在像素的度量对数深度；对各帧取中位数将重建对齐到度量空间。用L1损失训练。
- **稀疏体积后端**：预测的点和几何特征被池化进一个稀疏体素网格 $\mathcal{V}$（归一化空间中体素大小为0.01，因此分辨率会随场景尺度自适应）：
  $$H_i = \frac{1}{|\mathcal{P}_i|} \sum_{(t,\mathbf{u}) \in \mathcal{P}_i} G_t[\mathbf{u}], \qquad \{\hat{H}_i\}_{i=1}^{N} = (\mathcal{S}^{-1} \circ f_{\theta} \circ \mathcal{S})\left(\{H_i\}_{i=1}^{N}\right),$$
  其中 $\mathcal{P}_i$ 收集其3D点落在体素 $\mathcal{V}_i$ 内的像素，$\mathcal{S}$ 通过空间填充（Hilbert）曲线将体素序列化为1D序列，$f_{\theta}$ 是一个Point Transformer v3。KNN插值将体素特征映射回像素，并通过零卷积（ControlNet风格）注入冻结的解码器，复用VGGT已学到的注意力和置信度。训练后端+尺度头仅需约80个H100 GPU小时（$\mathcal{L} = \mathcal{L}_{\mathrm{depth}} + \mathcal{L}_{\mathrm{pointmap}} + \mathcal{L}_{\mathrm{camera}}$，在监督前先进行ROE尺度对齐）。
- **无标定VO，无需优化后端**：由于点图预测始终以第一（参考）帧表示，仅相差一个中位数尺度，因此不需要Sim(3)/SL(4)对齐。选定的关键帧作为每个新的 $N_w = 8$ 帧窗口的记忆；关键帧由位姿距离选定
  $$D_{i,j} = \arccos\left(\frac{\operatorname{Tr}(R_j R_i^{T}) - 1}{2}\right) + \lambda \lVert \tau'_i - \tau'_j \rVert_2,$$
  最小间距为 $\eta_d = 0.15$。新窗口的尺度为 $s^w = \mathrm{ROE}(P_k^{(1)}, P_k^{(1),w})$，来自一个共享关键帧，预测结果通过置信度加权的点、尺度、平移的滑动平均以及球面线性插值（slerp）的四元数融合进地图，例如 $P_k \leftarrow (C_k P_k + C_k^w s^w P_k^w)/(C_k + C_k^w)$。活跃关键帧会被重新采样（最多10个→7个），并配有一个向后搜索窗口，可复用旧关键帧以隐式地闭合回环。
- **前馈式SfM**：分治策略——基于特征的图像聚类（在白化后的描述子上做FPS）、逐簇的粗略增量式注册，然后是对关键帧图做置信度优先的BFS细化。整个流程中不涉及任何光束法平差。

## 实验结果

在13个数据集上评测7项任务（所有距离单位为cm；ATE RMSE通过evo计算）：

- **TUM RGB上的VO**：平均ATE **3.2**（全部帧）/ 2.7（关键帧），而此前的无标定SOTA MUSt3R为7.1——在**ETH3D SLAM**上：**2.6**对MUSt3R的11.2。是首个在性能上超越基于优化方法的前馈式VO（TUM上DROID-VO为11.4，GlORIE-VO为9.3）。
- **TUM上的SLAM对比**（关键帧协议，基线方法允许回环检测+全局BA）：AMB3R的2.7超过无标定的VGGT-SLAM（5.3）和MASt3R-SLAM（6.0），甚至超过*带标定*的MASt3R-SLAM（3.0）——且没有任何轨迹后处理。
- **7-Scenes**：平均ATE 2.1，低于该数据集自身基于KinectFusion的伪真值（5.7），并通过新视角合成PSNR得到验证。
- **多视图深度（RMVDB）**：平均相对误差1.7 / $\delta_{1.03}$ 87.3——新的SOTA，领先于VGGT（2.4 / 81.3）和同期的 $\pi^3$（1.8 / 85.6），也优于给定位姿的MVSA（2.7 / 77.0）。
- **3D重建**：在ETH3D（4.64/9.98/9.69）、DTU（0.81/0.22/0.08——毫米级物体精度）和7-Scenes（4.74/1.74/2.84）上取得最佳的相对误差/精度/完整性。
- **ETH3D上的SfM**：平均RRA@5 **98.2** / RTA@5 81.9，对比MASt3R-SfM的81.2/79.7，且不涉及任何基于优化的BA。
- 另外：在RealEstate10K上相机位姿AUC@30为86.3（VGGT为85.3）；在NYUv2（相对误差3.0）和ETH3D（3.2）上取得零样本单目深度SOTA；在TUM Dynamic上取得有竞争力的动态场景VO效果（平均1.9），接近MegaSaM，尽管没有经过任何动态场景训练。代码、权重和评测工具包均已开源。

## 对SLAM的意义

点图这条技术路线正在逐步吞噬经典的SfM/SLAM技术栈，而AMB3R标志着一个门槛：一个无标定的前馈式系统，在TUM上超越了带标定的基于优化的SLAM。它的两个思想都各自具有独立的意义——从冻结特征中恢复度量尺度，在不依赖IMU或双目的情况下解决了单目尺度歧义问题；而紧凑的3D后端则以学术级的训练成本，恢复了点图回归所丢失的空间紧凑性先验。它剩余的局限性（没有显式的回环检测或重定位、注意力计算量随视角数量呈平方增长、依赖参考帧先验）恰恰勾勒出了基于优化的后端仍然有其价值的地方。

## 相关条目

- [DUSt3R](dust3r.md)
- [MASt3R](mast3r.md)
- [VGGT](vggt.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [VGGT-SLAM](vggt-slam.md) —— AMB3R认为并非必需的基于优化后端的替代方案
- [COLMAP](../level-03-monocular-slam/colmap.md)
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md)
