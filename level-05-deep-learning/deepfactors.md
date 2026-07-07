# DeepFactors

> Czarnowski 2020 · [Paper](https://arxiv.org/abs/2001.05049)

**One-line summary** — DeepFactors (RA-L 2020) turns CodeSLAM's learned compact depth codes into a real-time probabilistic dense monocular SLAM system by combining photometric, reprojection, and geometric errors in a standard factor-graph framework.

## Problem

Monocular SLAM approaches had fragmented along three axes: scene geometry representation (sparse landmarks vs dense maps), the consistency metric used to optimize the multi-view problem (photometric vs reprojection vs geometric), and whether learned priors are used. Each family had its own bespoke pipeline, and none offered rich dense geometry inside a rigorous probabilistic estimator at real-time rates. DeepFactors set out to unify these methods "in a probabilistic framework while still maintaining real-time performance".

## Key ideas

- **Learned compact depth representation.** Each keyframe's dense depth is a low-dimensional learned code (the CodeSLAM idea), so dense geometry stays a small optimization variable that a factor graph can handle rigorously — including uncertainty.
- **Three error types as factors.** The system reformulates three different consistency errors and uses them *simultaneously* as factors: **photometric** (direct image alignment, dense but locally valid), **reprojection** (feature-based, sparse but wide-basin), and **geometric** (depth-map consistency between keyframes).
- **Standard factor-graph software.** All of these are implemented within standard factor-graph machinery rather than a bespoke optimizer — bringing mainstream SLAM tooling (flexible factor combination, marginalization of old keyframes, uncertainty propagation) to learned dense representations.
- **Complementary strengths.** Reprojection factors give robust convergence from poor initializations; photometric factors add dense accuracy; the learned code prior keeps geometry plausible — the combination is more robust than any single error type, a central experimental finding.
- **Real-time on GPU.** Careful engineering keeps the full probabilistic dense system running in real time (the roadmap lists 30+ FPS on GPU), unlike most dense-optimization predecessors.

## Results & impact

- Evaluated on trajectory estimation and dense depth reconstruction on real-world sequences, with qualitative demonstrations of the estimated dense geometry (abstract).
- It brought probabilistic dense SLAM together with learned representations — uncertainty-aware map updates plus real-time performance in one system.
- Released as open source (the "DeepFactors" codebase), it became the reference implementation of the CodeSLAM lineage and directly informed follow-ups like CodeMapping.

## Why it matters for SLAM

DeepFactors is the bridge between the latent-code mapping line (CodeSLAM) and mainstream factor-graph SLAM engineering: it showed learned dense geometry can live inside the same probabilistic back-end as classical constraints rather than in a bespoke optimizer. Practically, it demonstrated that combining direct, feature-based, and learned-prior cues makes dense monocular SLAM both more robust and uncertainty-aware — a design philosophy echoed by later hybrid systems.

## Related

- [CodeSLAM](codeslam.md)
- [SceneCode](scenecode.md)
- [CodeMapping](codemapping.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
