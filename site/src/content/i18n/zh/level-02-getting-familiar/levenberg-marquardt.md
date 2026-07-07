# Levenberg-Marquardt

Levenberg-Marquardt（LM）是SLAM中非线性最小二乘问题的主力求解器。它是[Gauss-Newton](gauss-newton.md)的一种阻尼版本,在Gauss-Newton（在极小值附近收敛快）和梯度下降（在远离极小值时更安全）之间进行插值,使其对较差的初始化更加鲁棒。

## 从Gauss-Newton到LM

对于代价$F(\mathbf{x}) = \tfrac{1}{2}\|\mathbf{e}(\mathbf{x})\|^2$，Gauss-Newton将残差线性化为$\mathbf{e}(\mathbf{x}_k + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}_k) + J_k \Delta\mathbf{x}$，并求解正规方程

$$
(J_k^T J_k)\,\Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

当线性化近似较差,或$J_k^T J_k$（近乎）奇异时,这一求解可能发散。LM增加了一个**阻尼项（damping term）**$\lambda I$：

$$
(J_k^T J_k + \lambda I)\,\Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

其中：

- $J_k$是残差向量在当前估计$\mathbf{x}_k$处的雅可比矩阵，
- $\lambda > 0$是阻尼参数，
- $\Delta\mathbf{x}$是更新量,应用方式为$\mathbf{x}_{k+1} = \mathbf{x}_k + \Delta\mathbf{x}$（对于流形上的位姿，则通过指数映射施加）。

两种极限情况说明了其行为：

- $\lambda \to 0$：方程退化为Gauss-Newton——大而激进的步长，在极小值附近呈近二次收敛。
- $\lambda \to \infty$：方程趋近于$\lambda\,\Delta\mathbf{x} = -J_k^T\mathbf{e}$，即沿负梯度方向的一个小步——收敛慢但可靠。

Marquardt的改进按每个坐标的曲率来缩放阻尼,将$\lambda I$替换为$\lambda\,\mathrm{diag}(J_k^T J_k)$，这样约束较弱的方向会受到更强的阻尼,使方法对每个参数的尺度重新缩放保持不变性。

## 自适应阻尼

$\lambda$在每次迭代中都会根据该步是否真正有效而被调整：

1. 用当前的$\lambda$求解$\Delta\mathbf{x}$。
2. 在$\mathbf{x}_k + \Delta\mathbf{x}$处评估真实代价。
3. 如果代价下降：接受该步,并**减小**$\lambda$（更信任线性化）。
4. 如果代价上升：拒绝该步,并**增大**$\lambda$（采取更小、更接近梯度方向的步长），然后重新求解。

一种常见的改进是将实际代价下降量与线性化模型预测的下降量进行比较（**增益比,gain ratio**）：比值接近1意味着局部二次模型是可信的,$\lambda$可以大幅缩小;比值很小或为负意味着模型较差,$\lambda$必须增大。这正是**信赖域方法（trust-region method）**的逻辑——LM可以被理解为隐式地在$\mathbf{x}_k$周围维护一个信赖区域，在该区域内线性化是可信的,$\lambda$与该区域的半径成反比。

## 针对SLAM问题的实用说明

- 对于$\lambda > 0$，阻尼后的系统矩阵$J^T J + \lambda I$总是正定的，所以Cholesky分解总能成功——这对于诸如单目光束法平差这类规范欠约束（gauge-underconstrained）的问题很重要。
- SLAM Hessian矩阵的稀疏性得以保留：阻尼只影响对角线,因此光束法平差中使用的Schur补技巧不受影响,照常工作。
- 鲁棒核（[M-estimators](m-estimator.md)）以迭代重加权最小二乘的形式融入LM——权重会修改$J$和$\mathbf{e}$，LM循环的其他部分保持不变。
- LM是Ceres Solver、g2o和GTSAM中的默认优化器,因此也是大多数SLAM后端实际运行的算法。

## 对SLAM的意义

现代SLAM流水线中几乎每一个优化——[光束法平差](bundle-adjustment.md)、位姿图优化、PnP细化、相机标定——都是用LM求解的。SLAM问题具有高度非线性（投影、旋转流形），而初始化往往并不理想（运动模型预测、带噪声的三角化），因此纯粹的Gauss-Newton步经常会过冲。LM的自动阻尼正是这些求解器能够在每一帧都可靠收敛,而无需手动调参的原因,这也是它数十年来一直是SLAM后端默认选择的原因。

## 相关条目

- [Gauss-Newton](gauss-newton.md)
- [非线性优化](non-linear-optimization.md)
- [Bundle Adjustment](bundle-adjustment.md)
- [重投影误差](reprojection-error.md)
- [数学库（Eigen、Ceres、GTSAM、g2o）](math-libraries.md)
