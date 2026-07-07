# MASt3R-Fusion

> Zhou 2025 · [论文](https://arxiv.org/abs/2509.20757)

**一句话总结** — 在一个分层因子图中，将前馈式MASt3R视觉模型与IMU和GNSS测量紧密融合，为基础模型稠密SLAM赋予度量尺度和全局地理配准能力。

## 问题

经典视觉SLAM"常常在低纹理环境、尺度模糊以及视觉条件恶劣时表现不佳受损"；前馈式点图回归（MASt3R）通过直接从图像中恢复高保真几何结构解决了其中大部分问题。但这些新流程放弃了"经过广泛验证的概率多传感器信息融合的优势"：没有来自IMU的度量尺度，没有来自GNSS的绝对地理配准，也没有有原则的不确定性管理。MASt3R-Fusion探讨的问题是如何将一个前馈式视觉模型与惯性和GNSS传感*紧密*耦合，而不是事后拼接。

## 方法与架构

分两个阶段：**实时SLAM**（带前馈前端的滑动窗口VIO）和**全局优化**（针对完整轨迹的回环检测+GNSS）。

**前馈式视觉测量。** 沿用MASt3R-SLAM的做法，每张图像被编码为词元$\mathbf{F}_i=\mathcal{F}_{\mathrm{enc}}(\mathbf{I}_i)$，成对的图像被联合解码为点图和描述符图

$$\mathbf{X}^{ij}_{i},\,\mathbf{X}^{ij}_{j},\,\mathbf{D}^{ij}_{i},\,\mathbf{D}^{ij}_{j}=\mathcal{F}_{\mathrm{dec}}\left(\mathbf{F}_{i},\mathbf{F}_{j}\right)$$

其中$\mathbf{X}^{ij}_i,\mathbf{X}^{ij}_j$是在$i$的参考帧下表达的2D到3D点图。稠密匹配通过对点图进行射线邻近优化完成，再借助描述符点积和4倍双线性上采样的描述符图进行细化以获得亚像素精度；深度残差较大的对应关系会被屏蔽掉，这同时也剔除了动态物体。

**Sim(3)点图对齐约束。** 每个关键帧携带一个点图$\mathbf{X}_i$和一个相机到世界的相似变换$\mathbf{S}_i\in\mathrm{Sim}(3)$（尺度$s$、旋转$\mathbf{R}$、平移$\mathbf{t}$）。对于一对匹配点，残差结合了已知深度下的重投影以及针对纯旋转情形的深度项：

$$\mathbf{r}_{ij}\left(\mathbf{S}^{i}_{j}\right)=\begin{bmatrix}\mathbf{u}^{i}_{j}-\pi\left(\mathbf{S}^{i}_{j}\circ\mathbf{X}_{j}\right)\\ \left(\mathbf{X}_{i}\left[\mathbf{u}^{i}_{j}\right]\right)_{z}-\left(\mathbf{S}^{i}_{j}\circ\mathbf{X}_{j}\right)_{z}\end{bmatrix}$$

其中$\mathbf{S}^i_j=\mathbf{S}_i^{-1}\circ\mathbf{S}_j$为相对Sim(3)变换。与光束法平差不同，这里没有优化逐点深度——网络得到的3D结构在尺度以内被信任，因此视觉约束成为紧凑的成对因子。每个稠密约束在GPU上被压缩为海森矩阵形式$\mathbf{H}_{ij}=(\mathbf{J}^{r}_{ij})^{\top}\mathbf{J}^{r}_{ij}$，$\mathbf{v}_{ij}=(\mathbf{J}^{r}_{ij})^{\top}\mathbf{r}_{ij}$——每对只需向CPU求解器传递一个$7\times 7$的块。

**同构群变换。** 为了与度量尺度传感器融合，Sim(3)被分解为$\mathrm{SE}(3)\times\mathbb{R}$，其李代数扰动之间通过如下线性关系相联系

$$\begin{bmatrix}\boldsymbol{\omega}\\ \boldsymbol{\nu}\\ \sigma\end{bmatrix}=\underbrace{\begin{bmatrix}1&&\\ &s\mathbf{I}&\\ &&s\end{bmatrix}}_{\boldsymbol{\Lambda}}\begin{bmatrix}\boldsymbol{\theta}\\ \boldsymbol{\tau}\\ \delta s\end{bmatrix}$$

因此Sim(3)视觉海森矩阵可以直接附加到SE(3)位姿加上每个关键帧的尺度$s_i$上。

**滑动窗口因子图。** 窗口状态为$\mathcal{X}_i=(\mathbf{T}_i,s_i,\mathbf{v}_i,\mathbf{b}_i)$——SE(3)位姿、尺度、速度、IMU偏置——以float64表示（稠密GPU运算则保持局部float32）。标准的IMU预积分因子$\mathbf{r}_b$连接相邻关键帧，旧状态通过舒尔补边缘化为一个先验$(\mathbf{H}_m,\mathbf{v}_m)$。实时代价为

$$\sum_{i\in\mathcal{W}}\left\|\mathbf{r}_{\mathrm{b}}(\mathcal{X}_{i},\mathcal{X}_{i+1})\right\|^{2}+\sum_{(i,j)\in\mathcal{E}}\mathbf{E}_{\mathrm{v}}(\mathcal{X}_{i},\mathcal{X}_{j})+\mathbf{E}_{m}(\mathcal{X})$$

**全局SLAM。** 回环候选来自前馈编码器词元检索，在昂贵的稠密验证之前先经过一个高效的VIO不确定性检验筛选（由沿轨/横轨误差传播得到的距离不确定性$\sigma_{p,q}$）。GNSS位置作为因子$\mathbf{r}_g$，通过临时的IMU预积分节点绑定到关键帧上以处理时间偏移。两步全局优化首先使用经Cauchy鲁棒化的相对位姿回环约束，然后将内点回环替换为完整海森形式的视觉因子——从而保留全部视觉-惯性信息，而不是退化为一个纯位姿图。

## 实验结果

- **KITTI-360（单目VIO）**：平均相对平移误差比DM-VIO低43.0%，比DBA-Fusion低17.7%（例如高速公路序列0003：$t_{rel}$为0.406%，而后两者分别为1.146%/1.041%）；纯视觉的MASt3R-SLAM在这种尺度下基本失效（相对平移误差为21%–55%）。
- **KITTI-360（带回环检测的全局SLAM）**：归一化ATE为轨迹长度的0.05%，相较之下ORB-SLAM3为0.63%，VGGT-Long为2.91%——例如在8.4 km的序列0000上ATE为2.13 m，而ORB-SLAM3为26.03 m，VGGT-Long为103.64 m。
- **SubT-MRS（洞穴，室内外混合）**：VIO ATE为长度的0.23%，而DBA-Fusion/ORB-SLAM3/DM-VIO为0.41%–1.74%；带回环检测时为0.13%，而ORB-SLAM3为0.37%，纯视觉的VGGT-Long则在全部三个序列上失败。
- **武汉城市数据集（视觉-惯性-GNSS）**：在真实GNSS RTK条件下，两个序列的水平RMSE分别为0.21 m/0.09 m，而VINS-Fusion的松耦合全局融合分别为2.54/0.62 m；在模拟的100秒GNSS中断下仍保持0.37/0.46 m的RMSE。
- 在笔记本电脑的RTX 4080 Mobile GPU上实时运行，并能在8 GB GPU显存下处理任意长的序列。代码：[GREAT-WHU/MASt3R-Fusion](https://github.com/GREAT-WHU/MASt3R-Fusion)。

## 对SLAM的意义

MASt3R-Fusion证明了3D基础模型前端与生产系统所依赖的经典多传感器因子图机制是兼容的——不必在学习到的稠密几何和严谨的传感器融合之间做二选一。将Sim(3)约束嵌入SE(3)图的技巧（通过$\boldsymbol{\Lambda}$同构）是最值得记住的关键模式：正是这一手段让尺度模糊的学习几何被度量传感器锚定。它指出了已部署SLAM系统的发展方向：用前馈模型做感知，用因子图做估计，用绝对传感器做锚定。

## 相关条目

- [MASt3R-SLAM](mast3r-slam.md)
- [MASt3R](mast3r.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Tightly-coupled vs Loosely-coupled](../level-06-vio-vins/tightly-coupled-vs-loosely-coupled.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
