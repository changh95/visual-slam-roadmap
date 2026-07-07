# ORB-SLAM2

> Mur-Artal 2017 · [论文](https://arxiv.org/abs/1610.06475)

**一句话总结** — 将ORB-SLAM扩展到双目和RGB-D相机，提供一个统一的开源SLAM框架，具备度量尺度，并在所有三种传感器模态上均达到当时最先进的精度。

## 问题

ORB-SLAM只支持单目：单个相机无法观测深度，因此地图和轨迹的尺度未知，系统初始化需要多视图初始化，还会遭受尺度漂移，并且在纯旋转下容易失败。双目和RGB-D相机可以解决所有这些问题，但现有的双目/RGB-D系统要么缺乏回环检测，要么为了常数时间运行而放弃全局一致性，要么依赖ICP或光度对齐。ORB-SLAM2（IEEE TRO 2017）将基于BA的框架进行了推广，使一个系统能"在标准CPU上实时运行于各种各样的环境中，从室内手持小场景序列，到工业环境中飞行的无人机以及在城市中行驶的汽车"。

## 方法与架构

三个并行线程——跟踪、局部建图、回环检测——加上第四个线程，在回环检测后运行全局BA。跟踪线程通过仅优化运动的BA将每一帧定位到局部地图中；局部建图线程在共视窗口上运行局部BA；回环检测线程用DBoW2检测回环，并通过在共视图/生成树上进行位姿图优化来纠正漂移，随后运行全局BA，其结果通过生成树传播关键帧修正量的方式合并回系统。

- **输入预处理**：图像一次性简化为ORB特征点；系统的其余部分与传感器无关。双目关键点为 $\mathbf{x}_{\mathrm{s}}=(u_L,v_L,u_R)$，来自极线行匹配；对于RGB-D，每个深度值 $d$ 都被转换为一个*虚拟右侧坐标* $u_R=u_L-\frac{f_x b}{d}$，其中 $f_x$ 是焦距，$b\approx 8$ 厘米是Kinect/Xtion的基线——因此RGB-D输入可以不加修改地搭载在双目流水线上。
- **近点/远点策略**：如果一个双目点的深度小于基线的40倍（该阈值来自Paz等人），则认为它是*近点*——可以安全地从单帧三角化，提供尺度、平移和旋转信息；*远点*只有在多视图支持下才被三角化，主要约束旋转。单目关键点（没有双目/深度匹配）也会参与贡献。
- **含单目+双目约束的BA**（g2o，Levenberg–Marquardt）：仅优化运动的BA求解

$$\{\mathbf{R},\mathbf{t}\}=\operatorname*{argmin}_{\mathbf{R},\mathbf{t}}\sum_{i\in\mathcal{X}}\rho\left(\left\|\mathbf{x}^{i}_{(\cdot)}-\pi_{(\cdot)}\left(\mathbf{R}\mathbf{X}^{i}+\mathbf{t}\right)\right\|^{2}_{\Sigma}\right)$$

  使用Huber代价函数 $\rho$、与关键点尺度相关的协方差 $\Sigma$，以及投影函数 $\pi_{\mathrm{m}}=\left(f_x\frac{X}{Z}+c_x,\ f_y\frac{Y}{Z}+c_y\right)$ 和双目投影函数 $\pi_{\mathrm{s}}$（在其上附加第三行 $f_x\frac{X-b}{Z}+c_x$）。局部BA优化共视关键帧集合 $\mathcal{K}_L$ 及其地图点 $\mathcal{P}_L$，同时固定边界关键帧 $\mathcal{K}_F$；全局BA除起始关键帧外，其余全部自由优化。
- **系统初始化与回环检测**：由于单帧就能获得深度，地图可以在第一个关键帧处初始化——不需要SfM初始化。尺度是可观测的，因此回环修正使用刚性 $SE(3)$ 位姿图优化，而非单目模式下所需的 $\mathrm{Sim}(3)$。
- **关键帧插入与定位模式**：新增了一个条件，当跟踪到的近点数量降到 $\tau_t=100$ 以下，但仍可以创建 $\tau_c=70$ 个新的近点时插入关键帧——这在以远点为主的场景（例如高速公路）中至关重要。一种轻量级的定位模式会关闭建图/回环检测，并结合视觉里程计匹配（会漂移，用于未建图区域）与地图点匹配（零漂移）。

## 实验结果

在29个公开序列上评估（每个序列运行5次，取中位数；Intel i7-4790）：

- **KITTI双目**（11个序列）：相对平移误差通常低于1%（例如00序列为0.70%，ATE为1.3米；05序列为0.40%，ATE为0.8米），在大多数序列上优于Stereo LSD-SLAM；高速公路序列01——单目ORB-SLAM在此完全失败——的误差为1.39%/10.4米，得益于长期跟踪的远点，旋转误差仅为0.21°/100米。
- **EuRoC双目**（11个MAV序列）：RMSE为几厘米，例如V1_01为0.035米，而Stereo LSD-SLAM为0.066米；V1_02为0.020米，而Stereo LSD-SLAM为0.074米；MH_03为0.028米；只有V2_03因严重运动模糊而跟踪丢失。
- **TUM RGB-D**：作为唯一基于BA的参与者，在大多数序列中优于ElasticFusion、Kintinuous、DVO-SLAM和RGBD-SLAM——fr2/xyz为0.004米，fr2/desk为0.009米，fr3/office为0.010米，fr1/desk为0.016米（相比ElasticFusion的0.020米、DVO-SLAM的0.021米）。
- **耗时**：在所有测试设置中，每帧平均跟踪时间均低于相机帧时间（例如30 Hz的TUM RGB-D为25.58毫秒，10 Hz的KITTI双目为49.47毫秒）——在标准CPU上实现实时运行。

## 对SLAM的意义

ORB-SLAM2将ORB-SLAM打造成一个覆盖单目、双目和RGB-D传感器的通用SLAM库，并在数年间一直是SLAM论文中占主导地位的精度基准；它的虚拟双目RGB-D技巧和近点/远点策略被广泛借鉴。它是从单目SLAM（第3级）通向双目SLAM（第7级）和RGB-D SLAM（第4级）的天然桥梁，也是ORB-SLAM3视觉惯性多地图系统的直接前身。

## 动手实践

- [运行ORB-SLAM2](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/orb_slam2)

## 相关条目

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM3](orb-slam3.md)
- [Scale ambiguity](scale-ambiguity.md)
- [OpenVSLAM](openvslam.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
- [Scale observability](../level-07-stereo-slam/scale-observability.md)
