# Brute-Force Matching

**Brute-force (BF) matching** is the exact, exhaustive approach to descriptor matching: compare every descriptor from image 1 against every descriptor from image 2 and keep the nearest neighbor (or the top-$k$ neighbors). For $n$ and $m$ keypoints with descriptor dimension $d$, the cost is $O(n \cdot m \cdot d)$. It is the baseline every approximate method (FLANN, kd-trees, LSH) is measured against — and for the descriptor counts typical of frame-to-frame SLAM, often the right choice.

## Distance metrics

- **Floating-point descriptors** (SIFT, SuperPoint): Euclidean (L2) distance

$$d(\mathbf{a}, \mathbf{b}) = \lVert \mathbf{a} - \mathbf{b} \rVert_2$$

- **Binary descriptors** (ORB, BRIEF, AKAZE's M-LDB): **Hamming distance** — the number of differing bits, computed as

$$d_H(\mathbf{a}, \mathbf{b}) = \mathrm{popcount}(\mathbf{a} \oplus \mathbf{b})$$

A 256-bit ORB descriptor occupies just 32 bytes, and XOR + popcount are single machine instructions, so a full Hamming comparison costs a handful of cycles. This is why binary descriptors turned brute-force matching from a bottleneck into something routinely done exhaustively on CPU, and trivially on GPU.

## Filtering raw matches

Nearest-neighbor distance alone is a poor acceptance criterion; several standard filters remove ambiguous and spurious matches:

- **Lowe's ratio test.** For each query descriptor, find the nearest distance $d_1$ and second-nearest distance $d_2$, and accept the match only if

$$\frac{d_1}{d_2} < \tau \qquad (\tau \approx 0.8)$$

A distinctive, correct match should be much closer than the runner-up; if two candidates are nearly equidistant, the match is ambiguous (repetitive texture) and is discarded. This single test eliminates a large fraction of false matches.

- **Cross-check (mutual nearest neighbor).** Accept $(i, j)$ only if $j$ is the nearest neighbor of $i$ *and* $i$ is the nearest neighbor of $j$. A simple symmetric consistency filter, often used instead of the ratio test for binary descriptors.
- **Absolute distance threshold.** For binary descriptors, reject matches whose Hamming distance exceeds a cutoff (a substantial fraction of differing bits means the patches are unrelated).
- **Geometric verification.** Whatever survives descriptor filtering still contains outliers; RANSAC over an epipolar or homography model is the final gate.

## When brute force wins — and when it doesn't

BF matching is exact, has no build-time or tuning parameters, and is embarrassingly parallel (SIMD, GPU). For matching two frames with a few thousand keypoints each, it is simple and fast enough. Approximate nearest-neighbor structures pay off when the database side is large and reused across many queries — place-recognition databases, relocalization against big maps, offline SfM with tens of thousands of images.

Inside a running SLAM system, even brute force is often avoided entirely: with a motion prediction available, features are matched by **projection-guided search** — project map points into the current frame and compare descriptors only within a small window around the predicted location. This shrinks the candidate set from "all features" to "a few nearby ones," which is both faster and less ambiguous than any global matching.

## Why it matters for SLAM

Data association is the front-end's core job, and brute-force matching with a ratio test or cross-check is the canonical way to get putative correspondences for initialization, wide-baseline keyframe matching, and loop-closure verification. Understanding its cost structure — and how binary descriptors plus Hamming distance make exhaustive search cheap — explains major design choices in systems like ORB-SLAM, and clarifies exactly when the added complexity of approximate search (FLANN, LSH, vocabulary-tree lookups) is justified.

## Related

- [FLANN](flann.md)
- [Kd-tree](kd-tree.md)
- [LSH](lsh.md)
- [ORB](orb.md)
- [SIFT](sift.md)
