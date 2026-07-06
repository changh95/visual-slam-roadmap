# Docker

Docker packages an application together with its entire userspace environment — OS libraries, compilers, Python versions, CUDA toolkits — into a **container image** that runs identically on any Linux host. For SLAM work, this solves the single most common practical frustration in the field: research code that only builds against one specific combination of Ubuntu, OpenCV, Eigen, Ceres, and ROS versions.

A typical SLAM Dockerfile pins exactly that combination:

```dockerfile
FROM ros:humble
RUN apt-get update && apt-get install -y \
    libeigen3-dev libopencv-dev libceres-dev
COPY . /ws/src/my_slam
RUN cd /ws && . /opt/ros/humble/setup.sh && colcon build
```

Key ideas to be comfortable with:

- **Images vs. containers** — an image is the frozen recipe/result; a container is a running instance. `docker build`, `docker run`, `docker exec` cover most daily use.
- **Volumes** — mount datasets and source code from the host (`-v ~/data:/data`) so containers stay disposable while data persists.
- **GPU access** — the NVIDIA Container Toolkit (`--gpus all`) exposes the host GPU inside the container, which is how learned front-ends and CUDA-accelerated mapping are run in containers.
- **GUI/X11 forwarding** — SLAM visualizers (Pangolin, RViz) need display forwarding, a well-known bit of Docker friction worth learning once.
- **Layer caching** — order Dockerfile steps from least- to most-frequently changing so rebuilding after a code edit takes seconds, not an hour of recompiling OpenCV.

In practice, almost every serious open-source SLAM repository now ships a Dockerfile, and reproducing a paper's results usually starts with `docker build`. Docker is also how SLAM is evaluated at scale: CI pipelines run dataset benchmarks inside containers, and robots increasingly deploy their perception stack as containers for clean updates and rollbacks.

## Why it matters for SLAM

SLAM systems have notoriously heavy and brittle dependency stacks (specific OpenCV/Eigen/Ceres/ROS versions that conflict between projects). Docker lets you keep ORB-SLAM3, VINS-Fusion, and a PyTorch-based front-end on one machine without their dependencies fighting, makes your own research reproducible for others, and is the standard packaging unit for both CI benchmarking and deployment on real robots.

## Related

- [ROS/ROS2](ros-ros2.md)
- [CI/CD](ci-cd.md)
- [Git/GitHub](git-github.md)
- [Edge deployment](edge-deployment.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
