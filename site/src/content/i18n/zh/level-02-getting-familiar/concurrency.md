# 并发

实时 SLAM 系统会大量利用并行性：约 33 ms（30 Hz）的单帧预算必须覆盖特征提取、匹配、优化和地图维护。SLAM 中的并发存在于多个层次，从指令级的 SIMD 到多线程架构，再到 GPU 卸载计算。

## SIMD：SSE/AVX/Neon

**SIMD**（单指令多数据）指令能在一条指令中处理 4 到 16 个数值：x86 上的 SSE/AVX，ARM 上的 **Neon**（也就是大多数机器人、手机和嵌入式板卡所使用的架构）。特征级别的图像处理是这一技术的经典受益者 —— ORB 描述子的计算与匹配在 ARM 上借助 Neon 内建指令能获得显著提速。最典型的例子是二值描述子之间的汉明距离计算，这是 ORB 匹配的内层循环：

```cpp
// Hamming distance of two 256-bit ORB descriptors: XOR + popcount
int hamming(const uint64_t* a, const uint64_t* b) {
    int d = 0;
    for (int i = 0; i < 4; ++i)
        d += __builtin_popcountll(a[i] ^ b[i]);  // 64 bits per instruction
    return d;
}
```

Eigen 和 OpenCV 等库在内部会使用 SIMD，但 SLAM 前端的热点循环往往需要手动向量化。

## OpenMP

**OpenMP** 通过编译器 pragma 提供粗粒度的 CPU 并行：

```cpp
#pragma omp parallel for
for (int i = 0; i < num_cells; ++i) {
    extractFeatures(image_grid[i]);   // per-patch feature extraction
}
```

它非常适合数据并行的工作，例如在图像块上并行化特征提取、逐点残差计算，或双目匹配的逐行处理 —— 只需一行代码，无需显式的线程管理。只有当各次迭代相互独立、且每次迭代的工作量足够大以摊平线程创建/汇合的开销时，它才会有实际收益。

## CUDA

**CUDA** 面向 NVIDIA GPU 上的大规模并行工作负载：稠密深度估计、神经网络推理，以及稠密体素建图（KinectFusion 的 TSDF 融合正是为 GPU 设计的）。其权衡在于主机-设备内存传输开销以及额外的部署复杂度 —— 如果一个阶段在 CPU 上只需 2 ms，而往返拷贝就要花费 3 ms，那么在 GPU 上花 0.5 ms 完成它可能并不值得。在将某个阶段迁移到 GPU 之前应先做性能剖析，一旦迁移，就应让数据在整个流水线各阶段之间始终驻留在设备端。

## 多线程 SLAM 架构

除了数据并行之外，SLAM 系统还被组织为并发的流水线：跟踪（时间关键、每帧执行）和建图（后台执行、按关键帧执行）分别使用独立的线程。ORB-SLAM3 使用三个线程 —— 跟踪、局部建图和回环检测 —— 在互斥锁的保护下共享地图。这种分离方式继承自 PTAM，可以说是实时 SLAM 中最具影响力的单一架构思想。

关键技能是 C++ 的并发基础原语及其规范化的使用方式：

```cpp
std::mutex map_mutex;

// Tracking thread: brief, fine-grained locking
{
    std::lock_guard<std::mutex> lock(map_mutex);
    local_points = map.getLocalPoints(current_pose);  // copy out, then unlock
}
trackAgainst(local_points);  // heavy work happens outside the lock
```

- **锁粒度**：只在访问共享状态时持有互斥锁，绝不在计算过程中持有；复制出跟踪线程所需的数据后立刻释放锁。
- **条件变量/队列**：生产者-消费者式的帧队列将相机驱动与跟踪解耦，并吸收抖动。
- **数据竞争**：对正在被局部BA修改的地图进行无保护读取，会以看起来像"随机发散"的方式破坏状态 —— 线程消毒器（`-fsanitize=thread`）是你的好帮手。

## 常见陷阱

- **粗粒度全局锁**：一个庞大的地图互斥锁会把跟踪和建图串行化，悄无声息地抵消线程分离带来的好处。
- **过度订阅**：OpenMP、TBB（OpenCV 内部使用）以及你自己的线程各自在同样的 4 个核心上生成线程池，会导致资源争抢；应在全局层面统筹线程预算。
- **伪共享（False sharing）**：多个线程写入同一缓存行上相邻的数组元素会导致扩展性很差；应通过填充或按块划分来避免。
- **测试中的不确定性**：线程调度会使运行结果不可复现；设计回归测试时应留出容差，并提供单线程模式用于调试。

## 对SLAM的意义

论文原型与可部署 SLAM 系统之间的差距，通常在于工程实现的吞吐量，而不是算法本身的新颖性：同样的数学原理，配合 SIMD 描述子、OpenMP 前端和恰当解耦的线程架构，运行速度可以快 10 倍。在功耗预算紧张的嵌入式平台上，充分利用 Neon 和 GPU 往往是达到实时性能的唯一途径。

## 动手实践

- [SIMD acceleration hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part5_ch03_06)
- [CUDA acceleration hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part5_ch03_08)

## 相关条目

- [C++](cpp.md)
- [Edge deployment](edge-deployment.md)
- [Mobile](mobile.md)
- [PTAM](../level-03-monocular-slam/ptam.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
