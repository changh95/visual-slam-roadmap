# Align3R

> Lu 2025 · [Paper](https://arxiv.org/abs/2412.03079)

**One-line summary** — Align3R turns flickering per-frame monocular depth predictions into temporally consistent video depth *plus camera poses* by injecting the monocular depth into a fine-tuned DUSt3R whose pairwise 3D pointmaps then align all frames (CVPR 2025 Highlight).

## Problem

Modern monocular depth estimators (Depth Pro, Depth Anything V2) produce high-quality single-image depth but cannot maintain a consistent scale factor across the frames of a dynamic video, so estimated depth sequences flicker. Early fixes ran inference-time optimization with optical-flow or matching constraints, which breaks under large motion and takes hours; recent video-diffusion approaches (DepthCrafter, ChronoDepth) are training-expensive, limited to fixed-length clips, and output only scale-invariant depth *without camera poses* — insufficient for 4D reconstruction or tracking. Align3R asks how to get consistent video depth and poses for a dynamic monocular video without paying the diffusion price.

## Method & architecture

Given $N$ frames $\mathbf{I}_k$, a monocular estimator first predicts per-frame depth $\hat{\mathbf{D}}_k$; a modified DUSt3R then predicts pairwise pointmaps informed by those depths; finally a global alignment solves depths $\mathbf{D}_k$ and poses $\pi_k\in\mathbb{SE}(3)$.

- **DUSt3R backbone.** For a frame pair $(\mathbf{I}_n,\mathbf{I}_m)$, a ViT predicts pointmaps $\mathbf{X}^e_n,\mathbf{X}^e_m$ (both in frame $n$'s coordinates) with confidences $\mathbf{C}^e_n,\mathbf{C}^e_m$; over a pair graph $\mathcal{G}(\mathcal{V},\mathcal{E})$, global alignment solves

$$\arg\min_{\mathbf{D},\pi,\sigma}\sum_{e\in\mathcal{E}}\sum_{v\in e}\mathbf{C}^{e}_{v}\left\|\mathbf{D}_{v}-\sigma_{e}P_{e}(\pi_{v},\mathbf{X}^{e}_{v})\right\|_{2}^{2}$$

  where $\sigma_e$ are per-edge scale factors and $P_e$ projects the pointmap into view $v$ as a depth map.
- **Depth injection, ControlNet-style.** Naively concatenating depth to RGB inputs "destructively breaks" the pretrained DUSt3R encoder features. Instead, the monocular depth is unprojected to a 3D pointmap $\hat{\mathbf{X}}_i$ (Depth Pro's predicted focal length, or a fixed focal for Depth Anything V2; each axis normalized to $[-1,1]$), patch-embedded, and passed through a new ViT whose multi-level features $\hat{\mathbf{F}}^{(l)}_i$ enter the DUSt3R decoder through zero convolutions: $\hat{\mathbf{E}}^{(l)}_i=\mathrm{ZeroConv}(\hat{\mathbf{F}}^{(l)}_i)+\mathbf{E}^{(l)}_i$ for $l=1,\dots,s$ ($s=6$), leaving the original prediction intact at initialization.
- **Fine-tuning for dynamic scenes.** Encoder frozen; decoder + point-map ViT fine-tuned on 5 synthetic datasets (SceneFlow, VKITTI, TartanAir kept for static regions, Spring, PointOdyssey) with pairs sampled at temporal strides 1–10, using the DUSt3R regression loss $L_{dust3r}=\left\|\frac{1}{z}\mathbf{X}^{e}_{v}-\frac{1}{\overline{z}}\overline{\mathbf{X}}^{e}_{v}\right\|_{2}$ with per-image normalizers $z,\overline{z}$; depth beyond 400 m is filtered so the sky doesn't dominate the loss. Training: six RTX 4090s, batch 12, ~20 h for 50 epochs, AdamW lr $5\times10^{-5}$.
- **Hierarchical optimization for long videos.** Videos over ~30 frames blow past 4090 memory under vanilla DUSt3R alignment, so the video is split into clips of $M=10$ or $20$: global alignment over one keyframe per clip initializes keyframe depths/poses/focals, then local alignment fills in each clip. MonST3R's RAFT-flow losses are added at inference — barely affecting depth but important for pose accuracy.

## Results

Evaluated on 6 datasets with a single scale/shift per *sequence* (stricter than per-frame alignment), Abs Rel $\downarrow$ / $\delta<1.25$ $\uparrow$:

- **Video depth** (Table 2): Sintel 0.253/0.681 (with Depth Anything V2) vs MonST3R 0.335/0.586, DUSt3R 0.422/0.542, DepthCrafter 0.292/0.697; PointOdyssey val 0.077/0.930 (Depth Pro variant) vs MonST3R 0.089/0.909; FlyingThings3D 0.102/0.895 vs MonST3R 0.132/0.836; Bonn 0.075/0.972 and TUM dynamics 0.109/0.915 — beating DUSt3R and MonST3R on all metrics of all datasets, though on easy indoor Bonn single-frame Depth Pro (0.067/0.974) is already consistent.
- **Camera pose** (Table 3): best RTE/RRE on all three benchmarks; ATE 0.011 on TUM dynamics (vs MonST3R 0.020, DUSt3R 0.093, COLMAP 0.076) and 0.646×10⁻² on Bonn; on Sintel ATE 0.128–0.163, slightly behind MonST3R's 0.111 but with better RRE (0.419–0.432 vs 0.780).
- **Ablations** (Table 4): the zero-conv ViT injection gives Sintel Abs Rel 0.263 vs 0.306 without depth and 0.399 with naive RGB-depth concatenation; hierarchical optimization cuts memory 24.0→5.9 GB and time 2.9→1.1 min per Bonn video at near-identical accuracy (0.054→0.056 Abs Rel).

## Why it matters for SLAM

Consistent depth across frames is exactly what dense visual odometry and mapping need: a monocular depth network that disagrees with itself between frames poisons pose estimation and map fusion. Align3R shows a practical recipe — foundation-model depth for detail, DUSt3R-style pairwise pointmaps as the geometric glue, and DUSt3R's own global alignment as the back-end — that makes single-image depth models usable as a video/SLAM front-end, while its pose accuracy on dynamic sequences rivals dedicated systems like DROID-SLAM. It sits in the fast-moving DUSt3R family (MonST3R, MASt3R-SLAM) being adapted to sequential and dynamic data.

## Related

- [DUSt3R](../level-03-monocular-slam/dust3r.md)
- [MonST3R](../level-03-monocular-slam/monst3r.md)
- [Depth Anything V2](depth-anything-v2.md)
- [Marigold](marigold.md)
- [MASt3R-SLAM](../level-03-monocular-slam/mast3r-slam.md)
