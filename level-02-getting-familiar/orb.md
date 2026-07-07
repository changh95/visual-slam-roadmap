# ORB (Oriented FAST and Rotated BRIEF)

ORB (Rublee et al., 2011) is the keypoint detector + binary descriptor combination that powers ORB-SLAM and much of real-time visual SLAM. It was designed as a fast, patent-free alternative to SIFT/SURF: two orders of magnitude faster than SIFT, with matching quality good enough for tracking, relocalization, and loop closure. As the name says, it is two upgrades bolted together: **oFAST** (FAST with orientation) and **rBRIEF** (BRIEF with rotation awareness).

## oFAST: FAST keypoints with orientation

[FAST](fast.md) finds corners by testing a circle of 16 pixels around a candidate, but it provides neither scale nor orientation, and its corner response is not comparable across detections. ORB fixes all three:

- **Scale**: FAST is run on every level of an [image pyramid](image-pyramid.md), so the same world point can be detected as the camera moves closer or farther.
- **Ranking**: detected candidates are scored with the Harris corner measure, and the top $N$ are kept — FAST alone tends to fire on edges.
- **Orientation** via the **intensity centroid**. Define the patch moments and orientation:

$$
m_{pq} = \sum_{x, y \in \text{patch}} x^p y^q\, I(x, y), \qquad
\theta = \operatorname{atan2}(m_{01},\, m_{10})
$$

The vector from the corner's center to the patch's intensity centroid gives a repeatable angle $\theta$: rotate the image, and $\theta$ rotates with it. This single angle is what makes the descriptor rotation-invariant.

## rBRIEF: a steered, de-correlated binary descriptor

BRIEF describes a smoothed patch with $n$ binary intensity comparisons: for a pre-defined pair of offsets $(\mathbf{a}_i, \mathbf{b}_i)$, bit $i$ is

$$
\tau_i = \begin{cases} 1 & I(\mathbf{a}_i) < I(\mathbf{b}_i) \\ 0 & \text{otherwise} \end{cases}
$$

giving an $n$-bit string ($n = 256$ in ORB, i.e. 32 bytes). Plain BRIEF collapses under rotation, so ORB **steers** the test pattern: all point pairs are rotated by the keypoint's orientation $\theta$ (discretized into lookup tables) before sampling.

Steering, however, destroys some of BRIEF's statistical goodness — the rotated tests become more correlated and less discriminative. ORB's answer is **rBRIEF**: a greedy offline search over a large pool of candidate test pairs, selecting 256 tests that simultaneously have high variance (means near 0.5, so each bit is informative) and low correlation with the already-selected tests. The result recovers most of the lost discriminability while keeping the binary format.

## Matching ORB descriptors

Binary descriptors are compared with **Hamming distance** — the number of differing bits — computed as `popcount(x XOR y)`, a couple of machine instructions per descriptor pair. This makes [brute-force matching](brute-force-matching.md) of thousands of descriptors feasible in real time, and [LSH](lsh.md) or bag-of-words inverted indices handle map-scale search. The usual filters apply: Lowe's ratio test between the best and second-best distance, cross-checking, and geometric verification with RANSAC.

## In practice

OpenCV ships ORB as `cv::ORB::create()`, with the knobs that matter exposed directly: the number of features to retain, the pyramid scale factor and number of levels, and the FAST threshold. Two practical habits from ORB-SLAM are worth copying:

- **Spatial distribution**: taking the N strongest responses tends to clump features on high-texture regions; bucketing the image into a grid (or the quadtree distribution ORB-SLAM uses) and forcing per-cell quotas gives geometry-friendly, well-spread features.
- **Pyramid-aware matching**: a descriptor extracted at pyramid level $k$ should be matched against similar levels — comparing across very different scales wastes Hamming budget on false candidates.

## Why it matters for SLAM

ORB hits the sweet spot that made feature-based SLAM practical on CPUs and embedded hardware: detection, description, and matching of ~1000 features per frame comfortably within a 30 fps budget, with enough invariance (scale via pyramid, rotation via oFAST/rBRIEF) for wide-baseline matching. ORB-SLAM built its entire architecture on this one feature — the *same* ORB descriptors serve frame-to-frame tracking, local-map matching, relocalization, and loop-closure detection through a [bag of visual words](bag-of-visual-words.md) vocabulary — which is a large part of why the system is so coherent and robust. Even in the deep-learning era, ORB remains the default baseline that learned features (SuperPoint and friends) are measured against, and still the pragmatic choice when compute is scarce.

## Related

- [FAST](fast.md)
- [Image pyramid](image-pyramid.md)
- [Brute-force matching](brute-force-matching.md)
- [Bag of Visual Words](bag-of-visual-words.md)
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md)
