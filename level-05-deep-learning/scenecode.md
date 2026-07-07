# SceneCode

> Zhi 2019 · [Paper](https://arxiv.org/abs/1903.06482)

**One-line summary** — Extends CodeSLAM by encoding depth *and* semantic segmentation as compact image-conditioned latent codes, so semantic label fusion becomes multi-view code optimization and geometry, poses and semantics are estimated in one unified optimisation.

## Problem

Incremental semantic mapping systems must store and update both geometry and semantics, but while geometric estimation had well-developed probabilistic formulations, state-of-the-art systems stored *independent* label estimates per surface element (depth pixel, surfel, or voxel). Spatial correlation is discarded, so fused label maps come out incoherent and noisy, and semantic evidence cannot inform motion or geometry estimation. Object-graph approaches (SLAM++-style) have the desired token-like character but only cover discrete known objects. SceneCode asks whether semantics can live in a learned compact code — like CodeSLAM's depth codes — making labels an optimizable, spatially coherent map variable.

## Method & architecture

**Multitask CVAE.** A U-shaped network with a shared ResNet-50 encoder and two RefineNet decoders processes the colour image; two VGG-like variational encoders compress depth and one-hot semantic labels into two low-dimensional codes ($\boldsymbol{c}_d$, $\boldsymbol{c}_s$). Each decoder is deliberately **linear in the code**, conditioned nonlinearly on the image:

$$D\left(\boldsymbol{c}_{d},I\right)=D_{0}\left(I\right)+J_{d}\left(I\right)\boldsymbol{c}_{d}, \qquad S\left(\boldsymbol{c}_{s},I\right)=S_{0}\left(I\right)+J_{s}\left(I\right)\boldsymbol{c}_{s}$$

where $D_0(I), S_0(I)$ are the zero-code (most likely single-view) predictions and $J_{d/s}$ the learned linear influence — linearity lets the code Jacobians be pre-computed once per keyframe. Training combines an $L_1$ proximity loss with predicted per-pixel uncertainty $b_i$, $\sum_{i=1}^{N}\big[\tfrac{|\widetilde{p}_{i}-p_{i}|}{b_{i}}+\log(b_{i})\big]$ (proximity $p=a/(a+d)$, $a=2$ m), multi-class cross-entropy for semantics, KL-annealed variational losses, and adaptive task weighting.

**Fusion via multi-view code optimization.** With relative pose $\boldsymbol{T}_{BA}$, dense correspondence $w\left(\boldsymbol{u}_{A},\boldsymbol{c}_{d}^{A},\boldsymbol{T}_{BA}\right)=\pi\left(\boldsymbol{T}_{BA}\,\pi^{-1}\left(\boldsymbol{u}_{A},D_{A}\left[\boldsymbol{u}_{A}\right]\right)\right)$ links overlapping views. Three residuals are minimized: photometric $r_{i}=I_{A}\left[\boldsymbol{u}_{A}\right]-I_{B}\left[w\left(\boldsymbol{u}_{A},\boldsymbol{c}_{d}^{A},\boldsymbol{T}_{BA}\right)\right]$, geometric $r_z$ (depth-consistency of warped points), and the new **semantic consistency residual**

$$r_{s}=DS\left(S_{A}\left[\mathbf{u}_{A}\right],S_{B}\left[w\left(\mathbf{u_{A}},\boldsymbol{c}_{d}^{A},\boldsymbol{T}_{BA}\right)\right]\right)$$

where $DS$ is the Euclidean distance between softmax probabilities — corresponding pixels should have similar categorical distributions regardless of viewpoint. Because $r_s$ is differentiable w.r.t. semantic codes *and* pose *and* depth, semantics can influence motion and structure (walls align with walls, chairs with chairs). A zero-code prior regularizes the weakly anchored semantic term.

**SLAM system.** A keyframe-based monocular pipeline: each keyframe stores $I$, $\boldsymbol{c}_d$, $\boldsymbol{c}_s$; tracking uses photometric residuals only; mapping runs damped Gauss–Newton over an N-frame problem, first optimizing geometry+poses, then semantics, then all jointly.

## Results

- **Datasets**: NYUv2 (795/654 train/test, 13 classes), Stanford 2D-3D-Semantic (66,792/3,704), synthetic SceneNet RGB-D (110,000/3,000 subset); images at 256×192. Reconstruction saturates beyond code size 32, which is used throughout; zero-code predictions are comparable to a discriminative RefineNet on semantics and better on depth.
- **Label fusion (2,000 SceneNet RGB-D images, perfect data association)**: code-based fusion beats element-wise fusion, most clearly in mIoU — single view 41.71; with 2 views: ours 43.84 vs. multiplication 42.33 and averaging 42.22; 3 views 44.23; 4 views 44.26. Total pixel accuracy rises 75.17 → 75.73 (2 views).
- **Zero-code prior ablation**: without the prior, 2-view fusion drops to 39.60 mIoU — *below* single-view — showing the learned prior is essential.
- **System demos**: two-view dense semantic SfM on NYUv2, SceneNet RGB-D and Stanford; the geometry prior makes initialisation robust and even handles pure rotational motion.

## Why it matters for SLAM

SceneCode was the first joint geometric–semantic latent representation for SLAM, demonstrating that semantics can be an optimizable map variable rather than a post-hoc painting of labels onto geometry — fused labels stay smooth and spatially coherent because pixels are no longer treated as independent. It sits in the Imperial College latent-map lineage (CodeSLAM → SceneCode → DeepFactors/NodeSLAM) and conceptually prefigures semantic neural-field SLAM, where a single implicit representation likewise decodes both geometry and semantics.

## Related

- [CodeSLAM](codeslam.md) — the depth-only latent code predecessor
- [DeepFactors](deepfactors.md) — probabilistic factor-graph SLAM over codes
- [NodeSLAM](nodeslam.md) — object-level latent codes
- [CodeMapping](codemapping.md) — codes for dense mapping alongside sparse SLAM
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md) — earlier per-surfel semantic fusion
