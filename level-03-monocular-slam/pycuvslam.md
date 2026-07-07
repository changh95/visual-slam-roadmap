# PyCuVSLAM

> NVIDIA 2025 · [Paper](https://github.com/NVlabs/pycuvslam)

**One-line summary** — The Python API to NVIDIA's cuVSLAM: a CUDA-accelerated visual(-inertial) odometry and SLAM library supporting 1 to 32 cameras in arbitrary rigs, with real-time performance on Jetson-class edge devices (tech report: arXiv 2506.04359, "cuVSLAM: CUDA accelerated visual odometry and mapping").

## Problem

High-performance SLAM implementations are almost universally C++ codebases tightly coupled to their build systems and middleware — a high barrier for robotics developers and ML researchers who live in Python. Beyond packaging, the report identifies three technical gaps in existing systems: they "struggle with real-time performance on resource-constrained platforms, have limited flexibility in sensor configurations, and may not fully utilize available hardware acceleration." cuVSLAM answers with a GPU-native pipeline behind both an Isaac ROS and a Python (PyCuVSLAM) API.

## Method & architecture

cuVSLAM is split into a **frontend** (low-latency local pose estimation over a local odometry map of the last $N$ keyframe poses plus visible 3D landmarks) and an asynchronous **backend** (loop closing and pose-graph optimization for global consistency).

- **2D module**: the image is divided into an $N \times M$ grid; each patch contributes its top-$k$ Shi–Tomasi ("Good Features to Track") keypoints with $k > \lfloor K_I / (N \cdot M) \rfloor$ so a minimum total $K_I$ is met with uniform coverage. Tracking uses a modified pyramidal Lucas–Kanade with a normalized cross-correlation check at each optimization step; a keyframe is created when the number of surviving tracks drops below a threshold.
- **3D module**: on each keyframe, landmarks are triangulated from multi-view observations and refined by an asynchronous CUDA sparse bundle adjustment (Schur complement solving poses first, then points):

$$\hat{T}^{bw}_{1:N},\hat{p}^{w}_{1:M} = \arg\min_{T^{bw}_{1:N},\,p^{w}_{1:M}} \sum_{i=1}^{N}\sum_{j=1}^{M}\sum_{k=1}^{C} \left\| \pi\!\left(T^{cb}_{k} T^{bw}_{i} p^{w}_{j}\right) - o_{j,k} \right\|^{2}_{\Sigma}$$

  where $T^{cb}_k$ is the $k$-th camera-from-base transform, $T^{bw}_i$ the base-from-world pose, $p^w_j$ a landmark, and $o_{j,k}$ its observation. Per-frame pose comes from PnP on tracked landmarks.
- **Modes**: *Stereo* (default), *Multi-Stereo* — an arbitrary rig is decomposed into stereo pairs via a Frustum Intersection Graph built automatically from extrinsics by testing field-of-view overlap; *Visual-Inertial* — a 15-DoF state $S=[T \in SE(3),\, v,\, b^a,\, b^w]$ with IMU preintegration factors, gravity estimation, and VI sparse BA; *Mono* (fundamental-matrix bootstrap, up-to-scale); *Mono-Depth* — dense frame-to-frame alignment combining reprojection, intensity, depth, and point-to-point factors solved by a GPU Levenberg–Marquardt.
- **Backend**: keyframe features are $9\times 9$ patches from each pyramid level; loop candidates come from a kd-tree radius search over past poses, verified by tracking landmark patches into the current image, then a relative pose $\hat{T}^{bm}$ is estimated and the pose graph refined by $T_{1:N} = \arg\min_{T_{1:N}} \sum_{i,j \in E} \| \mathrm{Log}(D_{ij}^{-1} T_i^{-1} T_j) \|^2$, where $D_{ij}$ are measured pose deltas.

## Results

- **Speed**: per-frame track calls of 0.4 ms (stereo) / 0.9 ms (mono) on an RTX 4090 desktop and 1.8 ms / 2.7 ms on Jetson AGX Orin (768×480 input); live stereo through Isaac ROS uses ~5.5% CPU and ~1.7% GPU of a Jetson AGX Orin at 640×480, 60 FPS.
- **Accuracy** (avgRTE / RMSE APE, scale-corrected): KITTI stereo SLAM 0.27% / 1.98 m vs ORB-SLAM3 0.31% / 2.98 m and DPVO 21.69% / 195 m (monocular); EuRoC stereo SLAM 0.17% / 0.054 m vs ORB-SLAM3 0.21% / 0.068 m; TUM-VI Room stereo-inertial 0.12% / 0.12 m. The paper summarizes this as average trajectory errors below 1% on KITTI and position errors under 5 cm on EuRoC.
- **Multi-Stereo**: on the real four-stereo-camera R2B dataset, SLAM reaches 0.11% avgRTE / 0.18 m APE — roughly a 40% improvement over pure odometry thanks to more frequent loop closures; in an occlusion stress test with cameras randomly covered for 20–60 s, the trajectory stayed smooth as long as one stereo pair remained visible.

## Why it matters for SLAM

PyCuVSLAM represents two industry trends at once: hardware-accelerated SLAM as a product-grade component, and Python-first APIs that lower the barrier for robotics and ML developers to integrate SLAM without writing C++. Its multi-camera formulation (frustum graph + rig-level PnP/BA) is also a clean template for the multi-sensor robots that increasingly dominate deployment, in contrast to single-camera research systems like ORB-SLAM3.

## Hands-on

- [Run cuVSLAM](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/cuvslam)

## Related

- [ORB-SLAM3](orb-slam3.md)
- [DPVO](dpvo.md)
- [C++/Python interop](../level-02-getting-familiar/cpp-python-interop.md)
- [Edge deployment](../level-02-getting-familiar/edge-deployment.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)
