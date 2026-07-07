# BAD SLAM

> Schöps 2019 · [论文](https://openaccess.thecvf.com/content_CVPR_2019/html/Schops_BAD_SLAM_Bundle_Adjusted_Direct_RGB-D_SLAM_CVPR_2019_paper.html)

**一句话总结** — 一种直接光束法平差的RGB-D SLAM，在GPU上实时联合优化关键帧位姿和稠密面元（surfel）地图，同时发布了高精度的ETH3D SLAM基准。

## 问题

光束法平差——对所有相机和结构参数进行联合优化——是SLAM后端的黄金标准，但对于稠密RGB-D数据而言，变量数量一直被认为过于庞大：此前的系统用位姿图优化、地图形变（Kintinuous、ElasticFusion）、片段对齐或稀疏特征BA（BundleFusion、ORB-SLAM2）来对其进行近似。第二个问题是评估：直接RGB-D系统对滚动快门、RGB/深度流不同步以及深度标定误差高度敏感，而现有的、用消费级相机录制的基准将这些硬件伪影与算法精度混为一谈。

## 方法与架构

前端使用标准的直接光度+几何对齐在 $SE(3)$ 上跟踪每一帧相对最近一个关键帧的位姿（每10帧成为一个关键帧），并用二值特征词袋检测回环，随后进行直接对齐和位姿图初始化。后端——本文的贡献所在——对所有关键帧 $K$ 和面元 $S$ 运行真正的直接BA。一个面元 $s$ 是一个带有中心 $\mathbf{p}_s$、法向量 $\mathbf{n}_s$、半径 $r_s$ 和标量描述子 $d_s$ 的定向圆盘；地图中不存在任何稀疏特征。代价函数将每个面元投影到其存在对应关系的每个关键帧 $k$ 中：

$$C(K,S)=\sum_{k\in K}\sum_{s\in S_k}\Big[\rho_{\text{Tukey}}\big(\sigma_D^{-1}\,r_{\text{geom}}(s,k)\big)+w_{\text{photo}}\,\rho_{\text{Huber}}\big(\sigma_p^{-1}\,r_{\text{photo}}(s,k)\big)\Big]$$

其中 $w_{\text{photo}}=10^{-2}$（深度更受信任），鲁棒损失参数为10。几何项是沿面元法向的点到平面残差：

$$r_{\text{geom}}(s,k)=\big(\mathbf{T}_{kG}\,\mathbf{n}_s\big)^{T}\Big(\pi_{D,k}^{-1}\big(\hat{\pi}_{D,k}(\mathbf{T}_{kG}\,\mathbf{p}_s)\big)-\mathbf{T}_{kG}\,\mathbf{p}_s\Big)$$

其中 $\mathbf{T}_{kG}$ 将全局坐标映射到关键帧坐标，$\hat{\pi}_{D,k}$ 投影到最近的深度像素，$\pi_{D,k}^{-1}$ 则将其测得的深度反投影回去。该项通过一个立体深度噪声模型 $\sigma_{d_m}=\delta\,d_m^2\,(bf)^{-1}$ 进行归一化（$b$为基线，$f$为焦距，$\delta=0.1$像素匹配误差）。光度项将一个几何一致的强度梯度幅值——在面元中心以及圆盘边界上的两个点 $\mathbf{s}_1,\mathbf{s}_2$ 处采样——与存储的描述子进行比较：

$$r_{\text{photo}}(s,k)=\left\lVert\begin{pmatrix}I(\pi_{I,k}(\mathbf{s}_1))-I(\pi_{I,k}(\mathbf{p}_s))\\ I(\pi_{I,k}(\mathbf{s}_2))-I(\pi_{I,k}(\mathbf{p}_s))\end{pmatrix}\right\rVert_2-\,d_s$$

优化不是求解一个巨大的系统，而是交替进行：每次迭代中，(1) 通过平均对应观测的法向量来更新面元法向；(2) 通过高斯-牛顿法联合优化每个面元的位置和描述子——位置只沿法向移动（$\mathbf{p}_s+t\,\mathbf{n}_s$），因此每个面元都是一个独立的2×2求解，这也避免了无纹理区域中病态的漂移问题；(3) 合并相似的面元；(4) 用 $\mathfrak{se}(3)$ 局部更新 $\mathbf{T}_{kG}\exp(\hat{\epsilon})$ 优化所有关键帧位姿；(5) 可选地优化内参以及一张逐像素深度形变图像（通过Schur补低成本求解）。离散的面元创建（每个未被覆盖的4×4像素单元创建一个）、外点删除和半径更新交替进行。所有内容均以CUDA实现；交替BA被证明比在完整高斯-牛顿系统上使用PCG求解器略快且效果更好。

## 实验结果

在TUM RGB-D上（ATE RMSE），BAD SLAM在fr1-desk / fr2-xyz / fr3-office上分别达到1.7 / 1.1 / 1.7 cm——平均排名第2（2.7），与BundleFusion并列，落后于ORB-SLAM2（排名1.0）；禁用其内参/深度形变优化后，这一结果退化为3.6 / 1.2 / 2.5 cm，显示出消费级相机标定误差的影响有多大。在TUM场景的合成重渲染数据上，BAD SLAM完全胜出（平均ATE，干净场景下为0.15 cm，而ORB-SLAM2为0.47 cm，BundleFusion为0.34 cm），加入滚动快门和异步RGB-D后，每种方法的性能都出现数倍下降——这正是催生新基准的动机。ETH3D SLAM基准（61个训练序列+35个测试序列，同步的全局快门主动立体相机，动作捕捉真值，在线排行榜且测试集真值不公开）颠覆了TUM上的排名：BAD SLAM在训练集和测试集上都显著优于ORB-SLAM2、BundleFusion、DVO SLAM和ElasticFusion，而"困难"序列（无纹理场景、快速运动、动态场景）则使所有被评估的方法都失败。该系统在i7-6700K + GTX 1080上实时运行（每个关键帧约370毫秒的BA预算，输入频率约27 Hz，每10帧一个关键帧；图1所示场景包含约335,000个面元）。

## 对SLAM的意义

BAD SLAM证明了关于光束法平差的精度论证——早已由Strasdat的"Why filter?"分析为稀疏SLAM所确立——同样适用于完全稠密的RGB-D SLAM：位姿与结构的联合优化消除了"先跟踪、后融合"这种解耦流程中的系统性偏差。同样持久的是它带来的评估教训：在标定不佳、存在滚动快门的基准上得到的结果可能颠倒方法的真实排名，其ETH3D基准也成为了RGB-D SLAM的标准评估套件。当跟踪与建图之间的不一致（而非传感器噪声）成为你精度瓶颈时，可以借鉴这里的思路。

## 相关条目

- [ElasticFusion](elasticfusion.md) — 采用解耦的帧到模型跟踪与地图形变的面元建图方法
- [BundleFusion](bundlefusion.md) — 通过稀疏特征BA和TSDF重新集成实现全局一致性
- [DVO](dvo.md) — 鲁棒的直接RGB-D对齐方法，稠密直接方法的先驱
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — 该系统背后的表示方式选择
- [DSO](../level-03-monocular-slam/dso.md) — 单目SLAM中对应的稀疏直接BA方法
