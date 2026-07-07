# Fusion++

> McCormac & Clark 2018 · [论文](https://arxiv.org/abs/1808.08378)

**一句话总结** —— 一种物体级体素SLAM系统,使用Mask-RCNN实例分割为任意物体创建逐物体TSDF重建——无需先验模型——并将物体作为地标节点纳入一个6自由度位姿图中。

## 问题

SLAM++展示了物体级建图的可行性,但需要一个预先构建的已知3D模型数据库,这将其局限于每个可建图物体都事先被扫描过的受控环境。与此同时,稠密的整体场景地图(面元、全局TSDF)对内存的消耗很大,并且对物体和杂物一视同仁。当时缺失的是一个能够*在线发现*任意物体、紧凑地重建每一个物体、并将这些持久化的物体本身用作地图——用于跟踪、重定位和回环检测——的系统。

## 方法与架构

**流程。** 从RGB-D输入出发,一个粗略的、与实例无关的背景TSDF($256^3$,2厘米体素,随相机移动而重置)支持局部frame-to-model跟踪和遮挡处理。在一个并行线程中,Mask R-CNN(ResNet-101,在NYUv2上微调;每次约250毫秒)生成实例掩膜,经过筛选(前100个检测结果,$\max p(l_i \mid I_k) > 0.5$,掩膜面积$> 50^2$像素,远离图像边界)后,通过光线投射-掩膜重叠度($a_{\mathrm{detect}} > 0.2$)与地图中已有的物体关联。未匹配的检测会生成新的物体TSDF;已匹配的则融合进已有物体。持久化地图*只是*位姿图中的一组物体TSDF。

**逐物体TSDF。** 掩膜内的像素通过${}_{W}\mathbf{p} = \tilde{\mathbf{T}}_{WC}^{k} \mathbf{K}^{-1} D_k(\mathbf{u})\, \mathbf{u}$反投影;第10/90百分位点确定体素中心和立方体尺寸$s_o$(填充系数$m = 1.5$,最大3米)。初始分辨率为每轴$r_o = 64$(可增长到128),因此体素大小$v_o = s_o / r_o$会随物体大小自适应——小物体获得精细细节,大物体保持廉价。截断范围$\mu = 4 v_o$内的深度通过在*整个*体素上加权平均融合;哪些体素属于该物体则通过将掩膜检测作为带Beta先验的二项试验单独学习——前景/非前景计数$F^o(\mathbf{v}), N^o(\mathbf{v})$给出

$$E[p^o(\mathbf{v})] = \frac{F^o(\mathbf{v})}{F^o(\mathbf{v}) + N^o(\mathbf{v})}$$

光线投射只在$E[p^o(\mathbf{v})] > 0.5$处渲染表面。每个物体还保留平均类别概率$p(l_o \mid I_{1..k}) = \frac{1}{k}\sum_i p(l_o \mid I_i)$(取平均比乘性贝叶斯更好,后者会变得过度自信),以及一个带Beta计数$(e_o, d_o)$的*存在*概率;$E[p(o)] < 0.1$的物体会被删除。

**跟踪。** 背景TSDF和所有物体体素被光线投射到一个分层参考帧中;实况深度通过投影式点到平面ICP对齐,

$$r_{\mathrm{icp}}(\tilde{\mathbf{T}}_{WC_l}, \mathbf{u}_l) = N_r(\mathbf{u}_r) \cdot \big( V_r(\mathbf{u}_r) - \tilde{\mathbf{T}}_{WC_l} V_l(\mathbf{u}_l) \big)$$

通过高斯-牛顿法在3级金字塔上最小化(每级5次迭代),并按实例划分误差。当ICP RMSE > 0.05米(或有效像素太少)时判定跟踪丢失,触发重定位:带深度的BRISK特征,先对每个物体做3D-3D RANSAC,再对整个场景联合进行(5厘米内至少50个内点)。

**物体级位姿图。** 节点是相机位姿$\mathbf{T}_{WC}$和物体位姿$\mathbf{T}_{WO}$;边是来自划分后的ICP项的"虚拟"相对位姿测量,例如$\mathbf{e}_{\mathrm{oc}} = \log\big( (\tilde{\mathbf{T}}^{\prime o}_{OC_k})^{-1} \mathbf{T}^{o}_{OW} \mathbf{T}_{WC_k} \big)$,信息矩阵为$\mathbf{H}_{\mathrm{pg}} = \mathbf{J}^{\top}_{\mathrm{pg}} ( \mathbf{J}^{o\top}_{\mathrm{icp}} \mathbf{J}^{o}_{\mathrm{icp}} ) \mathbf{J}_{\mathrm{pg}}$,其中$\mathbf{J}_{\mathrm{pg}}$是$\mathbf{T}_{WC_k}$的伴随矩阵,用于在ICP和位姿图扰动约定之间转换。这个稳健(Huber)图在g2o中用Levenberg-Marquardt求解;回环检测会调整相对物体位姿,但绝不会使TSDF内部产生形变,因此重建结果始终保持清晰。

## 实验结果

在一个专门设计用来考验约束不良ICP的3685帧办公室闭环序列中,系统在反复的闭环中重定位并纠正位姿图,重复利用了105个已重建的物体实例。在TUM RGB-D基准上,Fusion++在6个序列中的5个上改善了相对于其粗TSDF里程计基线的ATE RMSE:fr1_desk为0.049 vs 0.066米,fr1_room为0.235 vs 0.305,fr2_desk为0.114 vs 0.342,fr2_xyz为0.020 vs 0.022,fr3_long_office为0.108 vs 0.281(fr1_desk2略差,0.153 vs 0.146);论文指出其精度未达到ElasticFusion/ORB-SLAM2的水平,因为它优先保证物体地图的可用性。物体重建质量在YCB视频数据集上与YCB真值模型进行了定性比较。内存占用约为每个物体4 MB(105个物体共377 MB,而同等预算下单一$900^3$体素则需要更多);未经优化的Python/C++/CUDA系统在不计重定位的情况下以4-8 Hz运行(跟踪35毫秒,光线投射25毫秒+每个可见物体0.5毫秒,Mask R-CNN线程内260毫秒,重定位780毫秒)。

## 对SLAM的意义

Fusion++消除了SLAM++最大的局限——预先构建的CAD数据库——展示了现成的实例分割CNN可以作为任意室内场景中物体级SLAM的发现机制,并且一个由刚性逐物体TSDF构成的位姿图可以在不产生模型内部形变的情况下实现回环一致性。它处于稠密融合谱系(KinectFusion式TSDF)和语义谱系(SemanticFusion)的交汇点,并直接影响了MoreFusion、NodeSLAM和DSP-SLAM,这些工作逐步用学习到的位姿和形状先验取代了原始的逐物体TSDF。

## 相关条目

- [SLAM++](slampp.md)
- [SemanticFusion](semanticfusion.md)
- [MoreFusion](morefusion.md)
- [DSP-SLAM](dsp-slam.md)
- [NodeSLAM](../level-05-deep-learning/nodeslam.md)
- [PointFusion / DenseFusion](pointfusion-densefusion.md)
