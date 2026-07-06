# S-PTAM

> Pire 2017 · [Paper](https://github.com/lrse/sptam)

**One-line summary** — S-PTAM extends PTAM's parallel tracking-and-mapping paradigm to stereo cameras, delivering a complete, real-time, ROS-compatible stereo SLAM system with metric scale from the baseline and loop closure.

## Key ideas

- **PTAM's two-thread architecture, stereo-ified**: a tracking thread estimates the camera pose against the local map at frame rate, while a mapping thread triangulates new points from stereo matches and refines the map with bundle adjustment in the background.
- **Metric scale for free**: depth comes directly from the calibrated stereo baseline, removing monocular PTAM's scale ambiguity and its delicate two-view initialization.
- **Feature-based pipeline**: binary descriptors matched across the rectified stereo pair create 3D points immediately; keyframes are selected by tracked-feature coverage, and local/global bundle adjustment (g2o) keeps the map consistent.
- **Loop closure**: bag-of-words place recognition plus pose-graph optimization corrects accumulated drift.
- **Engineering for robots**: full ROS integration and modest CPU requirements made it practical on real ground platforms, not just benchmarks.

## Why it matters for SLAM

S-PTAM is a bridge between the PTAM era and modern stereo SLAM: it showed that the tracking/mapping decomposition scales cleanly to stereo and to large outdoor trajectories, and it was one of the first complete open-source stereo SLAM systems that a robotics lab could actually deploy through ROS. It served as a common ground-robot baseline before ORB-SLAM2 became the dominant feature-based reference, and reading it is a good way to understand the architecture that ORB-SLAM systems refined.

## Related

- [PTAM](../level-03-monocular-slam/ptam.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
- [StereoMSCKF](stereomsckf.md)
- [Disparity vs Depth](disparity-vs-depth.md)

---
[Back to Level 7](../README.md#level-7-stereo-slam)
