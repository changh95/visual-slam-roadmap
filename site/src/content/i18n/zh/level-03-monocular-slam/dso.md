# DSO

> Engel 2016 · [论文](https://arxiv.org/abs/1607.02565)

**一句话总结** — 直接稀疏里程计（Direct Sparse Odometry）在一组稀疏、均匀分布的高梯度像素上执行窗口化的光度光束法平差，将完全直接的概率模型与对所有模型参数的一致联合优化结合起来。

## 问题

在DSO之前，直接法和稀疏法这两个阵营各自只拿到了一半的成果。LSD-SLAM进行光度跟踪，但用滤波和位姿图来细化几何结构，从未联合优化结构和运动；基于特征的方法（ORB-SLAM）执行完整的光束法平差，但把图像简化为关键点。DSO将"一个完全直接的概率模型（最小化光度误差）与对所有模型参数——位姿、逆深度、内参以及逐帧亮度——的一致联合优化"结合在一起，并做到实时，这得益于"省去了其他直接法所使用的平滑先验，转而在图像中均匀采样像素"。

## 方法与架构

- **光度标定**：图像形成过程建模为 $I_i(\mathbf{x}) = G\big(t_i\, V(\mathbf{x})\, B_i(\mathbf{x})\big)$，其中 $G$ 为响应函数，$V$ 为渐晕（暗角），$t_i$ 为曝光时间，$B_i$ 为辐照度；帧预先通过 $I_i'(\mathbf{x}) := t_i B_i(\mathbf{x}) = G^{-1}(I_i(\mathbf{x}))/V(\mathbf{x})$ 进行校正。
- **光度误差**：一个宿主于帧 $I_i$、在 $I_j$ 中被观测到的点 $\mathbf{p}$，在一个8像素的残差模式 $\mathcal{N}_{\mathbf{p}}$ 上贡献一个加权SSD：

$$E_{\mathbf{p}j} := \sum_{\mathbf{p}\in\mathcal{N}_{\mathbf{p}}} w_{\mathbf{p}} \left\| (I_j[\mathbf{p}'] - b_j) - \frac{t_j e^{a_j}}{t_i e^{a_i}} (I_i[\mathbf{p}] - b_i) \right\|_{\gamma},$$

  其中 $\mathbf{p}' = \Pi_{\mathbf{c}}\big(\mathbf{R}\, \Pi_{\mathbf{c}}^{-1}(\mathbf{p}, d_{\mathbf{p}}) + \mathbf{t}\big)$ 是以逆深度 $d_{\mathbf{p}}$ 和相对位姿 $\mathbf{T}_j \mathbf{T}_i^{-1}$ 得到的重投影；$a, b$ 为仿射亮度参数（采用对数参数化以防止漂移），$\|\cdot\|_\gamma$ 为Huber范数，而 $w_{\mathbf{p}} = c^2 / (c^2 + \|\nabla I_i(\mathbf{p})\|_2^2)$ 对高梯度像素进行降权（隐式的几何噪声）。总能量为

$$E_{\text{photo}} := \sum_{i\in\mathcal{F}} \sum_{\mathbf{p}\in\mathcal{P}_i} \sum_{j\in\mathrm{obs}(\mathbf{p})} E_{\mathbf{p}j},$$

  在滑动窗口上通过高斯-牛顿法优化；每个点只有一个未知量（其宿主帧中的逆深度），因此经过Schur补化简后，该系统的求解方式与经典的稀疏BA相同。
- **边缘化**：旧的帧和点通过Schur补 $\widehat{\mathbf{H}_{\alpha\alpha}} = \mathbf{H}_{\alpha\alpha} - \mathbf{H}_{\alpha\beta}\mathbf{H}_{\beta\beta}^{-1}\mathbf{H}_{\beta\alpha}$ 离开窗口，在剩余变量上留下一个二次先验；被边缘化的相连变量的线性化（切空间）点此后保持固定，会填满Hessian的残差项则被丢弃。
- **前端**：一个由 $N_f = 7$ 个活动关键帧和 $N_p = 2000$ 个活动点构成的窗口。新帧通过恒速运动模型的两帧直接对齐方式，与最新关键帧进行跟踪；当平均光流、仅平移光流和亮度变化的加权分数超过阈值时创建新关键帧（初始为每秒5-10个关键帧，随后冗余的关键帧会被提前边缘化——始终保留最新的两个，丢弃可见性低于5%的帧，其余按空间距离分数处理）。候选点通过区域自适应的梯度阈值（块内梯度中值 $\bar g + g_{\text{th}}$，$g_{\text{th}}=7$）在 $d \times d$ 的块上选取——因此白墙上的边缘和平滑亮度变化也能被采样到——沿极线跟踪以获得深度初值，随后为最大化空间分布而被激活。

## 实验结果

在三个数据集上评测，每个序列均正向和反向各运行一次（TUM monoVO——50个经过光度标定的序列，105分钟，共500次运行；EuRoC MAV——11个序列，19分钟，共220次运行；ICL-NUIM——8个序列，4.5分钟，共80次运行），以同时体现精度和鲁棒性的累积误差曲线来报告：

- **TUM monoVO和ICL-NUIM**："直接、稀疏的方法在精度和鲁棒性上都明显优于ORB-SLAM"（monoVO上的对齐/旋转/尺度漂移误差；ICL-NUIM上的ATE）。由于亮度恒定性假设在真实曝光变化下不成立，LSD-SLAM和SVO"在大多数序列上持续失败"。
- **EuRoC MAV**：ORB-SLAM更精确（这里没有可用的光度标定，而且它的局部建图会隐式闭合数据集中许多小回环，纯里程计做不到这一点）；当ORB-SLAM被限制为只使用最近10秒内观测到的地图点时，其精度与DSO相近，但鲁棒性更差。
- **效率**：在i7-4910MQ上可实时运行；在降低设置（$N_p = 800$，$N_f = 6$，424×320）下，DSO仍能取得非常好的精度和鲁棒性，同时以5倍实时速度运行。
- **消融实验**：完整光度标定给出最佳结果，而朴素的亮度恒定性假设表现明显最差；使用超过 $N_p = 500$ 个点或 $N_f = 7$ 帧对精度的影响很小（保留2000个点主要是为了得到更稠密的地图）。

## 对SLAM的意义

DSO是直接稀疏方法的定论之作，终结了由DTAM和LSD-SLAM开启的时代，并与ORB-SLAM并列成为两种经典基线方法之一（直接法对特征法）。它的方案催生了整整一个家族——LDSO、Stereo DSO、VI-DSO、DVSO、D3VO、DM-VIO——其关于光度标定、固定切点边缘化以及滑动窗口设计的思想，至今仍是里程计系统中的标准实践。

## 相关条目

- [LSD-SLAM](lsd-slam.md)
- [LDSO](ldso.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [边缘化](../level-02-getting-familiar/marginalization.md)
