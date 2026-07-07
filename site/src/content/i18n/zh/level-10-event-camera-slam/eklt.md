# EKLT

> Gehrig 2020 · [论文](https://rpg.ifi.uzh.ch/docs/IJCV19_Gehrig.pdf)

**一句话总结** —— EKLT把Lucas-Kanade(KLT)风格的特征跟踪引入事件相机:特征在标准帧上初始化,然后在帧之间通过事件进行异步跟踪,依靠一个在最大似然框架下的生成式事件模型实现,得到的是可直接接入传统基于特征流水线的高速率、无模糊轨迹。

## 问题

KLT跟踪是基于特征的VO/VIO的核心前端:它通过在亮度恒定假设下最小化光度误差,在连续帧之间跟踪特征patch。在高速运动下这会失效——特征在帧间移动多个像素,运动模糊破坏了patch的外观,最小化过程发散。事件以微秒级延迟触发且无模糊,恰好携带了帧间缺失的运动信号——但同一场景模式在不同运动方向下会产生*不同*的事件,因此在时间上建立事件对应关系十分困难。EKLT绕开了这个问题,把与运动无关的帧作为参照,把依赖运动的事件作为测量值。

## 方法与架构

一个理想的事件相机在像素 $\mathbf{u}_k$ 处的对数亮度 $L$ 变化达到对比度阈值 $\pm C$ 时,会触发一个事件 $e_k = (x_k, y_k, t_k, p_k)$:

$$\Delta L(\mathbf{u}_k, t_k) = L(\mathbf{u}_k, t_k) - L(\mathbf{u}_k, t_k - \Delta t_k) = p_k C,$$

其中极性 $p_k \in \{-1,+1\}$。在一个区间 $\tau$ 内累积极性,得到一张**观测到的亮度增量图** $\Delta L(\mathbf{u}) = \sum_{t_k \in \tau} p_k C\, \delta(\mathbf{u} - \mathbf{u}_k)$。对于较小的 $\tau$,生成式模型认为增量是由沿光流 $\mathbf{v}$ 移动的梯度引起的:

$$\Delta L(\mathbf{u}) \approx -\nabla L(\mathbf{u}) \cdot \mathbf{v}(\mathbf{u})\, \tau,$$

因此平行于边缘的运动不产生事件,而垂直于边缘的运动以最高速率产生事件。基于帧 $\hat{L}$(在 $t=0$ 时给定)在候选变形 $\mathbf{W}$ 下的**预测增量**为 $\Delta \hat{L}(\mathbf{u}; \mathbf{p}, \mathbf{v}) = -\nabla \hat{L}(\mathbf{W}(\mathbf{u};\mathbf{p})) \cdot \mathbf{v}\, \tau$。假设误差为高斯分布,最大似然估计退化为最小二乘配准;由于 $C$ 未知,EKLT在patch域 $\mathcal{P}$ 上比较*单位范数*的patch:

$$\min_{\mathbf{p},\mathbf{v}} \left\| \frac{\Delta L(\mathbf{u})}{\|\Delta L(\mathbf{u})\|} - \frac{\Delta \hat{L}(\mathbf{u};\mathbf{p},\mathbf{v})}{\|\Delta \hat{L}(\mathbf{u};\mathbf{p},\mathbf{v})\|} \right\|^2_{L^2(\mathcal{P})},$$

这样就抵消了 $C$ 和 $\tau$。变形是图像平面内的刚体运动,$\mathbf{W}(\mathbf{u};\mathbf{p}) = \mathrm{R}(\mathbf{p})\mathbf{u} + \mathbf{t}(\mathbf{p})$,$(\mathrm{R}, \mathbf{t}) \in SE(2)$,用Ceres优化求解。流水线为:在帧上检测Harris角点,提取强度patch和 $\nabla \hat{L}$;然后对每一个到来的事件,将其累积到它所触及的patch中;一旦某个patch积累了 $N_e$ 个事件,就对目标函数进行最小化以更新 $\mathbf{p}$ 和 $\mathbf{v}$,重置该patch,并重复该过程。因此跟踪是异步的——每当积累到 $N_e$ 个事件就会发生更新(通常约为帧率的10倍),且每个patch都独立地与自己的帧模板进行跟踪,具有隐式的逐像素数据关联(没有事件到特征的ICP对应关系)。监测最小代价可以检测跟踪丢失,并触发在新帧上的重新初始化。

## 实验结果

- **模拟数据**(事件相机模拟器,4个场景):平均跟踪误差约为0.4像素——0.20 px(sim_april_tags)、0.29 px(sim_3planes)、0.42 px(sim_rocks)、0.67 px(sim_3wall)——这是无噪声条件下的下限。
- **真实数据,8个序列**:shapes_6dof、checkerboard、boxes_6dof、poster_6dof(Event Camera Dataset)、pipe_2、bicycles、outdoor_day1(MVSEC)、outdoor_forward5(UZH-FPV),与四个基线方法比较(在Canny点集上的ICP、EM-ICP、在运动补偿事件帧上的KLT、在高通滤波重建图像上的KLT)。真值来自DAVIS帧上的KLT。
- 轨迹归一化误差:EKLT在全部八个序列上为0.64–1.21 px(例如poster_6dof为0.64,对比ICP的2.48、EM-ICP的3.10、KLT-MCEF的0.97、KLT-HF的1.18;boxes_6dof为0.72,对比ICP的4.59),在每个序列上的精度都优于所有基线。
- 在黑白场景中,EKLT的平均精度是ICP的两倍,轨迹长度也是其两倍;特征寿命与KLT-MCEF和KLT-HF基线相当。
- 发表于IJCV(2020年);"根据帧梯度预测事件、再与观测事件对齐"这一范式成为了事件跟踪器比较的标准基准(例如EKLT-VIO将其用作VIO前端)。

## 对SLAM的意义

EKLT是事件相机接入现有SLAM系统最实用的入口:它不替换整个流水线,而只升级特征跟踪器,把经典的VIO前端扩展到帧间KLT会跟丢的速度范围。它还在特征层面确立了"事件+帧是互补的"这一原则,同样的理念在估计器层面体现为Ultimate-SLAM,在直接法层面体现为EDS。

## 相关条目

- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [ESVIO](esvio.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Event cameras (DVS)](event-cameras-dvs.md)
