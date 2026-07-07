# VGGT-Geo

> Qin 2026 · [Paper](https://www.mdpi.com/2220-9964/15/2/85)

**One-line summary** — A probabilistic framework that fuses VGGT's feed-forward geometric priors with classical multi-view constraints using uncertainty weighting, yielding dense indoor SLAM that is more accurate than either source alone.

## Problem

Foundation models like VGGT provide powerful geometric priors — feed-forward poses, depth maps, and pointmaps — but they are not always right: predictions degrade in occluded regions, on reflective surfaces, and in out-of-distribution scenes, and simply trusting the model's output produces reconstruction artifacts. VGGT-Geo addresses this by treating VGGT predictions as *probabilistic priors with uncertainty* and fusing them with classical multi-view geometric constraints instead of using them raw.

## Key ideas

- **Priors, not ground truth**: VGGT supplies feed-forward estimates of camera poses $\hat{\mathbf{T}}_i$, depth maps $\hat{d}_i(\mathbf{p})$, and dense pointmaps, together with confidence maps that act as uncertainty proxies.
- **Uncertainty calibration**: the raw confidence maps are calibrated into proper uncertainty estimates $\sigma_i(\mathbf{p})$ by a lightweight learned module trained to predict actual error distributions — raw network confidences are notoriously overconfident, so calibration is what makes the fusion principled.
- **Probabilistic geometric fusion**: VGGT priors and classical constraints (photometric consistency, geometric triangulation, temporal smoothness) are combined in a factor graph, each factor weighted by its estimated uncertainty:
  $$E = \sum_i \frac{1}{\sigma_{\text{VGGT}}^2}\,\| \mathbf{T}_i - \hat{\mathbf{T}}_i \|^2 + \sum_{i,j} \frac{1}{\sigma_{\text{geo}}^2}\,\| e_{\text{geo}}(i,j) \|^2$$
- **Best of both worlds**: the fused reconstruction is more complete than geometry-only dense SLAM (which fails in textureless regions) and more accurate than VGGT-only reconstruction (which drifts from true geometry in hard regions).

## Results & impact

On ScanNet, Replica, and TUM-RGBD, the paper reports that VGGT-Geo outperforms both VGGT-only reconstruction and classical dense SLAM, with a 10–20% improvement in depth accuracy and improved completeness in challenging regions. More broadly, it demonstrates that foundation models and classical geometry are complementary rather than competing — the same conclusion the field keeps reaching from different directions.

## Why it matters for SLAM

VGGT-Geo represents the maturing phase of foundation-model SLAM: rather than replacing classical geometry outright, it treats learned predictions as probabilistic priors inside a conventional estimation backend. This "complementary, not competing" pattern — learned prior + geometric constraint + uncertainty weighting — is a recurring recipe you will see across modern dense SLAM, and this paper is a clean indoor-mapping instance of it.

## Related

- [VGGT](vggt.md) — the feed-forward foundation model providing the priors
- [VGGT-SLAM](vggt-slam.md) — direct use of VGGT as a SLAM front-end
- [MASt3R-SLAM](mast3r-slam.md) — SLAM built on a pairwise pointmap foundation model
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the estimation machinery underlying the fusion

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
