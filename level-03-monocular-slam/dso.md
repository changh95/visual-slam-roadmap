# DSO

> Engel 2016 · [Paper](https://arxiv.org/abs/1607.02565)

**One-line summary** — Direct Sparse Odometry performs windowed photometric bundle adjustment over a sparse, evenly distributed set of high-gradient pixels, combining a fully direct probabilistic model with consistent joint optimisation of all model parameters.

## Problem

Before DSO, the direct and sparse worlds each kept only half the prize. LSD-SLAM tracked photometrically but refined geometry with filtering and a pose graph, never jointly optimising structure and motion; feature-based methods (ORB-SLAM) did full bundle adjustment but reduced images to keypoints. DSO combines "a fully direct probabilistic model (minimizing a photometric error) with consistent, joint optimization of all model parameters" — poses, inverse depths, intrinsics, and per-frame brightness — in real time, made possible "by omitting the smoothness prior used in other direct methods and instead sampling pixels evenly throughout the images."

## Method & architecture

- **Photometric calibration**: image formation is modelled as $I_i(\mathbf{x}) = G\big(t_i\, V(\mathbf{x})\, B_i(\mathbf{x})\big)$ with response function $G$, vignette $V$, exposure $t_i$, irradiance $B_i$; frames are corrected up-front via $I_i'(\mathbf{x}) := t_i B_i(\mathbf{x}) = G^{-1}(I_i(\mathbf{x}))/V(\mathbf{x})$.
- **Photometric error**: a point $\mathbf{p}$ hosted in frame $I_i$ and observed in $I_j$ contributes a weighted SSD over an 8-pixel residual pattern $\mathcal{N}_{\mathbf{p}}$:

$$E_{\mathbf{p}j} := \sum_{\mathbf{p}\in\mathcal{N}_{\mathbf{p}}} w_{\mathbf{p}} \left\| (I_j[\mathbf{p}'] - b_j) - \frac{t_j e^{a_j}}{t_i e^{a_i}} (I_i[\mathbf{p}] - b_i) \right\|_{\gamma},$$

  where $\mathbf{p}' = \Pi_{\mathbf{c}}\big(\mathbf{R}\, \Pi_{\mathbf{c}}^{-1}(\mathbf{p}, d_{\mathbf{p}}) + \mathbf{t}\big)$ is the reprojection with inverse depth $d_{\mathbf{p}}$ and relative pose $\mathbf{T}_j \mathbf{T}_i^{-1}$; $a, b$ are affine brightness parameters (logarithmic parametrisation prevents drift), $\|\cdot\|_\gamma$ the Huber norm, and $w_{\mathbf{p}} = c^2 / (c^2 + \|\nabla I_i(\mathbf{p})\|_2^2)$ down-weights high-gradient pixels (implicit geometric noise). The total energy is

$$E_{\text{photo}} := \sum_{i\in\mathcal{F}} \sum_{\mathbf{p}\in\mathcal{P}_i} \sum_{j\in\mathrm{obs}(\mathbf{p})} E_{\mathbf{p}j},$$

  optimised by Gauss–Newton over a sliding window; each point has just one unknown (inverse depth in its host frame), so after the Schur complement the system solves like classical sparse BA.
- **Marginalisation**: old frames and points leave the window via the Schur complement, $\widehat{\mathbf{H}_{\alpha\alpha}} = \mathbf{H}_{\alpha\alpha} - \mathbf{H}_{\alpha\beta}\mathbf{H}_{\beta\beta}^{-1}\mathbf{H}_{\beta\alpha}$, leaving a quadratic prior on the remaining variables; the linearisation (tangent) point of marginalised-connected variables stays fixed thereafter, and residuals that would fill in the Hessian are dropped.
- **Front-end**: a window of $N_f = 7$ active keyframes and $N_p = 2000$ active points. New frames are tracked against the latest keyframe by two-frame direct alignment with a constant-motion model; keyframes are created when a weighted score of mean optical flow, translation-only flow, and brightness change exceeds a threshold (initially 5–10 keyframes/s, then redundant ones are marginalised early — always keeping the latest two, dropping frames with under 5% visibility, otherwise by a spatial distance score). Candidate points are picked with a region-adaptive gradient threshold (median block gradient $\bar g + g_{\text{th}}$, $g_{\text{th}}=7$) over $d \times d$ blocks — so edges and smooth intensity variations on white walls are sampled too — tracked along the epipolar line for a depth initialisation, then activated to maximise spatial spread.

## Results

Evaluated on three datasets, every sequence run forwards and backwards (500 runs on TUM monoVO — 50 photometrically calibrated sequences, 105 min; 220 runs on EuRoC MAV — 11 sequences, 19 min; 80 runs on ICL-NUIM — 8 sequences, 4.5 min), reported as cumulative error plots capturing both accuracy and robustness:

- **TUM monoVO and ICL-NUIM**: "the direct, sparse approach clearly outperforms ORB-SLAM in accuracy and robustness" (alignment/rotation/scale-drift error on monoVO; ATE on ICL-NUIM). LSD-SLAM and SVO "consistently fail on most of the sequences" due to their brightness-constancy assumption under real exposure changes.
- **EuRoC MAV**: ORB-SLAM is more accurate (no photometric calibration available, and its local mapping implicitly closes the datasets' many small loops, which pure odometry cannot); when ORB-SLAM is restricted to map points seen within the last 10 s it performs similar to DSO in accuracy but is less robust.
- **Efficiency**: real-time on an i7-4910MQ; at reduced settings ($N_p = 800$, $N_f = 6$, 424×320) DSO still achieves very good accuracy and robustness while running at 5× real-time speed.
- **Ablations**: full photometric calibration gives the best results and a naïve brightness-constancy assumption performs clearly worst; using more than $N_p = 500$ points or $N_f = 7$ frames has only marginal accuracy impact (2000 points are kept mainly for denser maps).

## Why it matters for SLAM

DSO is the definitive direct sparse method, closing the era opened by DTAM and LSD-SLAM and standing alongside ORB-SLAM as one of the two canonical classical baselines (direct vs feature-based). Its formulation spawned an entire family — LDSO, Stereo DSO, VI-DSO, DVSO, D3VO, DM-VIO — and its photometric-calibration insights, fixed-tangent marginalisation, and sliding-window design are still standard practice in odometry systems today.

## Related

- [LSD-SLAM](lsd-slam.md)
- [LDSO](ldso.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
