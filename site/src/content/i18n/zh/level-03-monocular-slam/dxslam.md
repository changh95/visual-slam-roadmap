# DXSLAM

> Li 2020 · [论文](https://arxiv.org/abs/2008.05416)

**一句话总结** — 在ORB-SLAM2流程中用HF-Net的深度局部特征与全局特征替换手工设计的ORB特征,显著提升了对光照变化和终身SLAM场景变化的鲁棒性——同时仍能在CPU上实时运行。

## 问题

对于视觉SLAM而言,"尽管理论框架在大多数方面已经相当成熟,但特征提取与关联在多数情况下仍依赖经验设计,在复杂环境中可能十分脆弱"——当场景或视角发生变化时,ORB-SLAM2常常无法识别之前访问过的场景。CNN特征的鲁棒性要好得多,但多数深度特征系统需要GPU,这在很多机器人上并不现实。DXSLAM证明深度特征"可以无缝集成到现代SLAM框架中",并做到了CPU实时:更换特征,保留经过验证的几何方法。

## 方法与架构

该框架是ORB-SLAM2的跟踪/局部建图/回环检测流程,其中特征提取、重定位和回环检测均围绕一个CNN重新构建:

- **HF-Net前端** — 每张图像经过一个共享编码器和三个并行解码器,分别预测关键点检测得分、稠密局部描述子(两者均为SuperPoint架构)以及一个NetVLAD全局描述子。一次推理即可同时得到用于位姿跟踪/建图的局部特征和用于检索的全局图像描述子。HF-Net是经实验筛选后选定的,优于SuperPoint和D2-Net(SuperPoint在低光照下提取的关键点太少)。
- **增量训练的FBoW词典** — 在OpenLORIS-Scene序列上,基于HF-Net局部描述子训练视觉词典:相邻训练图像进行暴力匹配,按检测得分排名前300的匹配描述子加入已有视觉单词,未匹配的则成为新的叶子节点,随后这些单词被聚类为父节点。二进制FBoW格式加载耗时约40 ms,而ORB-SLAM2的词典加载则需约6 s。
- **基于全局特征的重定位** — 不再采用BoW检索加逐帧匹配,而是通过学习到的全局描述子检索候选帧,并用于*分组匹配*:将当前帧的关键点与检索到的一组(通常2-3组)的所有关键点进行匹配,然后用标准的RANSAC + PnP估计位姿。这解决了ORB-SLAM2重定位的两种失效模式(检索不到候选帧;单帧匹配数过少)。
- **两阶段回环检测** — 前$K$个候选帧根据BoW相似度得分排序

$$s(v_{1},v_{2})=\sum_{i=1}^{N}|v_{1,i}|+|v_{2,i}|-|v_{1,i}-v_{2,i}|,$$

  该得分基于视觉向量$v_1,v_2$计算;由于BoW忽略了空间关系,第二阶段会计算与每个候选帧的全局描述子内积距离,只有低于阈值的最接近者才被接受——以精度优先,因为一次错误的回环会破坏地图。
- **CPU优化** — TensorFlow版的HF-Net模型通过Intel OpenVINO转换(将双线性描述子上采样移到后处理阶段),FBoW则使用SIMD指令,因此"整个系统无需GPU或其他加速器即可实时运行。"

## 实验结果

在OpenLORIS-Scene重定位测试(办公室场景,受控挑战因素)中,DXSLAM在光照变化下得分0.862(ORB-SLAM2:0.764),在低光照下得分0.994(ORB-SLAM2和DS-SLAM均为0),在物体和人员变化下得分0.999;所有方法在完全视角反转下均失败(0)。New College和City Center上的回环检测PR曲线显示,完整方法(HF-FBoW-GLB)明显优于ORB-SLAM2的ORB-BoW,全局描述子阶段带来了显著的额外提升。在TUM RGB-D动态序列上,ATE RMSE从0.3900 m(ORB-SLAM2)降至fr3_walking_static上的0.0167 m,以及从0.4863 m降至fr3_walking_half上的0.0759 m——与显式处理动态目标的DS-SLAM相当。在一台15 W的i7-10710U上,使用OpenVINO进行特征提取每张图像耗时46.2 ms(比纯HF-Net的144.2 ms快68%;SuperPoint需387.5 ms,D2-Net需2484.6 ms),完整ROS系统在Intel NUC上以约15 Hz的频率发布位姿。

## 对SLAM的意义

DXSLAM清晰地展示了革新经典SLAM最简单的方式:保留经过验证的几何后端,替换为学习到的特征。它证明了在动态和终身SLAM场景下相较ORB-SLAM2有显著的鲁棒性提升,而无需重新设计整个系统——而且难得的是,证明了这一方案可以部署在没有GPU的机器人上。它衔接了第3级的经典系统与第5级的学习特征研究(SuperPoint、HF-Net);许多生产系统正是遵循这种混合方案。

## 相关条目

- [ORB-SLAM2](orb-slam2.md)
- [HF-Net](../level-05-deep-learning/hf-net.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
- [NetVLAD](../level-05-deep-learning/netvlad.md)
- [Learned vs hand-crafted](../level-05-deep-learning/learned-vs-hand-crafted.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
