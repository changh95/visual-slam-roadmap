# Keypoints

A **keypoint** is a distinguished image location with repeatable geometry — a corner, blob, or edge junction that can be found again in another image of the same scene. A **descriptor** is a compact numerical signature encoding the local appearance around a keypoint, enabling matching across images under varying viewpoint and illumination. Together, a *detector* (finds where) and a *descriptor* (encodes what) form the front-end vocabulary of feature-based SLAM.

Two properties make a keypoint useful:

- **Repeatability**: the same physical point is detected again from a different viewpoint, scale, or lighting.
- **Distinctiveness**: its descriptor differs enough from other points' descriptors that matching is unambiguous.

## The classical lineage

| Method | Detector | Descriptor | Notes |
|---|---|---|---|
| SIFT (2004) | DoG blobs in scale space | 128-D gradient histograms | Very accurate; slow on CPU |
| FAST (2006) | Contiguous bright/dark arc on a 16-pixel circle | none | Extremely fast corner test |
| ORB (2011) | oFAST (FAST + intensity-centroid orientation) | rBRIEF, 256-bit binary | The SLAM workhorse (ORB-SLAM) |
| AKAZE (2013) | Nonlinear diffusion scale space | binary (M-LDB) | Better edge preservation than Gaussian scale space |

**SIFT** detects blobs in *scale space*: the image is convolved with Gaussians at increasing scales, $L(x,y,\sigma) = G(x,y,\sigma) * I(x,y)$, and the **Difference of Gaussians** $D(x,y,\sigma) = L(x,y,k\sigma) - L(x,y,\sigma)$ approximates the Laplacian-of-Gaussian blob detector. Keypoints are local extrema of $D$ across both space and scale, refined to sub-pixel accuracy by quadratic fitting and filtered by contrast and edge response. The descriptor assigns a dominant orientation from the local gradient histogram, then builds a $4\times4$ grid of 8-bin gradient histograms — a 128-D vector, normalized for illumination invariance. SIFT is highly accurate but slow (around a second per high-resolution image on CPU), which limits its use in real-time SLAM.

**FAST** goes to the other extreme: a pixel $p$ is a corner if a contiguous arc of $n \ge 12$ of the 16 pixels on a radius-3 circle around it are all brighter or all darker than $I_p$ by a threshold $t$. A speed-up test checks only the four compass pixels first — if fewer than three pass, $p$ cannot be a corner. FAST has no descriptor and no orientation or scale; it is a detection primitive to be paired with a descriptor.

**ORB** is the combination real-time SLAM adopted almost universally. It adds orientation to FAST via the intensity centroid — with patch moments $m_{pq} = \sum_{x,y} x^p y^q I(x,y)$, the orientation is $\theta = \mathrm{atan2}(m_{01}, m_{10})$ — and rotates BRIEF's binary sampling pattern by $\theta$ for rotation invariance (rBRIEF). A 256-bit descriptor costs 32 bytes, and matching uses Hamming distance computed with `XOR` + `popcount` instructions — fast enough to match thousands of features per frame. Scale invariance comes from detecting on an image pyramid.

**AKAZE** builds its scale space with nonlinear diffusion filtering instead of Gaussian blurring, which preserves edges and yields more accurate keypoints near boundaries; the "accelerated" part is Fast Explicit Diffusion (FED), which brings the cost down to practical levels.

## From detections to matches

Detection is only half the front-end; the matches are what geometry consumes:

- **Brute force**: compare every descriptor against every other — L2 distance for float descriptors (SIFT, SuperPoint), Hamming for binary (ORB, BRIEF). **Lowe's ratio test** filters ambiguous matches: accept only if the nearest distance is well below the second-nearest (e.g., $d_1/d_2 < 0.8$).
- **Approximate search**: FLANN selects between randomized kd-trees (float descriptors) and locality-sensitive hashing (binary descriptors) for large-scale matching.
- **Geometric verification**: surviving matches still contain outliers; RANSAC over an epipolar or PnP model does the final cleanup.

An alternative to detect-and-match every frame is **tracking**: follow keypoints between consecutive frames with pyramidal Lucas-Kanade (KLT), using a forward-backward check to discard unreliable tracks — cheaper, and the standard front-end for many VIO systems.

## What SLAM systems add on top

- **Spatial distribution**: accuracy suffers when all features cluster on one textured object. ORB-SLAM-style systems enforce a per-cell budget over an image grid (with a quadtree refinement) so features cover the whole frame.
- **Non-maximum suppression** and per-level thresholds keep the detector from firing many times on the same corner.
- **Pyramid bookkeeping**: the pyramid level a feature was detected at defines the scale range at which the resulting landmark can later be re-detected.

## The learned generation

Learned detectors/descriptors replace hand-crafted designs with networks trained for repeatability and distinctiveness. **SuperPoint** is trained self-supervised: pretrained on synthetic shapes, then fine-tuned by self-labelling real images under synthetic homographies ("homographic adaptation"); one shared encoder feeds a detector head (keypoint score map) and a descriptor head (dense descriptor map). **R2D2** predicts two separate maps — *repeatability* (will this point be detected again?) and *reliability* (is its descriptor distinctive?) — and keeps points where both are high, which helps in textureless or repetitive regions. These are typically paired with learned matchers like SuperGlue at later levels.

In a SLAM pipeline, keypoints are the raw material for everything downstream: 2D-2D correspondences for initialization and essential-matrix estimation, 2D-3D correspondences for pose tracking (PnP), triangulation into 3D landmarks, and bag-of-visual-words place recognition for loop closure.

## Why it matters for SLAM

Feature-based (indirect) SLAM — the dominant paradigm from PTAM through ORB-SLAM3 — stands entirely on keypoints: the quality, speed, and distribution of detected features bound the accuracy and robustness of the whole system. Understanding detector/descriptor trade-offs (accuracy vs. Hz, binary vs. float descriptors, hand-crafted vs. learned) is essential both for reading papers and for the very practical task of choosing a front-end for your compute budget.

## Hands-on

- [Classical local feature detection](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_03)
- [Deep local feature detection](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_04)

## Related

- [Corner detector](../level-01-beginner/corner-detector.md)
- [2D-2D correspondence](2d-2d-correspondence.md)
- [Landmark](landmark.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
- [SuperGlue](../level-05-deep-learning/superglue.md)
- [Learned vs hand-crafted features](../level-05-deep-learning/learned-vs-hand-crafted.md)
