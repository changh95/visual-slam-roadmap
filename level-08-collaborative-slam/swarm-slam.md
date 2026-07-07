# Swarm-SLAM

> Lajoie 2024 · [Paper](https://arxiv.org/abs/2301.06230)

**One-line summary** — Swarm-SLAM is an open-source, sensor-agnostic, decentralized collaborative SLAM framework designed around the properties swarm robotics actually needs: scalability, flexibility, and sparsity in both computation and communication.

## Problem

Collaborative SLAM is a vital component for multi-robot operations in environments without an external positioning system — indoors, underground, or underwater. But as teams grow, naive C-SLAM designs hit a communication wall: every robot exchanging descriptors and verifying loop closures with every other robot scales quadratically, which is untenable over bandwidth-limited ad-hoc links. Swarm-SLAM asks how to keep a decentralized system *sparse* — in what is stored, transmitted, and verified — while still finding enough inter-robot loop closures for accurate global estimation.

## Key ideas

- **Designed for swarms**: the system is explicitly built to be *scalable, flexible, decentralized, and sparse* — no central server, no assumption of full connectivity, and careful budgeting of what gets transmitted between robots.
- **Sensor-agnostic frontend**: supports inertial, LiDAR, stereo, and RGB-D sensing; the collaborative backend operates on keyframes and compact descriptors independently of which sensor produced them, which makes heterogeneous teams (some robots with LiDAR, some with cameras) first-class citizens.
- **Inter-robot loop closure prioritization**: the paper's core algorithmic novelty — under a fixed verification and communication budget, candidate inter-robot loop closures are prioritized by their expected contribution to the pose graph's algebraic connectivity, so the budget is spent on the candidates that constrain the global estimate most. This reduces communication and accelerates convergence of the global estimate.
- **Sparse exchange discipline**: robots track what has already been shared with each neighbor and send only novel information, keeping steady-state traffic low.
- **Decentralized robust back-end**: inter-robot measurements feed a distributed pose-graph optimization inherited from the DOOR-SLAM lineage, with outlier resilience baked in.
- **ROS 2 native implementation**, evaluated on five different datasets and in a real-world experiment with three robots communicating through an ad-hoc network.

## Results & impact

The ROS 2 implementation was evaluated on five public datasets and in a real-world three-robot experiment over an ad-hoc network, demonstrating that loop-closure prioritization reduces communication and accelerates convergence of the global estimate. The framework is fully open source (`MISTLab/Swarm-SLAM`) and has become one of the most practical starting points for deploying C-SLAM on real robot teams, particularly heterogeneous ones.

## Why it matters for SLAM

As robot teams grow, naive descriptor broadcasting and exhaustive loop-closure verification blow up communication and computation. Swarm-SLAM attacks exactly this bottleneck, showing that *which* loop closures you process first matters as much as how you optimize them. Coming from the same group as DOOR-SLAM, it packages a decade of distributed-SLAM lessons (outlier resilience, peer-to-peer operation, bandwidth discipline) into a modern, deployable ROS 2 framework, and its sensor agnosticism makes it a common baseline for heterogeneous multi-robot experiments.

## Related

- [DOOR-SLAM](door-slam.md) — earlier distributed, outlier-resilient system from the same lab
- [Kimera-Multi](kimera-multi.md) — the metric-semantic distributed alternative
- [Communication constraints](communication-constraints.md) — the resource Swarm-SLAM is engineered to conserve
- [Centralized vs Decentralized](centralized-vs-decentralized.md) — architectural context
- [Inter-robot loop closure](inter-robot-loop-closure.md) — what gets prioritized and verified
- [Map merging](map-merging.md) — the operation the prioritized closures enable

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
