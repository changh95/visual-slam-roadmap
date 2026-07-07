# Docker

Docker packages an application together with its entire userspace environment — OS libraries, compilers, Python versions, CUDA toolkits — into a **container image** that runs identically on any Linux host. For SLAM work, this solves the single most common practical frustration in the field: research code that only builds against one specific combination of Ubuntu, OpenCV, Eigen, Ceres, and ROS versions.

A typical SLAM Dockerfile pins exactly that combination:

```dockerfile
FROM ros:humble
RUN apt-get update && apt-get install -y \
    libeigen3-dev libopencv-dev libceres-dev \
 && rm -rf /var/lib/apt/lists/*
COPY . /ws/src/my_slam
RUN cd /ws && . /opt/ros/humble/setup.sh && colcon build
```

And a typical development `run` invocation combines most of the flags you will ever need:

```bash
docker build -t my_slam .
docker run -it --rm \
  --gpus all \                              # NVIDIA Container Toolkit: GPU inside
  -v ~/data:/data \                         # datasets live on the host
  -v $(pwd):/ws/src/my_slam \               # live-edit source from the host
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \        # X11 forwarding for visualizers
  --network host \                          # ROS discovery across host/container
  my_slam bash
```

Key ideas to be comfortable with:

- **Images vs. containers** — an image is the frozen recipe/result; a container is a running instance. `docker build`, `docker run`, `docker exec` cover most daily use.
- **Volumes** — mount datasets and source code from the host so containers stay disposable while data persists.
- **GPU access** — the NVIDIA Container Toolkit (`--gpus all`) exposes the host GPU inside the container, which is how learned front-ends and CUDA-accelerated mapping are run in containers.
- **GUI/X11 forwarding** — SLAM visualizers (Pangolin, RViz) need display forwarding (the `DISPLAY`/X11-socket pair above, often plus `xhost +local:` on the host), a well-known bit of Docker friction worth learning once.
- **Layer caching** — order Dockerfile steps from least- to most-frequently changing so rebuilding after a code edit takes seconds, not an hour of recompiling OpenCV.
- **Hardware devices** — a live camera or IMU needs explicit passthrough (`--device /dev/video0`), one of the few places containers touch the physical robot.

## Beyond the basics

- **Multi-stage builds** separate a heavy build image (compilers, `-dev` packages) from a slim runtime image — the pattern for deploying perception stacks to robots.
- **docker compose** describes multi-container setups declaratively: a SLAM node, a visualization container, and a dataset/bag player as one reproducible stack.
- **Cross-architecture builds** (`docker buildx`) build ARM images on an x86 workstation — how desktop-built images reach Jetson-class robots.
- **Dev containers** (VS Code and similar) let your editor, debugger, and IntelliSense run *inside* the pinned environment, removing the last mismatch between "builds in Docker" and "builds in my IDE."

In practice, almost every serious open-source SLAM repository now ships a Dockerfile, and reproducing a paper's results usually starts with `docker build`. Docker is also how SLAM is evaluated at scale: CI pipelines run dataset benchmarks inside containers, and robots increasingly deploy their perception stack as containers for clean updates and rollbacks.

## Common pitfalls

- Files created inside the container on a mounted volume are owned by root; run with `--user $(id -u):$(id -g)` or fix ownership in the image.
- Forgetting `--network host` (or proper DDS configuration) makes ROS 2 nodes inside and outside the container invisible to each other.
- Leaving apt caches and build trees in the image produces multi-gigabyte bloat; clean up within the same `RUN` layer.
- A container isolates dependencies, not physics: it does not improve timing determinism or grant real-time scheduling by itself.

## Why it matters for SLAM

SLAM systems have notoriously heavy and brittle dependency stacks (specific OpenCV/Eigen/Ceres/ROS versions that conflict between projects). Docker lets you keep ORB-SLAM3, VINS-Fusion, and a PyTorch-based front-end on one machine without their dependencies fighting, makes your own research reproducible for others, and is the standard packaging unit for both CI benchmarking and deployment on real robots.

## Related

- [ROS/ROS2](ros-ros2.md)
- [CI/CD](ci-cd.md)
- [Git/GitHub](git-github.md)
- [Edge deployment](edge-deployment.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
