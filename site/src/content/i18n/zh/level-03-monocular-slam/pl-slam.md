# PL-SLAM

> Pumarola 2017 · [论文](https://www.albertpumarola.com/research/pl-slam/index.html)

**一句话总结** — 在ORB-SLAM的基础上，除点特征外还加入了线段特征——线通过其3D端点参数化，从而能够接入现有的点特征处理流程——并提出了一种新颖的纯线初始化方法，用于在低纹理人造环境中实现鲁棒的单目SLAM。

## 问题

低纹理场景是基于点特征几何视觉方法的"主要致命弱点之一"：ORB-SLAM在纹理稀少的视频中，或者当特征点因运动模糊而暂时消失时，很容易失败——这种情况在人造场景中很常见。这类场景中通常仍存在可靠的基于线的基元（城市场景、"曼哈顿世界"），但线检测器和参数化方法不如点特征那样成熟，基于线的位姿估计不那么可靠，且对部分遮挡敏感，而标准SLAM如果没有点对应关系甚至无法启动地图初始化。

## 方法与架构

PL-SLAM保留了ORB-SLAM的三线程架构——跟踪、局部建图、回环检测——并将线操作贯穿于检测、三角化、匹配、剔除、重定位和优化的各个环节。回环*检测*仍然只使用点特征，因为在整个地图范围内匹配线段的代价太高。

- **检测与匹配**：LSD以 $O(n)$ 复杂度提取线段；线与地图中的线通过一种关系图策略进行匹配，该策略结合了线段带描述子（LBD）的外观信息与成对几何一致性。观测视角少于3个，或在应可见的帧中出现率低于25%的线会被剔除。
- **端点参数化与线重投影误差**：遵循Vakhitov等人的方法，一条3D线由其端点 $P,Q\in\mathbb{R}^3$ 表示。根据检测到的齐次2D端点 $p^h_d,q^h_d$，归一化的直线系数为 $l=\frac{p^h_d\times q^h_d}{\lVert p^h_d\times q^h_d\rVert}$，线重投影误差是投影端点到直线距离的平方和：

$$E_{line}(P,Q,l,\theta,K)=E^2_{pl}(P,l,\theta,K)+E^2_{pl}(Q,l,\theta,K),\qquad E_{pl}(P,l,\theta,K)=l^{\top}\pi(P,\theta,K)$$

  其中 $\pi$ 使用相机位姿 $\theta=\{R,t\}\in SE(3)$ 和内参 $K$ 进行投影。该误差在 $P,Q$ 沿3D直线平移时保持不变，这起到了隐式正则化的作用，使这种非最小参数化能够安全地嵌入BA中。
- **联合BA代价函数**：结合点误差 $e_{i,j}=x_{i,j}-\tilde{x}_{i,j}$ 与线端点误差 $e^{\prime}_{i,j}=(\tilde{l}_{i,j})^{\top}(K^{-1}p^{h}_{i,j})$、$e^{\prime\prime}_{i,j}=(\tilde{l}_{i,j})^{\top}(K^{-1}q^{h}_{i,j})$，BA最小化

$$C=\sum_{i,j}\rho\left(e_{i,j}^{\top}\Omega_{i,j}^{-1}e_{i,j}+e^{\prime\top}_{i,j}\Omega^{\prime-1}_{i,j}e^{\prime}_{i,j}+e^{\prime\prime\top}_{i,j}\Omega^{\prime\prime-1}_{i,j}e^{\prime\prime}_{i,j}\right)$$

  使用Huber代价函数 $\rho$，协方差 $\Omega$ 与检测尺度相关联。
- **重定位**：EPnP被EPnPL取代，后者最小化检测到的线重投影误差，并沿直线移动检测到的端点以匹配投影出的模型端点，从而对遮挡和误检测具有鲁棒性。
- **纯线初始化**：假设连续三帧之间旋转较小且恒定（$R_1=R^{\top}$，$R_2=I$，$R_3=R$），每条被跟踪的线给出约束 $l_{2}^{\top}\left((R^{\top}l_{1})\times(Rl_{3})\right)=0$。利用一阶旋转近似 $R\approx I+[\mathbf{r}]_{\times}$，三条匹配的线给出关于 $r_1,r_2,r_3$ 的三个二次方程，通过改进的Kukelova多项式求解器求解（最多8个解）；平移 $t_1,t_3$ 随后通过三焦张量方程线性求出。总共只需五条线对应关系即可。

## 实验结果

在TUM RGB-D基准上（ATE RMSE，单位厘米，5次运行的中位数），PL-SLAM"在所有序列上都持续提升了ORB-SLAM的轨迹精度"：f1_xyz为1.21，对比ORB-SLAM的1.38；f2_xyz为0.43，对比0.54；f3_long_office为1.97，对比4.05；f2_desk_person为1.99，对比5.95；f3_sit_xyz为0.066，对比0.08；f3_walk_halfsph为1.60，对比2.09。除两个序列外（PTAM略微领先）均是最优结果，但PTAM在12个序列中的5个跟踪丢失，LSD-SLAM丢失3个，RGBD-SLAM丢失7个。纯线初始化甚至能启动f3_nstr_tex_far序列——在该序列中，经典的单应/本质矩阵初始化会检测到歧义而无法启动。它只在帧间旋转过大时才会失败。多项式求解器数值稳定（误差约为1e-15）。代价：跟踪运行频率为20 Hz，而ORB-SLAM为50 Hz；局部建图为3 Hz，而ORB-SLAM为7 Hz（局部BA耗时218.25毫秒，对比118.5毫秒）——在标准i7 CPU上接近实时。

## 对SLAM的意义

PL-SLAM表明，加入线特征能够有意义地提升精度——不仅在点特征消失的低纹理场景中如此，在纹理良好的序列中同样普遍适用——同时得益于端点参数化，几乎可以复用整个基于点的处理流程。它基于线的三视图初始化消除了对点对应关系用于系统启动的最后一个硬性依赖。后续的点线联合系统（包括Gomez-Ojeda的双目PL-SLAM，以及像AirVO这样的线辅助VIO）都建立在同样的"点加线"理念之上。

## 相关条目

- [ORB-SLAM](orb-slam.md)
- [Pop-up SLAM](pop-up-slam.md)
- [CubeSLAM](cubeslam.md)
- [AirVO](../level-06-vio-vins/airvo.md)
- [Edge detector](../level-01-beginner/edge-detector.md)
