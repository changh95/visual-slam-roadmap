# Kimera-Multi

> Tian 2022 · [论文](https://arxiv.org/abs/2106.14386)

**一句话总结** —— Kimera-Multi是首个同时具备以下特性的多机器人系统：对回环外点具有鲁棒性、仅通过点对点通信实现完全去中心化、并能够实时构建全局一致的度量-语义三维网格。

## 问题

早期的协作SLAM系统或依赖中心服务器，或只能生成没有语义内容的纯几何地图，而且它们都容易受到感知混淆的影响：视觉上相似的地点会产生错误的跨机器人和机器人内部回环，从而破坏联合估计。现有的鲁棒技术或过度依赖初始化，或使用启发式搜索（如PCM的最大团方法），召回率较低。Kimera-Multi探讨的问题是：一支机器人团队，仅在链路可用时与邻居通信，能否在识别并剔除虚假回环的同时，实时构建全局一致的*语义*三维网格。

## 方法与架构

**单机器人前端。** 每个机器人运行Kimera：Kimera-VIO用于视觉-惯性里程计，并生成一个面片带有语义标签的局部三维网格。当机器人进入通信范围时，分布式位置识别会交换词袋向量；匹配成功后触发几何验证，验证过程会传输关键点和特征描述子以计算候选的跨机器人回环。

**第一阶段——鲁棒初始化。** 机器人$\alpha$的位姿$i$（坐标系$A$）与机器人$\beta$的位姿$j$（坐标系$B$）之间的一次回环会产生一个候选坐标系对齐

$$\widehat{X}^{A}_{B_{ij}} \triangleq \widehat{X}^{A}_{\alpha_i}\, \widetilde{X}^{\alpha_i}_{\beta_j}\, \big(\widehat{X}^{B}_{\beta_j}\big)^{-1},$$

其中$\widehat{X}$是里程计位姿估计，$\widetilde{X}^{\alpha_i}_{\beta_j}$是测得的回环。内点对齐相互一致，因此相对坐标系变换通过鲁棒位姿平均求得，$\widehat{X}^{A}_{B} \in \arg\min_{X \in \mathrm{SE}(3)} \sum_{(i,j) \in L_{\alpha,\beta}} \rho(r_{ij}(X))$，其中$\rho$是截断最小二乘（TLS）代价函数，在本地通过GNC（GTSAM）求解。机器人层级依赖图的生成树将某一机器人的坐标系传播给整个团队。

**第二阶段——分布式渐进非凸性（D-GNC）。** 所有轨迹通过对里程计（二次代价）和回环（TLS代价）的鲁棒PGO进行细化，残差以弦距离衡量。GNC利用Black–Rangarajan对偶性将鲁棒估计重写为

$$\min_{x\in\mathcal{X},\, w_i\in[0,1]}\; \sum_i \big[\, w_i\, r_i^2(x) + \Phi_{\rho_\mu}(w_i) \,\big],$$

其中$w_i$是每个测量值的置信度权重，$\Phi_{\rho_\mu}$是外点过程的惩罚项，控制参数$\mu$使替代代价函数从凸函数逐步退火趋向真实的TLS代价。D-GNC交替执行两个完全分布式的步骤：（i）*变量更新*——使用黎曼块坐标下降（RBCD）求解器在秩受限松弛（默认秩为5，每次更新15次迭代）上求解加权PGO，其中每个机器人只更新自己的轨迹，并只与邻居交换"公开位姿"；（ii）*权重更新*——TLS闭式解，针对每个回环独立计算：

$$w_i \leftarrow \begin{cases} 0, & \widehat{r}_i^{\,2} \in \big[\tfrac{\mu+1}{\mu}\bar{c}^2,\, +\infty\big], \\ \frac{\bar{c}}{\widehat{r}_i}\sqrt{\mu(\mu+1)} - \mu, & \widehat{r}_i^{\,2} \in \big[\tfrac{\mu}{\mu+1}\bar{c}^2,\, \tfrac{\mu+1}{\mu}\bar{c}^2\big], \\ 1, & \widehat{r}_i^{\,2} \in \big[0,\, \tfrac{\mu}{\mu+1}\bar{c}^2\big], \end{cases}$$

其中$\widehat{r}_i$是当前残差，$\bar{c}$是TLS阈值——随着$\mu$退火，外点权重被推向0。最后，每个机器人通过网格变形来修正其局部语义网格，使重建结果与优化后的轨迹保持一致。

## 实验结果

- **仿真+EuRoC（表I，ATE单位为米）：** 在照片级真实感的Medfield场景中（总轨迹2396米），D-GNC达到3.92米，而朴素最小二乘为64.2米，PCM为12.5米，*集中式*GNC为3.88米；在EuRoC Machine Hall（将五个序列视为五个机器人，466米）上，D-GNC为0.41米，PCM为1.76米，集中式为0.52米。由于PCM召回率较低，"PCM后接GNC"的方案始终逊于单独使用D-GNC。
- **通信量（表II）：** 在Medfield上，完整分布式流水线使用65.9 MB（位置识别22.6 MB+几何验证41.5 MB+DPGO 1.8 MB），而集中式传输原始图像需要2113 MB（仅传输关键点则为141 MB）。
- **真实室外数据集（Jackal无人地面车，RealSense D435i）：** 在Medfield上（机器人轨迹分别为600/860/728米），端到端误差从18.74/14.84/24.55米（Kimera-VIO）降至0.01/0.13/0.09米——与集中式求解器的结果相同；在一个包含15650个位姿的图上，100次RBCD迭代耗时53秒。在更具挑战性的MIT Stata数据集上（跨机器人回环较少），误差为0.03/33.13/1.26米，而集中式为0.01/21.56/1.17米，需要完整的变量更新（2000次RBCD迭代，耗时14分钟）。D-GNC能够剔除严重的外点污染，例如在Medfield上，机器人1与机器人2之间707个候选回环中接受了340个。

## 对SLAM的意义

Kimera-Multi是MIT SPARK Kimera生态系统扩展到机器人团队的旗舰之作，它为现代分布式SLAM系统应达到的标准树立了范例：鲁棒性（GNC外点剔除，延续了DOOR-SLAM的PCM所开创的路线）、达到集中式精度水平的去中心化，以及可供下游规划使用的、具有语义意义的稠密地图。其度量-语义网格输出还为场景图相关研究（Kimera、Hydra、Hydra-Multi）提供了支撑。如果你今天需要带语义的多机器人建图，这就是标准的参考系统。

## 相关条目

- [DOOR-SLAM](door-slam.md) —— 鲁棒分布式回环剔除的前身系统
- [Swarm-SLAM](swarm-slam.md) —— 竞争性的去中心化协作SLAM框架
- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md) —— 单机器人视觉-惯性前端
- [Kimera / 3D动态场景图](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) —— 单机器人度量-语义基础
- [Hydra-Multi](../level-05-deep-learning/hydra-multi.md) —— 基于这一脉络构建的多机器人场景图
- [鲁棒位姿图优化](../level-02-getting-familiar/robust-pose-graph-optimization.md) —— GNC在单机器人场景下的形式
