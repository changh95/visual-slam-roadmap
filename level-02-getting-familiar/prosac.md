# PROSAC

**PROSAC (Progressive Sample Consensus)**, by Chum & Matas (2005), is a RANSAC variant that exploits a fact plain RANSAC throws away: correspondences are **not equally likely to be inliers**, and we usually have a per-match quality score that predicts it — the descriptor distance, or better, Lowe's ratio $d_1 / d_2$ between the nearest and second-nearest neighbor distances.

## Idea

Sort the $n$ tentative correspondences by quality, best first. Instead of sampling minimal sets uniformly from all $n$ matches, PROSAC draws samples from a **progressively growing subset** of the top-ranked matches:

- Early iterations sample only from the few best matches (e.g., the top $s+1$, then top $s+2$, ...), where the inlier density is highest.
- As iterations proceed, the sampling pool grows toward the full set, so in the limit PROSAC's sampling distribution converges to uniform sampling over all matches.

Formally, a growth function determines after how many samples the pool size increases from $m$ to $m+1$; each sample consists of the newly added match plus $s - 1$ matches drawn from the top $m$. The design goal is that PROSAC draws (approximately) the same set of samples as RANSAC would, only **in a different, quality-driven order** — most promising first.

## Algorithm sketch

1. Sort correspondences by quality score, best first.
2. Maintain the current pool size $m$ (initially $m = s$) and its growth schedule.
3. At each iteration, form a minimal sample from the top-$m$ matches as described above, fit the model, and verify against **all** $n$ correspondences.
4. Track the best model by inlier count; stop when the RANSAC-style confidence criterion is met (non-random inlier count plus enough samples for the current inlier-ratio estimate).
5. Refit on all inliers by least squares, as in standard RANSAC.

## Properties

- **Speed**: when the quality ranking is informative (top matches really are mostly inliers), an all-inlier sample is found within the first few dozen draws, orders of magnitude faster than uniform RANSAC at low overall inlier ratios. The overall inlier ratio $w$ may be terrible (say 10%), yet the top-20 matches may be 90% inliers — PROSAC's effective $w^s$ over the early pool is dramatically higher.
- **Same guarantees in the worst case**: if the scores are uninformative, PROSAC degrades gracefully to standard RANSAC behavior, with the same stopping criterion

$$
P(\text{success}) = 1 - (1 - w^s)^N \geq 1 - \eta
$$

- **Same verification step**: hypotheses are still scored by inlier consensus over *all* correspondences, so a biased sampling pool does not bias the final model selection.

## Practical notes

- The quality measure matters: the Lowe ratio is a much better inlier predictor than raw descriptor distance.
- PROSAC pairs naturally with adaptive termination — the earliest good model shrinks the required iteration count immediately.
- OpenCV exposes PROSAC-style sampling in its USAC framework (`cv::USAC_PROSAC`) for `findEssentialMat`, `findHomography`, `solvePnPRansac`, etc.
- Beware degenerate early pools: the top-ranked matches often concentrate on one strongly textured object or plane, which can yield a locally consistent but globally wrong model (e.g., a homography of one plane when you wanted the essential matrix); degeneracy checks still apply.

## Why it matters for SLAM

- Real-time budgets are tight: tracking runs at 30–60 Hz, and geometric verification must finish in milliseconds. PROSAC delivers RANSAC-quality outlier rejection at a fraction of the iterations in typical scenes.
- SLAM front-ends already compute the needed match scores (descriptor distances, ratio-test values) during matching, so the ranking comes for free.
- Especially valuable in **relocalization and loop closing**, where the candidate match sets are large and heavily contaminated, and uniform RANSAC would need thousands of iterations.

## Related

- [RANSAC](ransac.md)
- [Brute-force matching](brute-force-matching.md)
- [2D-2D correspondence](2d-2d-correspondence.md)
- [MaxCon](maxcon.md)
