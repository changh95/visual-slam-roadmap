# ElasticFusion

> Whelan 2015 · [论文](https://ieeexplore.ieee.org/document/7274882)

**一句话总结** —— 一种基于面元(surfel)的稠密RGB-D SLAM系统,在回环检测时直接对地图施加非刚性弹性形变,从而实现全局一致的重建,而无需位姿图。

## 问题

稠密SLAM系统在既延展又闭环的运动下表现不佳——例如手持深度相机"粉刷"一个房间。KinectFusion的固定体素限制了场景大小;Whelan早先的Kintinuous通过位姿图形变扩展到走廊尺度,但在局部闭环轨迹上表现不佳,且不能重用已重访的地图区域;DVO-SLAM优化关键帧位姿,但没有构建明确的连续表面。ElasticFusion颠倒了优先顺序:不再优化相机轨迹(位姿图)再重建地图,而是直接优化*地图*本身——尽早且频繁地施加表面回环闭合,使系统始终保持在地图分布的模态附近。

## 方法与架构

逐帧循环:RGB-D输入→喷溅式(splatted)面元预测→frame-to-model ICP+RGB跟踪→面元融合→局部(模型到模型)回环检查→全局(fern)回环检查→非刚性形变。CUDA负责跟踪归约和地图管理;OpenGL负责视图预测。

- **融合面元地图**:一个无序的面元列表$\mathcal{M}$,每个面元具有位置$\mathbf{p}\in\mathbb{R}^3$、法向$\mathbf{n}$、颜色$\mathbf{c}$、权重$w$、半径$r$、初始化时间戳$t_0$和最后更新时间戳$t$。一个时间窗口$\delta_t$将$\mathcal{M}$划分为**活跃(active)**面元$\Theta$(最近被观测到,用于跟踪和融合)和**非活跃(inactive)**面元$\Psi$(在回环重新激活它们之前不使用)。
- **联合frame-to-model跟踪**:每一帧都与活跃模型的一次喷溅渲染进行配准——同时使用深度*和*完整的颜色信息。几何项是实况深度图与预测深度之间的点到平面ICP,

$$E_{\mathrm{icp}} = \sum_{k} \Big( \big(\mathbf{v}^k - \exp(\hat{\boldsymbol{\xi}})\,\mathbf{T}\,\mathbf{v}_t^k\big)\cdot\mathbf{n}^k \Big)^2 ,$$

  光度项$E_{\mathrm{rgb}}$则惩罚实况彩色图像与预测的活跃模型颜色之间的强度差异。联合代价$E_{\mathrm{track}} = E_{\mathrm{icp}} + w_{\mathrm{rgb}} E_{\mathrm{rgb}}$(其中$w_{\mathrm{rgb}} = 0.1$)通过高斯-牛顿法在三级粗到细金字塔上最小化(GPU树归约构建6×6系统,CPU的Cholesky分解求解)。
- **按时间采样和连接的变形图**:每一帧都会从面元中重新采样出一个新的图$\mathcal{G}$,节点具有位置$\mathcal{G}^n_{\mathbf{g}}$、变换$\mathcal{G}^n_{\mathbf{R}}, \mathcal{G}^n_{\mathbf{t}}$和时间戳;连通性遵循初始化时间顺序(k = 4个邻居),从而防止时间上不相关的多次经过同一表面时相互影响。一个面元由其影响节点变形得到:

$$\hat{\mathcal{M}}^s_{\mathbf{p}} = \sum_{n\in I} w^n \big[ \mathcal{G}^n_{\mathbf{R}} (\mathcal{M}^s_{\mathbf{p}} - \mathcal{G}^n_{\mathbf{g}}) + \mathcal{G}^n_{\mathbf{g}} + \mathcal{G}^n_{\mathbf{t}} \big], \qquad w^n = \big(1 - \lVert \mathcal{M}^s_{\mathbf{p}} - \mathcal{G}^n_{\mathbf{g}} \rVert_2 / d_{\max} \big)^2 .$$

- **形变优化**:给定表面对应关系$\mathcal{Q}$(源点、目标点、时间戳),图参数通过最小化$E_{\mathrm{def}} = w_{\mathrm{rot}} E_{\mathrm{rot}} + w_{\mathrm{reg}} E_{\mathrm{reg}} + w_{\mathrm{con}} E_{\mathrm{con}} + w_{\mathrm{con}} E_{\mathrm{pin}}$来求解,权重取$w_{\mathrm{rot}}{=}1, w_{\mathrm{reg}}{=}10, w_{\mathrm{con}}{=}100$:一个刚性项$E_{\mathrm{rot}} = \sum_l \lVert \mathcal{G}^{l\top}_{\mathbf{R}}\mathcal{G}^{l}_{\mathbf{R}} - \mathbf{I} \rVert_F^2$,一个嵌入式变形平滑项$E_{\mathrm{reg}}$(作用于图的边上),一个约束项$E_{\mathrm{con}} = \sum_p \lVert \phi(\mathcal{Q}^p_{\mathbf{s}}) - \mathcal{Q}^p_{\mathbf{d}} \rVert_2^2$,以及一个"钉住"项,将非活跃区域锚定,使活跃模型能变形到*进入*非活跃坐标系中。用高斯-牛顿法和CPU上的稀疏Cholesky求解,再在GPU上应用到所有面元。
- **局部回环检测**:每一帧(在没有触发全局回环时),从当前位姿对活跃和非活跃模型进行预测渲染,并用同样的ICP+RGB方法进行配准;只有当残差足够小、内点数量足够、且Hessian导出的协方差特征值低于阈值时才接受该配准。被接受的约束会使地图产生形变,并重新激活被匹配的非活跃面元——许多小回环被持续闭合。
- **全局回环检测**:一个随机化的fern编码数据库(基于80×60降采样的*预测*视图而非原始帧)在任意漂移之后检测重访;匹配的视图经过配准和检查(包括优化后对$E_{\mathrm{con}}$的检查),并作为整体地图形变施加——不需要位姿图,不需要轨迹记账。

## 实验结果

- **轨迹(TUM RGB-D,ATE RMSE)**:fr1/desk为0.020米,fr2/xyz为0.011米,fr3/office为0.017米,fr3/nst为0.016米——与DVO SLAM(0.021/0.018/0.035/0.018)、RGB-D SLAM(0.023/0.008/0.032/0.017)、MRSMap(0.043/0.020/0.042/2.018)和Kintinuous(0.037/0.029/0.030/0.031)相当或更好。
- **表面重建(ICL-NUIM合成客厅数据)**:在kt0-kt3上,到真值模型的平均距离分别为0.007/0.007/0.008/0.028米——优于所有比较系统(例如Kintinuous为0.011/0.008/0.009/0.150米);轨迹ATE为0.009/0.009/0.014/0.106米。在kt3上的消融实验:仅使用局部回环时表面误差为0.099米,仅使用全局回环时为0.103米——两者都是必需的。
- **规模与速度**:实时捕获了超过450万面元的完整房间扫描;Hotel序列运行7725帧,生成410万面元、328个图节点、11次局部回环和1次全局回环。平均每帧耗时31毫秒,最高45毫秒(最差情况约22 Hz),测试硬件为Intel Core i7-4930K配NVIDIA GTX 780 Ti。

## 对SLAM的意义

ElasticFusion使"地图即状态"成为一种可行的设计思路:它不是纠正相机轨迹再重新整合测量值,而是直接纠正稠密表面本身,通过频繁的小幅形变始终保持在地图分布的模态附近。它成为了基于面元的稠密SLAM的标准骨干——SemanticFusion直接在其面元上添加CNN语义信息——其活跃/非活跃模型划分、模型到模型的局部回环以及fern重定位在后续的稠密系统中反复出现。研究本文有助于理解带在线回环检测的高质量房间尺度稠密重建。

## 相关条目

- [KinectFusion](kinectfusion.md)
- [Kintinuous](kintinuous.md)
- [SemanticFusion](semanticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [BundleFusion](bundlefusion.md)
