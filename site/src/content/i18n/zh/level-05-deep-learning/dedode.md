# DeDoDe

> Edstedt 2024 · [论文](https://arxiv.org/abs/2308.08479)

**一句话总结** — DeDoDe("Detect, Don't Describe — Describe, Don't Detect")将关键点检测与描述子解耦:检测器直接从大规模SfM轨迹中学习3D一致性,而描述子则单独针对互为最近邻的可匹配性进行训练。

## 问题

学习式关键点检测的核心难点在于学习目标:是什么让一个像素成为"好"的关键点?此前的学习方法(SuperPoint、DISK、SiLK)将描述子与关键点联合学习,并把检测视为在描述子互为最近邻上的二分类问题——这是一个"无法保证产生3D一致关键点"的代理任务,并且将关键点与某个特定描述子绑定,使下游使用变得复杂。DeDoDe则直接从3D一致性中学习关键点,并因此获得了兼容性(关键点可与任意匹配器配合使用)和模块化这两个附带优势。

## 方法与架构

**检测器目标。** 一个网络 $f_\theta(x|I)$ 输出图像上的对数密度,训练目标是最大化"好"关键点的似然:

$$\max_{\theta}\sum_{j=1}^{|\mathcal{D}|}\sum_{i=1}^{K^{j}} f_{\theta}(x_i^j|I^j)-\log Z_{\theta}(I^j), \qquad Z_{\theta}(I^j)=\sum_{x^j\in I^j}\exp(f_{\theta}(x^j|I^j)).$$

"真值"是在MegaDepth SfM重建中作为3D轨迹存留下来的SIFT检测点。由于每张图像只能看到其轨迹的一部分,系统会采样图像对 $(I^{\mathcal{A}}, I^{\mathcal{B}})$,并使用(通过MVS深度得到的)共视检测点的并集。

**平滑双视图先验。** 轨迹检测点处的狄拉克delta函数用高斯核($\sigma=0.5$像素)加上一个小的均匀常数进行模糊处理,再用深度信息在视图间进行变形,然后相乘:$p^{\mathcal{A}}_{\rm kp}\propto\tilde{p}_{\rm kp}^{\mathcal{A}}\cdot\tilde{p}_{\rm kp}^{\mathcal{B}\to\mathcal{A}}$——在*两张*图像中都被检测到的轨迹处取得峰值。

**半监督后验 + top-k目标。** 由于基础检测器的召回率不足,该先验以网络自身的预测为条件,即 $p\propto p_{f_\theta}\cdot p_{\rm kp}$,从而让DeDoDe发现SIFT遗漏的关键点。目标在得分最高的 $k=\text{批大小}\cdot 1024$ 个检测处被二值化(以避免退化解),得到 $\mathcal{L}_{\rm detection}={\rm CE}(p_{f_\theta}, p_{\text{top-}k})$,再加上一个覆盖率正则项 $\mathcal{L}_{\rm coverage}={\rm CE}(\mathcal{N}(0,\sigma^2)*p_{f_\theta},\,\mathcal{N}(0,\sigma^2)*p_{\rm MVS})$($\sigma=12.5$像素),使检测点避开不可匹配的区域(例如天空)。推理时只需取分数最高的 $K$ 个点,无需非极大值抑制。

**描述子,单独训练。** 第二个网络 $\mathbf{g}_\theta$(不共享权重)最大化对称对数似然 $\ell_{g_\theta}=\log p_{g_\theta}(x^{\mathcal{A}}|x^{\mathcal{B}})+\log p_{g_\theta}(x^{\mathcal{B}}|x^{\mathcal{A}})$,其中 $p_{g_\theta}$ 是对256维归一化描述子(温度 $1/20$)内积的softmax——评估时*直接在已训练好的DeDoDe关键点上*进行(每张图像 $K=5000$ 个),因此联合方法中难以处理的归一化常数问题不复存在。

**架构。** 两个网络均使用ImageNet预训练的VGG-19编码器(步幅1-8,通道数64-512),搭配DKM风格的深度可分卷积精炼解码器,在多个尺度上残差式地精炼一个稠密的logit/描述子网格。**DeDoDe-G**在步幅14处加入了冻结的DINOv2特征,并增加了一个额外解码阶段(维度768)。检测器:100k步,批大小8,512×512,在一块A100上约30小时;描述子约24小时;SotA评估分辨率为784×784。

## 实验结果

- **MegaDepth-1500相对位姿(MNN匹配)**:DeDoDe-B在AUC@5°/10°/20°上为49.4 / 65.5 / 77.7,DeDoDe-G为52.8 / 69.7 / 82.0——相比之下DISK为35.0、SiLK为39.9、ALIKED为41.9、SuperPoint在AUC@5°上为31.7(比DISK高17.8,比SiLK高12.9,比ALIKED高10.9);DeDoDe-G仅用普通最近邻匹配就达到了与LoFTR(52.8)相当的水平。
- **IMC2022(隐藏测试集,3万个关键点)**:DeDoDe-B为72.9,DeDoDe-G为75.8 mAA@10——相比DISK的64.8、SiLK的68.5(高7.4),与SuperPoint+SuperGlue(72.4)相当。
- **检测器可重复性(MegaDepth,1万个关键点,0.1%阈值)**:DeDoDe为40.1,相比DISK*为32.6、ALIKED*为26.4、SiLK为21.2。
- **组件互换**:SIFT/DeDoDe-B(AUC@5°为41.1)和DISK/DeDoDe-B(41.5)均优于原始的SIFT(36.5)和DISK(35.0)流程——但比完整的DeDoDe低约8个百分点,说明检测器和描述子各自都有贡献。
- **消融实验**:去掉覆盖率损失会使0.1%阈值下的可重复性从37.1降至29.7;直接在先验上进行监督(不使用后验/top-k)会将其降至34.8。

## 对SLAM的意义

在基于特征点的SLAM中,关键点质量决定了下游一切环节的上限:三角化、光束法平差、重定位。DeDoDe的核心洞见——用3D一致性而非描述子匹配的代理任务来监督检测——得到的关键点能够在宽基线和视角变化下存活,这正是长期SLAM与地图构建所需要的。它也体现了一种当代趋势:将学习式前端拆分为可独立优化、可组合的模块,插入到匹配器(如LightGlue)和定位系统中。

## 相关条目

- [SuperPoint](superpoint.md)
- [DISK](disk.md)
- [R2D2](r2d2.md)
- [LightGlue](lightglue.md)
- [RoMa](roma.md) — 同一研究组;DeDoDe-G使用了冻结的DINOv2特征
- [Foundation models](foundation-models.md)
