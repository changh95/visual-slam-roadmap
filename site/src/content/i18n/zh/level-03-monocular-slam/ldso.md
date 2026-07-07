# LDSO

> Gao 2018 · [论文](https://arxiv.org/abs/1808.01111)

**一句话总结** —— 通过将点选择偏向于可重复检测的角点,并加入基于BoW的回环检测与 $\mathrm{Sim}(3)$ 位姿图优化,将DSO扩展为一个完整的SLAM系统,在保留其光度跟踪核心的同时,修正了DSO无界的漂移问题。

## 问题

DSO通过滑动窗口光度光束法平差实现了出色的局部精度,但它本质上是纯里程计:没有场景识别,没有回环检测,没有全局优化,因此在长轨迹上漂移会无限增长。为直接法添加回环检测并非易事,因为直接法按梯度而非可重复性来选择像素——"直接法并不要求这些点具备可重复性"——因此没有描述子可供词袋(bag-of-words)数据库使用。LDSO在不放弃DSO光度前端的前提下弥合了这一差距。

## 方法与架构

- **具备可重复特征的点选择**:LDSO仍像DSO一样每个关键帧选取2000个点,但其中部分点由Shi-Tomasi分数检测得到的角点构成,其余则采用DSO基于梯度的动态网格搜索方式。只有(数量较少的)角点会获得ORB描述子并被打包进词袋;角点和非角点都用于光度跟踪,因此回环检测线程带来的额外开销保持在最小水平。
- **回环候选提议与检验**:一个覆盖各关键帧的DBoW3数据库提出候选,候选范围限制在当前窗口之外的关键帧(已被边缘化)。ORB匹配加RANSAC PnP给出初始的 $\mathrm{SE}(3)$ 猜测;然后通过Gauss-Newton在联合的3D几何约束和2D重投影约束上,精调从回环候选帧到当前关键帧的 $\mathrm{Sim}(3)$ 变换 $\mathbf{S}_{cr}$:

$$E_{loop} = \sum_{\mathbf{q}_i \in \mathcal{Q}_1} w_1 \left\| \mathbf{S}_{cr}\, \Pi^{-1}(\mathbf{p}_i, d_{\mathbf{p}_i}) - \Pi^{-1}(\mathbf{q}_i, d_{\mathbf{q}_i}) \right\|_2 + \sum_{\mathbf{q}_j \in \mathcal{Q}_2} w_2 \left\| \Pi\big(\mathbf{S}_{cr}\, \Pi^{-1}(\mathbf{p}_j, d_{\mathbf{p}_j})\big) - \mathbf{q}_j \right\|_2,$$

  其中 $\Pi, \Pi^{-1}$ 是投影/反投影,$d$ 为逆深度(当前关键帧的深度来自将活动窗口内的地图点投影到该关键帧),$w_1, w_2$ 用于平衡不同测量单位。尺度只能从3D部分观测到,但如果没有2D重投影项,在深度存在噪声的情况下旋转和平移会不准确。
- **融合滑动窗口与位姿图**:DSO的窗口优化求解 $\mathbf{H}\,\delta\mathbf{x} = -\mathbf{b}$,其中 $\mathbf{H} \approx \mathbf{J}^{\top}\mathbf{W}\mathbf{J} + \lambda\mathbf{I}$(箭头形稀疏结构,对角块为 $\mathbf{H}_{dd}$)。LDSO并未将DSO的边缘化先验(一个覆盖所有窗口关键帧的超边)带入位姿图,而是用来自前端姿态估计的成对相对 $\mathrm{SE}(3)$ 观测来近似窗口约束,每个约束贡献 $\mathbf{e}_{ij} = \mathbf{T}_{ij}\hat{\mathbf{T}}_j^{-1}\hat{\mathbf{T}}_i$,并与 $\mathrm{Sim}(3)$ 回环约束并存。位姿图(g2o)固定当前关键帧的姿态,并不会写回窗口内部,因此全局修正永远不会干扰局部的窗口BA。
- **保持不变的光度前端**:DSO的直接跟踪和窗口光度光束法平差被完整保留,保留了在弱纹理区域的鲁棒性。

## 实验结果

- **TUM-Mono**(50个序列,为分离前端变化的影响而关闭回环检测;每个序列各跑10次正向+10次反向):偏向角点的点选择在平移、旋转和尺度漂移方面"并不降低原系统的VO精度";纯随机选点失败次数更多,但在成功时的精度出乎意料地高。
- **EuRoC MAV**($\mathrm{Sim}(3)$对齐后的RMSE):LDSO在大多数序列上显著提升了相对DSO的相机跟踪精度;两者在V2-03上均失败(ORB-SLAM2正向运行同样失败)。总体而言"ORB-SLAM2更精确,而LDSO在该数据集上更具鲁棒性"。
- **KITTI里程计**($\mathrm{Sim}(3)$对齐后的ATE,单位米):在带回环的序列上,LDSO大幅削减了DSO的漂移——序列00:126.7 → 9.32(ORB-SLAM2:8.27),序列05:49.85 → 5.10(7.91),序列07:27.99 → 2.96(3.44)——尽管LDSO只用位姿图优化,而ORB-SLAM2运行全局光束法平差,其结果却与ORB-SLAM2相当。
- **运行时间**:点选择每个关键帧耗时21.8毫秒,而原始DSO选点器为12.6毫秒(i7-4770HQ笔记本)——而且只在关键帧上进行,而非每一帧。

## 对SLAM的意义

LDSO回答了一个问题:一个*直接法*——按设计不具备可重复的特征描述子——如何做场景识别:保留光度核心,但让部分点具备特征点的性质。它也是SLAM架构的一个清晰案例研究:前端里程计(DSO)加上带 $\mathrm{Sim}(3)$ 回环约束的后端位姿图,这与LSD-SLAM和ORB-SLAM中相同的漂移校正模式,表明直接法与基于特征的"两个阵营"是互补的,而非彼此排斥。

## 相关条目

- [DSO](dso.md)
- [LSD-SLAM](lsd-slam.md)
- [ORB-SLAM](orb-slam.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Scale ambiguity](scale-ambiguity.md)
