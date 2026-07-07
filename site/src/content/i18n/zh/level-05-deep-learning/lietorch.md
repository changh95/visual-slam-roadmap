# Lietorch

> Teed 2021 · [论文](https://github.com/princeton-vl/lietorch)

**一句话总结** — 一个PyTorch库，将三维变换群（SO(3)、RxSO3、SE(3)、Sim(3)）实现为一等可微张量类型，反向传播在每个群元素的切空间中进行（论文："Tangent Space Backpropagation for 3D Transformation Groups"，Teed & Deng，CVPR 2021，[arXiv:2103.12032](https://arxiv.org/abs/2103.12032)）。

## 问题

用于估计或优化相机位姿的深度网络必须对旋转和刚体变换求导，但这些量位于弯曲的流形上，而不是平坦的参数空间中。标准的"嵌入空间"自动微分（对矩阵元素或四元数分量求导）存在论文剖析的两种失效模式：一是像$\psi / \sin\psi$这样数值不稳定的项，其泰勒近似梯度必须针对每个运算手工调整；二是完全奇异的梯度——例如SO(3)对数映射中的$\cos^{-1}\big((\mathrm{tr}(X)-1)/2\big)$在恒等元处的导数未定义，因此PyTorch3D的矩阵对数在该处返回NaN梯度。在Lietorch之前，每个深度SLAM项目都要手工重新实现这套流形机制。

## 方法与架构

- **李群作为张量类型。** `lietorch.SE3`对SE(3)而言，就如同`torch.Tensor`对标量而言：一个支持索引、reshape、广播以及任意批量形状的群元素多维数组。旋转以单位四元数存储；所有群运算（Exp、Log、Inv、Mul、Adj、AdjT、对点的Act）都有CUDA和C++两种内核实现以及自定义梯度。
- **切空间微分。** 由于流形在加法下不封闭，普通微分通过收缩映射$\xi \oplus X = \operatorname{Exp}(\xi) \circ X$及其逆$X \ominus Y = \operatorname{Log}(X \circ Y^{-1})$被推广为：

$$Df(X)[\mathbf{v}] = \lim_{t\to 0} \frac{f(t\mathbf{v} \oplus X) \ominus f(X)}{t},$$

  将$X$切空间中的扰动与$f(X)$切空间中的扰动关联起来。随后反向模式自动微分通过链式法则$\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial Y} \mathbf{J}$传播行向量梯度，其中$\mathbf{J}$是切空间雅可比——对SO(3)而言是3维梯度，而不是autograd的9维嵌入梯度。
- **每个运算的解析雅可比。** 对于群乘法$Z = X \circ Y$，反向传播只是$\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial Z}$和$\frac{\partial\mathcal{L}}{\partial Y} = \frac{\partial\mathcal{L}}{\partial Z}\,\mathbf{Adj}_X$（对$R \in SO(3)$，$\mathbf{Adj}_R = R$）。对于对数映射$\phi = \operatorname{Log}(X)$，BCH公式给出$\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial\phi}\,\mathbf{J}_l^{-1}(\phi)$，其中左雅可比的逆$\mathbf{J}_l^{-1}$对SO(3)/SE(3)有闭式解；对于没有解析左雅可比的Sim(3)，级数$\mathbf{J}_l^{-1}(\phi) = \sum_n (-1)^n \frac{B_n}{n!} (\phi^{\curlywedge})^n$（$B_n$为伯努利数）被截断至所需精度。因此反向传播和前向传播一样表现良好——没有奇异梯度，没有经过调优的泰勒阈值。
- **深度SLAM的直接替换。** 目标计算图正是学习型SLAM中"迭代更新"模式的精确对应——网络预测增量$\delta_k$，以$e^{\delta_1}e^{\delta_2}e^{\delta_3}\mathbf{G}_1$的形式应用，并用测地线损失训练：

$$\mathcal{L}(\mathbf{T}_1,\ldots,\mathbf{T}_K) = \sum_k \|\operatorname{Log}(\mathbf{T}_k^{-1} \cdot \mathbf{T}^{*})\|,$$

  其中$\mathbf{T}^{*}$是真实位姿——作者指出这种损失用标准反向传播难以实现。

## 实验结果

- **逆运动学**（1000次运行，1000次迭代内、$10^{-4}$容差下收敛）：朴素PyTorch+Autograd在0%的问题上收敛；手工调优的Autograd达到99.8%（SO(3)）/100%；Lietorch无需任何调优即可在100%的问题上收敛。
- **位姿图优化**（Carlone等人的基准；黎曼梯度下降初始化+7步高斯-牛顿）：在parking-garage、sphere、torus和cube上与弦松弛（chordal relaxation）的全局最优代价相匹配，而g2o和GTSAM单独使用时会陷入较差的局部最小值（例如Sphere-A：$1.49\times 10^{6}$ vs g2o的$5.32\times 10^{10}$）；在最大的问题（cube，$n{=}8000$，$m{=}22236$）上，初始化耗时1.21秒，而chordal+gtsam为17.9秒，gradient+gtsam为26.4秒，Autograd为18.3秒——相比嵌入空间Autograd，由于GPU反向传播更简单，速度稳定提升10–15倍。
- **RGB-D Sim(3)配准**（TartanAir，RAFT风格网络+每次迭代3步可微高斯-牛顿更新）：未调优的Autograd产生NaN（0%成功率）；Lietorch达到约79%平移/91%旋转/98%尺度的成功率——这是首次演示通过相似变换进行反向传播，一阶/二阶/三阶左雅可比近似表现几乎相同。
- **RGB-D SLAM**（用测地线位姿损失重新实现的DeepV2D，在NYU+ScanNet上训练）：在TUM RGB-D基准上的平均ATE RMSE提升至0.105米，而原始DeepV2D为0.113米，DeepTAM为0.116米。

## 对SLAM的意义

每一个通过位姿优化学习的深度SLAM或深度VO系统都需要对SE(3)元素求导，而手工正确实现这一点容易出错（奇异点处的NaN、偏离流形的漂移）。Lietorch使流形正确的微分成为一个可复用、经过测试的库，它为DROID-SLAM和DPVO等系统提供了位姿层。与Theseus（可微非线性最小二乘）一起，它构成了PyTorch中可微几何优化的标准工具箱。

## 相关条目

- [Theseus](theseus.md) — 基于同样需求构建的可微非线性最小二乘
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — 基于Lietorch构建的旗舰系统
- [DPVO](../level-03-monocular-slam/dpvo.md) — 稀疏patch式后继系统，同样基于Lietorch
- [DeepV2D](deepv2d.md) — 用Lietorch的测地线损失重新训练的深度RGB-D SLAM系统
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — 底层数学基础
- [Differentiability](differentiability.md) — 为什么几何梯度在深度SLAM中很重要
