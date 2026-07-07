# FutureMapping 2

> Davison 2019 · [Paper](https://arxiv.org/abs/1910.14139)

**One-line summary** — Tutorial-style follow-up to FutureMapping that develops Gaussian Belief Propagation on factor graphs as the core distributed algorithm for Spatial AI, with worked examples showing how it maps onto parallel hardware.

## Problem

FutureMapping 1 argued the vision; this paper supplies the algorithmic substance. Standard SLAM back-ends (g2o, GTSAM, Ceres) solve factor-graph inference via sparse Cholesky factorization — an inherently sequential, centralized global solve that cannot exploit the massive parallelism of emerging graph processors, and that fits poorly with the distributed, incremental, always-on estimation that smart robots and devices operating under real product constraints will need. The paper makes the case for GBP as the framework with "the right character" for this future.

## Key ideas

- **GBP message passing**: inference runs by purely local messages on the standard robotics/vision factor graph. Variable-to-factor: $\mu_{x_i \to f_a}(x_i) = \prod_{b \in \mathcal{N}(x_i) \setminus f_a} \mu_{f_b \to x_i}(x_i)$; factor-to-variable messages marginalize the factor over its other variables.
- **Closed-form Gaussian messages**: under Gaussian assumptions every message has closed form in the information (precision) parameterization — an information matrix and information vector per message — so each update is cheap local linear algebra.
- **Convergence behavior**: on tree-structured graphs GBP is exact in one sweep; on the loopy graphs typical of SLAM it converges to good approximations, helped by damping and message scheduling.
- **Distributed, generic, incremental**: because there is no global solve, GBP tolerates asynchronous updates, naturally absorbs new factors as they arrive, and mixes heterogeneous factor types — the estimation profile Spatial AI needs.
- **Natural hardware mapping**: each graph node maps to a processing core and all communication is neighbor-to-neighbor — no global synchronization or shared memory — exactly the execution model of graph processors with distributed on-chip SRAM.
- **Tutorial with code**: the paper is written as a detailed tutorial, relating GBP to the standard factor-graph formulation and providing simulation examples with code that demonstrate its properties.

## Results & impact

- Simulation examples cover pose graph optimization, visual-inertial-style factor graphs, and multi-robot settings, demonstrating that purely local message passing converges to solutions consistent with centralized inference.
- Became the standard accessible introduction to GBP for the SLAM community, catalyzing the follow-ups that produced real hardware speedups (Bundle Adjustment on a Graph Processor) and decentralized multi-robot inference (DANCeRS).
- Reconnected SLAM back-end research with the broader probabilistic graphical models literature.

## Why it matters for SLAM

This is the standard accessible introduction to GBP for SLAM researchers, and it catalyzed the follow-up work that demonstrated real speedups (bundle adjustment on Graphcore's IPU) and decentralized multi-robot inference (DANCeRS). Its core promise — factor-graph SLAM without a centralized solver — is directly relevant to multi-robot systems and to whatever massively parallel hardware ends up inside future AR devices.

## Related

- [FutureMapping 1](futuremapping-1.md) — the vision paper this one substantiates
- [BA on Graph Processor](ba-on-graph-processor.md) — first concrete IPU demonstration of GBP bundle adjustment
- [DANCeRS](dancers.md) — multi-robot distributed consensus via GBP
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the representation GBP operates on
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — the centralized formulation GBP replaces

[Back to Level 5](../README.md#level-5-applying-deep-learning)
