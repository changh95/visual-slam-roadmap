# LSD-SLAM

> Engel 2014 · [论文](https://cvg.cit.tum.de/research/vslam/lsdslam)

**一句话总结** —— 首个大规模直接法单目SLAM:通过光度误差最小化在CPU上跟踪半稠密概率深度图,并配合具尺度漂移感知的 $\mathrm{Sim}(3)$ 关键帧对齐与位姿图回环检测。

## 问题

到2014年,单目SLAM已有的两种方案各自都存在硬性局限。基于特征的系统(PTAM一脉)精度高,但除了关键点之外丢弃了一切信息——"直线或曲线边缘中包含的信息……被舍弃了。"直接稠密方法(DTAM、变分VO)使用了全部图像数据,但"计算量巨大,需要顶级GPU",而且所有已有的直接法都是纯里程计,没有全局地图,也没有回环检测。除此之外,任何单目系统在长轨迹上都会产生*尺度*漂移,而6自由度位姿图无法表示这一点。LSD-SLAM(Engel、Schöps、Cremers,ECCV 2014)针对以上三点同时给出方案:直接法、大规模一致性、CPU实时运行。

## 方法与架构

三个组件并发运行(论文图3):**跟踪**、**深度图估计**和**地图优化**。

- **跟踪(直接 $\mathfrak{se}(3)$ 对齐)**:每个新帧 $I_j$ 都与当前关键帧 $K_i = (I_i, D_i, V_i)$——图像、半稠密逆深度图,以及逆深度*方差*——对齐,方法是在所有具有有效深度的像素上最小化方差归一化的光度误差:

$$E_p(\boldsymbol{\xi}_{ji}) = \sum_{\mathbf{p}\in\Omega_{D_i}} \left\| \frac{r_p^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}^{2}} \right\|_{\delta}, \qquad r_p := I_i(\mathbf{p}) - I_j\big(\omega(\mathbf{p}, D_i(\mathbf{p}), \boldsymbol{\xi}_{ji})\big),$$

$$\sigma_{r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}^{2} := 2\sigma_I^2 + \left(\frac{\partial r_p(\mathbf{p},\boldsymbol{\xi}_{ji})}{\partial D_i(\mathbf{p})}\right)^{2} V_i(\mathbf{p}),$$

  其中 $\omega$ 是投影变形(projective warp),$\|\cdot\|_\delta$ 是Huber范数,$\sigma_I^2$ 是图像噪声。将每个像素的深度方差传播进残差,是本文的第二个关键创新:深度不确定的像素会被自动降权。最小化通过李群流形上的迭代加权Gauss-Newton法完成。
- **深度图估计**:被跟踪的帧通过大量逐像素的小基线立体比较来精细化关键帧,并按概率(遵循Engel 2013的方法)过滤为 $D_i, V_i$;深度仅在图像梯度足够大的地方存在——即*半稠密*。当相机移动过远时($\mathrm{dist}(\boldsymbol{\xi}_{ji}) = \boldsymbol{\xi}_{ji}^T \mathbf{W} \boldsymbol{\xi}_{ji}$ 超过阈值),会通过将旧的深度图投影进新关键帧来创建一个新关键帧,并对每个关键帧进行重新缩放,使其平均逆深度为1。
- **$\mathfrak{sim}(3)$ 关键帧对齐(关键创新1)**:由于关键帧经过尺度归一化,它们之间的边是7自由度的相似变换。在 $\mathfrak{sim}(3)$ 上进行直接对齐时需要加入一个深度残差项——这是必要的,因为单靠光度误差无法观测到尺度:

$$E(\boldsymbol{\xi}_{ji}) := \sum_{\mathbf{p}\in\Omega_{D_i}} \left\| \frac{r_p^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_p}^{2}} + \frac{r_d^2(\mathbf{p},\boldsymbol{\xi}_{ji})}{\sigma_{r_d}^{2}} \right\|_{\delta}, \qquad r_d := [\mathbf{p}']_3 - D_j\big([\mathbf{p}']_{1,2}\big),$$

  其中 $\mathbf{p}' = \omega_s(\mathbf{p}, D_i(\mathbf{p}), \boldsymbol{\xi}_{ji})$。回环候选为最近的10个关键帧,加上一个基于外观(FAB-MAP)的提议;每个候选都通过一次互检验(reciprocal tracking check)来验证,要求 $\boldsymbol{\xi}_{jk i}$ 和 $\boldsymbol{\xi}_{i jk}$ 两个方向在统计上一致。ESM算法及从20×15像素开始的从粗到细金字塔扩大了收敛半径。
- **地图优化**:带 $\mathrm{Sim}(3)$ 约束的关键帧位姿图在后台持续优化(g2o):

$$E(\boldsymbol{\xi}_{W1} \dots \boldsymbol{\xi}_{Wn}) := \sum_{(\boldsymbol{\xi}_{ji}, \Sigma_{ji}) \in \mathcal{E}} \big(\boldsymbol{\xi}_{ji} \circ \boldsymbol{\xi}_{Wi}^{-1} \circ \boldsymbol{\xi}_{Wj}\big)^T \Sigma_{ji}^{-1} \big(\boldsymbol{\xi}_{ji} \circ \boldsymbol{\xi}_{Wi}^{-1} \circ \boldsymbol{\xi}_{Wj}\big).$$

## 实验结果

- **TUM RGB-D基准**(绝对轨迹RMSE,单位厘米;单目,用第一个深度图确定初始尺度):fr2/desk为**4.52**(116个关键帧),而半稠密单目VO为13.50,基于关键点的单目SLAM(PTAM)跟踪失败,两个使用传感器深度的RGB-D系统分别为1.77 / 9.5;fr2/xyz为**1.47**,而半稠密VO为3.79,PTAM为24.28。模拟序列:sim/desk为0.04,sim/slowmo为0.35。
- **大规模场景**:一段约500米、6分钟的手持室外轨迹被正确闭合,并且一段平均逆深度跨度从不到20厘米到超过10米的序列也被一致地建图——回环检测之前,场景的部分区域以不同尺度重复存在两次,回环之后它们对齐了。
- 在CPU上实时运行(640×480,30 Hz);其里程计核心已被证明可在智能手机上运行。ESM及额外的金字塔层扩大了 $\mathfrak{sim}(3)$ 的收敛半径,但不提升收敛后的精度。

## 对SLAM的意义

LSD-SLAM证明了直接法可以成为基于特征SLAM的一个严肃、可扩展的替代方案:利用更多图像信息,得到更丰富的半稠密地图,在角点稀少的环境中依然鲁棒。它输出的两项遗产——作为跟踪基元的方差归一化光度对齐,以及用于单目尺度漂移的 $\mathrm{Sim}(3)$ 位姿图——如今已是标准词汇(ORB-SLAM在回环检测中采用了 $\mathrm{Sim}(3)$ 本质图(essential-graph)的思想)。它直接催生了DSO(同一团队,用窗口光度BA取代了位姿图)以及CNN-SLAM(在LSD-SLAM骨架上加入学习深度)。

## 相关条目

- [DTAM](dtam.md)
- [DSO](dso.md)
- [CNN-SLAM](cnn-slam.md)
- [Scale ambiguity](scale-ambiguity.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [LDSO](ldso.md)
