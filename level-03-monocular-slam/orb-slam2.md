# ORB-SLAM2

> Mur-Artal 2017 · [Paper](https://arxiv.org/abs/1610.06475)

**One-line summary** — Extends ORB-SLAM to stereo and RGB-D cameras, providing a unified open-source SLAM framework with metric scale and state-of-the-art accuracy across all three sensor modalities.

## Key ideas

- **Stereo processing**: right-image ORB features are matched to left-image features along epipolar rows; close stereo points (depth below roughly 40x the baseline) are triangulated immediately, while far points fall back to monocular triangulation across keyframes.
- **RGB-D as virtual stereo**: depth images are converted into virtual stereo pairs by back-projecting depth values, so the same stereo pipeline handles RGB-D input — a trick that became widely adopted.
- **Metric scale**: stereo and RGB-D depth eliminates the scale ambiguity and scale drift that plague monocular ORB-SLAM.
- **Unified BA**: bundle adjustment jointly optimises monocular and stereo observations in one framework.
- **Lightweight localisation mode**: a map-frozen mode uses visual odometry in unmapped regions while matching map points for drift-free localisation in mapped areas.

## Why it matters for SLAM

ORB-SLAM2 turned ORB-SLAM into a general-purpose SLAM library covering monocular, stereo, and RGB-D sensors, and it remained the dominant accuracy baseline in SLAM papers for several years. It is the natural bridge from monocular SLAM (Level 3) to stereo SLAM (Level 7) and RGB-D SLAM (Level 4), and the direct predecessor of ORB-SLAM3's visual-inertial, multi-map system.

## Related

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM3](orb-slam3.md)
- [Scale ambiguity](scale-ambiguity.md)
- [OpenVSLAM](openvslam.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
