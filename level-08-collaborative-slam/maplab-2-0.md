# maplab 2.0

> Cramariuc 2023 · [Paper](https://arxiv.org/abs/2212.00654)

**One-line summary** — maplab 2.0 is ETH Zurich's modular, open-source mapping platform that unifies multi-session and multi-robot visual-inertial mapping with support for additional sensor modalities and deep-learned modules.

## Key ideas

- **Modular platform, not a monolithic system**: maplab 2.0 is explicitly designed so researchers can develop, test, and integrate new modules (frontends, place recognition, loop-closure sources, optimization plugins) into a fully-fledged SLAM system without rewriting core infrastructure.
- **Multi-session and multi-robot mapping**: maps from different sessions or robots are stored in a common map structure and merged into a globally consistent map — demonstrated at large scale with roughly 10 km of trajectories over 23 missions.
- **Multi-modality as a robustness strategy**: beyond the classical visual-inertial pipeline, the framework can incorporate **non-visual landmarks** and heterogeneous sensor setups, enabling interoperability across robots with different hardware.
- **Deep learning integration**: showcased with a semantic object-based loop closure module inside the mapping framework, reflecting the trend of mixing learned components with classical estimation.
- Accuracy is comparable to the state of the art on the HILTI 2021 benchmark, and the code is open source (`ethz-asl/maplab`).

## Why it matters for SLAM

Real deployments rarely involve a single robot mapping once: maps must be built, extended, and maintained across days and across devices. maplab (1.0 and 2.0) is one of the few production-quality open frameworks built around this multi-session lifecycle, which makes it a natural backbone for centralized collaborative mapping and for benchmarking new modules against a complete system. Its plugin architecture has made it a common research vehicle for integrating learned features, new sensors, and semantic loop closure into visual-inertial mapping.

## Related

- [maplab](../level-06-vio-vins/maplab.md) — the original visual-inertial mapping framework this extends
- [Kimera-Multi](kimera-multi.md) — the decentralized alternative philosophy
- [Map merging](map-merging.md) — the core operation behind multi-session and multi-robot fusion
- [Centralized vs Decentralized](centralized-vs-decentralized.md) — where server-based frameworks sit in the design space

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
