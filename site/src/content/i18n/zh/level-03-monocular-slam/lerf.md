# LERF

> Kerr 2023 · [论文](https://arxiv.org/abs/2303.09553)

**一句话总结** —— 语言嵌入辐射场(Language Embedded Radiance Fields)通过体渲染将CLIP特征嵌入NeRF内部,从而支持从开放式自然语言提示出发进行像素对齐、零样本的3D查询。

## 问题

人类通过语言指代3D位置,涉及"极其广泛的属性范围:视觉外观、语义、抽象关联或可操作的功能属性(affordance)"——例如"黄色的马克杯"、"用来写字的东西"。CLIP可以针对*图像*为这类提示打分,但它"本质上是一种全局图像嵌入,不利于像素级对齐的特征提取":每个裁剪图只有一个嵌入向量,没有3D结构。此前的开放词汇3D工作依赖区域提议、掩码或经过微调的检测器(LSeg、OWL-ViT),这将查询限制在这些检测器训练所覆盖的类别内。LERF探索的问题是:如何将*原始*的CLIP嵌入以体渲染的方式嵌入NeRF,从而使任意语言都能解析为3D位置。

## 方法与架构

- **一个定义在体积上而非点上的场。** 在单个3D点上查询CLIP是模糊的,因此LERF学习一个定义在*体积*上的场 $F_{\mathrm{lang}}(\vec{x}, s) \in \mathbb{R}^{d}$:位置 $\vec{x}$ 加上一个物理尺度 $s$(以 $\vec{x}$ 为中心的立方体边长)。其输出被定义为:在训练视角中,所有包含该体积的图像裁剪图的CLIP嵌入的平均值。该场与视角无关,因此多个视角会平均到同一个嵌入向量。
- **语言的体渲染。** 沿射线 $\vec{r}(t) = \vec{o} + t\vec{d}$,尺度随距离增大,$s(t) = s_{\mathrm{img}} \cdot f_{xy} / t$(一个视锥),嵌入向量按标准NeRF权重 $w(t)$ 合成,其中 $T(t) = \int_t \exp(-\sigma(s)\,ds)$,$w(t) = \int_t T(t)\,\sigma(t)\,dt$:

$$\hat{\phi}_{\mathrm{lang}} = \int_t w(t)\, F_{\mathrm{lang}}\big(r(t), s(t)\big)\, dt, \qquad \phi_{\mathrm{lang}} = \hat{\phi}_{\mathrm{lang}} \big/ \lVert \hat{\phi}_{\mathrm{lang}} \rVert .$$

- **多尺度CLIP监督。** 一个预先计算好的裁剪图CLIP嵌入图像金字塔(尺度从 $s_{\min}=0.05$ 到 $s_{\max}=0.5$,共7级,重叠率50%)对每个渲染的视锥进行监督;真值 $\phi_{\mathrm{lang}}^{\mathrm{gt}}$ 由两个相邻尺度上最近的4个裁剪图三线性插值得到。损失函数最大化余弦相似度:

$$L_{\mathrm{lang}} = -\lambda_{\mathrm{lang}}\, \phi_{\mathrm{lang}} \cdot \phi_{\mathrm{lang}}^{\mathrm{gt}}, \qquad \lambda_{\mathrm{lang}} = 0.01 .$$

- **DINO正则化。** 第二个输出头 $F_{\mathrm{dino}}(\vec{x})$ 预测像素对齐的DINO特征(MSE损失,不输入尺度)。DINO在推理时从不使用;与CLIP头共享骨干网络对语言场起到正则化作用,修正了在稀疏观测区域出现的斑块状、易出现离群点的相关度图。
- **两个独立的哈希网格。** 语言优化"不应影响密度的分布":一个多分辨率哈希网格(Instant-NGP风格,32级,表大小 $2^{21}$)输入CLIP/DINO的MLP;另一个独立的Nerfacto场处理颜色/密度。$L_{\mathrm{lang}}$ 和 $L_{\mathrm{dino}}$ 的梯度从不触及NeRF的输出。
- **查询。** 一段文本提示 $\phi_{\mathrm{quer}}$ 通过一个成对的softmax相关度分数,与规范短语("object"、"things"、"stuff"、"texture")进行打分比较

$$\min_i \; \frac{\exp(\phi_{\mathrm{lang}} \cdot \phi_{\mathrm{quer}})}{\exp(\phi_{\mathrm{lang}} \cdot \phi_{\mathrm{canon}}^{i}) + \exp(\phi_{\mathrm{lang}} \cdot \phi_{\mathrm{quer}})},$$

  尺度 $s$ 通过在0-2米范围内以30个增量扫描并保留得分最高者来自动选择。被少于5个训练视角看到的样本会被丢弃。

## 实验结果

- **设置**:13个真实环境手持拍摄场景(杂货店、厨房、书店、茶歇场景、手办人偶等),使用iPhone上的Polycam以994×738分辨率拍摄;采用OpenCLIP ViT-B/16(LAION-2B);在一块A100上30k步大约耗时45分钟(约20 GB显存),6k步(8分钟)即可得到可用结果;在Nerfstudio查看器中的查询是交互式/实时的。
- **定位**(5个场景中72个已标注物体;成功定义为相关度最高的像素落在真值框内):LERF总体**80.3%**,而OWL-ViT为54.8%,蒸馏进3D的LSeg(DFF)为18.0%。按场景来看:waldo_kitchen 81.5/42.6/13.0,bouquet 91.7/66.7/50.0,teatime 93.8/75.0/28.1,figurines 79.5/38.5/8.9(依次为LERF/OWL-ViT/LSeg);OWL-ViT只在ramen场景上胜出(92.5对62.5)。
- **存在性判定**(5个场景中81个长尾查询):精确率-召回率曲线显示,LSeg只在分布内的COCO标签上与LERF相当,而在长尾查询上表现崩溃。
- **消融实验**:去除DINO会降低相关度图的平滑性和边界质量;单尺度训练(固定15%裁剪)在大范围上下文查询("意式咖啡机")和小物体查询("奶油胶囊")上均失败。
- **局限性**:CLIP的词袋式行为("not red"约等于"red")、在视觉相似物体上的误检(西葫芦与其他绿色蔬菜)、需要经过校准的NeRF级多视角拍摄。

## 对SLAM的意义

LERF确立了将视觉-语言特征直接嵌入3D场景表示的范式——这是Spatial AI的语义层:一种可以"对话"的地图。它直接启发了语言嵌入的高斯散射(LEGS、LangSplat),并与ConceptFusion这类融合式方法互为补充;其多尺度CLIP+DINO的方案已成为将2D视觉-语言特征蒸馏进3D场的默认做法。对机器人而言,能将"找一个可以写字的东西"解析为一个3D位置,正是让SLAM地图变为可操作世界模型的关键。

## 相关条目

- [LEGS](legs.md)
- [ConceptFusion](conceptfusion.md)
- [OpenScene](openscene.md)
- [NeRF](../level-05-deep-learning/nerf.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
