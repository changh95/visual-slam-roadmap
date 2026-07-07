# DynamicFusion

> Newcombe 2015 · [论文](https://ieeexplore.ieee.org/document/7298631)

**一句话总结** —— 首个用于非刚性形变场景的实时稠密SLAM系统:它估计一个稠密的体素化6D变形场(warp field),将一个固定的规范TSDF模型变换到每一帧实况图像,从而使KinectFusion式的融合在一切都在运动的情况下仍然有效。

## 问题

KinectFusion及所有传统稠密SLAM背后最基本的假设是:被观测场景在很大程度上是*静态*的——任何发生形变的对象(人、手、衣物、宠物)都会破坏跟踪并污染模型。此前的非刚性捕捉方法要么需要一个在采集过程中保持静止的预扫描模板,要么在离线运行,速度比实时慢三到四个数量级。本文的核心问题是:如何将KinectFusion推广到能够实时、无模板地从单个深度相机重建和跟踪动态场景?

## 方法与架构

DynamicFusion将场景分解为一个在刚性规范空间$\mathsf{S}\subseteq\mathbb{R}^3$中重建的潜在几何表面(一个TSDF $\mathcal{V}$),加上一个逐帧的体素化变形场,将该表面变换到实况帧。每一个新的深度图会触发三个步骤:(1)估计变形场状态,(2)通过该变形场将实况深度融合进规范TSDF,(3)扩展变形场结构以覆盖新观测到的几何。

- **通过稀疏节点+双四元数混合实现稠密6D变形场**:一个稠密的逐点变换$\mathcal{W}: \mathsf{S} \mapsto \mathbf{SE}(3)$(一个稠密的$256^3$场每帧需要约1亿个参数)是从$n$个变形节点$\mathcal{N}^t_{\mathrm{warp}} = \{\mathbf{dg}_v, \mathbf{dg}_w, \mathbf{dg}_{se3}\}_t$——位置、径向权重和6自由度变换——插值得到的。一个规范空间的点$x_c$通过对其k个最近节点做双四元数混合来变形,

$$\mathcal{W}_t(x_c) = \mathbf{T}_{lw}\, SE3\big(\mathbf{DQB}(x_c)\big), \qquad \mathbf{DQB}(x_c) = \frac{\sum_{k\in N(x_c)} \mathbf{w}_k(x_c)\,\hat{\mathbf{q}}_{kc}}{\big\lVert \sum_{k\in N(x_c)} \mathbf{w}_k(x_c)\,\hat{\mathbf{q}}_{kc} \big\rVert},$$

  其中$\hat{\mathbf{q}}_{kc}\in\mathbb{R}^8$为单位双四元数,高斯影响权重为$\mathbf{w}_i(x_c) = \exp\big(-\lVert \mathbf{dg}^i_v - x_c \rVert^2 / (2 (\mathbf{dg}^i_w)^2)\big)$,共同的刚体(相机)运动被分离为$\mathbf{T}_{lw}$。DQB确保混合后的变换仍是一个合法的刚体运动。
- **非刚性投影式TSDF融合**:每个体素中心$x_c$被变形到实况帧中,并在该处计算投影带符号距离:$\mathbf{psdf}(x_c) = \big[\mathbf{K}^{-1} D_t(u_c) [u_c^\top, 1]^\top\big]_z - [x_t]_z$,随后进行标准的截断加权平均TSDF更新。融合权重会随体素到其k个最近节点的平均距离而降低,以此编码变形的不确定性。由于更新是沿相机坐标系中的视线方向计算的,刚性TSDF融合的最优性特性可以延续到非刚性情形。
- **变形场估计**:给定深度$D_t$和当前重建$\mathcal{V}$,节点变换通过最小化以下目标获得

$$E(\mathcal{W}_t, \mathcal{V}, D_t, \mathcal{E}) = \mathbf{Data}(\mathcal{W}_t, \mathcal{V}, D_t) + \lambda\,\mathbf{Reg}(\mathcal{W}_t, \mathcal{E}).$$

  数据项将变形后的零水平集网格渲染到实况帧以进行数据关联,并对预测像素上带Tukey稳健惩罚的点到平面误差求和,$\mathbf{Data} \equiv \sum_{u\in\Omega} \psi_{\mathrm{data}}\big( \hat{\mathbf{n}}_u^\top (\hat{\mathbf{v}}_u - \mathbf{vl}_{\tilde{u}}) \big)$。正则化项是一个尽可能刚性(as-rigid-as-possible)的项,在变形图的边$\mathcal{E}$上使用保持不连续性的Huber惩罚,

$$\mathbf{Reg}(\mathcal{W}, \mathcal{E}) \equiv \sum_{i=0}^{n} \sum_{j \in \mathcal{E}(i)} \alpha_{ij}\, \psi_{\mathrm{reg}}\big( \mathbf{T}_{ic}\,\mathbf{dg}^j_v - \mathbf{T}_{jc}\,\mathbf{dg}^j_v \big), \qquad \alpha_{ij} = \max(\mathbf{dg}^i_w, \mathbf{dg}^j_w),$$

  该正则项建立在一个*分层*变形树上,使未被观测的区域也能分段平滑地变形。优化采用高斯-牛顿法,对每个节点旋量$\xi_i \in se(3)$求解:首先用稠密刚性ICP解出$\mathbf{T}_{lw}$,然后进行2-3次非刚性迭代,通过对其箭形(arrow-head)Hessian进行稀疏块Cholesky分解来求解线性化系统,整个过程都在GPU上完成,并预先计算好k最近节点体素。
- **扩展变形场**:融合之后,当前节点未能支持的表面顶点($\min_k \lVert \mathbf{dg}^k_v - v_c \rVert / \mathbf{dg}^k_w \ge 1$)会生成新节点,新节点之间至少间隔$\epsilon$(默认抽取密度$\epsilon = 25$毫米),并通过对当前变形场做DQB来初始化;随后重建一个$L{=}4$层的正则化层级结构(半径每层增长$\beta{=}4$倍)。系统实际运行时使用的参数:$\lambda = 200$,Tukey宽度0.01,Huber宽度0.0001。

## 实验结果

评估是定性的(没有基准数值表):结果是从实时系统在普通硬件上使用单个深度相机现场采集得到的——一个由移动相机拍摄的移动的人,"从杯中饮水"持续60秒(完整的手臂+杯子模型逐渐显现,包括第一帧中不可见的表面),以及"手指交叉"的全身序列,在手部交叉时模型仍保持一致。最初噪声大、不完整的模型在主体和相机都在运动的情况下逐渐被去噪并补全,回环闭合在捕捉过程中随时发生。文中指出的局限性包括:场景从闭合拓扑迅速变为开放拓扑的情况(以合拢的手开始重建的手无法再张开)、较大的帧间运动,以及随场景复杂度增加而不断扩大的遮挡区域。发表于CVPR 2015,并获得了最佳论文奖。

## 对SLAM的意义

DynamicFusion消除了在实时3D重建和SLAM中普遍存在的静态场景假设,将体素TSDF融合推广到了非刚性情形,并证明了稠密6D变形场可以按帧率进行估计。其"规范体素+嵌入式变形图"的方案成为非刚性融合(VolumeDeform、KillingFusion、SurfelWarp)的模板,并影响了现代动态场景SLAM系统分离相机运动与场景运动的方式。

## 相关条目

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)
- [MID-Fusion](../level-03-monocular-slam/mid-fusion.md)
