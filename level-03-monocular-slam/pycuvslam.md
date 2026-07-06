# PyCuVSLAM

> NVIDIA 2025 · [Paper](https://github.com/NVlabs/pycuvslam)

**One-line summary** — A Python wrapper around NVIDIA's GPU-accelerated cuVSLAM library, bringing high-throughput stereo/multi-camera visual(-inertial) SLAM to the Python robotics and ML ecosystem.

## Key ideas

- **GPU-native SLAM pipeline**: the underlying cuVSLAM library runs feature extraction, matching, tracking, and mapping on NVIDIA GPUs with CUDA, targeting much higher throughput than CPU-based systems.
- **Python bindings over a C++ core**: cuVSLAM was previously accessible only through C++ and Isaac ROS; PyCuVSLAM exposes pose estimation, map access, and configuration through a Pythonic API that plays well with NumPy and ML tooling.
- **Multi-camera and VIO support**: handles monocular, stereo, and multi-camera rigs (including fisheye lenses) plus inertial fusion, matching the diverse sensor setups of modern robots.
- **Embedded deployment**: integrates with NVIDIA's Isaac ROS ecosystem for deployment on Jetson platforms.

## Why it matters for SLAM

PyCuVSLAM represents two industry trends at once: hardware-accelerated SLAM as a product-grade component, and Python-first APIs that lower the barrier for robotics and ML developers to integrate SLAM without writing C++. For learners, it is a convenient way to run a fast, production-quality VSLAM/VIO system and prototype on top of it, in contrast to research codebases like ORB-SLAM3.

## Related

- [ORB-SLAM3](orb-slam3.md)
- [C++/Python interop](../level-02-getting-familiar/cpp-python-interop.md)
- [Edge deployment](../level-02-getting-familiar/edge-deployment.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
