# SuMa

> Behley (Bonn) 2018 · [论文](http://www.roboticsproceedings.org/rss14/p16.pdf)

**一句话总结** — SuMa（基于面元的建图，Surfel-based Mapping）通过将环境维护为面元地图，并在渲染出的距离图视图上用投影式帧到模型 ICP 跟踪每一帧新扫描，实现了实时激光雷达 SLAM，证明了带在线回环检测的稠密地图激光雷达 SLAM 能在城市尺度上运行，而无需手工设计的特征提取。

## 问题

基于激光的建图系统大多在配准前先对三维点云做降维——特征法（LOAM）、下采样点云、体素网格或 NDT 地图——而源自 RGB-D SLAM 的稠密帧到模型方法（KinectFusion、ElasticFusion）则使用全部可用信息。将稠密方法引入旋转式室外激光雷达，意味着要应对（1）快速传感器运动导致扫描间大幅位移、（2）相对稀疏的点云，以及（3）大规模环境——所有这些都要求实时完成，并将回环检测在线集成，而非作为离线的后处理步骤。

## 方法与架构

该流水线每帧执行七个步骤：预处理、模型渲染、帧到模型 ICP、地图更新、回环检测、回环验证，以及（在单独线程中的）位姿图优化。

- **预处理为顶点图/法向图**：每个点云 $\mathcal{P}$ 通过 $\Pi:\mathbb{R}^3 \mapsto \mathbb{R}^2$ 投影为顶点图 $\mathcal{V}_D$（针对 KITTI 的 HDL-64E 为 900×64），使用球坐标：

  $$u = \tfrac{1}{2}\left(1 - \arctan(y, x)\,\pi^{-1}\right) w, \qquad v = \left(1 - \left(\arcsin(z\, r^{-1}) + f_{\mathrm{up}}\right) f^{-1}\right) h,$$

  其中 $r = \lVert \mathbf{p} \rVert_2$，$f = f_{\mathrm{up}} + f_{\mathrm{down}}$ 为垂直视场角。法向图 $\mathcal{N}_D$ 通过对相邻顶点的前向差分求叉积计算得到。
- **投影式帧到模型 ICP**：将活跃的面元地图在上一位姿处渲染为模型图 $\mathcal{V}_M, \mathcal{N}_M$；对应关系通过像素查找而非最近邻搜索得到。点到平面误差

  $$E(\mathcal{V}_D, \mathcal{V}_M, \mathcal{N}_M) = \sum_{\mathbf{u} \in \mathcal{V}_D} \left( \mathbf{n}_u^{\top}\left( \mathbf{T}^{(k)}_{C_{t-1}C_t}\, \mathbf{u} - \mathbf{v}_u \right) \right)^2$$

  用高斯-牛顿法结合 $\mathfrak{se}(3)$ 增量 $\delta = (\mathbf{J}^{\top}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^{\top}\mathbf{W}\mathbf{r}$、Huber 加权和异常值剔除（距离 > 2 m 或法向角 > 30°）来最小化。
- **带稳定性过滤的面元地图**：每个面元携带位置 $\mathbf{v}_s$、法向 $\mathbf{n}_s$、半径 $r_s$、创建/更新时间戳，以及一个由二元贝叶斯滤波器维护的稳定性对数几率：

  $$l_s^{(t)} = l_s^{(t-1)} + \mathrm{odds}\left(p_{\text{stable}} \cdot e^{-\alpha^2/\sigma_\alpha^2}\, e^{-d^2/\sigma_d^2}\right) - \mathrm{odds}(p_{\text{prior}}),$$

  其中 $\alpha$ 是测量与面元之间的角度，$d$ 是它们之间的距离。只有稳定的面元才会被渲染；兼容的测量以指数滑动平均（$\gamma = 0.9$）方式精化面元；不稳定的旧面元（动态物体、杂点）则被移除。
- **通过位姿实现地图形变**：面元坐标存在于其创建时的位姿坐标系中，因此位姿图优化后，只需更新位姿即可修正地图——不需要重新整合过去的扫描。
- **基于地图的回环检测**：地图被划分为活跃部分（$t_u \geq t - \Delta_{\text{active}}$，其中 $\Delta_{\text{active}} = 100$）和非活跃部分；里程计只使用活跃部分，回环搜索只使用非活跃部分。会尝试 50 m 范围内最近的非活跃位姿，用多种 ICP 初始化，仅当针对*由地图与扫描组合而成的虚拟视图*的残差满足 $E_{\text{map}} < \kappa_{\text{residual}} \cdot E_{\text{odom}}$（$\kappa_{\text{residual}} = 1.15$）时才接受候选回环，随后再经过 5 次后续扫描的验证，约束才会进入 gtsam 位姿图。

## 实验结果

- KITTI 里程计训练集（相对旋转误差 deg/100 m / 相对平移误差 %）：帧到帧 ICP 为 0.9/2.9；帧到模型为 0.3/0.7；带回环检测的帧到模型为 0.3/0.8——对比 LOAM 的 −/0.8、Stereo LSD-SLAM 的 0.3/0.9、SOFT-SLAM 的 0.2/0.7。回环检测对 KITTI 相对指标几乎没有影响，但能明显改善全局轨迹一致性。
- KITTI 测试集：旋转误差 0.0032 deg/m，平移误差 1.4%（LOAM：0.0017 deg/m，0.7%）。
- 在 i7-6700 + GTX 960（4 GB）上的运行速度：里程计加地图更新平均耗时 31 ms（最大 71 ms）；加上回环检测和验证最多 189 ms；整体每帧 48 ms——约 20 Hz，是传感器帧率的两倍。
- 报告的失效模式：结构化物体稀少的高速公路，以及持续移动的车流（例如交通拥堵）被错误地整合为面元——这正是 SuMa++ 后来用语义手段解决的缺口。

## 对SLAM的意义

SuMa 将最初为短距离 RGB-D 传感器（ElasticFusion）设计的基于面元的稠密建图思想带入了室外旋转式激光雷达，处理了远大得多的距离范围和不均匀的点密度。它将 GPU 渲染的距离图加投影式 ICP确立为一种标准的激光雷达跟踪机制，为基于特征的流水线（如 LOAM）提供了一种稠密地图的替代方案，其基于地图的回环检测判据展示了如何在低扫描重叠度下验证回环。其距离图流水线直接催生了语义扩展版本 SuMa++，也推动了后续对激光雷达距离图的学习式处理。

## 相关条目

- [SuMa++](sumapp.md)
- [LOAM](loam.md)
- [Range image](range-image.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
