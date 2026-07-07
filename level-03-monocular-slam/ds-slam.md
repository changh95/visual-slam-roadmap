# DS-SLAM

> Yu 2018 · [Paper](https://arxiv.org/abs/1809.08379)

**One-line summary** — A semantic visual SLAM for dynamic environments that combines SegNet semantic segmentation with an optical-flow/epipolar moving-consistency check to reject moving objects, built on ORB-SLAM2 and producing a dense semantic octo-tree map.

## Problem

Despite decades of progress, two problems remained poorly solved for mobile-robot SLAM: "how to tackle the moving objects in the dynamic environments" and "how to make the robots truly understand the surroundings and accomplish advanced tasks." A person walking through the scene corrupts pose estimation (their features violate the static-world assumption), and purely geometric maps offer no semantics for higher-level tasks. DS-SLAM addresses both: robust localization in dynamic scenes, plus a semantic map usable for navigation and beyond.

## Method & architecture

- **Five parallel threads**: tracking, semantic segmentation, local mapping, loop closing, and dense semantic map creation; local mapping and loop closing are unchanged ORB-SLAM2. Each RGB frame goes to tracking and segmentation *simultaneously* — while the tracking thread waits for the SegNet result it runs the moving-consistency check, so the two threads finish at roughly the same time.
- **Semantic segmentation**: real-time SegNet (Caffe) trained on PASCAL VOC (20 classes); people are treated as the archetypal dynamic class, though the scheme applies to any segmented movable category.
- **Moving-consistency check**: optical-flow pyramid matches feature points into the current frame (matches near image edges or with large 3×3-block appearance difference are discarded); RANSAC estimates the fundamental matrix $F$; for matched homogeneous points $P_1 = [u_1, v_1, 1]$, $P_2 = [u_2, v_2, 1]$, the epipolar line in the current frame is $\mathbf{I}_1 = [X, Y, Z]^{T} = F P_1$, and a point is declared moving if its distance to that line

$$D = \frac{\lvert P_2^{T} F P_1 \rvert}{\sqrt{\lVert X \rVert^{2} + \lVert Y \rVert^{2}}}$$

  exceeds a preset threshold $\varepsilon$.
- **Outlier rejection — semantics + geometry combined**: contours of whole dynamic regions are too expensive and fragile to extract geometrically, so the two signals form a two-level decision: if enough moving-consistency points fall inside a segmented object's contour, the *object* is deemed moving, and *all* ORB features within its outline are removed before pose estimation. If no person is detected, or detected people are static, all features are used — parked "dynamic" classes are not wastefully discarded.
- **Dense semantic 3D octo-tree map**: keyframe poses + depth images build local point clouds fused into a global octo-tree, each voxel colored by semantic label. Occupancy is fused probabilistically with the log-odds score $l = \operatorname{logit}(p) = \log\frac{p}{1-p}$, updated per observation as

$$L(n \mid z_{1:t}) = L(n \mid z_{1:t-1}) + L(n \mid z_t),$$

  where $L(n \mid z_t) = \tau$ if voxel $n$ is observed occupied at time $t$ and 0 otherwise; only voxels whose probability exceeds a threshold are kept, so transient (dynamic) voxels never stabilize into the map.

## Results

- **TUM RGB-D** (vs RGB-D ORB-SLAM2; Intel i7, P4000 GPU): ATE RMSE on high-dynamic sequences drops by an order of magnitude — fr3_walking_xyz **0.7521 → 0.0247 m** (96.71%), fr3_walking_static **0.3900 → 0.0081 m** (97.91%), fr3_walking_half **0.4863 → 0.0303 m** (93.76%), fr3_walking_rpy 0.8705 → 0.4442 m (48.97%). Improvements reach up to 97.91% (RMSE) and 97.94% (S.D.).
- **Drift (RPE)**: translational drift RMSE on walking_xyz falls 0.4124 → 0.0333, rotational 7.7432 → 0.8266; on low-dynamic fr3_sitting_static gains are small (ATE 25.94%) since ORB-SLAM2 already copes.
- **Timing**: ORB extraction 9.4 ms + moving-consistency check 29.5 ms in the tracking thread, overlapped with 37.6 ms SegNet; ~59.4 ms per frame average for the full pipeline including octo-tree mapping — near real time, unlike prior dynamic-filtering methods.
- **Real robot**: integrated with ROS on a TurtleBot2 with Kinect V2 (960×540); the log-odds filtering yields an octo-tree reconstruction unaffected by walking people, plus a 2D cost map for navigation.

## Why it matters for SLAM

Classical SLAM assumes a static world, and people walking through a scene can corrupt tracking badly — the TUM RGB-D dynamic sequences exist precisely to expose this. DS-SLAM, contemporaneous with DynaSLAM, is one of the canonical answers: fuse a segmentation network with geometric consistency checks inside an ORB-SLAM2 backbone. The "semantic prior + motion check" recipe it helped establish remains the standard baseline design for dynamic-environment SLAM, and its semantic octo-tree output foreshadowed maps built for high-level tasks rather than localization alone.

## Related

- [DynaSLAM](dynaslam.md)
- [ORB-SLAM2](orb-slam2.md)
- [DynaSLAM II](dynaslam-ii.md)
- [VDO-SLAM](vdo-slam.md)
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)
