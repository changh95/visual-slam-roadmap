# UcoSLAM

> Muñoz-Salinas 2019 · [Paper](https://arxiv.org/abs/1902.03729)

**One-line summary** — Fuses natural keypoints with squared planar fiducial markers (ArUco) in one SLAM framework, combining the reliability and metric scale of markers with the coverage of natural features.

## Problem

Most SLAM systems use natural landmarks such as keypoints, but these are "unstable over time, repetitive in many cases or insufficient for a robust tracking (e.g. in indoor buildings)", and BoW relocalization has limited performance under viewpoint changes and repetitive patterns. Marker-only SLAM (the authors' earlier SPM-SLAM) gives unambiguous data association and correct metric scale, but requires at least two markers visible per image, so it cannot scale to large environments. UcoSLAM integrates both landmark types in a single map: scale is fixed as soon as one marker is seen, markers can be placed only at strategic locations, and keypoints provide coverage everywhere else.

## Method & architecture

The map is $\mathcal{W}=\{\mathcal{K},\mathcal{P},\mathcal{M},\mathcal{G},\mathcal{D}\}$: keyframes $\mathcal{K}$, triangulated map points $\mathcal{P}$, markers $\mathcal{M}$ (each with side length $s$, pose $\mathrm{M}\in\mathbb{SE}(3)$, and four known corners), a covisibility graph $\mathcal{G}$ (a shared point adds weight 1 to an edge, a shared marker adds 4), and an FBoW keyframe database $\mathcal{D}$. The pipeline is the classic ORB-SLAM-style loop — initialization, tracking, keyframe insertion, local/global optimization, loop closing, relocalization — with a parallel Map Manager thread, plus map save/load for deployment.

- **Initialization** runs keypoint-based (homography vs essential matrix, as in ORB-SLAM2) and marker-based (SPM-SLAM) initialization in parallel; markers win ties, giving instant metric scale, and marker pose ambiguity (two near-identical reprojections for a distant planar marker) is resolved using multiple views.
- **Tracking** jointly minimizes point and marker-corner reprojection errors. With reprojection error $e(\mathrm{T},\mathbf{x},\delta,\mathbf{u})=\Psi(\mathrm{T},\mathbf{x},\delta)-\mathbf{u}$ (projection function $\Psi$, camera intrinsics $\delta$), the frame pose is

$$\mathbf{f}_{\mathrm{T}}=\arg\min_{\mathrm{T}}\left(\mathbf{w_p^f}\,H(\Upsilon_p^{\mathbf{f}},\mathrm{T})+\mathbf{w_m^f}\,H(\Upsilon_m^{\mathbf{f}},\mathrm{T})\right),$$

  where $H(\Upsilon_p^{\mathbf{f}},\mathrm{T})$ is the Huber-robustified sum of point reprojection errors (weighted by $\Omega_{\mathbf{g}}=\eta^{-\mathbf{g}_l}\mathrm{I}$, down-weighting keypoints from coarse pyramid levels) and $H(\Upsilon_m^{\mathbf{f}},\mathrm{T})$ sums the squared reprojection errors of the four corners of each valid marker. Because points vastly outnumber markers, the balance is set by

$$\mathbf{w_m^f}=\frac{1}{2}\min\left(1,\frac{\mathbf{n_f}}{\tau_m}\right),\qquad \mathbf{w_p^f}=1-\mathbf{w_m^f},$$

  with $\mathbf{n_f}$ the number of valid markers in the frame and $\tau_m=5$ by default.
- **Map optimization** is sparse Levenberg-Marquardt bundle adjustment over keyframe poses, point positions, and marker poses: $\arg\min_{\mathbf{k}_{\mathrm{T}},\mathbf{p}_{\mathbf{x}},\mathbf{m}_{\mathrm{M}}} E(\Upsilon_p)+E(\Upsilon_m)$, run locally (covisible keyframes) after keyframe insertion and globally after loop closure.
- **Loop closure and relocalization** are marker-first: a re-observed marker not seen near the reference keyframe triggers an immediate, unambiguous loop closure — corrected via $\mathrm{Sim}(3)$ pose-graph optimization *before* the marker is allowed into tracking — while keypoint loop closure runs asynchronously via FBoW. Relocalization tries known markers first and falls back to BoW + RANSAC PnP.
- **Culling** keeps for every marker the three most distant keyframes observing it, then removes keyframes whose matched points are seen in at least three other keyframes.

## Results

Compared against ORB-SLAM2 and LDSO on KITTI (20 monocular sequences), EuRoC-MAV (20), TUM RGB-D (10), and SPM (8), using a proposed pairwise score $\mathbf{S}_{\rho}(\mathbf{a},\mathbf{b})\in[-1,1]$ that combines ATE (computed on commonly tracked frames) with the percentage of tracked frames. ORB-SLAM2 scores $-0.10$ to $-0.14$ against UcoSLAM across confidence levels $\rho$ (UcoSLAM slightly better); LDSO scores $-0.37$ to $-0.40$ against UcoSLAM (clearly worse). On the marker-equipped SPM dataset, keypoints+markers beats both markers-only ($\mathbf{S}$ from $-0.187$ to $-0.625$ against it) and keypoints-only (e.g. video1: ATE 0.057 m at 100% tracked vs 0.601 m at 64.5% for keypoints-only). Average speed (fps over tracked frames): UcoSLAM 2.6 (SLAM) / 19.8 (tracking) vs ORB-SLAM2 1.6 / 12.5 and LDSO 3.0 / 2.4, with Wilcoxon tests confirming significance vs ORB-SLAM2. In a repetitive office building (50 ceiling markers, four ~20 m corridors, a 12,000-frame phone sequence), ORB-SLAM2, LDSO, and both single-landmark UcoSLAM modes failed; only the combined keypoints+markers mode built a coherent map, with BoW relocalization returning up to six false candidates per frame that marker IDs disambiguate.

## Why it matters for SLAM

UcoSLAM shows that artificial and natural landmarks are complementary: markers contribute metric scale, drift-free anchors, and reliable relocalization/loop closure, while features provide continuous coverage between them. This makes it highly practical in environments you control — warehouses, labs, industrial AR setups — where placing a few markers is cheap insurance, and its map save/load design made it unusually deployment-friendly among research systems of its era.

## Related

- [ORB-SLAM2](orb-slam2.md) — the keypoint-based SLAM design UcoSLAM builds upon
- [Scale ambiguity](scale-ambiguity.md) — the monocular problem that markers solve for free
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md) — the appearance-based loop closure that markers replace
- [Landmark](../level-02-getting-familiar/landmark.md) — general notion of map landmarks
- [LDSO](ldso.md) — the direct-method baseline it was compared against
