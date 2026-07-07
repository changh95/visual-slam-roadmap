# Logarithm & Exponential

指数函数与对数函数在SLAM中广泛出现于**李群（Lie groups）**与**李代数（Lie algebras）**的场景中。除了它们熟悉的标量形式之外，它们的矩阵版本是连接旋转（难以优化）与向量（易于优化）之间的桥梁。

## 标量回顾

指数函数 $e^x = \sum_{k=0}^{\infty} \frac{x^k}{k!}$ 及其反函数 $\log(x)$ 满足使它们变得有用的恒等式：

$$e^{a+b} = e^a e^b, \qquad \log(ab) = \log a + \log b$$

对数恒等式在概率论中已经证明了自身的价值：似然（likelihood）是许多小数的*乘积*，会导致浮点数下溢；取对数后乘积变为数值上稳定的*求和*——这正是为什么估计方法要最小化负对数似然，而不是直接最大化似然本身。

## 旋转带来的问题

旋转矩阵 $R \in SO(3)$ 不构成一个向量空间——把两个旋转相加并不能得到一个旋转，因此不能直接对它们应用普通的梯度下降。但它们的*李代数* $\mathfrak{so}(3)$（单位元处的切空间）*确实*是一个向量空间：其元素只是一个三维向量 $\boldsymbol{\phi}$（轴角形式），写作反对称矩阵 $[\boldsymbol{\phi}]_\times$。

## 指数映射与对数映射

**矩阵指数**由与标量情形相同的幂级数定义，$\exp(A) = \sum_{k=0}^{\infty} \frac{A^k}{k!}$，对于反对称的自变量，该级数可以化简为闭合形式：

- **指数映射** $\exp: \mathfrak{so}(3) \to SO(3)$ 将一个李代数元素转换为一个旋转矩阵。对于绕单位轴 $\hat{\mathbf{n}}$ 旋转角度 $\theta$（即 $\boldsymbol{\phi} = \theta\hat{\mathbf{n}}$）：

$$\exp([\boldsymbol{\phi}]_\times) = I + \sin\theta\,[\hat{\mathbf{n}}]_\times + (1 - \cos\theta)\,[\hat{\mathbf{n}}]_\times^2$$

  这就是**罗德里格斯公式（Rodrigues' formula）**——矩阵指数级数的一个闭合形式，之所以能得到该形式，是因为单位反对称矩阵的幂具有循环性：$[\hat{\mathbf{n}}]_\times^3 = -[\hat{\mathbf{n}}]_\times$。

- **对数映射** $\log: SO(3) \to \mathfrak{so}(3)$ 是其逆映射：它从旋转矩阵中提取出轴角向量。角度由矩阵的迹得到，$\theta = \arccos\!\big(\tfrac{\mathrm{trace}(R) - 1}{2}\big)$，轴则由 $R$ 的反对称部分得到。

对于小角度旋转，只保留一阶项就得到了随处可见的近似式

$$\exp([\boldsymbol{\phi}]_\times) \approx I + [\boldsymbol{\phi}]_\times \qquad (\|\boldsymbol{\phi}\| \text{ small})$$

这恰好就是在推导残差关于旋转扰动的雅可比矩阵时所使用的线性化。

同样的构造可以扩展到完整的刚体位姿：$\exp$ 将 $\mathfrak{se}(3)$（6维向量：平移+旋转）映射到 $SE(3)$（齐次变换矩阵），而 $\log$ 则反向映射回去。

## 为什么标量直觉仍然有帮助

熟悉的恒等式在精神上得以延续：指数把加法变成了复合运算（对于可交换的自变量，$e^{a+b} = e^a e^b$），而对数则把复合运算变回加法形式。这正是优化所需要的：将一个小的修正量表示为向量 $\boldsymbol{\xi}$，以乘法形式施加为 $T \leftarrow T\cdot\exp(\hat{\boldsymbol{\xi}})$，并把位姿误差度量为 $\|\log(T_1^{-1}T_2)\|$。

有一点值得牢记：对于矩阵而言，$e^{A+B} = e^A e^B$ 只有在 $A$ 与 $B$ 可交换时才成立——而绕不同轴的旋转并不可交换。正是这种不可交换性，使得三维旋转需要借助李群理论，而不能仅靠普通的向量加法。

## 常见陷阱

- **对数映射在 $\theta = 0$ 和 $\theta = \pi$ 附近的数值不稳定性**：轴的计算公式中要除以 $\sin\theta$；稳健的实现会在这些角度附近切换到泰勒展开分支。
- **假设加性**：把两个轴角向量直接相加来复合，只在小角度下才是近似正确的；精确的复合运算需要经过 $\exp$/$\log$。
- **混用约定**：一些库把 $SE(3)$ 的切向量存储为（平移，旋转），另一些则存储为（旋转，平移）——在不同代码库之间复制雅可比矩阵之前务必检查这一点。

## 对SLAM的意义

对数与指数使我们能够对旋转和位姿进行"线性化"，从而使它们能够被基于梯度的优化方法处理——每一个现代SLAM后端（g2o、GTSAM、带有流形参数化的 Ceres）都通过指数映射来更新位姿，而位姿图误差则通过对数映射来定义。现在熟悉 $\exp/\log$，会在你在 Level 2 系统学习李群时直接带来回报。

## 相关条目

- [Rigid body motion](rigid-body-motion.md)
- [Basic Calculus](basic-calculus.md)
- [Basic Probability & Statistics](basic-probability-and-statistics.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
