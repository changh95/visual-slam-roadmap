# FAST-LIO2

> Xu 2022 · [论文](https://arxiv.org/abs/2107.06829)

**一句话总结** —— FAST-LIO2证明了在紧耦合迭代卡尔曼滤波器内,将原始LiDAR点直接配准到地图——以增量式k-d树(ikd-Tree)作为地图——比基于特征的LiDAR-惯性里程计更快*且*更准确。

## 问题

基于特征的LiDAR流水线在边缘/平面提取过程中会丢弃每次扫描的大部分数据,浪费了细微的环境结构信息,并在明显特征稀缺的场景中失效——新兴固态LiDAR的小视场进一步加剧了这个问题。特征提取器还会随扫描模式(旋转式、棱镜式、MEMS)变化,因此每种新传感器都需要手工调整。若改为直接注册*所有*原始点,则需要一个支持高效kNN查询*并*支持实时增量更新的大规模稠密地图——这正是FAST-LIO2着力解决的实际瓶颈。

## 方法与架构

原始点被累积成扫描帧(10–100毫秒),通过迭代卡尔曼滤波器与一个大型局部地图配准,并立即合并进地图——里程计和建图以相同的频率运行。

- **流形上的状态**:$\mathcal{M} \triangleq SO(3) \times \mathbb{R}^{15} \times SO(3) \times \mathbb{R}^3$(维度24),其中 $\mathbf{x} = [{}^{G}\mathbf{R}_I,\ {}^{G}\mathbf{p}_I,\ {}^{G}\mathbf{v}_I,\ \mathbf{b}_{\omega},\ \mathbf{b}_{a},\ {}^{G}\mathbf{g},\ {}^{I}\mathbf{R}_L,\ {}^{I}\mathbf{p}_L]$——位姿、速度、IMU偏置、重力,以及*在线标定*的LiDAR-IMU外参。每个IMU采样的离散传播为:$\mathbf{x}_{i+1} = \mathbf{x}_i \boxplus \left(\Delta t\, \mathbf{f}(\mathbf{x}_i, \mathbf{u}_i, \mathbf{w}_i)\right)$。
- **反向传播去畸变**:IMU测量值在每个点各自的采样时刻估计LiDAR位姿,在更新之前将所有点投影到扫描结束时刻。
- **直接的点到平面测量模型**:每个被测量的点投影到全局坐标系后,必须位于由其最近的5个地图邻居拟合出的小平面上:

  $$\mathbf{0} = {}^{G}\mathbf{u}_j^{\top}\left({}^{G}\mathbf{T}_{I_k}\, {}^{I}\mathbf{T}_{L}\left({}^{L}\mathbf{p}_j + {}^{L}\mathbf{n}_j\right) - {}^{G}\mathbf{q}_j\right),$$

  其中 ${}^{G}\mathbf{u}_j$ 是平面法向量,${}^{G}\mathbf{q}_j$ 是平面上的一点,${}^{L}\mathbf{n}_j$ 是测量噪声。无需特征提取——细微结构得以被利用,且适用于任何扫描模式。
- **流形上的迭代更新**:在当前迭代点处线性化得到残差 $\mathbf{z}_j^{\kappa}$,MAP问题

  $$\min_{\widetilde{\mathbf{x}}_k^{\kappa}} \left( \lVert \mathbf{x}_k \boxminus \widehat{\mathbf{x}}_k \rVert_{\widehat{\mathbf{P}}_k}^2 + \sum_{j=1}^{m} \lVert \mathbf{z}_j^{\kappa} + \mathbf{H}_j^{\kappa}\widetilde{\mathbf{x}}_k^{\kappa} \rVert_{\mathbf{R}_j}^2 \right)$$

  通过迭代卡尔曼滤波器求解,增益为 $\mathbf{K} = (\mathbf{H}^{\top}\mathbf{R}^{-1}\mathbf{H} + \mathbf{P}^{-1})^{-1}\mathbf{H}^{\top}\mathbf{R}^{-1}$——求逆的是*状态*维度(24)的矩阵,而非测量维度(数千个点)的矩阵,这正是使直接配准变得可行的技巧。迭代直到 $\lVert \widehat{\mathbf{x}}_k^{\kappa+1} \boxminus \widehat{\mathbf{x}}_k^{\kappa} \rVert < \epsilon$ 以应对快速运动下的线性化误差。
- **ikd-Tree建图**:优化后的扫描被插入到一个增量式k-d树中,该树支持带*在树上直接下采样*的点插入、通过延迟标记实现的按盒删除,以及在并行线程中运行的类替罪羊(scapegoat)式局部重平衡——无需完整重建,无间歇性延迟。地图覆盖一个边长为 $L$ 的立方体(默认1000米),当LiDAR的探测球触及其边界时会滑动,按盒逐块删除移出的点。

## 实验结果

- **精度**:在来自五个公开数据集(lili、liosam、utbm、ulhk、nclt——涵盖固态和机械旋转式LiDAR)的19个序列上,FAST-LIO2或其变体在19个序列中的18个上表现最佳。示例RMSE:liosam_1为4.58米,对比LIO-SAM 4.75米、LILI-OM 18.78米、LINS 880.92米;唯一的例外是ulhk_4,LILI-OM略胜一筹,2.29米对2.57米。在大多数序列中,直接法都优于同一系统的特征法变体。
- **速度**:在DJI Manifold 2-C(i7-8550U)上,其单次扫描总处理速度约为LILI-OM的8倍、LIO-SAM的10倍、LINS的6倍;在ARM Khadas VIM3上还实现了10 Hz的实时性——此前尚无任何LIO系统展示过这一点。
- **ikd-Tree**:在18个序列上与octree、R\*-tree和nanoflann k-d树进行基准测试,在增量更新加kNN搜索方面取得了最佳的整体性能。
- **鲁棒性**:四旋翼翻转实验达到峰值1198度/秒的角速度,在100 Hz里程计下平均每次扫描处理时间为2.01毫秒;一次快速手持运行(最高7米/秒)闭合了一个81米的环路,端到端误差小于0.06米。

## 对SLAM的意义

FAST-LIO2将该领域的默认做法从"先提取特征,再配准"翻转为"直接配准一切,快速地做"。它的ikd-Tree成为了被广泛复用的开源组件,其基于流形的iEKF公式化方案已成为基于滤波器的LiDAR-惯性里程计的参考设计。它同时也是HKU MARS生态系统的基础——R3LIVE以及FAST-LIVO/FAST-LIVO2都在这个LIO核心之上构建其视觉融合——如今它仍是纯LiDAR-惯性里程计的务实首选,尤其是在廉价固态传感器上。

## 动手实践

- [运行 FAST-LIO2](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/fast_lio2)

## 相关条目

- [LOAM](loam.md) —— 它所取代的基于特征的范式
- [LIO-SAM](lio-sam.md) —— 带有回环检测和GPS的因子图替代方案
- [FAST-LIVO](fast-livo.md) —— 在同一张地图上增加直接视觉融合
- [R3LIVE](r3live.md) —— 以FAST-LIO作为其几何骨干
- [PIN-SLAM](pin-slam.md) —— 直接LiDAR配准的神经地图继承者
