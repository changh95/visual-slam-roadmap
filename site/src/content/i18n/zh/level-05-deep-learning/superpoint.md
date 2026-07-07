# SuperPoint

> DeTone 2017 · [论文](https://arxiv.org/abs/1712.07629)

**一句话总结** — 一种通过Homographic Adaptation(单应自适应)训练的自监督兴趣点检测器与描述子,在一次约70 FPS的前向推理中为整张图像同时输出关键点和256维描述子。

## 问题

经典的检测器与描述子(SIFT、ORB)是手工设计的,在光照和视角变化下表现脆弱,而对关键点进行监督学习又受制于一个尴尬的事实:与人体关键点不同,"兴趣点"这一概念在语义上是不明确的,因此不存在可供标注的真值。基于图像块的学习型描述子还需要在检测结果周围进行裁剪,这阻碍了高效的全图推理。SuperPoint探讨的问题是:如何在*没有任何人工标签*的情况下,在真实图像上训练一个联合的检测器+描述子,并让全卷积模型在一次前向推理中计算出像素级的关键点和描述子。

## 方法与架构

**共享编码器,双头输出。** 一个VGG风格的编码器(八个3x3卷积层,通道数为64-64-64-64-128-128-128-128,配合三次2x2最大池化)将$H \times W$的图像映射为一个$H_c \times W_c$的"格子"网格,其中$H_c = H/8$,$W_c = W/8$。两个解码头共享这一表示:

- *兴趣点解码器*:计算$\mathcal{X}\in\mathbb{R}^{H_c\times W_c\times 65}$——64个通道对应每个8x8像素格子内的位置,再加一个"无兴趣点"的垃圾桶通道。逐通道softmax配合一个无参数的重塑操作(亚像素卷积)恢复出全分辨率的"点性"热力图,从而避免了上卷积的开销和棋盘格伪影。
- *描述子解码器*:计算半稠密的$\mathcal{D}\in\mathbb{R}^{H_c\times W_c\times 256}$,再通过双三次插值和L2归一化,得到任意像素处的单位长度描述子。

**合成预训练(MagicPoint)。** 检测器路径首先在*Synthetic Shapes*(合成形状)数据上训练——渲染出的四边形、三角形、直线、椭圆,其角点位置在构造上是明确无歧义的。在这份数据上,MagicPoint在成像噪声下达到0.971的mAP,相比之下FAST为0.061,Harris为0.213,Shi-Tomasi为0.157。

**Homographic Adaptation(单应自适应)。** 为了跨越合成数据与真实数据之间的差距,理想的检测器应对单应变换具有协变性,即${\bf x}=\mathcal{H}^{-1}f_{\theta}(\mathcal{H}(I))$。由于真实检测器并非完全协变,响应结果需要在$N_h$次随机单应变换上进行聚合:

$$\hat{F}(I;f_{\theta})=\frac{1}{N_{h}}\sum_{i=1}^{N_{h}}\mathcal{H}_{i}^{-1}f_{\theta}(\mathcal{H}_{i}(I))$$

以$N_h=100$运行(超过此值收益递减:100次变换时可重复性提升21%,1000次时提升22%),在8万张240x320的MS-COCO图像上迭代运行两次,由此产生用于自监督训练的伪真值关键点——整个过程无需任何人工标签。

**联合训练损失。** 具有已知单应变换$\mathcal{H}$的图像对同时监督两个头:

$$\mathcal{L}(\mathcal{X},\mathcal{X}',\mathcal{D},\mathcal{D}';Y,Y',S)=\mathcal{L}_{p}(\mathcal{X},Y)+\mathcal{L}_{p}(\mathcal{X}',Y')+\lambda\mathcal{L}_{d}(\mathcal{D},\mathcal{D}',S)$$

$\mathcal{L}_p$是针对每个格子在65个类别上的交叉熵。描述子的铰链损失使用对应关系标签$s_{hwh'w'}=1$(当变换后的格子中心落在8个像素范围内时成立),边距设为$m_p=1$,$m_n=0.2$:

$$l_{d}({\bf d},{\bf d}';s)=\lambda_{d}\, s\,\max(0,m_{p}-{\bf d}^{T}{\bf d}')+(1-s)\max(0,{\bf d}^{T}{\bf d}'-m_{n})$$

其中$\lambda_d=250$用于平衡稀少的正样本与大量的负样本,$\lambda=0.0001$用于平衡两个损失项。

## 实验结果

- **运行速度**:在480x640图像上(Titan X),单次前向推理约需11.15毫秒,加上CPU端约1.5毫秒的描述子采样——总计约13毫秒,即**70 FPS**。
- **HPatches可重复性**(240x320,300个点,NMS=4):在57个光照变化场景中,SuperPoint为0.652——所有方法中最优,相比Harris的0.620,FAST/MagicPoint的0.575;在59个视角变化场景中为0.503,与FAST(0.503)相当,低于Harris(0.556)但远高于MagicPoint(0.322)——Homographic Adaptation带来了视角鲁棒性。
- **HPatches单应估计**(1000个点,480x640):在$\epsilon=3$下正确率为0.684,相比SIFT为0.676,LIFT为0.598,ORB为0.395。SuperPoint在描述子指标上占据主导:NN mAP为0.821,匹配得分为0.470,相比SIFT的0.694/0.313。得益于亚像素级精细化,SIFT在亚像素精度上仍保持优势($\epsilon=1$:0.424 vs 0.310)。
- ORB的原始可重复性最高,但其聚集式的检测结果导致单应估计效果最差——单靠可重复性并不能造就好的匹配器。

## 对SLAM的意义

SuperPoint成为深度SLAM时代*事实上的*学习型局部特征:在ORB失效的光照和视角变化场景下依然稳健,同时速度足够快,可用于实时前端。它是SuperGlue/LightGlue以及hloc定位生态系统所依赖的标准骨干网络,并已被植入类ORB-SLAM的系统中(例如DXSLAM在经典管线中使用了学习型特征)。Homographic Adaptation本身也成为几何学习领域广泛复用的自监督方案。

## 动手实践

- [深度学习局部特征检测](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_04)

## 相关条目

- [SuperGlue](superglue.md) — 建立在SuperPoint特征之上的GNN匹配器
- [R2D2](r2d2.md) — 具有可靠性感知的替代检测器/描述子
- [DISK](disk.md) — 通过强化学习训练的替代方案
- [XFeat](xfeat.md) — 面向边缘设备的轻量级后继方案
- [hloc](hloc.md) — 以其为基础的定位生态系统
- [DXSLAM](../level-03-monocular-slam/dxslam.md) — 在经典SLAM系统中使用学习型特征
