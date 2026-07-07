# maplab 2.0

> Cramariuc 2023 · [Paper](https://arxiv.org/abs/2212.00654)

**One-line summary** — maplab 2.0 is ETH Zurich's modular, open-source mapping platform that unifies multi-session and multi-robot visual-inertial mapping with support for additional sensor modalities and deep-learned modules.

## Problem

Integrating multiple sensor modalities and deep learning into SLAM are two of the most active directions in current research: multi-modality is a stepping stone toward robustness in challenging environments and toward interoperability of heterogeneous multi-robot systems with varying sensor setups. What was missing is a versatile open platform on which such modules can be developed, tested, and integrated into a *fully-fledged* SLAM system — rather than every research idea requiring a bespoke pipeline. maplab 2.0 provides exactly that platform, extending the original maplab's multi-session visual-inertial mapping toolbox.

## Key ideas

- **Modular platform, not a monolithic system**: maplab 2.0 is explicitly designed so researchers can develop, test, and integrate new modules (frontends, place recognition, loop-closure sources, optimization plugins) into a fully-fledged SLAM system without rewriting core infrastructure.
- **Multi-session and multi-robot mapping**: maps from different sessions or robots ("missions") are stored in a common map structure; cross-session/cross-robot loop closures are found by place recognition (classical bag-of-words or learned descriptors such as NetVLAD can be plugged in) and the submaps are merged and jointly optimized into one globally consistent map.
- **Batch and online workflows**: the same map structure serves offline console-style map building, maintenance, and re-optimization as well as online mapping — which is what makes the multi-session lifecycle (map today, extend tomorrow, localize next week) practical.
- **Multi-modality as a robustness strategy**: beyond the classical visual-inertial pipeline, the framework can incorporate **non-visual landmarks** and heterogeneous sensor setups, enabling interoperability across robots with different hardware — one of the paper's three showcased use cases.
- **Deep learning integration**: demonstrated with a semantic object-based loop closure module inside the mapping framework, reflecting the trend of mixing learned components (learned features, learned place recognition) with classical estimation.
- **Server-style aggregation**: as a mapping *framework* rather than an online swarm system, it represents the centralized end of the collaborative-SLAM design space — collect missions, then merge and optimize them with full information.

## Results & impact

Through extensive experiments the authors show maplab 2.0's accuracy is comparable to the state of the art on the HILTI 2021 benchmark. The system's flexibility is demonstrated with three use cases: (i) large-scale multi-robot multi-session mapping — approximately 10 km of trajectories across 23 missions; (ii) integration of non-visual landmarks; and (iii) a semantic object-based loop closure module incorporated into the mapping framework. The code is open source (`ethz-asl/maplab`), and the platform serves as a production-quality backbone for multi-session mapping research.

## Why it matters for SLAM

Real deployments rarely involve a single robot mapping once: maps must be built, extended, and maintained across days and across devices. maplab (1.0 and 2.0) is one of the few production-quality open frameworks built around this multi-session lifecycle, which makes it a natural backbone for centralized collaborative mapping and for benchmarking new modules against a complete system. Its plugin architecture has made it a common research vehicle for integrating learned features, new sensors, and semantic loop closure into visual-inertial mapping.

## Related

- [maplab](../level-06-vio-vins/maplab.md) — the original visual-inertial mapping framework this extends
- [Kimera-Multi](kimera-multi.md) — the decentralized alternative philosophy
- [Map merging](map-merging.md) — the core operation behind multi-session and multi-robot fusion
- [Centralized vs Decentralized](centralized-vs-decentralized.md) — where server-based frameworks sit in the design space
- [NetVLAD](../level-05-deep-learning/netvlad.md) — learned place recognition of the kind maplab 2.0 can plug in

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
