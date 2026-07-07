# Extended Kalman Filter (EKF)

**扩展卡尔曼滤波器（Extended Kalman Filter）**是带非线性模型的递归状态估计的主力方法。它对状态维护一个高斯信念 $\mathcal{N}(\hat{\mathbf{x}}, P)$，并交替进行两个步骤——**预测**（通过运动模型传播信念）和**更新**（用测量值对其进行修正）——这恰好就是递归贝叶斯滤波器，只是所有密度都近似为高斯分布，所有模型都在当前估计处做了线性化。

## 建立模型

系统由一个非线性运动模型和一个非线性观测模型描述：

$$
\mathbf{x}_k = f(\mathbf{x}_{k-1}, \mathbf{u}_k) + \mathbf{w}_k, \qquad \mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, Q_k)
$$

$$
\mathbf{z}_k = h(\mathbf{x}_k) + \mathbf{v}_k, \qquad \mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, R_k)
$$

其中 $\mathbf{x}$ 是状态（例如相机位姿、速度、地标位置），$\mathbf{u}$ 是控制或IMU输入，$\mathbf{z}$ 是测量值（例如被跟踪特征的像素坐标），$Q$、$R$ 分别是过程噪声和测量噪声的协方差。EKF用在当前估计处求值的雅可比矩阵对 $f$ 和 $h$ 进行线性化：

$$
F_k = \left.\frac{\partial f}{\partial \mathbf{x}}\right|_{\hat{\mathbf{x}}_{k-1|k-1}}, \qquad
H_k = \left.\frac{\partial h}{\partial \mathbf{x}}\right|_{\hat{\mathbf{x}}_{k|k-1}}
$$

## 预测

$$
\hat{\mathbf{x}}_{k|k-1} = f(\hat{\mathbf{x}}_{k-1|k-1}, \mathbf{u}_k)
$$

$$
P_{k|k-1} = F_k P_{k-1|k-1} F_k^T + Q_k
$$

均值通过完整的非线性模型传播；只有协方差使用了线性化。这一步中不确定性会增大（航位推算漂移）。

## 更新

$$
\mathbf{y}_k = \mathbf{z}_k - h(\hat{\mathbf{x}}_{k|k-1}) \qquad \text{（新息，innovation）}
$$

$$
S_k = H_k P_{k|k-1} H_k^T + R_k \qquad \text{（新息协方差）}
$$

$$
K_k = P_{k|k-1} H_k^T S_k^{-1} \qquad \text{（卡尔曼增益）}
$$

$$
\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + K_k \mathbf{y}_k, \qquad
P_{k|k} = (I - K_k H_k)\, P_{k|k-1}
$$

增益 $K_k$ 权衡测量值与预测值：置信度高的预测（$P$小）或噪声较大的传感器（$R$大）会产生较小的修正，反之亦然。新息协方差 $S_k$ 还支持**门限检验（gating）**——马哈拉诺比斯检验 $\mathbf{y}^T S^{-1} \mathbf{y} < \chi^2$ 阈值可以在异常测量值污染状态之前将其剔除。

## EKF-SLAM

在EKF-SLAM（MonoSLAM背后的方案）中，状态将相机/机器人位姿和所有地标位置堆叠在一起，

$$
\mathbf{x} = \begin{bmatrix} \mathbf{x}_{\text{robot}}^T & \mathbf{m}_1^T & \cdots & \mathbf{m}_n^T \end{bmatrix}^T,
$$

而 $P$ 存储包括位姿-地标以及地标-地标相关性的完整联合协方差。正是这些交叉相关性使得回环检测在滤波器中能够生效：修正位姿也会同时拖动所有相关联的地标。其代价是结构性的：

- **平方级缩放**：$P$ 有 $O(n^2)$ 个元素，每次更新都要触及所有元素，这将实时EKF-SLAM限制在较小的地图规模（数十到一百个地标量级）。
- **线性化误差**：雅可比矩阵只在当前估计处求值一次，误差会永久地烘焙进 $P$ 中——不同于优化方法，滤波器无法对过去重新线性化。这正是EKF-SLAM众所周知的**不一致性**（过度自信）问题的原因。
- **旋转处理**：朴素的姿态参数化会表现异常；实用的滤波器采用**误差状态（间接）EKF**，滤波器估计围绕名义状态的一个小误差，并用四元数动力学处理姿态。

正是这些局限性促使现代视觉SLAM转向基于关键帧的非线性优化（"为何要用滤波？"之争，Strasdat 等），而滤波方法则在其常数时间递归形式发挥优势的地方存活下来：视觉惯性里程计（MSCKF、ROVIO、误差状态EKF）以及里程计与GPS/雷达/轮式编码器的传感器融合。

## 对SLAM的意义

EKF是SLAM的历史基石（EKF-SLAM曾是十年间的*首选*方案），并且仍是生产级VIO的支柱（MSCKF的衍生方案运行在许多AR头显和无人机上）。即便在以优化为中心的流水线中，EKF的概念也无处不在：预测/更新结构、用于剔除异常值的新息门限、用于不确定性传播的协方差以及边缘化（固定滞后平滑器的边缘化步骤在代数上等价于一次卡尔曼更新）。理解EKF单次线性化假设何时会失效，是理解为何光束法平差在精度上更胜一筹、以及为何MSCKF一类滤波器要延迟线性化的关键。

## 相关条目

- [MonoSLAM](../level-03-monocular-slam/monoslam.md)
- [MSCKF](../level-06-vio-vins/msckf.md)
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
- [Non-linear optimization](non-linear-optimization.md)
