# XFeat
> Potje 2024 · [论文](https://arxiv.org/abs/2404.19174)

**一句话总结** — 一种超轻量级学习型局部特征(CVPR 2024),使用紧凑的64维描述子,速度比现有深度特征最高快5倍——即使在笔记本电脑CPU上也能实时运行——通过保持较高的空间分辨率同时降低通道数,使学习型匹配在嵌入式硬件上变得切实可行。

## 问题
最先进的学习型特征(SuperPoint、DISK、ALIKE)精度很高,但对于机器人实际搭载的硬件——无人机、AR眼镜、移动机器人——而言太过沉重。瓶颈在于架构本身:精确匹配"需要足够大的图像分辨率",但即便通过一个较小的VGG风格骨干网络处理高分辨率图像也会大幅增加计算量,因为一个卷积层的FLOP数为$F_{ops}=H_i\cdot W_i\cdot C_i\cdot C_{i+1}\cdot k^2$——在早期层中,空间项$H_i W_i$占主导。XFeat重新审视了在硬性算力预算下检测、提取和匹配局部特征的CNN基础设计选择。

## 方法与架构
**超轻量骨干网络。** 从灰度图像$\mathbf{I}\in\mathbb{R}^{H\times W\times 1}$出发,六个卷积块(23层"基本层":卷积核$k\in\{1,3\}$+ReLU+BatchNorm)将分辨率逐步减半,同时通道数以*三倍*(而非两倍)速率增长——从$C=4$增长到$H/32\times W/32$分辨率下的$C=128$,即$\{4,8,24,64,64,128\}$。从仅4个通道开始,使得开销高昂的高分辨率早期层保持极简;三倍速率的增长则在廉价的低分辨率层中恢复了模型容量。

**三个输出头。** 对$\{1/8,1/16,1/32\}$三个尺度进行特征金字塔融合,得到一个稠密的64维描述子图$\mathbf{F}\in\mathbb{R}^{H/8\times W/8\times 64}$,一个可靠性图$\mathbf{R}$(建模$\mathbf{F}_{i,j}$能被自信匹配的概率),以及一个*独立*的关键点分支:图像被重塑为$8\times 8$的格子(64维向量),快速的$1\times1$卷积在64个格子位置加一个垃圾桶中对关键点位置进行分类,即$\mathbf{K}\in\mathbb{R}^{H/8\times W/8\times 65}$(类似SuperPoint风格,但是解耦的——对于紧凑的CNN,联合训练会降低半稠密匹配的效果)。

**半稠密匹配精细化。** 不同于(LoFTR风格的)细粒度特征图,一个MLP仅凭一对匹配的粗粒度描述子来预测像素偏移量:$\mathbf{o}=\text{MLP}(\text{concat}(\mathbf{f}_a,\mathbf{f}_b))$,偏移量的选取方式为:

$$(x,y)=\operatorname*{arg\,max}_{i,j\in\{1,\dots,8\}}\mathbf{o}(i,j)$$

其中$\mathbf{o}\in\mathbb{R}^{8\times 8}$保存偏移量的logits——完全不依赖任何高分辨率特征即可实现半稠密匹配。

**训练。** 在MegaDepth和经合成变换的COCO数据(按6:4混合,分辨率800×600)上,使用像素级对应关系进行监督,采用多任务损失$\mathcal{L}=\alpha\mathcal{L}_{ds}+\beta\mathcal{L}_{rel}+\gamma\mathcal{L}_{fine}+\delta\mathcal{L}_{kp}$:对描述子采用基于相似度矩阵$\mathbf{S}=\mathbf{F}_1\mathbf{F}_2^{\mathsf T}$的双softmax负对数似然损失,一个L1损失$\mathcal{L}_{rel}=|\sigma(\mathbf{R}_1)-\bar{\mathbf{R}}_1\odot\bar{\mathbf{R}}_2|+|\sigma(\mathbf{R}_2)-\bar{\mathbf{R}}_1\odot\bar{\mathbf{R}}_2|$将可靠性与双softmax置信度绑定,对偏移logits采用负对数似然损失,以及从ALIKE-tiny蒸馏而来的关键点损失。训练在单张RTX 4090上36小时内收敛,占用6.5 GB显存。推理:稀疏模式(XFeat,通过$\mathbf{K}_{i,j}\cdot\mathbf{R}_{i,j}$打分选出4096个关键点+互近邻匹配)或半稠密模式(XFeat*,选取前1万个可靠特征并进行偏移精细化)。

## 实验结果
- **MegaDepth-1500相对位姿**(LO-RANSAC,i5-1135G7 CPU上、VGA分辨率下的FPS):XFeat在27.1 FPS下达到42.6的AUC@5°,相比SuperPoint在3.0 FPS下为37.3(快9倍),ALIKE在5.3 FPS下为49.4(快5倍)。XFeat*在19.2 FPS下达到50.2/65.4/77.1的AUC@5°/10°/20°,内点数1885——在较宽松的阈值下以及在MIR指标上(0.74 vs 0.71)超过DISK*(1.2 FPS下为55.2/66.8/75.3,速度快16倍)。
- **ScanNet-1500(室内场景,未重新训练)**:XFeat/XFeat*的AUC@5°分别为16.7/18.4,相比SuperPoint为12.5,DISK为9.6/11.3——泛化性更好;DISK和ALIKE表现出对特定数据集地标场景的偏置。
- **HPatches单应性**:MHA@3在光照场景下为95.0,视角场景下为68.6,与最精确的描述子相当。
- **对比学习型匹配器**:XFeat*在CPU上为1.33对/秒,相比LoFTR为0.06(快22倍),以精度换速度(50.2 vs 68.3的AUC@5°);在两方面都超过了Patch2Pix(47.8)。
- **嵌入式设备**:在一台28美元的Orange Pi Zero 3(Cortex-A53)上,XFeat能达到1.8 FPS,相比SuperPoint为0.16,ALIKE为0.58——是唯一超过1 FPS的学习型方法。

## 对SLAM的意义
学习型特征在鲁棒性上已明显超越手工设计的特征(ORB、SIFT),但其计算开销使其难以进入嵌入式平台上的实时SLAM前端。XFeat是学习型特征变得足够廉价、可以嵌入机器人实际搭载硬件上运行的SLAM管线的一个节点。搭配LightGlue这类轻量级匹配器,它能在边缘设备上以帧率实现完整的学习型前端(检测、描述、匹配)。

## 相关条目
- [SuperPoint](superpoint.md) — XFeat所对标的标准学习型特征。
- [LightGlue](lightglue.md) — 常与XFeat搭配使用的高效学习型匹配器。
- [LoFTR](loftr.md) — 无检测器的稠密匹配替代方案,XFeat的半稠密模式以远低的成本对其进行了近似。
- [DISK](disk.md) — 精度更高但更重的学习型特征,体现了精度与速度的权衡。
- [Learned vs hand-crafted](learned-vs-hand-crafted.md) — 相关的设计理念之争。
- [Edge deployment](../level-02-getting-familiar/edge-deployment.md) — XFeat所面向的部署场景。
