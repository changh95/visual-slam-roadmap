# Frame-to-model tracking（对模型的逐帧跟踪）

Frame-to-model跟踪是指将每个新输入帧与*累积的地图*进行对齐,而不是与前一帧对齐。在frame-to-frame跟踪中,每一次两两对齐都带有一个小误差,把成百上千个相对位姿复合起来会迅速累积漂移。相比之下,累积的模型对许多观测取了平均:它的表面比任何单一帧都更平滑、噪声更小,因此与之对齐既更精确又更稳定。

## "模型预测-对齐-融合"循环

经典方案来自KinectFusion:

1. 维护一个稠密场景模型(一个TSDF体素或一个面元地图)。
2. 从前一个相机位姿出发,*预测*模型看起来是什么样子——对TSDF进行光线投射(或渲染面元),合成一张顶点/法向图。
3. 用ICP(通常是点到平面变体)将新的深度帧与这个预测对齐:

$$E(\mathbf{T}) = \sum_i \big( (\mathbf{T}\,\mathbf{p}_i - \mathbf{q}_i) \cdot \mathbf{n}_i \big)^2$$

其中$\mathbf{p}_i$是新帧中的点,$\mathbf{q}_i, \mathbf{n}_i$是对应的预测模型点和法向。对应关系使用投影数据关联(将模型点投影到新帧中)而不是昂贵的最近邻搜索,优化在GPU上以粗到细的方式运行。

4. 将新对齐的帧融合进模型,从而改进下一帧的预测。

## 对齐问题实际是如何求解的

一旦将运动更新参数化为旋量$\boldsymbol{\xi} = (\boldsymbol{\omega}, \mathbf{t}) \in \mathfrak{se}(3)$并假设其为小量,点到平面ICP就变成了一个微小的线性问题。对于当前估计$\hat{\mathbf{p}}_i = \hat{\mathbf{T}}\,\mathbf{p}_i$,残差线性化为

$$r_i(\boldsymbol{\xi}) \approx \mathbf{n}_i^\top\big( \hat{\mathbf{p}}_i + \boldsymbol{\omega} \times \hat{\mathbf{p}}_i + \mathbf{t} - \mathbf{q}_i \big),$$

因此每个有效像素只为一个只有6个未知数的最小二乘问题贡献一行。$6\times 6$的正规方程$\mathbf{J}^\top\mathbf{J}\,\boldsymbol{\xi} = -\mathbf{J}^\top\mathbf{r}$在GPU上并行累积(对数十万个像素做归约),并在CPU上以微秒级速度求解;每个金字塔层只需几次迭代即可。这就是为什么稠密跟踪能以帧率运行:*数据*是稠密的,但*状态*只是一个位姿。

混合系统会加入一个光度项。ElasticFusion通过最小化一个加权联合代价,针对面元地图的渲染颜色+深度预测进行跟踪

$$E = \sum_i \Big[ w_{\mathrm{icp}} \big(\mathbf{n}_i^\top(\mathbf{T}\mathbf{v}_i - \mathbf{u}_i)\big)^2 + w_{\mathrm{rgb}} \big(I(\pi(\mathbf{T}\mathbf{v}_i)) - \hat{I}(\mathbf{u}_i)\big)^2 \Big],$$

这使得在纯几何退化的情况下(见下文)跟踪仍能受到约束。DVO式的直接法贡献了互补的要素:对所有像素采用稳健的稠密残差,而不是稀疏特征。

## 常见陷阱

- **模型污染会反馈回来**:如果一次糟糕的对齐被融合进模型,被污染的模型会进而误导后续的跟踪——误差可能会累积而不是相互抵消。融合权重和对外点鲁棒的整合机制是常见的防御手段。
- **收敛域较小**:ICP需要一个良好的初始猜测;快速旋转或大位移可能超出这个收敛域,导致无法恢复的跟踪丢失。粗到细金字塔可以扩大收敛域,但无法消除这一限制。
- **几何退化**:针对单个平面墙的点到平面ICP会使三个运动方向不受约束(平面内平移和绕法向的旋转)——$\mathbf{J}^\top\mathbf{J}$变得秩缺失,位姿会发生滑动。加入光度项或特征可以恢复缺失的约束。
- **它终究还是里程计**:frame-to-model跟踪能减少漂移,但不能消除它——模型本身会随轨迹缓慢漂移。完整系统会在此基础上加入回环检测:位姿图、地图形变(ElasticFusion),或TSDF重新整合(BundleFusion)。

## 对SLAM的意义

Frame-to-model跟踪是稠密RGB-D SLAM的标志性技巧:这正是KinectFusion在2011年能在完全没有光束法平差的情况下,产生看起来无漂移的桌面尺度重建的原因。此后几乎每一个稠密系统——Kintinuous、ElasticFusion、InfiniTAM、BundleFusion——都建立在某种形式的这一思想之上,理解"模型预测-对齐-融合"循环是读懂这些论文的关键。

## 相关条目

- [ICP](icp.md) —— 该循环核心的对齐算法
- [KinectFusion](kinectfusion.md) —— 经典的TSDF frame-to-model系统
- [ElasticFusion](elasticfusion.md) —— 基于面元的frame-to-model跟踪
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) —— 你所对齐的两种模型表示方式
- [DVO](dvo.md) —— 稳健的直接RGB-D对齐方法
