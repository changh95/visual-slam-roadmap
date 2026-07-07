# SplaTAM

> Keetha 2024 · [论文](https://arxiv.org/abs/2312.02126)

**一句话总结** — 最早使用 3D 高斯溅射作为地图的 SLAM 系统之一（与 GS-SLAM 和 MonoGS 同期）：通过一个可微渲染器实现"溅射-跟踪-建图"循环，用渲染出的轮廓图同时指导位姿优化和高斯致密化。

## 问题

稠密 SLAM 方法"常常受限于其表示场景的非体素化或隐式方式"：手工设计的显式地图（点、表面元、SDF）只有在具有丰富 3D 特征时才能可靠跟踪，并且只能解释已观测到的表面；而隐式辐射场 SLAM（NICE-SLAM、Point-SLAM）需要昂贵的逐射线体素采样，只能在稀疏的像素集合上计算损失。3D 高斯溅射能以高达 400 FPS 的速度渲染，但一直都需要已知的位姿。SplaTAM（CVPR 2024，CMU/MIT）"首次证明用 3D 高斯表示场景可以支持使用单个无位姿单目 RGB-D 相机进行稠密 SLAM"。

## 方法与架构

**简化的高斯地图。** 场景由一组*各向同性*、与视角无关的高斯组成——每个高斯有 8 个参数（RGB 颜色 $\mathbf{c}$、中心 $\boldsymbol{\mu}\in\mathbb{R}^3$、半径 $r$、不透明度 $o$），每个高斯对空间的影响为 $f(\mathbf{x}) = o\exp\bigl(-\tfrac{\|\mathbf{x}-\boldsymbol{\mu}\|^{2}}{2r^{2}}\bigr)$。颜色、深度以及一个*轮廓图*都是通过将高斯从前到后排序、并对其 2D 溅射结果进行 alpha 混合而渲染出来的：

$$C(\mathbf{p})=\sum_{i=1}^{n}\mathbf{c}_{i}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr), \quad D(\mathbf{p})=\sum_{i=1}^{n}d_{i}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr), \quad S(\mathbf{p})=\sum_{i=1}^{n}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr),$$

其中 $f_i(\mathbf{p})$ 使用投影后的中心 $\boldsymbol{\mu}^{2D} = K\,E_{t}\boldsymbol{\mu}/d$ 和半径 $r^{2D} = fr/d$，$d=(E_{t}\boldsymbol{\mu})_{z}$。轮廓图 $S$ 表示每个像素拥有多少地图证据——即地图的认知不确定性。

每一帧执行三个步骤：

1. **相机跟踪。** 新位姿先通过匀速传播初始化，$E_{t+1}=E_{t}+(E_{t}-E_{t\text{-}1})$，再冻结高斯，仅使用建图良好的像素，通过渲染器进行梯度下降精化：
$$L_{t}=\sum_{\mathbf{p}}\Bigl(S(\mathbf{p})>0.99\Bigr)\Bigl(\mathrm{L}_{1}\bigl(D(\mathbf{p})\bigr)+0.5\,\mathrm{L}_{1}\bigl(C(\mathbf{p})\bigr)\Bigr).$$
2. **高斯致密化。** 一个掩膜挑选出地图尚未解释的像素——轮廓值低，或真实几何位于渲染几何之前：
$$M(\mathbf{p})=\Bigl(S(\mathbf{p})<0.5\Bigr)+\Bigl(D_{\mathrm{GT}}(\mathbf{p})<D(\mathbf{p})\Bigr)\Bigl(\mathrm{L}_{1}\bigl(D(\mathbf{p})\bigr)>50\,\mathrm{MDE}\Bigr),$$
   其中 MDE 是深度误差的中位数。掩膜内每个像素都会生成一个高斯，颜色取自该像素颜色，中心位于反投影得到的深度处，不透明度为 0.5，半径为一个像素大小 $r = D_{\mathrm{GT}}/f$。
3. **地图更新。** 位姿冻结的情况下，在 $k$ 个关键帧（当前帧、最新关键帧，以及与当前深度点云视锥重叠度最高的 $k-2$ 个关键帧）上优化高斯参数，从已有地图热启动，使用不带轮廓掩膜的颜色+深度损失并加上一个 SSIM 项；近乎透明或过大的高斯会被剔除。

## 实验结果

- **Replica**（8 个场景的平均 ATE RMSE）：0.36 cm——比此前最先进的 Point-SLAM（0.52）低超过 30%，远低于 ESLAM（0.63）、NICE-SLAM（1.06）、Vox-Fusion（3.09）。
- **TUM-RGBD**：平均 5.48 cm，比 Point-SLAM 的 8.92 降低了近 40%（NICE-SLAM 为 15.87）；基于特征的 ORB-SLAM2（1.98）在稀疏方法中仍然领先。在质量同样较低的原始 ScanNet 上，11.88 cm 与 Point-SLAM（12.19）、NICE-SLAM（10.70）相当。
- **ScanNet++**（高质量采集但帧间运动幅度很大，约每步 30 个 Replica 帧）：SplaTAM 在两个序列上均实现 1.2 cm 的平均跟踪误差，而 Point-SLAM 和 RGB-D ORB-SLAM3 完全失败；新视角合成达到 24.41 dB PSNR（训练视角为 27.98 dB），新视角深度 L1 约为 2 cm。
- **渲染**：Replica 训练视角 PSNR 为 34.11 dB——比 NICE-SLAM（24.42）和 Vox-Fusion（24.41）高约 10 dB，与 Point-SLAM（35.17，使用真值深度来放置采样点）相当；地图渲染速度在 876x584 分辨率下可达 400 FPS。
- **运行时间**（RTX 3080 Ti，Replica R0）：每次迭代跟踪 25 毫秒、建图 24 毫秒，同时每次迭代都渲染完整的约 120 万像素图像——相比之下基线方法只在 200-1000 个采样像素上进行优化；SplaTAM-S（更少迭代次数）运行速度快 5 倍（每帧 0.19 秒 + 0.33 秒），ATE 为 0.39 cm。
- **消融实验**（Room 0）：移除轮廓掩膜后跟踪完全崩溃（ATE 115.8 cm）；用 0.99 的阈值代替 0.5 可将误差降低 5 倍（0.27 对比 1.30）；不使用速度传播的误差高出 10 倍以上；仅用深度损失则完全失效（86.03 cm）。文中指出的局限性包括：对运动模糊、大深度噪声以及剧烈旋转的敏感性。

## 对SLAM的意义

SplaTAM 帮助开启了 3DGS SLAM 这条研究路线，证明了一种显式、可微、体素化的地图可以在跟踪、建图和视图合成方面，在交互速率下超越 NeRF 风格的 SLAM——并且当渲染是光栅化而非光线步进时，稠密的逐像素损失就变得可以承受。其轮廓掩膜成为致密化与不确定性门控的标准工具，其"通过可微渲染器交替进行跟踪与建图"的循环也成为 Photo-SLAM、RTG-SLAM、GS-ICP SLAM 及众多后续工作所依赖的范式。

## 相关条目

- [MonoGS](monogs.md)
- [NICE-SLAM](nice-slam.md)
- [Point-SLAM](point-slam.md)
- [Photo-SLAM](photo-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
