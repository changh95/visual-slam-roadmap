# BARF

> Lin 2021 · [Paper](https://arxiv.org/abs/2104.06405)

**One-line summary** — Bundle-Adjusting NeRF: jointly optimises a NeRF scene representation *and* the camera poses from imperfect or unknown initialisation, using a coarse-to-fine positional encoding schedule — the key enabling insight for NeRF-based SLAM.

## Problem

NeRF synthesises photorealistic novel views, but it has a hard prerequisite: accurate camera poses for every training image, typically pre-computed with an SfM package. When poses are noisy or unknown, naive pose optimisation with NeRF "is sensitive to initialization" and "may lead to suboptimal solutions of the 3D scene representation". Reconstruction and registration form a chicken-and-egg problem: recovering 3D structure requires known poses, while localizing requires reliable correspondences from the reconstruction. BARF tackles training NeRF from imperfect (or even unknown) camera poses — the joint problem of learning neural 3D representations and registering camera frames — as a form of photometric bundle adjustment with view synthesis as the proxy objective.

## Method & architecture

BARF first analyses 2D image alignment: registering images by gradient descent on $\min_{\mathbf{p}}\sum_{\mathbf{x}}\|\mathcal{I}_1(\mathcal{W}(\mathbf{x};\mathbf{p}))-\mathcal{I}_2(\mathbf{x})\|_2^2$ works only if the "steepest descent image" (the Jacobian chaining image gradients through the warp) gives *coherent* per-pixel updates — which is why classical Lucas-Kanade alignment blurs images coarse-to-fine to widen the basin of attraction. The same structure appears in 3D with NeRF. A pixel's colour is volume-rendered through the MLP $f$:

$$\hat{\mathcal{I}}(\mathbf{u})=\int_{z_{\text{near}}}^{z_{\text{far}}}T(\mathbf{u},z)\,\sigma(z\bar{\mathbf{u}})\,\mathbf{c}(z\bar{\mathbf{u}})\,\mathrm{d}z\;,\qquad T(\mathbf{u},z)=\exp\Big(-\int_{z_{\text{near}}}^{z}\sigma(z'\bar{\mathbf{u}})\,\mathrm{d}z'\Big)$$

and BARF jointly optimises the $M$ camera poses $\mathbf{p}_i\in\mathbb{R}^6$ (parameterised in the Lie algebra $\mathfrak{se}(3)$) and NeRF weights $\boldsymbol{\Theta}$ over the synthesis-based objective

$$\min_{\mathbf{p}_1,\dots,\mathbf{p}_M,\boldsymbol{\Theta}}\;\sum_{i=1}^{M}\sum_{\mathbf{u}}\big\|\hat{\mathcal{I}}(\mathbf{u};\mathbf{p}_i,\boldsymbol{\Theta})-\mathcal{I}_i(\mathbf{u})\big\|_2^2\;.$$

The obstacle is positional encoding. NeRF lifts inputs with $\gamma_k(\mathbf{x})=\big[\cos(2^k\pi\mathbf{x}),\sin(2^k\pi\mathbf{x})\big]$, whose Jacobian

$$\frac{\partial\gamma_k(\mathbf{x})}{\partial\mathbf{x}}=2^k\pi\cdot\big[-\sin(2^k\pi\mathbf{x}),\cos(2^k\pi\mathbf{x})\big]$$

amplifies gradients by $2^k\pi$ while flipping direction at the same frequency, so pose gradients from sampled 3D points "are incoherent … and can easily cancel out each other". BARF's fix is a dynamic low-pass filter: weight the $k$-th band as $\gamma_k(\mathbf{x};\alpha)=w_k(\alpha)\cdot\big[\cos(2^k\pi\mathbf{x}),\sin(2^k\pi\mathbf{x})\big]$ with

$$w_k(\alpha)=\begin{cases}0 & \text{if } \alpha<k\\[2pt] \dfrac{1-\cos((\alpha-k)\pi)}{2} & \text{if } 0\leq\alpha-k<1\\[2pt] 1 & \text{if } \alpha-k\geq 1\end{cases}$$

where $\alpha\in[0,L]$ ramps with optimisation progress: from raw 3D input ($\alpha=0$, smooth landscape, poses move freely) to full encoding ($\alpha=L$, scene sharpens to full detail). In the NeRF experiments $\alpha$ is ramped linearly from iteration 20K to 100K of 200K, with $L=10$ frequency bands, Adam on both poses and network. BARF is batch co-optimisation — not real-time or incremental, and intrinsics are assumed known — but it is exactly the tracking machinery a NeRF-based SLAM system needs.

## Results

- **2D planar alignment** (homography warps in $\mathfrak{sl}(3)$): BARF reaches warp error 0.0096 and patch PSNR 35.30, versus 0.2949 / 23.41 for full positional encoding and 0.0641 / 24.72 without encoding.
- **Synthetic NeRF scenes** (8 scenes, poses perturbed by $\delta\mathbf{p}\sim\mathcal{N}(\mathbf{0},0.15\mathbf{I})$ ≈ 14.9° rotation, 0.26 translation): BARF achieves near-perfect registration — e.g. Chair 0.096° rotation / 0.428 translation error with PSNR 31.16 vs 31.91 for a reference NeRF trained on ground-truth poses; naive full encoding lands at 7.19° and PSNR 19.02.
- **LLFF real-world forward-facing scenes, all poses initialised to identity**: mean rotation error 0.573° and translation error 0.331 vs 84.509° / 31.598 for naive positional encoding; mean PSNR 23.97 vs 11.03 (naive) and 22.56 for reference NeRF trained on SfM poses.

The conclusion flags the consequence explicitly: BARF "opens up exciting avenues for rethinking visual localization for SfM/SLAM systems and self-supervised dense 3D reconstruction frameworks using view synthesis as a proxy objective."

## Why it matters for SLAM

NeRF originally *consumed* camera poses (from COLMAP); BARF showed poses can be *estimated* through the radiance field itself, opening the door to localization with neural scene representations — a direction the authors explicitly flag for SLAM. Every neural-implicit SLAM system that tracks by minimising a rendering loss is running BARF's insight in an online loop; understanding why raw positional encoding breaks pose registration (and how coarse-to-fine fixes it) explains many design choices in that literature.

## Related

- [NeRF](nerf.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [GO-SLAM](go-slam.md)
