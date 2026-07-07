# OKVIS2-X

> Boche & Leutenegger 2025 · [论文](https://arxiv.org/abs/2510.04612)

**一句话总结** — OKVIS2-X将OKVIS2扩展为一个统一的多传感器SLAM系统，融合视觉、惯性、测量或学习得到的深度、LiDAR和GNSS测量，同时构建与估计器紧耦合的稠密体素占据子地图（submap）——可扩展到9公里长的序列并实时运行。

## 问题

大多数最先进的VI-SLAM系统只能构建稀疏的地标地图，缺乏下游任务所需的几何细节（例如路径规划需要明确的*自由空间*表示，而点云和网格都无法表达这一点），并且每个系统通常都是围绕一套固定的传感器组合构建的。一个搭载相机、IMU、深度/LiDAR以及GNSS接收器的机器人，传统上需要将独立的VIO、LiDAR惯性以及建图系统栈拼接在一起。OKVIS2-X试图一次性满足所有需求：最高的精度和鲁棒性、稠密且全局一致的体素占据地图、大规模运行能力，以及实时性能——全部整合在一个单一的、可配置的因子图框架中。

## 方法与架构

OKVIS2-X保留了OKVIS2的前端（BRISK关键点、DBoW2场景识别、可选的Fast-SCNN天空分割）、实时估计器和异步全图回环优化，并新增了三个模块：一个**深度网络（Depth Network）**、一个**多传感器处理器（Multi-Sensor Processor）**（GNSS残差、LiDAR运动去畸变、帧到地图因子），以及一个**子地图接口（Submapping Interface）**。所有内容都被组合进一个统一的目标函数：

$$c(\mathbf{x}) = \frac{1}{2}\sum_{i,k,j} \rho_{\mathrm{c}}\left({\mathbf{e}_{\mathrm{r}}^{i,j,k}}^T \mathbf{W}_{\mathrm{r}} \mathbf{e}_{\mathrm{r}}^{i,j,k}\right) + \frac{1}{2}\sum_{k} {\mathbf{e}_{\mathrm{s}}^{k}}^T \mathbf{W}_{\mathrm{s}}^{k} \mathbf{e}_{\mathrm{s}}^{k} + \frac{1}{2}\sum_{r,c} {\mathbf{e}_{\mathrm{p}}^{r,c}}^T \mathbf{W}_{\mathrm{p}}^{r,c} \mathbf{e}_{\mathrm{p}}^{r,c} + \frac{1}{2}\sum \rho_{\mathrm{t}}\left(e_{\mathrm{m}}^2\right) + \frac{1}{2}\sum_{j\in\mathcal{G}} {\mathbf{e}_{\mathrm{g}}^{j}}^T \mathbf{W}_{\mathrm{g}}^{j} \mathbf{e}_{\mathrm{g}}^{j},$$

即重投影因子、预积分IMU因子、由边缘化推导出的位姿图因子、地图对齐因子（帧到地图以及地图到地图）以及GNSS因子，并配以Cauchy核（$\rho_{\mathrm{c}}$）和Tukey核（$\rho_{\mathrm{t}}$）作为鲁棒化处理。

- **体素占据子地图**（Supereight2，多分辨率）：每个子地图都锚定在一个关键帧上，因此估计器的更新会移动子地图,并保持其局部一致性。占据log-odds值$l({}_M\mathbf{p}) = \log\frac{P_{\text{occ}}}{1 - P_{\text{occ}}}$以递归方式融合，$L_k = \frac{L_{k-1} w_{k-1} + l}{w_{k-1} + 1}$，权重带饱和限制，$w_k = \min(w_{k-1}+1,\, w_{\max})$。新的子地图会由重叠度/关键帧数量准则触发创建（假设单个子地图内的漂移可忽略）。
- **地图对齐因子**紧密耦合了建图与估计：每个被测量到的点都应位于某个表面上（即$L = 0$），其到最近表面的距离由占据场线性外推得到，
  $$e_{\mathrm{m}}^{a,b} = \frac{d}{\sigma} = \frac{L({}_{S_a}\mathbf{p})}{\sqrt{\frac{L_{\min}^2}{9} + \sigma_d^2\, \lvert \nabla L({}_{S_a}\mathbf{p}) \rvert^2}}, \qquad d = \frac{L}{\lvert\nabla L\rvert},$$
  该因子既应用于帧到地图（当前帧与最近完成的子地图之间），也应用于地图到地图（在子地图完成时,重叠的子地图之间）。
- **将学习到的深度作为一种传感器**：一个立体网络和一个MVS网络都被附加了在拉普拉斯损失下训练得到的不确定性解码器，$\mathcal{L}_u = \sum_i \frac{\lvert u_i - u_{\text{gt}_i}\rvert}{\sigma_{u_i}} + \log \sigma_{u_i}$；两种深度估计以逆方差最优的方式融合，$\hat{d}_{\text{fuse}} = \sigma^2_{\text{fuse}}\left(\sigma^{-2}_{\text{st}} \hat{d}_{\text{st}} + \sigma^{-2}_{\text{mvs}} \hat{d}_{\text{mvs}}\right)$，其中$\sigma^2_{\text{fuse}} = \left(\sigma^{-2}_{\text{st}} + \sigma^{-2}_{\text{mvs}}\right)^{-1}$，逐像素的$\sigma_d$为地图因子加权——因为启发式的（LiDAR线性、RGB-D二次）噪声模型并不适用于网络输出的深度。
- **GNSS融合**：状态被扩增了一个到ENU坐标系的4自由度变换$\mathbf{T}_{GW}$；残差$\mathbf{e}_{\mathrm{g}}^{j} = \mathbf{z}^{j} - \left[\mathbf{C}_{GW}\left({}_W\hat{\mathbf{r}}_{S_j} + \hat{\mathbf{C}}_{WS_j}\, {}_S\mathbf{r}_A\right) + {}_G\mathbf{r}_W\right]$对异步测量使用IMU传播得到的位姿，并使用已知的天线杆臂${}_S\mathbf{r}_A$。初始化以估计变换的航向角方差作为触发门限；长时间的信号中断会触发类似回环检测的全局重新对齐。
- **在线相机-IMU外参标定**：外参不仅出现在重投影因子中，也出现在相对位姿图因子中——在地标边缘化之前，双视角Gauss-Newton系统会被扩增，将相对位姿误差扩展到$\mathbb{R}^{6+6N}$（针对$N$个相机）。

## 实验结果

- **EuRoC**：VIO（因果模式，无回环检测）平均ATE为0.066 m，相比OpenVINS的0.117和Kimera2的0.112——误差降低了41%；VI-SLAM非因果模式下为0.030 m，优于ORB-SLAM3（0.035）和MAVIS-SLAM（0.034），加上最终BA后为0.028 m。在V101–V103上的网格精度：0.031–0.039 m，相比SimpleMapping的0.071–0.086 m,且完整性更高。
- **Hilti-Oxford（Hilti22）**：VI配置在排行榜上优于所有已发表的竞争方法；VI-LiDAR配置将平均位置误差降至4.1厘米（排除exp07后为2.8厘米），与LiDAR惯性方法Wildcat相当，且LiDAR能在视觉失效的黑暗房间（exp03）中支撑系统继续运行。
- **VBR（罗马，长达9公里）**：VI性能优于ORB-SLAM3/OpenVINS；VI-LiDAR即使在因果模式下也优于FAST-LIVO，平均误差为1.771米（占轨迹长度的0.06%），并能在导致其他方法失效的IMU缺失片段中存活下来。在Campus1上模拟了75秒/450米的RTK-GNSS信号中断：加入最终BA后,在约3公里轨迹上的ATE为0.169米。
- **耗时/内存**（i7-13700 + RTX 3080）：Ours-vi在EuRoC MH05上运行速度可达47 Hz（每帧墙钟时间38.1毫秒，相比ORB-SLAM3的64.7毫秒）；深度网络≥13 Hz；GPU内存占用3.51 GB；也能在NVIDIA Orin NX上搭载于无人机运行。完全开源。

## 对SLAM的意义

OKVIS2-X代表了当前开源多传感器SLAM的前沿：由OKVIS/OKVIS2开创的滑动窗口+位姿图架构,能够干净地从一对相机-IMU推广到一整套传感器组合，稠密占据建图也从被动的附带产物升级为一种能够*改善*轨迹的一级因子。对实践者而言，它是一个单一的、可配置的系统（vi / vid / vil / vig / vidg / vilg），覆盖了此前需要拼接独立的VIO、LiDAR惯性以及建图系统栈才能满足的使用场景——而且它的地图明确表达了自由空间，可直接用于安全导航。

## 相关条目

- [OKVIS2](okvis2.md)
- [OKVIS](okvis.md)
- [LiDAR-Visual-Inertial (LVI)](../level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
- [Multi-Sensor Fusion SLAM Survey](../level-09-lidar-visual-lidar-slam/multi-sensor-fusion-slam-survey.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
