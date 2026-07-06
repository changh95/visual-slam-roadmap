# PTAM

> Klein & Murray 2007 · [Paper](https://www.robots.ox.ac.uk/~gk/publications/KleinMurray2007ISMAR.pdf)

**One-line summary** — Introduced the paradigm of splitting SLAM into parallel tracking and mapping threads, making real-time keyframe-based bundle adjustment possible for the first time.

## Key ideas

- **Two-thread architecture (frontend/backend separation)**: a tracking thread estimates the camera pose every frame against the current map, while a mapping thread runs bundle adjustment on keyframes asynchronously in the background.
- **Keyframe-based mapping**: only selected frames with sufficient baseline are added to the map, keeping bundle adjustment tractable — the alternative to filtering every frame as MonoSLAM's EKF did.
- **FAST features + patch matching**: FAST corners are detected across pyramid levels and matched with zero-mean SSD on image patches.
- **Manual initialisation**: the user provides two views of a planar scene, and a homography bootstraps the initial map (later systems like ORB-SLAM automated this).
- **Known limits**: designed for small AR workspaces; no loop closure or relocalization to large scale.

## Why it matters for SLAM

PTAM established the frontend/backend separation that virtually every modern SLAM system still follows, and demonstrated empirically that keyframe bundle adjustment beats filtering — a claim later formalised by Strasdat et al.'s "Visual SLAM: Why Filter?". It also proved real-time AR from a single camera was practical. ORB-SLAM is essentially PTAM's architecture completed with automatic initialisation, loop closure, and large-scale map management.

## Related

- [MonoSLAM](monoslam.md)
- [Visual-SLAM why filter?](visual-slam-why-filter.md)
- [ORB-SLAM](orb-slam.md)
- [S-PTAM](../level-07-stereo-slam/s-ptam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
