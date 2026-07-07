# MASt3R

> Leroy 2024 · [论文](https://arxiv.org/abs/2406.09756)

**一句话总结** — 通过在DUSt3R上增加一个稠密局部特征头，将图像匹配建立在3D基础之上，把基础模型对极端视角变化的鲁棒性与经典匹配器的像素级精确对应结合在一起。

## 问题

图像匹配是所有表现最好的3D视觉流程的核心组件，然而"尽管匹配从根本上是一个3D问题，本质上与相机位姿和场景几何相关联，但它通常被当作一个2D问题来处理"。经典和基于学习的2D匹配器在极端视角变化下会失效——LoFTR在Map-free数据集上的VCRE精度仅为34%；而DUSt3R的点图回归对这类条件表现出极强的鲁棒性，并在Map-free排行榜上名列前茅，但由于回归本身带有噪声，且DUSt3R从未针对匹配任务进行训练，其匹配结果并不精确。MASt3R（"Matching And Stereo 3D Reconstruction"）保留了鲁棒性，同时修正了精度问题。

## 方法与架构

**基础（DUSt3R框架）**：一个孪生ViT编码器$H^1 = \text{Encoder}(I^1)$，$H^2 = \text{Encoder}(I^2)$，两个通过交叉注意力交换信息的相互耦合的解码器，$H'^1, H'^2 = \text{Decoder}(H^1, H^2)$，以及从拼接的编码器/解码器特征回归点图和置信度的3D头：$X^{1,1}, C^1 = \text{Head}^1_{3D}([H^1, H'^1])$，两个点图都表示在相机1的坐标系下。

**度量预测**：DUSt3R的回归损失$\ell_{\text{regr}}(v,i) = \| X_i^{v,1}/z - \hat{X}_i^{v,1}/\hat{z} \|$会用尺度因子对预测值和真实值分别做归一化；MASt3R在真实值为度量尺度时设定$z := \hat{z}$，使网络学习到*度量尺度*的几何——这是无地图定位的前提条件。保留了带置信度加权的损失$\mathcal{L}_{\text{conf}} = \sum_{v} \sum_{i} C_i^v \ell_{\text{regr}}(v,i) - \alpha \log C_i^v$。

**匹配头**：一个新的头（带GELU的2层MLP，输出被归一化为单位范数）附加在每个解码器上，回归出稠密的$d$维特征图$D^1, D^2 \in \mathbb{R}^{H \times W \times d}$。它使用针对真实对应关系$\hat{\mathcal{M}} = \{(i,j) \mid \hat{X}_i^{1,1} = \hat{X}_j^{2,1}\}$的InfoNCE损失进行训练：

$$\mathcal{L}_{\text{match}} = -\sum_{(i,j) \in \hat{\mathcal{M}}} \log \frac{s_\tau(i,j)}{\sum_{k \in \mathcal{P}^1} s_\tau(k,j)} + \log \frac{s_\tau(i,j)}{\sum_{k \in \mathcal{P}^2} s_\tau(i,k)}, \qquad s_\tau(i,j) = \exp\left[-\tau D_i^{1\top} D_j^2\right].$$

这本质上是一种交叉熵分类：与回归不同，网络只有在恰好找准像素时才会获得奖励，这迫使其学习出高精度的描述符。总目标函数为：$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{conf}} + \beta \mathcal{L}_{\text{match}}$。

**快速互相匹配（FRM）**：朴素地提取互为最近邻$\mathcal{M} = \{(i,j) \mid j = \text{NN}_2(D_i^1) \text{ and } i = \text{NN}_1(D_j^2)\}$的开销为$O(W^2H^2)$——比网络推理本身还慢。FRM转而从规则网格上的$k$个像素出发，迭代进行最近邻往返$U^t \to V^t \to U^{t+1}$，收集回到起点的像素（形成环即为互相匹配），并过滤掉已收敛的像素。复杂度降为$O(kWH)$，几乎快了两个数量级，并具有收敛性保证——其隐含的异常值过滤甚至比穷举匹配*提升*了位姿精度。

**由粗到细匹配**：注意力机制的计算量随图像面积呈平方增长，因此MASt3R最大只处理长边为512像素的图像。高分辨率图像先进行粗略匹配；粗略的对应关系随后指导对枚举出的局部裁剪块的匹配，细化后的匹配再映射回全分辨率。

## 实验结果

- **Map-free重定位（测试集）**：使用其自身的度量深度获得93.3%的VCRE AUC——相较于此前最好的已发表方法LoFTR+KBR（63.4%，DUSt3R为69.7%）绝对提升了30个百分点——中位平移误差降至0.36 m，而此前最先进方法约为2 m。
- **相对位姿**（CO3Dv2/RealEstate10K，每序列10帧，无真实焦距）：CO3Dv2上RRA@15为94.6，RTA@15为91.9，mAA(30)为81.8；RealEstate10K上mAA(30)为76.4——而DUSt3R分别为77.2和61.2，且RealEstate10K在训练中完全未见过。
- **DTU上的零样本MVS**：仅通过对匹配点三角化即得到整体Chamfer距离0.374 mm（准确度0.403，完整度0.344）——相较DUSt3R的1.741，且接近于在领域内训练的方法GeoMVSNet（0.295），而这一切都没有在DTU上训练过，也没有为匹配使用标定信息。
- **视觉定位**：在InLoc上显著超越现有最先进方法，在Aachen Day-Night上也具有竞争力；即使仅从单张检索到的图像（top1）出发也能良好定位，展示了3D基础匹配的鲁棒性。
- 消融实验：仅用匹配损失训练会降低位姿精度（中位旋转误差10.8°，而两种损失联合训练为3.0°）——将匹配建立在3D重建基础上正是其有效的关键。

## 对SLAM的意义

MASt3R将DUSt3R系列从一个重建方面的新奇成果转变为一个实用的前端：单次前向传播即可获得对应关系加度量点图，可用于重定位、SfM和SLAM。对于SLAM流程来说，它将特征检测、描述、匹配和双视图几何这几个经典阶段压缩为一个学习到的组件，其失效模式源于基础模型本身，而不是角点稀缺或视角变化。它是MASt3R-SLAM、MASt3R-SfM和MASt3R-Fusion的直接基础。

## 相关条目

- [DUSt3R](dust3r.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [MASt3R-Fusion](mast3r-fusion.md)
- [SuperGlue](../level-05-deep-learning/superglue.md)
- [LoFTR](../level-05-deep-learning/loftr.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)
