# Metric3D

> Yin 2023 · [论文](https://arxiv.org/abs/2307.10984)

**一句话总结** — 跨数千种不同相机的零样本*度量*单目深度估计，通过将每张训练图像（或其标签）转换到一个消除焦距歧义的规范相机空间来实现。

## 问题

单图像度量深度陷入两种失效模式之间。最先进的度量模型只能处理单一相机模型，且由于度量歧义无法在混合数据上训练：在针孔投影下，真实尺寸为$\hat{S}$的物体在成像尺寸$\hat{S}'$下满足

$$d_a = \hat{S}\,\frac{\hat{f}}{\hat{S}'} = \hat{S}\cdot\alpha$$

因此在不同的焦距$\hat{f}$下，同样的像素模式对应不同的度量深度（相比之下，实验表明传感器尺寸和像素尺寸并不重要）。在大规模混合数据集（MiDaS风格）上训练的模型，只能通过退回到仿射不变深度来实现零样本泛化，而这无法恢复真实世界的尺度。Metric3D表明，实现零样本度量模型的关键在于将大规模混合数据训练与对这种相机歧义的显式解决相结合。

## 方法与架构

**规范相机空间变换（CSTM）。** 固定一个规范焦距$f^c$，用以下两种等效方式之一将所有训练数据转换为仿佛由该相机拍摄的样子：

- *CSTM_label*：保留图像不变，将真值深度按$\omega_d = \frac{f^c}{f}$缩放，即$\mathbf{D}^*_c = \omega_d \mathbf{D}^*$；
- *CSTM_image*：将图像（及光心）按$\omega_r = \frac{f^c}{f}$缩放，即$\mathbf{I}_c = \mathcal{T}(\mathbf{I}, \omega_r)$，标签调整大小但不缩放数值。

随后进行随机裁剪（这只改变视场角和光心，不改变度量值）。网络$\mathcal{N}_d$在规范空间中训练，$\min_\theta \left|\mathcal{N}_d(\mathbf{I}_c, \theta) - \mathbf{D}^*_c\right|$，推理时通过**去规范化**将预测结果转换回真实相机——例如对CSTM_label而言，$\mathbf{D} = \frac{1}{\omega_d}\mathbf{D}_c$。测试时只需要焦距；该模块可插入任何现有的单目深度模型。

**随机提议归一化损失（RPNL）。** 整图尺度-偏移归一化会压缩细粒度的局部深度对比度，因此随机裁剪出$M=32$个patch $p_i$（图像大小的0.125–0.5），每个patch在L1比较之前先按中位数绝对偏差归一化：

$$L_{RPNL} = \frac{1}{MN}\sum_{p_i}^{M}\sum_{j}^{N}\left|\frac{d^*_{p_i,j}-\mu(d^*_{p_i,j})}{\frac{1}{N}\sum_j |d^*_{p_i,j}-\mu(d^*_{p_i,j})|} - \frac{d_{p_i,j}-\mu(d_{p_i,j})}{\frac{1}{N}\sum_j |d_{p_i,j}-\mu(d_{p_i,j})|}\right|$$

其中$\mu(\cdot)$为中位数。总损失为$L = L_{PWN} + L_{VNL} + L_{silog} + L_{RPNL}$（成对法向量回归、虚拟法向量、尺度不变对数损失，加上RPNL）。

**骨干网络与训练。** 一个带ConvNeXt-Large编码器（ImageNet-22K初始化）的UNet，在11个公开RGB-D数据集上训练——超过800万张图像，涉及超过1万种相机，且均已知内参，每个mini-batch内做平衡采样，裁剪为$512\times 960$，在48块A100 GPU上训练50万次迭代。若不使用CSTM，同一模型在混合度量数据上无法收敛；将内参编码为额外输入通道（CamConvs）可以训练，但表现明显更差。

## 实验结果

Metric3D在7个零样本基准上取得了最先进的性能，并夺得第二届单目深度估计挑战赛冠军。在零样本设置下（从未在这两个数据集上训练），CSTM_label在NYUv2上达到$\delta_1$ 0.944 / AbsRel 0.083，在KITTI上达到$\delta_1$ 0.964 / AbsRel 0.058——与完全监督的域内最先进方法相当（NeWCRFs：0.922 / 0.095 和 0.974 / 0.052）。来自单张图像的度量点云使得仅凭元数据中的内参就能在Flickr照片上进行野外测量。对于SLAM，将其度量深度直接输入Droid-SLAM，在KITTI里程计上大幅降低了平移漂移$t_{rel}$：序列00从33.9降至1.44，序列02从34.88降至2.64，序列05从23.4降至1.44，序列09从21.7降至1.63——远低于ORB-SLAM2（例如序列00为11.43）——同时还能实现度量尺度的密集建图；在较小的室内ETH3D SLAM场景上的提升较小。

## 对SLAM的意义

SLAM需要*度量*深度——相对深度无法为单目系统锚定尺度，也无法用于度量地图融合。Metric3D的规范相机归一化成为相机无关度量深度的标准方案（被UniDepth、Depth Pro等采用；Metric3D v2增加了ViT骨干网络和表面法向量），使得无论机器人搭载何种相机，都能即插即用深度先验，而无需针对特定相机进行微调。其自身的实验直接展示了这一收益：配备其深度的单目SLAM系统表现如同RGB-D SLAM，尺度漂移基本被消除。

## 相关条目

- [MiDaS](midas.md) — 忽略尺度的相对深度基线
- [ZoeDepth](zoedepth.md) — 通往度量深度的另一条路线——度量分箱方法
- [Depth Anything V2](depth-anything-v2.md) — 深度基础模型谱系中的数据扩展后继者
- [DROID-SLAM](droid-slam.md) — Metric3D在KITTI上将其深度接入的SLAM系统
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md) — 造成这种歧义的内参
