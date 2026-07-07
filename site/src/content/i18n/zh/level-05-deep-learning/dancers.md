# DANCeRS

> Patwardhan 2025 · [论文](https://arxiv.org/abs/2508.18153)

**一句话总结** — DANCeRS将高斯信念传播(Gaussian Belief Propagation)应用于机器人集群的分布式共识:机器人通过纯粹局部的点对点消息传递,在一个因子图上就共享决策——连续的(编队的位姿)或离散的(N选优)——达成一致,无需任何中心服务器。

## 问题

机器人集群在从成形编队到群体决策等各种挑战中,都需要具备协同一致的集体行为。现有方法"往往将离散和连续决策空间中的共识视为不同的问题",各自采用专门的算法(一侧是N选优投票和意见动力学,另一侧是邻域平均和均值漂移)。DANCeRS探讨的问题是:能否用单一的分布式推断框架同时解决这两个领域的共识问题,并兼顾集群的实际约束——仅限局部通信、动态图拓扑、以及随集群规模的可扩展性。

## 方法与架构

由 $N$ 个机器人组成的集群(通信半径 $r_C$)构成一个动态无向图;整个问题被表示为一个因子图,其联合分布可分解为

$$p(\mathbf{X})=\prod_{s}f_{s}(\mathbf{X}_{s}), \qquad f_{s}(\mathbf{X}_{s})\propto e^{-\frac{1}{2}\mathbf{r}^{\top}\boldsymbol{\Lambda}_{s}\mathbf{r}}, \qquad \mathbf{r}=\mathbf{z}_{s}-\mathbf{h}_{s}(\mathbf{X}_{s}),$$

信念以信息形式保存($\boldsymbol{\Lambda}=\boldsymbol{\Sigma}^{-1}$,$\boldsymbol{\eta}=\boldsymbol{\Lambda}\boldsymbol{\mu}$)。GBP推断是一个循环,由因子到变量的消息、变量信念更新、以及变量到因子的消息构成——全部严格限制在邻居之间。对于非欧几里得状态,消息通过Exp/Log映射到当前信念的切空间再映射回来,因此变量可以存在于 $\mathbb{R}^{M}, SO(2), SO(3), SE(2), SE(3)$ 上。

每个机器人运行一个两层的因子图堆栈:

- **全局共识层** — 机器人 $i$ 持有其对共享参数 $\chi$ 的解读 ${}^{\mathcal{G}}X_{i}$,配有一个先验因子 $h_{p}={}^{\mathcal{G}}X_{i}\ominus{}^{\mathcal{G}}x_{i}^{0}$,并对每个通信范围内的邻居 $j$ 配有一个显式的协商因子

$$h_{c}\left({}^{\mathcal{G}}X_{i},{}^{\mathcal{G}}X_{j}\right)={}^{\mathcal{G}}X_{i}\ominus{}^{\mathcal{G}}X_{j}=\mathrm{Log}\left({}^{\mathcal{G}}X_{j}^{-1}\cdot{}^{\mathcal{G}}X_{i}\right).$$

  由于GBP变量是无记忆的,每个机器人维护一个包含 $W$ 个时间关联副本的滑动窗口;当最旧的副本被删除时,其边缘分布成为新的先验,因此离开群体的机器人会保留其协商得到的均值,而其协方差则会减弱。
- **将离散决策转化为连续共识** — 对于 $N_D$ 个选项,取 $\mathcal{M}=\mathbb{R}^{1}$,仅在读出决策时进行量化:$\gamma(x)=\lfloor N_{D}\cdot x\rfloor$,$\gamma^{-1}(k)=k/N_{D}$。协商过程本身保持高斯且连续。
- **路径规划层** — 状态为 $[x,y,\theta,\dot{x},\dot{y},\dot{\theta}]^{\top}$,跨越一个时间窗口,包含一个新的非完整单轮车因子 $h_{u}=\dot{x}\cos\theta-\dot{y}\sin\theta$(被驱动至0,使速度方向与朝向一致)以及一个平滑的机器人间碰撞因子 $h_{r}=\exp(-|\mathbf{x}_{k,i}-\mathbf{x}_{k,j}|/d_{min})$。对于成形编队,目标点通过对编队点集进行KD树最近邻搜索来选取,并附加一个"占据权重",当邻居离开通信范围时该权重会衰减。

## 实验结果

- **连续共识(成形编队):** 收敛定义为机器人间平均偏差低于位置0.1米、朝向0.01弧度;在一个100×100米场地中进行的50次试验里,DANCeRS(以消息传递迭代次数计)比Sun等人2023年提出的均值漂移共识基线快一个数量级,并且随着 $r_C$、机器人数量 $N_R$ 以及窗口 $W$ 的增大,收敛速度进一步加快。它还能形成不连通的图形('!'、'wifi'、笑脸),而仅限于单一连通分量的均值漂移方法则无法做到。
- **离散共识:** 与基于熵的(ECA)和概率性的(PCA)共识基线相比,在 $r_C=6$ 米时ECA完全无法收敛;在更大的 $r_C$ 下,DANCeRS所需的迭代次数随 $N_R$ 增加大致保持恒定。一项扫描实验支持将 $\sigma_{c}=0.5/N_{D}$ 作为共识因子强度的一个较优上界。
- **知情机器人**($N_R=500$,$r_C=6$ 米):仅有一个种子机器人($\zeta=0.002$)时,DANCeRS在80%的试验中收敛到种子决策,在 $\zeta\geq0.01$ 时则达到100%,而PCA在 $\zeta=0.002$–$0.05$ 区间从9%升至94%,ECA则始终为0%。
- **代价:** 每条机器人间消息为一个 $n$维向量加一个 $n\times n$ 对称协方差,成形编队中 $n=3$,离散共识中 $n=1$——足够轻量,可用于低功耗设备。

## 对SLAM的意义

在集群规模下进行协同SLAM,恰好会遇到DANCeRS所针对的那些问题:集中式地图服务器会成为带宽与可靠性的瓶颈,而分布式优化器必须能够容忍异步性和仅限局部的通信。DANCeRS证明了GBP风格的共识可以在整个集群中——在李群变量上、在动态图之下——发挥作用,这支持了这样一种愿景:因子图消息传递可以作为分布式估计、地图构建、规划与协调的共用机制,与在图处理器上求解BA的计算完全相同。

## 相关条目

- [FutureMapping 2](futuremapping-2.md)
- [BA on Graph Processor](ba-on-graph-processor.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md)
- [Swarm-SLAM](../level-08-collaborative-slam/swarm-slam.md)
- [Centralized vs Decentralized](../level-08-collaborative-slam/centralized-vs-decentralized.md)
