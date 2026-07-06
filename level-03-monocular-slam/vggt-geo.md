# VGGT-Geo

> Qin 2026 · [Paper](https://www.mdpi.com/2220-9964/15/2/85)

**One-line summary** — A probabilistic framework that fuses VGGT's feed-forward geometric priors with classical multi-view constraints using uncertainty weighting, yielding dense indoor SLAM that is more accurate than either source alone.

## Key ideas

- **Foundation-model priors are not always right**: VGGT's feed-forward depth and pose predictions can degrade on occlusions, reflective surfaces, and out-of-distribution scenes; trusting them blindly produces artifacts.
- **Priors with uncertainty**: VGGT's confidence maps are calibrated into proper uncertainty estimates, so each prediction carries a measure of how much it should be trusted.
- **Probabilistic geometric fusion**: VGGT priors (poses, depths, pointmaps) and classical constraints (photometric consistency, triangulation, temporal smoothness) are combined in a factor graph, with each factor weighted by its estimated uncertainty.
- **Best of both worlds**: the fused result is more complete than geometry-only dense SLAM (which fails in textureless regions) and more accurate than VGGT-only reconstruction (which drifts from the true geometry in hard regions).

## Why it matters for SLAM

VGGT-Geo represents the maturing phase of foundation-model SLAM: rather than replacing classical geometry outright, it treats learned predictions as probabilistic priors inside a conventional estimation backend. This "complementary, not competing" pattern — learned prior + geometric constraint + uncertainty weighting — is a recurring recipe you will see across modern dense SLAM, and this paper is a clean indoor-mapping instance of it.

## Related

- [VGGT](vggt.md) — the feed-forward foundation model providing the priors
- [VGGT-SLAM](vggt-slam.md) — direct use of VGGT as a SLAM front-end
- [MASt3R-SLAM](mast3r-slam.md) — SLAM built on a pairwise pointmap foundation model
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the estimation machinery underlying the fusion

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
