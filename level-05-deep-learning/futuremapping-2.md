# FutureMapping 2

> Davison 2019 · [Paper](https://arxiv.org/abs/1910.14139)

**One-line summary** — Tutorial-style follow-up to FutureMapping that develops Gaussian Belief Propagation on factor graphs as the core distributed algorithm for Spatial AI, with worked examples showing how it maps onto parallel hardware.

## Key ideas

- **Vision to substance**: FutureMapping 1 argued the case; this paper supplies the algorithmic detail. Standard SLAM backends (g2o, GTSAM, Ceres) rely on sparse Cholesky factorization — a fundamentally sequential, centralized global solve.
- **GBP message passing**: inference runs by purely local messages. Variable-to-factor: $\mu_{x_i \to f_a}(x_i) = \prod_{b \in \mathcal{N}(x_i) \setminus f_a} \mu_{f_b \to x_i}(x_i)$; factor-to-variable messages marginalize the factor over the other variables. Under Gaussian assumptions all messages have closed form in information (precision) parameterization.
- **Convergence behavior**: on tree-structured graphs GBP is exact in one sweep; on the loopy graphs typical of SLAM it converges to good approximations, helped by damping and message scheduling.
- **Natural hardware mapping**: each graph node maps to a processing core and all communication is neighbor-to-neighbor — no global synchronization or shared memory — which is exactly the execution model of graph processors with distributed on-chip SRAM.
- Simulation examples cover pose graph optimization, visual-inertial factor graphs, and multi-robot settings, converging within tens of message-passing iterations.

## Why it matters for SLAM

This is the standard accessible introduction to GBP for SLAM researchers, and it catalyzed the follow-up work that demonstrated real speedups (bundle adjustment on Graphcore's IPU) and decentralized multi-robot inference (DANCeRS). Its core promise — factor-graph SLAM without a centralized solver — is directly relevant to multi-robot systems and to whatever massively parallel hardware ends up inside future AR devices.

## Related

- [FutureMapping 1](futuremapping-1.md) — the vision paper this one substantiates
- [BA on Graph Processor](ba-on-graph-processor.md) — first concrete IPU demonstration of GBP bundle adjustment
- [DANCeRS](dancers.md) — multi-robot distributed consensus via GBP
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the representation GBP operates on

[Back to Level 5](../README.md#level-5-applying-deep-learning)
