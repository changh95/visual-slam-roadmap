# DISK

> Tyszkiewicz 2020 · [论文](https://arxiv.org/abs/2006.13566)

**一句话总结** — 用策略梯度端到端地训练一个联合特征点检测器和描述子,将离散的特征点选择视为一个随机策略,其奖励是下游正确匹配的数量。

## 问题

由于稀疏特征点的选择和匹配本身具有离散性,局部特征框架很难端到端地学习:NMS和top-$k$选择是不可微的。此前的方法用代理损失或不精确的近似来规避这一问题——SuperPoint的单应性自适应、R2D2的可靠性图,或描述子空间假设——这些都没有直接优化真正重要的东西:正确匹配的数量。DISK(DIScrete Keypoints)则转而利用强化学习,使用一个表达能力足够强的概率模型,使训练与推理体制保持接近,同时能从零开始可靠地收敛。

## 方法与架构

一个U-Net(4个下采样/上采样块,110万参数,感受野219×219)将图像 $I$ 映射为一个检测热图 $K$ 以及一个稠密的 $N{=}128$ 维描述子图。下游的一切都被定义为分布,以便能够估计期望回报的梯度。

**特征分布。** 热图被划分为 $h \times h$ 的网格单元($h{=}8$);每个单元 $u$ 最多采样一个特征,使用热图裁剪 $K^u$。像素 $\mathbf{p}$ 先以相对概率被提议,再以绝对概率被接受,由此得到

$$ P(\mathbf{p} \mid K^u) = \mathrm{softmax}(K^u)_\mathbf{p} \cdot \sigma(K^u_\mathbf{p}) $$

其中 $\sigma$ 是sigmoid函数。被接受的位置取该像素处经 $\ell_2$ 归一化的描述子。在推理时,softmax变为argmax,sigmoid变为符号函数,并在热图上加做NMS。

**匹配分布。** 循环一致的匹配被松弛化:给定描述子距离矩阵 $\mathbf{d}$,正向匹配从 $P_{A \to B}(j \mid \mathbf{d}, i) = \mathrm{softmax}(-\tau\, \mathbf{d}(i,\cdot))_j$ 中抽取(反向匹配类似地从列中抽取),当且仅当两个方向都被采样到时,才判定 $i \leftrightarrow j$ 匹配。匹配概率有闭式解 $P(i \leftrightarrow j) = P_{A \to B}(j \mid \mathbf{d}, i) \cdot P_{B \to A}(i \mid \mathbf{d}, j)$,因此匹配这一步**不会给梯度估计增加方差**——这是稳定收敛的关键。

**奖励。** $R(M_{AB}) = \sum_{(i,j)} r(i \leftrightarrow j)$,其中正确匹配(两点均在其基于深度的重投影 $\epsilon$ 像素范围内)的奖励为 $\lambda_{\mathrm{tp}} = 1$,错误匹配为 $\lambda_{\mathrm{fp}} = -0.25$,"可能合理"的匹配(无深度信息,但对极距离低于 $\epsilon$)为中性,此外还有一个很小的逐特征点惩罚 $\lambda_{\mathrm{kp}} = -0.001$,用于抑制无法匹配的杂乱特征点。

**梯度估计器(REINFORCE风格,在匹配上是精确的)。** 令 $F_A, F_B$ 从特征分布中采样:

$$ \nabla_\theta \mathbb{E}_{M_{AB}} R(M_{AB}) = \mathbb{E}_{F_A, F_B} \sum_{i,j} P(i \leftrightarrow j \mid F_A, F_B, \theta_M)\, r(i \leftrightarrow j)\, \nabla_\theta \Gamma_{ij} $$

$$ \Gamma_{ij} = \log P(i \leftrightarrow j \mid F_A, F_B, \theta_M) + \log P(F_{A,i} \mid A, \theta_F) + \log P(F_{B,j} \mid B, \theta_F) $$

**训练。** MegaDepth子集(135个场景,6.3万张图像,COLMAP位姿/深度);共视图像三元组为每个批元素提供三对图像;图像分辨率768像素;使用Adam,学习率 $10^{-4}$;$\lambda_{\mathrm{fp}}$ 和 $\lambda_{\mathrm{kp}}$ 在前5个epoch中从0退火升高,以避免随机初始化的网络被驱使到"什么都不检测"的状态。

## 实验结果

- **Image Matching Challenge 2020**(9个留出测试场景,10°下的mAA):在2k特征类别中,DISK的立体mAA达到0.5132、多视图mAA达到0.7271,相对领先所有排行榜方法9.4%和6.7%,RANSAC内点数多约50%;在8k特征时,立体为0.5585、多视图为0.7502,超过所有基线,仅略低于排名前三的经过调优的提交方案。在学习式匹配器提交方案中,使用纯 $\ell_2$ 匹配的DISK仅次于SuperGlue,排名第二。
- **HPatches:** 达到最先进的MMA——在视角变化场景中排名第一,在光照变化场景中排名第二(仅次于DELF),在5像素以内的AUC上相对最接近的竞争对手Reinforced Feature Points高出12%。
- **ETH-COLMAP SfM基准:** 比SIFT产生更多地标点,轨迹更长,重投影误差相当;在"Fountain"场景上不设上限的一次运行产生了6.7万个地标点。
- 特征可以非常密集地被提取而仍保持判别性,DISK对训练中出现的平面内旋转具有鲁棒性,但在未见过的大幅旋转下性能下降(可通过数据增强修复)。

## 对SLAM的意义

DISK证明了直接优化匹配成功率胜过手工设计的代理损失,它已成为与SuperPoint和R2D2并列的标准学习式前端特征之一。其特征点在空间上分布均匀,这对需要在整幅图像范围内建立约束的SLAM系统有利,并且它作为LightGlue支持的特征骨干,使其成为hloc定位流程中即插即用的选择。

## 相关条目

- [SuperPoint](superpoint.md) — 自监督联合检测器/描述子的替代方案
- [R2D2](r2d2.md) — 具有可靠性感知的检测方法,是"在哪里检测"这一问题的另一种答案
- [HardNet](hardnet.md) — DISK所依托的描述子损失设计谱系
- [LightGlue](lightglue.md) — 原生支持DISK的匹配器
- [hloc](hloc.md) — DISK可以直接接入的定位流程
- [DeDoDe](dedode.md) — 将检测与描述解耦的后续重新思考
