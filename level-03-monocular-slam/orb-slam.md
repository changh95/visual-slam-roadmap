# ORB-SLAM

> Mur-Artal 2015 · [Paper](https://arxiv.org/abs/1502.00956)

**One-line summary** — A complete, versatile monocular SLAM system that uses ORB features for every task — tracking, mapping, relocalization, and loop closing — with automatic initialisation and survival-of-the-fittest map management.

## Problem

Prior monocular SLAM systems each solved part of the problem: PTAM had keyframe BA but no loop closure, patch features useless for place recognition, and manual initialisation; other systems could not handle large environments or recover from tracking loss. ORB-SLAM (IEEE TRO 2015, University of Zaragoza) builds on PTAM's main ideas, DBoW2 place recognition, and scale-aware loop closing to address all of these in one unified framework, operating in real time in small and large, indoor and outdoor environments.

## Method & architecture

**One feature for everything.** The same ORB features (oriented FAST + rotated BRIEF, matched by Hamming distance) serve tracking, mapping, relocalization, and loop detection, so no work is duplicated.

**Automatic initialisation.** A homography and a fundamental matrix are computed in parallel from the same correspondences $\mathbf{x}_c \leftrightarrow \mathbf{x}_r$, i.e. $\mathbf{x}_c = \mathbf{H}_{cr}\,\mathbf{x}_r$ vs $\mathbf{x}_c^{\top}\mathbf{F}_{cr}\,\mathbf{x}_r = 0$, each scored by symmetric transfer error with an outlier-truncated kernel:

$$
S_M = \sum_i \Big( \rho_M\big(d_{cr}^2(\mathbf{x}_c^i, \mathbf{x}_r^i, M)\big) + \rho_M\big(d_{rc}^2(\mathbf{x}_c^i, \mathbf{x}_r^i, M)\big) \Big), \qquad
\rho_M(d^2) = \begin{cases} \Gamma - d^2 & \text{if } d^2 < T_M \\ 0 & \text{if } d^2 \geq T_M \end{cases}
$$

with $\chi^2$ thresholds $T_H = 5.99$, $T_F = 3.84$. The heuristic $R_H = \frac{S_H}{S_H + S_F}$ picks the homography when $R_H > 0.45$ (planar/low-parallax scenes) and the fundamental matrix otherwise ($\mathbf{E}_{rc} = \mathbf{K}^{\top}\mathbf{F}_{rc}\,\mathbf{K}$); degenerate or ambiguous configurations are detected and initialisation is postponed.

**Three parallel threads.**
- *Tracking* localises every frame by matching the local map and refining with motion-only BA. All optimisation minimises robust reprojection error over poses $\mathbf{T}_{iw} \in \mathrm{SE}(3)$ and points $\mathbf{X}_{w,j} \in \mathbb{R}^3$:

$$
C = \sum_{i,j} \rho_h\big(\mathbf{e}_{i,j}^{\top}\,\mathbf{\Omega}_{i,j}^{-1}\,\mathbf{e}_{i,j}\big), \qquad
\mathbf{e}_{i,j} = \mathbf{x}_{i,j} - \pi_i(\mathbf{T}_{iw}, \mathbf{X}_{w,j}),
$$

  with Huber kernel $\rho_h$ and $\mathbf{\Omega}_{i,j} = \sigma_{i,j}^2 \mathbf{I}_{2\times 2}$ tied to the keypoint's pyramid scale. Keyframes are inserted generously (e.g. whenever the frame tracks less than 90% of the reference keyframe's points).
- *Local mapping* triangulates new points, runs local BA over the covisibility neighbourhood, and culls aggressively: a new point must be found in more than 25% of the frames predicting it visible and be observed from at least three keyframes; keyframes whose points are 90% seen by at least three other keyframes are deleted. The *covisibility graph* links keyframes sharing at least 15 point observations (edge weight $\theta$ = number of shared points).
- *Loop closing* detects candidates with DBoW2, computes a 7-DoF $\mathrm{Sim}(3)$ alignment (monocular scale drifts) from the two-view constraint $\mathbf{e}_1 = \mathbf{x}_{1,i} - \pi_1(\mathbf{S}_{12}, \mathbf{X}_{2,j})$, $\mathbf{e}_2 = \mathbf{x}_{2,j} - \pi_2(\mathbf{S}_{12}^{-1}, \mathbf{X}_{1,i})$, then corrects drift by pose-graph optimisation over the *essential graph* — spanning tree + covisibility edges with $\theta_{\min} = 100$ + loop edges — minimising

$$
C = \sum_{i,j} \mathbf{e}_{i,j}^{\top} \mathbf{\Lambda}_{i,j}\, \mathbf{e}_{i,j}, \qquad
\mathbf{e}_{i,j} = \log_{\mathrm{Sim}(3)}\big(\mathbf{S}_{ij}\,\mathbf{S}_{jw}\,\mathbf{S}_{iw}^{-1}\big) \in \mathbb{R}^7,
$$

  followed by an optional full BA.

## Results

All experiments on an Intel Core i7-4700MQ (4 cores @ 2.40 GHz), 8 GB RAM, processing images at their true frame rate:

- **NewCollege (2.2 km robot sequence)**: the first monocular system reported to process the whole sequence. Median tracking time 30.57 ms/frame (ORB extraction 11.10 ms, initial pose 3.38 ms, local map tracking 14.84 ms); local mapping median 383.59 ms/keyframe, dominated by local BA at 296.08 ms.
- **TUM RGB-D (16 sequences)**: keyframe trajectory RMSE, e.g. fr1_xyz 0.90 cm (PTAM 1.15, LSD-SLAM 9.00), fr2_xyz 0.30 cm, fr2_desk_person 0.63 cm (LSD-SLAM 31.73). PTAM lost track in eight sequences and LSD-SLAM in three; ORB-SLAM ran all but fr3_nstr_tex_far, where it correctly detects the twofold planar ambiguity and refuses to initialise.
- **Relocalization**: from an fr2_xyz map, recall 78.4% vs PTAM's 34.9%; relocalizing walking_xyz frames against a sitting_xyz map (heavy occlusion), 77.9% vs PTAM's 0%.
- **Lifelong operation**: keyframe count saturates while a PTAM-style policy grows without bound — the map grows with scene content, not with time.
- **KITTI (10 sequences)**: processes all but the highway sequence 01 in real time at 10 fps; trajectory error typically around 1% of the map dimension (0.3% on 03, 5% on loop-free 08), improved slightly by 20 iterations of full BA.

## Why it matters for SLAM

ORB-SLAM unified the best ideas of a decade — PTAM's parallel tracking/mapping, keyframe BA, bag-of-words place recognition, covisibility, Sim(3) loop closing — into one robust open-source system, and became the de facto standard monocular SLAM baseline for years. Its H/F initialisation, covisibility/essential graph machinery, and survival-of-the-fittest culling were adopted by virtually all subsequent feature-based systems, and it spawned the ORB-SLAM2/3 lineage that still anchors SLAM benchmarking today.

## Related

- [PTAM](ptam.md)
- [ORB-SLAM2](orb-slam2.md)
- [ORB-SLAM3](orb-slam3.md)
- [Covisibility graph](covisibility-graph.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the essential-graph correction step
