# MaskFusion

> Rünz 2018 · [论文](https://arxiv.org/abs/1804.09194)

**一句话总结** — 一种实时RGB-D SLAM系统，能够识别、分割、跟踪并重建多个*运动*物体，将其作为独立的语义面元（surfel）模型处理，而不是把世界当作单一的刚性场景。

## 问题

传统SLAM系统"只输出静态场景的纯几何地图"：任何运动的东西都被视为需要忽略的异常值，而地图也无法说明其中包含哪些物体。早期基于识别的SLAM（如SLAM++）可以跟踪物体，但仅限于那些具有预先扫描的3D模型的物体，而具备语义能力的稠密SLAM（SemanticFusion）会将地图点标注为固定类别，却不区分不同实例。MaskFusion的目标是三者的结合：物体感知、语义化*以及*动态——在没有已知模型的情况下实时识别、分割和重建多个独立运动的物体。

## 方法与架构

MaskFusion是一个多模型SLAM系统：它维护一个背景模型，以及每个被识别物体对应的一个面元模型$\mathcal{M}_m$，$m \in \{0..N\}$（采用ElasticFusion的表示方式——每个面元存储位置、法向、颜色、权重、半径、时间戳）。每个模型携带一个刚性位姿$\mathbf{R}_{tm}, \mathbf{t}_{tm}$以及一个静态/动态标志；只有非静态物体才会被单独跟踪（当运动不一致，或有人触碰物体时，该物体会被判定为动态）。每帧运行三个阶段：

**跟踪。** 每个被跟踪模型的位姿增量$\xi_m \in \mathfrak{se}(3)$相对于该模型在其上一位姿渲染出的图像，最小化一个联合的几何-光度能量：

$$E_m = \min_{\xi_m}\,(E^{icp}_m + \lambda E^{rgb}_m)$$

其中包含一个投影式的点到面ICP项和一个亮度恒常项

$$E^{icp}_m = \sum_i \left((\mathbf{v}^i - \exp(\xi_m)\,\mathbf{v}^i_t)\cdot\mathbf{n}^i\right)^2, \qquad E^{rgb}_m = \sum_{\mathbf{u}\in\Omega}\left(\mathcal{I}_t(\mathbf{u}) - \mathcal{I}^a_{t-1}\big(\pi(\exp(\xi_m)\,\pi^{-1}(\mathbf{u},\mathcal{D}_t))\big)\right)^2,$$

其中$\mathbf{v}^i,\mathbf{n}^i$是渲染出的模型顶点/法向，$\mathbf{v}^i_t$是反投影得到的当前顶点，$\mathcal{D}_t,\mathcal{I}_t$是当前深度/强度图，$\pi$为透视投影；通过高斯-牛顿法在4级由粗到细的金字塔上求解（CUDA实现）。

**分割。** Mask R-CNN给出带有类别标签的实例掩码（80个COCO类别），但运行速度只有约5 Hz，且边界会渗透到背景中，因此它在帧队列（长度12，约400 ms延迟）上异步运行，同时每帧的*几何*分割提供清晰的实时边界：若$\phi_d + \hat{\lambda}\phi_c > \tau$，则某像素被视为边缘，其中深度不连续项为$\phi_d = \max_{i\in\mathcal{N}} |(\mathbf{v}_i - \mathbf{v})\cdot\mathbf{n}|$，在局部邻域$\mathcal{N}$上还有一个类似的凹度项$\phi_c$。边缘图的连通分量被映射到语义掩码（重叠度≥65%），掩码被映射到已有模型（通过投影模型标签、匹配类别ID），剩余的连通分量则直接映射为新模型；诸如*人*这样的类别可以完全被排除在融合之外。

**融合。** 面元通过与ElasticFusion相同的投影式数据关联进行更新，并根据最终的分割结果进行模板划分，使每个新面元恰好属于一个模型，同时对模板之外的面元施加置信度惩罚，以吸收不完美的掩码所带来的影响。

## 实验结果

- TUM RGB-D动态序列，AT-RMSE（厘米）：在高度动态的*f3w_xyz*/*f3w_halfsphere*上，MaskFusion（利用人物检测来忽略人）得分为**10.4/10.6**，而Co-Fusion为69.6/80.3，ElasticFusion为21.6/20.9，VO-SF为87.4/73.9，StaticFusion为12.7/39.1。在轻度动态的场景中，普通的ElasticFusion仍然最佳（f3s_static上为0.9，而MaskFusion为2.1）——过于激进的异常值剔除会丢弃对跟踪仍然有用的点。
- 物体跟踪：f3_long_office中的泰迪熊以2.2 cm的AT-RMSE被跟踪，而相机达到8.9 cm（若将熊融合进背景，则为7.2 cm）。
- 重建：一个YCB漂白剂瓶（高250 mm）以平均面元误差7.0 mm（标准差5.8 mm）被重建。
- 在一个600帧的标注序列上的分割IoU：投影得到的已融合模型掩码优于Mask R-CNN加几何细化，后者又优于单独的Mask R-CNN。
- 运行时间：单模型时SLAM流程速度>30 Hz，3个非静态模型时约20 Hz；Mask R-CNN在专用的第二块GPU上以5 Hz运行（2块GTX Titan X，i7 3.5 GHz）。AR演示（卡路里估算、角色骑在移动的滑板上）和一个抓取序列展示了具备实例感知能力的动态地图。

## 对SLAM的意义

MaskFusion是从"静态世界中的SLAM"转向动态、物体感知SLAM的一个里程碑：它表明在没有已知物体模型的情况下，可以实时维护带语义标签的逐物体稠密模型。这一研究方向支撑了机器人操作和AR场景，在这些场景中场景中最有趣的部分恰恰是那些运动的东西——一张会删除运动物体的地图对于必须去抓取它的机器人毫无用处。MaskFusion与MID-Fusion一起确立了物体级动态SLAM的范式，后来VDO-SLAM和DynaSLAM II在优化后端上将其正式化。

## 相关条目

- [MID-Fusion](mid-fusion.md)
- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md)
- [SLAM++](../level-04-rgbd-slam/slampp.md)
