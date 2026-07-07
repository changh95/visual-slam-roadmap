# DUSt3R

> Wang 2024 · [Paper](https://arxiv.org/abs/2312.14132)

**One-line summary** — Recast pairwise 3D reconstruction as direct regression of dense pointmaps from an image pair by a feed-forward Transformer, requiring no camera calibration, feature matching, or explicit geometric models.

## Problem

Multi-view stereo in the wild requires first estimating camera intrinsics and extrinsics, which are tedious to obtain yet mandatory to triangulate corresponding pixels in 3D. The whole classical pipeline — calibrate, detect, match, estimate poses, triangulate — is a chain of fragile stages, each of which can fail. DUSt3R ("Dense and Unconstrained Stereo 3D Reconstruction") takes the opposite stance: reconstruct arbitrary image collections with *no* prior information about calibration or viewpoint poses, by regressing 3D structure directly.

## Method & architecture

**Pointmap representation**: a network $\mathcal{F}$ takes two RGB images $I^1, I^2 \in \mathbb{R}^{W \times H \times 3}$ and outputs two pointmaps $X^{1,1}, X^{2,1} \in \mathbb{R}^{W \times H \times 3}$ — per-pixel 3D coordinates — with confidence maps $C^{1,1}, C^{2,1}$. Both pointmaps are expressed in *camera 1's frame*, so a single forward pass jointly solves calibration, correspondence, and reconstruction. Feeding the same image twice yields monocular depth; the formulation unifies the monocular and binocular cases.

**Architecture** (CroCo-style, initialized from CroCo pretraining): a weight-sharing Siamese ViT-Large encoder, $F^1 = \text{Encoder}(I^1)$, $F^2 = \text{Encoder}(I^2)$, then two intertwined ViT-Base decoders in which every block performs self-attention, *cross-attention to the other view's tokens*, and an MLP:

$$G_i^1 = \text{DecoderBlock}_i^1\big(G_{i-1}^1, G_{i-1}^2\big), \qquad G_i^2 = \text{DecoderBlock}_i^2\big(G_{i-1}^2, G_{i-1}^1\big),$$

with $G_0^v := F^v$. A DPT regression head per branch maps all decoder tokens to a pointmap + confidence map. No geometric constraint is ever enforced — the network learns the priors from geometrically consistent training data.

**Training objective**: scale-normalized 3D regression for each valid pixel $i$ in view $v$,

$$\ell_{\text{regr}}(v,i) = \left\| \frac{1}{z} X_i^{v,1} - \frac{1}{\bar{z}} \bar{X}_i^{v,1} \right\|,$$

where $z, \bar{z}$ are the mean distances of all valid points to the origin, wrapped in a confidence-weighted loss that learns where predictions can be trusted:

$$\mathcal{L}_{\text{conf}} = \sum_{v \in \{1,2\}} \sum_{i \in \mathcal{D}^v} C_i^{v,1} \, \ell_{\text{regr}}(v,i) - \alpha \log C_i^{v,1}, \qquad C_i^{v,1} = 1 + \exp \widetilde{C_i^{v,1}} > 1.$$

**Everything falls out as by-products**: pixel matches via reciprocal nearest neighbours in 3D pointmap space; the focal length by a Weiszfeld-style minimization of pixel-reprojection residuals over $X^{1,1}$; relative pose by Procrustes alignment of $X^{1,1} \leftrightarrow X^{1,2}$ or PnP-RANSAC; absolute pose (visual localization) by scaling against a reference pointmap.

**Global alignment for $N$ views**: build a connectivity graph $\mathcal{G}(\mathcal{V}, \mathcal{E})$ over image pairs (network inference is roughly 40 ms per pair on an H100), then optimize world pointmaps $\chi^n$, one rigid pose $P_e$ and scale $\sigma_e$ per edge:

$$\chi^* = \arg\min_{\chi, P, \sigma} \sum_{e \in \mathcal{E}} \sum_{v \in e} \sum_{i=1}^{HW} C_i^{v,e} \left\| \chi_i^v - \sigma_e P_e X_i^{v,e} \right\|, \qquad \textstyle\prod_e \sigma_e = 1.$$

Unlike bundle adjustment this minimizes *3D* projection error, not 2D reprojection error, and runs by plain gradient descent — a few hundred steps, mere seconds on a GPU. Substituting a pinhole parametrization for $\chi^n$ recovers all poses $P_n$, intrinsics $K_n$, and depthmaps $D^n$.

**Training data**: 8.5M pairs from eight datasets (Habitat, MegaDepth, ARKitScenes, Static Scenes 3D, Blended MVS, ScanNet++, CO3D-v2, Waymo), trained first at 224 px then at 512 px with varied aspect ratios.

## Results

- **Multi-view pose estimation** (10 random frames per sequence): on CO3Dv2, DUSt3R-512 with global alignment scores RRA@15 96.2 / RTA@15 86.8 / mAA(30) 76.7, and with PnP 94.3 / 88.4 / 77.2 — versus PoseDiffusion 80.5 / 79.8 / 66.5 and PixSfM 33.7 / 32.9 / 30.1. On RealEstate10K (never seen in training) it reaches mAA(30) 67.7 (GA) / 61.2 (PnP) versus 48.0 for PoseDiffusion.
- **Monocular and multi-view depth**: the same single model (never fine-tuned per task) sets state-of-the-art or comparable results across KITTI, ScanNet, ETH3D, DTU, and Tanks & Temples benchmarks, in both self-supervised and supervised-comparison settings.
- **Visual localization**: competitive absolute-pose accuracy on 7-Scenes and Cambridge Landmarks by simply matching against posed reference images.
- Its deeper impact was paradigm-level: one feed-forward network trained on enough 3D data replaces the calibrate-detect-match-triangulate pipeline, launching the "3D foundation model" line — MASt3R (matching), MASt3R-SLAM (online), MonST3R (dynamic scenes), and the VGGT family (multi-view feed-forward) all build on its pointmap representation.

## Why it matters for SLAM

DUSt3R started the "3D foundation model" era of geometric vision: a single pre-trained network replacing the classical detect-match-triangulate pipeline, working even on uncalibrated images and as few as two views. It directly spawned MASt3R and MASt3R-SLAM, influenced feed-forward multi-view models like VGGT, and now anchors an entire branch of SLAM research where a learned pointmap regressor is the frontend and classical optimisation is the backend. Knowing its assumptions (offline pairing, global alignment cost, per-pair scale ambiguity) explains what the follow-up systems fix.

## Related

- [MASt3R](mast3r.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [VGGT](vggt.md)
- [COLMAP](../level-03-monocular-slam/colmap.md)
- [MonST3R](../level-03-monocular-slam/monst3r.md)
