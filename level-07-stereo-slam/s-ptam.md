# S-PTAM

> Pire 2017 · [Paper](https://github.com/lrse/sptam)

**One-line summary** — S-PTAM extends PTAM's parallel tracking-and-mapping paradigm to stereo cameras, delivering a complete, real-time, ROS-compatible stereo SLAM system with metric scale from the baseline and loop closure.

## Problem

PTAM proved that splitting SLAM into a real-time tracking thread and a background mapping thread works, but it was monocular: scale-ambiguous, dependent on a delicate two-view initialization, and aimed at small AR workspaces rather than robots. Ground robots needed the same architecture with metric scale, loop closure over large trajectories, and plain ROS integration — a system a robotics lab could actually deploy. S-PTAM fills that gap by rebuilding the PTAM decomposition around a calibrated stereo rig.

## Key ideas

- **PTAM's two-thread architecture, stereo-ified**: a tracking thread estimates the camera pose against the local map at frame rate, while a mapping thread triangulates new points from stereo matches and refines the map with bundle adjustment in the background — so expensive optimization never blocks pose output.
- **Metric scale for free**: depth comes directly from the calibrated stereo baseline via $Z = fB/d$, removing monocular PTAM's scale ambiguity and its delicate two-view initialization: the map is metric from the very first stereo frame.
- **Feature-based pipeline**: binary descriptors matched across the rectified stereo pair create 3D points immediately; keyframes are selected based on covisibility with the existing map, and local/global bundle adjustment (g2o) keeps the map consistent.
- **Loop closure**: bag-of-words place recognition (DBoW2) plus pose-graph optimization corrects accumulated drift — one of the pieces original PTAM never had.
- **Engineering for robots**: full ROS integration, compatibility with standard stereo camera drivers, and modest CPU requirements made it practical on real ground platforms, not just benchmarks.

## Results & impact

Published in Robotics and Autonomous Systems (2017), S-PTAM became one of the first complete open-source stereo SLAM systems with loop closure, and was widely used for ground-robot navigation before ORB-SLAM2 became the dominant feature-based baseline. Its lasting value is architectural: it demonstrated that PTAM's tracking/mapping split scales cleanly from desktop AR to metric, large-trajectory robot SLAM.

## Why it matters for SLAM

S-PTAM is a bridge between the PTAM era and modern stereo SLAM: it showed that the tracking/mapping decomposition scales cleanly to stereo and to large outdoor trajectories, and it was one of the first complete open-source stereo SLAM systems that a robotics lab could actually deploy through ROS. It served as a common ground-robot baseline before ORB-SLAM2 became the dominant feature-based reference, and reading it is a good way to understand the architecture that ORB-SLAM systems refined.

## Related

- [PTAM](../level-03-monocular-slam/ptam.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
- [StereoMSCKF](stereomsckf.md)
- [Disparity vs Depth](disparity-vs-depth.md)
- [Stereo rectification](stereo-rectification.md)

[Back to Level 7](../README.md#level-7-stereo-slam)
