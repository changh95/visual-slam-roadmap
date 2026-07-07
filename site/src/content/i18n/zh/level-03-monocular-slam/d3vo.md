# D3VO

> Yang 2020 · [论文](https://arxiv.org/abs/2003.01060)

**一句话总结** — 将三种深度学习预测——深度、位姿和光度不确定性——整合进一个DSO风格的直接法VO框架中，在前端跟踪和后端光度光束法平差中都利用了学习到的先验。

## 问题

到2020年，人们已经清楚单一的学习量（深度，如CNN-SLAM和DVSO所做的那样）可以增强经典的单目VO，但纯几何的单目系统在精度和鲁棒性上仍落后于立体和视觉惯性流水线。D3VO（"Deep Depth, Deep Pose and Deep Uncertainty for Monocular Visual Odometry"）探讨的是：如果同时在*三个*层面上利用深度网络，并将其紧密整合进一个稀疏直接法里程计框架的跟踪前端和窗口化非线性优化后端，能在多大程度上缩小这一差距。

## 方法与架构

**自监督网络** — DepthNet从单张左目图像预测深度图 $D_t, D_{t^s}$ 和不确定性 $\Sigma_t$；PoseNet从拼接的图像对预测相对位姿 $\mathbf{T}_t^{t'}$ 以及仿射亮度参数 $a,b$（两者都是类UNet结构）。训练通过最小化对时间*与*静态立体变形 $I_{t'}\in\{I_{t-1},I_{t+1},I_{t^s}\}$ 的逐像素最小光度重投影误差，并有两处增补。首先，预测的**亮度变换**能实时对齐光照，$I_t^{a_{t'},b_{t'}}=a_{t\rightarrow t'}I_t+b_{t\rightarrow t'}$——这是DSO仿射亮度模型在学习阶段的对应物。其次，**异方差偶然不确定性**：损失通过一个预测的方差图进行衰减，

$$L_{self}=\frac{1}{|V|}\sum_{\mathbf{p}\in V}\frac{\min_{t'}\,r\big(I_t^{a_{t'},b_{t'}},\,I_{t'\rightarrow t}\big)}{\Sigma_t}+\log\Sigma_t$$

因此违反亮度恒常性假设的像素（非朗伯表面、运动物体、高频区域）会获得较高的 $\Sigma_t$，其中 $r$ 是常见的SSIM + $\ell_1$ 光度误差。

**里程计** — 采用类似DSO的窗口化稀疏光度光束法平差，在关键帧 $\mathcal{F}$ 和点 $\mathcal{P}_i$ 上最小化 $E_{photo}$，使用标准的仿射亮度Huber残差 $E_{\mathbf{p}j}$。D3VO在三个层面注入网络：

- *深度深度*：点深度按度量尺度初始化为 $d_{\mathbf{p}}=\widetilde{D}_i[\mathbf{p}]$，DVSO的虚拟立体项 $E_{\mathbf{p}}^{\dagger}=w_{\mathbf{p}}\lVert I_i^{\dagger}[\mathbf{p}^{\dagger}]-I_i[\mathbf{p}]\rVert_{\gamma}$ 保持优化后的深度与预测一致：$E_{photo}=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_i}\big(\lambda E_{\mathbf{p}}^{\dagger}+\sum_{j\in\mathrm{obs}(\mathbf{p})}E_{\mathbf{p}j}\big)$。
- *深度不确定性*：DSO基于经验梯度的残差权重被替换为学习得到的不确定性图，

$$w_{\mathbf{p}}=\frac{\alpha^2}{\alpha^2+\lVert\widetilde{\Sigma}(\mathbf{p})\rVert_2^2}$$

  从而降低反射、运动物体和深度不连续边界处的权重。
- *深度位姿*：PoseNet的预测取代恒速模型来初始化前端直接图像对齐（通过对当前帧和上一帧的一个小型因子图实现），并作为连续关键帧之间的相对位姿先验进入后端，

$$E_{pose}=\sum_{i\in\mathcal{F}}\mathrm{Log}\big(\widetilde{\mathbf{T}}_{i-1}^{i}\,\mathbf{T}_{i}^{i-1}\big)^{\top}\,\Sigma_{\tilde{\xi}}^{-1}\,\mathrm{Log}\big(\widetilde{\mathbf{T}}_{i-1}^{i}\,\mathbf{T}_{i}^{i-1}\big),\qquad E_{total}=E_{photo}+w\,E_{pose}$$

这类似于IMU预积分先验的作用——但仅靠一个相机就能实现。$E_{total}$ 用高斯-牛顿法最小化。

## 实验结果

**深度**：在KITTI Eigen划分上，完整网络达到RMSE **4.485**，而在相同立体+单目自监督条件下Monodepth2为4.750，接近需要稀疏深度监督的DVSO（4.442）；在EuRoC V2_01上，其RMSE为0.337，Monodepth2为0.370，亮度变换贡献了大部分增益。**里程计（KITTI）**：在测试划分（01、02、06、08、09、10）上，平均 $t_{rel}$ 为**0.82%**，而Stereo DSO为0.89、立体ORB-SLAM2为0.91、单目DSO为65.8；在序列09/10上D3VO达到0.78/0.62，而DVSO为0.83/0.74，远优于所有端到端方法。**EuRoC MAV**：在5个测试序列上平均RMSE ATE为**0.10 m**——优于VI-DSO（0.11）、VINS-Mono（0.18）、OKVIS（0.28）、ROVIO（0.24）、MSCKF（0.25），尽管未使用IMU，且与使用立体惯性的Basalt（在4个序列子集上为0.08）相当。消融实验表明，深度位姿正是拯救剧烈运动序列V1_03和V2_03的关键因素（分别从0.63→0.13和0.52→0.19，使用Dd+Dp）。

## 对SLAM的意义

D3VO是"在直接法VO后端中融入深度先验"这条研究路线（CNN-SLAM → DVSO → D3VO）的集大成之作：每一步都在经典流水线中融入了更多学习量。仅用一个被动相机就能匹敌立体和视觉惯性系统，是迄今为止证明学习先验可以替代额外传感器的最有力证据，而其学习到的不确定性加权残差和"网络位姿即IMU先验"的设计，在后续的混合系统中成为了具有影响力的模式。

## 相关条目

- [DSO](dso.md)
- [DVSO](dvso.md)
- [CNN-SLAM](cnn-slam.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Self-supervised depth](self-supervised-depth.md)
