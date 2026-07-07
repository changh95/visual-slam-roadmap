# DeepV2D

> Teed 2018 · [论文](https://arxiv.org/abs/1812.04605)

**一句话总结** — DeepV2D通过将经典几何算法(类似PnP的位姿更新、平面扫描立体匹配)组合成可微模块,并在运动估计和深度估计之间交替进行直至两者收敛,从视频预测深度——本质上是一种学习到的块坐标下降法。

## 问题

从视频中恢复深度处在两个都不尽如人意的极端之间:经典SfM流程具有几何原理支撑,但在低纹理区域、遮挡和光照变化下会产生带噪声或缺失的重建结果,而通用的深度回归网络则很难被训练成真正利用多视图几何信息。DeepV2D的目标是构建一个端到端架构,"将神经网络的表示能力与支配图像形成的几何原理结合起来"——它把一个在立体视觉、稠密2D匹配和PnP之间交替进行的经典SfM流程"可微化"。

## 方法与架构

推理时两个模块交替运行。在针孔模型下,给定投影 $\pi$ 和反投影 $\pi^{-1}$,相机 $i$ 中深度为 $z$ 的像素 $\mathbf{x}$ 重投影到相机 $j$ 中为 $\pi(\mathbf{G}_{ij}\,\pi^{-1}(\mathbf{x},z))$,其中 $\mathbf{G}_{ij}=\mathbf{G}_{j}\mathbf{G}_{i}^{-1}$ 是 $SE(3)$ 中的相对位姿。

**深度模块**(给定位姿,预测关键帧深度):一个堆叠沙漏型2D编码器将每张图像映射为特征 $F_i$;对每个非关键帧 $j$,通过在深度假设 $z_1,\dots,z_D$(室内0.2-10米)上进行反投影来构建代价体:

$$C_{uvk}^{j}=F_{j}\big(\pi(\mathbf{G}_{j}\mathbf{G}_{1}^{-1}\pi^{-1}(\mathbf{x},z_{k}))\big),$$

使用可微的双线性采样——因此该代价体对相机位姿也是可微的。多个代价体与关键帧特征拼接,经3D卷积匹配,在多个视图间取平均("视图池化"),再由3D沙漏模块精炼,最后通过深度维度上的可微软argmax读出结果。

**运动模块(Flow-SE3)**(给定深度,更新位姿):一个共享特征提取器加一个沙漏网络,在关键帧特征与用当前深度/位姿变形后的特征之间预测稠密的*残差光流* $\mathbf{R}$ 及置信度 $\mathbf{W}$。每个像素在位姿扰动 $\xi\in se(3)$ 上定义一个几何重投影误差:

$$\mathbf{e}_{k}^{ij}(\xi_{i},\xi_{j})=\mathbf{r}_{k}-\big[\pi\big((e^{\xi_{j}}\mathbf{G}_{j})(e^{\xi_{i}}\mathbf{G}_{i})^{-1}\mathbf{X}_{k}^{i}\big)-\pi(\mathbf{G}_{ij}\mathbf{X}_{k}^{i})\big],\qquad \mathbf{X}_{k}^{i}=\pi^{-1}(\mathbf{x}_{k},z_{k}),$$

目标函数 $E(\boldsymbol{\xi})=\sum_{(i,j)\in\mathcal{C}}\sum_{k}\mathbf{e}_{k}^{ij\,T}\,diag(\mathbf{w}_{k})\,\mathbf{e}_{k}^{ij}$ 通过一次可微的高斯-牛顿步进行最小化

$$\xi^{*}=-(\mathbf{J}^{T}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^{T}\mathbf{W}\,\mathbf{r},$$

相当于展开了单次PnP迭代;梯度经由该求解过程流回光流网络和特征网络。对集合 $\mathcal{C}$ 有两种变体:*关键帧*优化(关键帧与每一帧配对;每个 $\xi_j$ 独立求解)和*全局*优化(所有 $N\times(N-1)$ 对,像位姿图那样联合更新所有位姿)。

**训练与推理。** 监督信号为L1深度损失加平滑惩罚项,以及预测位姿与真值位姿之间的Huber鲁棒重投影损失,组合为 $\mathcal{L}=\mathcal{L}_{depth}+\lambda\mathcal{L}_{motion}$(其中 $\lambda=1$)。推理时以恒定深度图初始化(self-init)或用单图像网络初始化(fcrn-init),再交替运行两个模块——评估时迭代8次,不过精度在几次迭代内就已收敛。

## 实验结果

- **NYUv2**(尺度匹配后的深度):Abs Rel为0.061,RMSE为0.403,$\delta<1.25$ 为0.956(fcrn-init,全局优化)——相比之下,在NYU上重新训练的DeMoN为0.144,MVSNet+OpenMVG为0.181,单图像方法DORN为0.109/DenseDepth为0.103。即便是self-init也能达到Abs Rel 0.070。
- **ScanNet**:在ScanNet上训练,Abs Rel为0.057,sc-inv为0.077,旋转误差0.628度,平移误差1.373厘米;*仅在NYU上*训练时,它在所有指标上仍优于BA-Net(5视图:Abs Rel 0.091)——展现出很强的跨数据集泛化能力。
- **SUN3D**:(NYU+ScanNet训练)L1-inv为0.041/sc-inv为0.104,相比DeepTAM为0.054/0.128——尽管DeepTAM是在SUN3D上训练并使用真值位姿进行评估的。
- **KITTI**(Eigen划分):Abs Rel为0.037,RMSE为2.005,相比BA-Net为0.083/3.640,DORN为0.069/2.857。
- **TUM RGB-D跟踪**(平移RMSE,单位米/秒):平均0.033,相比DeepTAM为0.040,DVO为0.060,使用了在滑动8帧窗口上的全局位姿优化。
- 消融实验:将3D立体匹配网络替换为相关层+2D编码器-解码器,会使NYU上的Abs Rel从0.062恶化到0.135。

## 对SLAM的意义

DeepV2D是从DeMoN到DROID-SLAM这一脉络中的关键一环:它表明,在学习到的运动和学习到的深度之间迭代——由几何(一个作用于 $SE(3)$ 上的可微高斯-牛顿层)来协调两者的交互——胜过一次性回归任一变量。与BA-Net在深度基上进行联合优化不同,DeepV2D的块坐标下降式分解直接优化逐像素深度。Teed与Deng后续提出的RAFT和DROID-SLAM正是从这种"交替并收敛"的设计中直接生长出来的,而这一设计如今支撑着最精确的学习式VO/SLAM系统。

## 相关条目

- [DeMoN](demon.md)
- [BA-Net](ba-net.md)
- [DeepTAM](deeptam.md)
- [RAFT](raft.md)
- [DROID-SLAM](droid-slam.md)
