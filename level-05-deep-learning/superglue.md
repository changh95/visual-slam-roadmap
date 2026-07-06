# SuperGlue

> Sarlin 2020 · [Paper](https://arxiv.org/abs/1911.11763)

**One-line summary** — Graph Neural Network feature matcher that uses self- and cross-attention plus differentiable Sinkhorn optimal transport (with a dustbin for unmatched points) to replace brittle nearest-neighbor matching.

## Key ideas

- **Matching as a learning problem**: Classical NN + ratio-test matching treats each descriptor independently. SuperGlue reasons about *all* keypoints in both images jointly, effectively learning geometric and contextual priors.
- **Attentional GNN**: Alternating self-attention (context within an image) and cross-attention (candidate correspondences across images) layers iteratively refine each keypoint's descriptor before matching.
- **Optimal transport assignment**: A score matrix over all keypoint pairs is turned into a soft assignment by differentiable Sinkhorn iterations, enforcing (partial) one-to-one matching structure.
- **Dustbin mechanism**: An extra row/column absorbs keypoints with no valid match — occlusions and partial overlap are handled inside the model rather than by post-hoc thresholds.
- Large gains over classical matching on indoor/outdoor pose estimation; typically paired with SuperPoint features.

## Why it matters for SLAM

SuperGlue changed the front-end recipe for hard association problems: SuperPoint + SuperGlue became the dominant baseline for visual localization, wide-baseline loop closure, and mapping via the hloc pipeline. For SLAM specifically, it made relocalization work across day/night and strong viewpoint changes where descriptor-distance matching collapses. Its cost — full attention over all keypoints every frame — motivated LightGlue, the efficient successor now standard in real-time settings.

## Related

- [SuperPoint](superpoint.md) — the detector/descriptor it usually matches
- [LightGlue](lightglue.md) — faster adaptive successor
- [LoFTR](loftr.md) — detector-free dense alternative
- [HF-Net](hf-net.md) — the hierarchical localization pipeline built around it

[Back to Level 5](../README.md#level-5-applying-deep-learning)
