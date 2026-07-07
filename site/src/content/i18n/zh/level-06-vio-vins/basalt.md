# Basalt

> Usenko 2020 · [论文](https://arxiv.org/abs/1904.06504)

**一句话总结** — 将视觉惯性估计拆分为实时里程计层和建图层,并使用非线性因子恢复(NFR)将VIO的线性化边缘化先验转换为一小组非线性的相对位姿和横滚-俯仰因子,使全局光束法平差可以自由地重新线性化。

## 问题

相机和IMU是互补的,但要将它们结合起来*用于全局一致的建图*并非易事:光束法平差希望关键帧具有大基线和长时间间隔,而"另一方面,惯性数据随着时间间隔的增加会迅速退化,经过几秒的积分后,通常只包含很少的有用信息。"因此,直接在关键帧之间预积分IMU数据的系统必须限制关键帧间距,并将速度和偏置拖入全局问题中,而稀疏的关键帧对这些变量的约束很差。同时,滑动窗口VIO会将历史信息压缩成一个在其线性化点处被冻结的Schur补先验。如何在不冻结线性化点、也不携带全部原始测量数据的情况下,将里程计积累的信息带入全局优化?

## 方法与架构

**VIO层(固定延迟平滑器)。** 在50像素的网格中提取FAST角点(80–120个活跃特征点),并通过金字塔逆合成KLT跟踪,估计一个采用局部缩放SSD范数(对强度尺度不变)的 $\mathrm{SE}(2)$ 图像块变形;跟踪回溯到源帧以过滤异常值。地标点相对于其宿主关键帧,以立体投影坐标 $(u,v)$ 下的单位方向向量加逆距离 $d$ 的形式存储,得到重投影残差

$$\mathbf{r}_{it} = \mathbf{z}_{it} - \pi_{c(t)}\big(\mathbf{T}_{t}^{-1} \mathbf{T}_{h(i)}\, \mathbf{q}_{i}(u,v,d)\big)$$

即使在 $d = 0$ 时也保持数值稳定。IMU测量值被预积分为伪测量 $(\Delta\mathbf{R}, \Delta\mathbf{v}, \Delta\mathbf{p})$,并附带递归传播的协方差和偏置雅可比;例如旋转残差为 $\mathbf{r}_{\Delta\mathbf{R}} = \mathrm{Log}(\Delta\tilde{\mathbf{R}}\, \mathbf{R}_{j}^{\top} \mathbf{R}_{i})$。每一帧都最小化

$$E = \sum_{i\in\mathcal{P},\; t\in\mathrm{obs}(i)} \mathbf{r}_{it}^{\top} \boldsymbol{\Sigma}^{-1}_{it} \mathbf{r}_{it} + \sum_{(i,j)\in\mathcal{C}} \mathbf{r}_{ij}^{\top} \boldsymbol{\Sigma}^{-1}_{ij} \mathbf{r}_{ij} + E_{\text{m}}$$

窗口涵盖7个关键帧位姿加上最近的3个完整状态(位姿、速度、偏置);较旧的状态通过Schur补部分边缘化去除($\mathbf{H}^{\text{m}}_{\alpha\alpha} = \mathbf{H}_{\alpha\alpha} - \mathbf{H}_{\alpha\beta}\mathbf{H}_{\beta\beta}^{-1}\mathbf{H}_{\beta\alpha}$),并使用首次估计雅可比来保持零空间。

**带NFR的建图层。** 当一个关键帧离开窗口时,Basalt保存其马尔可夫毯的线性化,边缘化除关键帧位姿之外的一切,并通过最小化原始高斯分布 $N(\boldsymbol{\mu}_{\text{o}}, \mathbf{H}_{\text{o}}^{-1})$ 与因子化近似之间的Kullback-Leibler散度,*恢复*出近似该稠密先验的非线性因子。恢复出的残差是相对位姿和横滚-俯仰(位置/偏航因不可观测而被丢弃):

$$\mathbf{r}_{\text{rel}}(\mathbf{s}, \mathbf{z}_{\text{rel}}) = \mathrm{Log}(\mathbf{z}_{\text{rel}}\, \mathbf{T}_{j}^{-1} \mathbf{T}_{i}), \qquad \mathbf{r}_{\text{rp}}(\mathbf{s}, \mathbf{z}_{\text{rp}}) = \lfloor \mathbf{z}_{\text{rp}}\, \mathbf{R}_{i}^{-1} (0,0,-1)^{\top} \rfloor_{xy}$$

伪测量值 $\mathbf{z}$ 是从当前估计中读取的(因此均值保持不变),信息矩阵有闭式解 $\mathbf{H}_{i} = (\{\mathbf{J}_{\text{r}} \boldsymbol{\Sigma}_{\text{o}} \mathbf{J}_{\text{r}}^{\top}\}_{i})^{-1}$。随后全局建图检测并匹配ORB特征(与VIO的KLT点在统计上独立,从而隐式地提供了回环检测),并最小化重投影误差加上恢复出的因子能量 $E_{\text{nfr}}$——这是一个仅涉及关键帧位姿和地标点的光束法平差,没有速度或偏置,可以自由地重新线性化一切。横滚-俯仰因子使全局地图保持与重力对齐,相对位姿因子在没有特征匹配的路段之间架起桥梁。

## 实验结果

在EuRoC上(RMS ATE,排除因缺失帧超过400帧的V2_03):在里程计方法中,VIO层在10个序列中的8个上表现最佳——例如在MH_01–05上为0.07 / 0.06 / 0.07 / 0.13 / 0.11 m,在V1_01–V2_02上为0.04 / 0.05 / 0.10 / 0.04 / 0.05 m——对比VI-DSO(在5个序列上最佳),并明显领先于OKVIS和VINS-Fusion。完整建图系统达到0.02–0.10 m,尤其在关键帧间隔较大的机库序列上优于VI ORB-SLAM(MH_04:0.10对0.22 m),并在纯BA失败、身份加权因子的BA退化到0.56 m的V1_03序列上成功跟踪(0.03 m)——表明起作用的是KLD恢复出的权重,而不仅仅是因子拓扑结构。计时(Intel E5-1620):VIO平均每帧7.83 ms,约11.5%的帧成为关键帧,建图每个关键帧耗费52.8 ms;MH_05(2273个双目帧,114秒)处理耗时19.2秒VIO + 9.7秒建图,比实时快约4倍,全局状态比朴素IMU积分小2.5倍。

## 对SLAM的意义

Basalt为每个VIO加建图系统都会面临的问题给出了一个原理性的答案:如何在不冻结线性化点、也不保留原始测量数据的情况下,将里程计信息带入全局优化。将"从里程计中保留什么"构造成一个分布近似问题(哪些非线性因子最能匹配已积累的信息),使这一思想具有可迁移性——它影响了后来的系统,包括OKVIS2对边缘化地标点的位姿图边处理方式——其高质量的开源实现也成为EuRoC和TUM-VI上常用的高精度基线方法。

## 动手实践

- [运行Basalt-VIO](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/basalt)

## 相关条目

- [OKVIS](okvis.md) — Basalt所针对的边缘化弱点所在的滑动窗口架构。
- [Marginalization](../level-02-getting-familiar/marginalization.md) — 底层机制及其线性化陷阱。
- [DM-VIO](dm-vio.md) — 针对同一不一致性问题的另一种补救方法(延迟边缘化)。
- [OKVIS2](okvis2.md) — 具有可重新激活的边缘化信息的后继系统。
- [VI-DSO](vi-dso.md) — 论文评估中最接近的VIO竞争对手。
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — Basalt开源实现中所用鱼眼模型的背景知识。
