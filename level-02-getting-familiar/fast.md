# FAST (Features from Accelerated Segment Test)

**FAST** (Rosten & Drummond, 2006) is a corner detector designed for one thing: speed. Instead of computing image gradients and a structure tensor (Harris/Shi-Tomasi) or building a scale space (SIFT), FAST decides corner-ness with a handful of intensity comparisons on a small circle of pixels — cheap enough to run on every pixel of every frame at high frame rates, which made it the default detector for real-time SLAM front-ends (PTAM, SVO, and via ORB, the ORB-SLAM family).

## The segment test

Consider a candidate pixel $p$ with intensity $I_p$ and the 16 pixels on a Bresenham circle of radius 3 around it. Pixel $p$ is declared a corner if there exists a **contiguous arc of at least $n$ pixels** on that circle that are all significantly brighter or all significantly darker than $p$, given a threshold $t$:

$$
\forall x \in \text{arc}: \quad I_x > I_p + t \qquad \text{or} \qquad \forall x \in \text{arc}: \quad I_x < I_p - t
$$

The classic choice is $n = 12$ (FAST-12: 12 of 16 pixels), which admits a very effective **high-speed test**: examine only the four compass pixels (top, right, bottom, left — positions 1, 5, 9, 13). If a 12-pixel contiguous arc exists, at least three of these four must be brighter than $I_p + t$ or darker than $I_p - t$; if fewer than three pass, $p$ is rejected after just four comparisons. Since the vast majority of image pixels are not corners, this early exit dominates the average cost.

## The machine-learned variant

The hand-coded compass test has two weaknesses: it does not generalize to $n < 12$, and the fixed questioning order is not optimal for real image statistics. Rosten & Drummond therefore *learned* the detector: each of the 16 circle pixels is classified relative to $I_p$ as brighter / darker / similar, and a decision tree (built with the ID3 algorithm, maximizing information gain) learns the pixel-query order that classifies corners with the fewest expected comparisons on training imagery. The tree is compiled into nested if-statements. This is how FAST-9 ($n = 9$) — usually the most repeatable variant — is made practical, and it is what OpenCV's `cv::FastFeatureDetector` implements.

## Non-maximum suppression

The segment test fires on many adjacent pixels around a single corner. To keep one response per corner, a **corner score** is computed for each detection,

$$
V = \max\!\left( \sum_{x \in S_{\text{bright}}} (I_x - I_p) - t,\;\; \sum_{x \in S_{\text{dark}}} (I_p - I_x) - t \right),
$$

i.e., the largest total contrast of the supporting arc, and non-maximum suppression keeps only local maxima of $V$ in a 3×3 neighbourhood. In SLAM front-ends, detections are additionally bucketed over an image grid so features cover the whole frame rather than clustering on one textured region.

## Variants

- **FAST-9 / FAST-12**: the arc length $n$; FAST-9 detects more corners and is usually the most repeatable, FAST-12 admits the four-pixel early exit even without the learned tree.
- **AGAST** (Mair et al., 2010): replaces the single trained tree with a generic decision tree that adapts to the local image statistics at runtime, removing the dependence on training imagery (used by BRISK).
- **oFAST**: ORB's FAST with an orientation angle from the patch's intensity centroid, plus detection over an image pyramid and a Harris response to rank and prune detections.

## What FAST does *not* give you

- **No descriptor** — FAST only finds locations; it is paired with BRIEF/ORB or used to seed KLT tracks or direct alignment.
- **No scale invariance** — it is run on every level of an image pyramid to detect corners at multiple scales.
- **No orientation** — ORB's *oFAST* adds one via the intensity-centroid of the patch.
- **Threshold sensitivity** — a single global $t$ struggles across scenes with varying contrast; systems adapt $t$ per cell or relax it when too few features are found (as ORB-SLAM does).

## Why it matters for SLAM

Feature detection runs on every frame inside the tracking loop, so its cost directly bounds the achievable frame rate on embedded hardware. FAST made a full detect-describe-match pipeline real-time on CPUs — PTAM used FAST for tracking, SVO seeds its depth filters at FAST corners, VIO front-ends (VINS-Mono, MSCKF implementations) detect FAST corners and track them with KLT, and ORB (oFAST + rBRIEF) turned it into the complete feature of the ORB-SLAM family. Knowing the segment test also explains FAST's failure modes you will observe in practice: responses on edges under noise, clustering on high-contrast texture, and sensitivity to motion blur (the circle contrast collapses when gradients smear).

## Related

- [Keypoints](keypoints.md)
- [Corner detector](../level-01-beginner/corner-detector.md)
- [ORB](orb.md)
- [Image pyramid](image-pyramid.md)
- [KLT Tracker](klt-tracker.md)
