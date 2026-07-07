# Pop-up SLAM

> Yang 2016 · [Paper](https://arxiv.org/abs/1703.07334)

**One-line summary** — Integrates single-image "pop-up" plane detection into monocular SLAM, using planes as landmarks in a factor graph so that dense semantic mapping and state estimation survive low-texture environments where point-feature methods fail.

## Problem

Feature-based SLAM systems rely on salient point features and are "not robust in challenging low-texture environments because there are only few salient features"; corridors, white walls, and floors make LSD-SLAM and ORB-SLAM fail outright. Even when they survive, "the resulting sparse or semi-dense map also conveys little information for motion planning". Prior work that used planes or scene layout for dense map regularisation still "require decent state estimation from other sources". Pop-up SLAM demonstrates that scene understanding can improve both state estimation and dense mapping, especially in low-texture environments.

## Method & architecture

The system has three parts: a single-image plane "pop-up" front-end, a plane-landmark SLAM back-end, and two fusion schemes with point-based LSD-SLAM.

**Single-image plane pop-up.** A CNN segments the ground region; instead of fitting polylines, the true wall–ground boundary is selected from detected line segments by submodular optimisation: given detected edges $V=\{e_1,\dots,e_n\}$, find $\max_{S\subseteq V}F(S),\ st\colon S\in I$, where the score $F=C(S)$ is horizontal image coverage and the constraints $I=I_{close}\cap I_{ovlp}$ require edges to be near the CNN boundary and not overlap horizontally. A greedy update $S\leftarrow S\cup\{\operatorname{arg\,max}_{e\notin S}\bigtriangleup(e\mid S)\}$ carries a $\frac{1}{k+1}$ worst-case optimality bound. A plane is the homogeneous vector $\boldsymbol{\pi}=(\mathbf{n}^\top,d)^\top$, transformed between frames by $\boldsymbol{\pi}_w=\text{T}_{w,c}^{-\top}\boldsymbol{\pi}_c$. Each pixel $\mathbf{u}$ on a plane pops up to the 3D point

$$\mathbf{p}_{c}=\frac{-d_{c}}{\mathbf{n}_{c}^{\top}(\text{K}^{-1}\mathbf{u})}\text{K}^{-1}\mathbf{u}$$

and wall normals follow from verticality: $\mathbf{n}_{wall,c}=\mathbf{n}_{gnd,c}\times(\mathbf{p}_{c1}-\mathbf{p}_{c0})$. Camera rotation for initialisation comes from Manhattan vanishing points via $\mathbf{v}_{i}=\mathbf{K}\mathbf{R}_{w,c}^{\top}\mathbf{e}_{i}$.

**Plane SLAM back-end.** A factor graph (iSAM) estimates 6-DoF poses $x_0,\dots,x_t$ and plane landmarks $\boldsymbol{\pi}_0,\dots,\boldsymbol{\pi}_n$ from pop-up plane measurements plus odometry; each plane carries a ground/wall label. Because $(\mathbf{n}^\top,d)^\top$ is over-parametrised (singular information matrix), planes are optimised in the minimal quaternion representation $\mathbf{q}\in\mathbb{R}^4$, $\|q\|=1$, updated via the exponential map. Data association uses plane normal difference, mutual distance, and projection overlap; loop closure uses ORB bag-of-words, after which factors of the duplicate plane are shifted onto the matched landmark. Plane measurements are re-popped-up (<1 ms per hundred planes) after each pose update.

**Point-plane fusion.** Plane-only SLAM is under-constrained in corridors (a free direction $t_{free}$ along parallel walls), so two combinations with LSD-SLAM are proposed: (1) *Depth Enhanced LSD SLAM* fuses pop-up depth $d_p$ ($\sigma_p^2\propto d_p^2$ by error propagation) with LSD's propagated depth $d_l$ as $\mathcal{N}\left(\frac{\sigma_{l}^{2}d_{p}+\sigma_{p}^{2}d_{l}}{\sigma_{l}^{2}+\sigma_{p}^{2}},\frac{\sigma_{l}^{2}\sigma_{p}^{2}}{\sigma_{l}^{2}+\sigma_{p}^{2}}\right)$; (2) *LSD Pop-up SLAM* runs plane SLAM with the enhanced LSD poses as odometry factors.

## Results

- **TUM fr3/structure_notexture_far** (five white walls + ground): LSD-SLAM and ORB-SLAM both fail. Pop-up Plane SLAM achieves mean positioning error $0.18\pm0.07$ m on the 4.58 m trajectory (3.9%), endpoint error 0.10 m; plane normal error 2.83°, mean pixel depth error 6.2 cm, with 86.8% of pixel depths within 0.1 m.
- **Corridor dataset II** (60 m loop, hand-held 640×480 camera): LSD Pop-up SLAM closes the loop with 0.4 m error — 0.67% of trajectory length — while LSD and ORB SLAM perform poorly (ORB often fails to initialise).
- **Runtime** (i7 4.0 GHz + GPU for CNN): CNN segmentation 17.8 ms, edge detection/selection 13.2 ms, iSAM incremental update 17.4 ms; total 49.4 ms per processed frame (over 20 Hz single-threaded), with pop-up run on every 10th image (3 Hz). Map statistics: 146 planes, 344 poses, 1974 factors.

## Why it matters for SLAM

Pop-up SLAM is an early example of injecting structural and semantic priors into geometric SLAM, showing that scene understanding and SLAM are mutually beneficial: single-image priors rescue SLAM in degenerate scenes, and SLAM gives the priors 3D consistency. It influenced later planar and structure-aware SLAM work and is a direct precursor to the same authors' object-level CubeSLAM, which reuses its ground-plane backprojection geometry.

## Related

- [ORB-SLAM](orb-slam.md)
- [PL-SLAM](pl-slam.md)
- [CubeSLAM](cubeslam.md)
- [LSD-SLAM](lsd-slam.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
