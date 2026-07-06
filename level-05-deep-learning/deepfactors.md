# DeepFactors

> Czarnowski 2020 · [Paper](https://arxiv.org/abs/2001.05049)

**One-line summary** — DeepFactors (RA-L 2020) turns CodeSLAM's learned compact depth codes into a real-time probabilistic dense monocular SLAM system by combining photometric, reprojection, and geometric errors in a standard factor-graph framework.

## Key ideas

- Different SLAM families differ in geometry representation (sparse landmarks vs dense maps), consistency metric, and use of learned priors; DeepFactors unifies these choices in one probabilistic framework while staying real-time.
- Per-keyframe dense depth is represented by a learned compact code (as in CodeSLAM), so dense geometry remains a low-dimensional optimization variable suitable for rigorous inference.
- Three complementary error types are reformulated as factors and used simultaneously: **photometric** (direct image alignment), **reprojection** (feature-based), and **geometric** (depth consistency) — implemented within standard factor-graph software.
- The factor-graph formulation brings mainstream SLAM machinery (marginalization, uncertainty propagation, flexible factor combination) to learned dense representations, running in real time on GPU.

## Why it matters for SLAM

DeepFactors is the bridge between the latent-code mapping line (CodeSLAM) and mainstream factor-graph SLAM engineering: it showed learned dense geometry can live inside the same probabilistic back-end as classical constraints rather than in a bespoke optimizer. Practically, it demonstrated that combining direct, feature-based, and learned-prior cues makes dense monocular SLAM both more robust and uncertainty-aware — a design philosophy echoed by later hybrid systems.

## Related

- [CodeSLAM](codeslam.md)
- [SceneCode](scenecode.md)
- [CodeMapping](codemapping.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
