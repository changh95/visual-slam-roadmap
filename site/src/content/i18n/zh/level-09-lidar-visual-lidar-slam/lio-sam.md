# LIO-SAM

> Shan 2020 · [论文](https://arxiv.org/abs/2007.00258)

**一句话总结** —— LIO-SAM将LiDAR-惯性里程计重新表述为因子图平滑问题,使IMU预积分、扫描匹配、GPS和回环检测都能进入同一个MAP估计问题——同时通过只将关键帧与一个局部滑动窗口地图匹配来保持实时性。

## 问题

LOAM将其数据保存在一个全局体素地图中,这使得执行回环检测或纳入GPS等绝对测量变得困难;它的IMU仅用于对扫描去畸变和给出运动先验(松耦合),并且随着体素地图不断变稠密,其优化性能会下降。像LIOM这样的紧耦合替代方案会联合处理所有测量,但运行速度只有约0.6倍实时速度。LIO-SAM同时针对这两个问题:因子图可以将异构的相对测量和绝对测量都作为因子接受,而在*局部*而非全局尺度上进行扫描匹配,能让计算量保持在可控范围内。

## 方法与架构

机器人状态为 $\mathbf{x} = [\,\mathbf{R}^{\top}, \mathbf{p}^{\top}, \mathbf{v}^{\top}, \mathbf{b}^{\top}\,]^{\top}$(姿态、位置、速度、IMU偏置)。当位姿变化超过阈值时,会添加一个新的状态节点,图会用iSAM2在以下四种因子类型下进行增量优化:

- **IMU预积分因子**:在时间 $i$ 和 $j$ 之间,原始IMU角速率和加速度被积分为相对运动约束

  $$\Delta\mathbf{v}_{ij} = \mathbf{R}_i^{\top}(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\Delta t_{ij}), \quad \Delta\mathbf{p}_{ij} = \mathbf{R}_i^{\top}\left(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\Delta t_{ij}^2\right), \quad \Delta\mathbf{R}_{ij} = \mathbf{R}_i^{\top}\mathbf{R}_j.$$

  预积分承担双重任务:它对点云进行去畸变并初始化扫描匹配;而优化后的LiDAR里程计又反过来在图中估计IMU偏置。
- **LiDAR里程计因子**:每次扫描按局部粗糙度提取LOAM风格的边缘和平面特征。当位姿变化超过1米或10度时选取关键帧;介于其间的帧被丢弃。新的关键帧不与全局地图配准,而是与由最近 $n = 25$ 个子关键帧合并而成的体素地图配准(边缘地图以0.2米下采样,平面地图以0.4米下采样)。点到线和点到面的距离,例如对于一个边缘特征

  $$\mathbf{d}_{e_k} = \frac{\left|(\mathbf{p}^{e}_{i+1,k}-\mathbf{p}^{e}_{i,u}) \times (\mathbf{p}^{e}_{i+1,k}-\mathbf{p}^{e}_{i,v})\right|}{\left|\mathbf{p}^{e}_{i,u}-\mathbf{p}^{e}_{i,v}\right|},$$

  通过高斯-牛顿法在 $\mathbf{T}_{i+1}$ 上最小化,$\min_{\mathbf{T}_{i+1}} \{ \sum_k \mathbf{d}_{e_k} + \sum_k \mathbf{d}_{p_k} \}$,得到的相对变换 $\Delta\mathbf{T}_{i,i+1} = \mathbf{T}_i^{\top}\mathbf{T}_{i+1}$ 成为连接连续状态的因子。
- **GPS因子**:绝对位置被转换到局部笛卡尔坐标系中——由于LiDAR-惯性漂移增长缓慢——只有当估计位置的协方差超过GPS协方差时才会被加入,时间戳对齐通过线性插值完成。
- **回环因子**:一个朴素但有效的欧氏距离搜索,在新状态15米范围内寻找先前状态;新的关键帧会与候选状态周围的 $2m+1$ 个子关键帧($m = 12$)进行扫描匹配。回环在纠正高度漂移方面尤其有价值,因为在作者的测试中,GPS的高程误差曾接近100米。

## 实验结果

在五个自采集数据集(Rotation、Walking、Campus、Park、Amsterdam)上,跨越三种平台——手持设备、Clearpath Jackal无人地面车、以及Duffy 21电动船——使用VLP-16、MicroStrain 3DM-GX5-25 IMU和Reach M GPS,在i7-10710U CPU上(无GPU)进行评测:

- **端到端平移误差(米)**:Campus(1437米):LOAM 192.43,LIO-odom(无GPS/回环)9.44,LIO-GPS 6.87,LIO-SAM **0.12**。Park(2898米):LOAM 121.74,LIOM 34.60,LIO-GPS 2.93,LIO-SAM **0.04**。Amsterdam(19065米,3小时运河巡航):只有LIO-GPS(1.21)和LIO-SAM(**0.17**)给出了有意义的结果。
- **相对GPS真值的RMSE(Park)**:LIO-SAM 0.96米,对比LOAM 47.31米、LIOM 28.96米、LIO-odom 23.96米。
- **鲁棒性**:在Rotation测试中(静止不动时达到高达133.7度/秒),LIO-SAM在 $SO(3)$ 上精确配准,而LIOM则无法初始化;Walking数据集达到213.9度/秒。
- **运行时间**:每次扫描的建图时间,例如Walking:LIO-SAM 58.4毫秒,对比LOAM 253.6毫秒和LIOM 339.8毫秒;压力测试显示在高达13倍实时速度回放下仍能正确运行。LIOM的运行速度仅约为0.6倍实时速度。

## 对SLAM的意义

LIO-SAM为LiDAR所做的事,正是VINS-Mono和OKVIS为相机所做的事:它使得通过图优化实现的紧耦合惯性融合成为默认架构。它将各测量来源清晰地分离为因子,使其易于扩展——LVI-SAM在其之上添加了一整套视觉-惯性子系统——它仍然是衡量像FAST-LIO2这样基于滤波器的系统时所对照的标准因子图基线。当你需要开箱即用的回环检测、GPS融合和平滑后端时,请使用它。

## 相关条目

- [LOAM](loam.md) —— 特征提取和扫描匹配的基础
- [LVI-SAM](lvi-sam.md) —— 直接扩展至LiDAR-视觉-惯性融合
- [FAST-LIO2](fast-lio2.md) —— 与之竞争的直接法、基于滤波器的方法
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md) —— 关键的惯性机制
- [Factor graph](../level-02-getting-familiar/factor-graph.md) —— 后端的形式化框架
