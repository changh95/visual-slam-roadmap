# Photo-SLAM

> Huang 2024 · [论文](https://arxiv.org/abs/2311.16728)

**一句话总结** — 一种"超基元"（hyper primitives）地图将显式的ORB特征几何（用于因子图定位）与由3DGS渲染的可学习光度属性耦合在一起，为单目、双目和RGB-D相机提供实时的照片级真实感SLAM——甚至可以在Jetson AGX Orin上运行。

## 问题

神经渲染SLAM已经展示了联合定位与照片级真实感重建的良好前景，但"现有方法完全依赖隐式表示，资源消耗巨大，无法在便携设备上运行，这偏离了SLAM的初衷"。NICE-SLAM/ESLAM类系统通过基于光线采样的损失来优化位姿，这不仅速度慢，还需要深度（或深度预测器）才能收敛，并且需要预先定义的边界体。Photo-SLAM的答案是一种分工方案：用显式几何特征做定位，用可学习的光度特征做外观呈现，且不依赖稠密深度。

## 方法与架构

四个并行线程——定位、几何建图、照片级真实感建图、回环检测——共同维护一个**超基元地图**：每个点云 $\mathbf{P}\in\mathbb{R}^{3}$ 都携带一个ORB特征 $\mathbf{O}\in\mathbb{R}^{256}$、旋转 $\mathbf{r}\in SO(3)$、缩放 $\mathbf{s}\in\mathbb{R}^{3}$、密度 $\sigma$，以及球谐系数 $\mathbf{SH}\in\mathbb{R}^{16}$。ORB特征服务于2D-2D/2D-3D对应关系；光度属性服务于基于splatting的渲染。

- **定位（仅优化运动的BA）**：作为一个因子图求解，使用Levenberg-Marquardt方法，针对匹配关键点 $\mathbf{p}_i$ 与地图点 $\mathbf{P}_i$ 之间的重投影误差：

$$\{\mathbf{R},\mathbf{t}\}=\mathop{\arg\min}\limits_{\mathbf{R},\mathbf{t}}\sum_{i\in\mathcal{X}}\rho\left(\lVert\mathbf{p}_{i}-\pi(\mathbf{R}\mathbf{P}_{i}+\mathbf{t})\rVert^{2}_{\Sigma_{g}}\right),$$

  其中 $\pi$ 是投影函数，$\rho$ 是Huber代价函数，$\Sigma_g$ 是关键点的尺度协方差。几何建图在共视关键帧和地图点上运行局部BA——跟踪从不依赖渲染的收敛情况。
- **照片级真实感建图**：超基元由一个基于tile的渲染器（3DGS对SH导出颜色的alpha混合）栅格化，并在光度损失下针对 $\mathbf{P},\mathbf{r},\mathbf{s},\sigma,\mathbf{SH}$ 进行优化

$$\mathcal{L}=(1-\lambda)\left|I_{\text{r}}-I_{\text{gt}}\right|_{1}+\lambda\left(1-\text{SSIM}(I_{\text{r}},I_{\text{gt}})\right), \qquad \lambda=0.2 .$$

- **基于几何的稠密化**：不到约30%的2D特征点具有三角化的3D点；未被激活的点标记了纹理复杂的区域，因此系统会在这些区域生成临时超基元——深度来自传感器（RGB-D）、最近的激活特征（单目）或双目匹配（双目）——作为对标准基于梯度的split/clone操作的补充。
- **基于高斯金字塔（GP）的学习**：训练目标从最粗的金字塔层级逐步推进到完整图像，$t_{0}:\arg\min\mathcal{L}(I^{n}_{\text{r}},\text{GP}^{n}(I_{\text{gt}}))\;\dots\;t_{n}:\arg\min\mathcal{L}(I^{0}_{\text{r}},\text{GP}^{0}(I_{\text{gt}}))$——多层级特征被逐步学习（默认3个层级），消融实验表明这一点对单目输入最为重要。
- **回环检测**通过相似变换来纠正关键帧和超基元，消除因漂移产生的重影。整个系统用C++/CUDA实现（基于ORB-SLAM3、3DGS和LibTorch构建）。

## 实验结果

桌面平台为RTX 4090；同一套代码也在笔记本（RTX 3080 Ti）和Jetson AGX Orin上原样运行：

- **Replica，单目**：ATE RMSE为1.091厘米，PSNR为33.302，SSIM为0.926，LPIPS为0.078，渲染速度为911 FPS，训练耗时不到2分钟——相比之下Go-SLAM为71.05厘米/21.17 dB/0.821 FPS渲染速度。在Jetson上：1.235厘米，29.28 dB，95 FPS渲染速度，占用4 GB GPU内存。
- **Replica，RGB-D**：0.604厘米，PSNR为34.958，渲染速度1084 FPS（不到2分钟），相比Point-SLAM的34.632 dB和0.510 FPS渲染速度以及超过2小时的耗时——摘要中所说的"相比之前的在线系统，PSNR提高30%，渲染速度快数百倍"。
- **TUM，单目**：在fr1-desk/fr2-xyz/fr3-office上分别为1.539/0.984/1.257厘米，与ORB-SLAM3精度相当，同时还增加了照片级真实感建图，而Go-SLAM的误差为33–106厘米。
- **双目**：在EuRoC MAV上给出了定量结果；论文称其为"第一个支持双目相机在线照片级真实感建图的系统"，另附有ZED 2手持室外场景的定性结果。
- 消融实验证实，基于几何的稠密化提供了足够数量的基元，而GP学习则确保这些基元得到充分优化，从而在实时速度下提升了PSNR。

## 对SLAM的意义

Photo-SLAM证明了照片级真实感3DGS SLAM可以在嵌入式机器人平台上实时运行，而不仅限于桌面GPU。它的解耦模板——用经典的基于特征的跟踪保证鲁棒性，用高斯splatting专门负责外观——成为了实用高斯SLAM的标准架构之一（GS-ICP SLAM将其作为"解耦式"方案的对比基准）。它也提醒了我们：一个成熟的经典前端（ORB-SLAM3）加上一个现代地图后端，在效率上可以胜过端到端设计，同时不牺牲精度。

## 相关条目

- [SplaTAM](splatam.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
- [RTG-SLAM](rtg-slam.md)
- [MonoGS](monogs.md)
- [GS-ICP SLAM](gs-icp-slam.md)
