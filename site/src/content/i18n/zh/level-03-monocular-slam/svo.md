# SVO

> Forster 2014 · [论文](https://ieeexplore.ieee.org/document/6906584)

**一句话总结** — 一种半直接视觉里程计方法，仅在关键帧上检测 FAST 角点，但通过对小图块进行直接光度对齐来跟踪运动，速度可达每秒数百帧。

## 问题

基于特征的流水线（PTAM 及其为 MAV 改进的变体）将大部分逐帧计算预算都花在特征提取和鲁棒匹配上，而稠密直接法（DTAM）则需要 GPU。微型飞行器需要在小型机载计算机上以极高频率和低延迟获得精确的位姿估计，而这两个阵营都无法满足这一预算限制。SVO（《SVO: Fast Semi-Direct Monocular Visual Odometry》，ICRA 2014）通过直接在像素灰度值上操作，消除了"用于运动估计的昂贵特征提取和鲁棒匹配技术"，并将其与一种显式建模异常值的概率化建图方法相配合。

## 方法与架构

与 PTAM 一样采用两个并行线程：**运动估计**和**建图**。特征提取只在选定关键帧时进行；逐帧运动估计不依赖描述子，分三步进行。

**1. 基于稀疏模型的图像对齐**——通过对已知深度 $d_{\mathbf{u}}$ 的特征周围 4×4 像素图块进行直接对齐，得到帧到帧的位姿：

$$\mathbf{T}_{k,k-1}=\arg\min_{\mathbf{T}}\frac{1}{2}\sum_{i\in\bar{\mathcal{R}}}\lVert\delta I(\mathbf{T},\mathbf{u}_i)\rVert^2,\qquad \delta I(\mathbf{T},\mathbf{u})=I_k\big(\pi(\mathbf{T}\cdot\pi^{-1}(\mathbf{u},d_{\mathbf{u}}))\big)-I_{k-1}(\mathbf{u})$$

采用高斯-牛顿法结合逆合成（inverse compositional）方法求解（雅可比矩阵恒定且可预先计算），并在 5 层金字塔上由粗到精求解。此步骤隐式满足极线约束，并产生不含异常值的对应关系。

**2. 特征对齐（松弛）**——将每个图块的 2D 位置单独针对观测角度最接近的*关键帧*进行精化，使用 8×8 图块加仿射变形 $\mathbf{A}_i$，并采用逆合成 Lucas-Kanade 方法：

$$\mathbf{u}_i'=\arg\min_{\mathbf{u}_i'}\frac{1}{2}\lVert I_k(\mathbf{u}_i')-\mathbf{A}_i\cdot I_r(\mathbf{u}_i)\rVert^2$$

这一步刻意违反了极线约束，以换取亚像素级的对应关系，并将测量重新锚定到地图上，从而打破帧到帧的漂移累积链。

**3. 位姿与结构精化**——在第 2 步中产生的重投影残差（平均约 0.3 像素）通过仅优化运动的 BA 来最小化，$\mathbf{T}_{k,w}=\arg\min_{\mathbf{T}}\frac{1}{2}\sum_i\lVert\mathbf{u}_i-\pi(\mathbf{T}_{k,w}\,{}_w\mathbf{p}_i)\rVert^2$，随后进行仅优化结构的 BA；在追求速度的配置下会跳过可选的局部 BA。

**建图**——对每个新特征（每 30×30 网格中 Shi-Tomasi 得分最高的 FAST 角点）维护一个递归贝叶斯深度滤波器，初始化为场景平均深度并带有较大的不确定性。每一新帧都通过沿极线的最佳匹配为其贡献一个三角化深度 $\tilde{d}_i^k$，建模为高斯+均匀分布的内点/外点混合模型：

$$p(\tilde{d}_i^k\mid d_i,\rho_i)=\rho_i\,\mathcal{N}\big(\tilde{d}_i^k\mid d_i,\tau_i^2\big)+(1-\rho_i)\,U\big(\tilde{d}_i^k\mid d_i^{min},d_i^{max}\big)$$

其中 $\rho_i$ 为内点概率，$\tau_i^2$ 为几何方差（假设一像素视差）,以逆深度参数化。一个 3D 点只有在滤波器收敛之后才会进入地图，从结构上就杜绝了异常值。当到所有关键帧的距离都超过平均场景深度的 12% 时，就会选定新的关键帧。

## 实验结果

在一段带有动作捕捉真值的 84 米 MAV 轨迹上，SVO 的相对位姿误差为 **0.0059 m/s**（快速配置）和 0.0051 m/s（精确配置），相比之下 Weiss 等人针对 MAV 调优的 PTAM 为 0.0164 m/s，且轨迹更平滑、3D 异常点也远少于 PTAM。运行时间：在笔记本电脑（Intel i7，超过 300 fps；加上局部 BA 为 6 毫秒）上为**每帧 3.04 毫秒**，在机载 Odroid-U2 ARM 计算机上为**18.17 毫秒**（55 fps）；相比之下 PTAM 分别为 91 fps 和 27 fps——在快速配置下最多只使用 2 个 CPU 核心，且只跟踪 120 个特征。深度滤波器使 SVO 能够在重复的高频纹理场景（沥青路面、草地）中可靠跟踪，而这类场景会让 PTAM 产生大量异常点。已作为开源发布。

## 对SLAM的意义

SVO 证明了去掉逐帧特征提取和描述子匹配可以实现极低延迟、亚像素精度的里程计，使其多年来一直是微型飞行器和嵌入式平台的首选估计器。它定义了介于基于特征方法（PTAM、ORB-SLAM）和直接法（LSD-SLAM、DSO）之间的"半直接"类别，其高斯+均匀分布深度滤波器（源自 Vogiatzis 和 Hernández 的工作，REMODE 中也有使用）被许多后续系统所复用。SVO2 将这一方案扩展到多相机装配、鱼眼/折反射镜头、边缘元（edgelets）以及运动先验。

## 相关条目

- [PTAM](ptam.md)
- [SVO2](svo2.md)
- [DSO](dso.md)
- [LSD-SLAM](lsd-slam.md)
- [视觉里程计](visual-odometry.md)
