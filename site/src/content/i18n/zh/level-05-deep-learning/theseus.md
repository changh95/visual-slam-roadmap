# Theseus

> Pineda (Meta) 2022 · [论文](https://arxiv.org/abs/2207.09442)

**一句话总结** — 一个与具体应用无关的开源PyTorch库,用于可微分非线性最小二乘(DNLS),提供了可复用的基础设施,使神经网络能够在光束法平差等几何优化循环*内部*进行学习。

## 问题

到2022年,已有若干里程碑式的系统(BA-Net、DROID-SLAM、gradSLAM)展示了将非线性最小二乘求解器嵌入网络*内部*并对其进行反向传播训练的威力——但每一个实现都是为单一系统手工打造的。正如论文所说,现有的DNLS实现"都是针对特定应用的,并不总是包含许多对效率而言重要的要素":稀疏求解器、批处理、向量化、GPU支持以及内存高效的梯度计算,在每个项目中都被重新发明(或被省略),而且此前的DNLS工作只支持通过展开来计算梯度。与此同时,成熟的经典求解器(Ceres、g2o、GTSAM)拥有这套效率机制,却无法对求解过程进行反向传播。Theseus一次性弥合了这一差距,作为面向"机器人与视觉领域端到端结构化学习"的共享基础设施。

## 方法与架构

**将DNLS表述为一个双层优化问题。** 内层问题是在流形值变量$\theta = \{\theta_j\}$(欧氏向量或李群)上的非线性最小二乘,残差被分解为权重与代价,$r_i(\theta^i) = w_i c_i(\theta^i)$:

$$\theta^{\star} = \operatorname*{arg\,min}_{\theta} S(\theta), \qquad S(\theta) = \frac{1}{2}\sum_i \|w_i c_i(\theta^i)\|^2 .$$

该问题通过迭代线性化来求解:求解$\big(\textstyle\sum_i J_i^{\top}J_i\big)\,\delta\theta = \textstyle\sum_i J_i^{\top} r_i$,其中$J_i = \partial r_i / \partial\theta^i$,然后进行回缩$\theta \leftarrow \theta - \delta\theta$(高斯-牛顿法;库中同时提供了带自适应阻尼的LM法和Dogleg法)。任何上游网络参数$\phi$都可以进入代价项、权重项或初始化,由此形成如下的双层结构:

$$\text{inner:}\;\; \theta^{\star}(\phi) = \operatorname*{arg\,min}_{\theta} S(\theta;\phi), \qquad \text{outer:}\;\; \phi^{\star} = \operatorname*{arg\,min}_{\phi} L(\theta^{\star}(\phi)),$$

其中外层循环是普通的梯度下降,借助求解器求出$\partial\theta^{\star}/\partial\phi$。

**API(以因子图形式呈现)。** `Variable`(优化变量或辅助张量)、`CostFunction`(即$c_i$;库中提供了带解析雅可比的实现——高斯测量、重投影、相对位姿、运动模型、碰撞——或就地使用的`AutoDiffCostFunction`)、`CostWeight`(即$w_i$,包含鲁棒损失)、`Objective`(即$S$)、`Optimizer`,以及`TheseusLayer`,其`forward`将输入张量映射为最优变量取值,可嵌入任意PyTorch计算图中。可微分李群以闭式形式计算指数映射/对数映射、逆运算和组合,并附带解析的切空间导数,以及一个投影算子,使自动求导得到的梯度能正确映射到切空间(这与LieTorch按操作定制内核的做法形成对比);可微分正向动力学则封装了Differentiable Robot Model。

**效率机制。** (一)两级并行——对DNLS问题进行原生批处理,并对同类型代价运算进行自动向量化(类似SIMD)。(二)端到端可微分的*稀疏*线性求解器取代了PyTorch的稠密Cholesky分解:CHOLMOD(CPU)、cudaLU(基于cuSolverRF的GPU批量LU分解),以及BaSpaCho——一种新颖的开源批量超节点稀疏Cholesky分解,支持GPU,其稀疏消元省去了外部Schur补技巧的必要性。对线性求解$y = A^{-1}b$的反向传播使用隐函数求导,$\partial f/\partial b = A^{-1}\,\partial f/\partial y$以及$\partial f/\partial A = -A^{-1}(\partial f/\partial y)\,y^{\top}$,并借助缓存的分解结果使反向传播比正向传播更快。

**四种反向传播模式。** 展开法(通过求解器迭代反向传播——计算量和内存随迭代次数线性增长,存在梯度消失风险);截断微分(TBPTT,存在偏差);**隐式微分**,通过对最优性条件$g(\theta;\phi) := \nabla_{\theta} S(\theta;\phi) = 0$应用隐函数定理实现:

$$\mathrm{D}_{\phi}\theta^{\star}(\bar{\phi}) = -\mathrm{D}_{\theta}^{-1} g\big(\theta^{\star}(\bar{\phi});\bar{\phi}\big)\, \mathrm{D}_{\phi} g\big(\theta^{\star}(\bar{\phi});\bar{\phi}\big),$$

在实践中通过对解处的单个牛顿步$h(\theta;\phi) = \theta - [\nabla^2_{\theta}S]^{-1}_{\text{stop}}\nabla_{\theta}S$求导来计算;以及直接损失最小化(DLM),一种基于损失增强内层求解的有限差分向量-雅可比积方案。隐式微分与DLM的计算开销都与迭代次数无关。

**基于同一组件构建的示例应用**包括:位姿图优化(学习一个Welsch鲁棒核的半径)、触觉状态估计(端到端学习一个触觉图像到相对位姿的网络)、光束法平差(学习一个外点软核半径)、运动规划(带有学习式初始化模型的可微分GPMP2),以及基于特征度量的单应估计(训练一个CNN以获得鲁棒的对齐特征)。

## 实验结果

- **稀疏法与稠密法对比(位姿图优化,合成Cube数据集,V100 32 GB,10次内层迭代/20个外层epoch,隐式模式):** PyTorch的稠密求解器在批大小128、超过256个位姿时就会内存耗尽,而在此规模下其正向+反向传播耗时已达到20.81秒,相比CHOLMOD为10.96秒,cudaLU为2.86秒,BaSpaCho为2.25秒。BaSpaCho能扩展到2048个位姿,cudaLU可到4096个,CHOLMOD在批大小256时可到8192个位姿;BaSpaCho在各个规模上都优于稠密方法,最高快一个数量级。
- **与Ceres对比(批量位姿图优化,10次迭代,256个问题):** 在小规模下Ceres更胜一筹(256个位姿、批大小16时快25倍),但在2048个位姿、批大小256时,BaSpaCho比Ceres快约23倍,其他稀疏求解器也快约4倍;摘要中标题所称的"最高20倍"正向传播加速,来自批处理、向量化与稀疏性的共同作用。
- **反向传播模式(触觉状态估计,100个epoch):** 展开法的反向传播时间和内存随内层迭代次数线性增长(大约从34 MB增至262 MB),而隐式微分/DLM则保持在约28–29 MB不变;隐式微分同时取得了最佳的验证损失,因而被推荐为默认选择。
- 自动向量化在位姿图优化上带来了显著的正向/反向传播加速,但代价是内存增加最多约82%(正向)/55%(反向)。

## 对SLAM的意义

经典的SLAM后端(g2o、Ceres、GTSAM)高度优化,但不可微分,而深度网络可微分,却丢弃了使SLAM可解的稀疏结构。Theseus架起了两者之间的桥梁:它将因子图风格的优化引入PyTorch,使混合系统——学习型前端、优化型后端——能够针对真实任务损失进行端到端训练。它将BA-Net和DROID-SLAM开创的模式推广为共享基础设施,是为VIO/SLAM估计器学习残差权重、鲁棒核或初始化网络(而非手动调参)的自然工具。

## 相关条目

- [BA-Net](ba-net.md) — 作为网络层的可微分光束法平差,是其直接前身。
- [Lietorch](lietorch.md) — PyTorch中的可微分李群运算,用于同类问题。
- [GradSLAM](gradslam.md) — 完全可微分的稠密SLAM管线。
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — 围绕可微分BA层构建的端到端SLAM系统。
- [Differentiability](differentiability.md) — 支撑所有这些系统的底层概念。
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — 被赋予可微性的经典问题。
