# MonoRec

> Wimbauer 2021 · [论文](https://arxiv.org/abs/2011.11814)

**一句话总结** — 一种基于单个移动相机的半监督稠密三维重建方法，通过从多视图立体代价体（cost volume）中的光度不一致性检测运动物体，从而应对动态环境。

## 问题

多视图立体（Multi-view stereo）能够从单个移动相机获得几何上可靠的稠密深度，但它建立在静态场景假设之上：运动的汽车和行人会违反多视图约束，并恰恰在自动驾驶系统最关心的区域破坏代价体。单图像深度预测能够处理运动物体，但依赖于与特定相机内参绑定的学习到的透视外观，因此泛化能力较差。第二个障碍是监督信号——密集的真值意味着需要激光雷达。MonoRec 同时针对这两个问题：在动态场景中进行稠密重建，且训练时不依赖激光雷达深度值。

## 方法与架构

给定连续帧 $\{I_1,\dots,I_N\}$ 以及来自稀疏视觉里程计系统（DVSO）的位姿，MonoRec 为关键帧 $I_t$ 预测稠密的逆深度图 $D_t$。两个模块作用于平面扫描代价体（plane-sweep cost volumes）之上。

**SSIM 代价体。** 与常见的逐块 SAD 不同，深度假设 $d$ 处的逐像素光度误差使用 $3\times3$ 图块上的 SSIM 计算，$pe(\mathbf{x},d)=\frac{1-\text{SSIM}(I_{t^{\prime}}^{t}(\mathbf{x},d),I_{t}(\mathbf{x}))}{2}$，并在各帧上聚合为

$$C(\mathbf{x},d)=1-2\cdot\frac{1}{\sum_{t^{\prime}}\omega_{t^{\prime}}}\cdot\sum_{t^{\prime}}pe_{t^{\prime}}^{t}(\mathbf{x},d)\cdot\omega_{t^{\prime}}(\mathbf{x})$$

其中权重 $\omega_{t'}(\mathbf{x})$ 强调该帧在其他深度步长上的光度误差最小值，因此置信度更高的帧权重更大；$C\in[-1,1]$。

**MaskModule（掩码模块）。** 从一组*单帧*代价体 $C_{t'}$ 出发，预测 $M_t(\mathbf{x})\in[0,1]$，即某像素属于运动物体的概率：动态像素在不同的 $C_{t'}$ 之间会呈现不一致的最优深度步长。$I_t$ 的预训练 ResNet-18 特征加入了语义先验（仅靠几何信息会在低纹理/非兰伯特表面以及匀速运动物体上产生混淆）。一个共享权重的 U-Net 编码器处理每个 $C_{t'}$，特征经最大池化后再解码——因此该模块可适用于任意数量的帧。

**DepthModule（深度模块）。** 接收多帧代价体 $C$（在每个深度步长上与预测的掩码逐像素相乘之后——从而使运动物体区域不再有极大值/强先验），并与 $I_t$ 拼接；一个 U-Net 解码出多尺度逆深度，迫使网络从图像特征和周围环境中推断出运动物体的深度。

**多阶段半监督训练。** 引导（bootstrapping）阶段使用 $\mathcal{L}_{depth}=\sum_{s=0}^{3}\mathcal{L}_{self,s}+\alpha\mathcal{L}_{sparse,s}+\beta\mathcal{L}_{smooth,s}$ 训练 DepthModule，该损失结合了对时序重投影和静态立体重投影取逐像素最小值的光度损失，

$$\mathcal{L}_{self,s}=\min_{t^{\star}\in t^{\prime}\cup\{t^{S}\}}\Big(\lambda\tfrac{1-\text{SSIM}(I_{t^{\star}}^{t},I_{t})}{2}+(1-\lambda)\,\lVert I_{t^{\star}}^{t}-I_{t}\rVert_{1}\Big),\quad \lambda=0.85$$

以及来自视觉里程计点云的稀疏深度监督 $\mathcal{L}_{sparse,s}=\lVert D_{t}-D_{VO}\rVert_{1}$——无需激光雷达，无需人工标注。MaskModule 通过辅助掩码（Mask-RCNN 标出的可移动实例，再通过时序/静态立体不一致性标记为运动状态）进行引导。随后的精化阶段将两个模块耦合起来：掩码被训练为静态立体损失与时序立体损失之间的插值因子（$\mathcal{L}_{m\_ref}$），深度精化则仅对运动像素反向传播静态立体损失，并加上一个立体深度先验（$\mathcal{L}_{d\_ref}$）。

## 实验结果

- **KITTI**（里程计与 Eigen 划分的交集：13,714 训练/8,634 测试，改进后的真值，80 米上限）：Abs Rel 0.050，Sq Rel 0.295，RMSE 2.266，RMSE-log 0.082，$\delta_1$ 0.973——在整体上超越 Colmap（0.099 Abs Rel）、Monodepth2（0.082）、带激光雷达的半监督 PackNet（0.077）、DORN（0.077）、DeepMVS（预训练 0.088）以及带精化的 DeepTAM（0.053，RMSE 2.480），且这一切都是在没有激光雷达真值训练的情况下取得的。
- **消融实验**：仅使用 SSIM 代价体就能将 RMSE 从基于 SAD 风格基线的 2.624 降至 2.444；加入 MaskModule 及两个精化阶段后达到完整的 2.266。
- **泛化能力**：在 KITTI 上训练的模型可迁移到 Oxford RobotCar 和手持设备采集的 TUM-Mono 序列上，这些场景是单目方法难以应对、且其他多视图立体方法在运动物体上会出现伪影的场景。
- **运行速度**：批大小为 1 时约 10 fps，占用 2 GB 内存（512×256 输入）。

## 对SLAM的意义

现实世界中的单目稠密重建必须应对汽车和行人这类运动物体；MonoRec 表明代价体本身就包含了找到这些物体所需的证据，从而将动态物体检测与深度估计统一起来，而不是在推理阶段外挂一个语义检测器。该方法出自 TUM 直接法 SLAM 研究组，刻意设计为可接收来自任意稀疏视觉里程计系统的位姿（输入位姿，输出稠密地图），并影响了后续的实时稠密建图工作，如 TANDEM。

## 相关条目

- [TANDEM](tandem.md) — 来自同一研究组的实时跟踪与建图系统
- [DVSO](../level-03-monocular-slam/dvso.md) — 提供位姿和稀疏深度监督的视觉里程计系统
- [D3VO](../level-03-monocular-slam/d3vo.md) — 提供位姿/深度谱系的深度视觉里程计
- [DeepV2D](deepv2d.md) — 交替进行深度与位姿估计
- [自监督深度](../level-03-monocular-slam/self-supervised-depth.md) — 训练理念的背景
- [DSO](../level-03-monocular-slam/dso.md) — 为 MonoRec 一类系统提供位姿的直接法里程计谱系
