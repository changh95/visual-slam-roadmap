# FutureMapping 1

> Davison 2018 · [Paper](https://arxiv.org/abs/1803.11288)

**One-line summary** — Visionary position paper arguing that the future of SLAM ("Spatial AI") requires co-designing algorithms — specifically Gaussian Belief Propagation — with graph/neuromorphic processors and novel sensors.

## Problem

A big gap remains between the visual perception performance that devices such as augmented-reality eyewear or consumer robots will require and what is possible within the constraints imposed by real products — power, size, cost, latency. Davison argues that incremental algorithmic improvement within the existing CPU/GPU paradigm is approaching diminishing returns: the fundamental bottleneck is the mismatch between SLAM's computational structure (distributed, sparse, graph-structured inference) and von Neumann hardware (centralized, sequential, memory-bottlenecked). Closing the gap demands co-design of algorithms, processors, and sensors.

## Key ideas

- **From SLAM to Spatial AI**: SLAM should evolve into a general geometric *and semantic* "Spatial AI" perception capability for intelligent embodied devices — a framework for agents that perceive, reason about, and interact with 3D space in real time, not just self-localization.
- **Analyze the computational structure**: the paper systematically examines what current and future Spatial AI algorithms actually compute — sparse graph inference, dense per-pixel regression, learned priors — and places this within the landscape of ongoing hardware developments.
- **The hardware mismatch**: SLAM's computation is distributed, sparse, and graph-structured, but CPUs/GPUs are centralized, sequential, and memory-bottlenecked; data movement, not arithmetic, dominates energy cost on embedded devices.
- **GBP as the core algorithm**: Gaussian Belief Propagation on factor graphs is inherently distributed, parallel, and local — every node communicates only with its neighbors — making it the natural inference algorithm for massively parallel hardware.
- **Graph processors**: chips like Graphcore's IPU, with thousands of cores each holding local memory, map naturally onto factor-graph inference (one core per node's messages).
- **Novel sensors**: event cameras and other neuromorphic sensors produce asynchronous, sparse streams better matched to graph-structured processing than frame-based pipelines.

## Results & impact

- As a position paper its "results" are its predictions and the research program they seeded: FutureMapping 2 (the GBP tutorial), Bundle Adjustment on a Graph Processor (the first IPU demonstration), and distributed multi-robot GBP work (DANCeRS) all follow directly from it.
- It coined and popularized the "Spatial AI" framing that now labels a whole subfield spanning SLAM, scene understanding, and embodied AI.
- Influenced how industry and academia think about specialized hardware for real-time 3D perception in AR and robotics.

## Why it matters for SLAM

This paper reframed the research agenda of a significant part of the SLAM community: it coined the "Spatial AI" framing and launched the GBP-on-graph-processor research program (FutureMapping 2, bundle adjustment on the IPU, distributed multi-robot GBP). Even where its specific hardware bets have not yet materialized commercially, its argument — that perception algorithms and compute substrates must be co-designed — shapes how people think about SLAM on AR glasses and embedded robots.

## Related

- [FutureMapping 2](futuremapping-2.md) — the technical follow-up detailing GBP
- [BA on Graph Processor](ba-on-graph-processor.md) — bundle adjustment demonstrated on the IPU
- [DANCeRS](dancers.md) — distributed GBP for multi-robot systems
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md) — the broader concept this paper articulated
- [Event cameras (DVS)](../level-10-event-camera-slam/event-cameras-dvs.md) — the neuromorphic sensing direction it highlights

[Back to Level 5](../README.md#level-5-applying-deep-learning)
