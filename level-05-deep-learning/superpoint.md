# SuperPoint

> DeTone 2017 · [Paper](https://arxiv.org/abs/1712.07629)

**One-line summary** — Self-supervised interest point detector and descriptor trained via Homographic Adaptation, producing keypoints and 256-dim descriptors for a full image in a single ~70 FPS forward pass.

## Problem

Classical detectors and descriptors (SIFT, ORB) are hand-crafted and brittle under illumination and viewpoint change, while supervised learning of keypoints is blocked by an awkward fact: unlike human-body keypoints, the notion of an "interest point" is semantically ill-defined, so there is no ground truth to annotate. Patch-based learned descriptors also required cropping around detections, preventing efficient full-image inference. SuperPoint asks how to train a joint detector + descriptor on real images *without any manual labels*, in a fully-convolutional model that computes pixel-level keypoints and descriptors in one forward pass.

## Method & architecture

**Shared encoder, two heads.** A VGG-style encoder (eight 3x3 conv layers, 64-64-64-64-128-128-128-128, with three 2x2 max-pools) maps an $H \times W$ image to a $H_c \times W_c$ grid of "cells" with $H_c = H/8$, $W_c = W/8$. Two decoder heads share this representation:

- *Interest point decoder*: computes $\mathcal{X}\in\mathbb{R}^{H_c\times W_c\times 65}$ — 64 channels for the positions inside each 8x8 pixel cell plus a "no interest point" dustbin. A channel-wise softmax and a parameter-free reshape (sub-pixel convolution) recover a full-resolution point-ness heatmap, avoiding upconvolution cost and checkerboard artifacts.
- *Descriptor decoder*: computes semi-dense $\mathcal{D}\in\mathbb{R}^{H_c\times W_c\times 256}$, then bi-cubically interpolates and L2-normalizes to give a unit-length descriptor at any pixel.

**Synthetic pre-training (MagicPoint).** The detector pathway is first trained on *Synthetic Shapes* — rendered quadrilaterals, triangles, lines, ellipses whose corner locations are unambiguous by construction. On this data MagicPoint reaches 0.971 mAP under imaging noise, vs FAST 0.061, Harris 0.213, Shi-Tomasi 0.157.

**Homographic Adaptation.** To cross the synthetic-to-real gap, an ideal detector should be covariant with homographies, ${\bf x}=\mathcal{H}^{-1}f_{\theta}(\mathcal{H}(I))$. Since a real detector is not perfectly covariant, responses are aggregated over $N_h$ random homographic warps:

$$\hat{F}(I;f_{\theta})=\frac{1}{N_{h}}\sum_{i=1}^{N_{h}}\mathcal{H}_{i}^{-1}f_{\theta}(\mathcal{H}_{i}(I))$$

Run with $N_h=100$ (diminishing returns beyond: +21% repeatability at 100 warps, +22% at 1000) over 80k MS-COCO images at 240x320, twice iteratively, this produces pseudo-ground-truth keypoints for self-supervised training — no human labels anywhere.

**Joint training loss.** Pairs of warped images with known homography $\mathcal{H}$ supervise both heads at once:

$$\mathcal{L}(\mathcal{X},\mathcal{X}',\mathcal{D},\mathcal{D}';Y,Y',S)=\mathcal{L}_{p}(\mathcal{X},Y)+\mathcal{L}_{p}(\mathcal{X}',Y')+\lambda\mathcal{L}_{d}(\mathcal{D},\mathcal{D}',S)$$

$\mathcal{L}_p$ is a per-cell cross-entropy over the 65 classes. The descriptor hinge loss uses correspondence labels $s_{hwh'w'}=1$ iff the warped cell centre lands within 8 pixels, and margins $m_p=1$, $m_n=0.2$:

$$l_{d}({\bf d},{\bf d}';s)=\lambda_{d}\, s\,\max(0,m_{p}-{\bf d}^{T}{\bf d}')+(1-s)\max(0,{\bf d}^{T}{\bf d}'-m_{n})$$

with $\lambda_d=250$ balancing sparse positives against abundant negatives and $\lambda=0.0001$ balancing the two losses.

## Results

- **Runtime**: a single forward pass takes ~11.15 ms on 480x640 images (Titan X), plus ~1.5 ms CPU descriptor sampling — about 13 ms total, or **70 FPS**.
- **HPatches repeatability** (240x320, 300 points, NMS=4): SuperPoint 0.652 on the 57 illumination scenes — best of all, vs Harris 0.620, FAST/MagicPoint 0.575; on the 59 viewpoint scenes 0.503, on par with FAST (0.503) and below Harris (0.556) but far above MagicPoint (0.322) — Homographic Adaptation delivers the viewpoint robustness.
- **HPatches homography estimation** (1000 points, 480x640): correctness at $\epsilon=3$ is 0.684 vs SIFT 0.676, LIFT 0.598, ORB 0.395. SuperPoint dominates descriptor metrics: NN mAP 0.821 and matching score 0.470 vs SIFT's 0.694 / 0.313. SIFT keeps the edge at sub-pixel precision ($\epsilon=1$: 0.424 vs 0.310) thanks to its sub-pixel refinement.
- ORB has the highest raw repeatability but its clustered detections yield the worst homography estimates — repeatability alone does not make a good matcher.

## Why it matters for SLAM

SuperPoint became *the* learned local feature of the deep-SLAM era: robust to illumination and viewpoint changes where ORB fails, yet fast enough for real-time front-ends. It is the standard backbone under SuperGlue/LightGlue and the hloc localization ecosystem, and has been dropped into ORB-SLAM-style systems (e.g., DXSLAM uses learned features in a classical pipeline). Homographic Adaptation itself became a widely reused self-supervision recipe for geometric learning.

## Related

- [SuperGlue](superglue.md) — the GNN matcher built on SuperPoint features
- [R2D2](r2d2.md) — reliability-aware alternative detector/descriptor
- [DISK](disk.md) — reinforcement-learning-trained alternative
- [XFeat](xfeat.md) — lightweight descendant for edge devices
- [hloc](hloc.md) — the localization ecosystem it anchors
- [DXSLAM](../level-03-monocular-slam/dxslam.md) — learned features inside a classical SLAM system
