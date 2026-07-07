# ORB-SLAM2

> Mur-Artal 2017 · [Paper](https://arxiv.org/abs/1610.06475)

**One-line summary** — Extends ORB-SLAM to stereo and RGB-D cameras, providing a unified open-source SLAM framework with metric scale and state-of-the-art accuracy across all three sensor modalities.

## Problem

ORB-SLAM was monocular-only, so it suffered from scale ambiguity and scale drift, and it could not directly exploit the stereo and RGB-D cameras that were becoming standard on robots. Stereo and RGB-D sensors provide direct depth, eliminating scale drift, but integrating them well requires deciding when depth is trustworthy and keeping one consistent backend. ORB-SLAM2 (IEEE TRO 2017) generalises the framework to all three modalities so that the system "works in real-time on standard CPUs in a wide variety of environments, from small hand-held indoors sequences, to drones flying in industrial environments and cars driving around a city" (abstract).

## Key ideas

- **Stereo processing with a close/far split**: right-image ORB features are matched to left-image features along epipolar rows; *close* stereo points (depth below roughly 40x the baseline) are triangulated immediately from one frame, while *far* points — whose stereo depth is unreliable — fall back to monocular triangulation across keyframes. Close points give scale and translation; far points still constrain rotation.
- **RGB-D as virtual stereo**: each depth measurement is converted into a virtual right-image coordinate, so the same stereo pipeline and BA formulation handle RGB-D input — a trick that became widely adopted.
- **Metric scale from the backend**: bundle adjustment with combined monocular and stereo observations allows "accurate trajectory estimation with metric scale" (abstract), removing the $\mathrm{Sim}(3)$ scale drift correction needed in monocular mode ($\mathrm{SE}(3)$ suffices for loops).
- **Full SLAM pipeline retained**: map reuse, loop closing, and relocalization all carry over from ORB-SLAM, now across three sensor types in one codebase.
- **Lightweight localisation mode**: a map-frozen mode "leverages visual odometry tracks for unmapped regions and matches to map points that allow for zero-drift localization" (abstract) — an early, practical map-reuse deployment feature.

## Results & impact

Evaluated on 29 popular public sequences (TUM RGB-D, KITTI, EuRoC), ORB-SLAM2 achieved state-of-the-art accuracy, "being in most cases the most accurate SLAM solution" (abstract). The authors explicitly released it as an out-of-the-box SLAM solution for researchers in other fields, and it worked: ORB-SLAM2 remained the dominant accuracy baseline in SLAM papers for several years, and its virtual-stereo RGB-D formulation and close/far stereo point policy were copied broadly.

## Why it matters for SLAM

ORB-SLAM2 turned ORB-SLAM into a general-purpose SLAM library covering monocular, stereo, and RGB-D sensors, and it remained the dominant accuracy baseline in SLAM papers for several years. It is the natural bridge from monocular SLAM (Level 3) to stereo SLAM (Level 7) and RGB-D SLAM (Level 4), and the direct predecessor of ORB-SLAM3's visual-inertial, multi-map system.

## Related

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM3](orb-slam3.md)
- [Scale ambiguity](scale-ambiguity.md)
- [OpenVSLAM](openvslam.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
- [Scale observability](../level-07-stereo-slam/scale-observability.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
