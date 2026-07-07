# RAFT

> Teed 2020 · [论文](https://arxiv.org/abs/2003.12039)

**一句话总结** — 构建一个4D全对相关性体,并用一个权重共享的ConvGRU围绕当前估计值查询相关性,迭代细化单一的高分辨率光流场——ECCV 2020最佳论文,也是现代光流的代表性架构。

## 问题

主流的深度光流架构(PWC-Net及其同类)继承了经典的由粗到精金字塔:在低分辨率下估计光流,然后变形并细化。这种设计存在结构性的盲区——每一级的代价体只覆盖一个很小的搜索窗口,小而快速移动的物体在粗分辨率下会消失,金字塔早期阶段犯下的错误难以纠正,而多阶段级联往往需要超过100万次的训练迭代。此前的迭代细化方案没有在各次迭代之间共享权重(或者像IRR那样受限于其庞大的循环单元)。RAFT探究的问题是:如果网络预先计算*所有*像素对之间的匹配代价,并用一个轻量级的学习式优化器按需查询该体来细化单一的高分辨率光流场,会怎样?

## 方法与架构

三个阶段,均可微且端到端训练:

1. **特征提取**:一个编码器$g_\theta : \mathbb{R}^{H \times W \times 3} \mapsto \mathbb{R}^{H/8 \times W/8 \times D}$($D = 256$,6个残差块)对两帧进行编码;一个结构相同的上下文网络$h_\theta$仅对$I_1$进行编码。两者每对帧只运行一次。
2. **全对相关性**:视觉相似度通过一次矩阵乘法为每一对像素预先计算好,

$$C_{ijkl} = \sum_h g_\theta(I_1)_{ijh} \cdot g_\theta(I_2)_{klh}, \qquad \mathbf{C} \in \mathbb{R}^{H \times W \times H \times W}$$

   随后最后两个维度用核大小1、2、4、8做平均池化,构成金字塔$\{\mathbf{C}^1, \mathbf{C}^2, \mathbf{C}^3, \mathbf{C}^4\}$。只对$I_2$的维度做池化,使$I_1$的维度保持在完整(1/8)分辨率——大位移和小位移都能被捕捉到,而不会丢失小而快速移动的物体。一个查询算子$L_\mathbf{C}$在当前对应关系$\mathbf{x}' = \mathbf{x} + \mathbf{f}(\mathbf{x})$周围的局部网格上对每一级做双线性采样,

$$\mathcal{N}(\mathbf{x}')_r = \{ \mathbf{x}' + \mathbf{dx} \mid \mathbf{dx} \in \mathbb{Z}^2,\ \lVert \mathbf{dx} \rVert_1 \le r \}$$

   在每一级$k$以$\mathcal{N}(\mathbf{x}'/2^k)_r$索引——恒定的半径在更粗的层级上对应更大的上下文范围(在$k=4$时半径4对应原始分辨率下的256像素)。
3. **迭代更新**:从$\mathbf{f}_0 = \mathbf{0}$出发,一个循环更新算子(仅270万参数,权重在所有迭代间共享)输入相关性查询结果、光流特征以及上下文特征$x_t$,并通过一个卷积GRU发出残差更新$\mathbf{f}_{k+1} = \mathbf{f}_k + \Delta\mathbf{f}$:

$$z_t = \sigma(\mathrm{Conv}_{3\times3}([h_{t-1}, x_t], W_z)), \qquad r_t = \sigma(\mathrm{Conv}_{3\times3}([h_{t-1}, x_t], W_r))$$

$$\tilde{h}_t = \tanh(\mathrm{Conv}_{3\times3}([r_t \odot h_{t-1}, x_t], W_h)), \qquad h_t = (1 - z_t) \odot h_{t-1} + z_t \odot \tilde{h}_t$$

   该算子模拟了一个一阶优化器——但它不是使用泰勒线性化的数据项,而是*学习*提出下降方向;有界的激活函数促使其收敛到一个不动点,并且可以运行100次以上的迭代而不发散。光流在1/8分辨率下被预测,再通过在每个像素3x3粗邻域上学习到的凸组合进行上采样(权重通过softmax得到)。

监督覆盖了整个估计序列,权重随迭代次数指数增加:

$$\mathcal{L} = \sum_{i=1}^{N} \gamma^{N-i} \lVert \mathbf{f}_{gt} - \mathbf{f}_i \rVert_1, \qquad \gamma = 0.8$$

训练依次在FlyingChairs、FlyingThings上进行,再在基准数据集上微调;在视频上,warm-start初始化会将前一帧的光流前向投影过去。

## 实验结果

- **Sintel(final通道,测试集)**:EPE为2.855像素,相比已发布最佳结果(4.098像素)误差降低30%;在clean和final两个通道上均排名第一。**KITTI**:F1-all为5.10%,相比已发布最佳结果(6.10%)降低16%,在所有光流方法中排名第一。
- **泛化性**:仅在合成的C+T数据上训练,在KITTI-15(训练集)上EPE为5.04像素,而此前最好的深度网络为8.36(降低40%);Sintel训练集clean通道EPE为1.43,比FlowNet2低29%。
- **效率**:在1088x436视频上达到10fps(GTX 1080Ti);训练所需迭代次数比其他架构少10倍;仅100万参数的RAFT-S优于体积均大6倍以上的PWC-Net和VCN。消融实验中,RAFT在3次更新迭代后就超越了PWC-Net,在6次后超越了FlowNet2;可扩展到1080p的DAVIS视频(12次迭代耗时550毫秒,其中全对相关性占95毫秒)。
- 消融实验验证了每一项设计选择:GRU优于普通卷积,权重共享优于不共享,全对相关性优于窗口化相关性及基于变形的细化,学习式上采样优于双线性上采样。

## 对SLAM的意义

RAFT"相关性体+迭代循环细化"的方案成为了SLAM中学习式数据关联的主力工具:DROID-SLAM和DPVO本质上就是包裹着可微光束法平差层的RAFT式更新算子。其衍生方法(用于场景流的RAFT-3D,面向实时应用的SEA-RAFT)主导了光流基准测试,而它所推广的展开式学习优化模式如今已出现在稠密预测和SLAM系统的各个角落。

## 相关条目

- [PWC-Net](pwc-net.md) — 它所取代的由粗到精前身方法
- [RAFT-3D](raft-3d.md) — 扩展到3D场景流并带刚体运动嵌入
- [SEA-RAFT](sea-raft.md) — 简单、高效、实时的RAFT变体
- [FlowFormer](flowformer.md) — 基于Transformer的代价体推理后继方法
- [DROID-SLAM](droid-slam.md) — 将RAFT机制转化为完整SLAM系统
- [DPVO](dpvo.md) — 出自同一谱系的基于稀疏patch的里程计
