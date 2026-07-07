# OpenScene

> Peng (ETH) 2023 · [论文](https://arxiv.org/abs/2211.15654)

**一句话总结** — 通过将2D视觉-语言特征反投影并蒸馏到一个3D网络中，为3D点云预测稠密的逐点CLIP空间特征，从而实现零样本、任务无关的开放词汇3D场景理解，且完全不需要任何有标注的3D数据。

## 问题

传统的3D场景理解依赖有标注的3D数据集，为每个任务训练一个带监督的模型：每个任务都需要昂贵的3D标注，且每个模型都被限定在一个预先定义的类别列表上。与此同时，基于互联网规模数据训练的2D视觉-语言模型已经将图像和文本嵌入到同一个共享空间中。OpenScene提出的问题是：能否将3D点也嵌入到同一个CLIP特征空间中，使一个单一的无监督表示能够在查询时服务于*任意*查询——物体、材质、可供性（affordance）、活动、房间类型？

## 方法与架构

给定一个点云 $\mathbf{P} \in \mathbb{R}^{M \times 3}$以及带位姿的RGB图像，通过三个阶段产生逐点CLIP空间特征：

1. **图像特征融合（2D → 3D）。** 一个冻结的2D视觉-语言分割模型 $\mathcal{E}^{\text{2D}}$（OpenSeg或LSeg）给出逐像素嵌入 $\mathbf{I}_i \in \mathbb{R}^{H \times W \times C}$。每个表面点 $\mathbf{p}$通过针孔模型 $\tilde{\mathbf{u}} = I_i \cdot E_i \cdot \tilde{\mathbf{p}}$投影到第 $i$帧（并进行基于深度的遮挡检验），其 $K$个可见视角的特征被平均池化为一个融合特征 $\mathbf{f}^{\text{2D}} = \phi(\mathbf{f}_1, \cdots, \mathbf{f}_K)$，得到特征云 $\mathbf{F}^{\text{2D}} \in \mathbb{R}^{M \times C}$。
2. **3D蒸馏。** 一个稀疏卷积网络MinkowskiNet18A $\mathcal{E}^{\text{3D}}$学习仅从几何结构预测这些特征：

$$\mathbf{F}^{\text{3D}} = \mathcal{E}^{\text{3D}}(\mathbf{P}), \qquad \mathcal{E}^{\text{3D}} : \mathbb{R}^{M \times 3} \mapsto \mathbb{R}^{M \times C},$$

   使用余弦蒸馏损失训练：

$$\mathcal{L} = 1 - \cos\big(\mathbf{F}^{\text{2D}}, \mathbf{F}^{\text{3D}}\big),$$

   因此新的点云可以完全不借助任何图像就被嵌入。
3. **2D-3D集成。** 融合的2D特征在小型或几何上有歧义的物体（一个杯子、一幅画）上表现出色；蒸馏出的3D特征则在形状鲜明的结构（墙壁、地板）上取胜。对每个点，两者都会与查询集的CLIP文本嵌入 $\mathbf{t}_n$进行打分，$\mathbf{s}^{\text{2D}}_n = \cos(\mathbf{f}^{\text{2D}}, \mathbf{t}_n)$和 $\mathbf{s}^{\text{3D}}_n = \cos(\mathbf{f}^{\text{3D}}, \mathbf{t}_n)$，其中 $\max_n$得分更高的一方特征成为 $\mathbf{f}^{\text{2D3D}}$。

**推理**纯粹依赖余弦相似度：零样本分割通过 $\arg\max_n \cos(\mathbf{f}^{\text{2D3D}}, \mathbf{t}_n)$为每个点打标签；任意开放词汇文本以同样方式产生相关性热力图。训练过程中不使用任何2D或3D真实标签。

## 实验结果

- **零样本3D语义分割**（ScanNet，4个未见类别，采用3DGenZ的评测协议）：OpenScene-LSeg达到**62.8 mIoU**，而3DGenZ仅为7.7——即便3DGenZ在其他16个类别上用真实标签训练——OpenScene-OpenSeg达到83.7 mAcc。
- **完整基准测试**（全部类别，mIoU/mAcc）：Ours-OpenSeg在ScanNet验证集上取得47.5/70.7，在Matterport3D测试集上取得42.6/59.2，在nuScenes验证集上取得42.1/61.8——在所有数据集上都超过了零样本的MSeg-Voting基线（分别为45.6/54.4、33.4/39.0、31.0/36.9），并"与几年前的有监督方法相当"；在Matterport3D上与全监督SOTA的差距仅为-11.6 mIoU / -8.0 mAcc。
- **长尾扩展性**（Matterport3D上以最频繁的K个类别计算的mAcc）：全监督的MinkowskiNet随K从21增至160，性能从64.5降至18.4，而单一固定的OpenScene模型则从59.2降至23.1，在K ≥ 40时反超监督方法（K=40时为50.9对比50.8）。
- **消融实验**：在所有数据集/指标上，2D-3D集成都优于单独使用任一分支（例如OpenSeg在ScanNet上为47.5/70.7，而仅用融合的2D特征为41.4/63.6，仅用蒸馏的3D特征为46.0/66.3）；约70%的点选择了3D特征，且随着标签集的长尾程度增加，2D特征的占比也会上升。
- 首次展示了用单一模型、且不依赖任何有标注3D数据，对3D场景进行材质、可供性、活动和房间类型的开放词汇查询。

## 对SLAM的意义

OpenScene证明了互联网规模的2D视觉-语言知识可以迁移到3D地图上——这是语言驱动的空间智能的一个核心构建模块。对SLAM而言，这意味着地图可以用自由形式的语言查询，而不必局限于固定的标签集：先融合再蒸馏的思路（先将像素特征投影到几何上，再训练一个3D网络来预测它们）被ConceptFusion、ConceptGraphs和LERF所采纳，并且越来越成为机器人建图系统的一项预期能力。

## 相关条目

- [ConceptFusion](conceptfusion.md)
- [LERF](lerf.md)
- [ConceptGraphs](conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [SpatialLM](spatiallm.md)
