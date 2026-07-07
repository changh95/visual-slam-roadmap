# Pop-up SLAM

> Yang 2016 · [论文](https://arxiv.org/abs/1703.07334)

**一句话总结** — 将单图像"弹出式"（pop-up）平面检测融入单目SLAM，在因子图中将平面用作路标，使稠密语义建图和状态估计能够在点特征方法失效的低纹理环境中存活。

## 问题

基于特征的SLAM系统依赖显著的点特征，"在具有挑战性的低纹理环境中不够鲁棒，因为可用的显著特征很少"；走廊、白墙和地板会导致LSD-SLAM和ORB-SLAM彻底失败。即使系统能够存活下来，"得到的稀疏或半稠密地图对运动规划而言也传递不出多少有用信息"。此前利用平面或场景布局对稠密地图进行正则化的工作，仍然"需要来自其他来源的可靠状态估计"。Pop-up SLAM证明了场景理解可以同时改善状态估计和稠密建图，尤其是在低纹理环境中。

## 方法与架构

该系统由三部分组成：单图像平面"弹出"前端、平面路标SLAM后端，以及两种与基于点特征的LSD-SLAM相融合的方案。

**单图像平面弹出。** 一个CNN分割出地面区域；系统不是拟合折线，而是通过子模优化，从检测到的线段中选出真正的墙-地边界：给定检测到的边集合 $V=\{e_1,\dots,e_n\}$，求 $\max_{S\subseteq V}F(S),\ st\colon S\in I$，其中得分函数 $F=C(S)$ 是水平方向的图像覆盖率，约束 $I=I_{close}\cap I_{ovlp}$ 要求边靠近CNN边界且水平方向不重叠。贪心更新 $S\leftarrow S\cup\{\operatorname{arg\,max}_{e\notin S}\bigtriangleup(e\mid S)\}$ 具有 $\frac{1}{k+1}$ 的最坏情况最优性界。平面用齐次向量 $\boldsymbol{\pi}=(\mathbf{n}^\top,d)^\top$ 表示，帧间转换为 $\boldsymbol{\pi}_w=\text{T}_{w,c}^{-\top}\boldsymbol{\pi}_c$。平面上的每个像素 $\mathbf{u}$ 弹出为3D点

$$\mathbf{p}_{c}=\frac{-d_{c}}{\mathbf{n}_{c}^{\top}(\text{K}^{-1}\mathbf{u})}\text{K}^{-1}\mathbf{u}$$

墙面法向量由垂直性推出：$\mathbf{n}_{wall,c}=\mathbf{n}_{gnd,c}\times(\mathbf{p}_{c1}-\mathbf{p}_{c0})$。用于初始化的相机旋转来自曼哈顿消失点，通过 $\mathbf{v}_{i}=\mathbf{K}\mathbf{R}_{w,c}^{\top}\mathbf{e}_{i}$ 求得。

**平面SLAM后端。** 一个因子图（iSAM）根据弹出平面测量值和里程计估计6自由度位姿 $x_0,\dots,x_t$ 和平面路标 $\boldsymbol{\pi}_0,\dots,\boldsymbol{\pi}_n$；每个平面都带有地面/墙面标签。由于 $(\mathbf{n}^\top,d)^\top$ 是过参数化的（信息矩阵是奇异的），平面在最小四元数表示 $\mathbf{q}\in\mathbb{R}^4$，$\|q\|=1$ 中被优化，通过指数映射更新。数据关联使用平面法向差异、相互距离和投影重叠度；回环检测使用ORB词袋，之后重复平面的因子会被转移到匹配的路标上。每次位姿更新后，平面测量会被重新弹出（每百个平面耗时小于1毫秒）。

**点-平面融合。** 纯平面SLAM在走廊等场景中是欠约束的（沿平行墙面存在一个自由方向 $t_{free}$），因此提出了两种与LSD-SLAM结合的方案：(1) *深度增强LSD SLAM*，将弹出深度 $d_p$（通过误差传播，$\sigma_p^2\propto d_p^2$）与LSD传播得到的深度 $d_l$ 融合为 $\mathcal{N}\left(\frac{\sigma_{l}^{2}d_{p}+\sigma_{p}^{2}d_{l}}{\sigma_{l}^{2}+\sigma_{p}^{2}},\frac{\sigma_{l}^{2}\sigma_{p}^{2}}{\sigma_{l}^{2}+\sigma_{p}^{2}}\right)$；(2) *LSD弹出SLAM*，将增强后的LSD位姿作为里程计因子来运行平面SLAM。

## 实验结果

- **TUM fr3/structure_notexture_far**（五面白墙加地面）：LSD-SLAM和ORB-SLAM均失败。Pop-up Plane SLAM在4.58米的轨迹上实现平均定位误差 $0.18\pm0.07$ 米（3.9%），端点误差0.10米；平面法向误差2.83°，平均像素深度误差6.2厘米，86.8%的像素深度误差在0.1米以内。
- **走廊数据集II**（60米回环，手持640×480相机）：LSD弹出SLAM以0.4米误差（占轨迹长度的0.67%）闭合回环，而LSD和ORB SLAM表现不佳（ORB经常无法初始化）。
- **运行时间**（i7 4.0 GHz + GPU用于CNN）：CNN分割17.8毫秒，边检测/选择13.2毫秒，iSAM增量更新17.4毫秒；每处理帧总耗时49.4毫秒（单线程超过20 Hz），弹出操作每10帧运行一次（3 Hz）。地图统计：146个平面，344个位姿，1974个因子。

## 对SLAM的意义

Pop-up SLAM是将结构和语义先验注入几何SLAM的早期案例之一，表明场景理解和SLAM是相互促进的：单图像先验能在退化场景中挽救SLAM，而SLAM则赋予这些先验3D一致性。它影响了后续基于平面和结构感知的SLAM工作，也是同一作者提出的物体级CubeSLAM的直接前身，后者复用了其地面反投影几何。

## 相关条目

- [ORB-SLAM](orb-slam.md)
- [PL-SLAM](pl-slam.md)
- [CubeSLAM](cubeslam.md)
- [LSD-SLAM](lsd-slam.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
