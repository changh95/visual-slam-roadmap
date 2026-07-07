# C++/Python interop

现代 SLAM 研究生活在两个世界之间：性能关键的估计代码用 C++ 编写，而实验、深度学习和评估工作则在 Python 中进行。C++/Python interop（互操作）就是二者之间的桥梁 —— 你把一个 C++ 核心封装为 Python 绑定，这样同一个跟踪器或优化器就可以从 notebook 中驱动、与 PyTorch 模型结合使用，或用 Python 工具进行基准测试，而无需重写任何代码。

**PyBind11** 是编写这类绑定事实上的标准。它是一个仅含头文件的 C++ 库，能以极少的样板代码把 C++ 类和函数暴露为 Python 模块：

```cpp
#include <pybind11/pybind11.h>
#include <pybind11/eigen.h>   // automatic Eigen <-> NumPy conversion

Eigen::Matrix4d track(const Eigen::Matrix4d& T_prev, const cv::Mat& img);

PYBIND11_MODULE(myslam, m) {
    m.def("track", &track, "Track one frame and return the new pose");
}
```

`pybind11/eigen.h` 头文件会自动在 `Eigen` 矩阵和 NumPy 数组之间进行转换，这正是 SLAM 代码所需要的：位姿、点云和雅可比矩阵可以以数组的形式跨越语言边界，无需手写任何拷贝代码。你会用到的许多库都是以这种方式封装的 —— GTSAM 提供了官方的 Python 封装，而 COLMAP 的 `pycolmap` 之类的项目也遵循同样的模式。

封装整个系统（而不是自由函数）的方式如下所示 —— 注意其中的 GIL 保护，这正是让多线程的 SLAM 核心在 Python 等待时也能持续运行的关键：

```cpp
namespace py = pybind11;

py::class_<SlamSystem>(m, "SlamSystem")
    .def(py::init<const std::string&>())              // config file path
    .def("track", &SlamSystem::track,
         py::call_guard<py::gil_scoped_release>())    // release GIL during C++ work
    .def_property_readonly("map_points", &SlamSystem::mapPoints);
```

**nanobind** 是同一作者推出的后继项目，重新设计以降低绑定开销、缩小二进制体积并加快编译速度。它的 API 有意与 PyBind11 保持接近，因此相关知识可以直接迁移；对调用开销敏感的新项目（例如为逐特征或逐帧调用的小函数编写绑定）越来越多地选择 nanobind。

## 封装 SLAM 代码时需要理解的要点

- **所有权与生命周期** —— 在 C++ 线程与 Python 之间共享的 `Map` 对象由谁来释放；返回值策略（`return_value_policy::reference_internal` 与 `copy`）决定了 Python 端持有的是一个视图还是一个独立拥有的副本。
- **GIL** —— 长时间运行的 C++ 调用应像上面那样释放 Python 的全局解释器锁，这样后台的建图线程才能继续运行，Python 调用方也才能围绕核心进行多线程操作。
- **零拷贝视图** —— 将大缓冲区（图像、点云）以 NumPy 视图而不是拷贝的方式暴露出去，能让桥接的开销保持低廉；在 C++ 一侧接受 `Eigen::Ref<const Eigen::MatrixXd>` 或 `py::array_t`，以避免强制发生转换。
- **布局与数据类型不匹配** —— Eigen 默认按列主序存储，而 NumPy 默认按行主序存储，`float32` 与 `float64` 的不匹配会悄无声息地触发拷贝；如果每帧数据量很大，应对边界进行性能剖析。
- **构建与打包** —— CMake 中的 `pybind11_add_module` 加上一个 `pyproject.toml`（例如使用 scikit-build-core），能把整套东西变成一个可以 `pip install` 的软件包，这正是让 C++ SLAM 系统能在 CI 中使用、并能被合作者使用的关键。

## 常见陷阱

- 扩展模块与 Python 解释器或其他 C++ 依赖之间的编译器/ABI 不匹配会在导入时导致崩溃；应在一个一致的环境中构建所有东西（这也是 Docker 广受欢迎的另一个原因）。
- 异常必须跨边界转换 —— PyBind11 会把 `std::exception` 映射为 Python 异常，但自定义的错误类型需要显式注册。
- 调试是双面的：在 Python 进程上挂载 `gdb`/`lldb` 来调试 C++ 侧，并记住绑定中的段错误通常意味着生命周期bug，而不是 Python 的问题。

## 对SLAM的意义

该领域正在向混合系统方向汇聚：经典的 C++ 后端与运行在 Python/PyTorch 中的学习型前端（特征检测器、深度网络、匹配器）相结合。能够将一个 C++ 优化器绑定进 Python —— 或通过导出的模型从 C++ 中调用一个学习型匹配器 —— 正是让这类组合切实可行的关键。这同样也会改变你自己的 C++ 代码：一旦被封装，它就变得可脚本化、可用 pytest 进行单元测试，并可以借助 Python 工具方便地在数据集上进行评估。

## 动手实践

- [PyBind hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_08)

## 相关条目

- [C++](cpp.md)
- [Python](python.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [Edge deployment](edge-deployment.md)
