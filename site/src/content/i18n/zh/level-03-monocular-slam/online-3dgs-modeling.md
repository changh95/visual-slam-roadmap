# Online 3DGS Modeling

> Lee 2025 · [论文](https://arxiv.org/abs/2508.14014)

**一句话总结** — 一种在线单目3DGS建图方法，将DROID-SLAM + 多视图立体（MVS）前端与高斯后端相结合，并加入了不确定性驱动的非关键帧*新视角选择*机制，使模型恰好在能修复其不完整区域的额外帧上进行训练。

## 问题

基于稠密SLAM构建的在线3DGS流水线"仅依赖关键帧，而关键帧不足以覆盖整个场景，导致重建不完整"。关键帧的选取依据是对平均光流设阈值——这是一个*跟踪*层面的准则——因此那些只被短暂观测到、或仅从非关键帧视角观测到的区域重建不足。然而在线预算又不允许对每一帧都进行训练。在预算固定的情况下，*哪些*额外帧值得训练？第二个问题是：许多系统使用稀疏或单图预测的深度，这类深度存在尺度歧义，且在室外场景中会失效。

## 方法与架构

基于MVS-GS框架构建，前端和后端独立并行运行：

- **前端（跟踪+深度）**：DROID-SLAM在一个帧图 $G$上跟踪位姿，图的节点是关键帧 $I_k$，边是共视关系；其稠密光流产生一张粗略的视差图，用来*初始化*MVSFormer（一个由粗到细的多视图立体网络）的第一层，该网络为每个关键帧输出一张精确且度量一致的深度图 $\bar{D}_k$。全局光束法平差（GBA）在线运行，每30个关键帧执行一次（而不像原版DROID-SLAM那样只在最后执行一次），视差/平移量以平均视差 $\bar{d}$归一化以保证数值稳定性。
- **后端（建图）**：关键帧深度被反投影为点，经过MVS几何/光度一致性过滤，再转化为具有协方差 $\Sigma_i$、均值 $\mu_i$、不透明度 $o_i$、颜色 $c_i$和可学习形状 $\beta_i$的广义指数splatting（GES）基元。新的高斯只在渲染值与真实值PSNR低于阈值的未探索区域生成。渲染采用由前到后的alpha混合：

$$\hat{c}(p)=\sum_{i\in N} c_i\,\alpha_i \prod_{j=1}^{i-1}(1-\alpha_j), \qquad \alpha_i = o_i\, g_i(x)$$

  深度 $\hat{D}(p)$以同样方式渲染，使用每个高斯的深度 $z_i$。
- **GBA之后的地图变形**：当GBA将某个位姿 $T_k$更新为 $T_k'$时，地图会通过 $T_k^{rel}=T_k' T_k^{-1}$进行*刚性*变形：均值 $\mu_i' = T_k^{rel}\mu_i$，协方差 $\Sigma_i' = R_k^{rel}\,\Sigma_i\,(R_k^{rel})^{\top}$——MVS深度已经足够精确，因此不像Splat-SLAM那样需要非刚性变形。
- **新视角选择（NVS）**：逐高斯的不确定性结合了形状和优化状态两方面信息。最大协方差特征值 $\lambda_{n,i}=\max(s_{n,i}^{2})$（由尺度 $s_{n,i}$计算得出）标示出因高斯过大而导致的过度重建；位置梯度幅值 $A_{n,i}=\lVert d\mu_{n,i}\rVert$标示出仍在收敛中的区域：

$$U_{n,i}=\alpha_1 \lambda_{n,i}+\alpha_2 A_{n,i}, \qquad \alpha_1=0.7,\ \alpha_2=0.3$$

  非关键帧 $I_n$的信息增益是对可见高斯的不确定性求和，并以深度平方的倒数加权：$U_n=\sum_i U_{n,i}/z_{n,i}^{2}$。候选帧（最近30个关键帧跨度内的非关键帧，加上20个延续保留的高增益帧）按 $U_n$排序，非极大值抑制去除近似重复的视角，得分最高的top-k帧与最近30个关键帧一起构成训练集。与FisherRF或GS-Planner不同，这一方法不需要昂贵的渲染图像比较。
- **训练损失**：关键帧使用 $L_{\mathrm{KF}}=\lambda_{L1}L_1+\lambda_{\mathrm{SSIM}}L_{\mathrm{SSIM}}+\lambda_{\mathrm{depth}}L_{\mathrm{depth}}+\lambda_{\mathrm{smooth}}L_{\mathrm{smooth}}$（权重分别为0.95/0.2/0.2/0.1），其中 $L_{\mathrm{depth}}$针对MVS深度计算；非关键帧没有深度，因此使用 $L_{\mathrm{NKF}}=\lambda_{L1}L_1+\lambda_{\mathrm{SSIM}}L_{\mathrm{SSIM}}+\lambda_{\mathrm{smooth}}L_{\mathrm{smooth}}$。

## 实验结果

所有实验均在RTX 4090上进行（Replica上平均约9.18 FPS，显存占用约17.2 GiB）：

- **Replica**（8个场景，关键帧评估）：平均PSNR **39.28** / SSIM 0.98 / LPIPS 0.03，相较Splat-SLAM为36.45/0.97/0.06，MVS-GS为35.58/0.96/0.08，Photo-SLAM为33.29，MonoGS为25.88。
- **TUM-RGBD**：平均PSNR **27.72** / SSIM 0.90 / LPIPS 0.10，略优于Splat-SLAM（27.06/0.86/0.15）；MonoGS为18.82。
- **ScanNet**：平均PSNR **29.79**，相较Splat-SLAM为29.48，GLORIE-SLAM为22.45。
- **室外场景**（Aerial、Tanks&Temples）：基于深度预测的方法Splat-SLAM和GLORIE-SLAM*未能生成3DGS模型*；在Tanks&Temples上甚至Photo-SLAM和MonoGS也失败了，而本方法渲染出了近乎照片级的效果。
- **消融实验**（Replica Office0）：基线MVS-GS为40.92 PSNR → 加入在线GBA后为42.37 → 加入视差初始化后为42.71 → 加入平滑损失后为42.73（深度L1从0.044降至0.038） → **加入NVS后为43.93** PSNR，深度L1为0.034，且高斯数量*更少*（1078K对比1377K，地图体积缩小约60 MB）。

## 对SLAM的意义

这是首个在基于3DGS的SLAM框架中引入非关键帧选择的工作：即便面对被动的相机视频流，它也将重建完整性视为一个*主动选择*问题，把下一最佳视角（next-best-view）思想引入到在线建图中。它同时也印证了这样一个观点：多视图立体深度（而非单目深度预测）才是使基于渲染的SLAM在室外场景中存活下来的关键——而室外场景正是仅依赖关键帧的流水线退化最严重的场合。

## 相关条目

- [DROID-SLAM](droid-slam.md)
- [MonoGS](monogs.md)
- [Photo-SLAM](photo-slam.md)
- [SplaTAM](splatam.md)
- [ActiveSplat](activesplat.md)
