# DeepFusion

> Laidlow 2019 · [Paper](https://arxiv.org/abs/2207.12244)

**One-line summary** — A dense monocular reconstruction system that probabilistically fuses semi-dense multi-view-stereo depth from a SLAM system with CNN-predicted log-depth and log-depth gradients, weighted by learned uncertainties.

## Problem

Keypoint-based monocular SLAM maps are good for camera tracking but too sparse for many robotic tasks; depth cameras are "limited in range and to indoor spaces"; and dense reconstruction by minimising photometric error between frames is "typically poorly constrained and suffer[s] from scale ambiguity." DeepFusion targets this gap: a real-time GPU system producing fully dense, metric-scale keyframe depth maps from RGB images and the scale-ambiguous poses of a monocular SLAM system, by treating CNN predictions as one more (uncertain) measurement source.

## Method & architecture

DeepFusion represents geometry as a series of keyframe depth maps. Each new frame gets a pose from ORB-SLAM2; a semi-dense multi-view stereo module then updates depth for high-texture pixels of the active keyframe by epipolar-line search minimising the SSD photometric error over five points, with per-pixel uncertainty $\sigma_i^2=(\mathbf{J}^T\mathbf{J})^{-1}$ from a finite-difference Jacobian. A new keyframe is created when the camera translates more than $\lambda_{trans}$ or the semi-dense estimation has fewer than $\lambda_{inliers}$ inliers.

Once per keyframe, a U-Net-style CNN (shared encoder, four decoders, 256×192 resolution, trained on SceneNet RGB-D) predicts log-depth, log-depth gradients in x and y, and an uncertainty for each, using the maximum-likelihood loss

$$\mathcal{L}_{\mathrm{NN}}(\theta)=\sum_{i}\frac{(y_{i}-f_{\theta,i}(\mathbf{x}))^{2}}{\sigma_{\theta,i}(\mathbf{x})^{2}}+\log(\sigma_{\theta,i}(\mathbf{x})^{2}),$$

where $f_{\theta,i}$ and $\sigma_{\theta,i}^2$ are the predicted mean and variance for pixel $i$. Log-depth is used because the difference of two log-depths is a depth ratio, which is scale-invariant; predictions are normalised by focal length in training and rescaled by the test camera's focal length.

With every new frame, the keyframe's dense log-depth map $\mathbf{d}$ and a scale-correction factor $s$ are re-optimised by minimising

$$c(\mathbf{d},s)=c_{\mathrm{semi}}(\mathbf{d},s)+c_{\mathrm{net}}(\mathbf{d})+c_{\mathrm{grad}}(\mathbf{d}),$$

three uncertainty-weighted quadratic terms (each robustified with a Huber loss):

- **Semi-dense (unary, scale-ambiguous):** $r_{\mathrm{semi},i}=\ln\mathbf{d}_{i}-\ln s-\ln\mathbf{d}_{\mathrm{semi},i}$, weighted by $\sigma_i^{2}$ from the stereo search.
- **Network depth (unary, metric):** $r_{\mathrm{net},i}=\ln\mathbf{d}_{i}-\ln\mathbf{d}_{\mathrm{net},i}$, weighted by the predicted depth variance — a weak prior on absolute scale that makes $s$ observable.
- **Network gradient (pairwise):** $r_{\mathrm{grad,x},i}=\ln\mathbf{d}_{i+1}-\ln\mathbf{d}_{i}-\mathbf{g}_{\mathrm{x},i}$ and $r_{\mathrm{grad,y},i}=\ln\mathbf{d}_{i+W}-\ln\mathbf{d}_{i}-\mathbf{g}_{\mathrm{y},i}$ ($W$ = image width), linking neighbouring pixels so sparse geometric measurements propagate across textureless regions and the map stays globally consistent.

The system runs 10 Gauss-Newton iterations per frame (alternating depth and scale) as GPU kernels compiled by the Opt framework, so the expensive network pass is amortised once per keyframe while geometry is refined continuously.

## Results

Following CNN-SLAM's protocol — percentage of estimated depths within 10% of ground truth on ICL-NUIM (synthetic) and TUM RGB-D (real) — DeepFusion averages 22.466 vs CNN-SLAM's 22.464, LSD-SLAM (bootstrapped) 3.032, REMODE 7.649, Laina et al. 18.452, and ORB-SLAM 0.029. It is best on four of six ICL-NUIM sequences (e.g. office1: 37.420 vs CNN-SLAM 29.150), while CNN-SLAM wins two of three TUM sequences — attributed to training data: DeepFusion's SceneNet (synthetic) vs CNN-SLAM's Kinect-captured NYUv2. Ablations show the full formulation beats least-squares scale alignment on seven of nine sequences, and pairwise gradient constraints help on seven of nine. Timing (i7-5820K + GTX 980): semi-dense update 16 ms, optimisation 33 ms, network 45 ms mean — real-time with per-keyframe inference.

## Why it matters for SLAM

DeepFusion sits in the lineage of systems that make monocular dense reconstruction practical by combining classical multi-view geometry with learned single-image cues (CNN-SLAM, DVSO, D3VO). Its emphasis on uncertainty-aware fusion — treating network depth *and* depth-gradient outputs as noisy measurements with learned confidences inside one probabilistic optimisation, rather than as ground truth — became a recurring design principle in later learned-plus-geometric dense SLAM systems.

## Related

- [CNN-SLAM](cnn-slam.md)
- [LSD-SLAM](lsd-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [CodeSLAM](../level-05-deep-learning/codeslam.md)
