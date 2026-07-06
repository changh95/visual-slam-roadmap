# OpenGS-SLAM

> Yang 2025 · [Paper](https://arxiv.org/abs/2503.01646)

**One-line summary** — An open-set dense semantic 3DGS SLAM system that integrates 2D foundation-model labels into 3D Gaussians via Gaussian Voting Splatting, enabling efficient object-level scene understanding on resource-constrained devices.

## Key ideas

- **Open-set semantics**: instead of a closed vocabulary of predefined categories, SAM segments each frame into object masks and CLIP assigns open-vocabulary labels, giving per-pixel semantics for any concept.
- **Gaussian Voting Splatting**: each Gaussian carries a discrete semantic label rather than a high-dimensional feature vector; during rendering, Gaussians "vote" for their label at each pixel via alpha-weighted splatting and the majority label wins.
- **Multi-view label consensus**: label votes are accumulated across views with confidence weights, resolving ambiguities and improving over single-view foundation-model predictions.
- **Compact representation**: storing integer label IDs instead of embeddings (e.g., 512-D CLIP features) drastically cuts per-Gaussian storage, making mobile deployment feasible.

## Why it matters for SLAM

OpenGS-SLAM sits at the intersection of two major trends: 3DGS-based dense SLAM and open-vocabulary semantic mapping driven by 2D foundation models. Its discrete-label voting scheme shows that object-level scene understanding does not require embedding heavy language features into every map element, which is the main cost problem of methods like ConceptFusion and LERF. This makes semantic 3DGS maps practical on phones and embedded robots.

## Related

- [SplaTAM](splatam.md)
- [LERF](lerf.md)
- [ConceptFusion](conceptfusion.md)
- [LEGS](legs.md)
- [SAM](../level-05-deep-learning/sam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
