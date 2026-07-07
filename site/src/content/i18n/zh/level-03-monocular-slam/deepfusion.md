# DeepFusion

> Laidlow 2019 · [论文](https://arxiv.org/abs/2207.12244)

**一句话总结** — 一种稠密单目重建系统，以概率方式将来自SLAM系统的半稠密多视图立体深度与CNN预测的对数深度及对数深度梯度进行融合，并按学习到的不确定性对二者加权。

## 问题

基于特征点的单目SLAM地图对相机跟踪来说已经足够，但对许多机器人任务而言过于稀疏；深度相机则"在测量范围和室内场景方面都受到限制"；而通过最小化帧间光度误差来进行稠密重建，"通常约束性很差，并且存在尺度模糊的问题"。DeepFusion正是针对这一空白：通过将CNN预测视为另一种（带不确定性的）测量源，从RGB图像和单目SLAM系统的尺度模糊位姿中，实时地在GPU上生成完全稠密、具有度量尺度的关键帧深度图。

## 方法与架构

DeepFusion将几何结构表示为一系列关键帧深度图。每个新帧从ORB-SLAM2获得位姿；随后一个半稠密多视图立体模块通过沿极线搜索、在五个点上最小化SSD光度误差，来更新活动关键帧中高纹理像素的深度，并通过有限差分雅可比矩阵得到逐像素不确定性 $\sigma_i^2=(\mathbf{J}^T\mathbf{J})^{-1}$。当相机平移超过 $\lambda_{trans}$，或半稠密估计的内点数少于 $\lambda_{inliers}$ 时，就会创建新的关键帧。

对每个关键帧，一个U-Net风格的CNN（共享编码器、四个解码器、256×192分辨率，在SceneNet RGB-D上训练）会预测对数深度、x和y方向的对数深度梯度，以及各自对应的不确定性，使用如下最大似然损失：

$$\mathcal{L}_{\mathrm{NN}}(\theta)=\sum_{i}\frac{(y_{i}-f_{\theta,i}(\mathbf{x}))^{2}}{\sigma_{\theta,i}(\mathbf{x})^{2}}+\log(\sigma_{\theta,i}(\mathbf{x})^{2}),$$

其中 $f_{\theta,i}$ 和 $\sigma_{\theta,i}^2$ 分别是像素 $i$ 的预测均值和方差。使用对数深度是因为两个对数深度之差就是一个深度比值，具有尺度不变性；训练时预测值按焦距进行归一化，测试时再按测试相机的焦距重新缩放。

每来一个新帧，关键帧的稠密对数深度图 $\mathbf{d}$ 和一个尺度校正因子 $s$ 都会通过最小化以下目标进行重新优化：

$$c(\mathbf{d},s)=c_{\mathrm{semi}}(\mathbf{d},s)+c_{\mathrm{net}}(\mathbf{d})+c_{\mathrm{grad}}(\mathbf{d}),$$

即三个带不确定性加权的二次项（每一项都用Huber损失做鲁棒化处理）：

- **半稠密项（单目项，尺度模糊）：** $r_{\mathrm{semi},i}=\ln\mathbf{d}_{i}-\ln s-\ln\mathbf{d}_{\mathrm{semi},i}$，以立体搜索得到的 $\sigma_i^{2}$ 加权。
- **网络深度项（单目项，度量尺度）：** $r_{\mathrm{net},i}=\ln\mathbf{d}_{i}-\ln\mathbf{d}_{\mathrm{net},i}$，以预测的深度方差加权——这是一个关于绝对尺度的弱先验，使得 $s$ 变得可观测。
- **网络梯度项（成对项）：** $r_{\mathrm{grad,x},i}=\ln\mathbf{d}_{i+1}-\ln\mathbf{d}_{i}-\mathbf{g}_{\mathrm{x},i}$ 以及 $r_{\mathrm{grad,y},i}=\ln\mathbf{d}_{i+W}-\ln\mathbf{d}_{i}-\mathbf{g}_{\mathrm{y},i}$（$W$为图像宽度），将相邻像素连接起来，使稀疏的几何测量能够传播到无纹理区域，从而保持地图的全局一致性。

系统在每帧上运行10次高斯-牛顿迭代（交替优化深度和尺度），作为由Opt框架编译的GPU核函数运行，因此代价高昂的网络前向计算每个关键帧只需分摊一次，而几何结构则持续得到细化。

## 实验结果

按照CNN-SLAM的评测协议——在ICL-NUIM（合成数据集）和TUM RGB-D（真实数据集）上，统计估计深度落在真值10%以内的百分比——DeepFusion平均得分为22.466，而CNN-SLAM为22.464，LSD-SLAM（自举初始化）为3.032，REMODE为7.649，Laina等人的方法为18.452，ORB-SLAM为0.029。在ICL-NUIM的六个序列中，DeepFusion在四个上表现最好（例如office1序列：37.420 对比 CNN-SLAM的29.150），而CNN-SLAM在TUM三个序列中的两个上胜出——这归因于训练数据的差异：DeepFusion使用的是SceneNet（合成数据），而CNN-SLAM使用的是Kinect采集的NYUv2。消融实验表明，完整方法在九个序列中的七个上优于最小二乘尺度对齐方法，成对梯度约束在九个序列中的七个上有帮助。计时结果（i7-5820K + GTX 980）：半稠密更新16毫秒，优化33毫秒，网络推理平均45毫秒——配合逐关键帧推理，可实现实时运行。

## 对SLAM的意义

DeepFusion处于将经典多视图几何与学习到的单图像线索相结合、使单目稠密重建变得实用的一系列系统之中（CNN-SLAM、DVSO、D3VO）。它强调不确定性感知的融合——即在一个概率优化框架内，将网络深度*以及*深度梯度输出都视为带有学习置信度的带噪测量，而非视为真值——这一思想成为后续"学习+几何"稠密SLAM系统中反复出现的设计原则。

## 相关条目

- [CNN-SLAM](cnn-slam.md)
- [LSD-SLAM](lsd-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [CodeSLAM](../level-05-deep-learning/codeslam.md)
