# NICER-SLAM

> Zhu 2024 · [论文](https://arxiv.org/abs/2302.03594)

**一句话总结** — 一个纯RGB输入的神经隐式SLAM系统，联合优化相机位姿与一个分层SDF地图，用单目深度/法线先验、光流和一个变形（warping）损失来替代缺失的深度传感器——其重建质量可与RGB-D系统相媲美。

## 问题

神经隐式SLAM系统"要么依赖RGB-D传感器，要么需要单独的单目SLAM方法来完成相机跟踪，且无法生成高保真的稠密3D场景重建"（摘自摘要）。论文指出，纯RGB SLAM之所以更难，有三个原因：深度歧义（许多对应关系只是颜色匹配，尤其在无纹理区域）、表面估计的局部性较差，以及约束更少、收敛更慢的优化过程。论文提出的问题是：一个*统一*的稠密SLAM系统能否仅用一个神经隐式表示，同时完成来自单目RGB视频的跟踪与建图？

## 方法与架构

**分层SDF+颜色表示。** 一个粗糙的稠密体素网格（$32^3$，32维特征）配合一个小型MLP $f^{\text{coarse}}$给出基础SDF；多分辨率细网格（$L=8$层，分辨率 $R_l = \lfloor R_{\min} b^{l} \rfloor$，从 $R_{\min}=32$到 $R_{\max}=128$按几何级数分布）配合 $f^{\text{fine}}$预测一个残差，因此最终SDF为

$$\hat{s} = s^{\text{coarse}} + \Delta s.$$

颜色使用其自身的多分辨率网格（$L=16$，最高至 $R_{\max}=2048$）和解码器 $\hat{\mathbf{c}} = f^{\text{color}}\bigl(\mathbf{x}, \hat{\mathbf{n}}, \gamma(\mathbf{v}), \mathbf{z}^{\text{coarse}}, \mathbf{z}^{\text{fine}}, \{\Phi^{\text{color}}_l(\mathbf{x})\}\bigr)$，以SDF导出的法线 $\hat{\mathbf{n}}$ 和视角方向 $\mathbf{v}$为条件。

**具有局部自适应SDF-to-density变换的体渲染。** SDF样本通过VolSDF变换 $\sigma_\beta(s)$转化为密度（对 $s\le 0$使用缩放指数形式，对 $s>0$使用 $\frac{1}{\beta}\bigl(1-\frac{1}{2}\exp(-\frac{s}{\beta})\bigr)$），然后颜色/深度/法线通过alpha合成：$\hat{C} = \sum_{i=1}^{N} T_i \alpha_i \hat{\mathbf{c}}_i$，其中 $\alpha_i = 1-\exp(-\sigma_i\delta_i)$，$T_i = \prod_{j=1}^{i-1}(1-\alpha_j)$。与VolSDF使用单一全局 $\beta$不同，一个逐体素（$64^3$）的采样计数器 $T_p$在局部设定锐利程度：

$$\beta = c_0 \cdot \exp(-c_1 \cdot T_p) + c_2,$$

因此观测充分的区域会渲染出清晰的表面，而观测稀少的区域则保持柔和。

**损失函数取代了深度传感器。** 建图最小化以下目标：

$$\mathcal{L} = \mathcal{L}_{\text{rgb}} + 0.5\,\mathcal{L}_{\text{warp}} + 0.001\,\mathcal{L}_{\text{flow}} + 0.1\,\mathcal{L}_{\text{depth}} + 0.05\,\mathcal{L}_{\text{normal}} + 0.1\,\mathcal{L}_{\text{eikonal}},$$

其中 $\mathcal{L}_{\text{warp}}$比较每个像素的颜色与其通过渲染深度重投影到附近关键帧后的颜色；$\mathcal{L}_{\text{flow}}$使由此产生的对应关系与GMFlow估计的光流相匹配；单目深度损失具有尺度/平移不变性，$\mathcal{L}_{\text{depth}} = \sum_{\mathbf{r}} \lVert (w\hat{D}(\mathbf{r})+q) - \bar{D}(\mathbf{r})\rVert^2$，其中 $w,q$对每张图像以闭式解求解；$\mathcal{L}_{\text{normal}}$对预测的单目法线施加L1+角度一致性约束；Eikonal项 $\sum_{\mathbf{x}}(\lVert\nabla\hat{s}(\mathbf{x})\rVert_2 - 1)^2$对SDF进行正则化。

**系统。** 建图每5帧运行一次，分三个阶段（先只优化粗网格；在完成25%迭代后加入细网格；在完成75%迭代后进行局部BA，同时优化16个所选帧中一半的位姿），每次采样 $M=8096$条射线。跟踪与之并行，在每一帧运行，仅优化当前帧位姿，使用RGB损失，在 $M_t=1024$个像素上迭代100次。单次迭代成本：在A100上建图496毫秒，跟踪147毫秒。网格通过在 $512^3$分辨率下运行marching cubes得到。

## 实验结果

- **Replica重建**：平均精度3.65 cm，完整度4.16 cm，完整度比例79.37%，法线一致性90.27%——远超RGB基线DROID-SLAM（5.50 / 12.29 cm，63.62%）和COLMAP（8.69 / 12.12 cm，67.62%），并与RGB-D方法NICE-SLAM（3.87 / 3.87 cm，82.41%）相当。
- **Replica跟踪（ATE RMSE）**：平均1.88 cm——在没有任何深度输入的情况下与RGB-D方法NICE-SLAM（1.95 cm）相当，不过DROID-SLAM仍然远更精确（0.33 cm；不含最终全局BA/回环检测时为0.70 cm）。
- **新视角合成（Replica）**：外插视角23.93 dB PSNR / 0.857 SSIM / 0.201 LPIPS，甚至超过了RGB-D系统NICE-SLAM（23.26 dB）和Vox-Fusion（21.98 dB）；内插视角为25.41 dB。
- **7-Scenes**（低分辨率、有运动模糊的真实数据）：平均跟踪误差8.55 cm，对比DROID-SLAM的5.66 cm，但比COLMAP（11.14）和不含全局BA的DROID-SLAM（10.87）更鲁棒，且重建明显更清晰；单目先验帮助其顺利通过了那些基线方法都失败的无纹理/反光南瓜场景。
- 消融实验：去掉单目深度损失或法线损失都会显著降低建图和跟踪的质量——真正消解优化歧义的是这些先验，而不是RGB损失本身。

## 对SLAM的意义

NICER-SLAM表明，统一的神经隐式SLAM并不从根本上依赖深度传感器：来自单目深度/法线网络的先验，加上光流一致性和变形一致性，可以替代直接的深度监督，代价是跟踪精度不如专用的里程计方法。这将稠密神经SLAM拓展到了普通单目相机，而其配方——单目几何线索、光流一致性、局部自适应的SDF渲染——在后续诸多纯RGB神经与高斯SLAM系统（如MonoGS）中反复出现。

## 相关条目

- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [MonoGS](monogs.md)
- [DPT](dpt.md)
- [MiDaS](midas.md)
- [RAFT](raft.md)
