# AirVO
> Xu 2023 · [论文](https://arxiv.org/abs/2212.07595)

**一句话总结** — 一种光照鲁棒的双目视觉里程计,它将加速的学习型特征点(SuperPoint + SuperGlue)与*通过特征点*进行匹配的LSD线特征相结合,在低功耗嵌入式平台上实时运行(约15 Hz)。

## 问题
手工设计的前端(ORB、FAST、BRISK)和光流跟踪都假设帧间亮度大致不变。在光照动态变化的环境中——隧道内的车载灯、灯光熄灭、自动曝光波动——跟踪质量恰恰在机器人最需要它的时候崩溃。学习型特征要鲁棒得多,但"往往需要巨大的计算资源",使其在UAV等轻量平台上不切实际。线特征能在低纹理场景中增加结构信息,但经典的线匹配方法(LBD描述子、跟踪采样点)本身在光照变化下也不稳定。AirVO一次性瞄准了这三个缺口:一种既光照鲁棒*又*能在嵌入式平台实时运行的混合学习/经典点-线VO。

## 方法与架构
一条混合流水线:学习型前端+传统优化后端,分为**特征线程**(SuperPoint在GPU上的一个子线程中运行,LSD线检测在CPU上并行运行)和**优化线程**(初始位姿估计、关键帧决策、局部BA)。CNN/GNN推理从FP32转换为FP16,使特征提取+匹配比原始代码快5倍以上。

- **学习型特征点,基于关键帧的跟踪。** 左图上的SuperPoint特征通过SuperGlue直接与*上一关键帧*(而非逐帧)进行匹配——学习型匹配能在大基线下存活,因此减少了累积的跟踪误差。
- **来自LSD的更长线段。** 当LSD线段近乎共线时(夹角 < $\delta_\theta$,中点到直线的距离 < $\delta_d$,端点间隙 < $\delta_{ep}$)将其合并;过滤掉剩余的短线段,只保留稳定的长线段。
- **通过特征点匹配线段。** 每个特征点 $\mathbf{p}_i = (x_i, y_i)$ 若其到直线 $\mathbf{l}_j$(参数为 $A_j, B_j, C_j$)的距离
  $$d_{ij} = \frac{\lvert A_j x_i + B_j y_i + C_j \rvert}{\sqrt{A_j^2 + B_j^2}}$$
  很小,则将其与该直线关联。若帧 $k$ 和 $k{+}1$ 中的两条线的得分 $S_{mn} = \frac{N_{pm}}{\min({}^k N_m,\, {}^{k+1} N_n)}$(共享匹配点数除以该直线较小的点数)以及 $N_{pm}$ 超过阈值,则判定这两条线为同一条——完全不需要线描述子,因此特征点匹配器的光照鲁棒性可以免费转移给线段。
- **三维直线。** 用于三角化/变换/投影的Plücker坐标 $\mathbf{L} = [\mathbf{n}^T, \mathbf{v}^T]^T$;优化过程中使用最小的4自由度正交表示 $(\mathbf{U}, \mathbf{W}) \in SO(3) \times SO(2)$。三角化通过求两个反投影平面的交线实现;若该方法退化,则由两个相关联的三角化特征点构造直线:$\mathbf{n} = \mathbf{X}_1 \times \mathbf{X}_2$,$\mathbf{v} = (\mathbf{X}_1 - \mathbf{X}_2)/\lVert \mathbf{X}_1 - \mathbf{X}_2 \rVert$——几乎不额外耗费成本,因为特征点已经存在。
- **联合优化。** 在关键帧、地图点和三维直线上构建的共视图(ORB-SLAM式)。线重投影误差把重投影直线 ${}^k\mathbf{l}_i$ 与两个检测到的端点 $\bar{\mathbf{p}}_{i,1}, \bar{\mathbf{p}}_{i,2}$ 的点到线距离堆叠起来:
  $$e_l = \begin{bmatrix} d(\bar{\mathbf{p}}_{i,1},\, {}^k\mathbf{l}_i) & d(\bar{\mathbf{p}}_{i,2},\, {}^k\mathbf{l}_i) \end{bmatrix}^T,$$
  与标准的点重投影误差 $\mathbf{E}_p = \bar{\mathbf{x}}_q - \pi\left({}_w^c\mathbf{R}\, {}^w\mathbf{X}_q + {}_w^c\mathbf{t}\right)$ 一起使用。
- **关键帧**根据与上一关键帧的距离/角度或跟踪地图点数量的下降来选取;随后对关键帧的右图进行处理以完成双目三角化。

## 实验结果
在所有基线方法中禁用回环检测和重定位,在两个光照挑战数据集上评估:

- **OIVIO**(隧道/矿井,车载1300–9000流明灯光):在9个序列中的7个上取得最佳平移RMSE,另外2个上排名第二——例如MN_015_GV_01:0.0537 m,对比OKVIS 0.0663、ORB-SLAM2 0.0762、Basalt-VIO 0.2157;VINS-Fusion、StructVIO和UV-SLAM在许多序列上跟踪丢失或误差超过10 m。
- **UMA-VI**(序列中途灯光熄灭):平均误差0.2479 m——是PL-SLAM(3.7096 m)的6.7%,是OKVIS(0.5141 m)的48.2%;ORB-SLAM2和Basalt-VIO在全部4个序列上都跟踪丢失。在conference-csc2上漂移约为1.0%,而OKVIS为1.5%,PL-SLAM为7.1%。
- **消融实验**:加入线流水线在13个序列中的12个上超过仅用点的AirVO,平均降低平移误差58.2%。
- **运行时间**(Jetson AGX Xavier,640×480,200个特征点):特征点检测+跟踪64 ms,对比未加速的342 ms(加速5.3倍);整个系统在Jetson上约15 Hz,在笔记本电脑上约40 Hz。

## 对SLAM的意义
据作者所述,AirVO是首个在低功耗嵌入式硬件上实时同时使用学习型特征检测*和*学习型匹配的VO——证明了学习型前端在真实部署中确实带来收益,而不只是在匹配基准测试中。其点锚定的线匹配是一个巧妙的技巧,完全绕开了脆弱的线描述子。它是用深度学习组件改造经典间接VO/VIO流水线的良好范例(同一团队的后续工作AirSLAM在此基础上扩展了回环检测和地图重用功能)。

## 相关条目
- [SuperPoint](../level-05-deep-learning/superpoint.md) — AirVO核心中的学习型特征点。
- [SuperGlue](../level-05-deep-learning/superglue.md) — 该点特征前端所基于的GNN匹配范式。
- [PL-SLAM](../level-03-monocular-slam/pl-slam.md) — 使用手工设计特征的早期点+线SLAM(主要基线方法)。
- [VINS-Mono](vins-mono.md) — 这条研究路线所升级的经典紧耦合基线方法。
- [Learned vs hand-crafted](../level-05-deep-learning/learned-vs-hand-crafted.md) — AirVO用实验回答的前端设计问题。
- [LightGlue](../level-05-deep-learning/lightglue.md) — 适用于此类前端的高效学习型匹配方法。
