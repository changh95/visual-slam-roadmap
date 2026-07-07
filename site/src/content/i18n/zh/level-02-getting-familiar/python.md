# Python

C++运行着大多数SLAM系统的实时核心,但**Python**是环绕在这个核心周围一切事物所使用的语言。在典型的SLAM工作流中,你会将Python用于三件事：

- **深度学习**：PyTorch(及其相关工具)是以Python为先的。学习型特征(SuperPoint)、匹配器(SuperGlue/LightGlue)、单目深度估计,以及像DROID-SLAM这样的端到端系统,都是在Python中训练——通常也首先在Python中做原型验证。
- **分析与绘图**：NumPy用于数组运算,Matplotlib用于绘制轨迹和误差图,还有用于计算相对真值的ATE/RPE的评估工具。当SLAM运行出现异常时,一个能快速绘制轨迹、特征点数量或残差直方图的notebook往往是你手头最快的调试工具。
- **系统脚本与胶水代码**：数据集下载与转换、批量实验运行器、标定流水线、CI任务,以及用于非实时关键组件的ROS 2节点(`rclpy`)。

许多核心SLAM库都暴露了Python绑定,因此你可以在不接触C++的情况下对完整流水线进行原型开发：

| 库 | Python入口 |
|---|---|
| OpenCV | `opencv-python`(`cv2`) |
| GTSAM | 官方Python封装 |
| g2o | 社区绑定(例如g2opy) |
| Open3D | 原生Python API(点云、ICP、TSDF) |

一种常见且高效的模式是*先在Python中做原型,再移植到C++*：先用 `cv2` + NumPy在数据集上验证算法,一旦设计稳定下来,再将热点循环用C++/Eigen重新实现。对于必须保留在Python中的研究代码,pybind11可以让你封装性能关键的C++部分,同时将实验逻辑保留在Python中——兼得两者之长。

值得早早养成的实践习惯：为每个项目使用虚拟环境(venv/conda/uv),固定依赖版本以确保可复现性,并记住NumPy采用行主序惯例,而OpenCV图像的索引方式是 `[row, col]` = `[y, x]`——这是坐标转置错误的经典来源。

## Python中SLAM工具的一次小尝试

工具箱中最有用的单个脚本莫过于轨迹评估。用闭式最小二乘刚体对齐(Umeyama方法,基于SVD)将估计值与真值对齐,并计算ATE RMSE,用NumPy只需十几行代码：

```python
import numpy as np

def align_and_ate(P_est, P_gt):          # both Nx3
    mu_e, mu_g = P_est.mean(0), P_gt.mean(0)
    U, S, Vt = np.linalg.svd((P_gt - mu_g).T @ (P_est - mu_e))
    D = np.diag([1, 1, np.sign(np.linalg.det(U @ Vt))])
    R = U @ D @ Vt                        # rotation aligning est -> gt
    t = mu_g - R @ mu_e
    err = P_gt - (P_est @ R.T + t)        # residuals after alignment
    return np.sqrt((err ** 2).sum(1).mean())   # ATE RMSE
```

这基本上就是广泛使用的 `evo` 包(`pip install evo`)所做的事——在实践中,对于TUM/KITTI/EuRoC格式、绘图和RPE,建议直接使用 `evo`,但了解上面的数学原理能让它的输出不再是一个黑箱。

## 让Python足够快

Python的缓慢几乎完全是一个*循环*问题。以下是一些经验法则：

- **用NumPy向量化** ——变换10万个点是一次矩阵乘法(`(R @ pts.T).T + t`),而不是一个 `for` 循环;差异通常是100倍。
- **了解GIL何时会成为瓶颈** ——Python线程无法并行化CPU密集型的纯Python代码;NumPy/OpenCV调用会释放GIL,而 `multiprocessing` 可以绕开它用于批量实验。
- **先分析再优化** ——`cProfile` 和逐行分析器通常会揭示出一个热点循环;只把那一处移入NumPy、Numba或一个小型pybind11扩展中,而不是把所有代码都移植过去。
- **留意数据类型** ——不小心使用 `float64` 会使内存流量翻倍(相较于 `float32`);以 `uint8` 到达的图像数组在算术运算下会悄悄溢出(`img1 - img2` 会发生回绕)。

## 常见陷阱

- **坐标/布局混淆** ——`img[y, x]`,而 `pts` 却是 `(x, y)`：OpenCV在其API中混用了这两种约定(参见OpenCV相关条目)。
- **视图别名与复制的混淆** ——NumPy切片返回的是*视图*;修改切片会修改原始数组。想要得到副本时请使用 `.copy()`。
- **环境腐化** ——`opencv-python` 与 `opencv-contrib-python` 的冲突,CUDA/PyTorch版本不匹配;每个项目使用一个固定版本的环境文件,可以避免长达一周的调试。
- **四元数约定** ——不同库对 `(w, x, y, z)` 与 `(x, y, z, w)` 的顺序有不同约定(例如SciPy使用 `xyzw`);顺序错误产生的旋转会微妙地出错,而不是明显地崩溃。

## 对SLAM的意义

现代SLAM研究处于几何与学习的交汇处,而学习那一半说的是Python。即便对于经典系统,评估、可视化和数据集处理的工具生态也是基于Python的;熟练掌握它能让你在运行实验、理解你的C++系统究竟在做什么方面显著更高效。

## 动手实践

- [Python基础编程](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_07)

## 相关条目

- [C++](cpp.md)
- [C++/Python互操作](cpp-python-interop.md)
- [OpenCV](opencv.md)
- [Bash/Linux](bash-linux.md)
