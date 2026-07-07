# ConceptGraphs

> Gu 2023 · [论文](https://arxiv.org/abs/2309.16650)

**一句话总结** — ConceptGraphs通过将2D基础模型的输出(SAM分割结果、CLIP嵌入)融合为3D物体节点,构建开放词汇的3D场景图,并利用LLM推断物体间的关系,从而生成可用自然语言查询、供规划使用的地图。

## 问题

机器人需要一种既语义丰富又紧凑高效的3D世界表示,以支持面向任务的感知与规划。近期将视觉-语言特征注入3D地图的尝试都是逐点生成特征向量,这种做法"在更大环境中扩展性不佳,也不包含实体间的语义空间关系"——而传统的封闭集场景图又被限定在预定义的标签集合内。ConceptGraphs的目标是一种开放词汇的表示方式,它以物体为中心、具有图结构,且不需要采集3D训练数据或微调任何模型即可构建。

## 方法与架构

给定带位姿的RGB-D帧 $I_t = \langle I_t^{\text{rgb}}, I_t^{\text{depth}}, \theta_t \rangle$,ConceptGraphs逐步构建一个场景图 $\mathcal{M}_t = \langle \mathbf{O}_t, \mathbf{E}_t \rangle$,其中每个节点 $\mathbf{o}_j$ 都携带一个3D点云 $\mathbf{p}_{o_j}$ 和一个融合后的语义特征 $\mathbf{f}_{o_j}$:

- **类别无关的分割 + 嵌入。** SAM为每帧生成掩膜 $\mathbf{m}_{t,i}$;每个被掩膜裁剪的区域通过CLIP图像编码器嵌入,得到单位特征 $\mathbf{f}_{t,i}$;每个掩膜被反投影到3D,用DBSCAN去噪,并变换到地图坐标系。
- **多视角物体关联。** 每个新检测都会与重叠的地图物体进行打分,打分方式结合几何与语义相似度

  $$\phi(i,j) = \phi_{\text{sem}}(i,j) + \phi_{\text{geo}}(i,j), \qquad \phi_{\text{sem}}(i,j) = \tfrac{1}{2}\mathbf{f}_{t,i}^{\top}\mathbf{f}_{o_j} + \tfrac{1}{2},$$

  其中 $\phi_{\text{geo}}(i,j) = \mathrm{nnratio}(\mathbf{p}_{t,i}, \mathbf{p}_{o_j})$ 是检测点中在地图物体上存在最近邻(距离小于 $\delta_{\text{nn}}$)的比例。贪心分配将每个检测匹配到得分最高的物体;若没有分数超过 $\delta_{\text{sim}}$,则实例化一个新物体。
- **物体融合。** 匹配成功时,节点特征通过滑动平均更新 $\mathbf{f}_{o_j} = (n_{o_j} \mathbf{f}_{o_j} + \mathbf{f}_{t,i}) / (n_{o_j} + 1)$($n_{o_j}$为关联次数),点云则被合并并下采样。
- **节点标注。** 每个物体最佳的10个视角裁剪图被送入一个LVLM(LLaVA),提示其"描述图像中的中心物体";再由一个LLM(GPT-4)将这10条粗略描述总结为每个节点一条连贯的描述。
- **边推断。** 所有节点对之间的3D边界框IoU构成一个稠密相似度图,再剪枝为最小生成树;对于每条MST边,将两个节点的描述和3D位置提供给LLM,输出一个关系标签(例如"a在b上")及推理过程——从而产生了任何已训练关系模型都无法给出的开放词汇边。
- **规划接口。** 每个节点被序列化为JSON(描述+3D边界框);给定一个语言查询,LLM挑选出最相关的物体,并将其位姿交给下游的抓取/导航流程。实现细节:体素尺寸与 $\delta_{\text{nn}}$ 均为2.5厘米,$\delta_{\text{sim}} = 1.1$;一个检测器变体(CG-D)使用RAM标签+Grounding DINO框,而非纯SAM提议。

## 实验结果

- **场景图质量(Replica数据集,AMT人工评估):** 节点描述被判定为正确的比例约为70%(大多数错误可追溯到LVLM),而边关系标签的平均准确率约为90%;每个场景仅出现0-5个重复物体检测。
- **开放词汇3D语义分割(Replica数据集,ConceptFusion评测协议):** ConceptGraphs得分为40.63 mAcc / 35.95 F-mIoU,CG-D为38.72 / 35.82,而ConceptFusion为24.16 / 31.31,ConceptFusion+SAM为31.53 / 38.70——ConceptGraphs以更小的内存占用取得了相当或更优的表现(经过特殊微调的基线,例如OpenSeg可达41.19 / 53.74)。
- **文本查询检索(R@1):** 在Replica上,基于LLM的检索在否定查询上以0.80对0.26胜过CLIP;在真实实验室扫描场景中,LLM在描述性、可操作性和否定查询上均达到1.00,而CLIP在否定查询上得分为0.00。
- **机器人演示:** 在Clearpath Jackal(VLP-16 + RealSense D435i)上进行语言驱动的导航,在Boston Dynamics Spot上进行开放词汇的抓取与放置("cuddly quacker" → 鸭子玩偶),LLM推断可通行性以推挤穿过杂物,以及在AI2Thor中进行粒子滤波定位与地图更新。

## 对SLAM的意义

ConceptGraphs表明,2D基础模型可以通过普通的多视角关联被提升到3D——无需任何新的3D网络——将SLAM系统带位姿的RGB-D流转变为可用语言查询的物体地图。它确立了如今标准的SAM + CLIP + LLM配方,用于开放词汇的机器人地图构建,并与逐点方法(ConceptFusion、LERF、OpenScene)一起,划定了开放词汇3D地图的设计空间:稠密特征与以物体为中心的图之争。随着SLAM的输出越来越多地供语言驱动的规划器使用,像这样以图结构表示的开放集地图,定义了现代空间AI中"语义地图"的含义。

## 相关条目

- [SAM](sam.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md)
- [Hydra](hydra.md)
- [Clio](clio.md)
- [OpenScene](../level-03-monocular-slam/openscene.md)
- [Grounding DINO](grounding-dino.md)
