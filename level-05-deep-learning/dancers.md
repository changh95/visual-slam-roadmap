# DANCeRS

> Patwardhan 2025 · [Paper](https://arxiv.org/abs/2508.18153)

**One-line summary** — DANCeRS applies Gaussian Belief Propagation to distributed consensus in robot swarms: robots agree on shared decisions through purely local, peer-to-peer message passing on a factor graph, with no central server.

## Problem

Robot swarms need cohesive collective behaviour for challenges ranging from shape formation to group decision-making. Existing approaches, however, "often treat consensus in discrete and continuous decision spaces as distinct problems", each with its own bespoke algorithm. DANCeRS asks whether a single distributed inference framework can deliver consensus in both domains while respecting the realities of swarms: local-only communication, dynamic environments, and the need to scale with swarm size.

## Key ideas

- **Swarm = factor graph.** The whole swarm is represented as one factor graph: robot states are variable nodes, and factors encode individual observations/preferences plus inter-robot constraints between communicating neighbors.
- **GBP as the unifying solver.** Gaussian Belief Propagation performs inference by exchanging Gaussian messages only between neighbors — purely peer-to-peer message passing, with no central server and no global synchronization — which is what makes the method scalable and robust in dynamic environments.
- **One framework, two decision domains.** The same machinery handles continuous consensus (robots negotiating trajectories) and discrete consensus (robots agreeing on a shared choice from a set of options), unifying what prior work treated separately.
- **Application 1 — shape formation.** Robots perform distributed path planning and collision avoidance to arrange themselves into target shape formations, negotiating motion through local GBP messages.
- **Application 2 — discrete group decisions.** The same framework lets a group of robots converge on a consensus over a set of discrete decisions while relying only on local communication.
- **GBP-for-Spatial-AI lineage.** The work extends the Davison-lab research program (FutureMapping 2's GBP tutorial, Bundle Adjustment on a Graph Processor, GBP-based multi-robot planning) from estimation toward swarm-level collective behaviour.

## Results & impact

- Experimental results in the paper "highlight the method's scalability and efficiency compared to recent approaches to these problems" (abstract) — the two demonstrations cover shape formation with collision avoidance and discrete-choice consensus.
- Strengthens the case that factor-graph message passing can serve as a common computational substrate spanning estimation, mapping, planning, and now consensus — the same abstraction from single-robot SLAM back-ends to swarm coordination.
- A recent paper: the broader takeaway for now is the unified discrete+continuous consensus formulation rather than an established deployment record.

## Why it matters for SLAM

Collaborative SLAM at swarm scale runs into exactly the problems DANCeRS targets: centralized map servers become bandwidth and reliability bottlenecks, and distributed optimizers must tolerate asynchrony and local-only communication. Demonstrating that GBP-style consensus works across a swarm supports the vision of factor-graph message passing as the shared machinery for distributed estimation, mapping, and coordination — the same computation that solves BA on a graph processor.

## Related

- [FutureMapping 2](futuremapping-2.md)
- [BA on Graph Processor](ba-on-graph-processor.md)
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md)
- [Swarm-SLAM](../level-08-collaborative-slam/swarm-slam.md)
- [Centralized vs Decentralized](../level-08-collaborative-slam/centralized-vs-decentralized.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
