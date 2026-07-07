# ORB-SLAM3

> Campos 2020 · [论文](https://arxiv.org/abs/2007.11898)

**一句话总结** — 第一个支持视觉、视觉惯性和多地图SLAM的SLAM库，覆盖单目、双目和RGB-D相机，并支持针孔和鱼眼相机模型，相比之前的系统显著提升了精度。

## 问题

ORB-SLAM2缺乏IMU融合，也无法从跟踪失败中恢复：一旦跟踪丢失，地图基本上就报废了。现实世界的部署场景——AR头显、无人机、长时间的机器人任务——都需要在临时遮挡、退化运动和长时间视觉信息不佳的情况下存活下来。ORB-SLAM3（IEEE TRO，萨拉戈萨大学）解决了这两个缺口：一个紧耦合的视觉惯性系统，"即使在IMU初始化阶段也完全依赖最大后验（MAP）估计"，以及一个Atlas多地图机制，将跟踪丢失从一场灾难变成一个可恢复的事件。

## 方法与架构

系统保留了ORB-SLAM2的线程结构，并扩展以支持多地图操作：**跟踪线程**将每一帧定位到活动地图中（在惯性模式下，将机体速度和IMU偏置加入被优化的状态中）；**局部建图线程**通过在关键帧滑动窗口上进行视觉或视觉惯性BA来扩展和优化活动地图，并运行IMU初始化；**回环与地图融合线程**以关键帧速率搜索整个Atlas——在活动地图中的匹配会触发回环检测，在另一个地图中的匹配会触发无缝融合（先进行焊接窗口BA，再进行本质图位姿优化），之后在单独的线程中进行全局BA。相机模型（投影、反投影、雅可比矩阵）被抽象为一个模块，因此针孔和Kannala-Brandt鱼眼模型可以贯穿全系统使用，包括基于MLPnP的重定位，以及将未校正的双目视为两个带固定外参 $\mathrm{SE}(3)$ 约束的单目相机来处理。

在视觉惯性模式下，每个关键帧的状态为 $\mathcal{S}_{i}\doteq\{\mathbf{T}_{i},\mathbf{v}_{i},\mathbf{b}^{g}_{i},\mathbf{b}^{a}_{i}\}$（位姿、速度、陀螺仪/加速度计偏置）。关键帧之间的IMU预积分给出 $\Delta\mathbf{R}_{i,i+1},\Delta\mathbf{v}_{i,i+1},\Delta\mathbf{p}_{i,i+1}$ 以及惯性残差 $\mathbf{r}_{\mathcal{I}_{i,i+1}}$，例如旋转项 $\mathbf{r}_{\Delta\mathrm{R}_{i,i+1}}=\mathrm{Log}\left(\Delta\mathbf{R}_{i,i+1}^{\mathrm{T}}\mathbf{R}_{i}^{\mathrm{T}}\mathbf{R}_{i+1}\right)$。结合重投影残差 $\mathbf{r}_{ij}=\mathbf{u}_{ij}-\Pi\left(\mathbf{T}_{\mathrm{CB}}\mathbf{T}_{i}^{-1}\oplus\mathbf{x}_{j}\right)$，视觉惯性SLAM就是基于关键帧的MAP问题

$$\min_{\bar{\mathcal{S}}_{k},\mathcal{X}}\left(\sum_{i=1}^{k}\left\lVert\mathbf{r}_{\mathcal{I}_{i-1,i}}\right\rVert_{\Sigma_{\mathcal{I}_{i,i+1}}^{-1}}^{2}+\sum_{j=0}^{l-1}\sum_{i\in\mathcal{K}^{j}}\rho_{\mathrm{Hub}}\left(\left\lVert\mathbf{r}_{ij}\right\rVert_{\Sigma_{ij}^{-1}}\right)\right)$$

Huber核只作用于视觉项，因为惯性测量不存在误关联问题。

**基于MAP的IMU初始化**分三步进行：(1) 仅视觉——2秒的纯单目SLAM能给出一条准确的、带尺度模糊的轨迹；(2) 仅惯性——状态 $\mathcal{Y}_{k}=\{s,\mathbf{R}_{\mathrm{wg}},\mathbf{b},\bar{\mathbf{v}}_{0:k}\}$（尺度、重力方向、偏置、速度）通过下式求解

$$\mathcal{Y}_{k}^{*}=\arg\min_{\mathcal{Y}_{k}}\left(\|\mathbf{b}\|_{\Sigma_{b}^{-1}}^{2}+\sum_{i=1}^{k}\|\mathbf{r}_{\mathcal{I}_{i-1,i}}\|_{\Sigma_{\mathcal{I}_{i-1,i}}^{-1}}^{2}\right)$$

同时固定视觉轨迹不变；(3) 联合视觉惯性BA。跟踪丢失分两个阶段处理：短期（用IMU给出位姿，在宽窗口内重新匹配地图点）和长期（在Atlas中启动一个全新的活动地图）。**改进的场景识别**通过针对地图中已有的共视关键帧进行几何验证——而不是等待连续三个关键帧检测——来提升DBoW2的召回率，并在匹配关键帧周围的局部窗口中密集搜索中期匹配。

## 实验结果

所有实验均在Intel Core i7-7700 CPU上运行。在EuRoC上（10次运行的中位数，RMS ATE），ORB-SLAM3在所有四种配置下均超越了之前的系统：双目惯性在全部11个序列上平均为0.035米（0.6%尺度误差），单目惯性为0.043米，双目为0.084米，单目在完成的序列上为0.041米。单目惯性"比MCSKF、OKVIS和ROVIO精确五到十倍，比VI-DSO和VINS-Mono精确一倍以上"；双目惯性比Kimera和VINS-Fusion精确三到四倍。IMU初始化在2秒内可将尺度误差降至5%，经过细化后约为1%。在鱼眼TUM-VI基准上，它整体优于VINS-Mono和Basalt；在类AR/VR房间序列中，双目惯性平均ATE为0.009米，单目惯性为0.011米。在EuRoC多会话实验中，Atlas融合使精度比CCM-SLAM和VINS-Mono提高了一倍以上（相较于VINS-Mono的优势从单会话的2.6倍增长到多会话的3.2倍）。总体而言，摘要声称"比之前的方法精确两到十倍"；该开源版本成为随后数百篇论文的标准基准。

## 对SLAM的意义

ORB-SLAM3是从PTAM和ORB-SLAM开始的基于特征的SLAM系列的集大成之作，在发布时是当时最完整、最精确的开源SLAM库——第一个在算法所有阶段都利用短期、中期、长期*以及*多地图数据关联的系统。多地图Atlas使得长期、抗失败的运行成为可能，其基于MAP的视觉惯性初始化为VIO系统树立了新标准。它至今仍是该领域最常用的基准之一，也是许多生产系统的起点。

## 相关条目

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM2](orb-slam2.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Basalt](../level-06-vio-vins/basalt.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)
