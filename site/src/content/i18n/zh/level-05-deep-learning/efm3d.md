# EFM3D

> Straub (Meta) 2024 · [论文](https://arxiv.org/abs/2406.10224)

**一句话总结** — Meta Reality Labs推出的基准,用于衡量迈向3D第一视角基础模型(3D Egocentric Foundation Models)的进展——在带标注的Project Aria第一视角视频上进行3D物体检测和表面回归——并提出EVL基线,将冻结的2D基础模型特征提升到一个与重力方向对齐的3D体素网格中。

## 问题

可穿戴计算设备为AI创造了一种新的情境来源:第一视角传感器数据自带精细的3D位置信息(位姿、标定、半稠密SLAM点)。这为一类根植于3D空间的*空间*基础模型打开了机会——作者称之为第一视角基础模型(Egocentric Foundation Models,EFM)——但若没有基于高质量、带3D标注的第一视角数据构建的基准,就无法衡量进展。现有的3D数据集大多是RGB-D扫描序列(ScanNet、ARKitScenes)或以"覆盖"所有表面为运动目标的仿真数据;而Aria数据则不同,它只有一路RGB流和两路灰度流,只有稀疏的半稠密深度,以及真实的头部运动模式——这些差异会破坏那些专为RGB-D扫描场景设计的模型。

## 方法与架构

**数据集贡献。** (i) 针对仿真的Aria Synthetic Environments(ASE)数据集,提供约300万个跨43个类别的3D有向边界框(OBB),并附带逐图像的可见性元数据;(ii) Aria Everyday Objects(AEO),一个真实世界验证集,包含26个场景、584个OBB实例,覆盖9个类别,由非专业人员拍摄以获得真实的第一视角运动;(iii) 为ASE验证集划分以及真实的Aria Digital Twin(ADT)数据集提供真值网格。

**EVL(Egocentric Voxel Lifting,第一视角体素提升)**是一个通用的3D骨干网络:一个冻结的2D基础模型(DINOv2.5)在每段视频每路流的$T$个已知位姿帧上运行;特征被上采样,然后将一个以最新的重力对齐RGB位姿为锚点的局部重力对齐$4m^3$体素网格的中心,用经过标定的鱼眼模型投影到每张图像中并双线性采样,得到每路流一个$T\times F\times D\times H\times W$的体积。特征在流和时间维度上通过均值和标准差聚合($2F\times D\times H\times W$)。半稠密SLAM点贡献两个二值掩码——一个表面点掩码和一个沿观测射线采样得到的自由空间掩码——被拼接到该体积上,随后由一个3D U-Net(8倍下采样/上采样)处理。任务头在输出体积上运行:

- **3D OBB头**(无proposal、无anchor,受ImVoxelNet启发):对每个体素预测一个中心度得分$v^{c}$、类别分布$v^{cls}$以及7个边界框参数$v^{obb}$(尺寸、中心偏移、绕重力方向的偏航角),再经3D-IoU NMS过滤。设$N_v$为体素数,FL为focal loss:

$$L_{obj}=\frac{1}{N_{v}}\sum^{N_{v}}_{n} w_{c}\,\mathrm{FL}(v_{n}^{c},\widehat{v_{n}^{c}})+w_{iou}\,\mathrm{IoU}(v_{n}^{obb},\widehat{v_{n}^{obb}})+w_{cls}\,\mathrm{FL}(v_{n}^{cls},\widehat{v_{n}^{cls}})$$

- **占据头**用于表面回归,监督方式是对每个真值深度值采样一个自由点、一个表面点和一个占据点(目标概率分别为0.0/0.5/1.0),再加上一个总变差平滑项:

$$L_{surf}=\frac{1}{N}\sum^{N}_{n}\mathrm{FL}(p_{\text{free}}^{n},0.0)+\mathrm{FL}(p_{\text{surf}}^{n},0.5)+\mathrm{FL}(p_{\text{occ}}^{n},1.0)$$

训练使用1秒、10Hz的片段,检测任务使用6.25厘米体素($64^3$),表面任务使用4厘米体素($96^3$),采用Adam优化器,学习率$2e^{-4}$,权重设置为$w_{cent}=100$、$w_{iou}=10$、$w_{class}=1$;在序列级评估中,通过OBB跟踪/融合以及占据的滑动平均融合加marching cubes来持续保留预测结果。

## 实验结果

- **3D OBB检测**(在IoU阈值0.0–0.5上平均的mAP):EVL在ASE上达到**0.40片段mAP/0.75序列mAP,在真实AEO上达到0.22**,而ImVoxelNet为0.30/0.64/0.15,3DETR为0.24/0.33/0.16,在ASE上训练的Cube R-CNN为0.21/0.36/0.08。序列级跟踪使所有方法的片段mAP大致翻倍。
- **仿真到真实的差距**:基于图像的模型在AEO上下降最大(Cube R-CNN -32,ImVoxelNet -49,EVL -48 mAP),而仅使用点的3DETR只下降-17 mAP——但EVL在仿真和真实数据上都仍是最好的。
- **表面重建**(ASE验证集):EVL达到Acc 0.057米/Comp 0.877米/Prec 0.822/Recall 0.405(5厘米阈值),而在ASE上重新训练的NeuralRecon为0.212/1.103/0.512/0.241;在真实的ADT上,EVL以0.182米Acc和0.594 Prec领先。基于深度的基线方法(ZoeDepth、SimpleRecon、ConsistentDepth)由于尺度模糊和噪声墙面而融合效果较差。
- 消融实验:几何数据增强、均值+标准差聚合、以及点/自由空间双掩码,每一项都能明显提升mAP(综合从0.26提升到0.39片段mAP)。

## 对SLAM的意义

AR眼镜是SLAM的主要商业驱动力之一,而EFM3D定义了在这一场景下"良好的3D感知"意味着什么:在由人类头部运动主导的可穿戴设备上,实现度量精确、3D一致的场景理解。它揭示了该领域的发展方向——由SLAM提供的位姿、标定和半稠密点成为支撑3D提升的基础设施(EVL的掩码本质上就是SLAM的输出),而大型第一视角感知模型又反过来将语义先验反馈给空间跟踪系统。

## 相关条目

- [Foundation models](foundation-models.md) — 该基准所针对的建模范式
- [Depth Anything](depth-anything.md) — 此处所评测的一类大规模深度模型的代表
- [DETR](detr.md) — 现代3D检测器背后的检测架构谱系
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md) — 第一视角机器感知这一更广阔愿景
