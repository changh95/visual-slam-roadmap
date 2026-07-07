# ESLAM

> Johari 2023 · [论文](https://arxiv.org/abs/2211.11704)

**一句话总结** — 用三平面表示取代了NICE-SLAM的三维特征体素网格,将神经SLAM的内存增长从$O(L^3)$降低到$O(L^2)$,同时解码有符号距离场以获得干净的表面。

## 问题

基于网格的神经SLAM为每个体素存储一个特征向量,因此模型规模随场景边长呈立方增长——NICE-SLAM的分层网格即便在房间尺度下也会消耗大量GPU内存,限制了分辨率与场景规模。ESLAM("Efficient Dense SLAM System Based on Hybrid Representation of Signed Distance Fields")读取姿态未知的连续RGB-D帧,探讨是否可以将体积特征场分解为某种本质上更廉价的形式而不损失重建质量——以及TSDF是否比占用概率更适合作为解码量。

## 方法与架构

**三平面表示**:特征存在于两个尺度(粗与细)上、轴对齐且相互垂直的二维平面上,几何与外观分别使用*独立*的平面集——将两者分开"缓解了几何重建的遗忘问题,因为外观变化更为频繁。"查询点$p$被投影到每个平面上并进行双线性插值;每个尺度的特征求和,再将各尺度拼接:

$$f^{c}_{g}(p)=F^{c}_{xy}(p)+F^{c}_{xz}(p)+F^{c}_{yz}(p),\qquad \boldsymbol{f_g}(p)=[f^{c}_{g}(p);\,f^{f}_{g}(p)],$$

(外观平面上的$\boldsymbol{f_a}(p)$计算方式类似)。浅层的两层MLP将$\boldsymbol{\phi_g}(p)=h_g(\boldsymbol{f_g}(p))$解码为归一化TSDF(表面处为零,截断距离$T$处幅值为一),将$\boldsymbol{\phi_a}(p)=h_a(\boldsymbol{f_a}(p))$解码为原始颜色。模型规模随场景面积而非体积增长。

**基于SDF的渲染**:对每条光线采样$N=N_{strat}+N_{imp}$个点(分层采样加近表面/重要性采样),TSDF通过一个可学习的锐度参数$\beta$转换为体密度,

$$\boldsymbol{\sigma}(p_n)=\beta\cdot\mathrm{Sigmoid}\big(-\beta\cdot\boldsymbol{\phi_g}(p_n)\big),$$

随后用标准权重$w_n=\exp\big(-\sum_{k=1}^{n-1}\boldsymbol{\sigma}(p_k)\big)\big(1-\exp(-\boldsymbol{\sigma}(p_n))\big)$渲染颜色$\boldsymbol{\hat{c}}=\sum_n w_n\boldsymbol{\phi_a}(p_n)$和深度$\boldsymbol{\hat{d}}=\sum_n w_n z_n$。

**损失函数**:TSDF允许在渲染损失之外附加快速的逐点监督——自由空间损失将表面前方的$\boldsymbol{\phi_g}$推向1,以及在截断区域内使用深度测量值作为近似SDF的有符号距离损失,

$$\mathcal{L}_{T}=\frac{1}{|R|}\sum_{r\in R}\frac{1}{|P_r^T|}\sum_{p\in P_r^T}\big(z(p)+\boldsymbol{\phi_g}(p)\cdot T-D(r)\big)^2,$$

该损失被拆分为截断区域的中段与尾段,采用不同权重(较小的有效截断距离能使建图更锐利,而跟踪则使用完整的截断带),再加上$\ell_2$的深度和颜色渲染损失。同一个全局损失(权重不同)同时驱动建图和跟踪。

**SLAM循环**:无需预训练,也无需分阶段优化——平面和解码器在第一帧上随机初始化。建图每$k$帧更新一次,涵盖$W$帧(当前帧加前两个关键帧,以及$W-3$个随机选取的关键帧),联合优化平面、解码器以及这$W$个位姿。跟踪则逐帧运行,使用Adam优化平移和四元数,排除无深度的光线以及外点(渲染深度误差超过批次中值的10倍)。

## 实验结果

- **Replica(8个场景的平均值,±为5次运行)**:深度L1误差1.18 cm,精度0.97 cm,完整度1.05 cm,完整度比率98.60%,ATE RMSE 0.63 cm——相比NICE-SLAM的3.29 / 1.66 / 1.63 / 96.74% / 2.05 cm以及iMAP*的7.16 / 5.83 / 67.17% / 3.42 cm。这印证了摘要中关于重建与定位精度"提升超过50%"的说法。
- **ScanNet**:平均ATE RMSE为7.4 cm,相比NICE-SLAM的10.7和iMAP*的26.6。
- **TUM RGB-D**:在fr1/desk、fr2/xyz、fr3/office上分别为2.47 / 1.11 / 2.42 cm,相比NICE-SLAM的2.85 / 2.39 / 3.02。
- **速度与内存**:在Replica上单帧处理时间为0.18 s,相比NICE-SLAM的2.10 s(快近10倍;在ScanNet上为0.55 s对3.35 s),参数量为6.79 M对12.18 M,且随场景边长$L$的增长为$O(L^2)$而非$O(L^3)$。

## 对SLAM的意义

ESLAM是应对NICE-SLAM之后神经SLAM研究核心问题——如何让地图表示更高效——的三种经典答案之一(另外两种是Co-SLAM的哈希网格和Point-SLAM的神经点)。其三平面思路借鉴自生成式三维建模,影响了后续内存高效稠密SLAM的设计,而其TSDF加逐点损失的方案表明,解码量的选择(SDF还是占用概率)与编码方式一样重要。

## 相关条目

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [Point-SLAM](point-slam.md)
- [iMAP](imap.md)
- [NeRF](../level-05-deep-learning/nerf.md)
