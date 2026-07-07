# Docker

Docker将一个应用与其整个用户空间环境——操作系统库、编译器、Python版本、CUDA工具包——打包进一个**容器镜像**中，使其能在任何Linux主机上以相同的方式运行。对SLAM工作而言，这解决了该领域中最常见的一个实际困扰：研究代码只能在某一特定组合的Ubuntu、OpenCV、Eigen、Ceres和ROS版本下构建。

一个典型的SLAM Dockerfile会精确固定这样的组合：

```dockerfile
FROM ros:humble
RUN apt-get update && apt-get install -y \
    libeigen3-dev libopencv-dev libceres-dev \
 && rm -rf /var/lib/apt/lists/*
COPY . /ws/src/my_slam
RUN cd /ws && . /opt/ros/humble/setup.sh && colcon build
```

而一个典型的开发用`run`调用则结合了你几乎会用到的所有标志：

```bash
docker build -t my_slam .
docker run -it --rm \
  --gpus all \                              # NVIDIA Container Toolkit：在容器内使用GPU
  -v ~/data:/data \                         # 数据集存放在主机上
  -v $(pwd):/ws/src/my_slam \               # 从主机实时编辑源代码
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \        # 用于可视化工具的X11转发
  --network host \                          # 跨主机/容器的ROS发现机制
  my_slam bash
```

需要熟悉的关键概念：

- **镜像（images）与容器（containers）**——镜像是冻结的配方/结果；容器是运行中的实例。`docker build`、`docker run`、`docker exec`涵盖了日常大部分用法。
- **数据卷（volumes）**——从主机挂载数据集和源代码，使容器保持可随时丢弃，而数据得以持久保存。
- **GPU访问**——NVIDIA Container Toolkit（`--gpus all`）将主机GPU暴露给容器内部，这是在容器中运行学习式前端和CUDA加速建图的方式。
- **GUI/X11转发**——SLAM可视化工具（Pangolin、RViz）需要显示转发（上面的`DISPLAY`/X11套接字组合，通常还需要在主机上执行`xhost +local:`），这是一个众所周知、值得学习一次就能掌握的Docker摩擦点。
- **层缓存（layer caching）**——按照从最不频繁变化到最频繁变化的顺序排列Dockerfile步骤，这样代码编辑后的重新构建只需几秒钟，而不是重新编译OpenCV耗时一小时。
- **硬件设备**——实时摄像头或IMU需要显式的直通（`--device /dev/video0`），这是容器少数会接触物理机器人的地方之一。

## 超越基础

- **多阶段构建（multi-stage builds）**将沉重的构建镜像（编译器、`-dev`软件包）与精简的运行时镜像分离——这是将感知栈部署到机器人上的常见模式。
- **docker compose**以声明式方式描述多容器配置：一个SLAM节点、一个可视化容器、一个数据集/bag播放器组成一个可复现的整体栈。
- **跨架构构建**（`docker buildx`）可以在x86工作站上构建ARM镜像——这是桌面构建的镜像如何送达Jetson类机器人的方式。
- **开发容器（Dev containers）**（VS Code及类似工具）让你的编辑器、调试器和智能提示能够在*固定的*环境内部运行，消除了"能在Docker中构建"和"能在我的IDE中构建"之间的最后一点不一致。

在实践中，几乎每一个严肃的开源SLAM仓库现在都会附带一个Dockerfile，复现一篇论文的结果通常从`docker build`开始。Docker也是大规模评估SLAM的方式：CI流水线在容器内运行数据集基准测试，机器人也越来越多地将感知栈以容器形式部署，以实现干净的更新和回滚。

## 常见陷阱

- 在挂载卷上、容器内部创建的文件归root所有；请使用`--user $(id -u):$(id -g)`运行，或在镜像中修正所有权。
- 忘记加`--network host`（或正确配置DDS）会导致容器内外的ROS 2节点彼此不可见。
- 在镜像中残留apt缓存和构建目录会导致数GB级别的膨胀；应在同一个`RUN`层内清理。
- 容器隔离的是依赖，而不是物理规律：它本身并不能改善时序确定性，也不会赋予实时调度能力。

## 对SLAM的意义

SLAM系统的依赖栈素来庞大而脆弱（特定版本的OpenCV/Eigen/Ceres/ROS在不同项目间相互冲突）。Docker让你能在同一台机器上共存ORB-SLAM3、VINS-Fusion和一个基于PyTorch的前端，而不会让它们的依赖相互打架，能让你自己的研究对他人可复现，并且是CI基准测试和真实机器人部署的标准打包单元。

## 相关条目

- [ROS/ROS2](ros-ros2.md)
- [CI/CD](ci-cd.md)
- [Git/GitHub](git-github.md)
- [Edge deployment](edge-deployment.md)
