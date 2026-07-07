# Corner detector

角点是图像中沿*多个方向*强度都发生显著变化的位置。角点是稳定、可重复的地标：与平坦区域（无梯度）或边缘（只有一个方向上有梯度）不同，角点可以在 2D 中被无歧义地定位，这使它非常适合用于跟踪和匹配。经典的检测器是**Harris 角点检测器**。

## 结构张量

在一个局部窗口 $W$（用权重 $w(x,y)$，通常是高斯函数）上计算的某个像素处的**结构张量**（二阶矩矩阵）：

$$M = \sum_{(x,y) \in W} w(x,y) \begin{bmatrix} I_x^2 & I_x I_y \\ I_x I_y & I_y^2 \end{bmatrix}$$

其中 $I_x = \frac{\partial I}{\partial x}$、$I_y = \frac{\partial I}{\partial y}$ 是图像梯度（用 Sobel 算子计算）。$M$ 的特征值 $\lambda_1, \lambda_2$ 刻画了局部结构：

| $\lambda_1$ | $\lambda_2$ | 解释 |
|---|---|---|
| $\approx 0$ | $\approx 0$ | 平坦区域（无梯度） |
| $\gg 0$ | $\approx 0$ | 边缘（只在一个方向上有梯度） |
| $\gg 0$ | $\gg 0$ | 角点（两个方向上都有梯度） |

直观理解：$M$ 总结了当窗口发生平移时强度差平方和的变化方式。角点是这样一个点：*任何*平移方向都会产生较大的变化——这正是"两个特征值都很大"这一条件所表达的意思。

## 角点响应函数

Harris 没有直接计算特征值（开销较大），而是提出了如下响应函数：

$$R = \det(M) - k\,(\mathrm{trace}(M))^2 = \lambda_1\lambda_2 - k(\lambda_1 + \lambda_2)^2$$

其中 $k \in [0.04, 0.06]$ 是经验值。$R > 0$ 表示角点，$R < 0$ 表示边缘，$|R|$ 较小表示平坦区域。随后通过非极大值抑制选出最强的局部最大值作为最终角点。

与之密切相关的**Shi-Tomasi**准则（"Good Features to Track"）直接用 $\min(\lambda_1, \lambda_2)$ 对每个像素打分——即该图像块最差情况下的可跟踪性——这正是 OpenCV 的 `cv::goodFeaturesToTrack` 所实现的方法。

## 从零实现的示意代码

用几行 NumPy/OpenCV 代码实现 Harris 算法是最好的入门练习之一：

```python
import cv2, numpy as np

I  = cv2.imread("frame.png", cv2.IMREAD_GRAYSCALE).astype(np.float32)
Ix = cv2.Sobel(I, cv2.CV_32F, 1, 0)
Iy = cv2.Sobel(I, cv2.CV_32F, 0, 1)

# window-averaged structure tensor entries
Sxx = cv2.GaussianBlur(Ix * Ix, (5, 5), 1.0)
Syy = cv2.GaussianBlur(Iy * Iy, (5, 5), 1.0)
Sxy = cv2.GaussianBlur(Ix * Iy, (5, 5), 1.0)

k = 0.04
R = (Sxx * Syy - Sxy**2) - k * (Sxx + Syy)**2   # Harris response
corners = R > 0.01 * R.max()                    # threshold before NMS
```

## 关于 SLAM 前端的实践笔记

- **FAST**（ORB 背后的检测器）用围绕候选点的一个 16 像素圆环上的快速分段测试来取代结构张量——开销要低得多，这正是让实时检测数千个关键点变得可行的原因。从概念上讲，它仍然瞄准同样的"强度沿多个方向变化"的性质。
- **空间分布很重要**：原始的响应阈值会使角点集中在纹理丰富的区域。因此 SLAM 系统通常把图像划分为网格，在每个格子中保留响应最好的角点，从而使位姿估计在图像的所有区域都受到约束。
- **亚像素级精化**（在最大值附近对响应函数拟合一个二次函数，例如 `cv::cornerSubPix`）能明显改善下游几何计算的效果。

## 常见陷阱

- **窗口/模糊尺寸的权衡**：窗口太小会使张量含噪；窗口太大会把不同的角点模糊在一起,并使其位置偏移。
- **以最大响应的比例作为阈值**在不同场景下适应性较差；按格子选择比单一的全局阈值更稳健。
- **运动物体或高光反射上的角点**在几何上是无用的；检测质量只是问题的一半——另一半是下游的异常值剔除。

## 对SLAM的意义

角点是基于特征的 SLAM 前端的原材料：它们成为被描述、匹配、并三角化为地图点的关键点。结构张量几乎原封不动地出现在 Lucas-Kanade 光流法中——一个角点（两个特征值都大）恰好就是可以被可靠跟踪的那种点，这也是为什么"好的可跟踪特征"和 Harris 角点关系如此密切。后来用于实时 SLAM 的检测器（FAST、ORB 中的带方向 FAST）都是同一思想的更快的继承者。

## 相关条目

- [Edge detector](edge-detector.md)
- [Basic Linear Algebra](basic-linear-algebra.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
