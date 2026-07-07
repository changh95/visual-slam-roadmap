# MonST3R

> Zhang 2024 · [Paper](https://arxiv.org/abs/2410.03825)

**One-line summary** — Extends DUSt3R-style pointmap estimation to *dynamic* scenes by predicting a pointmap per timestep, enabling video depth, camera pose, and 4D reconstruction from videos with moving objects.

## Problem

Estimating geometry from dynamic scenes has typically relied on multi-stage pipelines or global optimisations that decompose the problem into subtasks (depth, flow, motion segmentation), "leading to complex systems prone to errors". DUSt3R's pointmap representation unified static reconstruction into a single feed-forward prediction, but it assumes a rigid scene: fed a video with movers, it forces the moving content into one inconsistent static reconstruction (or, even with a ground-truth motion mask, fails to pose the cameras reliably). MonST3R (Motion DUSt3R) asks whether the pointmap idea can survive motion without adding an explicit motion model.

## Method & architecture

**Per-timestep pointmaps.** For a pair of frames $\mathbf{I}^t, \mathbf{I}^{t'}$, the network predicts pointmaps $\mathbf{X}^{t;t\rightarrow t'}$ and $\mathbf{X}^{t';t\rightarrow t'} \in \mathbb{R}^{H\times W\times 3}$ (with confidences $\mathbf{C}$), both expressed in frame $t$'s camera — exactly DUSt3R's setup, except each pointmap now corresponds to a *single point in time*, so moving content is represented where it is at each moment.

**Fine-tuning for dynamics.** The obstacle is data: dynamic, posed videos with depth. The authors assemble four datasets — PointOdyssey (50% sampling weight), TartanAir (25%), Waymo (20%), Spring (5%) — and fine-tune only the ViT-Base decoder and DPT heads (encoder frozen to preserve CroCo geometric features), with frame pairs sampled at temporal strides 1–9 (probability increasing with stride), field-of-view augmentation, and DUSt3R's confidence-aware regression loss. 25 epochs × 20k pairs, one day on 2× RTX 6000.

**Downstream tools.** Intrinsics follow DUSt3R (solve focal per frame). Relative pose avoids dynamic-object-corrupted 2D-2D correspondences by using per-pixel 2D-3D correspondences within one view with PnP + RANSAC:

$$\mathbf{R^{*}},\mathbf{T^{*}} = \arg\min_{\mathbf{R},\mathbf{T}} \sum_{i\in\mathcal{I}} \big\| \mathbf{x}_i - \pi\big(\mathbf{K}^{t'}(\mathbf{R}\,\mathbf{X}^{t';t\rightarrow t'}_i + \mathbf{T})\big) \big\|^2 .$$

A confident *static mask* compares the flow induced by camera motion alone against estimated optical flow: $\mathbf{S}^{t\rightarrow t'} = \big[\alpha > \|\mathbf{F}^{t\rightarrow t'}_{\mathrm{cam}} - \mathbf{F}^{t\rightarrow t'}_{\mathrm{est}}\|_{L1}\big]$.

**Dynamic global point cloud + poses.** Instead of DUSt3R's all-pairs graph, pairs are formed inside a sliding temporal window (with strided sampling). Global pointmaps are re-parameterised by $\mathbf{P}^t = [\mathbf{R}^t|\mathbf{T}^t]$, $\mathbf{K}^t$, and per-frame depth $\mathbf{D}^t$, then optimised as

$$\hat{\mathbf{X}} = \arg\min_{\mathbf{X},\mathbf{P}_W,\sigma}\; \mathcal{L}_{\mathrm{align}}(\mathbf{X},\sigma,\mathbf{P}_W) + w_{\mathrm{smooth}}\,\mathcal{L}_{\mathrm{smooth}}(\mathbf{X}) + w_{\mathrm{flow}}\,\mathcal{L}_{\mathrm{flow}}(\mathbf{X}),$$

where $\mathcal{L}_{\mathrm{align}} = \sum_{e}\sum_{t\in e}\|\mathbf{C}^{t;e}\cdot(\mathbf{X}^{t}-\sigma^{e}\mathbf{P}^{t;e}\mathbf{X}^{t;e})\|_1$ is DUSt3R's alignment term, $\mathcal{L}_{\mathrm{smooth}} = \sum_t \big(\|\mathbf{R}^{t\top}\mathbf{R}^{t+1}-\mathbf{I}\|_f + \|\mathbf{T}^{t+1}-\mathbf{T}^{t}\|_2\big)$ smooths the trajectory, and $\mathcal{L}_{\mathrm{flow}}$ makes reprojected global geometry match estimated flow inside confident-static regions ($w_{\mathrm{smooth}} = w_{\mathrm{flow}} = 0.01$; 300 Adam iterations). Returning $\hat{\mathbf{D}}$ directly gives temporally consistent video depth. Inference: ~30 s for pairwise pointmaps of a 60-frame video (window 9, stride 2) plus ~1 min optimisation on one RTX 6000.

## Results

- **Video depth** (scale-&-shift aligned, Abs Rel / δ<1.25): Sintel 0.335/58.5, Bonn **0.063**/96.4, KITTI **0.104**/89.5 — beating the concurrent specialised DepthCrafter on Bonn and KITTI (0.075/97.1, 0.110/88.1) and all joint depth-pose baselines (CasualSAM: 0.387, 0.169, 0.246 Abs Rel). With scale-only alignment the gap widens (0.345/0.065/0.106 vs DepthCrafter's 0.692/0.217/0.141).
- **Camera pose** (ATE): Sintel 0.108 and ScanNet 0.068 — best among joint depth+pose methods (CasualSAM 0.141/0.158; DUSt3R even *with* a ground-truth motion mask: 0.417/0.081) and competitive with pose-only trackers that need ground-truth intrinsics (LEAP-VO 0.089 Sintel); TUM-dynamics ATE 0.074.
- **Single-frame depth** stays DUSt3R-level after fine-tuning (Sintel 0.345 vs 0.424, Bonn 0.076 vs 0.141, KITTI 0.101 vs 0.112 Abs Rel; slight regression on static NYU-v2, 0.091 vs 0.080).
- Ablations: every training dataset contributes; decoder+head fine-tuning beats alternatives; the smooth/flow losses improve pose with minimal depth impact. Qualitatively, feed-forward 4D reconstructions on DAVIS succeed where DUSt3R's rigid alignment collapses.

## Why it matters for SLAM

Dynamic environments are the standing failure mode of geometry-based SLAM, traditionally handled by masking movers out (DynaSLAM, DS-SLAM). MonST3R shows a different path: a foundation model that natively estimates geometry *in the presence of motion*, from which pose, video depth, and motion segmentation all fall out of one representation — and it shows that a modest, well-chosen fine-tune (mostly synthetic data, frozen encoder) suffices, without any explicit motion model. It is the key stepping stone from the static DUSt3R/MASt3R family toward 4D scene understanding, suggesting the static-world assumption can be dissolved at the representation level rather than patched at the pipeline level.

## Related

- [DUSt3R](../level-05-deep-learning/dust3r.md)
- [MASt3R](../level-05-deep-learning/mast3r.md)
- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [SEA-RAFT](../level-05-deep-learning/sea-raft.md) — the class of off-the-shelf flow it leans on
- [Align3R](../level-05-deep-learning/align3r.md)
