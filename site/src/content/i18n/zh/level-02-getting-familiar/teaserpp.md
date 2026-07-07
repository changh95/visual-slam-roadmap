# TEASER++

> Yang 2020 · [论文](https://arxiv.org/abs/2001.07715)

**一句话总结** — 第一个快速且可证明最优的3D点云配准算法,通过截断最小二乘、不变量测量解耦以及最大团内点选取,能够在99%的外点对应关系下依然保持鲁棒(T-RO/RSS 2020)。

## 问题

根据生成模型$\mathbf{b}_i = s^{\circ}\mathbf{R}^{\circ}\mathbf{a}_i + \mathbf{t}^{\circ} + \mathbf{o}_i + \boldsymbol{\epsilon}_i$,从候选对应关系$(\mathbf{a}_i, \mathbf{b}_i)$出发对两个3D点云进行配准,其中$\mathbf{o}_i$对内点为零、对外点则任意。在没有外点的情况下,Horn/Arun的闭式解即可求解——但只要有一个坏的外点就会使其失效,而真实的描述子匹配中错误占绝大多数。ICP需要一个良好的初始猜测,RANSAC在外点比例上升时性能急剧下降,而早期的可证明最优求解器又远远太慢,无法在线使用。TEASER采用了截断最小二乘(TLS)的表述,仅假设内点噪声有界$\|\boldsymbol{\epsilon}_i\| \le \beta_i$(不假设外点模型):

$$\min_{s>0,\;\mathbf{R}\in SO(3),\;\mathbf{t}\in\mathbb{R}^3} \sum_{i=1}^{N} \min\!\left(\frac{1}{\beta_i^2}\big\lVert \mathbf{b}_i - s\mathbf{R}\mathbf{a}_i - \mathbf{t} \big\rVert^2,\; \bar{c}^2\right),$$

因此超过阈值的残差只贡献一个常数,无法拖累解——但即便在凸域上,TLS的最小化问题也是NP难的。

## 方法与架构

- **不变量测量将问题解耦为一个级联流程。** 对对应关系两两相减可消去平移量,得到平移不变量测量$\bar{\mathbf{b}}_{ij} = s\mathbf{R}\bar{\mathbf{a}}_{ij} + \mathbf{o}_{ij} + \boldsymbol{\epsilon}_{ij}$(TIMs,是对应关系图上的边,噪声界为$\delta_{ij} = \beta_i + \beta_j$);取TIM范数之比又能消去旋转量,得到标量TRIMs $s_{ij} = s + o^{s}_{ij} + \epsilon^{s}_{ij}$,其中$s_{ij} = \lVert\bar{\mathbf{b}}_{ij}\rVert / \lVert\bar{\mathbf{a}}_{ij}\rVert$。TEASER随后依次求解尺度、旋转、平移,每一步都通过TLS完成。
- **精确的多项式时间尺度与平移求解:自适应投票。** 标量TLS($\hat{s} = \arg\min_s \sum_k \min\big((s-s_k)^2/\alpha_k^2, \bar{c}^2\big)$)最多只有$2K{-}1$个不同的一致集,其边界是区间端点$s_k \pm \alpha_k\bar{c}$——将它们逐一列举,取代价最小的加权均值(定理7)。平移量以同样的方式逐分量求解。
- **最大团内点剔除(MCIS)。** 与$\hat{s}$不一致的TRIMs(即$|s_{ij} - \hat{s}| > \bar{c}\,\alpha_{ij}$)被剔除;定理6表明内点TIMs在剩余图中构成一个团,因此计算最大团便能在旋转估计之前分离出一个相互一致的内点集合。
- **通过紧SDP实现可证明最优的旋转估计。** 借助单位四元数和"二值克隆"($\mathbf{q}_k = \theta_k \mathbf{q}$,$\theta_k \in \{\pm 1\}$标记内点/外点)将TLS旋转问题重写为一个QCQP $\min_{\mathbf{x}} \mathbf{x}^{\mathsf{T}}\mathbf{Q}\mathbf{x}$,然后通过舍弃$\mathbf{Z} = \mathbf{x}\mathbf{x}^{\mathsf{T}}$上的秩1约束进行松弛,同时加入冗余的块对称约束使松弛变紧。定理13:若SDP解的秩为1,则其因子就是*被证明的全局最优解*;经验上,该松弛在超过95%外点的情况下依然保持紧致。
- **TEASER++ = GNC + 快速证明。** 求解SDP速度很慢(使用MOSEK对$K{=}100$大约需要1200秒),因此TEASER++用渐进非凸性(GNC,在外点比例约80%以下可靠——在MCIS剔除之后这一条件是安全的)来求解旋转子问题,然后通过对偶问题上的Douglas–Rachford分裂来*证明*该估计:算法3返回一个次优性界$\eta$,满足$(\hat{\mu} - \mu^{\star})/\hat{\mu} \le \eta$,其由对偶证书的最小特征值计算得到,$\eta^{(t)} = |\lambda_1^{(t)}|(K+1)/\hat{\mu}$,当估计最优且松弛紧致时收敛到零。
- **估计契约。** 定理15–17给出了估计误差的界——这是鲁棒配准领域首个此类界:在内点无噪声、外点随机的情况下,精确恢复只需3个内点,与外点数量无关;而对抗性外点则需要内点占多数。

## 实验结果

- **Bunny基准测试(N=100,对比FGR、GORE、RANSAC):** TEASER、TEASER++、GORE以及运行60秒的RANSAC在90%外点下均保持鲁棒(FGR在70%时失效,RANSAC-1K在90%时失效);在95–99%的极端外点比例下($N{=}1000$),TEASER/TEASER++/GORE均能存活到99%,其中TEASER++精度更高,且比GORE快一个数量级。TEASER++在笔记本电脑上能在10毫秒以内解决高外点比例问题(未知尺度时不到30毫秒)。
- **证明:** DRS证明器验证了所有正确的GNC解,并拒绝了所有错误的GNC解,平均耗时24次迭代(C++中每次迭代约50毫秒);其证明速度比MOSEK快几个数量级,而MOSEK在超过150个TIMs时就会内存耗尽。
- **无需对应关系的配准**(全对全假设,约$10^4$个候选对):ICP几乎总是失效,Go-ICP对修剪敏感且平均耗时16秒;TEASER++无需任何初始猜测即可恢复正确位姿,即使重叠率低至约10%。
- **物体位姿估计**(RGB-D数据集,FPFH对应关系,内点比例通常低于5%):在8个场景上平均旋转误差为0.066弧度,平均平移误差为0.069米。
- **3DMatch扫描匹配**(3DSmoothNet描述子):除MIT Lab外,TEASER++在所有场景上都与RANSAC-10K相当或更优(例如Kitchen场景成功率98.6% vs 97.2%),平均运行时间0.059秒;限定为经证明的估计(TEASER++ CERT)可进一步提高成功率(Kitchen达99.4%)——这为SLAM中剔除错误回环检测提供了一种自然的过滤手段。

## 对SLAM的意义

在SLAM中,基于候选对应关系的配准无处不在:LiDAR回环检测、全局重定位、多机器人地图合并以及物体位姿估计——所有这些场景下特征匹配都可能大部分是错误的。TEASER++使得"对应关系90%以上是垫圾"这一情形变得可解,并附带最优性证明,证明/未证明的区分为回环检测管线提供了一种有原则的拒绝检验。其开源C++库已被广泛集成到LiDAR SLAM和多机器人系统中(例如Kimera-Multi风格的地图合并),它是可证明感知这一研究方向的支柱之一,与SE-Sync和QUASAR并列。

## 相关条目

- [SE-Sync](se-sync.md) — 可证明最优的位姿图优化
- [QUASAR](quasar.md) — 可证明最优的基于四元数的旋转子求解器
- [GNC](gnc.md) — TEASER++所证明的快速鲁棒启发式方法
- [ICP](../level-04-rgbd-slam/icp.md) — 它使其对外点更加鲁棒的经典局部配准方法
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — 使用鲁棒配准进行地图合并的多机器人系统
- [Inter-robot loop closure](../level-08-collaborative-slam/inter-robot-loop-closure.md) — 已证明配准的一个关键应用场景
