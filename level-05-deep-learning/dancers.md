# DANCeRS

> Patwardhan 2025 · [Paper](https://arxiv.org/abs/2508.18153)

**One-line summary** — DANCeRS applies Gaussian Belief Propagation to distributed consensus in robot swarms: robots agree on shared decisions through purely local, peer-to-peer message passing on a factor graph, with no central server.

## Key ideas

- Swarm coordination is framed as probabilistic inference on a factor graph that spans the whole swarm; Gaussian Belief Propagation (GBP) solves it by exchanging Gaussian messages only between communicating neighbors.
- Because GBP is inherently local and asynchronous, the approach is fully decentralized: there is no single point of failure and no requirement for global synchronization, matching the constraints of real swarm deployments with limited peer-to-peer communication.
- Consensus emerges from iterative message passing — each robot fuses its own observations/preferences with incoming neighbor messages until the swarm converges to a globally consistent decision.
- The work extends the GBP-for-Spatial-AI lineage (FutureMapping 2, Bundle Adjustment on a Graph Processor, GBP-based multi-robot planning from the same group) from estimation toward swarm-level decision making.

## Why it matters for SLAM

Collaborative SLAM at swarm scale runs into exactly the problems DANCeRS targets: centralized map servers become bandwidth and reliability bottlenecks, and distributed optimizers must tolerate asynchrony and dropped messages. Demonstrating that GBP-style consensus works across a swarm strengthens the case for factor-graph message passing as the common computational substrate for distributed estimation, mapping, and coordination — the same machinery that solves BA on a graph processor.

## Related

- [FutureMapping 2](futuremapping-2.md)
- [BA on Graph Processor](ba-on-graph-processor.md)
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md)
- [Swarm-SLAM](../level-08-collaborative-slam/swarm-slam.md)
- [Centralized vs Decentralized](../level-08-collaborative-slam/centralized-vs-decentralized.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
