# MASt3R-SLAM

> Murai 2024 · [论文](https://arxiv.org/abs/2412.12392)

**一句话总结** — 首个自底向上、基于双视图3D重建先验（MASt3R）设计的实时稠密SLAM系统，能够以15 FPS从未标定的单目视频中生成全局一致的位姿和稠密地图。

## 问题

经典的稠密单目SLAM需要经过标定的相机，其几何信息要么来自深度传感器，要么来自脆弱的多视图立体匹配；在真实世界的视频上它会严重退化。MASt3R提供了截然相反的权衡：一个强大的、鲁棒且无需标定的双视图重建与匹配先验，但没有关键帧、全局一致性或实时运行的概念——其稠密匹配单独一对就需要约2秒。MASt3R-SLAM在这个先验之上自底向上构建了一个完整的SLAM系统，在保留其通用性的同时补上了SLAM所需的一切。

## 方法与架构

**流程**：每一帧都与当前关键帧配对，输入MASt3R，$\mathcal{F}_M(\mathcal{I}^f, \mathcal{I}^k)$，输出点图$\mathbf{X}$、置信度$\mathbf{C}$、匹配特征$\mathbf{D}$以及特征置信度$\mathbf{Q}$。跟踪模块估计相对位姿并将几何信息融合进关键帧；后端通过检索添加回环边并运行二阶全局优化。

- **Sim(3)状态，通用相机**：由于网络预测的尺度不一致，所有位姿都表示在$\mathbf{Sim}(3)$中：$\mathbf{T} = \begin{bmatrix} s\mathbf{R} & \mathbf{t} \\ 0 & 1 \end{bmatrix}$，通过$\mathbf{T} \leftarrow \operatorname{Exp}(\boldsymbol{\tau}) \circ \mathbf{T}$更新。唯一的相机假设是存在唯一的相机中心：$\psi(\mathbf{X}^i_i)$将点图归一化为单位射线——因此*每个点图定义了自己的相机模型*，从而免费地处理了变焦和畸变。
- **迭代式投影匹配**：不进行全局特征搜索，而是通过Levenberg–Marquardt迭代优化像素位置，将$\mathbf{X}^j_i$中的每个点$\mathbf{x}$投影到参考帧，$\mathbf{p}^* = \arg\min_{\mathbf{p}} \|\psi([\mathbf{X}^i_i]_{\mathbf{p}}) - \psi(\mathbf{x})\|^2$（由于$\|\psi_1 - \psi_2\|^2 = 2(1 - \cos\theta)$，这等价于最小化射线夹角），然后在局部窗口内通过特征相似度进行细化。自定义CUDA核函数将其耗时压缩到约2 ms——相比MASt3R自身匹配的2秒，使整个系统快了近40倍。
- **基于射线的跟踪**：由于深度预测不一致会扭曲3D点误差，跟踪转而对匹配点最小化一个有界的角度射线误差（Huber范数$\rho$，置信权重$w(\mathbf{q}, \sigma_r^2)$，其中$\mathbf{q}_{m,n} = \sqrt{\mathbf{Q}^f_{f,m} \mathbf{Q}^k_{f,n}}$）：

$$E_r = \sum_{m,n \in \mathbf{m}_{f,k}} \left\| \frac{\psi\big(\tilde{\mathbf{X}}^k_{k,n}\big) - \psi\big(\mathbf{T}_{kf} \mathbf{X}^f_{f,m}\big)}{w(\mathbf{q}_{m,n}, \sigma_r^2)} \right\|_\rho ,$$

  通过高斯-牛顿IRLS求解，$(\mathbf{J}^\top \mathbf{W} \mathbf{J}) \boldsymbol{\tau} = -\mathbf{J}^\top \mathbf{W} \mathbf{r}$，并加入一个小的距离项以避免纯旋转退化。
- **点图融合**：每个被跟踪的帧通过一个基于置信度加权的滑动平均来更新关键帧的规范点图，$\tilde{\mathbf{X}}^k_k \leftarrow \big(\tilde{\mathbf{C}}^k_k \tilde{\mathbf{X}}^k_k + \mathbf{C}^k_f (\mathbf{T}_{kf} \mathbf{X}^k_f)\big) / \big(\tilde{\mathbf{C}}^k_k + \mathbf{C}^k_f\big)$——这既是对几何的滤波，也是对相机模型本身的滤波，因为相机模型正是由射线定义的。
- **回环检测**：新关键帧会查询一个由已编码的MASt3R特征构建的增量式ASMK检索数据库；被检索到的候选帧经MASt3R解码，若存活的匹配数量足够则成为图中的边。
- **二阶后端**：通过固定第一个$\mathbf{Sim}(3)$位姿来处理规范自由度问题；所有边$\mathcal{E}$上的射线误差$E_g$（形式与$E_r$相同，其中$\mathbf{T}_{ij} = \mathbf{T}_{WC_i}^{-1} \mathbf{T}_{WC_j}$）通过高斯-牛顿法配合在$7N \times 7N$海森矩阵上的稀疏Cholesky分解来最小化，所有雅可比均为解析形式并在CUDA中累积。
- **标定模式**：若已知内参，点图会被约束在已知射线上，残差切换为像素重投影$E_\Pi$——这一简单修改就能带来最先进的精度。

## 实验结果

在i9-12900K + RTX 4090上以约15 FPS运行（帧率降采样2倍以模拟实时）；采用带尺度对齐的轨迹计算ATE RMSE（单位为米）：

- **TUM RGB-D**：标定情况下平均ATE为0.030——优于DROID-SLAM（0.038）、GO-SLAM（0.035）和DPV-SLAM++（0.054）。未标定情况下为0.060，而DROID-SLAM在使用GeoCalib内参时为0.158——与标定版DPV-SLAM相当。
- **7-Scenes**：标定情况下平均0.047（DROID-SLAM为0.049，NICER-SLAM为0.086）；即使未标定的0.066也优于使用深度/法向/光流先验且离线运行的NICER-SLAM。
- **EuRoC**：在全部11个序列上平均为0.041（落后于通过灰度图像增强训练的DROID-SLAM）。
- **ETH3D-SLAM**：在训练序列上，单目系统中平均ATE最优且曲线下面积最大——鲁棒性尾部表现最长。
- **稠密几何**（7-Scenes）：Chamfer距离标定为0.066/未标定为0.056，而DROID-SLAM为0.077，Spann3R为0.058。
- 消融实验：加权点图融合优于保留最近/最先/中位置信度的预测；射线误差优于3D点误差；2 ms的投影匹配器在1/1000的时间内达到与完整MASt3R匹配相当的精度（标定情况下ATE 0.039对0.042）；回环检测同时改善了位姿和几何精度。

## 对SLAM的意义

MASt3R-SLAM是即插即用的：将其对准来自任意相机——甚至变焦或畸变会变化的相机——拍摄的视频，就能获得无需深度传感器、无需标定流程、无需逐场景训练的稠密全局一致几何。这重新定义了单目稠密SLAM应达到的基准，其架构（学习到的双视图先验+经典的Sim(3)图优化）已成为大多数基础模型SLAM系统目前遵循的模板。

## 动手实践

- [运行 MASt3R-SLAM](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/mast3r_slam)

## 相关条目

- [MASt3R](mast3r.md)
- [DUSt3R](dust3r.md)
- [DROID-SLAM](droid-slam.md)
- [VGGT-SLAM](vggt-slam.md)
- [MASt3R-Fusion](mast3r-fusion.md)
- [Covisibility graph](../level-03-monocular-slam/covisibility-graph.md)
