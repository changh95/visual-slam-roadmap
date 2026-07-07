# BARF

> Lin 2021 · [论文](https://arxiv.org/abs/2104.06405)

**一句话总结** — Bundle-Adjusting NeRF（光束法平差NeRF）：在不完美或未知的初始化条件下，联合优化NeRF场景表示*与*相机位姿，使用从粗到细的位置编码调度方案——这是基于NeRF的SLAM得以实现的关键洞见。

## 问题

NeRF能够合成逼真的新视角图像，但它有一个硬性前提：需要每张训练图像的精确相机位姿，通常由SfM工具预先计算得到。当位姿存在噪声或未知时，直接对NeRF做位姿优化"对初始化很敏感"，且"可能导致3D场景表示的次优解"。重建与配准构成了一个鸡生蛋问题：恢复3D结构需要已知的位姿，而定位又需要来自重建结果的可靠对应关系。BARF致力于从不完美（甚至未知）的相机位姿出发训练NeRF——将学习神经3D表示与配准相机帧这一联合问题，处理为一种以视图合成为代理目标的光度光束法平差。

## 方法与架构

BARF首先分析了2D图像配准问题：通过梯度下降在 $\min_{\mathbf{p}}\sum_{\mathbf{x}}\|\mathcal{I}_1(\mathcal{W}(\mathbf{x};\mathbf{p}))-\mathcal{I}_2(\mathbf{x})\|_2^2$ 上配准图像，只有当"最速下降图像"（即通过变形（warp）将图像梯度链式传导的雅可比矩阵）给出*一致*的逐像素更新时才能成功——这正是经典Lucas-Kanade配准要从粗到细模糊图像以扩大吸引域的原因。同样的结构在NeRF的3D场景中也会出现。像素的颜色通过MLP $f$ 进行体渲染：

$$\hat{\mathcal{I}}(\mathbf{u})=\int_{z_{\text{near}}}^{z_{\text{far}}}T(\mathbf{u},z)\,\sigma(z\bar{\mathbf{u}})\,\mathbf{c}(z\bar{\mathbf{u}})\,\mathrm{d}z\;,\qquad T(\mathbf{u},z)=\exp\Big(-\int_{z_{\text{near}}}^{z}\sigma(z'\bar{\mathbf{u}})\,\mathrm{d}z'\Big)$$

BARF在这个基于合成的目标函数上联合优化 $M$ 个相机位姿 $\mathbf{p}_i\in\mathbb{R}^6$（在李代数 $\mathfrak{se}(3)$ 中参数化）与NeRF权重 $\boldsymbol{\Theta}$：

$$\min_{\mathbf{p}_1,\dots,\mathbf{p}_M,\boldsymbol{\Theta}}\;\sum_{i=1}^{M}\sum_{\mathbf{u}}\big\|\hat{\mathcal{I}}(\mathbf{u};\mathbf{p}_i,\boldsymbol{\Theta})-\mathcal{I}_i(\mathbf{u})\big\|_2^2\;.$$

障碍在于位置编码。NeRF用 $\gamma_k(\mathbf{x})=\big[\cos(2^k\pi\mathbf{x}),\sin(2^k\pi\mathbf{x})\big]$ 提升输入维度，其雅可比矩阵

$$\frac{\partial\gamma_k(\mathbf{x})}{\partial\mathbf{x}}=2^k\pi\cdot\big[-\sin(2^k\pi\mathbf{x}),\cos(2^k\pi\mathbf{x})\big]$$

会以 $2^k\pi$ 的倍数放大梯度，同时以相同频率翻转方向，导致从采样的3D点得到的位姿梯度"互不一致……很容易相互抵消"。BARF的解决方案是一个动态低通滤波器：将第 $k$ 个频带加权为 $\gamma_k(\mathbf{x};\alpha)=w_k(\alpha)\cdot\big[\cos(2^k\pi\mathbf{x}),\sin(2^k\pi\mathbf{x})\big]$，其中

$$w_k(\alpha)=\begin{cases}0 & \text{if } \alpha<k\\[2pt] \dfrac{1-\cos((\alpha-k)\pi)}{2} & \text{if } 0\leq\alpha-k<1\\[2pt] 1 & \text{if } \alpha-k\geq 1\end{cases}$$

其中 $\alpha\in[0,L]$ 随优化进程递增：从原始3D输入（$\alpha=0$，优化面平滑，位姿可自由移动）到完整编码（$\alpha=L$，场景细节完全锐化）。在NeRF实验中，$\alpha$ 从第20K次迭代线性递增至第100K次（总共200K次迭代），使用 $L=10$ 个频带，对位姿和网络都用Adam优化。BARF是批量联合优化——并非实时或增量式，且假设内参已知——但它正是基于NeRF的SLAM系统所需要的跟踪机制。

## 实验结果

- **2D平面配准**（$\mathfrak{sl}(3)$ 中的单应变形）：BARF达到变形误差0.0096、图像块PSNR 35.30，而完整位置编码为0.2949 / 23.41，不使用编码为0.0641 / 24.72。
- **合成NeRF场景**（8个场景，位姿扰动为 $\delta\mathbf{p}\sim\mathcal{N}(\mathbf{0},0.15\mathbf{I})$，约相当于14.9°旋转、0.26平移）：BARF实现了近乎完美的配准——例如Chair场景旋转误差0.096°、平移误差0.428，PSNR为31.16，而在真值位姿上训练的参考NeRF为31.91；直接使用完整编码则达到7.19°、PSNR仅19.02。
- **LLFF真实世界前向场景，所有位姿初始化为单位阵**：平均旋转误差0.573°、平移误差0.331，而直接位置编码为84.509° / 31.598；平均PSNR为23.97，直接编码为11.03，在SfM位姿上训练的参考NeRF为22.56。

结论部分明确指出了这一成果的意义：BARF"为重新思考SfM/SLAM系统的视觉定位，以及使用视图合成作为代理目标的自监督稠密3D重建框架，开辟了令人兴奋的方向。"

## 对SLAM的意义

NeRF最初只是*消费*相机位姿（来自COLMAP）；BARF展示了位姿也可以通过辐射场本身来*估计*，为利用神经场景表示进行定位打开了大门——作者明确将这一方向指向SLAM。每一个通过最小化渲染损失来跟踪的神经隐式SLAM系统，实质上都是在线循环中运行BARF的核心洞见；理解原始位置编码为何会破坏位姿配准（以及从粗到细方案如何修复它），可以解释这类文献中的许多设计选择。

## 相关条目

- [NeRF](nerf.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [GO-SLAM](go-slam.md)
