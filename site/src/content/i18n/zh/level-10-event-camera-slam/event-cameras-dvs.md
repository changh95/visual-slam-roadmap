# Event cameras (DVS)

事件相机，即动态视觉传感器（Dynamic Vision Sensor, DVS），是一种仿生相机，其中每个像素都独立且异步地工作。它不以固定速率捕捉完整的亮度帧，而是每个像素持续监测其位置处的**对数亮度**，一旦变化超过对比度阈值就会触发一个*事件*。其输出不是一系列图像，而是一个稀疏、连续的事件流，具有微秒级的时间分辨率。

## 事件生成模型

每个事件是一个元组

$$e_k = (\mathbf{x}_k, t_k, p_k)$$

其中 $\mathbf{x}_k = (u_k, v_k)$ 是像素坐标，$t_k$ 是时间戳（微秒级分辨率），$p_k \in \{+1, -1\}$ 是极性——表示亮度是增大还是减小。触发条件为：

$$
\Delta L(\mathbf{x}, t) = L(\mathbf{x}, t) - L(\mathbf{x}, t_{\text{last}}) \geq +C \;\Rightarrow\; p = +1
$$
$$
\Delta L(\mathbf{x}, t) = L(\mathbf{x}, t) - L(\mathbf{x}, t_{\text{last}}) \leq -C \;\Rightarrow\; p = -1
$$

其中 $L = \log$ 亮度，$C \approx 0.1$–$0.5$ 是传感器固件中设定的对比度阈值。由于比较是在对数空间中进行的，传感器响应的是*相对*亮度变化，这正是其具有巨大动态范围的原因。

## 事件从何而来？移动的边缘

在很小的时间间隔内，某像素处的亮度变化可以通过对亮度恒定假设进行线性化来很好地近似：

$$\Delta L(\mathbf{x}) \approx -\nabla L(\mathbf{x}) \cdot \mathbf{v}(\mathbf{x})\, \Delta t$$

即变化量等于图像梯度与光流的点积。对这一方程的两种解读推动了基于事件视觉领域的大部分研究：

- **事件在移动的亮度边缘处触发。**在 $\nabla L = 0$（无纹理区域）或 $\mathbf{v} = 0$（无相对运动）的地方，不会触发任何事件。事件流本质上是场景边缘随运动变化的一段影片。
- **事件可以由梯度加运动来预测。**给定一张亮度图像和一个运动假设，可以*预测*事件模式——这正是EKLT用于特征跟踪、EDS用于直接对齐所利用的生成模型，也是运动估计中对比度最大化方法的基础。

## 设计带来的实际影响

- **数据是运动驱动的**：静止相机拍摄静止场景（几乎）不产生任何输出。这对功耗/带宽是一个优点，但对SLAM来说却是一个问题——参见[Challenges](challenges.md)。
- **没有全局快门，没有曝光时间**：不存在帧，因此不存在运动模糊；每个事件都精确记录了一条边缘穿过某像素的确切时刻。
- **异步输出**：不存在天然的"帧率"——算法必须逐个处理事件，或将其聚合为一种中间表示（参见[Event representations](event-representations.md)）。
- **噪声是真实存在的**：真实传感器会产生虚假事件，且有效阈值 $C$ 在不同单元之间以及随温度变化而变化——这是任何实际部署系统都需要考虑的标定问题。

## 帧相机与事件相机对比

| 特性 | 帧相机 | 事件相机（DVS） |
|---|---|---|
| 输出 | 固定速率下的完整图像 | 稀疏异步事件流 |
| 时间分辨率 | 约10–100毫秒 | 约1微秒 |
| 动态范围 | 约60 dB | 140 dB以上 |
| 运动模糊 | 有（曝光造成） | 无 |
| 绝对亮度 | 有 | 无（仅有变化量） |
| 数据速率 | 恒定（分辨率×帧率） | 随场景活跃程度变化 |

## 硬件现状

常见硬件包括iniVation的DAVIS系列以及Prophesee的Metavision传感器（包括由索尼代工的IMX636系列）。**DAVIS**的设计对SLAM尤为重要，因为它在同一块芯片上通过共享光学系统，将DVS与标准帧传感器（APS）以及IMU集成在一起——从单一设备提供完全对齐的事件、帧和惯性数据。这正是Ultimate-SLAM这类融合系统以及EKLT这类混合跟踪器所依赖的硬件前提。

对于没有硬件条件想要入门的读者：Gallego 2020综述是标准读物，Event Camera Dataset以及MVSEC/DSEC是标准基准数据集，而诸如ESIM和v2e这样的仿真器可以从普通视频生成合成事件数据——这也是DEVO等学习式系统所采用的训练数据获取路径。社区维护的Awesome-Event-based-Vision仓库对以上所有资源都做了索引。

## 对SLAM的意义

事件相机恰好能应对基于帧的视觉SLAM会失效的那些情形：快速运动（运动模糊）、高动态范围场景（饱和）以及弱光环境。其微秒级延迟还使状态估计能够以远超30-60 Hz的速率运行，这对四旋翼这类敏捷机器人尤为重要。然而，其完全不同的输出格式意味着经典的SLAM前端无法直接应用——围绕这种传感器，必须开发出一整套全新的算法家族（EVO、ESVO、EKLT、Ultimate-SLAM、DEVO）。

## 相关条目

- [Advantages](advantages.md)
- [Challenges](challenges.md)
- [Event representations](event-representations.md)
- [Event-based Vision Survey](event-based-vision-survey.md)
- [EVO](evo.md)
- [Camera device](../level-02-getting-familiar/camera-device.md)
