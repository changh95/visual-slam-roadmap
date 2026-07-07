# SfM-Learner

> Zhou 2017 · [Paper](https://arxiv.org/abs/1704.07813)

**One-line summary** — Jointly trains a depth network and a pose network from unlabeled monocular video using photometric view synthesis as the only supervision, founding the self-supervised depth + ego-motion field.

## Problem

Supervised depth and pose estimation need expensive ground truth — LiDAR scans for depth, motion capture or high-grade GPS/INS for poses — which limits training data to a handful of instrumented datasets. Yet unstructured monocular video is essentially free and unlimited.

The question SfM-Learner answered: can the geometric consistency that classical SfM *optimizes at runtime* instead serve as a *training signal*, so that networks learn single-image depth and ego-motion from raw video with no labels at all?

## Key ideas

- **Two networks, one loss**: DepthNet predicts per-pixel depth $\hat{D}(I_t)$ from a single frame; PoseNet predicts the relative camera pose $\hat{T}_{t \to s}$ between nearby frames. Neither has ground-truth labels — they are coupled only through the view-synthesis objective during training, and can be applied independently at test time.
- **View synthesis supervision**: Using predicted depth and pose, each pixel in the target frame is mapped into the source frame via $p_s \sim K \hat{T}_{t \to s} \hat{D}(p_t) K^{-1} p_t$, and the source image is warped with differentiable bilinear sampling. The photometric error $\|I_t - \hat{I}_s\|_1$ trains both networks — geometry emerges because only correct depth *and* pose make the warp photo-consistent.
- **Explainability mask**: A learned per-pixel mask down-weights regions violating the static-scene and visibility assumptions (moving objects, occlusions), preventing them from corrupting the photometric gradient.
- **Edge-aware smoothness**: A regularizer propagates depth into textureless regions where the photometric loss is uninformative, with edges allowed at image gradients.
- **Multi-scale loss**: The photometric objective is applied across an image pyramid, because bilinear-sampling gradients are local — coarse scales provide learning signal when the current estimate is far from correct.
- **Inherited limitations**: Monocular scale ambiguity remains (depth and pose are recovered only up to a global scale), and the static-world/brightness-constancy assumptions bound achievable accuracy — the same assumptions that limit direct SLAM.

## Results & impact

- On KITTI, monocular depth performed comparably with supervised methods that used ground-truth pose or depth for training — remarkable given zero labels.
- Pose estimation performed favorably against established SLAM systems under comparable input settings.
- The view-synthesis loss became the template for the entire self-supervised depth/VO field — Monodepth2, SC-SfMLearner, PackNet, D3VO, and dozens of successors refine exactly this objective with better losses, masks, and constraints.
- Marked the conceptual bridge between direct (photometric) SLAM and end-to-end learned odometry: the same cost function, moved from runtime optimization to training time.

## Why it matters for SLAM

SfM-Learner showed that the classical SfM/SLAM objective — photometric consistency across views — can serve as a training signal instead of a runtime cost, letting networks learn depth and ego-motion from raw video. Its view-synthesis loss became the template for Monodepth2, D3VO, and dozens of self-supervised VO/depth systems that now feed learned depth priors back into SLAM pipelines. It marks the conceptual bridge between direct SLAM and end-to-end learned odometry.

## Related

- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — the concept this paper launched
- [MonoDepth](monodepth.md) — stereo-supervised sibling approach
- [DeepVO](deepvo.md) — supervised learned odometry counterpart
- [UndeepVO](undeepvo.md) — follow-up recovering absolute scale from stereo training
- [D3VO](../level-03-monocular-slam/d3vo.md) — self-supervised predictions integrated into direct VO

[Back to Level 5](../README.md#level-5-applying-deep-learning)
