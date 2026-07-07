# TSDF与Surfel地图对比

稠密RGB-D SLAM需要一种地图表示方式,能够将带噪声的深度帧融合成干净的表面。目前有两大主流方案,分别以KinectFusion和ElasticFusion为代表。

## TSDF:融合进体素网格

**TSDF(截断符号距离函数)**是一种体积表示方法:空间被划分为体素,每个体素存储到最近表面的符号距离(截断在其周围的一个窄带内),外加一个融合权重。每一帧新的深度图像首先被转换为逐体素的距离观测值:将体素中心$\mathbf{x}$投影到深度图像中,并将测得的深度与该体素沿相机射线方向的距离进行比较,

$$f_t(\mathbf{x}) = \Psi\!\left(\frac{d_t\big(\pi(\mathbf{K}\,\mathbf{T}_t^{-1}\mathbf{x})\big) - \|\mathbf{x} - \mathbf{t}_t\|/\lambda}{\mu}\right), \qquad \Psi(\eta) = \min(1, \max(-1, \eta)),$$

其中$\mu$为截断距离,$\Psi$将数值截断到$[-1, 1]$区间内。这些观测值通过逐体素的加权移动平均进行融合:

$$F(\mathbf{x}) \leftarrow \frac{W(\mathbf{x})\,F(\mathbf{x}) + w\,f_{\text{new}}(\mathbf{x})}{W(\mathbf{x}) + w}, \qquad W(\mathbf{x}) \leftarrow W(\mathbf{x}) + w$$

表面即为$F$的零交叉点,通过射线投射或Marching Cubes算法提取。融合过程天然可并行(非常适合GPU),而平均操作能够抵消传感器噪声,从而生成光滑且水密的表面。其代价在于:内存消耗随体积而非表面面积增长——KinectFusion固定的体素网格(例如以2-3毫米分辨率的$512^3$体素)只能覆盖几立方米的空间,这正是体素哈希与八叉树被发明出来以缓解该问题的原因——分辨率由体素大小固定,而修正过去的位姿代价高昂:必须对体积进行反融合与重新融合(BundleFusion),或者对其进行整体平移(Kintinuous)。

## Surfel:融合进表面基元

**Surfel地图**是基于点的表示方法:场景由一组surfel——即盘状表面元素——构成

$$\mathcal{M} = \{(\mathbf{p}_i, \mathbf{n}_i, r_i, \mathbf{c}_i, w_i, t_i)\}$$

每个surfel携带位置、法向、半径、颜色、置信权重与时间戳。新的测量值既可以更新一个已存在的邻近surfel(对其属性进行加权平均),也可以生成一个新的surfel。内存消耗随观测到的表面面积而增长,分辨率会根据测量密度自适应调整,而且由于surfel是相互独立的基元,地图可以被*变形*:ElasticFusion在回环检测时对surfel点云应用一种非刚性变形图(类似嵌入式变形的思路),而不是维护一个位姿图。其代价在于:不会自动生成连通的网格,基于渲染的模型预测是跟踪所必需的,而且变形操作可能会模糊精细的表面细节。

## 两者对比

| | TSDF(KinectFusion) | Surfel(ElasticFusion) |
|---|---|---|
| 结构 | 覆盖空间的体素网格 | 表面上的非结构化点集 |
| 融合 | 逐体素的移动平均 | 逐surfel的属性更新 |
| 表面提取 | 零交叉点(射线投射/Marching Cubes) | 溅射渲染(splat rendering) |
| 内存 | 随体积增长(需要哈希/八叉树) | 随表面面积增长 |
| 回环修正 | 反融合/重新融合,或体积平移 | 非刚性地图变形 |
| 输出质量 | 光滑、水密的网格 | 自适应、可变形,无网格 |

## 实践中的选择与陷阱

两者各有优劣:BAD SLAM在一个直接的光束法平差中将surfel与位姿联合优化,而BundleFusion则表明TSDF可以通过重新融合保持全局一致性。以下是一些经验法则与常见陷阱:

- **截断距离$\mu$是一个真正的权衡**:太小则传感器噪声会使表面消失或出现重复;太大则邻近的表面(薄墙、从两侧观察到的桌面)会在截断带内相互干扰。
- **薄结构是TSDF的盲区**:比几个体素还薄的几何结构无法被表示——两侧的平均操作会将其抹除。由于surfel直接位于表面*之上*,它们能更好地处理薄结构。
- **体素大小与内存的关系是三次方的**:将体素大小减半,受影响区域的内存开销就会增加8倍;体素哈希之所以能提供帮助,是因为大部分空间是空的。
- **Surfel需要良好的法向估计**:每次surfel更新都依赖于从带噪声深度数据中估计出的法向;法向估计不佳会产生错位的圆盘和模糊的表面,而选择surfel半径(取决于深度与观测角度)的重要性也常常被低估。
- **从第一天起就要规划回环检测方案**:所选的地图表示决定了修正机制——反融合/重新融合需要保留每帧深度数据以撤销先前的融合操作,而地图变形则是用一定程度的局部模糊换取全局一致性。将其中任何一种机制事后补充到一个假设位姿永不改变的系统中都会非常痛苦。

后来出现的神经表示方法(神经场、三维高斯)最好理解为这两种理念的延伸——隐式体积表示与显式基元表示之分。

## 对SLAM的意义

地图表示方式几乎决定了稠密SLAM系统下游的一切:跟踪预测如何生成,内存如何随场景规模扩展,以及最关键的——当回环检测揭示出累积漂移时,系统如何修正地图。"带重新融合的TSDF,还是带变形的surfel"是RGB-D SLAM的根本设计分岔点,认清这一点能让你迅速判断任何一个稠密系统在整体图景中的位置。

## 动手实践

- [运行Voxblox(TSDF建图)](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/voxblox)
- [运行nvblox(GPU TSDF)](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/nvblox)

## 相关条目

- [KinectFusion](kinectfusion.md) —— 典型的TSDF融合系统
- [ElasticFusion](elasticfusion.md) —— 典型的surfel融合系统
- [BundleFusion](bundlefusion.md) —— 通过反融合/重新融合保持一致性的TSDF系统
- [BAD SLAM](bad-slam.md) —— 在surfel地图上进行直接光束法平差的系统
- [帧到模型的跟踪](frame-to-model-tracking.md) —— 这些地图如何被用于跟踪
