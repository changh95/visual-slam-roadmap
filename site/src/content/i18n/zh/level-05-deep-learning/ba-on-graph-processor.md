# BA on Graph Processor

> Ortiz 2020 · [论文](https://arxiv.org/abs/2003.03134)

**一句话总结** — 首次演示(CVPR 2020)了光束法平差可以在图处理器(Graphcore IPU)上通过高斯信念传播极快地求解,验证了FutureMapping所提出的算法-硬件协同设计愿景。

## 问题

光束法平差是SLAM和SfM计算中的核心瓶颈。经典求解器用Levenberg-Marquardt计算MAP解的点估计——这本质上是一种集中式的批量计算——而即便是像iSAM2这样基于树结构的增量式方法,也需要周期性地对图进行集中式的重构。与此同时,低功耗的具身空间人工智能(embodied Spatial AI)需要大规模并行、就地(in-place)计算,且数据传输量要最小。这篇论文表明,几乎从未被用于几何视觉的GBP(高斯信念传播)天然地映射到Graphcore的IPU上——1216个独立核心("tile"),每个拥有256KB本地内存和6个硬件线程,采用全互连拓扑,片内访存代价约为每字节1pJ,而GPU/CPU的DRAM访存则高达每字节数百pJ。

## 方法与架构

**将BA表示为因子图。** 变量是关键帧位姿 $X$ 和地图点 $L$;因子包括高斯先验 $\phi_i(\mathbf{x}_i)$、$\theta_j(\mathbf{l}_j)$(用于设定单目尺度并约束2自由度的重投影消息;自动生成,强度比测量项弱100倍)以及重投影因子 $\psi_{km}$,其测量模型为 $\mathbf{h}(\mathbf{x}_k,\mathbf{l}_m) = \pi(R_k\mathbf{l}_m + \mathbf{t}_k)$。MAP推断最小化先验项和重投影项的马氏距离平方和。在 $(\mathbf{x}_{k,0},\mathbf{l}_{m,0})$ 处线性化,并使用 $2\times 9$ 的雅可比矩阵 $\mathrm{J}$,可以得到信息形式下的每个测量因子:

$$\eta_{km} = \mathrm{J}^{\top}\Sigma_M^{-1}\left( \mathrm{J}\begin{bmatrix}\mathbf{x}_{k,0}\\ \mathbf{l}_{m,0}\end{bmatrix} + \mathbf{z}_{km} - \mathbf{h}(\mathbf{x}_{k,0},\mathbf{l}_{m,0}) \right), \qquad \Lambda_{km} = \mathrm{J}^{\top}\Sigma_M^{-1}\mathrm{J}.$$

**GBP消息传递。** 每个变量节点存储一个信念 $b_i^t(\mathbf{v}_i)=\mathcal{N}^{-1}(\mathbf{v}_i;\eta_{b_i}^t,\Lambda_{b_i}^t)$。一个具有分块参数的成对因子 $\psi_{ij}$ 向变量 $\mathbf{v}_i$ 发送:

$$\eta_{j\to i}^{t+1} = \eta_i^{ij} - \Lambda_{ij}^{ij}\left( \Lambda_{jj}^{ij} + \Lambda_{b_j}^{t} - \Lambda_{i\to j}^{t} \right)^{-1} \left( \eta_j^{ij} + \eta_{b_j}^{t} - \eta_{i\to j}^{t} \right),$$

$$\Lambda_{j\to i}^{t+1} = \Lambda_{ii}^{ij} - \Lambda_{ij}^{ij}\left( \Lambda_{jj}^{ij} + \Lambda_{b_j}^{t} - \Lambda_{i\to j}^{t} \right)^{-1} \Lambda_{ji}^{ij},$$

每个变量通过累加其先验和接收到的消息来更新信念:$\eta_{b_i}^{t+1} = \eta_{p_i} + \sum_j \eta_{j\to i}^{t}$,$\Lambda$ 同理。来自因子的消息会被阻尼处理,$\eta^{t+1} \leftarrow (1-d)\,\eta^{t+1} + d\,\eta^{t}$,其中 $d=0.4$。重新线性化完全是局部的:当某个因子所涉及变量的信念偏离线性化点超过 $\beta = 0.01$ 时(最多每10次迭代一次),该因子才重新线性化。鲁棒代价:当马氏距离 $M_{km}$ 超过 $N_\sigma$ 时,通过对该因子的高斯分布重新加权来引入Huber核,从而降低疑似外点测量所发出消息的权重。

**IPU映射。** 每个因子/变量节点映射到一个tile上(对于更大的图,通过6个线程可以在一个tile上映射多个节点),在IPU的批量同步并行模型下运行:所有因子重新线性化并计算消息、交换数据,所有变量更新信念、交换数据——一次完整的GBP迭代耗时不到125微秒。整个实现约1000行Poplar C++代码;由于IPU只处理半精度/单精度浮点数而非双精度,先验最初以测量约束的尺度设定,并在10次迭代内逐步减弱100倍以保证数值稳定性。

## 实验结果

评估使用了TUM和KITTI序列的片段,以ORB-SLAM作为前端(关键帧、ORB特征、对应关系),与运行在6核i7-8700K(18线程,采用密集Schur补的LM算法、Huber核、解析导数)上的Ceres进行对比:

- **速度**:收敛到平均重投影误差(ARE)低于1.5所需的时间——在10个序列上,单块IPU上的GBP平均比Ceres**快24倍**;标志性的一个实例包含125个关键帧和1919个点,GBP求解耗时不到40毫秒,而Ceres需要1450毫秒。GBP通常需要50–300次迭代,而LM只需10–40步,但由于每次就地迭代速度极快,GBP整体仍然更快(IPU功耗120W)。
- **增量式SLAM**:在一个90关键帧的序列上逐个添加关键帧,新变量能够快速与已有估计保持一致;GBP平均比Ceres**快36倍**收敛,通常在不到10次迭代内完成。
- **鲁棒性**:在两条TUM序列上进行100次带噪声扰动的关键帧初始化试验,GBP的收敛半径与Ceres相当。
- **Huber损失**:在人为注入错误数据关联的情况下(fr1desk,20个关键帧),带Huber核的GBP能够逐步隔离出真正的外点(始终保持召回率为1)并收敛,而不带Huber的GBP在错误关联比例超过3%时便失效——而使用相同Huber损失的Ceres却无法使解收敛,这表明GBP的局部外点处理优于LM的全局处理方式。

## 对SLAM的意义

这篇论文将FutureMapping系列思辨性文章中的设想变成了具体证据,证明围绕图结构、局部存储和消息传递重新构思SLAM计算能够带来数量级的加速。作者认为,真正的价值并不在于静态BA的速度,而在于"对表示空间人工智能问题的通用、动态变化的因子图进行灵活的就地优化"——异质因子、来自识别的先验、任意的增量更新。随着SLAM转向异构边缘硬件和多机器人系统,GBP的纯局部计算模型是少数能够随核心数量自然扩展的后端设计之一。

## 相关条目

- [FutureMapping 1](futuremapping-1.md) — 预言了这一结果的愿景论文
- [FutureMapping 2](futuremapping-2.md) — 本实现所遵循的GBP教程
- [DANCeRS](dancers.md) — 分布式多机器人GBP
- [因子图](../level-02-getting-familiar/factor-graph.md) — 底层表示方式
- [增量式平滑](../level-02-getting-familiar/incremental-smoothing.md) — 集中式增量方案的替代(iSAM2)
- [光束法平差](../level-02-getting-familiar/bundle-adjustment.md) — 所求解的问题
