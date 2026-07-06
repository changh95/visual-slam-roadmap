# BA on Graph Processor

> Ortiz 2020 · [Paper](https://arxiv.org/abs/2003.03134)

**One-line summary** — First demonstration (CVPR 2020) that bundle adjustment can be solved extremely fast with Gaussian Belief Propagation on a graph processor (Graphcore IPU), validating the algorithm-hardware co-design vision of FutureMapping.

## Key ideas

- Standard BA solvers (Ceres, g2o) rely on sparse Cholesky factorization on CPUs — inherently sequential and memory-bound — while GPUs struggle with the irregular sparsity of the Hessian.
- Graph processors like Graphcore's IPU offer massive parallelism with distributed on-chip memory: 1216 independent cores ("tiles"), each with local SRAM and very high inter-core communication bandwidth — ideal for message-passing algorithms on arbitrary graphs.
- The BA factor graph is mapped directly onto the chip: camera and point variable nodes and reprojection factors are distributed across tiles, and Gaussian Belief Propagation (GBP) message passing replaces the global linear solve.
- Reported result: a real BA problem with 125 keyframes and 1919 points is solved in under 40 ms on a single IPU, versus 1450 ms for the Ceres CPU library.
- The authors argue the real promise is not static problems but flexible, in-place optimization of general, dynamically changing factor graphs that represent Spatial AI problems.

## Why it matters for SLAM

This paper turned the speculative FutureMapping essays into concrete evidence that rethinking SLAM computation around graphs, local storage, and message passing can yield order-of-magnitude speedups. It seeded a research line on GBP for incremental, distributed, and multi-robot estimation (e.g., Robot Web-style systems and DANCeRS) and is a key reference for anyone thinking about SLAM on novel accelerators rather than CPUs.

## Related

- [FutureMapping 1](futuremapping-1.md)
- [FutureMapping 2](futuremapping-2.md)
- [DANCeRS](dancers.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
