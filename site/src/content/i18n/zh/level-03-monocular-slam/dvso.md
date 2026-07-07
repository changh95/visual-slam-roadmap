# DVSO

> Yang 2018 · [论文](https://arxiv.org/abs/1807.02570)

**一句话总结** — Deep Virtual Stereo Odometry 将CNN预测的视差作为"虚拟双目"观测量输入DSO,仅用单目相机就实现了双目级别的精度与尺度恢复。

## 问题

单纯依赖几何线索的单目VO"容易出现尺度漂移,且需要连续帧之间有足够的运动视差才能进行运动估计与三维重建。"双目相机可以解决这两个问题,但代价是硬件成本、标定需求以及基线约束。DVSO("Deep Virtual Stereo Odometry: Leveraging Deep Depth Prediction for Monocular Direct Sparse Odometry")提出的问题是:一个深度预测网络能否充当第二个相机——保留DSO的窗口化光度光束法平差,同时加入双目相机本可以提供的约束。

## 方法与架构

**StackNet** — 一个堆叠式视差网络:*SimpleNet*(源自DispNet的ResNet-50编码器-解码器,带跳跃连接和resize-convolution上采样)仅从左图像预测4个尺度上的左右视差图;*ResidualNet*(12个残差块)接收SimpleNet的输出、warp重建结果以及$\ell_1$重建误差$e_l$,学习加性残差:$\mathit{disp}_s=\mathit{disp}_{\mathit{simple},s}\oplus\mathit{disp}_{\mathit{res},s}$。训练是在双目图像对上进行的**半监督**训练,每个尺度的损失结合了自监督光度项、针对Stereo DSO稀疏重建结果的监督项(无需LiDAR)、左右一致性、二阶平滑性以及遮挡正则化。自监督项为

$$\mathcal{L}_{U}^{\mathit{left}}=\frac{1}{N}\sum_{x,y}\alpha\,\frac{1-\mathrm{SSIM}\big(I^{\mathit{left}},I^{\mathit{left}}_{\mathit{recons}}\big)}{2}+(1-\alpha)\big\lVert I^{\mathit{left}}-I^{\mathit{left}}_{\mathit{recons}}\big\rVert_1,\qquad \alpha=0.84$$

监督项则在稀疏像素集合$\Omega_{\mathit{DSO}}$上,对$\mathit{disp}^{\mathit{left}}-\mathit{disp}^{\mathit{left}}_{\mathit{DSO}}$使用反向Huber(berHu)范数$\beta_{\epsilon}$——把经典双目几何蒸馏进一个单目网络中。

**里程计** — DVSO以单目DSO的窗口化直接光束法平差为基础($N=7$个关键帧,通过Schur补进行边缘化),并以两种方式利用预测结果。(1)*初始化*:每个新点的逆深度由左视差设定,$d_{\mathbf{p}}=D^{L}(\mathbf{p})/(f_x b)$,给出稳定的、具有真实尺度的初始化;左右一致性检验失败的点$e_{lr}=|D^{L}(\mathbf{p})-D^{R}(\mathbf{p}')|>1$会被判定为可能的遮挡而剔除。(2)*虚拟双目项*:除了DSO的时间光度能量

$$E_{ij}^{\mathbf{p}}=\omega_{\mathbf{p}}\left\lVert (I_j[\tilde{\mathbf{p}}]-b_j)-\frac{e^{a_j}}{e^{a_i}}(I_i[\mathbf{p}]-b_i)\right\rVert_{\gamma}$$

(带有仿射亮度参数$a,b$、依赖梯度的权重$\omega_{\mathbf{p}}$、Huber范数$\lVert\cdot\rVert_{\gamma}$)之外,每个点还会针对由预测的右视差$D^R$合成的*虚拟*右图像计算一个残差:

$$E_i^{\dagger\mathbf{p}}=\omega_{\mathbf{p}}\left\lVert I_i^{\dagger}[\mathbf{p}^{\dagger}]-I_i[\mathbf{p}]\right\rVert_{\gamma},\qquad I_i^{\dagger}[\mathbf{p}^{\dagger}]=I_i\big[\mathbf{p}^{\dagger}-(D^{R}(\mathbf{p}^{\dagger}),0)^{\top}\big]$$

其中$\mathbf{p}^{\dagger}=\Pi_c(\Pi_c^{-1}(\mathbf{p},d_{\mathbf{p}})+\mathbf{t}_b)$通过已知的虚拟基线$\mathbf{t}_b$进行投影。总能量$E_{photo}=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_i}\big(\lambda E_i^{\dagger\mathbf{p}}+\sum_{j\in\mathrm{obs}(\mathbf{p})}E_{ij}^{\mathbf{p}}\big)$由Gauss-Newton最小化,因此三角化深度与预测深度在优化内部通过鲁棒范数相互权衡——右图像本身在运行时从未被真正使用。

## 实验结果

**深度(KITTI,Eigen split)**:StackNet达到RMSE **4.442 m**(0–80 m范围),在多数指标上超过自监督最优水平的Godard等人方法(4.935)以及使用LiDAR半监督的Kuznietsov等人方法(4.621);在1–50 m范围内得分为3.390,优于3.518/3.729。在512×256分辨率下推理耗时不到40 ms。**里程计(KITTI)**:单目DSO在00–10序列上的平均平移漂移($t_{rel}$)为65.6%;未做基线调优的DVSO达到1.06%,完整系统($in{,}vs{,}lr{,}tb$)达到**0.77% / 0.20°**,优于Stereo DSO(0.84/0.20)、不带回环检测的双目ORB-SLAM2(0.81/0.26)以及Stereo LSD-VO(1.14/0.40)——而这仅使用了一个相机。它在所有可比序列上也优于端到端方法(DeepVO、UnDeepVO、SfMLearner),而将StackNet替换为Godard的深度网络会使平均值降至1.51%,证实了深度网络的重要性。

## 对SLAM的意义

DVSO表明,学习到的深度可以弥合单目与双目视觉里程计之间的精度差距,其"CNN作为虚拟双目相机"的构想——将深度先验表达为与几何项单位相同的光度残差——成为将网络融入直接法流程的一种有影响力的模式。它是CNN-SLAM → DVSO → D3VO这一脉络中的中间环节,D3VO在学习深度的基础上进一步加入了学习的位姿与不确定性,完成了这一演进;几何指导网络的这个闭环(Stereo DSO监督用于升级单目DSO的网络)也预示了后续自我提升系统的出现。

## 相关条目

- [DSO](dso.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [D3VO](d3vo.md)
- [CNN-SLAM](cnn-slam.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Scale ambiguity](scale-ambiguity.md)
