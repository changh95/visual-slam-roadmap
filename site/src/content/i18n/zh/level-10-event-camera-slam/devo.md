# DEVO

> Klenk 2024 · [论文](https://arxiv.org/abs/2312.09800)

**一句话总结** —— DEVO(Deep Event Visual Odometry)将DPVO风格的学习型稀疏patch里程计架构适配到单目事件流上,完全在*模拟*事件上训练,并能泛化到真实事件基准测试上,相较于此前的纯事件方法将位姿跟踪误差降低了最多97%。

## 问题

事件相机承诺在高速运动和恶劣光照条件下实现相机跟踪,但现有的事件*单目*VO在近期基准测试上表现有限。为了弥补这一点,许多系统加入了额外的传感器——IMU、立体事件相机或帧相机——但这会增加成本、使系统需求(空间、功耗、标定)复杂化,而依赖帧相机又恰好重新引入了事件相机本要避免的运动模糊和HDR脆弱性。DEVO提出的问题是:在不使用任何额外传感器的情况下,通用、真实世界的单目纯事件VO的极限在哪里?

## 方法与架构

**事件表示。** 事件 $(x_k, y_k, t_k, p_k)$ 被分箱到体素网格 $\mathbf{E}_t \in \mathbb{R}^{H\times W\times 5}$ 中(在5个时间箱上对事件计数进行双线性插值,并归一化为零均值/单位方差),训练时每个体素网格都配有一个真实位姿 $\mathbf{T}_t \in \mathbb{SE}(3)$ 和逆深度图 $\mathbf{d}_t$。

**DPVO风格骨干网络。** DEVO复用了DPVO的动态patch图和循环更新算子:$\mathbf{E}_t$ 上的稀疏事件patch与相邻体素网格相连;更新算子迭代地预测光流修正量 $\Delta\hat{\mathbf{f}}$ 和置信度权重 $\omega$,一个可微分光束法平差(DBA)层则在关键帧滑动窗口上更新相机位姿和patch深度。

**深度事件patch选择(核心创新)。** 事件在图像平面上分布稀疏,因此随机或基于梯度的patch采样会把容量浪费在空白或噪声区域。一个小型CNN(三层3×3卷积+ReLU,通道数分别为8/16/32,随后一层单通道层,4×4最大池化,sigmoid)会预测一个分数图 $\mathbf{S}_t \in [0,1]^{H/4 \times W/4}$,用于标出可跟踪的坐标。该网络无需分数标签,通过以下自监督损失训练:

$$\mathcal{L}_{\text{score}} = \frac{1}{|\mathcal{E}|} \sum_{(k,j)\in\mathcal{E}} s_k\, r_{kj}\, (1 - \alpha \ln \omega_{kj}) - \ln \mathbf{S}_{\mathbf{P}},$$

它会在光流残差 $r_{kj}$ 较大或DBA权重 $\omega_{kj}$ 较小的地方压低分数 $s_k$。总损失为 $\mathcal{L} = 0.05\,\mathcal{L}_{\text{score}} + 0.1\,\mathcal{L}_{\text{flow}} + 10\,\mathcal{L}_{\text{pose}}$。在推理阶段,patch通过**池化多项式采样**抽取:对分数图进行4×4平均池化,从网格单元的多项分布中无放回地采样坐标,再在每个4×4窗口内进行细化——相比top-$P$选择,这种方式对分数图中的异常值更鲁棒。

**仅使用模拟数据训练。** 事件是用ESIM在TartanAir的所有序列上模拟生成的,采用事件生成模型 $\Delta L(\mathbf{u}_k, t_k) = p_k C$,每个序列随机化对比度阈值 $C \sim \mathcal{U}(0.16, 0.34)$,并加入光度体素增强以缩小仿真到真实的差距。训练:在两块A40 GPU上进行24万次迭代,序列长度 $N=15$,$P=80$个patch(约2.5天)。

## 实验结果

- 在**七个真实世界基准**(UZH-FPV、VECtor、HKU、EDS、TUM-VIE、RPG、MVSEC)上评估,取5次运行的中位数,所有数据集使用相同参数(只有关键帧阈值按数据集不同而变化);评价指标为ATE[cm]、旋转RMSE、MPE[%/m]。总体结论:相较此前的纯事件方法,位姿跟踪误差降低最多达97%。
- **UZH-FPV**(无人机竞速):在9个序列中的4个上表现最佳,尽管所有其他成功的方法都使用了IMU;DPVO和EVO在所有序列上均失败。
- **VECtor**:EVO和ESVO分别在88%和76%的序列上失败;DEVO在70%的序列上甚至超过了ESVIO(立体事件+立体帧+IMU)。
- **HKU**:在9个序列中的5个上表现最佳;EVO和ESVO在所有序列上均失败。
- **TUM-VIE**:相较所有纯事件方法,ATE至少低44%;**RPG**:相较纯事件方法ATE至少低63%,平均ATE比USLAM低88%,比EDS低28%。
- 代码、训练流程与事件数据生成均已开源(github.com/tum-vision/DEVO)。

## 对SLAM的意义

DEVO标志着深度学习VO革命抵达事件相机领域的时刻:经典事件里程计(EVO、ESVO)依赖手工设计的对齐目标,难以应对噪声和稀疏性,而DEVO的学习型前端能从数据中自动吸收这些效应。其仅用模拟数据训练的策略可能是最具影响力的部分——它展示了一条绕过事件数据瓶颈的实用路径,使事件SLAM也能享受到曾经改变了基于帧方法的规模化效应。

## 相关条目

- [DPVO](../level-05-deep-learning/dpvo.md)
- [DROID-SLAM](../level-05-deep-learning/droid-slam.md)
- [ESVO](esvo.md)
- [EDS](eds.md)
- [Event representations](event-representations.md)
- [Challenges](challenges.md)
