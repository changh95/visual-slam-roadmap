# Visual Odometry

> Nistér 2004 · [Paper](https://ieeexplore.ieee.org/document/1315094)

**One-line summary** — Coined the term "visual odometry" and demonstrated real-time, frame-by-frame camera pose estimation from monocular and stereo video, establishing VO as a practical navigation capability.

## Problem

Before this work, camera-based ego-motion estimation existed mainly as offline structure-from-motion: batch pipelines that processed image collections for minutes or hours. What autonomous navigation needed was the opposite — incremental, real-time, frame-by-frame pose estimation from a video stream, robust enough to run on a moving vehicle. Nistér, Naroditsky, and Bergen (CVPR 2004) showed this was practical, for both stereo and monocular cameras, and named the capability *visual odometry* by analogy with wheel odometry.

## Key ideas

- **Real-time incremental ego-motion**: the pipeline processes each incoming frame as it arrives and outputs the current pose immediately — a fundamentally different regime from batch SfM, and the regime every SLAM front-end has lived in since.
- **Feature detection and matching**: Harris corners are detected in each frame and matched across consecutive frames using correlation of local image patches.
- **Five-point essential matrix solver**: relative pose between calibrated views is estimated with the minimal five-point algorithm for the essential matrix $\mathbf{E}$ (satisfying $\mathbf{x}'^\top \mathbf{E}\, \mathbf{x} = 0$ for corresponding normalized image points); using the *minimal* number of points makes each hypothesis cheap and maximizes the chance of an all-inlier sample.
- **RANSAC for robustness**: the minimal solver runs inside a RANSAC loop, generating pose hypotheses from random 5-point samples and scoring them against all matches, so mismatched corners are rejected as outliers.
- **Triangulation and pose chaining**: inlier matches are triangulated into 3D points, camera pose is estimated relative to them, and frame-to-frame relative poses are composed into a global trajectory; in the stereo variant the known baseline fixes metric scale.
- **Local-only, no loop closure**: there is no global optimization, place recognition, or map reuse — drift accumulates without bound, which is precisely what separates VO from full SLAM.

## Results & impact

The system ran live on real vehicle platforms, demonstrating for the first time that cameras alone can serve as a practical navigation sensor at frame rate. The five-point algorithm introduced alongside this work became the standard tool for calibrated two-view geometry (it is what `findEssentialMat` in OpenCV descends from), and "visual odometry" became the accepted name for an entire subfield. Every feature-based SLAM front-end since — PTAM, ORB-SLAM and its descendants — still follows the feature → minimal solver + RANSAC → triangulation skeleton established here.

## Why it matters for SLAM

This paper defined visual odometry as a distinct problem and proved that cameras can serve as primary navigation sensors, laying the groundwork for every monocular SLAM system that followed. Its pipeline — features, minimal solver + RANSAC, triangulation, pose composition — is still the skeleton of most geometric front-ends. Understanding what it lacks (loop closure, global consistency) is the cleanest way to understand what SLAM adds on top of VO.

## Related

- [VO vs SLAM](vo-vs-slam.md) — the conceptual distinction this paper motivates
- [MonoSLAM](monoslam.md) — the first real-time monocular SLAM, published shortly after
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md) — theory behind the essential matrix
- [Triangulation](../level-01-beginner/triangulation.md) — recovering 3D points from two views
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md) — the matching problem underlying VO
- [Corner detector](../level-01-beginner/corner-detector.md) — the Harris features the original pipeline tracked

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
