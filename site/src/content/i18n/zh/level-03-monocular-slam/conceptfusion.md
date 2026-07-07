# ConceptFusion

> Jatavallabhula (MIT) 2023 · [论文](https://arxiv.org/abs/2302.07241)

**一句话总结** — 将像素对齐的基础模型特征（CLIP、AudioCLIP）以深度和颜色所用的相同加权平均方式融合进稠密SLAM点云地图，无需任何训练或微调即可实现对3D地图的零样本开放词汇及多模态（文本/图像/点击/音频）查询。

## 问题

大多数为3D地图附加语义信息的方法都是闭集的：它们只能在训练时固定的有限标签集合上进行推理，地图查询最多也只能用类别标签或文本。基础模型能够跨模态理解开放集概念，但它们消费的是整张图像，只输出*单一*图像级向量——没有像素级对齐；而为像素对齐微调过的模型（LSeg、OpenSeg）在微调过程中会*遗忘*长尾概念：其骨干CLIP本来认识"diet coke（无糖可乐）"和"lysol（消毒剂品牌）"，但微调后的版本却无法再检索到它们。ConceptFusion探讨的是如何以零样本的方式，将像素对齐、且不遗忘的开放集特征放入3D地图中。

## 方法与架构

- **地图表示**：一个无序点集；点 $k$ 存储位置 $\overline{v}_k\in\mathbb{R}^3$、法向 $\overline{n}_k$、置信度计数 $\bar{c}_k$、可选颜色，以及一个概念向量 $f^{P}_k$。该系统基于gradSLAM实现的PointFusion稠密SLAM构建；里程计和建图以帧率（15 Hz）运行，特征提取则离线进行（在RTX 3090上每张图像10-15秒）。
- **像素对齐特征（核心贡献）**：对于图像 $X$，一个类别无关的实例分割器（Mask2Former或SAM）提出 $R$ 个区域。全局嵌入为 $f^{G}=\mathcal{F}(X)$；每个区域的边界框给出一个局部嵌入 $f^{L}_i=\mathcal{F}(\mathrm{bbox}(r_i))$。每个区域的特征混合了全局上下文和局部细节，其权重取决于该区域有多"典型"：与全局特征的余弦相似度 $\phi_i=\langle f^{L}_i, f^{G}\rangle$，以及与其他区域的平均相似度 $\bar{\varphi}_i=\frac{1}{R}\sum_{j\neq i}\varphi_{ij}$，二者通过softmax组合

$$w_i=\frac{\exp\big((\phi_i+\bar{\varphi}_i)/\tau\big)}{\sum_{i=1}^{R}\exp\big((\phi_i+\bar{\varphi}_i)/\tau\big)}, \qquad f^{P}_i = w_i f^{G} + (1-w_i) f^{L}_i$$

其中 $\tau=1$；$f^{P}_i$ 被归一化并赋给区域 $r_i$ 的所有像素。不做微调意味着不会遗忘——未经修改的CLIP特征空间被完整保留。
- **多视角融合到3D**：与深度/颜色所用的逻辑完全相同。对于每个与地图点存在对应关系的像素：

$$f^{P}_{k,t} \leftarrow \frac{\bar{c}_k f^{P}_{k,t-1} + \alpha f^{P}_{u,v,t}}{\bar{c}_k + \alpha}, \qquad \bar{c}_k \leftarrow \bar{c}_k + \alpha$$

其中 $\alpha=e^{-\gamma^{2}/2\sigma^{2}}$ 根据相机中心的归一化径向距离 $\gamma$ 加权（$\sigma=0.6$）。
- **查询**：每个点的得分为 $s_k=\langle f_k, q_{\text{mode}}\rangle$（余弦相似度），其中 $q_{\text{mode}}$ 来自相应的编码器——CLIP文本编码器、图像级CLIP嵌入、用于声音的AudioCLIP，或者简单地取某个点击点处的融合特征。通过阈值化/非极大值抑制/聚类得到感兴趣的3D区域。
- **3D空间比较器**：在查询结果上运行的可组合模块（HowFar、IsToTheLeft/Right、OnTopOf、Under）；一个LLM可以选择性地将"how far is the refrigerator from the television（冰箱离电视有多远）"这类问题解析为对两个查询项调用howFar。

## 实验结果

- **UnCoCo**（新数据集：78个桌面物体，20个RGB-D序列，12,075帧，跨模态查询超过50万条）。结构化文本查询：3D mIoU达**0.446**，而OpenSeg-3D为0.289，LSeg-3D为0.128，MaskCLIP-3D为0.091（acc@IoU0.25：69.44% vs 36.11%）。非结构化文本：0.378 vs 0.153。图像查询：0.331 vs 0.134（LSeg-3D）。音频查询：准确率64.29% / 66.67%（源模糊/生态类别），而一个具有特权信息的AudioCLIP基线为23.81% / 22.22%。
- **开放集语义分割**：ScanNet上mAcc为0.63 / f-mIoU为0.58——远高于零样本的MaskCLIP（0.24/0.28），并与具有特权信息的微调版LSeg（0.70/0.63）相当；SemanticKITTI上为0.79/0.78。论文摘要的重点结论：在3D IoU上比监督方法保留长尾概念的能力高出"超过40个百分点"。
- **消融实验**（ScanNet）：仅用全局CLIP为0.35/0.48，仅用局部为0.43/0.33，去掉唯一性项为0.55/0.46，完整模型为0.63/0.58；将Mask2Former换成SAM可将Replica分数从24.16/31.31提升到31.53/38.70。
- **3D空间推理**（100条ScanRefer查询）：距离84%，相对位置76%，支撑关系96%，包含关系72%——2.5D单图像基线在距离（32%）和相对位置（28%）上崩溃，因为被引用的物体从未被共同观测到。
- **真实机器人实验**：使用UR5e机械臂进行零样本桌面重排任务（"push baymax to the right"），并在一辆线控驱动车辆上进行文本驱动的自主导航，覆盖一个4,000平方米的城市地图（LeGO-LOAM定位，开放集文本目标如"football field（足球场）"）。
- 论文指出的局限性：内存消耗（对数百万个点每个都存储高维嵌入）、以前景为中心的特征缺乏可组合性/否定表达能力，以及继承自基础模型的偏差。

## 对SLAM的意义

ConceptFusion开创了开放集多模态3D建图，建立了如今已成为标准的范式：2D基础模型特征+经典多视角融合，完全无需3D训练。它是经典SLAM与空间人工智能（Spatial AI）之间的关键桥梁——用来对机器人进行定位的地图，同样能够回答"哪里有能用来打开这个瓶子的东西？"这样的问题。它的内存开销（每个点存一个完整嵌入）恰恰是后续系统所要解决的问题：LERF/LEGS采用隐式特征场，OpenGS-SLAM采用离散标签，ConceptGraphs采用物体级节点。

## 动手实践

- [运行ConceptFusion](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/concept_fusion)

## 相关条目

- [LERF](lerf.md)
- [OpenScene](openscene.md)
- [LEGS](legs.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)
