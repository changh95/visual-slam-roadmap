# hloc

> Sarlin 2019 · [Code](https://github.com/cvg/Hierarchical-Localization)

**One-line summary** — The open-source toolbox implementing HF-Net's hierarchical localization recipe — coarse place retrieval (NetVLAD) followed by fine local matching (SuperPoint + SuperGlue) and PnP — which became the community-standard visual localization pipeline.

## Key ideas

- **Coarse-to-fine pipeline as software**: hloc packages the full chain — global descriptor extraction, top-$k$ image retrieval, local feature extraction, learned matching, SfM triangulation, and PnP + RANSAC pose estimation — into a reproducible toolkit.
- **Modular feature/matcher zoo**: global descriptors (NetVLAD and successors) and local features (SuperPoint, DISK, SIFT, and others) are swappable, with matchers like SuperGlue and later LightGlue as the default fine stage.
- **COLMAP integration**: hloc builds and localizes against COLMAP SfM models, bridging offline mapping and online relocalization with the same feature stack.
- **Benchmark workhorse**: it became the standard pipeline for the Long-Term Visual Localization benchmarks, with SuperPoint + SuperGlue via hloc the dominant baseline for both indoor and outdoor localization.

## Why it matters for SLAM

For anyone building relocalization, loop closure, or map-based localization, hloc is the reference implementation to start from: it operationalizes the coarse-to-fine paradigm with state-of-the-art learned components and known-good defaults. Many research systems and product prototypes use hloc either directly or as the template for their own localization stacks, and new features/matchers routinely demonstrate their value by plugging into it.

## Related

- [HF-Net](hf-net.md) — the paper whose hierarchical localization scheme hloc implements
- [NetVLAD](netvlad.md) — the coarse retrieval descriptor
- [SuperPoint](superpoint.md) — default local features
- [SuperGlue](superglue.md) — the learned matcher at the fine stage
- [LightGlue](lightglue.md) — faster matcher that later became the default

[Back to Level 5](../README.md#level-5-applying-deep-learning)
