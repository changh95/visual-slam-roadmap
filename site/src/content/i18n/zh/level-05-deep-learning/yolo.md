# YOLO (v1→v11)
> Redmon 2016→2024 · [论文](https://arxiv.org/abs/1506.02640)

**一句话总结** — "You Only Look Once"将目标检测重新表述为一个单次前向传播即可求解的单阶段回归问题,由此建立了SLAM系统在语义与动态物体推理中最常使用的实时检测家族。

## 问题
在YOLO之前,目标检测是通过改造分类器来实现检测的:DPM在图像的所有位置和尺度上滑动一个分类器,而R-CNN家族则先生成区域候选框,再对每个候选框分类,然后在后处理中进行边框精细化、去重和重新打分。这些复杂的管线速度缓慢——远达不到相机帧率——而且难以优化,因为每个组件都是单独训练的。机器人领域需要一种能一次前向传播、以视频帧率运行、并具有单一可训练目标的检测方法。

## 方法与架构
- **网格回归。** 图像被划分为一个$S \times S$的网格;包含目标中心的格子负责检测该目标。每个格子预测$B$个边框——每个边框有$x, y, w, h$以及一个置信度,定义为$\Pr(\text{Object}) \cdot \text{IOU}^{\text{truth}}_{\text{pred}}$——再加上该格子所有边框共享的$C$个条件类别概率$\Pr(\text{Class}_i \mid \text{Object})$。整个输出是一个单一的$S \times S \times (B \cdot 5 + C)$张量;在Pascal VOC上,$S{=}7$、$B{=}2$、$C{=}20$给出一个$7\times7\times30$的张量(每张图像98个边框)。测试时,类别专属得分为$\Pr(\text{Class}_i \mid \text{Object}) \cdot \Pr(\text{Object}) \cdot \text{IOU}^{\text{truth}}_{\text{pred}} = \Pr(\text{Class}_i) \cdot \text{IOU}^{\text{truth}}_{\text{pred}}$。
- **网络结构。** 24个卷积层($1\times1$降维+$3\times3$卷积,受GoogLeNet启发)之后接2个全连接层;Fast YOLO使用9个卷积层。前20个卷积层在ImageNet上以$224\times224$分辨率预训练(88%的top-5准确率),随后在$448\times448$分辨率下针对检测任务微调,使用leaky-ReLU激活函数$\phi(x) = x$(当$x > 0$时),否则为$0.1x$。
- **多部分平方和损失**,其中$\lambda_\text{coord} = 5$,$\lambda_\text{noobj} = 0.5$,$\mathbf{1}_{ij}^{\text{obj}}$用于选出"负责"某个目标的预测器(当前IOU最高者):

$$\begin{aligned}
& \lambda_{\text{coord}} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{obj}} \left[ (x_i - \hat{x}_i)^2 + (y_i - \hat{y}_i)^2 \right] + \lambda_{\text{coord}} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{obj}} \left[ \left(\sqrt{w_i} - \sqrt{\hat{w}_i}\right)^2 + \left(\sqrt{h_i} - \sqrt{\hat{h}_i}\right)^2 \right] \\
& + \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{obj}} (C_i - \hat{C}_i)^2 + \lambda_{\text{noobj}} \sum_{i=0}^{S^2} \sum_{j=0}^{B} \mathbf{1}_{ij}^{\text{noobj}} (C_i - \hat{C}_i)^2 + \sum_{i=0}^{S^2} \mathbf{1}_{i}^{\text{obj}} \sum_{c \in \text{classes}} \left(p_i(c) - \hat{p}_i(c)\right)^2
\end{aligned}$$

  对$w, h$取平方根,使得小边框的误差在损失中占更大权重;分类损失只在包含目标的格子中生效。在VOC 2007+2012上训练约135个epoch(批大小64,动量0.9,权重衰减0.0005,dropout 0.5,配合缩放/平移/HSV数据增强)。
- **全局上下文。** 网络看到的是整张图像(而非候选框裁剪),因此能编码上下文信息;NMS只是可选的清理步骤(带来+2–3%的mAP提升),而不像在R-CNN/DPM中那样是结构上的必需品。
- **明确指出的局限性**(正是这些推动了后续版本的开发):每个格子只预测两个边框和一个类别,因此聚集的小目标(如成群的鸟)难以检测;经过下采样后特征较为粗糙;损失函数对小边框和大边框的误差一视同仁——定位误差是YOLO的主要误差来源。
- **一条长期演进的路线(v1→v11)。** 后续版本相继加入了锚框和多尺度预测、更强的骨干网络与训练方案,以及近期几代中的无锚框检测头,使该家族始终位于实时检测速度/精度帕累托前沿附近;Ultralytics生态系统(训练、ONNX/TensorRT导出、边缘部署)是YOLO至今仍是机器人领域默认检测器的一个重要实际原因。

## 实验结果
在Pascal VOC 2007上,YOLO达到**63.4% mAP、45 FPS**,Fast YOLO达到**52.7% mAP、155 FPS**——相比之下30Hz的DPM为26.1% mAP,而在精确但缓慢的一类方法中,Fast R-CNN为70.0% mAP/0.5 FPS,Faster R-CNN(VGG-16)为73.2%/7 FPS;使用VGG-16的YOLO在21 FPS下达到66.4%。误差分析显示,Fast R-CNN预测背景误报的可能性几乎是YOLO的3倍(占其排名靠前检测结果的13.6%);用YOLO对Fast R-CNN重新打分,可将VOC 2007的mAP从71.8%提升至**75.0%**。在VOC 2012测试集上,YOLO的mAP为57.9%,主要在小物体上落后于当时最先进水平(瓶子、羊、电视/显示器比R-CNN低8–10%)。在推广到艺术作品的场景中,YOLO对人的AP保持稳定(VOC2007的59.2 → Picasso的53.3,People-Art的45),而R-CNN则大幅崩溃(54.2 → 10.4,26)。

这个45 FPS的运行点使得逐帧检测第一次在实时感知栈中变得切实可行,而该家族后续的演进也一直保持着这一速度水平——为后来的Transformer检测器(DETR → RT-DETR)设立了必须在速度和精度两个维度上都超越的基准。

## 对SLAM的意义
目标检测是向SLAM管线注入语义信息最廉价的方式。YOLO家族的实时检测器被用来遮蔽动态物体(行人、车辆),以免其干扰特征跟踪;为物体级SLAM提供物体级地标(例如CubeSLAM根据2D检测结果构建3D立方体地标);以及为下游任务标注地图。当SLAM系统需要在机器人的机载计算机上以帧率获知"图像中有什么"时,YOLO通常是首先被采用的工具——但需要注意的是,它在设计上是闭集的,这一局限正是Grounding DINO等开放词汇检测器诞生的动机。

## 相关条目
- [DETR](detr.md) — 基于Transformer的集合预测方法,是YOLO式检测的替代方案。
- [RT-DETR](rt-detr.md) — 第一个在速度和精度两方面都超越YOLO的Transformer检测器。
- [Grounding DINO](grounding-dino.md) — 超越YOLO固定类别集的开放词汇检测。
- [CubeSLAM](../level-03-monocular-slam/cubeslam.md) — 建立在2D检测之上的物体SLAM。
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — 使用检测/分割来剔除动态物体。
- [SAM](sam.md) — 可提示的分割方法,是边框级检测在像素级上的对应方案。
