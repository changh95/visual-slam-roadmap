# VGGT-SLAM 2.0

> Maggio 2026 · [论文](https://arxiv.org/abs/2601.19887)

**一句话总结** —— VGGT-SLAM 的后续版本:一个关键帧级别的因子图,消除了 15 自由度漂移和平面退化问题,提供了从 VGGT 注意力层中免训练读出的回环闭合验证,并能在 Jetson Thor 上实时运行。

## 问题

VGGT-SLAM 通过在 SL(4) 上优化 15 自由度单应矩阵解决了无标定子地图对齐问题,但该方案自身也带来了代价:高维对齐会在两次回环闭合之间引入快速漂移,可能严重扭曲场景;而在平面场景中(相机面对墙壁或地面)求解完整单应矩阵是退化的,会导致发散。其因子图也只估计每个子地图的单应矩阵,因此来自 VGGT 的关键帧级旋转/平移误差处理并不理想,而用于回环检测的图像检索则完全信任外部网络(SALAD),没有任何验证机制。VGGT-SLAM 2.0 重新设计了后端以消除这些失效模式,同时依然尊重 VGGT 在未知内参下固有的重建歧义——并让整个系统能够在机器人上在线运行。

## 方法与架构

- **设置**:每个子地图来自 VGGT 对 $n$ 个关键帧的一次前向推理,给出内参 $\mathcal{K}$、位姿 $\mathcal{T}$、深度 $\mathcal{D}$ 和置信度 $\mathcal{C}$;点通过 $\mathbf{K}_i^{-1}$ 和 $\mathbf{D}_i$ 按每个相机帧反投影为 $\mathbf{X}_i$。连续的子地图共享一个*重叠帧*。一般化的对齐对象是完整的 $4\times 4$ 单应矩阵
  $$\mathbf{H}_i = \begin{bmatrix} \mathbf{K}\mathbf{R} & \mathbf{t} \\ \mathbf{v}^{T} & s \end{bmatrix},$$
  共 15 个自由度:3 个平移 $\mathbf{t}$、3 个旋转 $\mathbf{R}$、1 个尺度 $s$、5 个仿射(标定 $\mathbf{K}$)、3 个投影($\mathbf{v}$)。
- **新的因子图——关键帧作为节点**:每个关键帧是一个 $\mathrm{SL}(4)$ 节点。*子地图内*边连接同一子地图内的关键帧,仅携带 $\mathrm{SE}(3)$ 分量,直接取自 VGGT 的位姿:$\mathbf{H}^i_j = \mathbf{T}_i^{-1}\mathbf{T}_j$——投影畸变在子地图内是一致的,这些边使优化能够修正 VGGT 自身的位姿漂移。*子地图间*边连接同一重叠帧的两个估计值,仅携带标定和尺度信息:
  $$\mathbf{H}^i_j = \begin{bmatrix} \mathbf{K}_i^{-1}\mathbf{K}_j & 0 \\ \mathbf{0}^{T} & s \end{bmatrix},$$
  强制要求两个子地图对同一物理相机的估计在位姿和标定上保持一致(即使 VGGT 对标定的猜测有误,它也必须*一致*)。这种限制到 SL(4) 子群的做法消除了 15 自由度漂移和平面退化问题。尺度 $s$ 是在将两个点云变形到相同标定之后,对应三维点距离比值的中位数——这是唯一使用原始 VGGT 点的地方。
- **免费获得的、来自 VGGT 注意力的回环闭合验证**:VGGT 第 22 层在两幅图像的对应区域之间表现出一种"聚光灯"式的注意力模式(第 21/23 层没有,即使在无纹理墙面上也存在)。匹配得分计算为
  $$\gamma_t = \max_{q \in Q^{(2)}} \left( \frac{\operatorname{Softmax}\left(Q^{(2)} {K^{(1)}}^{\top}\right)}{\max_{q \in Q^{(1)}} \operatorname{Softmax}\left(Q^{(1)} {K^{(1)}}^{\top}\right)} \right), \qquad \alpha_{match} = \operatorname{Mean}_{\text{top }25\%}\left(\{\gamma_t\}\right),$$
  其中 $Q$、$K$ 分别是检索图像和查询图像的(按头平均后的)查询/键令牌。只有当 $\alpha_{match}$ 通过阈值检验时,SALAD 候选项才会被接受,这使得可以*放宽* SALAD 的阈值(0.80 → 0.95),从而获取更多回环闭合,同时拒绝误报。回环闭合被当作双帧微型子地图传给 VGGT,并通过一条子地图间边连接。
- **全局优化与地图恢复**:该图使用 GTSAM 在 SL(4) 流形上进行优化(SL(4) 求解器已上游合并进 GTSAM)。投影矩阵通过 $\mathbf{P}_i = \mathbf{K}_i^{3\times 4} (\mathbf{H}^w_i)^{-1}$ 恢复,并分解为全局位姿;全局点则通过施加 $\mathbf{H}^w_i$ 得到。

## 实验结果

所有实验中保持不变的参数(最小视差 50 像素,置信度阈值 25%,SALAD 0.95,$\alpha_{match}$ 0.85)。

- **TUM RGB-D(无标定,子地图大小为 32)**:最佳平均 ATE RMSE 为 **0.041 m**——比 VGGT-SLAM SL(4)(0.053 m)低约 23%,比 ViSTA-SLAM(0.052 m)低约 22%;MASt3R-SLAM* 为 0.060 m。在平面场景 `floor` 上:0.102 m,而 VGGT-SLAM 为 0.141 m。
- **回环闭合验证**:在 Clio 数据集上,验证机制将被接受的回环闭合数从 2 提升到 5(Cubicle),从 0 提升到 9(Apartment),并将一个原本会发散的 Office 序列(因外观相似的办公桌隔间导致误报)转变为 4 个正确的闭合,且零误报。在 LaMAR HGE 上,Recall@1 对 SALAD 从 88.45 提升到 90.13,对 NetVLAD 从 85.92 提升到 89.08。
- **运行时间**:在 RTX 3090 上使用 16 帧子地图,约为 8.4 FPS(使用开放集 CLIP 嵌入时为 6.3 FPS);每个子地图的耗时主要由 VGGT 推理决定(1248 ms)。在同一机器上,MASt3R-SLAM 运行速度为 7.2 FPS,VGGT-SLAM 为 6.9 FPS。在配备 RealSense D455 的 Jackal 地面机器人上,完全在 Jetson Thor 上在线运行:使用 4 帧子地图时为 3.5 FPS。
- **开放集物体检测**:每个关键帧的 Perception Encoder CLIP 嵌入加上 SAM 3 分割,可在约 0.36 秒每次查询(RTX 3090)的时间内,根据文本查询给出三维有向边界框。
- **规模**:重建了一个 4,200 平方英尺的谷仓(34 个子地图)以及一段 VGGT-SLAM 会发散的 KITTI 驾驶序列(44 个子地图)——两者都比原论文中最大的场景(22 个子地图)更大。

## 对SLAM的意义

第一波基础模型 SLAM 系统(MASt3R-SLAM、VGGT-SLAM)证明了这一概念的可行性,但只能离线运行或运行速度低于传感器帧率。VGGT-SLAM 2.0 弥合了剩下的差距——能够在嵌入式机器人硬件上在线运行的稠密前馈重建——而这才是机器人和增强现实的实际需求。其对注意力层的分析也是一个值得关注的模式:从一个冻结的基础模型中提取回环闭合验证、且无需任何训练,这暗示了这些模型本身已经蕴含了多少潜在的 SLAM 机制。由于没有任何训练环节,更快或更好的 VGGT 变体可以直接替换进来。

## 相关条目

- [VGGT-SLAM](vggt-slam.md) —— 本版本所取代的原始系统
- [VGGT](vggt.md) —— 底层的前馈几何模型
- [MASt3R-SLAM](mast3r-slam.md) —— 同时代的基础模型 SLAM
- [DROID-SLAM](droid-slam.md) —— 该谱系中更早期的学习型 SLAM 基线
- [视觉地点识别(VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) —— VGGT 注意力免费验证的检索问题
- [Clio](clio.md) —— 用于回环闭合评估的任务驱动场景图数据集
