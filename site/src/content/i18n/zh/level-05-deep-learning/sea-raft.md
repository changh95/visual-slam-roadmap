# SEA-RAFT

> Wang 2024 · [论文](https://arxiv.org/abs/2405.14793)

**一句话总结** — Simple, Efficient, Accurate RAFT：通过混合Laplace损失、直接回归初始光流、在TartanAir上进行刚性光流预训练以及架构简化，使RAFT获得了最佳的精度-效率帕累托前沿——在Spring数据集上达到最先进水平，同时比同类方法至少快2.3倍。

## 问题

RAFT之后的光流研究进展大多来自更重的架构——基于Transformer的代价体编码器、更大的骨干网络——却牺牲了让光流能够用于实时系统的速度。同时，RAFT自身的方案也存在弱点：标准的$L_1$端点损失容易被重度遮挡下的模糊、不可预测像素所主导；从零初始化的光流需要大量的精炼迭代(训练时12次，推理时最多32次)；而合成的FlyingChairs/Things数据限制了真实感和泛化能力。SEA-RAFT探讨的是，在保持原始架构不变的情况下，损失函数、初始化和数据的改进能带来多大的提升。

## 方法与架构

SEA-RAFT保留了RAFT的骨架。特征编码器$F$和上下文编码器$C$(用截断的ImageNet预训练ResNet取代RAFT自定义的编码器)将$I_1, I_2 \in \mathbb{R}^{H\times W\times 3}$映射到$1/8$分辨率特征；构建了一个多尺度4D相关体：

$$V_k = F(I_1) \circ \texttt{AvgPool}(F(I_2), 2^k)^{\top} \in \mathbb{R}^{h\times w\times\frac{h}{2^k}\times\frac{w}{2^k}}, \qquad k=4,\ (h,w)=\tfrac{1}{8}(H,W)$$

每次迭代在当前光流$\mu$周围以半径$r{=}4$查找运动特征，$M = \texttt{MotionEncoder}(\texttt{LookUp}(\{V_k\},\mu,r))$，一个循环单元(用两个ConvNeXt模块取代RAFT的ConvGRU)更新隐藏状态并回归残差：$h' = \texttt{RNN}(h, M, C(I_1))$，$\Delta\mu = \texttt{FlowHead}(h')$。三个主要改动：

- **混合Laplace(MoL)损失**：网络不使用$L_1$，而是预测一个双组分Laplace混合分布的逐像素参数——一个组分对应普通像素，另一个对应模糊(遮挡)像素：

$$MixLap(x;\alpha,\beta_1,\beta_2,\mu) = \alpha\cdot\frac{e^{-\frac{|x-\mu|}{e^{\beta_1}}}}{2e^{\beta_1}} + (1-\alpha)\cdot\frac{e^{-\frac{|x-\mu|}{e^{\beta_2}}}}{2e^{\beta_2}}$$

  其中$\beta_1{=}0$固定，使第一个组分与$L_1$/端点误差度量匹配，尺度在对数空间中回归以保证稳定性($\beta_2 \in [0,10]$)，损失$\mathcal{L}_{MoL}$为对像素和两个光流轴平均的真值负对数似然，每次迭代都以常见的指数加权方式应用，$\mathcal{L}_{all}=\sum_{i=1}^{N}\gamma^{N-i}\mathcal{L}_{MoL}^{i}$。混合权重$\alpha$同时兼作不确定性输出。
- **直接回归初始光流**：上下文编码器同时输入两帧堆叠的图像，预测初始光流(以及其MoL参数)，而不是从零开始——将训练时的迭代次数减少到$N{=}4$，推理时最多12次。
- **刚性光流预训练**：在TartanAir上训练30万步，该数据集的光流纯粹来自静态场景中的相机运动——运动多样性有限，但真实感高，能显著提升泛化能力。

变体：SEA-RAFT(S)使用ResNet-18的前6层，(M)使用ResNet-34的前13层；(L)是(M)运行12次推理迭代的版本。

## 实验结果

- **Spring测试集(微调后)**：SEA-RAFT(M)达到3.686的1px异常率和0.363的EPE——排名第一，相比先前方法EPE至少降低22.9%、1px误差至少降低17.8%；即使SEA-RAFT(S)也超过了所有其他方法(分别降低20.0% / 12.8%)。在Spring训练集上零样本测试，它在不使用额外数据的方法中表现最好，接近MS-RAFT+，同时体积小11倍、速度快24倍。
- **效率**：比同等精度的方法至少快2.3倍；最小的模型在RTX 3090上以21 fps运行1080p分辨率(比原始RAFT快3倍)；SEA-RAFT(M)在540x960分辨率下耗时70.96 ms / 486.9 GMACs，而RAFT为140.7 ms / 938.2 GMACs。
- **在KITTI训练集上的C+T零样本测试**：泛化能力为已发表方法中最佳——Fl-epe从4.09降到3.62，Fl-all从13.7降到12.9。在Sintel训练集上，clean子集表现有竞争力，final子集稍弱(4.11)；仅加入约1200个真实数据对(KITTI+HD1K)就能缩小这一差距(2.79)。
- **Sintel/KITTI测试集**：SEA-RAFT(L)得到1.31(clean) / 2.60(final)和4.30的Fl-all——相比RAFT分别提升19.9% / 4.2% / 15.7%——而同等精度的方法在Sintel上至少慢1.8倍，在KITTI上至少慢4.6倍。

## 对SLAM的意义

当SLAM前端需要以实时速率获得稠密光流时，SEA-RAFT是实用的选择：具备RAFT级别的能力，却没有Transformer级别的延迟。它的两个要素与SLAM的需求直接契合——刚性运动预训练与SLAM所假设的、基本刚性的世界相匹配，而Laplace混合参数提供了逐像素不确定性，可以自然地映射到概率估计中的测量协方差上。它也是一个案例研究，说明损失函数、初始化和数据设计可以胜过架构规模的增长，这对任何学习型SLAM组件都具有借鉴意义。

## 相关条目

- [RAFT](raft.md) — 基础架构和训练目标
- [FlowFormer](flowformer.md) — 更重的Transformer替代方案
- [TartanVO](tartanvo.md) — 同样建立在TartanAir刚性场景数据上的学习型VO
- [DPVO](dpvo.md) — 采用RAFT风格更新的稀疏学习型里程计
- [DROID-SLAM](droid-slam.md) — 在完整SLAM系统中使用RAFT机制
