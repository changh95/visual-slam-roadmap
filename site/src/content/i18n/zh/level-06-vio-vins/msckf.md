# MSCKF
> Mourikis 2007 · [论文](https://ieeexplore.ieee.org/document/4209642)

**一句话总结** — 多状态约束卡尔曼滤波器（Multi-State Constraint Kalman Filter）通过在EKF状态中维护一个由相机*位姿*（而非地标）组成的滑动窗口，并将特征测量投影到地标雅可比矩阵的左零空间上，从而实现高效的单目VIO，使计算复杂度与特征数量呈线性关系。

## 问题
经典的EKF-SLAM将每个三维地标位置都放入状态向量中，因此协方差更新的计算量随地图规模呈平方增长——这对于视觉辅助惯性导航是不可接受的，因为特征提取器通常每帧要跟踪数百个点。成对方案（对极约束、图像对之间的相对位姿测量）会丢弃信息，并在统计上相关的约束中重复使用相同的像素。MSCKF所回答的问题是：一个被*多个*相机位姿观测到的特征轨迹，能否在不将该特征本身变为状态变量的情况下，以最优方式约束轨迹？

## 方法与架构
该滤波器遵循一个三步循环（论文中的算法1）：每收到一个IMU样本就**传播（propagate）**，每收到一帧图像就**扩增（augment）**，当特征轨迹结束时就**更新（update）**。

- **状态。** 演化中的IMU状态为
  $$\mathbf{X}_{\mathrm{IMU}} = \begin{bmatrix} {}^I_G\bar{q}^{\,T} & \mathbf{b}_g^T & {}^G\mathbf{v}_I^T & \mathbf{b}_a^T & {}^G\mathbf{p}_I^T \end{bmatrix}^T,$$
  其中${}^I_G\bar{q}$是单位四元数（全局到IMU的旋转），陀螺仪/加速度计偏置建模为随机游走，速度/位置则在全局坐标系下表示；姿态误差使用误差四元数$\delta\bar q$的最小3自由度表示$\delta\boldsymbol{\theta}$。完整状态还附加了最多$N_{\max}$个过去的相机位姿$({}^{C_i}_G\bar q,\, {}^G\mathbf{p}_{C_i})$。
- **传播。** IMU估计用五阶Runge-Kutta方法进行积分；协方差遵循Lyapunov方程$\dot{\mathbf{P}}_{II} = \mathbf{F}\mathbf{P}_{II} + \mathbf{P}_{II}\mathbf{F}^T + \mathbf{G}\mathbf{Q}_{\mathrm{IMU}}\mathbf{G}^T$，状态转移矩阵$\boldsymbol{\Phi}$通过数值积分求得。
- **状态扩增。** 每收到一帧新图像，相机位姿${}^{C}_G\hat{\bar q} = {}^{C}_I\bar q \otimes {}^{I}_G\hat{\bar q}$，${}^G\hat{\mathbf{p}}_C = {}^G\hat{\mathbf{p}}_I + \mathbf{C}_{\hat q}^T\,{}^I\mathbf{p}_C$会被附加进状态，协方差通过其雅可比矩阵进行相应扩展。
- **无结构测量模型（核心贡献）。** 当一个在$M_j$个位姿中被跟踪到的特征$f_j$丢失时，其位置${}^G\hat{\mathbf{p}}_{f_j}$通过采用逆深度参数化的Gauss-Newton最小二乘法进行三角化。将其所有观测的线性化重投影残差堆叠起来可得
  $$\mathbf{r}^{(j)} \simeq \mathbf{H}^{(j)}_{\mathbf{X}}\widetilde{\mathbf{X}} + \mathbf{H}^{(j)}_{f}\,{}^G\widetilde{\mathbf{p}}_{f_j} + \mathbf{n}^{(j)}.$$
  由于三角化使用了状态估计值，$\mathbf{r}^{(j)}$与$\widetilde{\mathbf{X}}$是相关的；将其投影到$\mathbf{H}^{(j)}_f$的左零空间（基为$\mathbf{A}$）上，可以精确地消除特征误差项：
  $$\mathbf{r}^{(j)}_o = \mathbf{A}^T(\mathbf{z}^{(j)} - \hat{\mathbf{z}}^{(j)}) \simeq \mathbf{A}^T\mathbf{H}^{(j)}_{\mathbf{X}}\widetilde{\mathbf{X}} + \mathbf{A}^T\mathbf{n}^{(j)},$$
  这是一个$(2M_j-3)$维的约束，将所有观测到该特征的位姿*同时*耦合在一起——在线性化误差范围内是最优的，可用Givens旋转以$O(M_j^2)$的复杂度隐式计算得到。
- **更新。** 将所有$L$个已完成特征的残差堆叠起来，通过QR分解$\mathbf{H}_X = \begin{bmatrix}\mathbf{Q}_1 & \mathbf{Q}_2\end{bmatrix}\begin{bmatrix}\mathbf{T}_H \\ \mathbf{0}\end{bmatrix}$将其压缩为$\mathbf{r}_n = \mathbf{Q}_1^T\mathbf{r}_o = \mathbf{T}_H\widetilde{\mathbf{X}} + \mathbf{n}_n$，然后再执行标准的EKF更新，增益为$\mathbf{K} = \mathbf{P}\mathbf{T}_H^T\big(\mathbf{T}_H\mathbf{P}\mathbf{T}_H^T + \mathbf{R}_n\big)^{-1}$。运动物体产生的外点用马氏距离检验剔除。当窗口已满时，会剔除$N_{\max}/3$个均匀间隔的位姿（保留最早的位姿——更长的基线携带更多信息）。

总计算量：随特征数量呈线性增长，相对于（有限的）窗口位姿数量最多呈三次方增长。

## 实验结果
在明尼阿波利斯的一次真实城市道路测试中进行评估：车上装有一台Pointgrey FireFly相机（640×480 @ 3 Hz）和一台ISIS IMU（100 Hz），共1598幅图像，历时约9分钟，使用SIFT特征，状态中最多保留30个相机位姿。在3.2公里的轨迹中，共有142,903条特征轨迹被用于EKF更新，在一台2 GHz Intel T7200的单核上以14 Hz的速度处理——比3 Hz的传感器采样率还快。最终的位置误差约为10 m，即**行驶距离的0.31%**，且没有使用回环检测和运动先验；估计的3σ精度在姿态上优于1°，在速度上优于0.35 m/s。

## 对SLAM的意义
MSCKF奠定了VIO中基于滤波器的分支，其无结构测量模型也成为标准做法，其影响远超滤波领域（例如GTSAM/Kimera中的智能因子）。它是S-MSCKF（立体版本）、ROVIO时代EKF设计以及OpenVINS的直接先祖，而针对其线性化行为的后续研究则催生了如今所有基于滤波的VIO都依赖的可观测性/一致性分析（首次估计雅可比，First-Estimate Jacobians）。它的高效性正是MSCKF类估计器在已部署的AR/VR跟踪系统栈中被广泛采用的原因。当每CPU周期的精度比绝对精度更重要时，MSCKF仍是参考设计。

## 相关条目
- [OpenVINS](openvins.md) — 具备FEJ和在线标定功能的现代开源MSCKF实现。
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md) — 立体扩展版本（S-MSCKF）。
- [ROVIO](rovio.md) — 另一个采用直接光度更新的基于滤波器的经典VIO系统。
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md) — MSCKF在设计空间中的位置。
- [Observability](observability.md) — MSCKF催生的分析传统。
- [Deployed VIO](deployed-vio.md) — MSCKF级别的效率最为重要的应用场景。
