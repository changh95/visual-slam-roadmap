# DM-VIO
> von Stumberg 2022 · [论文](https://arxiv.org/abs/2201.04114)

**一句话总结** — 一种基于直接法(DSO)的单目VIO,建立在两项新技术之上——*延迟边缘化*和用于IMU初始化的*位姿图光束法平差(PGBA)*——仅用单相机加IMU就能超越双目惯性系统的表现。

## 问题
边缘化使滑动窗口VIO保持实时性,但"它不易被逆转,并且相关变量的线性化点必须被固定"(首次估计雅可比)。这在单目VIO中尤其棘手,因为一旦第一个关键帧被边缘化,尺度就与边缘化先验绑定在一起——但尺度在恒速运动下(汽车中常见)不可观测,因此仍可能发生剧烈变化。此前的系统要么先进行纯视觉里程计再单独进行IMU初始化(丢失了光度不确定性),要么像VI-DSO那样以任意尺度立即初始化,并使用有损的*动态*边缘化。DM-VIO用一种机制回答了三个问题:如何在初始化器中捕获完整的视觉不确定性,如何将其传递到主系统中,以及在尺度变化时如何保持先验的一致性。

## 方法与架构
核心是一个针对所有活跃关键帧的视觉惯性光束法平差,用Levenberg-Marquardt算法最小化(光度部分从DSO进行了SIMD加速,其他因子在GTSAM中实现):

$$E(\mathbf{s}) = W(e_{\text{photo}}) \cdot E_{\text{photo}} + E_{\text{imu}} + E_{\text{prior}}$$

- **光度能量(DSO式)。** 每个活跃关键帧 $i \in \mathcal{F}$ 承载点 $\mathbf{p}$,投影到观测帧 $j$ 中:
  $$E_{\mathbf{p}j} = \sum_{\mathbf{p} \in \mathcal{N}_{\mathbf{p}}} \omega_{\mathbf{p}} \left\lVert (I_j[\mathbf{p}'] - b_j) - \frac{t_j e^{a_j}}{t_i e^{a_i}} (I_i[\mathbf{p}] - b_i) \right\rVert_{\gamma},$$
  其中包含仿射亮度参数 $a, b$、曝光时间 $t$ 以及Huber范数 $\lVert\cdot\rVert_\gamma$。
- **动态光度权重。** 令 $e_{\text{photo}} = \sqrt{E_{\text{photo}}/n_{\text{residuals}}}$,权重为 $W(e_{\text{photo}}) = \lambda \cdot (\theta/e_{\text{photo}})^2$(当 $e_{\text{photo}} \geq \theta$ 时,否则为 $\lambda$),$\theta = 8$。与逐点的Huber范数不同,这会在质量差时降低*整幅图像*的权重,将信任转移给IMU。
- **IMU因子。** 在流形上的预积分预测状态 $\widehat{\mathbf{s}}_j^I$ 及其协方差 $\widehat{\Sigma}_j$:
  $$E_{\text{imu}}(\mathbf{s}_i^I, \mathbf{s}_j^I) = \left(\widehat{\mathbf{s}}_j^I \boxminus \mathbf{s}_j^I\right)^T \widehat{\Sigma}_j^{-1} \left(\widehat{\mathbf{s}}_j^I \boxminus \mathbf{s}_j^I\right)$$
- **显式的尺度和重力。** 视觉因子存在于一个尺度任意的坐标系 $V$ 中,IMU因子存在于度量坐标系 $I$ 中;状态显式地包含尺度 $s$ 和旋转 $\mathbf{R}_{V\_I}$,因此在初始化后,尺度会在主系统中持续被优化。
- **边缘化。** 旧变量 $\beta$ 通过Schur补去除,$\widehat{\mathbf{H}}_{\alpha\alpha} = \mathbf{H}_{\alpha\alpha} - \mathbf{H}_{\alpha\beta}\mathbf{H}_{\beta\beta}^{-1}\mathbf{H}_{\beta\alpha}$,采用DSO的非固定延迟策略,最多保留 $N_f = 8$ 个关键帧。
- **延迟边缘化。** 一个*第二*因子图以延迟 $d = 100$ 帧重放相同的边缘化顺序(特征点仍立即被边缘化,因此每个线性化的光度因子恰好连接 $N_f$ 个关键帧;马尔可夫毯——因而运行时间,实测为0.44 ms——与主图保持相同)。该图可以(1)填充IMU因子,(2)重新推进以重建先验,(3)用于重新线性化FEJ值。
- **用于IMU初始化的PGBA。** IMU和偏置因子被插入到延迟图中(至少 $d - N_f + 2$ 个位姿可以接收它们,即≥93个IMU因子),并优化所有变量。与位姿图优化不同,它使用捕获完整BA概率分布的"八元"因子;与完整BA不同,它从不重新线性化光度项——既准确*又*快速。重新推进优化后的图,然后将包含全部视觉和惯性信息的边缘化先验交给主系统。
- **多阶段初始化器。** 粗略IMU初始化(位姿固定,单一偏置;重力来自平均加速度计读数,尺度=1)→ 基于边缘尺度协方差的阈值判断 → PGBA初始化(在更严格的阈值 $\theta_{\text{reinit}}$ 下可选重新初始化)→ 每当 $\max(s, s_{\text{fej}})/\min(s, s_{\text{fej}}) > \theta_s$ 时进行*边缘化替换*,用当前线性化点重建先验。

## 实验结果
在EuRoC、TUM-VI和4Seasons(无人机、手持、车载)上评估;EuRoC每个序列运行10次,其他数据集运行5次,均在实时模式下于一台2013款MacBook Pro(i7 2.3 GHz,无GPU)上进行。

- **EuRoC**:平均RMSE ATE为**0.069 m**(单目,无回环检测)——当时报告的最佳VIO结果,超过了双目惯性的Basalt(0.072)、VI-DSO(0.089,单目)、VINS-Mono(0.184)、OKVIS(0.231)。也是该数据集上报告的最低平均尺度误差(0.6%)。
- **TUM-VI**:平均漂移**0.472%**,而Basalt(双目)为0.939%,VINS-Mono为1.700%;在28个序列中的16个上取得最佳结果(例如outdoors8:2.11 m,对比Basalt 13.53 m)。在累积图中总体上比ORB-SLAM3更鲁棒,尽管ORB-SLAM3的回环检测在某些序列上更胜一筹。
- **4Seasons**:在单目尺度不可观测的长时间恒速路段中,DM-VIO仍然优于双目惯性的ORB-SLAM3和Basalt。
- 运行时间:跟踪10.34 ms,关键帧处理53.67 ms;延迟边缘化仅给关键帧线程增加0.44 ms(0.8%)。

## 对SLAM的意义
DM-VIO缩小了直接法和特征法VIO之间的差距:一个设计良好的边缘化和初始化策略的单目光度系统可以超越基于特征的*双目*惯性流水线。它是TUM直接法路线(DSO → VI-DSO → DM-VIO)的集大成之作,是研究边缘化一致性问题(FEJ、不可观测尺度)如何在实践中表现——以及如何被缓解——的绝佳系统。延迟边缘化是一种通用工具:论文本身建议将关键帧重新激活用于地图重用,将PGBA用于长期回环检测。

## 相关条目
- [DSO](../level-03-monocular-slam/dso.md) — 直接稀疏里程计的核心。
- [VI-DSO](vi-dso.md) — 来自同一团队的更早的直接视觉惯性前身系统。
- [Basalt](basalt.md) — 针对边缘化线性化误差的另一种修复方案(非线性因子恢复)。
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — 所使用的IMU因子公式。
- [Marginalization](../level-02-getting-familiar/marginalization.md) — 被"延迟"的这一机制的背景知识。
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — 公式(10)背后的线性代数工具。
- [Observability](observability.md) — 为什么单目尺度最初不可观测,必须显式处理。
