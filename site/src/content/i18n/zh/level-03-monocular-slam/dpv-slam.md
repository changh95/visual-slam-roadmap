# DPV-SLAM

> Lipson 2024 · [论文](https://arxiv.org/abs/2408.01654)

**一句话总结** — 通过加入高效的回环检测与全局校正机制，将DPVO扩展为一个完整的SLAM系统（ECCV 2024），同时保持在单张GPU上的实时运行。

## 问题

基于深度网络的SLAM主干网络能带来出色的精度，但"这类方法运行代价往往很高，或者零样本泛化能力不佳。它们的运行时间也可能剧烈波动，因为前端和后端要争夺GPU资源的访问权"。具体而言：同一设备上的两个CUDA工作负载只能顺序执行，因此现有的深度SLAM系统在后端迭代运行期间会周期性地从约30 Hz骤降到<1 Hz——要实现持续的实时运行需要两张GPU——而且基于光流的后端必须为*每一帧*都保留稠密特征图，因此内存占用会随视频长度增长。DPVO解决了效率问题，但只做里程计，因此漂移会无限累积。DPV-SLAM则补全了这一设计：具备回环检测、较高的*最低*帧率，且在单张GPU上仅占用5-7 GB内存的单目深度SLAM。

## 方法与架构

**DPVO基础架构。** 前端保留了DPVO的补丁图（patch graph）：补丁 $\mathbf{P}_{ik}$（像素坐标加逆深度 $\mathbf{d}$）通过 $\mathbf{P}'_{ikj} = \Pi[G_j^{-1} \cdot G_i \cdot \Pi^{-1}(\mathbf{P}_{ik})]$ 重投影到帧 $j$ 中；一个循环算子预测残差 $\Delta_{ikj}$ 和置信度 $w_{ikj}$，光束法平差则将重投影与"理想"目标 $\mathcal{I}_{ikj} = \mathbf{P}'_{ikj} + \Delta_{ikj}$ 对齐：

$$\operatorname*{arg\,min}_{G, \mathbf{d}} \sum_i \sum_{k} \sum_{j} \left\lVert \Pi[G_j^{-1} \cdot G_i \cdot \Pi^{-1}(\mathbf{P}_{ik})] - \mathcal{I}_{ikj} \right\rVert^2_{\Sigma_{ikj}}, \qquad \Sigma_{ikj} = \operatorname{diag}(w_{ikj})$$

**邻近性回环检测（中期）。** 关键的观察是：对每条有向边，相关性算子只需要*目的*帧的稠密特征，而光束法平差因子无论边的方向如何都会同时约束两端的位姿——因此边可以任意翻转，从而控制由哪些帧承担内存开销。据此，DPV-SLAM只永久存储过往帧的补丁特征（每1000帧约0.6 GB），并在相机经过先前访问过的位姿附近时，从旧的补丁向近期帧插入*单向*边。里程计因子和回环检测因子在同一个共享优化中混合处理，由一个专为稀疏、可变大小的补丁图设计的新型CUDA块稀疏光束法平差来运行。整个系统在单张GPU的单一进程内运行；在EuRoC上一次邻近性全局BA耗时0.1-0.18秒，而DROID-SLAM后端耗时0.5-5秒。

**经典回环检测（长期，"DPV-SLAM++"）。** 一个互补的CPU后端用来纠正尺度漂移：对ORB特征进行dBoW2图像检索以检测回环候选；再用现成的检测器/匹配器加上仅优化结构的BA来三角化每个检索到的帧对周围的3D特征点，通过RANSAC + Umeyama对齐得到漂移量 $\Delta S^{loop}_{jk} \in Sim(3)$。随后通过Levenberg-Marquardt对关键帧相似变换 $S_i$ 在一个带平滑项和回环残差的位姿图上进行优化：

$$r_i = \log_{Sim(3)}\big(\Delta S_{(i,i+1)}^{-1} \cdot S_i^{-1} \cdot S_{i+1}\big), \qquad r_{jk} = \log_{Sim(3)}\big(\Delta S^{loop}_{jk} \cdot S_j^{-1} \cdot S_k\big)$$

之后位姿和深度会被重新缩放（$d_i \leftarrow d_i / s_i$）。检索和位姿图优化在并行进程中运行，几乎不增加额外运行时间。

## 实验结果

以下均为5次运行的中位数，计时基于RTX-3090；所有场景使用同一份TartanAir训练的权重（零样本）：

- **EuRoC**：平均ATE为0.024米，DROID-SLAM为0.022米——精度相近，但帧率为50 FPS对20 FPS，内存占用为5 GB对20 GB。相较基础版DPVO，误差下降了4倍（从0.105降到0.024），代价仅是帧率从60降到50 FPS，内存从4 GB增到5 GB。
- **KITTI**：DPV-SLAM++平均ATE为25.76米，帧率39 FPS，而DROID-SLAM为54.19米以上（在序列02和09上失败），LDSO为22.42米；在序列00/05/07上DPV-SLAM++分别达到8.30/5.74/1.52，而仅依赖邻近性回环的深度方法会出现尺度漂移（DPVO在序列00上误差达113.21）。仅靠邻近性回环无法修正尺度漂移——图像检索才是拯救室外驾驶场景的关键。
- **TUM-RGBD**（freiburg1）：DPV-SLAM++平均为0.054，DROID-SLAM为0.038，GO-SLAM为0.035——精度处于同一水平，帧率30 FPS，内存4.0-6.0 GB对7.2-8.5 GB。
- **TartanAir**（比赛测试集）：平均ATE为0.16，DROID-SLAM为0.24，帧率27 FPS对8 FPS。
- 总体而言：在四个基准测试（室内和室外）上均没有出现灾难性失败，同时实现了1到4倍的实时吞吐量。

## 对SLAM的意义

DPV-SLAM完成了DROID-SLAM → DPVO这条演进路线：可微光束法平差的视觉里程计，先被做得稀疏而快速，最终又配上了回环检测，成为真正意义上的SLAM系统——它也是一个清晰的案例，展示了学习型前端如何在有限的资源预算下与经典的全局机制（dBoW2检索、$Sim(3)$位姿图优化）结合起来。它的边翻转内存技巧以及单GPU上前后端共存的设计，正对症解决了让深度SLAM难以落地到机器人上的系统性问题。

## 相关条目

- [DPVO](dpvo.md)
- [DROID-SLAM](droid-slam.md)
- [ORB-SLAM3](orb-slam3.md)
- [MAC-VO](mac-vo.md)
- [位姿图优化](../level-02-getting-familiar/pose-graph-optimization.md)
