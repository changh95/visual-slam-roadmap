# SemanticFusion

> McCormac 2016 · [论文](https://arxiv.org/abs/1609.05130)

**一句话总结** — 第一个实时稠密语义SLAM系统,通过递归贝叶斯更新将逐帧CNN分割预测融合到ElasticFusion的面元(surfel)地图中,从而生成一个一致的三维语义地图。

## 问题

稠密几何SLAM能够生成精确的三维重建结果,但地图并不知道任何物体*是什么*——为了实现机器人智能的下一个层次以及更直观的用户交互,地图需要突破几何与外观的范畴,进一步包含语义信息。而单帧CNN语义分割本身存在噪声且依赖视角:同一表面从不同视角观察可能被赋予不同的标签。缺失的一环是一种能够将大量逐帧的二维预测累积成一个持久、一致的三维标注的机制。

## 方法与架构

该流程由三个协同运行的单元加上一个可选的正则化模块组成:

- **SLAM主干(ElasticFusion)**:对每一帧$k$,ElasticFusion通过结合ICP与RGB对齐来跟踪相机,得到位姿$T_{WC}$,并将深度融合进面元地图。其变形图(deformation graph)使概率分布能够随着面元一起经历小范围与大范围的回环而被"携带"下去,从而使面元与真实世界中的实体保持持久的对应关系——这正是语义融合所需要的长期对应关系。(采用默认参数,唯一改动是将深度截断距离从3米扩展到8米。)
- **CNN前端**:一个反卷积语义分割网络(Noh等人提出,基于VGG-16,使用Caffe实现)在每第10帧上运行,输出针对NYUv2的13个类别的逐像素类别概率$P(O_{u} = l_i \mid I_k)$。通过将深度滤波器初始化为预训练RGB滤波器的平均强度,并将其从0-255的色彩范围重新缩放(约缩放32倍)到0-8米的深度范围,从而添加了第四个*深度*通道。输入被缩放为224×224;输出被上采样为640×480。
- **贝叶斯标签融合**:每个面元$s$存储一个关于标签的离散分布$P(L_s = l_i)$,初始化为均匀分布。利用已跟踪的位姿,每个可见面元在三维位置$x(s)$处与像素$u(s,k) = \pi\big(T_{CW}(k)\, x(s)\big)$相关联,并按如下方式递归更新:

$$P(l_i \mid I_{1,\dots,k}) = \frac{1}{Z}\, P(l_i \mid I_{1,\dots,k-1})\; P\big(O_{u(s,k)} = l_i \mid I_k\big)$$

  其中$Z$为归一化常数。正是SLAM提供的对应关系,才使得来自多个视角的标签假设能够以贝叶斯方式进行组合。
- **可选的CRF正则化**:一个具有高斯边缘势的全连接CRF将每个面元视为一个节点,通过近似最小化下式来增量式地更新分布:$E(\mathbf{x}) = \sum_s \psi_u(x_s) + \sum_{s<s'} \psi_p(x_s, x_{s'})$,其中一元项$\psi_u(x_s) = -\log P(L_s = x_s \mid I_{1,\dots,k})$,而成对项则采用Potts加权核——一个基于面元位置$\mathbf{p}$和颜色$\mathbf{c}$的双边外观核,以及一个基于法向$\mathbf{n}$的平滑核:

$$k^1 = \exp\Big(-\frac{|\mathbf{p}_s-\mathbf{p}_{s'}|^2}{2\theta_\alpha^2} - \frac{|\mathbf{c}_s-\mathbf{c}_{s'}|^2}{2\theta_\beta^2}\Big), \qquad k^2 = \exp\Big(-\frac{|\mathbf{p}_s-\mathbf{p}_{s'}|^2}{2\theta_\alpha^2} - \frac{|\mathbf{n}_s-\mathbf{n}_{s'}|^2}{2\theta_\gamma^2}\Big)$$

  其中$\theta_\alpha = 0.05$米,$\theta_\beta = 20$,$\theta_\gamma = 0.1$弧度,每500帧应用一次。

每帧耗时(i7-5820K + Titan Black):SLAM 29.3毫秒,概率表维护1.0毫秒;每10帧一次的CNN前向传播51.2毫秒与贝叶斯更新41.1毫秒——平均帧率为25.3 Hz。

## 实验结果

在一个专门构建的办公室重建数据集上(回环轨迹,49个已标注测试帧,13个NYUv2类别),融合预测将RGBD-CNN的类别平均准确率从43.6%提升到48.3%,并将当时最先进的Eigen等人的CNN从57.1%提升到60.0%。在NYUv2测试集上(140个可用序列,360张已标注图像),SemanticFusion将RGBD-CNN的类别平均准确率从55.6%提升到58.9%(像素平均从62.0%提升到67.5%),将Eigen等人的方法从59.9%提升到63.2%(+3.3%);加入CRF后带来小幅进一步提升(63.6%)。相较于NYUv2以旋转轨迹为主的数据,该方法在办公室数据集上的提升幅度大约是其两倍——这说明多视角融合恰恰在视角变化较大时最为有价值。逐帧预测可获得52.5%的准确率,帧率为8.2 Hz;每10帧预测一次则准确率为49-51%,帧率为25.3 Hz。

## 对SLAM的意义

SemanticFusion开创了"深度语义SLAM"这一方向:它证明了CNN感知与稠密SLAM是互补的——SLAM提供的对应关系将逐帧的二维预测转化为持久且一致的三维语义地图,而这种融合甚至能反过来提升二维标注本身的质量。它直接启发了后续的语义建图路线,包括Fusion++、PanopticFusion、Kimera,以及当今的三维场景图系统。

## 相关条目

- [ElasticFusion](elasticfusion.md)
- [Fusion++](fusionpp.md)
- [Kimera / 3D动态场景图](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md)
