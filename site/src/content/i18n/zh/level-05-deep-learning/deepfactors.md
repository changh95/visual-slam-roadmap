# DeepFactors

> Czarnowski 2020 · [论文](https://arxiv.org/abs/2001.05049)

**一句话总结** — DeepFactors(RA-L 2020)将CodeSLAM学习到的紧凑深度编码,转变为第一个实时的概率性稠密单目SLAM系统,在标准因子图软件中同时使用光度、重投影和稀疏几何误差作为因子。

## 问题

单目SLAM当时已沿三个方向分裂:场景几何表示方式(稀疏地标 vs 稠密地图)、用于优化多视图问题的一致性度量(光度 vs 重投影 vs 几何)、以及是否使用学习到的先验。稀疏方法允许实时的联合概率推断,但得到的地图无法用于交互;稠密方法则放弃了交叉相关性,并在跟踪/建图之间交替进行;CodeSLAM验证了紧凑编码这一想法,但"缺乏完整SLAM的功能,无法实时运行,也无法泛化到真实的手持相机场景"。DeepFactors"在保持实时性能的同时"将这些范式统一到一个概率框架中。

## 方法与架构

每个关键帧携带一个位姿变量 $p_i$ 和一个编码变量 $\mathbf{c}_i$;深度*线性地*从编码解码而来,因此因子永远不需要昂贵的重新线性化:

$$D_i = f(\mathbf{c}_i, I_i) = D_i^0 + J(I_i)\,\mathbf{c}_i ,$$

其中 $D_i^0$ 是零编码深度,$J(I_i) = \partial D_i / \partial \mathbf{c}_i$ 是一个以图像为条件的雅可比矩阵。该网络(一个U-Net特征提取器+线性解码VAE,外加一个用于初始化的显式编码预测编码器,以及一个逐像素不确定度 $b$)在约140万张ScanNet图像上以256×192分辨率、编码大小32进行训练。

三种成对一致性误差被构造为因子,均建立在如下变形函数之上:$\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) = \pi(T_{ji}\,\pi^{-1}(\mathbf{x}, D_i(\mathbf{x})))$,其中 $T_{ji} \in SE(3)$:

$$e_{pho}^{ij} = \sum_{\mathbf{x}\in\Omega_i} \| I_i(\mathbf{x}) - I_j(\omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i)) \|^2 \qquad \text{(稠密,直接法)}$$

$$e_{rep}^{ij} = \sum_{(\mathbf{x},\mathbf{y})\in M_{ij}} \| \omega_{ji}(\mathbf{x}, \mathbf{c}_i, I_i) - \mathbf{y} \|^2 \qquad \text{(BRISK匹配,Cauchy鲁棒代价)}$$

$$e_{geo}^{ij} = \sum_{\mathbf{x}\in\Omega_i} \| \left[ T_{ji}\,\pi^{-1}(\mathbf{x}, D_i(\mathbf{x})) \right]_z - D_j(\hat{\mathbf{x}}) \|^2 \qquad \text{(深度一致性,Huber,稀疏像素采样)}$$

零编码先验因子将编码约束在VAE的高斯潜在区域内。系统流程如下:输入帧通过一个GPGPU的SE(3)Lucas-Kanade对齐器(约250 Hz)与最近的关键帧进行跟踪;新的关键帧由编码预测网络初始化,并与最近的N个关键帧通过成对因子相连;整个地图作为一个批量MAP问题,使用iSAM2的增量贝叶斯树更新(GTSAM)进行优化。轻量的"单向"帧(没有自己的深度)将额外的光度证据输入到最新的关键帧,随后被边缘化掉。局部回环(最近10个关键帧内的位姿判据)和全局回环(词袋模型+跟踪验证,仅使用重投影因子)都是在线闭合的。

## 实验结果

- ScanNet验证场景上的因子消融实验(表I):每个因子都有帮助,重投影主要改善轨迹,几何因子主要改善重建;在scene0084_00场景上,ATE-RMSE从仅用光度因子的0.131米降至组合使用后的0.061米,pc110从69.14%升至73.66%。
- 重建(ICL-NUIM + TUM,深度误差在真值10%以内的百分比,整条估计轨迹):平均27.10,而CNN-SLAM为19.77,Laina为14.62,LSD-BS为3.44(表II)。
- 轨迹(TUM fr1,ATE,单位米):fr1/360为0.142,而CNN-SLAM为0.500;fr1/rpy为0.047,而CNN-SLAM为0.261;在所有序列上均优于CodeSLAM(fr1/desk为0.119对0.654),并与非实时的DeepTAM相当(fr1/desk为0.078),而DeepFactors是实时运行的(表III)。
- 在单块GTX 1080上的耗时:跟踪约250 Hz;每个关键帧的网络前向传播约340毫秒,其中仅16毫秒是前向计算本身(其余时间用于通过tf.gradients计算编码雅可比)。已开源发布。

## 对SLAM的意义

DeepFactors是潜在编码建图路线(CodeSLAM)与主流因子图SLAM工程实践之间的桥梁:它表明学习到的稠密几何可以存在于与经典约束相同的概率后端中,而不需要一个专门定制的优化器。在实践层面,它证明了将直接法、基于特征的方法和学习到的先验线索结合起来,可以让稠密单目SLAM同时变得更加鲁棒和具备不确定性感知能力——其标准因子图设计也使得加入其他传感器模态变得直截了当,这一设计理念后来被诸多混合系统所延续。

## 相关条目

- [CodeSLAM](codeslam.md)
- [SceneCode](scenecode.md)
- [CodeMapping](codemapping.md)
- [CNN-SLAM](../level-03-monocular-slam/cnn-slam.md) — 它所对比的实时学习先验基线
- [DeepTAM](deeptam.md) — 学习式稠密跟踪/建图基线
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
