# ESVIO

> Chen 2023 · [论文](https://arxiv.org/abs/2212.13184)

**一句话总结** —— ESVIO是第一个基于事件的*立体*视觉惯性里程计系统,紧耦合融合立体事件流、标准立体图像和IMU测量,以在激进运动和弱光条件下实现鲁棒的状态估计。

## 问题

事件相机低延迟、异步输出的特性(以及140 dB的动态范围,相较标准相机的约60 dB)非常适合在困难场景下进行状态估计,但大多数基于事件的VO都是单目的——立体事件视觉的研究还很少。设计空间中存在一个空缺:ESVO提供了不带IMU的立体事件里程计,而Ultimate-SLAM融合了事件、帧和IMU,但只支持单目。此外,类似图像的瞬时匹配方式无法直接应用于两路异步的事件流——时间偏差、噪声以及不同的对比敏感度会导致错误的立体对应关系。

## 方法与架构

该流水线有两种变体:**ESIO**(纯事件-惯性)和**ESVIO**(事件+图像辅助)。三个前端/后端阶段在闭环中相互作用:

1. **IMU辅助的运动补偿。** 每个事件 $e_k = \{l_k, t_k, p_k\}$ 都被扭转到参考时刻 $t_{ref}$,假设在短间隔 $\Delta t$ 内运动是匀速的,旋转用陀螺仪估计,平移用后端的速度估计:

$$ {}^{ref}\mathbf{R}_k = \exp\big((\tilde{\boldsymbol{\omega}}_k - \mathbf{b}_g - \mathbf{n}_g)\Delta t\big), \qquad {}^{ref}\mathbf{L}_k = {}^{ref}\mathbf{R}_k \mathbf{L}_k + \mathbf{v}_{ref}\Delta t, $$

其中 $\mathbf{L}_k$ 是像素位置的齐次坐标,$\mathbf{v}_{ref}$ 是后端速度。更好的状态估计能让补偿后的事件边缘更清晰,进而反过来改进下一次估计。

2. **空间与时间数据关联。** 经过补偿的事件会填充按极性分离的活动事件面(SAE),再转换为时间面(TS)。事件角点通过一种改进的Arc*检测器提取(维持100–200个特征,通过在TS上的最小距离掩码使其分布均匀)。特征在连续的左侧事件流之间进行*时间*跟踪,并在经过立体校正的左右时间面之间进行*瞬时*匹配,两者都使用正向-反向LK光流;深度通过带RANSAC异常值剔除的三角化恢复。

3. **基于图的后端。** 一个滑动窗口通过最小化以下目标,优化完整状态 $\boldsymbol{\chi} = [\mathbf{x}_{b_0}, \dots, \mathbf{x}_{b_n}, \mathbf{x}^b_e, \mathbf{x}^b_c, \boldsymbol{\Lambda}_{es}, \boldsymbol{\Lambda}_{et}, \boldsymbol{\Lambda}_c]$——即IMU状态(位置、四元数、速度、偏置)、相机-IMU外参,以及事件/图像特征的逆深度:

$$ \min_{\boldsymbol{\chi}} \Big( \sum_{k} \|\mathbf{r}_b\|^2_{\Omega_b} + \sum_{(l,k)} \|\mathbf{r}_{es}\|^2_{\Omega_{es}} + \sum_{(l,k)} \|\mathbf{r}_{et}\|^2_{\Omega_{et}} + \sum_{(l,k)} \|\mathbf{r}_c\|^2_{\Omega_c} \Big), $$

综合了IMU预积分残差 $\mathbf{r}_b$、**空间**事件残差 $\mathbf{r}_{es}$(通过逆深度 $\lambda_{es}$ 和外参 $\mathbf{T}^{le}_{re}$,将特征从右事件相机重投影到左事件相机)、**时间**事件残差 $\mathbf{r}_{et}$(通过机体位姿 $\mathbf{T}^w_{b_i}, \mathbf{T}^{b_k}_w$,在第 $i$ 帧和第 $k$ 帧左侧事件流之间重投影)以及标准相机残差 $\mathbf{r}_c$。

## 实验结果

- **自采集HKU数据集**(两个DAVIS346,6 cm基线,立体事件60 Hz,帧30 Hz,IMU 1000 Hz,VICON真值;激进运动和HDR):ESVIO达到平均MPE 0.14% / MRE 0.033°/m,而ORB-SLAM3立体VIO为0.16% / 0.12°/m,VINS-Fusion为0.76% / 0.38°/m,USLAM单目EIO为5.06% / 1.05°/m,PL-EVIO为0.26% / 0.41°/m。ESIO达到0.89%,经运动补偿的ESIO+达到0.66%。ORB-SLAM3和VINS-Fusion在hku_agg_walk(运动模糊)上失败;ORB-SLAM3在hku_dark_normal上失败;EVO和ESVO在所有序列上都失败。
- **公开数据集**:首次在VECtor上报告结果(例如robot-fast达到0.20%,而VINS-Fusion、EVO、ESVO均失败),并在MVSEC室内飞行数据上取得优异结果(例如flying 1/3上MPE为0.94% / 0.47%,而PL-EVIO为1.35% / 0.64%);低纹理的units-dolly/scooter对所有纯视觉方法仍然困难。
- **实时性**:在i7-1260P NUC上,346×260分辨率下前端10.44 ms、后端19.30 ms(640×480下为35.69 / 35.59 ms)。
- **机载四旋翼飞行**:以ESVIO作为唯一的位姿反馈进行闭环飞行;在一次56.0 m的HDR飞行中,ATE RMSE为0.17 m,平均相对平移误差约为0.1 m;大规模室外与驾驶序列证明了长期运行能力。

## 对SLAM的意义

ESVIO完成了事件SLAM传感器融合谱系的拼图:它证明了立体+事件+帧+IMU的完整组合在真实空中平台上是可行的,恰恰是在传感器本就为之设计的黑暗与快速条件下。它是继ESVO和Ultimate-SLAM之后一个自然的研究对象,而其开源发布(HKU ArcLab)使其成为后续事件VIO工作常用的基线。

## 相关条目

- [ESVO](esvo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)
