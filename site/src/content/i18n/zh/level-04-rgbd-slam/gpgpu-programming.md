# GPGPU 编程（CUDA / OpenGL GLSL）

**GPGPU（通用GPU）编程**利用图形处理器上数以千计的并行核心来执行非图形计算。稠密RGB-D SLAM是该领域的杀手级应用：像KinectFusion这样的流水线中的每一个阶段——逐像素深度滤波、逐体素TSDF融合、逐像素光线投射——都是对像素或体素的**易并行（embarrassingly parallel）**映射运算，正是GPU所擅长的。在CPU上根本无法实现30 Hz的实时稠密SLAM；一旦把这些循环搬到GPU上，它就变得可行了。

## CUDA 简介

CUDA（NVIDIA的GPGPU平台）把GPU暴露为一个由大量轻量级线程组成的网格，它们都运行同一个**核函数（kernel）**：

- **线程层级**：线程被组织成*线程块（block）*，线程块又组成*网格（grid）*。逐像素核函数通常以每个像素对应一个线程的方式启动；每个线程根据自己的block/thread索引计算出自己的坐标。
- **内存层级**：容量大但延迟高的*全局内存（global memory）*，用于block内数据复用的快速*共享内存（shared memory）*，以及每个线程独有的寄存器。性能的关键在于**合并（coalesced）**的全局内存访问（相邻线程读取相邻地址——这对图像来说是自然的），以及尽量减少跨越PCIe总线的主机-设备（CPU-GPU）数据传输。
- **执行模型**：线程以锁步（lock-step）的方式分组执行（*warp*）；一个warp内的分支发散会被串行化处理，因此逐像素代码应避免大量分支。

典型的SLAM核函数包括：深度图的双边滤波、由深度计算顶点图和法向图、TSDF融合（相机视锥内每个体素对应一个线程，将体素投影到深度图像中并更新加权滑动平均），以及为frame-to-model跟踪对TSDF进行光线投射。

**并行归约（parallel reduction）**是另一个关键模式：投影数据关联ICP通过对数十万个像素上的项 $J_i^T J_i$ 和 $J_i^T r_i$ 求和，来计算一个 $6 \times 6$ 的高斯-牛顿系统。每个线程计算其局部乘积；共享内存中的树形归约按block求和；最后一次汇总（或使用原子操作）合并各block的结果。只有这个很小的 $6 \times 6$ 系统会被拷回CPU并在那里求解。

## 作为计算载体的 OpenGL GLSL

在CUDA出现之前以及与之并存的时期，GPGPU是通过图形流水线并借助**GLSL着色器**来实现的，若干有影响力的RGB-D系统（尤其是**ElasticFusion**）就是这样编写的——它还有一个好处，即与CUDA不同，它是厂商中立的：

- 数据存放在**纹理（texture）**和顶点缓冲区中；计算被表达为渲染通道（rendering pass），其中**片元着色器（fragment shader）**对每个输出像素运行一次，将结果写入离屏的**帧缓冲对象（framebuffer object）**（"render-to-texture"），常常在多个通道之间在两个缓冲区间来回切换（ping-pong）。
- 面元图（surfel map）天然适合这一流水线：每个面元（位置、法向、半径、颜色、权重）就是一个顶点；将地图**splat（splatting）**到索引图/模型图中就是渲染操作；面元融合和剔除则作为对这些缓冲区的着色器通道来运行。
- 现代OpenGL还提供**计算着色器（compute shader）**，在不脱离GL生态的情况下弥补了与CUDA之间的大部分差距，而**CUDA-OpenGL互操作（interop）**则让CUDA核函数能够直接写入GL缓冲区，实现零拷贝可视化。

## 实践指南

- 让整个流水线常驻GPU；每帧只下载姿态和小矩阵。每帧对完整图像或体素体的主机-设备拷贝会抹去加速带来的收益。
- 先分析内存流量——大多数图像/体素核函数是带宽受限而非计算受限的。对于复用相邻像素的模板式核函数（双边滤波、法向计算），使用共享内存。
- 在GPU上使用图像金字塔：从粗到细的ICP/跟踪在多个分辨率上运行相同的核函数，以较低成本获得较大的收敛域。
- 注意数值精度：消费级GPU在`float`上远快于`double`；稠密SLAM流水线几乎全部以单精度运行，只在CPU端的求解器中在必要时保留双精度。
- 除了经典的稠密SLAM，同样的技能也支撑着立体深度估计网络、神经场建图以及任何学习型前端：CUDA是这一切的底层基础。

## 对SLAM的意义

- **KinectFusion**（CUDA）和**ElasticFusion**（GLSL）展示了两条GPGPU路线；理解两者能让你读懂并修改几乎所有稠密RGB-D SLAM代码库。
- GPU/CPU的分工是一个架构决策：在GPU上做稠密跟踪与建图，在CPU上做稀疏优化（位姿图、BA），这是标准的分工方式。
- 体素哈希、TSDF融合与光线投射之所以能实时运行，完全是因为GPU并行性——在这个领域，算法设计与GPGPU实现是不可分割的。

## 动手实践

- [CUDA加速动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part5_ch03_08)

## 相关条目

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [ICP](icp.md)
- [Concurrency](../level-02-getting-familiar/concurrency.md)
