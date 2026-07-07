# MRS-Map

> Stückler 2014 · [论文](https://doi.org/10.1016/j.jvcir.2013.02.008)

**一句话总结** — 一种基于八叉树的多分辨率面元地图,用于RGB-D SLAM,每个面元存储联合的形状与颜色统计量,从而支持具有噪声感知能力的概率配准、基于关键视图的位姿图SLAM,以及在CPU上的实时物体跟踪。

## 问题

以单一固定分辨率进行稠密RGB-D建图存在一个不可避免的权衡：精细分辨率能捕获细节但浪费内存,粗糙分辨率则会丢失细节。RGB-D传感器的噪声也随深度呈二次方增长,因此以同一分辨率处理所有测量在统计上是错误的。像KinectFusion这类依赖GPU的系统还进一步排除了轻量级或低成本的机器人平台。当时所需要的是一种紧凑的表示方式,能够根据测量质量自适应地调整细节层次,并支持对图像、地图和多视角物体模型进行快速、鲁棒的配准——而且完全在CPU上运行。

## 方法与架构

- **八叉树中的多分辨率面元**：每一个八叉树节点（无论内部节点还是叶子节点,跨所有体素尺寸）都存储一个*面元（surfel）*——其体积内点集 $\mathcal{P}$ 的法向近似。统计量以充分统计量 $\mathcal{S}(\mathcal{P}) := \sum_{p\in\mathcal{P}} p$ 和 $\mathcal{S}^2(\mathcal{P}) := \sum_{p\in\mathcal{P}} p p^T$ 的形式维护,并通过以下数值稳定的单遍更新在点集 $\mathcal{P}^A, \mathcal{P}^B$ 之间合并

$$\mathcal{S}^2(\mathcal{P}^{A\cup B}) \leftarrow \mathcal{S}^2(\mathcal{P}^A) + \mathcal{S}^2(\mathcal{P}^B) + \frac{\delta\delta^T}{N_A N_B (N_A + N_B)}, \qquad \delta := N_B\,\mathcal{S}(\mathcal{P}^A) - N_A\,\mathcal{S}(\mathcal{P}^B),$$

  据此可推出均值 $\mu = \frac{1}{\lvert\mathcal{P}\rvert}\mathcal{S}$ 和协方差 $\Sigma = \frac{1}{\lvert\mathcal{P}\rvert-1}\mathcal{S}^2 - \mu\mu^T$。该分布是6维的——位置与颜色（在一个把亮度和色度分离开的L$\alpha\beta$色彩空间中）联合表示。最多六个正交视图方向能够把同一个体素内不同的表面区分开来；面元至少需要10个点才能建立。
- **噪声自适应聚合**：每个像素处所用的最大八叉树分辨率会根据到传感器的*平方*距离进行调整（与传感器噪声规律相匹配），落入同一节点的连续图像区域会先被聚合——一张640×480的图像只需插入几千个节点,而不是307,200个点插入操作。位于图像边界或遮挡边界处（虚拟边界）的节点会被排除,因为它们只部分地观测到了表面。
- **形状-纹理描述子**：每个面元与其最多26个同分辨率邻居之间基于FPFH的三区间角度直方图,加上亮度/色度对比直方图,通过对描述子距离 $d_f(s_i,s_j) \le \tau$（$\tau=0.1$）设阈值来筛选对应关系。
- **概率配准**：要在位姿 $x$ 下将源地图 $m_s$（例如当前图像）配准到目标地图 $m_m$，面元会在所有分辨率上同时被关联——由于每个节点通过立方体查询选取最精细的公共分辨率,这实际上隐式地实现了从粗到细——每个关联的观测似然是两个正态分布之差：

$$p(s_{s,i} \mid x, s_{m,j}) = \mathcal{N}\big(d_{i,j}(x);\, 0,\, \Sigma_{i,j}(x)\big), \quad d_{i,j}(x) := \mu_{m,j} - T(x)\,\mu_{s,i}, \quad \Sigma_{i,j}(x) := \Sigma_{m,j} + R(x)\,\Sigma_{s,i}\,R(x)^T,$$

  因此从数据中学到的协方差会自动为可靠的几何结构加权——不需要提取关键点。对数似然 $L(x) = \sum_{a\in\mathcal{A}} \log\lvert\Sigma_a(x)\rvert + d_a^T(x)\,\Sigma_a^{-1}(x)\,d_a(x)$ 先通过快速近似Levenberg-Marquardt优化（通常10-20次迭代），再配合约5次牛顿迭代（对模型面元做三线性插值）进行优化；评估在CPU多核上并行化进行。位姿协方差的闭式估计能够捕获不可观测维度上的不确定性（例如观察一个平面时）。
- **带随机化回环检测的关键视图SLAM**：图像针对一个参考关键视图进行跟踪；在有足够运动之后会生成新的关键视图,并添加一条空间约束边。每一帧都会额外测试恰好一个约束,方法是按照 $p_{\mathrm{chk}}(v_{\mathrm{cmp}}) = \mathcal{N}(d;0,\sigma_d^2)\cdot\mathcal{N}(\lvert\alpha\rvert;0,\sigma_\alpha^2)$ 在位姿距离上采样一个比较用的关键视图,再通过双向面元匹配似然来验证匹配。关键视图图 $p(\mathcal{V}\mid\mathcal{E}) \propto \prod_{e_{ij}} p(x_i^j \mid x_i, x_j)$ 每帧用g2o（稀疏Cholesky）优化一次。经过优化的关键视图最终会被融合成一张多视角面元地图,该地图还可以作为物体模型,用于实时的6自由度位姿跟踪。

## 实验结果

所有计时均在一台笔记本Intel Core i7-3610QM（2.3 GHz四核）上完成,分辨率为完整的640×480,最大地图分辨率为0.0125米。**增量配准**（TUM RGB-D基准数据集,相对位姿误差的平移中位数）：在fr1/desk上为4.4毫米,相比warp的5.8毫米、GICP的10.2毫米、3D-NDT的7.9毫米、fovis的6.3毫米；在大多数fr1序列上表现最佳（例如fr1/plant为3.5毫米,fr1/xyz为2.6毫米,fr2/xyz为1.4毫米）。在fr1/desk上平均运行时间为75.15毫秒,相比warp的108.64毫秒、GICP的4015.4毫秒、3D-NDT的414.87毫秒——约15 Hz,并且在跳帧情况下仍保留了类似ICP的鲁棒性,而warp在这种情况下会发散。**SLAM**：在处理所有帧的情况下,在十一个序列中的八个上,RMSE相对位姿误差优于RGB-D SLAM,例如freiburg1_room为0.111米相比0.219米,freiburg2_desk为0.100米相比0.143米,freiburg1_teddy为0.066米相比0.138米；在freiburg1_floor（纹理稀少的地面）和freiburg2_large_loop（距离远、深度不确定）上失败。一次图优化迭代最多耗时几毫秒（freiburg2_desk：在最多64个关键视图、138条边的情况下中位数为0.79毫秒）。**物体建模/跟踪**：360度模型构建的中位ATE约为1-2厘米；对已学习模型的跟踪,中位ATE为16-30毫米,每帧耗时32-50毫秒；在RoboCup@Home 2011/2012（两次均获胜）上,在机器人Cosero上进行了实时演示。

## 对SLAM的意义

MRS-Map表明,统计性的面元表示——而不是稠密的体素网格——能够以适度的内存和无需GPU的条件支持精确的RGB-D跟踪,使得在真实机器人硬件上实现类稠密SLAM和物体跟踪成为可能。它对不确定性有感知的面元配准方法（可视为NDT在RGB-D领域的一个后代）以及多分辨率八叉树设计,影响了后续基于面元的系统,例如ElasticFusion,以及基于面元的LiDAR建图,并在2010年代中期成为稠密RGB-D SLAM系统（DVO-SLAM、ElasticFusion）的标准比较基线。

## 相关条目

- [ElasticFusion](elasticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [KinectFusion](kinectfusion.md)
- [DVO](dvo.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [SuMa](../level-09-lidar-visual-lidar-slam/suma.md)
