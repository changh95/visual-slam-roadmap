# Factor graph

**因子图（factor graph）**是当今写下SLAM问题的标准方式。它是一个二部图 $\mathcal{G} = (\mathcal{V}, \mathcal{F}, \mathcal{E})$，包含两类节点：

- **变量节点** $\mathcal{V}$：需要估计的未知量——机器人位姿 $T_i$、地图点（地标）$\mathbf{X}_j$、IMU偏置 $\mathbf{b}$、外参、时间偏移。
- **因子节点** $\mathcal{F}$：对变量子集的概率约束——先验因子、里程计因子、地标观测（重投影）因子、IMU预积分因子、回环检测因子。
- **边** $\mathcal{E}$：将每个因子连接到它所涉及的确切变量。

该图编码了所有变量的联合概率如何分解为局部因子的乘积：

$$
p(\mathcal{V}) \propto \prod_{f \in \mathcal{F}} f(\mathcal{V}_f)
$$

其中 $\mathcal{V}_f$ 是与因子 $f$ 相连的变量。在高斯噪声假设下，每个因子的形式为 $f(\mathcal{V}_f) \propto \exp\left(-\tfrac{1}{2}\|\mathbf{r}_f(\mathcal{V}_f)\|^2_{\Sigma_f}\right)$，其中 $\mathbf{r}_f$ 是某个残差函数，因此对乘积取负对数，就恰好将MAP估计变成了本层级其他条目中讨论的那种稀疏非线性最小二乘问题——每个因子变成一个经协方差加权的平方残差项。

## 一个玩具SLAM因子图

三个位姿，两个地标：

```
 prior
   |
  x0 ---odom--- x1 ---odom--- x2
   \           /  \           /
    \         /    \         /
    proj   proj    proj   proj
      \     /        \     /
       [l0]           [l1]
```

因子列表：一个作用在 $x_0$ 上的先验因子（用于固定规范/gauge），两个连接相邻位姿的里程计因子，以及四个投影因子，每个都将一个位姿与一个地标相连。稀疏性一目了然：$x_0$ 从不与 $x_2$ 直接交互，$l_0$ 也从不与 $l_1$ 交互——海森矩阵在这些位置上是零块。现在设想机器人在之后的某个位姿再次回到 $x_0$ 附近：一个连接该位姿与 $x_0$ 的**回环检测因子**只是多加一条边，而估计器的机制完全不变。

## 常见因子类型

| 因子 | 连接对象 | 残差含义 |
|---|---|---|
| 先验（Prior） | 一个变量 | 与固定先验值的偏差 |
| 二元/里程计（Between / odometry） | 两个位姿 | 相对位姿测量中的误差 |
| 投影（重投影，Projection） | 位姿 + 地标 | 像素误差 $\mathbf{z} - \pi(T\mathbf{X})$ |
| IMU预积分 | 位姿 + 速度 + 偏置 | 预积分相对运动中的误差 |
| 回环检测（Loop closure） | 两个不相邻的位姿 | 识别出的相对位姿中的误差 |
| GPS/绝对位置 | 一个位姿 | 与测得位置的偏差 |

这种表示方法的强大之处在于**图结构即稀疏性结构**。每个观测只涉及一个位姿和一个地标；里程计只连接相邻位姿。图使这种局部性变得显而易见，而由此产生的雅可比/海森稀疏性正是求解器能够处理包含数千个位姿和数十万个地标的问题的原因。它同样具有极佳的组合性：添加一个传感器只意味着添加一种新的因子类型，而不需要重新设计估计器。位姿图正是所有变量都是位姿、所有因子都是相对位姿约束的一种特殊情况。

## 代码中的体现

主流库直接使用这种语言：

- **GTSAM**（Georgia Tech Smoothing and Mapping）——将因子图作为一等API，配有iSAM2增量求解器；非常适合VIO。
- **g2o**——同一思想的顶点/边表述形式；用于ORB-SLAM和LSD-SLAM。
- **Ceres Solver**——一个通用的非线性最小二乘库；你以一组残差块的形式隐式地组装出"图"。

上面的玩具图，用GTSAM的Python API表示：

```python
import gtsam

graph = gtsam.NonlinearFactorGraph()
graph.add(gtsam.PriorFactorPose2(0, gtsam.Pose2(0, 0, 0), prior_noise))
graph.add(gtsam.BetweenFactorPose2(0, 1, gtsam.Pose2(1, 0, 0), odom_noise))
graph.add(gtsam.BetweenFactorPose2(1, 2, gtsam.Pose2(1, 0, 0), odom_noise))
# ... 地标的投影/方位-距离因子 ...
result = gtsam.LevenbergMarquardtOptimizer(graph, initial_values).optimize()
```

代码*就是*这个图：每一次`add`都是一个因子节点，每一个整数键都是一个变量节点。

## 对SLAM的意义

因子图将过去彼此独立的问题表述——滤波、位姿图优化、光束法平差、传感器融合——统一成了一幅图景：定义变量、挂上因子、求解。你会遇到的每一个现代后端（ORB-SLAM的BA、VINS-Mono的滑动窗口、Kimera的iSAM2平滑器、LIO-SAM的LiDAR惯性图）都是一个因子图，只是在变量、因子和求解调度上有各自的选择。学会*画出*一个系统的因子图是理解任何SLAM论文后端最快的方法。

## 动手实践

- [g2o hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_13)
- [GTSAM hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_14)

## 相关条目

- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Pose graph optimization](pose-graph-optimization.md)
- [Incremental smoothing (iSAM/iSAM2)](incremental-smoothing.md)
- [Marginalization](marginalization.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [Robust pose-graph optimization](robust-pose-graph-optimization.md)
