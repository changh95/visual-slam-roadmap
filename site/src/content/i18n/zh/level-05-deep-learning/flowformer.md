# FlowFormer

> Huang 2022 · [论文](https://arxiv.org/abs/2203.16194)

**一句话总结** — 首个围绕4D代价体积构建的光流Transformer架构:它将代价体积token化,通过交替分组注意力将token编码为潜在的"代价记忆(cost memory)",再用动态位置代价查询以循环方式解码光流。

## 问题

光流估计的是一个逐像素位移场$\mathbf{f}:\mathbb{R}^{2}\rightarrow\mathbb{R}^{2}$,将源图像中的每个位置$\mathbf{x}$映射到其在目标图像中的对应点$\mathbf{p}=\mathbf{x}+\mathbf{f}(\mathbf{x})$。RAFT构建了一个$H \times W \times H \times W$的4D代价体积,包含所有像素对的相似度,但只从局部窗口中检索代价值,这在大位移和遮挡场景下表现不佳。Transformer提供了全局推理能力,但对代价体积中数千个token做朴素自注意力在计算上是难以承受的——Perceiver IO转而对原始像素做注意力,但需要多出约80倍的训练样本。FlowFormer探究的问题是:如何在保留紧凑代价体积的同时,获得Transformer风格的全局聚合能力。

## 方法与架构

分三个阶段:构建4D代价体积,将其编码为代价记忆,再循环解码光流。

- **代价体积**:一个在ImageNet上预训练的Twins-SVT骨干网络的前两个阶段提取出$H \times W \times D_f$特征($D_f{=}256$,1/8分辨率);源图像和目标图像所有特征对之间的点积相似度构成$H \times W \times H \times W$的体积,可视为每个源像素$\mathbf{x}$对应一张2D代价图$\mathbf{M_x} \in \mathbb{R}^{H \times W}$。
- **两步token化**:每张代价图先经过三个步长为2的卷积图块化为$8{\times}8$图块特征$\mathbf{F_x}$($D_p{=}64$通道),再通过可学习的编码词$\mathbf{C}\in\mathbb{R}^{K\times D}$(所有像素共享,通过反向传播训练)总结为$K$个潜在token:

$$\mathbf{K_x}=\mathrm{Conv}_{1\times 1}(\mathrm{Concat}(\mathbf{F_x},\mathrm{PE})),\quad \mathbf{V_x}=\mathrm{Conv}_{1\times 1}(\mathrm{Concat}(\mathbf{F_x},\mathrm{PE})),\quad \mathbf{T_x}=\mathrm{Attention}(\mathbf{C},\mathbf{K_x},\mathbf{V_x})$$

  从而将4D体积转变为一个$H \times W \times K$的token网格($K \times D \ll H \times W$;最终模型中为8个128维token)。
- **交替分组Transformer(AGT)层**(最终模型中3层)交替使用两种正交分组方式:*代价图内(intra-cost-map)*自注意力,作用于每个像素的$K$个token,$\mathbf{T_x}=\mathrm{FFN}(\mathrm{SelfAttention}(\mathbf{T_x}(1),\dots,\mathbf{T_x}(K)))$;以及*代价图间(inter-cost-map)*空间可分离自注意力(源自Twins),作用于$K$组各含$H \times W$个token,$\mathbf{T}_i=\mathrm{FFN}(\mathrm{SSSelfAttention}(\mathbf{T}_i))$,并将源图像上下文特征注入query/key中,使视觉上相似的像素获得一致的光流。输出的token即为**代价记忆**。
- **带动态位置代价查询的循环解码器**:在每次迭代中,当前光流给出$\mathbf{p}=\mathbf{x}+\mathbf{f}(\mathbf{x})$;一个局部$9{\times}9$代价图块$\mathbf{q_x}=\mathrm{Crop}_{9\times 9}(\mathbf{M_x},\mathbf{p})$构建query $\mathbf{Q_x}=\mathrm{FFN}(\mathrm{FFN}(\mathbf{q_x})+\mathrm{PE}(\mathbf{p}))$,它对代价记忆做交叉注意力,$\mathbf{c_x}=\mathrm{Attention}(\mathbf{Q_x},\mathbf{K_x},\mathbf{V_x})$(key/value只计算一次并重复使用)。一个ConvGRU回归出残差

$$\Delta\mathbf{f}(\mathbf{x})=\mathrm{ConvGRU}(\mathrm{Concat}(\mathbf{c_x},\mathbf{q_x}),\,\mathbf{t_x},\,\mathbf{f}(\mathbf{x}))$$

  最终光流经凸上采样恢复到全分辨率,每次迭代均以递增权重进行监督。

## 实验结果

- **Sintel测试集(C+T+S+K+H)**:clean通道AEPE为1.159,final通道为2.088——相比此前最好的公开结果(1.388和2.47,来自带热启动的GMA)分别降低16.5%和15.5%的误差,在不使用热启动的情况下两个通道均排名第一;相比不使用热启动的GMA,误差分别降低17.2%/27.5%。
- **泛化能力(仅C+T)**:在Sintel训练集clean/final通道上分别为1.01/2.40 AEPE,在KITTI-2015训练集上为4.09 F1-epe/14.72 F1-all——相比GMA,在Sintel clean/final通道上误差分别降低22.3%和12.4%,在KITTI F1-all上降低13.9%;1.01的clean AEPE比此前最好的公开结果(1.29)低21.7%。
- **KITTI-2015测试集**:经KITTI微调后F1-all为4.68,排名第2(S-Flow的4.64低0.85%,但S-Flow在Sintel clean/final上分别差31.6%/22.5%)。
- 首次验证了在ImageNet上预训练的transformer骨干网络对光流估计有益。

## 对SLAM的意义

稠密光流是现代学习型SLAM前端(DROID-SLAM、DPVO及其后续系统)内部的对应关系引擎,而FlowFormer证明了对匹配代价做全局注意力能够解决对宽基线运动最重要的长程、模糊对应关系问题——恰恰是其代价记忆机制所针对的难例(大位移、遮挡)。它确立了当今这一权衡关系中Transformer一侧的地位——Transformer精度(FlowFormer)对比卷积效率(SEA-RAFT)——这也是SLAM工程师在选择光流骨干网络时要权衡的问题。

## 相关条目

- [RAFT](raft.md) — FlowFormer所token化的代价体积所源自的卷积全对预测前身
- [SEA-RAFT](sea-raft.md) — 注重效率的对照方案,通过训练改进达到与Transformer相当的效果
- [FlowNet 2.0](flownet-2-0.md) — 深度光流中更早的迭代精化谱系
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — 围绕稠密循环光流构建的SLAM系统
- [LoFTR](loftr.md) — 将Transformer注意力应用于无检测器图像匹配
