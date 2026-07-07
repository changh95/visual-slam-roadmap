# C++

C++ 是 SLAM 的主力语言。你在后续层级中会研究的几乎每一个系统 —— ORB-SLAM、DSO、VINS-Mono、KinectFusion —— 都是用 C++ 编写的，因为 SLAM 必须在资源受限的硬件上实时处理相机帧、IMU 数据包和优化问题。在这一层级，"掌握 C++"意味着能够熟练运用 SLAM 代码库所使用的特定语言习惯和工具链，而不仅仅是掌握语法。

**现代 C++（C++11/14/17/20）。** SLAM 代码的生死存亡都系于现代语言习惯：基于范围的 for 循环、`auto`、lambda 函数、`std::thread`、智能指针以及移动语义。移动语义尤其重要，因为 SLAM 会传递大型对象（图像、点云、描述子矩阵），在热点循环中承受不起意外的深拷贝。

**面向对象编程与设计模式。** SLAM 系统由多个相互交互的模块构成 —— 跟踪器、局部建图器、回环检测器、地图数据库 —— 它们在多个线程之间共享状态。理解继承与组合的取舍、传感器抽象所用的接口，以及常见的设计模式（地图数据库用单例模式，传感器驱动用工厂模式，发布/订阅式回调用观察者模式），能让像 ORB-SLAM 这样的大型代码库变得可读。

**数据结构与算法。** 你会不断地在复杂度上进行权衡：用于最近邻搜索的 kd-树和哈希网格，用于关键帧筛选的优先队列，用于共视关系和位姿图结构的图。选择合适的容器（`std::vector` 还是 `std::unordered_map`）会对帧率产生明显的影响。

**编译器与构建系统。** 实际项目通常用 CMake 来驱动 Make 或 Ninja 构建。你需要能够阅读和编写 `CMakeLists.txt`，用于查找 Eigen/OpenCV、设置优化标志（`-O3`、`-march=native`），以及管理第三方子模块。一个面向 SLAM 的最小 `CMakeLists.txt` 示例：

```cmake
cmake_minimum_required(VERSION 3.16)
project(my_vo)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_BUILD_TYPE Release)          # forget this and everything is "slow"

find_package(OpenCV REQUIRED)
find_package(Eigen3 REQUIRED)

add_executable(vo main.cpp)
target_link_libraries(vo ${OpenCV_LIBS} Eigen3::Eigen)
```

大致了解编译器做了什么（内联、向量化、debug 与 release 构建的区别），可以解释为什么一个"运行很慢"的 SLAM 系统往往只是一个 debug 构建而已。

**C++ 中的 OpenCV。** OpenCV 是默认的图像处理层：图像的读取与去畸变、特征检测（`cv::ORB`、`cv::SIFT`）、匹配（`cv::BFMatcher`、`cv::FlannBasedMatcher`）、位姿估计（`cv::solvePnP`）以及标定（`cv::calibrateCamera`）。一个最小的特征处理流程大致如下：

```cpp
cv::Ptr<cv::ORB> orb = cv::ORB::create(2000);
std::vector<cv::KeyPoint> kps;
cv::Mat desc;
orb->detectAndCompute(img, cv::noArray(), kps, desc);

cv::BFMatcher matcher(cv::NORM_HAMMING);
std::vector<cv::DMatch> matches;
matcher.match(desc_prev, desc, matches);
```

## 真实 SLAM 系统中的并发

实时 SLAM 系统会在多个粒度上大量利用并行性：

- **多线程** —— 为时间关键的跟踪和后台的建图分别使用独立的线程。ORB-SLAM3 使用三个线程：跟踪、局部建图和回环检测。地图是共享状态，因此互斥锁和谨慎的所有权规范是架构本身的一部分，而不是事后的补救措施。
- **SIMD（x86 上的 SSE/AVX，ARM 上的 Neon）** —— 每条指令处理 4 到 16 个浮点数；描述子计算与匹配（例如在 ARM 上借助 Neon 内建指令实现的 ORB）是这一技术的经典受益者。
- **OpenMP** —— 通过 `#pragma omp parallel for` 实现粗粒度的 CPU 并行，适合在图像区域或金字塔层级上并行化特征提取。
- **CUDA** —— 面向稠密深度估计、神经网络推理以及稠密建图（KinectFusion 风格的 TSDF 融合）的 GPU 编程。

## 常见陷阱

- **Debug 构建。** 对大量使用 Eigen 的代码进行未优化的构建，速度会比 `-O3` 慢得多；在断定一个系统不具备实时能力之前，务必先检查 `CMAKE_BUILD_TYPE`。
- **Eigen 对齐与版本混用。** 在堆分配的类中，固定大小、可向量化的 Eigen 成员需要对齐分配（`EIGEN_MAKE_ALIGNED_OPERATOR_NEW`），而链接针对不同 Eigen 版本构建的库会导致隐蔽的崩溃 —— 这也是 SLAM 项目普遍附带 Dockerfile 的一大原因。
- **`cv::Mat` 的浅拷贝语义。** 赋值和拷贝构造会共享底层缓冲区；当你需要一个独立的副本时要使用 `.clone()`，并清楚在多线程流水线中自己到底需要哪一种。
- **对 Eigen 表达式使用 `auto`。** Eigen 构建的是惰性表达式模板；用 `auto` 捕获它们可能会产生指向临时对象的悬空引用。有疑虑时应赋值给一个具体的矩阵类型。
- **对地图的数据竞争。** 跟踪器读取地图的同时，建图器正在插入/剔除地图点，这是 SLAM 中典型的竞态条件；在自己动手编写代码之前，先研究一下 ORB-SLAM 是如何保护地图访问的。

## 对SLAM的意义

上面每一个层级都假定你能够阅读、构建并修改一个中等规模的 C++ 代码库。复现一篇论文通常意味着克隆一个 C++ 仓库，针对你本地的 Eigen/OpenCV 版本修复其 CMake 构建，并对耗时瓶颈进行性能剖析。C++ 的熟练程度也正是让你从*使用* SLAM 系统迈向*改造* SLAM 系统的关键 —— 无论是替换特征检测器、增加一个传感器，还是通过多线程或 SIMD 来优化性能瓶颈。

## 动手实践

- [Basic C++ programming](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_02)
- [Building C++ libraries](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_03)
- [C++ CPU profiler](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_04)
- [C++ memory profiler](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_05)

## 相关条目

- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [OpenCV](opencv.md)
- [C++/Python interop](cpp-python-interop.md)
- [Concurrency](concurrency.md)
- [Git/GitHub](git-github.md)
