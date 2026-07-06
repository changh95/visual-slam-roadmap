# Swarm-SLAM

> Lajoie 2024 · [Paper](https://arxiv.org/abs/2301.06230)

**One-line summary** — Swarm-SLAM is an open-source, sensor-agnostic, decentralized collaborative SLAM framework designed around the properties swarm robotics actually needs: scalability, flexibility, and sparsity in both computation and communication.

## Key ideas

- **Designed for swarms**: the system is explicitly built to be *scalable, flexible, decentralized, and sparse* — no central server, no assumption of full connectivity, and careful budgeting of what gets transmitted between robots.
- **Sensor-agnostic frontend**: supports inertial, LiDAR, stereo, and RGB-D sensing; the collaborative backend operates on keyframes and descriptors independently of which sensor produced them.
- **Inter-robot loop closure prioritization**: a novel technique ranks candidate inter-robot loop closures so the most valuable ones are verified and transmitted first, reducing communication and accelerating convergence of the global estimate.
- **ROS 2 native implementation**, evaluated on five public datasets and in a real-world experiment with three robots communicating over an ad-hoc network.
- Fully open source (`MISTLab/Swarm-SLAM`), making it one of the most practical starting points for deploying C-SLAM on real robot teams.

## Why it matters for SLAM

As robot teams grow, naive descriptor broadcasting and exhaustive loop-closure verification blow up communication and computation. Swarm-SLAM attacks exactly this bottleneck, showing that *which* loop closures you process first matters as much as how you optimize them. Coming from the same group as DOOR-SLAM, it packages a decade of distributed-SLAM lessons (outlier resilience, peer-to-peer operation, bandwidth discipline) into a modern, deployable ROS 2 framework, and its sensor agnosticism makes it a common baseline for heterogeneous multi-robot experiments.

## Related

- [DOOR-SLAM](door-slam.md) — earlier distributed, outlier-resilient system from the same lab
- [Kimera-Multi](kimera-multi.md) — the metric-semantic distributed alternative
- [Communication constraints](communication-constraints.md) — the resource Swarm-SLAM is engineered to conserve
- [Centralized vs Decentralized](centralized-vs-decentralized.md) — architectural context
- [Inter-robot loop closure](inter-robot-loop-closure.md) — what gets prioritized and verified

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
