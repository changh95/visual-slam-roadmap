# Kintinuous

> Whelan 2012 · [论文](https://ieeexplore.ieee.org/document/6907054)

**一句话总结** — 通过一个持续移动（循环缓冲）的TSDF体积把KinectFusion扩展到了无边界环境，该体积将离开边界的表面切片流式输出到一个逐步构建的三角网格中，并配备了早期的回环检测机制（DBoW+SURF、iSAM），后来演化为基于形变的地图校正。

## 问题

KinectFusion固定大小的TSDF体积无法表示比一张桌子或一个小房间更大的环境——一旦相机移出体积边界，跟踪就会失败。它的ICP里程计在几何结构较差的区域（例如笔直的走廊）中也会失效。大规模的室内外建图需要实时地无限扩展重建结果，同时还要保留一条能够校正累积漂移的途径。

## 方法与架构

**滚动（循环）TSDF体积。** 该TSDF（体素数量为 $v_s$，物理尺寸为 $d$ 米，体素大小 $v_m = d/v_s$）不再固定锚定在起始位置。系统持续检查相机与体积原点之间的距离；当其超过移动阈值 $b$ 时，体积会被虚拟地平移以重新使相机居中。这个平移被量化为整数个体素：给定相机平移 $\mathbf{t}_{i+1}$，

$$\mathbf{u} = \left\lfloor \frac{\mathbf{t}_{i+1}}{v_m} \right\rfloor, \qquad \mathbf{t}'_{i+1} = \mathbf{t}_{i+1} - v_m \mathbf{u}, \qquad \mathbf{g}_{i+1} = \mathbf{g}_i + \mathbf{u}$$

其中 $\mathbf{t}'_{i+1}$ 是相机在体积内的新位置，$\mathbf{g}_i$ 以体素单位跟踪该体积的全局位置。内存中不需要移动任何体素：这个三维数组被当作**循环的（cyclical）**，查找方式被重新映射为 $x' = (x + g_i^x) \bmod v_s$（$y, z$同理），因此重新居中只需更新基准索引偏移量。

**切片提取与网格化。** 离开体积的那一层体素沿每个轴正交地被光线投射，以提取零交叉顶点，再用体素网格滤波器（叶尺寸为 $v_m$）去重，清零以便复用,并流式传输到CPU。每次跨越边界都会向位姿图添加一个元素 $Q_n = (\mathbf{g}_i, \mathbf{t}'_i, R_i, M_i)$，存储该位姿及其对应的表面切片 $M_i$；这些切片（以2体素重叠方式提取）供一种贪心三角化算法使用，生成一个仅受系统内存限制的无缝网格。

**多线程架构。** 一种层次化设计使GPU前端不被阻塞：TSDF跟踪/融合线程通知一个CloudSliceProcessor线程（负责变换和降采样），后者再通知一组ComponentThreads（网格生成、地点识别，等等），因此地图的后处理永远不会拖慢30 Hz的跟踪速度。

**里程计替代方案与回环检测。** 为了在几何退化的场景中生存下来，ICP里程计可以替换为基于特征的FOVIS视觉里程计——用局部网格平滑度换取在走廊中的鲁棒性。对于回环检测，论文将带有SURF描述子的DBoW地点识别作为一个ComponentThread集成进来，通过所存储的 $\mathbf{t}'$ 向量把检测到的位姿约束传播回TSDF虚拟坐标系,并试验了iSAM位姿图优化——结果发现，在位姿更新的同时还需要进行**网格形变（mesh deformation）**。成熟的Kintinuous系列正是通过一个嵌入式形变图实现了这一点，将每个网格顶点随其邻近的图节点一起移动：$\tilde{\mathbf{v}}_i = R_k(\mathbf{v}_i - \mathbf{g}_k) + \mathbf{g}_k + \mathbf{t}_k$，因此稠密地图会弯曲以恢复一致性，而不是被重新构建。

## 实验结果

在一台配备Intel i7-2600（3.4 GHz）、8 GB内存以及GTX 560 Ti（2 GB）的桌面机上，取 $v_s = 512$，用15 FPS的手持/车载Kinect采集，实时地对四个数据集进行了建图：一个研究实验室（LAB，31.07米的位姿间里程计，6米体积）、一栋公寓的两层（APT，42.31米）、一处夜间从车上拍摄的郊区住宅小区（CAR，136.18米，20米体积，81.6 x 22.8 x 81.5米的边界立方体），以及一条笔直的走廊（CORR，56.08米，使用FOVIS）。最终网格达到150万到310万个三角形（63-118 MB）。TSDF更新耗时33.8-41.3毫秒，表明前端能够维持Kinect完整的30 FPS，且不受地图增长的影响；CloudSliceProcessor每个切片仅增加2.6-4.7毫秒的耗时，网格生成平均也能跟上节奏。FOVIS里程计耗时14.71 +/- 4.39毫秒,相比之下CUDA ICP为10.54 +/- 0.21毫秒——更慢但仍是实时的,并以局部网格平滑度为代价降低了走廊中的漂移（frame-to-frame相对于frame-to-model）。

## 对SLAM的意义

Kintinuous是第一个把稠密体积化融合从单一固定体积带出来、扩展到走廊、公寓和街道中的系统,证明了稠密RGB-D SLAM可以成为一种真正的大规模建图工具,而不只是桌面扫描演示。它的循环缓冲滚动体积方案被后续系统采纳并加以改进（InfiniTAM的体素哈希用不同方式解决了同样的可扩展性问题），而它对回环检测的探索——位姿图加网格形变——则成为了ElasticFusion（由同一位第一作者主导的直接后继系统）的核心机制。

## 相关条目

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [InfiniTAM v3](infinitam-v3.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
