# DETR

> Carion 2020 · [论文](https://arxiv.org/abs/2005.12872)

**一句话总结** — 将目标检测表述为一个由带双边匹配损失的Transformer编码器-解码器解决的直接集合预测问题,从而消除了锚框、NMS以及手工设计的检测流程。

## 问题

经典检测器如Faster R-CNN和YOLO并非真正端到端:它们依赖手工设计的组件——锚框生成、非极大值抑制(NMS)、多阶段提议流程——这些组件显式地编码了关于检测任务的先验知识,且每一个都需要调参。这些组件的存在,是因为网络会产生大量近似重复的候选框,必须在事后进行去重。DETR提出的问题是:检测能否被表述为一个纯粹的*集合预测*问题:输入一张图像,由一个网络、一个损失训练输出一组(框、类别)对,重复项由训练目标本身而非后处理来抑制。

## 方法与架构

依次为三个组件:**CNN骨干网络**(ResNet-50/101)提取特征图,该特征图被展平并附加固定的位置编码;**Transformer编码器**(基础模型为6层,宽度256,8个头)对所有空间位置进行全局自注意力;**Transformer解码器**通过自注意力和编码器-解码器交叉注意力,将 $N$ 个学习到的嵌入——*对象查询(object queries)*——转换为输出,**并行**解码全部 $N$ 个对象(而非自回归地解码);最后,一个共享的**前馈网络**将每个输出嵌入映射为归一化的框坐标 $b \in [0,1]^4$ 和一个类别标签,其中包括一个特殊的"无对象"类别 $\varnothing$。$N$ 是固定的,并且远大于典型的对象数量。在每个解码器层之后附加的辅助匈牙利损失有助于训练。

**双边匹配。** 训练首先在 $N$ 个预测和补齐后的真值集合之间找到成本最低的一对一分配:

$$\hat{\sigma} = \arg\min_{\sigma \in \mathfrak{S}_N} \sum_{i}^{N} \mathcal{L}_{\text{match}}\big(y_i, \hat{y}_{\sigma(i)}\big),$$

该分配用匈牙利算法计算,其中对于 $y_i = (c_i, b_i)$,匹配成本为 $-\mathbf{1}_{\{c_i \neq \varnothing\}}\, \hat{p}_{\sigma(i)}(c_i) + \mathbf{1}_{\{c_i \neq \varnothing\}}\, \mathcal{L}_{\text{box}}\big(b_i, \hat{b}_{\sigma(i)}\big)$。

**匈牙利损失。** 给定最优分配,损失为类别预测的负对数似然加上匹配对上的框损失:

$$\mathcal{L}_{\text{Hungarian}}(y, \hat{y}) = \sum_{i=1}^{N} \Big[ -\log \hat{p}_{\hat{\sigma}(i)}(c_i) + \mathbf{1}_{\{c_i \neq \varnothing\}}\, \mathcal{L}_{\text{box}}\big(b_i, \hat{b}_{\hat{\sigma}(i)}\big) \Big],$$

其中 $\varnothing$ 的对数概率因类别不平衡而被降权10倍。由于框是直接预测的(不是相对于锚框的偏移量),纯 $\ell_1$ 损失的尺度表现会很差,因此框损失将 $\ell_1$ 与尺度不变的广义IoU混合:$\mathcal{L}_{\text{box}} = \lambda_{\text{iou}}\, \mathcal{L}_{\text{iou}}\big(b_i, \hat{b}_{\sigma(i)}\big) + \lambda_{\text{L1}}\, \lVert b_i - \hat{b}_{\sigma(i)} \rVert_1$。一对一匹配使得训练过程中重复预测的代价很高——因此推理时不需要NMS。

**全景扩展。** 在解码器输出上添加一个掩码头,并对掩码分数逐像素取argmax,即可得到"things"和"stuff"统一且无重叠的全景分割。

## 实验结果

- 在COCO val上,DETR(ResNet-50,4100万参数,86 GFLOPS,28 FPS)达到**42.0 AP**,与经过精细调优的Faster R-CNN-FPN+基线(42.0 AP,4200万参数)相当——这是通过大幅提升大目标检测($\text{AP}_L$ 61.1对比53.4)实现的,但在小目标上略逊($\text{AP}_S$ 20.5对比26.6)。DETR-DC5-R101达到44.9 AP。
- 训练需要500个epoch(第400个epoch降低学习率);相比短训练计划,长训练计划额外带来1.5 AP的提升。消融实验:去掉编码器整体损失3.9 AP,大目标上损失6.0 AP——说明全局自注意力确实在发挥实质作用。
- 全景分割:DETR-R101在COCO val上获得**45.1 PQ**,而使用相同数据增强重新训练的PanopticFPN++基线为44.1 PQ,在stuff类别上优势尤其明显($\text{PQ}^{\text{st}}$ 37.0对比33.6),在COCO test上为46 PQ。
- 其发布之初的主要弱点——收敛慢和小目标AP偏低——后续被后续工作(Deformable DETR、DINO、RT-DETR)修复,而双边匹配集合损失成为任何集合到集合预测任务的标准工具。

## 对SLAM的意义

DETR开启了目标检测领域的Transformer变革,其后继者(RT-DETR、DINO、Grounding DINO)是现代语义级和物体级SLAM系统所依赖的检测器。其双边匹配思想可推广到任何集合到集合的预测问题——关键点、分割块、物体级地标——这在学习式SLAM前端中反复出现。当一个SLAM系统需要物体检测结果用于语义建图、动态物体过滤或场景图时,所用的检测器往往是DETR家族的模型。

## 相关条目

- [RT-DETR](rt-detr.md) — 超越YOLO类检测器的实时DETR变体
- [Grounding DINO](grounding-dino.md) — 开放词汇、文本提示的DETR后继者
- [YOLO](yolo.md) — DETR所对比的经典实时检测器家族
- [SAM](sam.md) — 常与DETR风格检测器搭配使用的可提示分割模型
