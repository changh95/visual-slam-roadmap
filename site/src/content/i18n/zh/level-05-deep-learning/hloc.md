# hloc

> Sarlin 2019 · [代码](https://github.com/cvg/Hierarchical-Localization)

**一句话总结** — 实现HF-Net分层定位方案的开源工具箱——粗略地点检索(NetVLAD)后接精细局部匹配(SuperPoint+SuperGlue)与PnP——已成为社区标准的视觉定位流程。

## 问题

HF-Net("From Coarse to Fine: Robust Hierarchical Localization at Large Scale",CVPR 2019)提出的由粗到细定位范式是一个多阶段系统——全局描述子、检索、局部特征、匹配、SfM三角化、PnP——而每个研究团队从零重新实现这一整条链路,使得结果难以复现和比较。大规模定位必须同时做到快速(不能将查询与数据库中每一张图像都进行匹配)和精确(仅靠检索只能得到米级精度的粗略位置)。hloc将整条链路打包为持续维护的软件,使得最先进的定位变成一种配置选择,而不是一项工程项目。

## 方法与架构

该工具箱由若干脚本组成,端到端地执行分层定位流程(依据仓库自身对流程的描述):

1. **局部特征提取**,对所有数据库图像和查询图像进行——通过`hloc/extractors/`使用SuperPoint、DISK、D2-Net、SIFT或R2D2。
2. **构建参考三维SfM模型**:找到共视的数据库图像对(通过检索或先验SfM模型),用SuperGlue或更快的LightGlue进行匹配(`hloc/matchers/`),再用COLMAP三角化出新的SfM模型(自v1.3起纯用pycolmap,无需安装COLMAP)。当激光雷达扫描已提供几何信息时(例如InLoc),该步骤会被跳过。
3. **粗检索**:全局描述子——NetVLAD、AP-GeM/DIR、OpenIBL或MegaLoc——为每个查询检索出相关的前$k$张数据库图像(例如Aachen使用NetVLAD前50张)。
4. **精细匹配**将查询特征与检索到的图像进行匹配(学习型匹配器,或带比值/距离/互近邻检查的最近邻匹配;也支持稠密的LoFTR匹配)。
5. **定位**:得到的2D-3D对应关系被送入PnP+RANSAC求解器以估计6自由度查询位姿,并提供暴露全部估计器参数的模块化API。
6. **可视化与调试**:每次运行会为每个查询记录检索到的图像、匹配结果以及诸如RANSAC内点数等位姿求解统计信息。

特征与匹配结果以带有明确格式的HDF5文件交换,因此任何PyTorch提取器/匹配器都可以通过继承`BaseModel`接入——这正是DISK、LightGlue、LoFTR、SOSNet、CosPlace等模块在历次版本(v1.0于2020年→v1.4于2023年)中被吸收进来的方式。现成的`hloc/pipelines/`覆盖了Aachen Day-Night、InLoc、Extended CMU Seasons、RobotCar Seasons、4Seasons、Cambridge Landmarks和7-Scenes,同一套工具链也可以对无序图像从零进行SfM重建。

## 实验结果

仓库中报告的数据(在visuallocalization.net上评测),为在基准三个精度阈值内被成功定位的查询比例:

- **Aachen Day-Night**,使用NetVLAD前50检索+SuperPoint+SuperGlue:白天为**89.6/95.4/98.8**,夜间为**86.7/93.9/100**。将SuperGlue替换为最近邻匹配,夜间性能降至75.5/86.7/92.9——正是学习型匹配器带来了夜间的鲁棒性。
- **InLoc**,使用SuperPoint+SuperGlue:DUC1为**46.5/65.7/78.3**,DUC2为**52.7/72.5/79.4**;加入时序一致性后分别为49.0/68.7/80.8和53.4/77.1/82.4。
- 这些SuperPoint+SuperGlue配置长期占据Long-Term Visual Localization基准的主导地位,而hloc至今仍是新特征和新匹配器(DISK、LightGlue、LoFTR等)展示其价值的评测工具。

## 对SLAM的意义

对于构建重定位、回环检测或基于地图的定位的任何人,hloc都是值得作为起点的参考实现:它用最先进的学习型组件和已知有效的默认设置将由粗到细的范式落地实现,以一套特征堆栈将离线COLMAP建图与在线重定位连接起来。许多研究系统和产品原型直接使用hloc,或将其作为自身定位堆栈的模板,而它记录每次查询内点数的pickle日志,让失败分析——定位工程中的日常工作——变得异常轻松。

## 相关条目

- [HF-Net](hf-net.md) — hloc所实现的分层定位方案出自这篇论文
- [NetVLAD](netvlad.md) — 粗检索描述子
- [SuperPoint](superpoint.md) — 默认的局部特征
- [SuperGlue](superglue.md) — 精细匹配阶段所用的学习型匹配器
- [LightGlue](lightglue.md) — 后来成为默认选择的更快匹配器
- [COLMAP](../level-03-monocular-slam/colmap.md) — hloc建图与定位所依赖的SfM主干
- [DISK](disk.md) — 被吸收进该工具箱的学习型特征
