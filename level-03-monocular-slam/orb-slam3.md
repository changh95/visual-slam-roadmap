# ORB-SLAM3

> Campos 2020 · [Paper](https://arxiv.org/abs/2007.11898)

**One-line summary** — The first SLAM library to support visual, visual-inertial, and multi-map SLAM across monocular, stereo, and RGB-D cameras with pinhole and fisheye models, substantially improving accuracy over prior systems.

## Problem

ORB-SLAM2 lacked IMU integration and could not recover from tracking failures: once tracking was lost, the map was effectively gone. Real-world deployments — AR headsets, drones, long robot missions — require surviving temporary occlusion, degenerate motion, and long periods of poor visual information. ORB-SLAM3 (IEEE TRO, University of Zaragoza) addresses both gaps: a tightly-integrated visual-inertial system "that fully relies on Maximum-a-Posteriori (MAP) estimation, even during the IMU initialization phase", and an Atlas multi-map mechanism that turns tracking loss from a catastrophe into a recoverable event.

## Method & architecture

The system keeps ORB-SLAM2's thread layout, extended for multi-map operation: a **tracking thread** localizes each frame against the active map (adding body velocity and IMU biases to the optimized state in inertial modes); a **local mapping thread** grows and refines the active map with visual or visual-inertial BA over a sliding window of keyframes, and runs IMU initialization; and a **loop & map merging thread** searches the whole Atlas at keyframe rate — a match in the active map triggers loop closure, a match in another map triggers a seamless merge (welding-window BA, then essential-graph pose optimization), with full BA afterwards in a separate thread. The camera model (projection, unprojection, Jacobians) is abstracted into a module, so pinhole and Kannala-Brandt fisheye work throughout, including MLPnP-based relocalization and non-rectified stereo treated as two monocular cameras with a fixed extrinsic $\mathrm{SE}(3)$ constraint.

In visual-inertial mode the per-keyframe state is $\mathcal{S}_{i}\doteq\{\mathbf{T}_{i},\mathbf{v}_{i},\mathbf{b}^{g}_{i},\mathbf{b}^{a}_{i}\}$ (pose, velocity, gyro/accelerometer biases). IMU preintegration between keyframes gives $\Delta\mathbf{R}_{i,i+1},\Delta\mathbf{v}_{i,i+1},\Delta\mathbf{p}_{i,i+1}$ and inertial residuals $\mathbf{r}_{\mathcal{I}_{i,i+1}}$, e.g. the rotation term $\mathbf{r}_{\Delta\mathrm{R}_{i,i+1}}=\mathrm{Log}\left(\Delta\mathbf{R}_{i,i+1}^{\mathrm{T}}\mathbf{R}_{i}^{\mathrm{T}}\mathbf{R}_{i+1}\right)$. With reprojection residuals $\mathbf{r}_{ij}=\mathbf{u}_{ij}-\Pi\left(\mathbf{T}_{\mathrm{CB}}\mathbf{T}_{i}^{-1}\oplus\mathbf{x}_{j}\right)$, visual-inertial SLAM is the keyframe-based MAP problem

$$\min_{\bar{\mathcal{S}}_{k},\mathcal{X}}\left(\sum_{i=1}^{k}\left\lVert\mathbf{r}_{\mathcal{I}_{i-1,i}}\right\rVert_{\Sigma_{\mathcal{I}_{i,i+1}}^{-1}}^{2}+\sum_{j=0}^{l-1}\sum_{i\in\mathcal{K}^{j}}\rho_{\mathrm{Hub}}\left(\left\lVert\mathbf{r}_{ij}\right\rVert_{\Sigma_{ij}^{-1}}\right)\right)$$

with a Huber kernel on visual terms only, since inertial measurements have no mis-associations.

**MAP-based IMU initialization** proceeds in three steps: (1) vision-only — 2 s of pure monocular SLAM gives an accurate up-to-scale trajectory; (2) inertial-only — the state $\mathcal{Y}_{k}=\{s,\mathbf{R}_{\mathrm{wg}},\mathbf{b},\bar{\mathbf{v}}_{0:k}\}$ (scale, gravity direction, biases, velocities) is solved by

$$\mathcal{Y}_{k}^{*}=\arg\min_{\mathcal{Y}_{k}}\left(\|\mathbf{b}\|_{\Sigma_{b}^{-1}}^{2}+\sum_{i=1}^{k}\|\mathbf{r}_{\mathcal{I}_{i-1,i}}\|_{\Sigma_{\mathcal{I}_{i-1,i}}^{-1}}^{2}\right)$$

holding the visual trajectory fixed; (3) joint visual-inertial BA. Tracking losses are handled in two stages: short-term (pose from IMU, wide-window map-point re-matching) and long-term (start a fresh active map in the Atlas). The **improved place recognition** raises DBoW2's recall by verifying candidates geometrically against covisible keyframes already in the map instead of waiting for three consecutive keyframe detections, and by intensively searching mid-term matches in a local window around the matched keyframe.

## Results

All experiments ran on an Intel Core i7-7700 CPU. On EuRoC (median of 10 runs, RMS ATE), ORB-SLAM3 beats prior systems in all four configurations: stereo-inertial averages 0.035 m (0.6% scale error) across all 11 sequences, monocular-inertial 0.043 m, stereo 0.084 m, monocular 0.041 m on completed sequences. Monocular-inertial is "five to ten times more accurate than MCSKF, OKVIS and ROVIO, and more than doubles the accuracy of VI-DSO and VINS-Mono"; stereo-inertial is three to four times more accurate than Kimera and VINS-Fusion. The IMU initialization reaches 5% scale error within 2 seconds and about 1% after refinement. On the fisheye TUM-VI benchmark it outperforms VINS-Mono and Basalt overall; in the AR/VR-like room sequences average ATE is 0.009 m stereo-inertial and 0.011 m monocular-inertial. In EuRoC multi-session experiments the Atlas merging more than doubles the accuracy of CCM-SLAM and VINS-Mono (advantage over VINS-Mono grows from 2.6× single-session to 3.2× multi-session). Overall the abstract claims "two to ten times more accurate than previous approaches"; the open-source release became the standard baseline in hundreds of subsequent papers.

## Why it matters for SLAM

ORB-SLAM3 is the culmination of the feature-based SLAM lineage that began with PTAM and ORB-SLAM, and on release it was the most complete and accurate open-source SLAM library available — the first to exploit short-term, mid-term, long-term, *and* multi-map data association in all algorithm stages. The multi-map Atlas made lifelong, failure-tolerant operation practical, and its MAP-based visual-inertial initialization set a new standard for VIO systems. It remains one of the most common baselines and production starting points in the field.

## Related

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM2](orb-slam2.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Basalt](../level-06-vio-vins/basalt.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)
