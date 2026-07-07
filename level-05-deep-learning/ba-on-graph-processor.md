# BA on Graph Processor

> Ortiz 2020 · [Paper](https://arxiv.org/abs/2003.03134)

**One-line summary** — First demonstration (CVPR 2020) that bundle adjustment can be solved extremely fast with Gaussian Belief Propagation on a graph processor (Graphcore IPU), validating the algorithm-hardware co-design vision of FutureMapping.

## Problem

Bundle adjustment is a central computational bottleneck of SLAM and SfM. Standard solvers (Ceres, g2o) rely on sparse Cholesky factorization on CPUs — an inherently sequential, memory-bound global linear solve — while GPUs struggle with the irregular sparsity pattern of the BA Hessian. FutureMapping had predicted that graph processors, with many cores each owning local memory, could instead solve BA by fully distributed message passing; this paper is the first concrete demonstration.

## Key ideas

- **Graph processors match factor graphs.** Graphcore's IPU has 1216 independent cores ("tiles") with distributed on-chip memory and very high inter-core communication bandwidth — a general design that "allows breakthrough performance for message passing algorithms on arbitrary graphs".
- **BA as Gaussian Belief Propagation.** The BA factor graph is mapped directly onto the chip: camera-pose and 3D-point variable nodes plus reprojection factors are distributed across tiles, and GBP message passing replaces the global sparse linear solve entirely.
- **Information-form Gaussian messages.** Messages are parameterized in information form (precision matrix and information vector — $6\times6$ blocks for cameras, $3\times3$ for points), so each tile performs only small, cheap local matrix operations; the synchronous message schedule maps naturally onto the IPU's bulk-synchronous parallel execution model.
- **Beyond least squares.** The experiments show GBP also handles robust cost functions and different factor types, and can efficiently solve *incremental* SLAM problems — new variables and factors are simply added to the graph and messages keep flowing, with no batch refactorization.
- **Dynamic graphs are the real prize.** The authors argue the deeper promise is not static BA speed but "flexible in-place optimisation of general, dynamically changing factor graphs representing Spatial AI problems".

## Results & impact

- Headline number from the abstract: a real BA problem with 125 keyframes and 1919 points is solved in under 40 ms on a single IPU, versus 1450 ms for the Ceres CPU library — with further code optimization expected to widen the gap.
- The paper seeded a research line on GBP for incremental, distributed, and multi-robot estimation (Robot Web-style systems, DANCeRS) and is the standard citation that algorithm–hardware co-design can deliver order-of-magnitude speedups for SLAM back-ends.

## Why it matters for SLAM

This paper turned the speculative FutureMapping essays into concrete evidence that rethinking SLAM computation around graphs, local storage, and message passing can yield order-of-magnitude speedups. As SLAM moves onto heterogeneous edge hardware and multi-robot systems, GBP's purely local computation model is one of the few back-end designs that scales naturally with core count — a key reference for anyone thinking about SLAM on novel accelerators rather than CPUs.

## Related

- [FutureMapping 1](futuremapping-1.md)
- [FutureMapping 2](futuremapping-2.md)
- [DANCeRS](dancers.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
