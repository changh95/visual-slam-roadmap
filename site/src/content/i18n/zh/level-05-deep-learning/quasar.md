# QUASAR

> Yang 2019 · [论文](https://arxiv.org/abs/1905.12536)

**一句话总结** — 首个针对含外点的Wahba问题(旋转搜索)的多项式时间可证明最优求解器:采用截断最小二乘(Truncated Least Squares)代价函数,通过单位四元数和"二值克隆(binary cloning)"重写为QCQP,再用一个紧凑的SDP松弛求解。

## 问题

Wahba问题——在给定候选对应关系的情况下,找出最优对齐两组向量观测值的旋转——是点云配准、图像拼接、运动估计和卫星姿态确定中的一个基础问题。其无外点版本$\min_{\mathbf{R}\in\mathrm{SO}(3)}\sum_i w_i^2\Vert\mathbf{b}_i-\mathbf{R}\mathbf{a}_i\Vert^2$有闭式解,但来自特征匹配的真实对应关系可能有95%都是外点(例如FPFH匹配)。RANSAC的运行时间随外点比例呈指数增长,且随噪声增大而性能下降;鲁棒局部优化方法(如FGR)可能陷入局部极小值;分支界定法(Branch-and-Bound)全局最优但最坏情况下复杂度为指数级。在QUASAR之前,不存在多项式时间的*可证明最优*方法来处理含大量外点的旋转搜索问题。

## 方法与架构

**TLS公式化。** 每个测量项只在其残差较小时才贡献一个最小二乘项;超过某个阈值后该项就会饱和,不再影响估计结果:

$$\min_{\mathbf{R}\in\mathrm{SO}(3)} \sum_{i=1}^{N} \min\left( \frac{1}{\sigma_i^2}\Vert\mathbf{b}_i - \mathbf{R}\mathbf{a}_i\Vert^2,\ \bar{c}^2 \right),$$

其中$\sigma_i$是内点噪声的标准差,$\bar{c}^2$取为概率$p$(例如$p=0.99$)下$\chi^2(3)$分位数,因此$\sigma_i^2\bar{c}^2$是内点所能容忍的最大平方残差。

**四元数重写。** 用单位四元数$\mathbf{q}\in\mathcal{S}^3$表示$\mathbf{R}$,将约束集从$\mathrm{SO}(3)$替换为单位球面,$\mathbf{R}\mathbf{a}$通过四元数乘积$\mathbf{q}\otimes\hat{\mathbf{a}}\otimes\mathbf{q}^{-1}$表达。

**二值克隆化为QCQP。** 利用$\min(x,y)=\min_{\theta\in\{\pm 1\}} \frac{1+\theta}{2}x+\frac{1-\theta}{2}y$,TLS代价函数变为一个混合整数规划,其中$\theta_i=+1$表示第$i$个测量被判定为内点,$\theta_i=-1$表示外点——因此外点分类被纳入了优化过程*内部*。定义克隆四元数$\mathbf{q}_i = \theta_i\mathbf{q}$可消去整数变量,再堆叠$\mathbf{x}=\left[\mathbf{q}^{\mathsf{T}}\ \mathbf{q}_1^{\mathsf{T}}\ \dots\ \mathbf{q}_N^{\mathsf{T}}\right]^{\mathsf{T}}$,便得到一个完全等价的二次约束二次规划(QCQP):

$$\min_{\mathbf{x}\in\mathbb{R}^{4(N+1)}} \sum_{i=1}^{N}\mathbf{x}^{\mathsf{T}}\mathbf{Q}_i\mathbf{x} \quad \text{s.t.} \quad \mathbf{x}_q^{\mathsf{T}}\mathbf{x}_q = 1,\quad \mathbf{x}_{q_i}\mathbf{x}_{q_i}^{\mathsf{T}} = \mathbf{x}_q\mathbf{x}_q^{\mathsf{T}}\ \forall i,$$

其中已知对称矩阵$\mathbf{Q}_i$由$\mathbf{a}_i,\mathbf{b}_i$构造而得。

**紧凑的SDP松弛。** 提升到$\mathbf{Z}=\mathbf{x}\mathbf{x}^{\mathsf{T}}\succeq 0$并舍弃秩1约束,得到一个关于$\mathrm{tr}(\mathbf{Q}\mathbf{Z})$的凸SDP。*朴素*松弛(仅含块对角约束)在无噪声、无外点情况下被证明是紧的(定理7),但在有外点的实际场景中会失效。QUASAR在非对角块上添加了冗余的对称性约束$[\mathbf{Z}]_{qq_i}=[\mathbf{Z}]_{qq_i}^{\mathsf{T}}$和$[\mathbf{Z}]_{q_iq_j}=[\mathbf{Z}]_{q_iq_j}^{\mathsf{T}}$,这使得松弛在大噪声和极端外点比例下依然在实践中保持紧凑。当解的秩为1(松弛间隙为零)时,恢复出的旋转对于原始非凸TLS问题而言就是*可证明*全局最优的。

## 实验结果

- **朴素松弛与紧凑松弛的对比**(合成数据,$N=40$,无噪声):朴素SDP在外点比例10–40%时开始变松,超过40%时完全失效,而QUASAR即便在90%外点的情况下仍能返回可证明最优的秩1解。
- **合成基准测试**($\sigma_i=0.01$):闭式解Wahba方法仅在无外点时有效;FGR对70%外点鲁棒,但在90%时失效;RANSAC、GORE和QUASAR对90%外点均鲁棒,其中QUASAR略更精确。在极端的91–96%外点比例下($N=100$),Wahba/FGR/RANSAC全部失效,GORE在96%时出现一次失败,而QUASAR在所有测试中都高度精确。在高噪声情形下($\sigma_i=0.1$),QUASAR依然能容忍80%外点,而其他所有方法都失效。
- **点云配准**(Bunny数据集,$N=40$,通过不变量测量求解旋转子问题):QUASAR在两种噪声情形下都全面优于所有对比方法。
- **图像拼接**(PASSTA Lunch Room):70个SURF对应关系中有46个(66%)是外点;QUASAR(取$\sigma^2\bar{c}^2=0.001$)成功完成拼接,而Matlab的MSAC则失败。
- **紧凑性指标**:松弛间隙和秩/稳定秩在合成数据和Bunny测试中均证实了紧凑性。主要局限:通用SDP求解器扩展性较差——对于$N=100$个对应关系,使用MOSEK约需1200秒(SDPNAL+约500秒)。

## 对SLAM的意义

旋转估计存在于许多SLAM子问题中:点云配准、地图合并、旋转平均以及外参标定。QUASAR是"可证明感知(certifiable perception)"这一研究方向(与SE-Sync和TEASER++一脉相承,大多来自同一研究团队)的一部分,该方向表明机器人学中的关键几何问题即便在严重外点污染下也能被证明达到全局最优。其核心要素——TLS代价函数、二值克隆以及冗余约束SDP——后来成为了TEASER/TEASER++内部旋转子求解器的机制基础。

## 相关条目

- [SE-Sync](se-sync.md) — 通过SDP松弛实现的可证明位姿图优化
- [TEASER++](teaserpp.md) — 使用相同旋转求解机制的可证明点云配准
- [GNC](gnc.md) — 采用相同TLS代价函数的通用渐进非凸性鲁棒估计方法
