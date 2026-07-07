# CodeSLAM

> Bloesch 2018 · [Paper](https://arxiv.org/abs/1804.00874)

**One-line summary** — CodeSLAM (CVPR 2018) represents each keyframe's dense depth map as a small latent code from an image-conditioned variational autoencoder, making dense geometry compact enough to optimize jointly with camera poses.

## Problem

The representation of geometry in real-time 3D perception remains a critical open issue. Dense maps capture complete surface shape but their high dimensionality makes them costly to store and process, and unsuitable for rigorous probabilistic inference; sparse feature-based representations allow joint probabilistic inference of structure and motion, but capture only partial scene information and are mainly useful for localisation. Yet natural scene geometry is highly ordered — neighbouring depth values are strongly correlated — so a dense representation should not actually need a large number of parameters. CodeSLAM seeks a representation that is **dense yet compact and optimisable**: full surface geometry in few enough parameters to sit inside joint probabilistic optimization.

## Method & architecture

**Intensity-conditioned depth auto-encoding.** A variational autoencoder compresses a keyframe's depth map, but conditioned on the intensity image so the code only retains what the image alone cannot predict:

$$D = D(I, \boldsymbol{c})$$

where $I$ is the intensity image and $\boldsymbol{c}$ the latent code (128-D in the reference network). A U-Net decomposes $I$ into multi-scale features that are concatenated into the depth encoder/decoder at matching resolutions; the variational bottleneck (two 512-channel fully connected layers, KL-regularised) keeps the code-to-depth mapping smooth. Setting $\boldsymbol{c}=0$ yields the most likely single-view depth prediction $D(I,0)$.

**Uncertainty-aware training.** The network predicts a per-pixel mean $\mu$ and uncertainty $b$, trained with the negative log-likelihood of a Laplace distribution over observed depth $\tilde{d}$ at four pyramid levels:

$$-\log p(\tilde{d}\mid\mu,b) = \frac{|\tilde{d}-\mu|}{b} + \log(b)$$

Depths are re-parametrised as *proximity* $p = a/(d+a)$ (average depth $a$), mapping $[0,\infty]$ to $[0,1]$. Training uses SceneNet RGB-D with ADAM (lr $10^{-4}\to10^{-6}$, 6 epochs). A **linear decoder** is used so the Jacobian $\partial D/\partial\boldsymbol{c}$ (otherwise up to ~1 s to evaluate) can be pre-computed once per keyframe.

**Dense warping and joint optimization.** With pose $\boldsymbol{T}_A^B=(\boldsymbol{R}_A^B, {}_B\boldsymbol{t}_A^B)$ between views, each pixel $\boldsymbol{u}$ warps as

$$w(\boldsymbol{u},\boldsymbol{c}_{A},\boldsymbol{T}_{A}^{B})=\pi\big(\boldsymbol{R}_{A}^{B}\,\pi^{-1}(\boldsymbol{u},D_{A}[\boldsymbol{u}])+{}_{B}\boldsymbol{t}_{A}^{B}\big)$$

with $\pi,\pi^{-1}$ the projection/inverse-projection operators and $D_A[\boldsymbol{u}]$ a pixel lookup. An N-frame structure-from-motion back-end assigns every frame an unknown code (init 0) and pose (init identity) and minimizes photometric and geometric residuals over all overlapping pairs,

$$E_{\mathrm{pho}} = L_{p}\big(I_{A}[\boldsymbol{u}]-I_{B}[w(\boldsymbol{u},\boldsymbol{c}_{A},\boldsymbol{T}_{A}^{B})]\big), \qquad E_{\mathrm{geo}} = L_{g}\big(D_{A}[\boldsymbol{u}]-D_{B}[w(\boldsymbol{u},\boldsymbol{c}_{A},\boldsymbol{T}_{A}^{B})]\big)$$

where the losses $L_p, L_g$ mask invalid correspondences, weight the two error types, apply Huber weighting, and down-weight slanted or occluded pixels. A damped Gauss–Newton solver updates all codes and poses. **Tracking** aligns the current frame to the last keyframe with the same machinery (photometric cost only, coarse-to-fine); the full PTAM-style system alternates tracking and mapping, marginalising old keyframes into a linear prior.

## Results

- **Code size**: reconstruction accuracy saturates at a code size of 128; colour input and nonlinear decoding gave no significant gain. Code-entry Jacobians show entries controlling semantically coherent image regions.
- **N-frame SfM (SceneNet RGB-D)**: RMS proximity error of the master keyframe drops monotonically as frames are added — $2.65\times10^{-2}$ (1 frame) to $2.14\times10^{-2}$ (6 frames), demonstrating genuine multi-view refinement of dense geometry.
- **Generalisation**: two-frame reconstructions on real EuRoC and NYU V2 images despite purely synthetic training; the EuRoC result used 50 optimisation steps at ~100 ms each.
- **VO on EuRoC MH_02**: run as sliding-window (4-keyframe) visual odometry, error is roughly 1 m after 9 m traveled — not competitive with visual-inertial systems, but respectable for vision-only with a synthetic-trained prior; map update rate ~5 Hz.

## Why it matters for SLAM

CodeSLAM answered a question that had blocked dense SLAM since DTAM: how to include dense geometry inside joint probabilistic optimization instead of fusing it after the fact. Its core lesson — put a learned low-dimensional parameterization between the optimizer and the dense map — is one of the most influential ideas in learned SLAM (CVPR 2018 best paper honourable mention), spawning SceneCode, DeepFactors, NodeSLAM and CodeMapping, and conceptually anticipating neural-implicit SLAM (iMAP, NICE-SLAM) where network parameters again serve as compact optimizable geometry.

## Related

- [DeepFactors](deepfactors.md)
- [SceneCode](scenecode.md)
- [NodeSLAM](nodeslam.md)
- [CodeMapping](codemapping.md)
- [iMAP](../level-03-monocular-slam/imap.md)
- [DTAM](../level-03-monocular-slam/dtam.md)
