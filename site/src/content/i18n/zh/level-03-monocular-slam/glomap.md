# GLOMAP

> Pan 2024 · [论文](https://arxiv.org/abs/2407.20219)

**一句话总结** — 重新审视了全局Structure-from-Motion,证明它在精度上可以与增量式SfM(COLMAP)相匹敌,同时速度大幅提升,其关键在于用一个联合的相机-点全局定位步骤取代了独立的平移平均步骤。

## 问题

SfM方案分为两大流派。*增量式*SfM(COLMAP)逐张注册图像,并反复进行光束法平差;它精度高、鲁棒性好,但其"代价高昂的反复光束法平差"限制了可扩展性。*全局*SfM一次性恢复所有相机,速度"快出几个数量级",但精度始终无法与增量式方法匹敌——差距"在于全局平移平均这一步骤",该步骤受到双视图平移尺度歧义(倾斜的三元组会放大噪声)、需要精确内参才能分解双视图几何,以及在序列数据中常见的近共线(前向)运动下的退化问题的困扰。GLOMAP旨在弥合这一差距。

## 方法与架构

包含两个组件:**对应搜索**(特征、匹配、双视图几何$\mathbf{F}/\mathbf{E}/\mathbf{H}$、视图图标定、相对位姿估计)以及**全局估计**。

- **特征轨迹构建**:只保留最优拟合双视图模型的内点对应,随后进行共面性(cheirality)检验;去除靠近极点或三角化角度较小的匹配,再将匹配拼接成轨迹。
- **先进行旋转平均**:绝对姿态求解经典的鲁棒目标函数

$$\operatorname*{arg\,min}_{\mathbf{R}}\sum_{i,j}\rho\left(d(\mathbf{R}_{j}^{\top}\mathbf{R}_{ij}\mathbf{R}_{i},\mathbf{I})^{p}\right)$$

  使用作者自己实现的Chatterjee等人方法;与该结果不一致的相对姿态(通过$\mathbf{R}_{ij}$与$\mathbf{R}_{j}\mathbf{R}_{i}^{\top}$之间的角度距离衡量)会被过滤掉。
- **全局定位取代平移平均**——核心贡献。相机位置$\mathbf{c}_i$和三维点$\mathbf{X}_k$由全局旋转后的相机光线$\mathbf{v}_{ik}$*联合*估计,完全弃用相对平移约束:

$$\operatorname*{arg\,min}_{\mathbf{X},\mathbf{c},d}\sum_{i,k}\rho\left(\|\mathbf{v}_{ik}-d_{ik}(\mathbf{X}_{k}-\mathbf{c}_{i})\|_{2}\right),\quad\text{s.t.}\quad d_{ik}\geq 0$$

  使用Huber损失$\rho$,通过Levenberg–Marquardt(Ceres)求解,所有变量在$[-1,1]$内*均匀随机*初始化,$d_{ik}=1$。对于最优的$d_{ik}$,每一项误差在角度$\theta<\pi/2$时等于$\sin\theta$,超过该范围则饱和为1——这是一个有界的、对外点鲁棒的误差,得益于其双线性形式而能从随机初始化可靠收敛。由于误差定义在相机光线而非相对平移上,不准确的内参只会偏移单个相机,而前向/侧向运动也不再退化。
- **全局光束法平差**:多轮采用Huber损失的LM优化;每一轮内先固定旋转,再与内参和点联合优化(这对序列数据尤为重要)。轨迹首先按角度误差过滤,再按重投影误差过滤;当被过滤的轨迹比例低于0.1%时迭代停止。可选的结构精化(重新三角化加更多BA)可进一步提升精度。
- **相机聚类**:一个共视图后处理步骤会找出强连通分量并谨慎地合并,将错误匹配、彼此不重叠的互联网图像集拆分为独立且一致的重建结果。
- **与COLMAP兼容**:使用相同的数据库并生成相同的输出格式,因此可以直接接入现有的NeRF/3DGS数据准备流程。

## 实验结果

- **ETH3D SLAM**(序列化,毫米级真值):相比COLMAP,召回率高约8%,在0.1 m/0.5 m处的AUC分别高出9/8个百分点,而COLMAP"慢了一个数量级";相比全局SfM基线,召回率高出18%/4%,AUC@0.1m高出约11个百分点。
- **ETH3D MVS装置**:重建了所有场景(COLMAP有一个场景失败,OpenMVG在所有场景上表现都很差);在成功的场景上精度与COLMAP相当或更高,速度快约3.5倍。
- **LaMAR**(每个场景数万张AR设备图像):在HGE和LIN上明显比包括COLMAP的所有基线更精确,同时快出几个数量级;所有方法在CAB(前向运动、昼夜变化、对称性)上都表现不佳。
- **IMC 2023**(未标定的互联网图像):在3°/5°/10°处的AUC比其他全局SfM基线高出数倍,比COLMAP高约4个百分点,运行速度快约8倍;在MIP360上与重跑的COLMAP精度相当,同时快超过1.5倍。
- 已知的失败模式:具有旋转对称性的场景(例如`exhibition_hall`)可能导致旋转平均崩溃。
- 开源于[github.com/colmap/glomap](https://github.com/colmap/glomap)——托管在COLMAP组织下,这加速了它作为默认"快速建图工具"的普及。

## 对SLAM的意义

像COLMAP这样的SfM工具是生成真值轨迹、离线地图以及NeRF/3DGS与基于学习的SLAM训练数据的标准方式。GLOMAP让这一离线建图步骤在大规模场景下的成本大幅降低,并在增量式流程被普遍认为是唯一可靠选择长达十年之后,重新确立了全局SfM作为一种可靠的通用范式的地位——这条路线由GPU原生系统InstantSfM等接续下去。从概念上讲,其"一次性求解所有变量"的立场与SLAM后端的全局光束法平差如出一辙,而其基于光线的全局定位方法表明,重新构建一个脆弱的估计步骤(平移平均)可能比单纯优化它更为关键。

## 相关条目

- [COLMAP](colmap.md)
- [InstantSfM](instantsfm.md)
- [VGGT](vggt.md)
- [MASt3R](mast3r.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md)
