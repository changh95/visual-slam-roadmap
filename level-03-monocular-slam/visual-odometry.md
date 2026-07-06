# Visual Odometry

> Nistér 2004 · [Paper](https://ieeexplore.ieee.org/document/1315094)

**One-line summary** — Coined the term "visual odometry" and demonstrated real-time, frame-by-frame camera pose estimation from monocular and stereo video, establishing VO as a practical navigation capability.

## Key ideas

- **Real-time incremental ego-motion**: before this work, camera-based motion estimation mostly lived in offline structure-from-motion; Nistér showed it running live, frame by frame, on real vehicles.
- **Five-point essential matrix solver**: relative pose between calibrated views is estimated with the minimal five-point algorithm, which became the standard tool for two-view geometry.
- **RANSAC for robustness**: the minimal solver runs inside a RANSAC loop over Harris-corner matches, rejecting outlier correspondences.
- **Triangulation and pose chaining**: inlier matches are triangulated into 3D points, and frame-to-frame relative poses are composed into a global trajectory.
- **Local-only, no loop closure**: there is no global optimization or place recognition — drift accumulates over time, which is precisely what separates VO from full SLAM.

## Why it matters for SLAM

This paper defined visual odometry as a distinct problem and proved that cameras can serve as primary navigation sensors, laying the groundwork for every monocular SLAM system that followed. Its pipeline — features, minimal solver + RANSAC, triangulation, pose composition — is still the skeleton of most geometric front-ends. Understanding what it lacks (loop closure, global consistency) is the cleanest way to understand what SLAM adds on top of VO.

## Related

- [VO vs SLAM](vo-vs-slam.md) — the conceptual distinction this paper motivates
- [MonoSLAM](monoslam.md) — the first real-time monocular SLAM, published shortly after
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md) — theory behind the essential matrix
- [Triangulation](../level-01-beginner/triangulation.md) — recovering 3D points from two views
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md) — the matching problem underlying VO

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
