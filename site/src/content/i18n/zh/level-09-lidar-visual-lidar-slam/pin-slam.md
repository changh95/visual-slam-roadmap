# PIN-SLAM

> Pan (Bonn) 2024 · [论文](https://arxiv.org/abs/2401.09101)

**一句话总结** — PIN-SLAM 用一组稀疏的、可优化的神经点取代了显式点云地图，这些神经点编码了局部隐式 SDF，实现了无需对应关系的配准——更关键的是，当回环检测修正轨迹时，地图能随之弹性形变。

## 问题

经典的激光雷达地图——点云、体素网格、面元（surfel）、TSDF 体——都是刚性的：当回环检测修正了累积漂移后，已经建好的地图无法平滑地重新调整以匹配修正后的轨迹，因此系统只能选择重建地图、使用子地图，或者忍受重复结构。神经隐式地图紧凑且连续，但早期的神经 SLAM 系统面向房间尺度的 RGB-D 输入，对于室外激光雷达的帧率来说太慢了（Nerf-LOAM：每帧超过 4 秒）。PIN-SLAM 将隐式神经建图带入激光雷达尺度，同时使全局一致性成为地图本身的一等属性。

## 方法与架构

每帧处理流程：（1）对扫描进行去畸变并体素下采样，得到配准点云 $\mathcal{P}_r$ 和建图点云 $\mathcal{P}_m$；（2）将 $\mathcal{P}_r$ 配准到局部地图的 SDF；（3）通过增量学习更新地图；（4）用神经点描述子检测回环；（5）优化位姿图并形变地图。

- **基于点的隐式神经（PIN）地图**：$\mathcal{M} = \{\mathbf{m}_i = (\mathbf{x}_i, \mathbf{q}_i, \mathbf{f}_i^{g}, t_i^{c}, t_i^{u}, \mu_i)\}$ ——位置、方向四元数、可优化的潜在特征、创建/更新时间步、稳定性。在查询点 $\mathbf{p}$ 处的 SDF 由一个浅层的共享 MLP 根据每个邻居的特征和*相对*坐标解码得到，

  $$s_j = D_{\theta}^{g}\left(\mathbf{f}_j^{g}, \mathbf{d}_j\right), \qquad \mathbf{d}_j = \mathbf{q}_j\left(\mathbf{p} - \mathbf{x}_j\right)\mathbf{q}_j^{-1},$$

  再在最近的 $K$ 个神经点上用逆平方距离权重 $w_j = \lVert \mathbf{p} - \mathbf{x}_j \rVert^{-2}$ 进行插值：$S(\mathbf{p}) = \sum_j \frac{w_j}{\sum_k w_k} s_j$。因为 $\mathbf{d}_j$ 是在各点自身坐标系中表示的，该预测对点集的刚体变换是不变的——这正是地图弹性的来源。体素哈希（每个体素一个活跃神经点）实现了常数时间的邻域搜索。
- **增量地图训练**：沿每条射线（表面附近和自由空间）以投影 SDF 目标采样，并保留在一个滑动训练池 $\mathcal{D}_p$ 中以对抗灾难性遗忘。损失函数为 $\mathcal{L} = \mathcal{L}_{\text{bce}} + \lambda_e \mathcal{L}_{\text{eik}}$：对 sigmoid 映射后的 SDF 值（一种软截断）计算二元交叉熵损失，加上 Eikonal 正则项

  $$\mathcal{L}_{\text{eik}} = \frac{1}{N}\sum_{i=1}^{N} \left( \lVert \nabla S(\mathbf{u}_W^{i}) \rVert_2 - 1 \right)^2.$$

  解码器在最初几帧后被冻结；此后只有神经点特征继续训练。
- **无对应关系的里程计**：通过将所有点驱动到零水平集来对齐扫描，

  $$\mathbf{T}^{*} = \underset{\mathbf{T}}{\operatorname{argmin}} \sum_{\mathbf{p} \in \mathcal{P}_r} S\left(\mathbf{T}\mathbf{p}\right)^2,$$

  用 Levenberg–Marquardt 求解，其解析雅可比为 $\mathbf{J}_i = [\,\mathbf{g}_i^{\top},\ (\mathbf{p}_i' \times \mathbf{g}_i)^{\top}\,]$，其中 $\mathbf{g}_i = \nabla S(\mathbf{p}_i')$——不需要最近邻数据关联；场本身提供了方向和大小。Geman–McClure 稳健核根据 SDF 残差和梯度异常 $\varepsilon_i = |\lVert \nabla S(\mathbf{p}_i') \rVert_2 - 1|$ 对点降权，Hessian 的特征值检验用于检测退化情形。每 $F_{\text{ba}}$ 帧执行一次隐式局部光束法平差，联合优化近期的位姿和局部特征。
- **动态滤除**：被预测为落在*稳定自由空间*中的测量点——满足 $S(\mathbf{p}_W) > \gamma_d$ 且稳定性 $H(\mathbf{p}_W) > \gamma_\mu$——会被排除在建图之外。
- **回环检测与地图弹性修正**：用一种极坐标上下文描述子检测全局回环，该描述子对局部地图的*神经点特征*进行分箱（类似 Scan-Context 的方式，$\mathbf{U}_t \in \mathbb{R}^{H_r \times H_s \times F_g}$）——几何编码和场景识别共享同一个学习表示。位姿图优化之后，每个神经点随其关联的帧一起移动：

  $$\mathbf{x}_i \leftarrow \delta\mathbf{T}_{t_i^{m}}\, \mathbf{x}_i, \qquad \mathbf{q}_i \leftarrow \delta\mathbf{q}_{t_i^{m}}\, \mathbf{q}_i,$$

  因此地图能随修正后的轨迹一致地形变，而不会出现撕裂或重影。

## 实验结果

- **KITTI 里程计**：平均相对平移误差为 0.51%（10 个随机种子的标准差为 0.02%）——与 KISS-ICP 和 CT-ICP 相当，优于所有对比的基于学习的方法，且无需预训练。
- **KITTI SLAM**：在有回环的序列上平均 ATE RMSE 为 1.0 m（仅用 PIN 里程计：3.2 m），在全部 11 个序列上为 1.2 m——优于 SC-LeGO-LOAM 和 SC-F-LOAM，甚至优于离线的 HLBA 后处理基线，同时该系统是在线运行的。
- **其他领域**：在 MulRan、IPB-Car、Newer College 和 Hilti-21 上取得最佳整体精度；在 Newer College 的楼梯序列上达到 6 cm RMSE，而半数对比方法在该序列上失效。其 RGB-D 扩展版本在 Replica 上也具有竞争力。
- **地图紧凑性**：KITTI 00 的地图仅占用 102.1 MB——约为原始点云（13.6 GB）的 0.7%——相比之下 SuMa 的面元地图为 887.7 MB，基于网格的 SHINE 地图为 160.6 MB；回环修正甚至通过消除重复的神经点使地图*缩小*约 20%。
- **运行速度**：轻量版本在单张 NVIDIA A4000 GPU 上以约 11 Hz（传感器帧率）运行，每帧耗时恒定；Nerf-LOAM 是唯一的其他隐式神经激光雷达里程计方法，速度约慢 30 倍。代码：`PRBonn/PIN_SLAM`。

## 对SLAM的意义

神经隐式 SLAM（iMAP、NICE-SLAM）起初是一种缓慢的、房间尺度的 RGB-D 玩法；PIN-SLAM 证明了隐式地图能够扩展到具有全局一致性的室外激光雷达 SLAM——它是第一个让神经地图本身具备回环检测感知能力（通过弹性形变）的系统。它标志着学习式地图表示正式进入了曾由 FAST-LIO2 和 LOAM 等经典结构主导的激光雷达领域，也预示着未来的地图将同时具备紧凑性、可稠密重建性和全局一致性。

## 动手实践

- [运行 PIN-SLAM](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/pin_slam)

## 相关条目

- [FAST-LIO2](fast-lio2.md) — 与其竞争的经典直接配准基线
- [SuMa](suma.md) — 更早的稠密（面元）激光雷达地图表示
- [iMAP](../level-05-deep-learning/imap.md) — 神经隐式 SLAM 的起源
- [NICE-SLAM](../level-05-deep-learning/nice-slam.md) — 分层神经隐式 RGB-D SLAM 前身
- [Point-SLAM](../level-05-deep-learning/point-slam.md) — 面向 RGB-D SLAM 的神经点表示
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — 弹性地图所吸收的全局调整
