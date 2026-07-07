# DTAM

> Newcombe 2011 · [论文](https://ieeexplore.ieee.org/document/6126513)

**一句话总结** — 第一个能从单个单目相机实时执行稠密3D重建和相机跟踪的系统，方法是在关键帧处累积光度代价体、进行带正则化的原始-对偶深度优化，并在GPU上对整幅图像与稠密模型进行对齐。

## 问题

DTAM之前的实时单目系统——MonoSLAM和PTAM——只能生成稀疏点地图：足以定位相机，但对遮挡感知的AR、避障，或任何需要表面信息的任务都毫无用处。稠密多视图重建早已存在，但都是离线运行，没有人对每一个到来的帧实时运行过它。DTAM（"Dense Tracking and Mapping in Real-Time"，Newcombe、Lovegrove、Davison，ICCV 2011）提出，稠密方法能对重建和跟踪都"利用图像中的全部数据"，而GPGPU并行计算最终让这种逐像素、逐帧的处理成为可能。

## 方法与架构

两个紧密交织的稠密过程：给定稠密模型，通过整幅图像对齐来跟踪每一帧；给定跟踪到的位姿，构建并细化稠密关键帧深度图。一旦通过一个标准的点特征立体初始化器完成自举，"就不再需要基于特征的骨架或跟踪"。

- **代价体**：每个关键帧 $r$ 在一系列逆深度采样 $d \in [\xi_{\min}, \xi_{\max}]$ 上存储一个平均光度误差 $C_r(\mathbf{u}, d)$，该误差由数十到数百个重叠的窄基线帧 $m \in \mathcal{I}(r)$ 累积而来：

$$C_r(\mathbf{u},d) = \frac{1}{|\mathcal{I}(r)|}\sum_{m\in\mathcal{I}(r)} \big\| I_r(\mathbf{u}) - I_m\big(\pi(K\, T_{mr}\, \pi^{-1}(\mathbf{u},d))\big) \big\|_1 .$$

  单个两视图代价存在很多极小值，但平均后的L1代价极小值很少；遮挡会变成异常值。运行均值随每帧到来而更新，因此不需要存储图像。
- **正则化深度**：逆深度图 $\xi$ 通过最小化一个非凸能量来求解，该能量带有一个由图像边缘加权的Huber梯度正则项，$g(\mathbf{u}) = e^{-\alpha\|\nabla I_r(\mathbf{u})\|_2^{\beta}}$：

$$E_\xi = \int_\Omega \big\{ g(\mathbf{u})\, \|\nabla \xi(\mathbf{u})\|_\epsilon + \lambda\, C(\mathbf{u}, \xi(\mathbf{u})) \big\}\, d\mathbf{u} .$$

- **原始-对偶加穷举搜索**：数据项和平滑项通过一个辅助变量 $\alpha$ 解耦，耦合项为 $\frac{1}{2\theta}(\xi - \alpha)^2$；当 $\theta \to 0$ 时恢复原始能量。凸部分通过原始-对偶（Legendre-Fenchel）方案求解，非凸的数据项则通过对每个像素在采样深度范围内做穷举搜索来求解——从而避免了会丢失细节的粗到细的图像变形（warping）方法。一个收缩边界 $r^{n+1}_{\mathbf{u}} = \sqrt{2\theta^n \lambda (C^{\max}_{\mathbf{u}} - C^{\min}_{\mathbf{u}})}$ 加速了搜索，并对拟合出的抛物线做一次牛顿步就能得到亚采样级的深度精度（这一点至关重要：即便只有 $S \le 64$ 个深度采样，也能得到细节丰富的表面）。
- **稠密跟踪**：将模型投影到一个虚拟相机以合成视图 $I_v$ 及其深度 $\xi_v$；通过Lucas-Kanade风格的前向组合高斯-牛顿法，对*每个*像素进行由粗到细的对齐，先做一次仅旋转的对齐以增强对运动模糊的鲁棒性，从而求得实时位姿：

$$F(\boldsymbol{\psi}) = \frac{1}{2}\sum_{\mathbf{u}\in\Omega} f_{\mathbf{u}}(\boldsymbol{\psi})^2, \qquad f_{\mathbf{u}}(\boldsymbol{\psi}) = I_l\big(\pi(K\, T_{lv}(\boldsymbol{\psi})\, \pi^{-1}(\mathbf{u}, \xi_v(\mathbf{u})))\big) - I_v(\mathbf{u}),$$

  其中 $\boldsymbol{\psi} \in \mathbb{R}^6$ 属于 $\mathfrak{se}(3)$。光度误差超过阈值（该阈值随迭代逐步降低）的像素会被丢弃，因此像挥动的手这类未建模的物体不会破坏跟踪。当预测图像中携带表面信息的像素太少时，会添加新的关键帧。

## 实验结果

在桌面场景中进行实时评测：使用Point Grey Flea2相机，30 Hz，640×480 RGB，运行在配备i7四核CPU的NVIDIA GTX 480 GPU上。关键帧深度图携带近 $300{\times}10^3$ 个估计点，而PTAM在同一帧中只使用约1000个点特征。评测是与PTAM的定性对比：在一个靠近杯子的高加速度往返轨迹上，PTAM反复跟踪丢失并需要重定位，而DTAM（其重定位模块被特意关闭）保持稳定跟踪，速度估计明显更平滑；DTAM在相机失焦时也能保持跟踪，并展示了一个具有正确遮挡处理的物理增强AR应用。文中没有给出轨迹误差基准数据——它留下的遗产是一套模板（代价体+正则化+原始-对偶+基于稠密模型的跟踪），后来被稠密和直接法SLAM所继承。

## 对SLAM的意义

在PTAM只能生成稀疏点地图的地方，DTAM证明了单个相机能够实时提供稠密表面，从而为更丰富的场景理解、遮挡感知AR和避障打开了大门。它开创了直接/稠密这条SLAM研究路线——直接影响了LSD-SLAM、DSO，并（通过同一位第一作者）影响了KinectFusion——并确立了GPU计算作为稠密SLAM核心工具的地位。从ElasticFusion到基于NeRF和3DGS的SLAM，现代稠密系统都是其"稠密跟踪与建图"蓝图的后继者。

## 相关条目

- [PTAM](ptam.md)
- [LSD-SLAM](lsd-slam.md)
- [DSO](dso.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
- [帧到模型跟踪](../level-04-rgbd-slam/frame-to-model-tracking.md)
