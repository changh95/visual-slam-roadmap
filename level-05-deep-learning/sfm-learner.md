# SfM-Learner

> Zhou 2017 · [Paper](https://arxiv.org/abs/1704.07813)

**One-line summary** — Jointly trains a depth network and a pose network from unlabeled monocular video using photometric view synthesis as the only supervision, founding the self-supervised depth + ego-motion field.

## Key ideas

- **Two networks, one loss**: DepthNet predicts per-pixel depth $\hat{D}(I_t)$; PoseNet predicts the relative camera pose $\hat{T}_{t \to s}$ between frames. Neither has ground-truth labels.
- **View synthesis supervision**: Using predicted depth and pose, source frame $I_s$ is warped into the target view via $p_s \sim K \hat{T}_{t \to s} \hat{D}(p_t) K^{-1} p_t$ with differentiable bilinear sampling; the photometric error $\|I_t - \hat{I}_s\|_1$ trains both networks — geometry emerges because only correct depth *and* pose make the warp photo-consistent.
- **Explainability mask**: A learned mask down-weights pixels violating the static-scene assumption (moving objects, occlusions).
- **Edge-aware smoothness**: Regularization propagates depth into textureless regions where the photometric loss is uninformative.
- **Inherited limitations**: Monocular scale ambiguity remains (depth and pose are recovered up to scale), and the static-world/brightness-constancy assumptions bound accuracy.

## Why it matters for SLAM

SfM-Learner showed that the classical SfM/SLAM objective — photometric consistency across views — can serve as a training signal instead of a runtime cost, letting networks learn depth and ego-motion from raw video. Its view-synthesis loss became the template for Monodepth2, D3VO, and dozens of self-supervised VO/depth systems that now feed learned depth priors back into SLAM pipelines. It marks the conceptual bridge between direct SLAM and end-to-end learned odometry.

## Related

- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — the concept this paper launched
- [MonoDepth](monodepth.md) — stereo-supervised sibling approach
- [DeepVO](deepvo.md) — supervised learned odometry counterpart
- [UndeepVO](undeepvo.md) — follow-up recovering absolute scale from stereo training
- [D3VO](../level-03-monocular-slam/d3vo.md) — self-supervised predictions integrated into direct VO

[Back to Level 5](../README.md#level-5-applying-deep-learning)
