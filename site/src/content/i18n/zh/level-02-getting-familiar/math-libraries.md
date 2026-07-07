# 数学库

四个库构成了几乎所有C++ SLAM系统的数值计算基石:**Eigen**负责线性代数,而**Ceres Solver / g2o / GTSAM**负责非线性最小二乘优化。弄清楚谁是谁——以及一个系统的选择在何时会产生影响——是SLAM的基本常识。

**Eigen。** SLAM领域*事实上*的线性代数库:所有矩阵/向量运算、分解(SVD、QR、Cholesky)以及线性求解器都靠它。它是仅含头文件的库,并大量使用模板优化,因此写得好的Eigen代码能编译成矢量化的机器码。你会经常用到的类型包括:`Eigen::Matrix3d`、`Eigen::Vector3d`、`Eigen::Isometry3d`(刚体变换)、`Eigen::Quaterniond`,以及`Eigen::Map`(无需拷贝即可包装原始缓冲区)。

```cpp
Eigen::Isometry3d T_wc = Eigen::Isometry3d::Identity();
T_wc.rotate(Eigen::AngleAxisd(0.1, Eigen::Vector3d::UnitZ()));
T_wc.pretranslate(Eigen::Vector3d(1.0, 0.0, 0.0));

Eigen::Vector3d p_c = T_wc.inverse() * p_w;   // 将世界点转换到相机坐标系
```

一个几乎人人都会踩到的实用小知识:固定大小的Eigen成员需要对齐内存分配(`EIGEN_MAKE_ALIGNED_OPERATOR_NEW`),而在不同依赖库之间混用不同版本的Eigen会造成编译上的痛苦——这也是Docker在SLAM领域如此流行的一个重要原因。

**Ceres Solver。** 谷歌开发的通用非线性最小二乘框架。你把残差定义为模板化的代价函数子(cost functor);Ceres提供**自动微分**(无需手工推导雅可比矩阵)、鲁棒损失函数、支持旋转和位姿的流形/局部参数化,以及一整套稀疏求解器。其通用模式如下:

```cpp
struct ReprojectionError {
  ReprojectionError(double u, double v) : u_(u), v_(v) {}

  template <typename T>
  bool operator()(const T* const pose, const T* const point, T* residual) const {
    // 用pose对point做旋转+平移,投影到像素(pu, pv),然后:
    // residual[0] = pu - T(u_);  residual[1] = pv - T(v_);
    return true;
  }
  double u_, v_;
};

problem.AddResidualBlock(
    new ceres::AutoDiffCostFunction<ReprojectionError, 2, 6, 3>(
        new ReprojectionError(u, v)),
    new ceres::HuberLoss(1.0), pose, point);
```

它被用于光束法平差和位姿图优化;VINS-Mono的滑动窗口后端就是基于Ceres构建的,当你的残差形式比较特殊、又希望自动微分帮你处理微积分部分时,它是默认之选。求解器的选择也很关键:光束法平差用`DENSE_SCHUR`(利用相机/地图点的分块结构),位姿图则用`SPARSE_NORMAL_CHOLESKY`。

**g2o。** "General Graph Optimization"——一个明确以图为形态的API:**顶点(vertex)**是状态变量(位姿、三维点),**边(edge)**是约束(观测、里程计、回环检测),用稀疏Cholesky求解。它是ORB-SLAM(所有版本)和LSD-SLAM的后端——ORB-SLAM的BA字面上就是由`VertexSE3Expmap`位姿顶点和`EdgeSE3ProjectXYZ`重投影边构成的——因此读懂g2o的顶点/边定义,是阅读这些代码库的先决条件。雅可比矩阵通常是手工推导的(以数值微分作为后备方案),运行时更快,但编写起来工作量更大。

**GTSAM。** Georgia Tech Smoothing and Mapping——一个理论底蕴最深厚的因子图库:变量消元、贝叶斯树,以及用于实时平滑的**iSAM2增量求解器**。它自带高质量的内置因子(IMU预积分、投影因子、smart/structureless因子)以及一个Python封装:

```cpp
gtsam::NonlinearFactorGraph graph;
graph.addPrior(X(0), gtsam::Pose3(), priorNoise);
graph.emplace_shared<gtsam::BetweenFactor<gtsam::Pose3>>(X(0), X(1), odom, odomNoise);

gtsam::ISAM2 isam;
isam.update(graph, initialValues);        // 增量平滑步骤
gtsam::Values estimate = isam.calculateEstimate();
```

它在VIO和机器人状态估计领域占据主导地位:Kimera-VIO和LIO-SAM都基于它构建。

## 如何选择

| 需求 | 应该选用 |
|---|---|
| 到处都需要矩阵运算 | Eigen(不可或缺) |
| 自定义残差、自动微分、批量BA | Ceres |
| ORB-SLAM风格的图BA/PGO | g2o |
| 增量平滑、IMU因子、VIO | GTSAM |

值得建立的性能直觉:自动微分每次迭代的开销比手工推导的解析雅可比要略高一些,但它消除了整整一类推导错误;稀疏线性求解器的选择(Schur补 vs. 普通稀疏Cholesky)通常比自动微分与解析雅可比之争更重要;而这三种优化器最终都是在求解同一组带阻尼的正规方程——它们之间的差异在于API、分解策略和生态系统,而不是底层的数学原理。

## 对SLAM的意义

你所研究的每一个系统的后端,都是基于这几个库中的某一个编写的,它们的API也塑造了论文的思维方式:"添加一个因子"、"定义一条边"、"挂上一个鲁棒核函数"。熟练掌握它们意味着你能读懂任何系统的优化代码,能在一个下午内原型化一个新的残差项,并能理解那些决定一个方法能否实时运行的性能讨论(自动微分vs.解析雅可比、稀疏求解器的选择、增量式vs.批量式)。

## 动手实践

- [Eigen + Sophus 动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch03_05)
- [g2o 动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_13)
- [GTSAM 动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_14)
- [Ceres-solver 动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_15)
- [SymForce 动手实践](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_16)

## 相关条目

- [C++](cpp.md)
- [因子图](factor-graph.md)
- [MAP推断即稀疏非线性最小二乘](map-inference-as-sparse-nonlinear-least-squares.md)
- [增量平滑(iSAM/iSAM2)](incremental-smoothing.md)
- [Schur补/稀疏性](schur-complement-sparsity.md)
