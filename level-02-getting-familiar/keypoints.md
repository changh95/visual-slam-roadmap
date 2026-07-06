# Keypoints

A **keypoint** is a distinguished image location with repeatable geometry — a corner, blob, or edge junction that can be found again in another image of the same scene. A **descriptor** is a compact numerical signature encoding the local appearance around a keypoint, enabling matching across images under varying viewpoint and illumination. Together, a *detector* (finds where) and a *descriptor* (encodes what) form the front-end vocabulary of feature-based SLAM.

Two properties make a keypoint useful:

- **Repeatability**: the same physical point is detected again from a different viewpoint, scale, or lighting.
- **Distinctiveness**: its descriptor differs enough from other points' descriptors that matching is unambiguous.

The classical detector/descriptor lineage you should know:

| Method | Detector | Descriptor | Notes |
|---|---|---|---|
| SIFT (2004) | DoG blobs in scale space | 128-D gradient histograms | Very accurate; slow on CPU |
| FAST (2006) | Contiguous bright/dark arc on a 16-pixel circle | none | Extremely fast corner test |
| ORB (2011) | oFAST (FAST + intensity-centroid orientation) | rBRIEF, 256-bit binary | The SLAM workhorse (ORB-SLAM) |
| AKAZE (2013) | Nonlinear diffusion scale space | binary (M-LDB) | Better edge preservation than Gaussian scale space |

ORB deserves special attention because real-time SLAM adopted it almost universally: a 256-bit descriptor costs 32 bytes, and matching uses Hamming distance computed with `XOR` + `popcount` instructions — fast enough to match thousands of features per frame. ORB adds orientation to FAST via the intensity centroid, $\theta = \mathrm{atan2}(m_{01}, m_{10})$ with patch moments $m_{pq} = \sum_{x,y} x^p y^q I(x,y)$, and rotates BRIEF's sampling pattern by $\theta$ for rotation invariance.

The learned generation replaces hand-crafted designs with networks trained for repeatability and distinctiveness: **SuperPoint** (self-supervised via homographic adaptation, joint detector + descriptor heads) and **R2D2** (separate repeatability and reliability maps) are the representative examples, typically paired with learned matchers like SuperGlue at later levels.

In a SLAM pipeline, keypoints are the raw material for everything downstream: 2D-2D correspondences for initialization and essential-matrix estimation, 2D-3D correspondences for pose tracking (PnP), triangulation into 3D landmarks, and bag-of-visual-words place recognition for loop closure.

## Why it matters for SLAM

Feature-based (indirect) SLAM — the dominant paradigm from PTAM through ORB-SLAM3 — stands entirely on keypoints: the quality, speed, and distribution of detected features bound the accuracy and robustness of the whole system. Understanding detector/descriptor trade-offs (accuracy vs. Hz, binary vs. float descriptors, hand-crafted vs. learned) is essential both for reading papers and for the very practical task of choosing a front-end for your compute budget.

## Related

- [Corner detector](../level-01-beginner/corner-detector.md)
- [2D-2D correspondence](2d-2d-correspondence.md)
- [Landmark](landmark.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
- [Learned vs hand-crafted features](../level-05-deep-learning/learned-vs-hand-crafted.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
