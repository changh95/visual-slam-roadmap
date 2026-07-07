# VGGT-SLAM

> Maggio 2025 · [论文](https://arxiv.org/abs/2505.12549)

**一句话总结** —— 使用 VGGT 作为前端的稠密单目 RGB SLAM,通过在 SL(4) 流形上优化的因子图,增量式地对齐前馈式子地图重建结果——因为无标定的子地图之间可能相差一个完整的 15 自由度投影变换,而不仅仅是一个相似变换。

## 问题

VGGT 通过一次前向推理重建一批帧,但 GPU 内存将单次推理限制在 RTX 4090(24 GB)上大约 60 帧,因此长视频必须被拆分为多个子地图,再对齐成一张地图。相关工作使用相似变换(旋转+平移+尺度)来对齐子地图,但 VGGT-SLAM 指出这对无标定相机来说是不够的:根据投影重建定理,在对相机运动、场景结构或内参不做任何假设的情况下,场景只能在真实几何的一个 15 自由度投影变换的意义下被恢复。因此,7 自由度的 Sim(3) 对齐并不总能使两个子地图一致——尤其是当帧间视差较小、VGGT 学习到的度量先验变得不可靠时,子地图之间会残留剪切、拉伸和透视畸变。

## 方法与架构

- **子地图生成**:当一帧与上一关键帧之间的 Lucas-Kanade 视差超过 $\tau_{\text{disparity}}$ 时,该帧成为关键帧。一旦累积了 $w$ 个关键帧,子地图的图像集合被构建为 $\mathcal{I}_{\mathrm{latest}} \leftarrow \{\mathbf{M}_{\mathrm{prior}}\} \cup \mathcal{I}_{\mathrm{latest}} \cup \mathcal{I}_{\mathrm{loop}}$——即上一个子地图最后一个非回环帧,加上当前子地图的帧,再加上最多 $w_{\text{loop}}$ 个检索到的回环帧——并一次性传给 VGGT 进行前向推理。稠密点 $\mathbf{X}^{\mathcal{S}}$ 来自使用 VGGT 相机估计对其深度图做反投影(比点头更精确),并在置信度低于平均值的 $\tau_{\text{conf}}$ 比例处进行剔除。
- **在 SL(4) 上的子地图对齐**:对于两个重叠子地图中的对应点,对齐是一个 $4\times 4$ 单应矩阵
  $$\mathbf{X}^{\mathcal{S}_i}_a = \mathbf{H}^i_j\,\mathbf{X}^{\mathcal{S}_j}_b, \qquad \mathbf{H}^i_j \in \mathrm{SL}(4),$$
  具有 15 个自由度,而不是 Sim(3) 的 7 个。由于连续子地图共享一个完全相同的帧,稠密对应关系是*无需任何匹配*就已知的:$\mathbf{H}$ 是从齐次线性系统 $\mathbf{A}_k \mathbf{h} = 0$(其中 $\mathbf{h} \in \mathbb{R}^{16}$ 存储展平后的单应矩阵)中恢复的,在 RANSAC 内部用一个五点求解器求解,并按其行列式的四次方根重新缩放,使 $\det \mathbf{H} = 1$。相机矩阵通过 $\mathbf{P}_i = (\mathbf{H}^i_j)^{-1}\mathbf{P}_j$ 校正。
- **回环闭合**:每个关键帧都获得一个 SALAD 描述子;对旧子地图的检索(L2 相似度高于 $\tau_{\text{desc}}$)会向当前子地图追加最多 $w_{\text{loop}}$ 帧,因此回环闭合的单应矩阵同样来自精确的共享帧对应关系,而不是估计出的关联。
- **后端——SL(4) 流形上的因子图**:将每个子地图映射到全局坐标系的绝对单应矩阵 $\mathbf{H}_i$ 通过 MAP 优化估计:
  $$\hat{\mathcal{H}} = \operatorname{argmin}_{\mathbf{H} \in \mathrm{SL}(4)} \sum_{(i,j) \in \mathcal{L}} \left\| \mathrm{Log}\left( \mathbf{H}^{-1}_i \mathbf{H}_j \left(\mathbf{H}^i_j\right)^{-1} \right) \right\|^2_{\Omega^{\mathbf{H}}_{ij}},$$
  其中 $\mathcal{L}$ 索引里程计约束和回环闭合约束,$\mathrm{Log}$ 映射到李代数 $\mathfrak{sl}(4)$,由 $\boldsymbol{\xi} \in \mathbb{R}^{15}$ 参数化,$\boldsymbol{\xi}^{\wedge} = \sum_{k=1}^{15} \boldsymbol{\xi}_k \mathbf{G}_k$,基于 15 个生成元 $\mathbf{G}_k$。Levenberg-Marquardt 在流形上更新位姿,形式为 $\mathbf{H} \leftarrow \mathbf{H}\,\mathrm{Exp}(\hat{\boldsymbol{\delta}})$,雅可比为 $\mathbf{J}_i = -\mathrm{Ad}_{\mathbf{H}_i^{-1}\mathbf{H}_j}$ 和 $\mathbf{J}_j = \mathbf{I}_{15\times 15}$。
- 该系统不需要相机内参、不需要跨帧一致的标定,也不需要任何额外的训练。为了对比,还构建了一个 Sim(3) 变体(VGGT 位姿+尺度对齐)。

## 实验结果

在 7-Scenes 和 TUM RGB-D 上进行评估(通过 evo 计算 ATE RMSE),在 RTX 4090 上对 5 次运行取平均;参数为 $w_{\text{loop}}=1$、$\tau_{\text{disparity}}=25$ 像素、$\tau_{\text{conf}}=25\%$、300 次 RANSAC 迭代。

- **TUM RGB-D(无标定)**:$w=32$ 的 SL(4) 版本整体表现最佳,平均 ATE 为 **0.053 m**,相比 MASt3R-SLAM* 的 0.060 m、DROID-SLAM*(自动标定)的 0.158 m,以及 Sim(3) 变体的 0.074 m。
- **7-Scenes(无标定)**:在 $w=32$ 时,SL(4) 和 Sim(3) 两种变体的平均 ATE 均为 0.067 m——与表现最好的基线 MASt3R-SLAM*(0.066 m)大致相同。
- **稠密重建(7-Scenes)**:在对比方法中取得最佳精度(0.052 m)和 Chamfer 距离(0.055 m)(MASt3R-SLAM* 达到 0.068 m 精度 / 0.056 m Chamfer;Spann3R@20 为 0.069 / 0.058)。
- **定性结果**:一条 55 米的办公室走廊环路由 22 个子地图融合成一张全局一致的地图;图例展示了 Sim(3) 无法对齐子地图、而 SL(4) 能纠正投影歧义的场景。
- **已知失效模式**:平面场景 TUM `floor`(0.141 m)——15 自由度单应矩阵在平面点上是退化的,而 15 个自由度也允许场景透视漂移,不仅仅是尺度/旋转/平移漂移。这两个问题都推动了 VGGT-SLAM 2.0 的产生。

## 对SLAM的意义

VGGT-SLAM 是第一个将多视角前馈式基础模型包裹进完整 SLAM 循环——子地图、回环闭合,以及对此类模型所遗留的重建歧义的原理性处理——的系统。它的核心观察——无标定的前馈式子地图必须在 SL(4) 而不是 Sim(3) 上对齐——对于任何在学习型几何之上构建 SLAM 的人来说都具有重要的概念意义,其 SL(4) 因子图求解器也已被合并进 GTSAM。它处于从 DROID-SLAM 和 MASt3R-SLAM 通往日益学习化的 SLAM 技术栈的直接谱系之中。

## 相关条目

- [VGGT](vggt.md) —— 前馈式前端模型
- [VGGT-SLAM 2.0](vggt-slam-2-0.md) —— 消除 15 自由度漂移和平面退化问题的后续系统
- [MASt3R-SLAM](mast3r-slam.md) —— 建立在成对点图预测之上的 SLAM
- [DROID-SLAM](droid-slam.md) —— 更早期的、带优化后端的端到端学习型 SLAM
- [视觉地点识别(VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) —— SALAD 为回环闭合所解决的检索问题
- [外极几何](../level-01-beginner/epipolar-geometry.md) —— 投影歧义论证的背景知识
