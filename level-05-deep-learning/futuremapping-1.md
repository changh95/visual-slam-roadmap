# FutureMapping 1

> Davison 2018 · [Paper](https://arxiv.org/abs/1803.11288)

**One-line summary** — Visionary position paper arguing that the future of SLAM ("Spatial AI") requires co-designing algorithms — specifically Gaussian Belief Propagation — with graph/neuromorphic processors and novel sensors.

## Key ideas

- **From SLAM to Spatial AI**: SLAM should evolve from "robot self-localization" into a general computational framework for embodied agents that perceive, reason about, and interact with 3D space in real time.
- **The hardware mismatch**: SLAM's computational structure is distributed, sparse, graph-structured inference, but von Neumann CPUs/GPUs are centralized, sequential, and memory-bottlenecked; incremental algorithmic gains within that paradigm face diminishing returns.
- **GBP as the core algorithm**: Gaussian Belief Propagation on factor graphs is inherently distributed, parallel, and local — every node communicates only with its neighbors — making it the natural inference algorithm for massively parallel hardware.
- **Graph processors**: chips like Graphcore's IPU, with thousands of cores each holding local memory, map naturally onto factor-graph inference (one core per node's messages).
- **Novel sensors**: event cameras and other neuromorphic sensors produce asynchronous, sparse streams better matched to graph-structured processing than frame-based pipelines.

## Why it matters for SLAM

This paper reframed the research agenda of a significant part of the SLAM community: it coined the "Spatial AI" framing and launched the GBP-on-graph-processor research program (FutureMapping 2, bundle adjustment on the IPU, distributed multi-robot GBP). Even where its specific hardware bets have not yet materialized commercially, its argument — that perception algorithms and compute substrates must be co-designed — shapes how people think about SLAM on AR glasses and embedded robots.

## Related

- [FutureMapping 2](futuremapping-2.md) — the technical follow-up detailing GBP
- [BA on Graph Processor](ba-on-graph-processor.md) — bundle adjustment demonstrated on the IPU
- [DANCeRS](dancers.md) — distributed GBP for multi-robot systems
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md) — the broader concept this paper articulated

[Back to Level 5](../README.md#level-5-applying-deep-learning)
