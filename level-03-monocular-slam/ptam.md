# PTAM

> Klein & Murray 2007 · [Paper](https://www.robots.ox.ac.uk/~gk/publications/KleinMurray2007ISMAR.pdf)

**One-line summary** — Introduced the paradigm of splitting SLAM into parallel tracking and mapping threads, making real-time keyframe-based bundle adjustment possible for the first time.

## Problem

MonoSLAM's EKF approach could not scale beyond small maps: every frame updates a dense covariance over all landmarks, so cost grows quickly with map size and accuracy suffers from repeated linearisation. Bundle adjustment (BA) produces far more accurate results than filtering, but in 2007 it was considered too slow for real-time operation. Klein & Murray (ISMAR 2007, University of Oxford) showed that by decoupling tracking from mapping into separate threads, BA can run in the background while tracking runs at frame rate.

## Key ideas

- **Two-thread architecture (frontend/backend separation)**: a tracking thread estimates the camera pose every frame against the current map, while a mapping thread runs bundle adjustment on keyframes asynchronously in the background — neither blocks the other, which is the key architectural insight.
- **Keyframe-based mapping**: only selected frames with sufficient baseline are added to the map, keeping bundle adjustment tractable. Instead of summarising past observations in a covariance matrix (the filtering approach of MonoSLAM), PTAM keeps a sparse subset of raw observations and re-optimises the geometry.
- **Bundle adjustment as the backend**: the mapping thread minimises robust reprojection error $\sum_{i,j} \rho\big(\lVert \mathbf{u}_{ij} - \pi(\mathbf{T}_j, \mathbf{X}_i) \rVert^2\big)$ over keyframe poses $\mathbf{T}_j$ and map points $\mathbf{X}_i$ — local BA for responsiveness, global BA when the thread is otherwise idle.
- **FAST features + patch matching**: FAST corners are detected across image pyramid levels and matched with zero-mean SSD on small warped image patches; there are no descriptors at all.
- **Coarse-to-fine tracking**: a motion model predicts the pose, a coarse pass over high pyramid levels absorbs large inter-frame motion, and a fine pass refines the pose against many patch measurements.
- **Manual initialisation**: the user provides two views of a planar scene, and a homography bootstraps the initial map (later systems like ORB-SLAM automated this with parallel model selection).

## Results & impact

PTAM demonstrated real-time tracking and mapping from a single hand-held camera in small AR workspaces — its target application — with map quality beyond what EKF-based systems could achieve, because keyframes could be fully re-optimised in the background. Its limits were accepted by design: small workspaces, no loop closure, no large-scale relocalization. The two-thread keyframe-BA design became the reference architecture for the field, and Strasdat et al.'s "Visual SLAM: Why Filter?" later provided the theoretical justification for the empirical choice PTAM made.

## Why it matters for SLAM

PTAM established the frontend/backend separation that virtually every modern SLAM system still follows, and demonstrated empirically that keyframe bundle adjustment beats filtering — a claim later formalised by Strasdat et al.'s "Visual SLAM: Why Filter?". It also proved real-time AR from a single camera was practical. ORB-SLAM is essentially PTAM's architecture completed with automatic initialisation, loop closure, and large-scale map management.

## Related

- [MonoSLAM](monoslam.md)
- [Visual-SLAM why filter?](visual-slam-why-filter.md)
- [ORB-SLAM](orb-slam.md)
- [DTAM](dtam.md)
- [S-PTAM](../level-07-stereo-slam/s-ptam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
