# DSO

> Engel 2016 · [Paper](https://arxiv.org/abs/1607.02565)

**One-line summary** — Direct Sparse Odometry performs full photometric bundle adjustment over a sparse, evenly distributed set of high-gradient pixels, combining the accuracy of direct methods with the efficiency of sparse optimisation.

## Problem

Before DSO, the direct and sparse worlds each kept only half the prize. LSD-SLAM tracked photometrically but refined the map with pose-graph optimisation, never jointly optimising geometry and motion; feature-based methods (ORB-SLAM) did full bundle adjustment but discarded the photometric signal by reducing images to keypoints. DSO combines "a fully direct probabilistic model (minimizing a photometric error) with consistent, joint optimization of all model parameters" — poses, inverse depths, and camera parameters together — and achieves this in real time "by omitting the smoothness prior used in other direct methods and instead sampling pixels evenly throughout the images."

## Key ideas

- **Photometric bundle adjustment**: instead of minimising reprojection error of matched features, DSO jointly optimises camera poses, inverse depths (in a reference frame), and photometric parameters by minimising intensity error directly:
  $$E_{\text{photo}} = \sum_{i \in \mathcal{F}} \sum_{\mathbf{p} \in \mathcal{P}_i} \sum_{j \in \text{obs}(\mathbf{p})} w_{\mathbf{p}} \left\| \frac{I_j[\mathbf{p}'] - b_j}{t_j} - \frac{I_i[\mathbf{p}] - b_i}{t_i} \right\|_\gamma$$
  where $\mathbf{p}' = \pi(\mathbf{T}_{ji}\, \pi^{-1}(\mathbf{p}, d_\mathbf{p}))$, $b$ are affine brightness parameters, and $\|\cdot\|_\gamma$ is the Huber norm.
- **Sparse point selection without a smoothness prior**: rather than all pixels (DTAM) or only corners (ORB-SLAM), points are sampled evenly from all regions with sufficient intensity gradient — because no keypoint detector is required, DSO "can naturally sample pixels from across all image regions that have intensity gradient, including edges or smooth intensity variations on mostly white walls." Dropping the regulariser is what makes points independent and the Hessian sparse.
- **Full photometric calibration**: DSO models the complete image formation pipeline, $I'(\mathbf{x}) = G\bigl(t \cdot V(\mathbf{x}) \cdot B(\mathbf{x})\bigr)$ — exposure time $t$, vignette $V$, camera response function $G$ — which markedly improves direct tracking accuracy.
- **Sliding-window BA with marginalisation**: a window of 5-7 active keyframes is maintained; old keyframes and points are marginalised out via the Schur complement, keeping optimisation real-time while retaining their information as a prior.
- **No loop closure**: DSO is a visual odometry system with no global optimisation, so drift accumulates; LDSO later added BoW loop closure and Sim(3) pose-graph optimisation on top.

## Results & impact

From the abstract: evaluated "on three different datasets comprising several hours of video," DSO "significantly outperforms state-of-the-art direct and indirect methods in a variety of real-world settings, both in terms of tracking accuracy and robustness." Across these benchmarks DSO compares favourably with LSD-SLAM and ORB-SLAM on many sequences, especially where feature distributions are poor; the work was later published in TPAMI. The accompanying TUM monoVO dataset, with photometric calibration data, itself became a standard benchmark for direct methods.

## Why it matters for SLAM

DSO is the definitive direct sparse method, closing the era opened by DTAM and LSD-SLAM and standing alongside ORB-SLAM as one of the two canonical classical baselines (direct vs feature-based). Its formulation spawned an entire family — LDSO, Stereo DSO, VI-DSO, DVSO, D3VO, DM-VIO — and its photometric-calibration insights and sliding-window marginalisation design are still standard practice in odometry systems today.

## Related

- [LSD-SLAM](lsd-slam.md)
- [LDSO](ldso.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
