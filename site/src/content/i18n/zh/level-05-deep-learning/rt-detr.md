# RT-DETR

> Zhao (Baidu) 2023 · [论文](https://arxiv.org/abs/2304.08069)

**一句话总结** — 首个实时端到端Transformer检测器，在保持DETR简洁的无NMS集合预测的同时，速度可与YOLO媲美("DETRs Beat YOLOs on Real-time Object Detection")。

## 问题

YOLO系列凭借合理的速度/精度折中主导了实时检测领域，但其速度和精度都受到NMS后处理的负面影响：需要针对具体场景调整两个阈值(置信度和IoU)，且NMS的执行时间会随边界框数量变化。论文对此进行了量化——对于YOLOv8，将置信度阈值从0.001调整到0.05会使AP从52.9%降至51.2%，而NMS耗时从2.36 ms降到1.06 ms；基于anchor的YOLO产生的框数量约为无anchor版本的3倍，因此需要更多NMS时间。端到端Transformer检测器(DETR)通过二分图匹配消除了NMS，但其计算成本——尤其是多尺度Transformer编码器，占Deformable-DETR的GFLOPs的49%，却只贡献了11%的AP——使其无法进入实时区间。

## 方法与架构

RT-DETR = 骨干网络 + 高效混合编码器 + 带辅助预测头的Transformer解码器。骨干网络的最后三个阶段$\{\mathcal{S}_3, \mathcal{S}_4, \mathcal{S}_5\}$输入编码器；解码器迭代地将一组固定的目标查询精炼为(类别，边界框)对——无anchor，无NMS。

**高效混合编码器**将原始多尺度编码器同时完成的两项任务解耦：

- **AIFI**(基于注意力的尺度内特征交互，Attention-based Intra-scale Feature Interaction)：单层Transformer自注意力仅应用于最高层特征$\mathcal{S}_5$——高层特征承载着值得关联的语义概念，而在较低层上做尺度内注意力是冗余的(将注意力限制在$\mathcal{S}_5$上使变体D速度提升35%，AP还提高0.4%)。
- **CCFF**(基于CNN的跨尺度特征融合，CNN-based Cross-scale Feature Fusion)：一种PANet风格的卷积融合路径，其融合模块(两个$1\times1$卷积 + $N$个RepBlock，逐元素相加)合并相邻尺度。

$$\mathcal{Q}=\mathcal{K}=\mathcal{V}=\texttt{Flatten}(\mathcal{S}_5),\quad \mathcal{F}_5=\texttt{Reshape}(\texttt{AIFI}(\mathcal{Q},\mathcal{K},\mathcal{V})),\quad \mathcal{O}=\texttt{CCFF}(\{\mathcal{S}_3,\mathcal{S}_4,\mathcal{F}_5\})$$

**不确定性最小化的查询选择**：以往的查询选择方案仅凭分类分数选取前$K$个($K=300$)编码器特征，因此定位质量差的特征也会成为初始查询。RT-DETR将编码器特征$\hat{\mathcal{X}}$的不确定性定义为其预测的定位分布$\mathcal{P}$与分类分布$\mathcal{C}$之间的差异，并在损失函数中对其进行优化：

$$\mathcal{U}(\hat{\mathcal{X}})=\|\mathcal{P}(\hat{\mathcal{X}})-\mathcal{C}(\hat{\mathcal{X}})\|,\quad \hat{\mathcal{X}}\in\mathbb{R}^{D}$$

$$\mathcal{L}(\hat{\mathcal{X}},\hat{\mathcal{Y}},\mathcal{Y})=\mathcal{L}_{box}(\hat{\mathbf{b}},\mathbf{b})+\mathcal{L}_{cls}(\mathcal{U}(\hat{\mathcal{X}}),\hat{\mathbf{c}},\mathbf{c})$$

其中$\hat{\mathbf{c}},\hat{\mathbf{b}}$为预测的类别和边界框，$\mathbf{c},\mathbf{b}$为真值。这大致使得同时具有高质量分类和定位的被选特征比例提升了一倍(0.67%对0.30%，两项分数均大于0.5的特征占比)。

**灵活的速度调优**：由于解码器各层结构相同，推理时去掉末尾的解码器层可以用精度换速度而无需重新训练——例如，只用6层RT-DETR-R50中的第5层，AP仅损失0.1%(53.1 → 53.0)，同时减少0.5 ms耗时。编码器和解码器的宽度/深度随骨干网络规模变化(R18/R34/CSPResNet，一直到S/M级模型)。

## 实验结果

COCO val2017，在T4 GPU上使用TensorRT FP16的端到端速度(通过论文提出的端到端速度基准，YOLO系列的NMS耗时也计入其中)：

- **RT-DETR-R50：53.1% AP，108 FPS(4200万参数)；RT-DETR-R101：54.3% AP，74 FPS**——在速度和精度上均超过YOLOv5/PP-YOLOE/YOLOv6/YOLOv7/YOLOv8的L/X模型(例如，YOLOv8-L：52.9% AP，71 FPS；YOLOv8-X：53.9% AP，50 FPS)。
- 与相同骨干网络的DETR相比：RT-DETR-R50比DINO-Deformable-DETR-R50高**+2.2% AP(53.1对50.9)，FPS约为其21倍(108对5)**。
- 编码器消融实验：混合编码器(变体E，47.9% AP，9.3 ms)对比耦合式多尺度编码器(变体C，45.6% AP，13.3 ms)——解耦既更快又更准。
- 查询选择消融实验：不确定性最小化选择比普通的基于分数的选择高**+0.8% AP(48.7对47.9)**。
- 使用Objects365预训练：RT-DETR-R50/R101达到**55.3% / 56.2% AP**。
- 论文指出的局限性：小目标AP仍落后于最好的YOLO(RT-DETR-R50的AP-S比YOLOv8-L低0.5%)。

## 对SLAM的意义

语义SLAM前端需要以帧率运行的目标检测；过去这意味着YOLO加NMS启发式规则。RT-DETR在相同的计算开销下提供了Transformer级别的检测质量，其无NMS的确定性输出更易于集成到SLAM流水线中(数据关联所需的稳定实例计数、无需调阈值、可预测的延迟)。它是实时语义建图和动态物体过滤的自然检测器选择。

## 相关条目

- [DETR](detr.md) — 最初的端到端Transformer检测器
- [YOLO](yolo.md) — 它所竞争的实时CNN基线
- [Grounding DINO](grounding-dino.md) — 开放词汇的DETR风格检测
- [SAM](sam.md) — 常与检测器搭配使用的可提示分割
