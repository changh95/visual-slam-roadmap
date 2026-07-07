# DOOR-SLAM

> Lajoie 2020 · [Paper](https://arxiv.org/abs/1909.12198)

**One-line summary** — DOOR-SLAM is a fully distributed, peer-to-peer SLAM system whose pairwise-consistency-based outlier rejection lets robot teams accept aggressive place-recognition matches while safely filtering out spurious inter-robot loop closures.

## Problem

Robot teams need a shared understanding of the environment and their location within it, without relying on an external positioning system such as GPS and with minimal information exchange. Distributed SLAM offers exactly this, but existing distributed systems were vulnerable to perception outliers: to avoid catastrophic false loop closures they used very conservative place-recognition parameters, which also rejected many *valid* loop-closure candidates and degraded trajectory accuracy. DOOR-SLAM decouples detection from validation so that aggressive matching becomes safe.

## Key ideas

- **Distributed, online, outlier-resilient**: each robot maintains its own pose graph and communicates peer-to-peer; no central server and no full connectivity among the robots is required.
- **Decoupling detection from validation**: the system can afford less conservative place-recognition parameters because a dedicated rejection step filters the outliers afterwards, instead of trying to prevent them at the matching threshold.
- **Pairwise Consistency Maximization (PCM)**: candidate inter-robot loop closures are checked for mutual geometric consistency, and the largest pairwise-consistent subset is accepted. Formally, over candidates $\mathcal{C}$,

  $$\mathcal{C}^* = \arg\max_{\mathcal{S} \subseteq \mathcal{C}} |\mathcal{S}| \quad \text{s.t.} \quad \chi^2_{ij} < \tau \;\; \forall\, c_i, c_j \in \mathcal{S},$$

  where $\chi^2_{ij}$ measures how consistent the relative poses implied by candidates $c_i$ and $c_j$ are with each other — a maximum-clique problem on the consistency graph. Measurements outside the clique are rejected as outliers.
- **Distributed robust back-end**: the PCM filter is combined with a distributed pose graph optimizer, so that the joint trajectory estimate is computed through robot-to-robot message passing rather than at a server.
- **Bandwidth-conscious front-end**: inter-robot loop closures are detected *without exchanging raw sensor data*, keeping communication low and preserving data privacy between robots.

## Results & impact

Evaluated in simulations, benchmarking datasets, and field experiments — including tests in GPS-denied subterranean environments — DOOR-SLAM produced more inter-robot loop closures than conservative baselines, successfully rejected outliers, and delivered accurate trajectory estimates at low communication bandwidth. The full source code is open (`MISTLab/DOOR-SLAM`), and PCM-style consistency checking was subsequently adopted and extended by later systems.

## Why it matters for SLAM

Perceptual aliasing is the Achilles heel of multi-robot mapping: a single wrong inter-robot loop closure can fold two robots' maps into each other irreparably. DOOR-SLAM made robust outlier rejection a first-class architectural component of distributed SLAM, and its PCM idea was subsequently adopted and extended by later systems (Kimera-Multi uses graduated non-convexity toward the same goal, and Swarm-SLAM comes from the same group). It is the reference design for outlier-resilient decentralized C-SLAM.

## Related

- [Kimera-Multi](kimera-multi.md) — distributed successor with GNC-based robust PGO and semantic meshes
- [Swarm-SLAM](swarm-slam.md) — later decentralized framework by the same first author
- [Inter-robot loop closure](inter-robot-loop-closure.md) — the measurements PCM validates
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — single-robot view of the same outlier problem
- [Communication constraints](communication-constraints.md) — why raw data is never exchanged
- [Visual place recognition](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the front-end stage whose thresholds PCM lets you relax

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
