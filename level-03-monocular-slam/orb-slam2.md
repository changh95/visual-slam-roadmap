# ORB-SLAM2

> Mur-Artal 2017 · [Paper](https://arxiv.org/abs/1610.06475)

**One-line summary** — Extends ORB-SLAM to stereo and RGB-D cameras, providing a unified open-source SLAM framework with metric scale and state-of-the-art accuracy across all three sensor modalities.

## Problem

ORB-SLAM was monocular-only: depth is not observable from one camera, so map and trajectory scale are unknown, bootstrapping needs multi-view initialisation, and the system suffers scale drift and can fail under pure rotation. Stereo and RGB-D cameras solve all these issues, but existing stereo/RGB-D systems either lacked loop closing, gave up global consistency for constant-time operation, or relied on ICP/photometric alignment. ORB-SLAM2 (IEEE TRO 2017) generalises the BA-based framework so one system "works in real-time on standard CPUs in a wide variety of environments, from small hand-held indoors sequences, to drones flying in industrial environments and cars driving around a city".

## Method & architecture

Three parallel threads — tracking, local mapping, loop closing — plus a fourth thread for full BA after loop closure. Tracking localises every frame against the local map with motion-only BA; local mapping runs local BA over a covisibility window; loop closing detects loops with DBoW2 and corrects drift by pose-graph optimisation over the covisibility graph/spanning tree, followed by full BA whose result is merged back by propagating keyframe corrections through the spanning tree.

- **Input pre-processing**: images are reduced to ORB features once; the rest of the system is sensor-agnostic. Stereo keypoints are $\mathbf{x}_{\mathrm{s}}=(u_L,v_L,u_R)$ from epipolar-row matching; for RGB-D, each depth $d$ is converted to a *virtual right coordinate* $u_R=u_L-\frac{f_x b}{d}$, with $f_x$ the focal length and $b\approx 8$ cm the Kinect/Xtion baseline — so RGB-D input rides the stereo pipeline unchanged.
- **Close/far point policy**: a stereo point is *close* if its depth is under 40× the baseline (a threshold from Paz et al.) — safely triangulated from a single frame, providing scale, translation, and rotation; *far* points are triangulated only when supported by multiple views and mainly constrain rotation. Monocular keypoints (no stereo/depth match) also contribute.
- **BA with monocular + stereo constraints** (g2o, Levenberg–Marquardt): motion-only BA solves

$$\{\mathbf{R},\mathbf{t}\}=\operatorname*{argmin}_{\mathbf{R},\mathbf{t}}\sum_{i\in\mathcal{X}}\rho\left(\left\|\mathbf{x}^{i}_{(\cdot)}-\pi_{(\cdot)}\left(\mathbf{R}\mathbf{X}^{i}+\mathbf{t}\right)\right\|^{2}_{\Sigma}\right)$$

  with Huber cost $\rho$, keypoint-scale covariance $\Sigma$, and projection functions $\pi_{\mathrm{m}}=\left(f_x\frac{X}{Z}+c_x,\ f_y\frac{Y}{Z}+c_y\right)$ and stereo $\pi_{\mathrm{s}}$ appending the third row $f_x\frac{X-b}{Z}+c_x$. Local BA optimises covisible keyframes $\mathcal{K}_L$ and their points $\mathcal{P}_L$ with fixed border keyframes $\mathcal{K}_F$; full BA is the same with everything free except the origin keyframe.
- **Bootstrapping & loop closing**: with depth from a single frame, the map initialises at the first keyframe — no SfM initialisation. Scale is observable, so loop correction uses rigid $SE(3)$ pose-graph optimisation rather than the $\mathrm{Sim}(3)$ needed in monocular mode.
- **Keyframe insertion & localisation mode**: a new condition inserts keyframes when tracked close points drop below $\tau_t=100$ but $\tau_c=70$ new close points could be created — critical in scenes dominated by far points (e.g. highways). A lightweight localisation mode disables mapping/loop closing and combines visual-odometry matches (drifting, for unmapped regions) with map-point matches (zero-drift).

## Results

Evaluated on 29 public sequences (5 runs each, median; Intel i7-4790):

- **KITTI stereo** (11 sequences): relative translation error generally below 1% (e.g. 00: 0.70%, 1.3 m ATE; 05: 0.40%, 0.8 m), outperforming Stereo LSD-SLAM in most sequences; the highway sequence 01 — where monocular ORB-SLAM failed outright — runs at 1.39% / 10.4 m, with rotation error 0.21°/100 m thanks to long-tracked far points.
- **EuRoC stereo** (11 MAV sequences): RMSE of a few centimeters, e.g. V1_01 0.035 m vs Stereo LSD-SLAM's 0.066 m, V1_02 0.020 m vs 0.074 m, MH_03 0.028 m; only V2_03 is lost to severe motion blur.
- **TUM RGB-D**: the only BA-based entrant outperforms ElasticFusion, Kintinuous, DVO-SLAM, and RGBD-SLAM in most sequences — fr2/xyz 0.004 m, fr2/desk 0.009 m, fr3/office 0.010 m, fr1/desk 0.016 m (vs 0.020 m ElasticFusion, 0.021 m DVO-SLAM).
- **Timing**: mean tracking time per frame stays below camera frame time in all tested settings (e.g. 25.58 ms for 30 Hz TUM RGB-D, 49.47 ms for 10 Hz KITTI stereo) — real time on a standard CPU.

## Why it matters for SLAM

ORB-SLAM2 turned ORB-SLAM into a general-purpose SLAM library covering monocular, stereo, and RGB-D sensors, and it remained the dominant accuracy baseline in SLAM papers for several years; its virtual-stereo RGB-D trick and close/far point policy were copied broadly. It is the natural bridge from monocular SLAM (Level 3) to stereo SLAM (Level 7) and RGB-D SLAM (Level 4), and the direct predecessor of ORB-SLAM3's visual-inertial, multi-map system.

## Related

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM3](orb-slam3.md)
- [Scale ambiguity](scale-ambiguity.md)
- [OpenVSLAM](openvslam.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
- [Scale observability](../level-07-stereo-slam/scale-observability.md)
