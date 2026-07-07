# StereoMSCKF

> Sun 2018 · [论文](https://arxiv.org/abs/1712.00036)

**一句话总结** — StereoMSCKF（S-MSCKF）将基于滤波器的 MSCKF VIO 框架适配到双目相机，在计算成本上与单目方案相当，同时提供了显著更高的鲁棒性——使得在嵌入式处理器上进行快速自主微型飞行器飞行成为可能。

## 问题

视觉辅助惯性里程计技术已经相当成熟，但对于自主飞行的微型飞行器而言，计算效率和鲁棒性仍然是尚未解决的挑战，其尺寸和重量限制排除了高质量传感器和强力处理器的使用。执行搜救任务的微型飞行器面临剧烈的光照变化、低纹理，以及由风力扰动引起的突然姿态变化——VIO 必须保持鲁棒，同时还要与规划和控制共享机载计算机而不能出现 CPU 峰值。此前的双目视觉惯性方案计算量大且基于优化方法；S-MSCKF 反驳了"双目一定比单目成本高得多"的观点，提供了第一个无需 GPU 加速即可在机载运行的、基于滤波器的开源双目 VIO 系统。

## 方法与架构

**前端（约占计算量的 80%）。** 使用 KLT 光流对 FAST 角点进行时间上的跟踪，而且——不同寻常地——KLT 也被用于左右双目匹配，而非描述子匹配，作者发现描述子匹配会消耗远多得多的 CPU，而精度提升却很小。异常值通过时间轨迹上的 2 点 RANSAC，以及在前后两个双目图像对之间的循环匹配来剔除。经验表明，深度超过 1 米的特征在其 20 厘米的基线下仍能被可靠匹配。

**滤波器状态。** EKF 估计 IMU 状态（包含相机-IMU 外参）以及一个包含 $N$ 个相机位姿的滑动窗口：

$$\mathbf{x}_{I}=\left({}^{I}_{G}\mathbf{q}^{\top}\;\; \mathbf{b}_{g}^{\top}\;\; {}^{G}\mathbf{v}^{\top}_{I}\;\; \mathbf{b}_{a}^{\top}\;\; {}^{G}\mathbf{p}^{\top}_{I}\;\; {}^{I}_{C}\mathbf{q}^{\top}\;\; {}^{I}\mathbf{p}^{\top}_{C}\right)^{\top}$$

其中 ${}^{I}_{G}\mathbf{q}$ 是世界到 IMU 的旋转，${}^{G}\mathbf{v}_I,{}^{G}\mathbf{p}_I$ 是速度/位置，$\mathbf{b}_g,\mathbf{b}_a$ 是陀螺仪/加速度计偏置。误差状态表示法（$\delta\mathbf{q}\approx(\tfrac12\,{}^{G}_{I}\tilde{\boldsymbol\theta}^\top\;\;1)^\top$）使方向不确定性保持三维；传播使用对 IMU 动力学 $\dot{\tilde{\mathbf{x}}}_I=\mathbf{F}\tilde{\mathbf{x}}_I+\mathbf{G}\mathbf{n}_I$ 的四阶龙格-库塔积分。

**双目观测模型。** 在相机位姿 $i$ 处观测到的每个特征 $f_j$ 提供一个堆叠两个视图的 4 维观测：

$$\mathbf{z}_{i}^{j}=\left(u_{i,1}^{j}\;\; v_{i,1}^{j}\;\; u_{i,2}^{j}\;\; v_{i,2}^{j}\right)^{\top},$$

即左（$C_{i,1}$）和右（$C_{i,2}$）相机坐标系下特征位置的投影；将其保持在 $\mathbb{R}^4$ 而非 $\mathbb{R}^3$ 中,可以免去立体校正的需要。当一条轨迹结束时，特征位置 ${}^{G}\mathbf{p}_j$ 通过最小二乘三角化得到，堆叠的残差被线性化为 $\mathbf{r}^{j}=\mathbf{H}_{\mathbf{x}}^{j}\tilde{\mathbf{x}}+\mathbf{H}_{f}^{j}\,{}^{G}\tilde{\mathbf{p}}_{j}+\mathbf{n}^{j}$，并通过 $\mathbf{H}_f^j$ 的零空间 $\mathbf{V}$ 将该特征投影消去：

$$\mathbf{r}^{j}_{o}=\mathbf{V}^{\top}\mathbf{r}^{j}=\mathbf{H}_{\mathbf{x},o}^{j}\tilde{\mathbf{x}}+\mathbf{n}^{j}_{o}$$

因此地标从不进入状态向量——这就是无结构 MSCKF 技巧，现在由能够从单帧提供度量深度的双目几何来驱动。

**一致性与边缘化。** VIO 存在四个不可观测方向（全局位置和偏航角）；朴素的 EKF 会产生虚假的偏航信息。S-MSCKF 采用了可观性约束 EKF（OC-EKF），选用它而非 FEJ 是因为它对精确初始化的依赖较小。S-MSCKF 不像 MSCKF 那样一次性边缘化三分之一的位姿（会造成 CPU 峰值），而是每隔一次更新移除两个相机状态，其选择基于一种依据相对运动的双向类关键帧策略。

## 实验结果

- **EuRoC**（20 Hz 双目，200 Hz IMU），与 OKVIS（双目优化法）、ROVIO（单目滤波法）、VINS-Mono（单目优化法）对比，每种方法各运行 5 次：四种方法的精度相近，只是 ROVIO 在机械大厅（machine-hall）场景中漂移更多；S-MSCKF 仅在 `V2_03_difficult` 上失败，该场景中双目图像之间持续的亮度不一致破坏了 KLT 双目匹配。基于滤波器的方法使用的 CPU 最少；S-MSCKF 滤波器本身在 20 Hz 下仅占用约 10% 的单核，总计算量的约 80% 花在前端。
- **快速飞行数据集**（公开）：在机场跑道上进行了四次飞行，最高速度分别为 5、10、15 和 17.5 m/s（40 Hz 960×800 双目，200 Hz IMU）。S-MSCKF 在保持与 OKVIS 和 VINS-Mono 相当精度（相对 GPS 的 x-y RMSE）的同时，实现了最低的 CPU 使用率；由于明显的尺度漂移，ROVIO 被排除在比较之外。
- **自主飞行**：完全机载估计，穿过一片林区、进入仓库并返回——在约 700 米的往返行程中，最终漂移约为 3 米，不到行驶距离的 0.5%，尽管经历了室内外光照转换。
- 开源发布：`KumarRobotics/msckf_vio`。

## 对SLAM的意义

S-MSCKF 建立了标准的基于滤波器的双目 VIO 方案：双目 KLT 前端用于即时深度获取，无结构 MSCKF 后端保证效率，OC-EKF 保证一致性。它具体地证明了，对于计算资源受限的空中机器人而言，一个精心设计的 EKF 能够以远低得多的成本媲美基于优化的系统——这一权衡后来被 OpenVINS 系统化。如果你的平台是小型无人机或嵌入式板卡，这一系脉络——MSCKF → S-MSCKF → OpenVINS——通常就是你应该入手的地方。

## 相关条目

- [MSCKF](../level-06-vio-vins/msckf.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [OKVIS](../level-06-vio-vins/okvis.md)
- [ROVIO](../level-06-vio-vins/rovio.md)
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md)
- [Scale observability](scale-observability.md)
