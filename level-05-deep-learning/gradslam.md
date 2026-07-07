# GradSLAM

> Murthy 2020 · [Paper](https://arxiv.org/abs/1910.10672)

**One-line summary** — A PyTorch framework that poses dense SLAM as a fully differentiable computational graph — smooth reparameterizations of trust-region optimization, surface measurement, fusion, and raycasting — so gradients can flow end-to-end from 3D maps back to 2D pixels.

## Problem

Blending representation learning with SLAM is an open question because SLAM systems are highly modular and complex. Functionally, SLAM transforms raw sensor inputs into a distribution over the states of the robot and the environment — if that map $\mathcal{M}=\mathcal{G}_{SLAM}(s)$ were differentiable, the gradient $\nabla_{s}\mathcal{M}$ would answer "how much does a specific pixel measurement contribute to the resulting 3D map?", and task-based error signals could train representations end-to-end. But several components of dense SLAM are non-differentiable or have gradients that are zero almost everywhere: LM solvers make discrete damp/undamp decisions, mapping involves clipping/indexing/thresholding and hard new-vs-existing element decisions, and raycasting marches discretely along rays.

## Method & architecture

GradSLAM replaces each non-smooth block with an as-exact-as-possible differentiable counterpart, then composes them into full pipelines.

**Differentiable LM ($\nabla$LM).** For objectives $\frac{1}{2}\sum r(x)^{2}$, an LM step must decide between damping and undamping by comparing error norms $r_{0}=r(x_{0})^{T}r(x_{0})$ and $r_{1}=r(x_{1})^{T}r(x_{1})$ at the current and lookahead iterates. GradSLAM replaces the discrete switch with smooth gating functions built on the generalized logistic function:

$$\lambda_{1}=Q_{\lambda}(r_{0},r_{1})=\lambda_{min}+\frac{\lambda_{max}-\lambda_{min}}{1+De^{-\sigma(r_{1}-r_{0})}},\qquad Q_{x}(r_{0},r_{1})=x_{0}+\frac{\delta x_{0}}{1+e^{-(r_{1}-r_{0})}},$$

where $D,\sigma$ control the falloff and $[\lambda_{min},\lambda_{max}]$ bounds the damping — the whole optimizer becomes one differentiable graph.

**Differentiable mapping and fusion.** Surface measurement is smoothed three ways: each valid pixel's measurement is a kernel function $K(p, nbd(p))$ of its neighborhood (bilinear in 2D); the association of a live measurement to map elements is *soft*, spreading over closest candidates with a depth-sensor-motivated Gaussian falloff $\exp(-r(P)^{2}/2\sigma^{2})$ where $r(P)$ is radial depth from the camera ray; and every measurement is by default a new element handed to a differentiable fusion step. Fusion (which keeps map size proportional to explored volume, not time) uses a logistic falloff to smooth the abrupt truncation thresholds of classic weighted-averaging schemes.

**Differentiable raycasting.** Rays pool over all voxels they pierce with a Gaussian falloff centered at the pixel's depth measurement; ray derivatives w.r.t. pixel position use Igehy-style finite differences over neighboring rays, $\partial v_{c}/\partial p_{c}\approx\big((v_{r}-v_{l})/2,\;(v_{u}-v_{d})/2\big)^{T}$.

**Case studies.** Three classic dense systems are recomposed from these blocks: **$\nabla$KinectFusion** (TSDF volume; the truncated SDF $sdf(p)=trunc(\lVert K^{-1}x\rVert_{2}^{-1}\lVert t-p\rVert_{2}-depth(x))$ gets a smooth logistic truncation, since both the floor operator in $x=\lfloor\pi(Kp)\rfloor$ and hard truncation at $\mu$ block gradients), **$\nabla$PointFusion** (surfel map with the paper's soft-association mapping and PointFusion's fusion rules), and **$\nabla$ICP-SLAM** (frame-to-frame ICP-Odometry and frame-to-model variants). All run fully on GPU and expose gradients w.r.t. any intermediate variable — camera poses, pixel intensities/depths, optimizer parameters, camera intrinsics.

## Results

- **$\nabla$LM vs classic solvers:** on a suite of 100 curve-fitting problems each for exponential, sine, and sinc functions (parameters sampled in $[-6,6]$; 10/50/100 iterations), $\nabla$LM performs near-identically to LM in both parameter- and function-space MSE.
- **Trajectory accuracy (ICL-NUIM living_room_traj0 splits, ATE/RPE):** $\nabla$ICP-Odometry 0.01664/0.0237 vs non-differentiable 0.029/0.0318; $\nabla$ICP-SLAM 0.01660/0.0204 vs 0.0282/0.0294; $\nabla$PointFusion 0.0072/0.0101 vs 0.0071/0.0099; $\nabla$KinectFusion 0.016/0.021 vs 0.013/0.019 — "no virtual change in performance" from differentiability.
- **Reconstruction quality:** on a subsection of the same sequence, differentiable KinectFusion scores 21.301 vs Kintinuous 18.625 (the paper cautions the comparison flatters it, as smooth truncation leaves some noisy artifacts while Kintinuous keeps only high-confidence points).
- Qualitative out-of-the-box results on TUM RGB-D, ScanNet, and an in-house Intel RealSense D435 sequence.

## Why it matters for SLAM

GradSLAM was the first general differentiable SLAM framework, turning "SLAM as a layer" from a slogan into runnable research code. It sits in the same movement as BA-Net, Theseus, and LieTorch — embedding geometric optimization inside networks — and it opened the door to training perception modules (depth priors, sensor noise models, cost functions) with supervision that comes from downstream mapping quality rather than per-frame labels. The open-source PyTorch library remains a common starting point for differentiable robot perception research.

## Related

- [Differentiability](differentiability.md) — why differentiable geometric pipelines matter
- [BA-Net](ba-net.md) — differentiable bundle adjustment as a network layer
- [Theseus](theseus.md) — general differentiable nonlinear least squares library
- [Lietorch](lietorch.md) — differentiable Lie group operations in PyTorch
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md) — surfel-fusion lineage related to the systems gradSLAM differentiates
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md) — the TSDF-fusion pipeline it re-implements differentiably
