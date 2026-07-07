# IGGT

> Li 2025 · [论文](https://arxiv.org/abs/2510.22706)

**一句话总结** —— 一种实例感知的几何Transformer(instance-grounded geometry transformer),将前馈式3D重建与实例级场景理解统一到单一模型中,而不是在单独重建出的地图上再嫁接语义信息。

## 问题

人类感知几何结构与语义内容是相互交织的,但大多数流水线将两者分开处理:大型几何模型(DUSt3R/VGGT系列)被训练用于低层次的3D重建,而高层次的空间理解则被单独处理——这"限制了泛化能力,并导致下游3D理解任务性能不佳"。近期的一些改进方法将3D模型与某个特定的视觉-语言模型对齐,但这会过度平滑精细的几何细节,将感知能力限制在被对齐模型的能力上限(例如LSeg),并且——由于VLM特征是类别级别的——无法区分同一类别下的不同物体,在大视角变化下会破坏实例跟踪。

## 方法与架构

IGGT在一次前向传播中将 $N$ 幅图像映射为几何信息*和*实例特征:

$$\mathcal{F}: \{I_i\}_{i=1}^{N} \mapsto (t_i, D_i, P_i, S_i)_{i=1}^{N},$$

其中 $t_i$ 是相机参数,$D_i$ 是深度图,$P_i$ 是点图,$S_i$ 是3D一致的实例级特征图。

- **大型统一Transformer**:一个10亿参数的VGGT风格骨干网络——DINOv2的patch token加上每个视角一个可学习的相机token,随后是24个模块,交替进行视角内自注意力与全局跨视角注意力,为每幅图像生成统一token $\mathbf{T}_i \in \mathbb{R}^{M \times D}$。
- **两个输出头**:几何头(相机、深度、点预测器,DPT风格,继承自VGGT)和实例头,二者对同一组token进行解码:$\{F^{pt}_i\} = \Phi_{pt}(\{\mathbf{T}_i\})$,$\{F^{ins}_i\} = \Phi_{ins}(\{\mathbf{T}_i\})$。
- **跨模态融合模块**:滑动窗口跨注意力将像素级几何特征注入实例分支(避免二次方复杂度的全局注意力):
  $$\hat{F}_{i,(l)}^{ins} = F_{i,(l)}^{ins} + \mathcal{F}_{\text{win}}\left(Q = F_{i,(l)}^{ins},\; K = F_{i,(l)}^{pt},\; V = F_{i,(l)}^{pt}\right),$$
  从而强化物体边界与空间布局感知。经过精炼的特征被投影为8维实例嵌入 $O_{ins}$。
- **3D一致对比学习**:在采样的像素 $\mathcal{P}$ 上,同一物理实例(实例ID $m(p)$)的特征在各视角间被拉近,不同实例的特征以边界 $M$ 被推远:
  $$\mathcal{L}_{mvc} = \lambda_{pull} \sum_{m(p_i) = m(p_j)} d(f_{p_i}, f_{p_j}) + \lambda_{push} \sum_{m(p_i) \neq m(p_j)} \max\left(0,\, M - d(f_{p_i}, f_{p_j})\right),$$
  其中 $d$ 是归一化特征之间的L2距离。总损失为 $\mathcal{L}_{overall} = \mathcal{L}_{pose} + \mathcal{L}_{depth} + \mathcal{L}_{pmap} + \mathcal{L}_{mvc}$(几何相关项遵循VGGT的训练方案)。
- **实例感知的场景理解**:推理阶段,HDBSCAN对多视角实例特征进行聚类得到 $K$ 个实例,产生3D一致的2D实例掩码。这些掩码是连接到任何VLM/LMM的*桥梁*,可即插即用:掩码池化的OpenSeg/CLIP特征给出开放词汇分割;通过LMM(如Qwen2.5-VL、GPT-4o)查询掩码高亮的视角给出问答式场景定位。系统中并未固化绑定任何特定的语言模型。
- **InsScene-15K**:一个包含15,000个场景的数据集(RGB、姿态、深度、3D一致的实例掩码),数据来源为合成数据(Aria、Infinigen)、视频(RE10K,通过SAM + SAM2传播并配合关键帧重新播种)以及RGB-D数据(ScanNet++,通过投影3D标注并由SAM2提议精炼)。IGGT从VGGT权重初始化,并在8块A800上微调2天。

## 实验结果

在ScanNet和ScanNet++上评测(各10个场景,每场景8-10张图像):

- **实例空间跟踪**:在ScanNet上T-mIoU为**69.41**、T-SR为**98.66**,在ScanNet++上分别为**73.02**和**98.90**,而SAM2*为53.74/71.25和44.16/57.89,SpaTracker+SAM为26.43/38.57和16.15/23.68——在基线方法因大幅相机运动而丢失目标物体的场景中,IGGT达到近乎完美的成功率。
- **开放词汇分割**:在ScanNet++上,2D mIoU为31.31、mAcc为70.78——较其他方法领先8.34%的mIoU与7.88%的mAcc;相比此前方法,3D mIoU在ScanNet上提升4.31%(39.68)、在ScanNet++上提升4.97%(20.14)。
- **重建质量未被牺牲**:在ScanNet上深度绝对相对误差(Abs. Rel)为1.90,与VGGT的1.84相当;在ScanNet++上则*优于*VGGT,Abs. Rel低0.14(2.61对2.75),内点率(inlier ratio)高0.25(85.66对85.41)——说明联合语义训练反过来促进了几何质量。
- 在LERF-OVS(Teatime)上的问答定位演示表明,实例感知的LMM查询在多视角一致性上优于直接使用Gemini 2.5 Pro提示。

## 对SLAM的意义

DUSt3R/VGGT系列的发展趋势是让基础模型为SLAM系统免费提供稠密几何信息;IGGT把这一趋势扩展到场景中"有什么",而不仅仅是"表面在哪里"。对于Spatial AI而言——操作、语义导航、AR——一张被分割为3D一致的物体实例的地图,远比原始几何信息更具可操作性,并且在一个前馈模型内部完成这件事,可以避免将逐帧2D分割(SAM掩码、CLIP特征)拼接到3D地图上所带来的不一致性。将掩码作为桥梁的设计还意味着,随着更好的VLM出现,语义部分可以免费升级。

## 相关条目

- [VGGT](vggt.md)
- [DUSt3R](dust3r.md)
- [VGGT-SLAM](vggt-slam.md)
- [ConceptFusion](conceptfusion.md)
- [ConceptGraphs](conceptgraphs.md)
- [SAM 2](sam-2.md) —— 用于构建InsScene-15K的实例掩码
