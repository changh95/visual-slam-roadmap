# hloc

> Sarlin 2019 · [Code](https://github.com/cvg/Hierarchical-Localization)

**One-line summary** — The open-source toolbox implementing HF-Net's hierarchical localization recipe — coarse place retrieval (NetVLAD) followed by fine local matching (SuperPoint + SuperGlue) and PnP — which became the community-standard visual localization pipeline.

## Problem

The coarse-to-fine localization paradigm from HF-Net is a multi-stage system — global descriptors, retrieval, local features, matching, SfM triangulation, PnP — and every research group re-implementing that chain from scratch made results hard to reproduce and compare. hloc packages the whole pipeline as maintained open-source software, so that state-of-the-art localization is a configuration choice rather than an engineering project.

## Key ideas

- **Coarse-to-fine pipeline as software**: hloc packages the full chain — global descriptor extraction, top-$k$ image retrieval, local feature extraction, learned matching, SfM triangulation, and PnP + RANSAC pose estimation — into a reproducible toolkit.
- **Modular feature/matcher zoo**: global descriptors (NetVLAD and successors) and local features (SuperPoint, DISK, SIFT, and others) are swappable; SuperGlue served as the default fine-stage matcher, with LightGlue later becoming the default.
- **COLMAP integration**: hloc builds and localizes against COLMAP SfM models, bridging offline mapping and online relocalization with the same feature stack.
- **Benchmark workhorse**: it became the standard pipeline for the Long-Term Visual Localization benchmarks, with SuperPoint + SuperGlue via hloc the dominant baseline for both indoor and outdoor localization.
- **De facto evaluation harness**: new local features and matchers (DISK, XFeat, DeDoDe, LightGlue, and others) routinely demonstrate their value by plugging into hloc and reporting its benchmark numbers.

## Results & impact

- The reference implementation of hierarchical localization: it operationalized HF-Net's paradigm with known-good defaults and kept absorbing each generation of learned components as they appeared.
- Widely used in localization competitions, research systems, and product prototypes — either directly or as the template for in-house localization stacks.

## Why it matters for SLAM

For anyone building relocalization, loop closure, or map-based localization, hloc is the reference implementation to start from: it operationalizes the coarse-to-fine paradigm with state-of-the-art learned components and known-good defaults. Many research systems and product prototypes use hloc either directly or as the template for their own localization stacks, and new features/matchers routinely demonstrate their value by plugging into it.

## Related

- [HF-Net](hf-net.md) — the paper whose hierarchical localization scheme hloc implements
- [NetVLAD](netvlad.md) — the coarse retrieval descriptor
- [SuperPoint](superpoint.md) — default local features
- [SuperGlue](superglue.md) — the learned matcher at the fine stage
- [LightGlue](lightglue.md) — faster matcher that later became the default
- [COLMAP](../level-03-monocular-slam/colmap.md) — the SfM backbone hloc maps and localizes against

[Back to Level 5](../README.md#level-5-applying-deep-learning)
