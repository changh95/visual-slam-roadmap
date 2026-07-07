# FutureMapping 2

> Davison 2019 · [论文](https://arxiv.org/abs/1910.14139)

**一句话总结** — FutureMapping的教程式后续论文，将因子图上的高斯信念传播（Gaussian Belief Propagation）发展为空间人工智能的核心分布式算法，推导了完整的信息形式消息传递方程，并通过代码在表面重建与增量SLAM仿真上进行了演示。

## 问题

FutureMapping 1提出了愿景；本文则提供了算法实质。标准SLAM后端（g2o、GTSAM、Ceres）通过集中式全局求解来解决因子图推断问题，这与智能机器人和设备在真实产品约束下所需的分布式、增量式、常开的估计方式不太契合——也与新兴图处理器不匹配，后者的存储与计算分布在数千个核心上。本文论证GBP"具备恰当的特性"以适应这一未来：完全局部化的计算与存储、任意的消息调度顺序，以及对图的轻松动态修改。

## 方法与架构

GBP是一种循环信念传播（loopy belief propagation），其中所有消息和信念均为高斯分布，并保持在**信息形式**下 $\eta = \Lambda\mu$（信息向量与精度矩阵），这种形式能处理秩不足、无约束的变量，并使高斯分布的乘积简化为参数的简单加法。一个编码测量值 $\mathbf{z}_s$、模型为 $\mathbf{h}_s$、测量精度为 $\Lambda_s$的因子为

$$f_s(\mathbf{x}_s) = K \exp\left( -\tfrac{1}{2} (\mathbf{z}_s - \mathbf{h}_s(\mathbf{x}_s))^{\top} \Lambda_s (\mathbf{z}_s - \mathbf{h}_s(\mathbf{x}_s)) \right).$$

**线性化。** 使用雅可比矩阵 $\mathrm{J}_s$，将一个非线性因子在锚点 $\mathbf{x}_0$ 附近转化为局部高斯分布：

$$\eta_s = \mathrm{J}_s^{\top}\Lambda_s\left( \mathrm{J}_s\mathbf{x}_0 + \mathbf{z}_s - \mathbf{h}_s(\mathbf{x}_0) \right), \qquad \Lambda_s' = \mathrm{J}_s^{\top}\Lambda_s\mathrm{J}_s,$$

这恰恰是高斯-牛顿步骤的构成要素，但被保持在因子内部的局部范围，并可按需（频繁或很少）重新线性化。

**变量到因子的消息**只是所有其他输入消息的求和：$\eta_{ms} = \sum_{l} \eta_{ml}$ 以及 $\Lambda_{ms} = \sum_{l} \Lambda_{ml}$，对 $\mathbf{x}_m$ 的邻居（除目标因子 $f_s$外）求和。**因子到变量的消息**将输入消息加到因子参数的分块部分上（条件化），重新排序使输出变量排在最前，并用标准的信息形式舒尔补（Schur complement）将其余部分边缘化：

$$\eta_{M\alpha} = \eta_\alpha - \Lambda_{\alpha\beta}\Lambda_{\beta\beta}^{-1}\eta_\beta, \qquad \Lambda_{M\alpha} = \Lambda_{\alpha\alpha} - \Lambda_{\alpha\beta}\Lambda_{\beta\beta}^{-1}\Lambda_{\beta\alpha}.$$

代价最高的局部运算是小矩阵求逆 $\Lambda_{\beta\beta}^{-1}$——对于一元/二元因子，其维度最多是单个变量的维度。在树（链）图上，GBP在每个方向各扫描一次即可得到精确解；在SLAM的循环图上，它通过迭代得到良好的近似解，作者发现其收敛性"惊人地不依赖于"消息调度顺序——正是这一特性使得每个节点可以运行在各自独立的核心或设备上。

**鲁棒因子。** M估计器通过纯局部计算被融入其中：计算因子的马氏距离 $M_s$；若其超过阈值 $N_\sigma$（Huber从二次到线性过渡的分界点），则在本次消息传递中，将该因子的 $\eta_s$ 和 $\Lambda_s'$ 按以下比例重新缩放

$$k_R = \frac{2N_\sigma}{M_s} - \frac{N_\sigma^2}{M_s^2},$$

使该消息携带具有等效能量的高斯分布的精度（阈值之外为常数的核函数则使用 $k_R = N_\sigma^2/M_s^2$）。这产生了"懒惰的数据关联"：一个因子的内点/外点状态会随着证据的积累而不断变化。

**带代码的示例**：1D表面重建，包含插值高度测量和成对平滑因子（一个无环的链，可精确求解）；2D约束图；以及一个交互式的增量2D SLAM仿真（`bpslam.py`），包含里程计和地标因子，当机器人添加新的变量和因子时，消息传递只需简单地继续下去——即便在回环闭合时也无需批量重新求解。先验、弱锚点以及动态编辑的因子强度会自动在图中传播。

## 实验结果

本文是一篇教程性论文，其评估是仿真实验，以定性方式呈现：在增量SLAM仿真中，GBP的估计结果与批量求解结果一致，并能从容应对动态变化的图（包括回环闭合）。当1/50的测量被大误差污染且所有测量都采用Huber因子时，GBP以局部、懒惰的方式检测异常值——错误的测量往往要到很久之后，随着足够支持某个更优假设的证据积累起来，才会被识别出来。收敛之后改变因子精度可以迅速传播，无需任何全局协调。完整的推导过程和仿真图请参见原论文。

## 对SLAM的意义

这是SLAM研究者了解GBP的标准入门读物，它催生了展示出真实加速效果的后续工作（在Graphcore的IPU上做光束法平差）以及去中心化的多机器人推断（DANCeRS）。其核心承诺——无需集中式求解器的因子图SLAM——与多机器人系统以及未来AR设备中最终会搭载的任何大规模并行硬件都直接相关。

## 相关条目

- [FutureMapping 1](futuremapping-1.md) — 本文所论证的愿景性论文
- [BA on Graph Processor](ba-on-graph-processor.md) — GBP光束法平差在IPU上的首次具体演示
- [DANCeRS](dancers.md) — 通过GBP实现的多机器人分布式共识
- [Factor graph](factor-graph.md) — GBP所操作的表示形式
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md) — GBP所取代的集中式表述方式
