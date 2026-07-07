# DUSt3R

> Wang 2024 · [论文](https://arxiv.org/abs/2312.14132)

**一句话总结** — 将成对3D重建重新表述为由前馈Transformer直接回归稠密点图（pointmap）的问题，无需相机标定、特征匹配或显式几何模型。

## 问题

野外场景下的多视图立体匹配首先需要估计相机内参和外参，这一步骤获取起来繁琐，却又是三角化对应像素得到3D点的必要条件。整套经典流水线——标定、检测、匹配、位姿估计、三角化——是一连串脆弱的阶段，每一步都可能出错。DUSt3R（"Dense and Unconstrained Stereo 3D Reconstruction"）采取了相反的立场：在*没有*任何关于标定或视角位姿的先验信息的情况下，通过直接回归3D结构来重建任意图像集合。

## 方法与架构

**点图表示**：一个网络 $\mathcal{F}$ 接收两张RGB图像 $I^1, I^2 \in \mathbb{R}^{W \times H \times 3}$，输出两张点图 $X^{1,1}, X^{2,1} \in \mathbb{R}^{W \times H \times 3}$——即逐像素的3D坐标——以及置信度图 $C^{1,1}, C^{2,1}$。两张点图都表示在*相机1的坐标系*下，因此一次前向传播就同时解决了标定、对应关系和重建这三个问题。将同一张图像输入两次即可得到单目深度；这一表述统一了单目和双目两种情形。

**架构**（CroCo风格，从CroCo预训练权重初始化）：一个权重共享的孪生ViT-Large编码器，$F^1 = \text{Encoder}(I^1)$，$F^2 = \text{Encoder}(I^2)$，随后是两个相互交织的ViT-Base解码器，其中每个模块都执行自注意力、*对另一视图token的交叉注意力*以及一个MLP：

$$G_i^1 = \text{DecoderBlock}_i^1\big(G_{i-1}^1, G_{i-1}^2\big), \qquad G_i^2 = \text{DecoderBlock}_i^2\big(G_{i-1}^2, G_{i-1}^1\big),$$

其中 $G_0^v := F^v$。每个分支上的一个DPT回归头，将所有解码器token映射为一张点图加一张置信度图。整个过程从不施加任何几何约束——网络是从具有几何一致性的训练数据中学习到这些先验的。

**训练目标**：对视图 $v$ 中每个有效像素 $i$ 做尺度归一化的3D回归，

$$\ell_{\text{regr}}(v,i) = \left\| \frac{1}{z} X_i^{v,1} - \frac{1}{\bar{z}} \bar{X}_i^{v,1} \right\|,$$

其中 $z, \bar{z}$ 分别是所有有效点到原点的平均距离，再包裹进一个按置信度加权的损失中，用以学习哪些预测是可信的：

$$\mathcal{L}_{\text{conf}} = \sum_{v \in \{1,2\}} \sum_{i \in \mathcal{D}^v} C_i^{v,1} \, \ell_{\text{regr}}(v,i) - \alpha \log C_i^{v,1}, \qquad C_i^{v,1} = 1 + \exp \widetilde{C_i^{v,1}} > 1.$$

**一切都作为副产品自然得到**：像素匹配通过在3D点图空间中做互为最近邻得到；焦距通过对 $X^{1,1}$ 上的像素重投影残差做Weiszfeld式最小化得到；相对位姿通过对 $X^{1,1} \leftrightarrow X^{1,2}$ 做Procrustes对齐，或通过PnP-RANSAC得到；绝对位姿（视觉定位）通过与参考点图做尺度对齐得到。

**$N$视图的全局对齐**：在图像对上构建一个连通图 $\mathcal{G}(\mathcal{V}, \mathcal{E})$（在H100上网络推理每对大约耗时40毫秒），然后优化世界点图 $\chi^n$，以及每条边一个刚性位姿 $P_e$ 和尺度 $\sigma_e$：

$$\chi^* = \arg\min_{\chi, P, \sigma} \sum_{e \in \mathcal{E}} \sum_{v \in e} \sum_{i=1}^{HW} C_i^{v,e} \left\| \chi_i^v - \sigma_e P_e X_i^{v,e} \right\|, \qquad \textstyle\prod_e \sigma_e = 1.$$

与光束法平差不同，这里最小化的是*3D*投影误差，而不是2D重投影误差，且只需普通梯度下降即可运行——数百步，在GPU上仅需几秒钟。将 $\chi^n$ 替换为一个针孔相机参数化形式，即可恢复所有位姿 $P_n$、内参 $K_n$ 和深度图 $D^n$。

**训练数据**：来自八个数据集（Habitat、MegaDepth、ARKitScenes、Static Scenes 3D、Blended MVS、ScanNet++、CO3D-v2、Waymo）的850万对图像，先在224像素分辨率下训练，再在512像素、多种宽高比下训练。

## 实验结果

- **多视图位姿估计**（每个序列随机取10帧）：在CO3Dv2上，带全局对齐的DUSt3R-512取得RRA@15为96.2、RTA@15为86.8、mAA(30)为76.7，使用PnP时为94.3/88.4/77.2——而PoseDiffusion为80.5/79.8/66.5，PixSfM为33.7/32.9/30.1。在RealEstate10K（训练中从未见过）上，其mAA(30)达到67.7（全局对齐）/61.2（PnP），而PoseDiffusion为48.0。
- **单目与多视图深度**：同一个模型（从未针对具体任务微调）在KITTI、ScanNet、ETH3D、DTU和Tanks & Temples基准上，在自监督和有监督对比的设置下均取得了最先进或相当的结果。
- **视觉定位**：仅通过与已知位姿的参考图像进行匹配，在7-Scenes和Cambridge Landmarks上取得了具有竞争力的绝对位姿精度。
- 它更深层次的影响是范式层面的：一个在足够多3D数据上训练的前馈网络，取代了"标定-检测-匹配-三角化"整套流水线，开启了"3D基础模型"这一研究方向——MASt3R（匹配）、MASt3R-SLAM（在线运行）、MonST3R（动态场景）以及VGGT系列（多视图前馈）都建立在其点图表示之上。

## 对SLAM的意义

DUSt3R开启了几何视觉的"3D基础模型"时代：用一个单一的预训练网络取代经典的检测-匹配-三角化流水线，即便在未标定图像上、仅有两个视图的情况下也能工作。它直接催生了MASt3R和MASt3R-SLAM，影响了像VGGT这样的前馈多视图模型，如今支撑着SLAM研究的一整个分支——在其中，一个学习到的点图回归器作为前端，经典优化作为后端。了解它的各项假设（离线配对、全局对齐代价、逐对尺度模糊）有助于理解后续系统究竟修复了哪些问题。

## 相关条目

- [MASt3R](mast3r.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [VGGT](vggt.md)
- [COLMAP](colmap.md)
- [MonST3R](monst3r.md)
