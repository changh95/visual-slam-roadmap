# RANSAC

**RANSAC (Random Sample Consensus)**, introduced by Fischler & Bolles in 1981, is the dominant robust estimation method in SLAM and multi-view geometry. It fits a parametric model (essential matrix, homography, camera pose, plane, ...) to data contaminated by **outliers** — false feature matches, occlusions, moving objects — by repeatedly hypothesizing models from small random samples and scoring them by consensus.

## Algorithm

1. Draw a **minimal sample** $S$ of $s$ correspondences uniformly at random ($s$ = smallest number that determines the model: 5 points for the essential matrix, 4 for a homography, 3 for P3P, 8 for the fundamental matrix with the linear 8-point algorithm).
2. Fit the model $\theta_S$ to the sample.
3. Count **inliers**: data points consistent with $\theta_S$ within an error threshold $\epsilon$ (e.g., Sampson distance or reprojection error of a few pixels).
4. Repeat for $N$ iterations; keep the model with the largest inlier set.
5. Optionally **refit** the model to all inliers by least squares (and often iterate the refit).

The key insight: even with 50% outliers, a small all-inlier sample is drawn with reasonable probability after enough tries, and the correct model gathers far more consensus than models fit to contaminated samples.

## How many iterations?

Let $w$ be the inlier ratio. The probability that one sample of $s$ points is all-inlier is $w^s$, so the probability that **at least one** of $N$ samples is all-inlier is

$$
P(\text{success}) = 1 - (1 - w^s)^N
$$

Requiring $P(\text{success}) \geq 1 - \eta$ (e.g., $\eta = 0.01$ for 99% confidence) gives

$$
N = \frac{\log \eta}{\log(1 - w^s)}
$$

Examples at $w = 0.5$, $\eta = 0.01$:

| Solver | $s$ | $N$ |
|---|---|---|
| 5-point essential matrix | 5 | $\approx 145$ |
| 8-point fundamental matrix | 8 | $\approx 1177$ |

The iteration count grows **exponentially in the sample size** — this is exactly why minimal solvers (5-point E, P3P) are preferred inside RANSAC over larger linear solvers.

**Adaptive RANSAC** does not fix $N$ in advance: it re-estimates $w$ from the best inlier set found so far, recomputes $N$, and terminates early once enough samples have been drawn for the current estimate — usually far fewer iterations in easy scenes.

## Practical notes

- The threshold $\epsilon$ should reflect the measurement noise (pixels); too tight rejects good data, too loose admits outliers.
- Degenerate samples (collinear/coplanar points for some models) must be detected and re-drawn.
- Variants: **PROSAC** (samples quality-ranked matches first), **LO-RANSAC** (local optimization of promising models), **MLESAC** (scores by likelihood instead of inlier count), and globally optimal alternatives such as **MaxCon** consensus maximization.
- After RANSAC, remaining small errors are handled by M-estimators / robust kernels inside the nonlinear refinement.

## Why it matters for SLAM

- **Every geometric estimation step** in a feature-based pipeline runs inside RANSAC: essential/fundamental matrix for initialization and 2D–2D motion, homography for planar scenes, PnP for tracking and relocalization, ICP correspondence pruning, and loop-closure verification.
- Descriptor matching alone routinely produces 20–50% wrong matches; without RANSAC the least-squares estimates would be arbitrarily corrupted (least squares has zero breakdown tolerance to outliers).
- Loop-closure candidates from place recognition are **geometrically verified** with RANSAC before being added to the pose graph — a single false loop constraint can destroy the whole map.

## Related

- [PROSAC](prosac.md)
- [PnP (Perspective-n-Point)](pnp.md)
- [M-estimator](m-estimator.md)
- [MaxCon](maxcon.md)
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)
