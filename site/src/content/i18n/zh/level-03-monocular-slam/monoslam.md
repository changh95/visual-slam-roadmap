# MonoSLAM

> Davison 2007 · [论文](https://ieeexplore.ieee.org/document/4160954)

**一句话总结** — 首个实时单目SLAM系统：一台手持单摄像头搭配扩展卡尔曼滤波器，以30 Hz联合估计相机运动和稀疏3D特征点地图。

## 问题

在MonoSLAM之前，实时SLAM系统需要双目装置、激光扫描仪或轮式里程计；单个相机被认为不足以胜任，因为单一视角只能提供方位信息而无深度信息，而一个裸相机本身完全没有运动测量能力。Davison、Reid、Molton和Stasse（IEEE TPAMI 2007）表明，只要估计框架明确处理单目特征初始化的深度不确定性，并以运动先验取代里程计，单个手持相机就足以实现实时SLAM。

## 方法与架构

**一个覆盖相机与地图的EKF。** 状态是一个具有完整联合协方差的单一堆叠向量，

$$
\hat{\mathbf{x}} = \begin{pmatrix} \hat{\mathbf{x}}_v \\ \hat{\mathbf{y}}_1 \\ \hat{\mathbf{y}}_2 \\ \vdots \end{pmatrix}, \qquad
\mathbf{P} = \begin{pmatrix} P_{xx} & P_{xy_1} & P_{xy_2} & \cdots \\ P_{y_1x} & P_{y_1y_1} & P_{y_1y_2} & \cdots \\ P_{y_2x} & P_{y_2y_1} & P_{y_2y_2} & \cdots \\ \vdots & \vdots & \vdots & \end{pmatrix},
$$

其中每个特征点$\mathbf{y}_i$是一个3D点，13维相机状态由位置、姿态四元数以及线速度/角速度组成：$\mathbf{x}_v = (\mathbf{r}^W, \mathbf{q}^{WR}, \mathbf{v}^W, \boldsymbol{\omega}^R)$。非对角块正是关键所在：观测一个特征点能同时改善相机的估计*以及*所有相关特征点的估计。存储和更新成本相对于地图规模为$O(N^2)$，将地图规模限制在约100个特征点（30 Hz下）。

**恒速运动模型（预测）。** 由于没有里程计，一个平滑性先验取代了控制输入：每个时间步一个零均值高斯分布的未知加速度施加一个速度脉冲$\mathbf{n} = (\mathbf{V}^W, \boldsymbol{\Omega}^R) = (\mathbf{a}^W \Delta t, \boldsymbol{\alpha}^R \Delta t)$，得到状态更新

$$
\mathbf{f}_v = \begin{pmatrix} \mathbf{r}^W + (\mathbf{v}^W + \mathbf{V}^W)\Delta t \\ \mathbf{q}^{WR} \times \mathbf{q}\big((\boldsymbol{\omega}^R + \boldsymbol{\Omega}^R)\Delta t\big) \\ \mathbf{v}^W + \mathbf{V}^W \\ \boldsymbol{\omega}^R + \boldsymbol{\Omega}^R \end{pmatrix},
\qquad
\mathbf{Q}_v = \frac{\partial \mathbf{f}_v}{\partial \mathbf{n}} P_n \frac{\partial \mathbf{f}_v}{\partial \mathbf{n}}^{\top}.
$$

较小的$P_n$假设运动平滑；较大的$P_n$能容忍抖动运动，但每帧需要更多测量。

**主动搜索（测量）。** 一个特征点在相机坐标系下的预测位置为$\mathbf{h}_L^R = \mathbf{R}^{RW}(\mathbf{y}_i^W - \mathbf{r}^W)$，通过一个已标定的广角（约100°视场角）相机模型（含径向畸变）进行投影。将状态不确定性通过投影雅可比传播，得到$2\times 2$的新息协方差

$$
\mathbf{S}_i = \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v} P_{xx} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v} P_{x y_i} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i} P_{y_i x} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i} P_{y_i y_i} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i}^{\top} + \mathbf{R},
$$

它定义了一个椭圆形的搜索门（3个标准差），在其内部运行归一化互相关模板匹配。$\mathbf{S}_i$同时也是一种信息量度：每帧选取信息量最大的10–12个特征点，从而在其最长轴方向上压缩不确定性。

**概率式特征初始化。** 一个新的显著图像块（Shi–Tomasi）只定义一条射线；深度由沿该射线在0.5–5.0 m范围内均匀分布的100个粒子表示。每一帧，每个深度假设都投影到各自的搜索椭圆中，匹配似然通过贝叶斯规则重新加权这些粒子，当深度比$\sigma_d / d < 0.3$时，该分布坍缩为一个高斯分布，该特征点便加入EKF状态——通常需要2–4帧。地图管理会增删特征点，以从任意位姿保持目标数量的可见特征点。

## 实验结果

- **实时预算**：在一台1.6 GHz Pentium M上以30 Hz运行（可用时间33 ms），典型一帧耗时19 ms——图像加载2 ms，相关性搜索3 ms，卡尔曼滤波更新5 ms，特征初始化搜索4 ms，图形渲染5 ms。
- **真值精度**：一台手持相机重新访问四个经过测量的路标点（已知精度约1 cm），定位精度可达数厘米，抖动为1–2 cm——例如路标点(1.00, 0.00, 0.62) m被估计为(0.93±0.03, 0.06±0.02, 0.63±0.02) m；随着SLAM将地图拉向一致，每次回环残余偏差会缩小约1 cm。
- **应用**：HRP-2人形机器人沿半径0.75 m的圆形行走时的实时定位（将其200 Hz的胸部陀螺仪作为EKF的额外测量融合进来），以及手持相机的实时增强现实。代码以开源库SceneLib发布。

## 对SLAM的意义

MonoSLAM证明了单个廉价相机足以实现实时SLAM，实际上开创了视觉SLAM这一领域（并开启了Davison实验室的谱系——iMAP、MonoGS以及数十年后的MASt3R-SLAM均出自同一团队）。它同时也是基于滤波的SLAM最简洁的教学范例：一个EKF，一个联合状态，从预测不确定性出发的主动搜索——这是此后每一个基于关键帧优化的系统都会被拿来对比论证的基线。论文本身也指出了后续方向：深度粒子初始化直接启发了逆深度参数化，而$O(N^2)$的上限则设定了PTAM与"Visual SLAM: Why Filter?"所要回答的议题。

## 相关条目

- [PTAM](ptam.md)
- [Visual-SLAM why filter?](visual-slam-why-filter.md)
- [Visual Odometry](visual-odometry.md)
- [ORB-SLAM](orb-slam.md)
- [Scale ambiguity](scale-ambiguity.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — MonoSLAM所依赖的广角模型
