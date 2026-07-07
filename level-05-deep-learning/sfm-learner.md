# SfM-Learner

> Zhou 2017 · [Paper](https://arxiv.org/abs/1704.07813)

**One-line summary** — Jointly trains a single-view depth network and a multi-view pose network from unlabeled monocular video using photometric view synthesis as the only supervision, founding the self-supervised depth + ego-motion field.

## Problem

Supervised depth and pose estimation need expensive ground truth — LiDAR scans for depth, motion capture or high-grade GPS/INS for poses — which limits training data to a handful of instrumented datasets. Yet unstructured monocular video is essentially free and unlimited.

The insight: a view synthesis system "only performs consistently well when its intermediate predictions of the scene geometry and the camera poses correspond to the physical ground-truth". So train networks on the 'meta'-task of view synthesis, and depth and ego-motion must emerge as intermediate predictions.

## Method & architecture

- **Two networks, coupled only by the loss.** The depth network (DispNet-style encoder-decoder with skip connections and multi-scale side predictions; depth output $1/(\alpha \cdot \mathrm{sigmoid}(x)+\beta)$ with $\alpha=10,\beta=0.01$) sees a single target frame. The pose network (target + source frames concatenated; 7 stride-2 convolutions, then a 1×1 conv with $6(N-1)$ channels — 3 Euler angles + 3D translation per source view — and global average pooling) predicts relative poses $\hat{T}_{t\rightarrow s}$. They train jointly but run independently at test time.
- **View synthesis objective.** With target $I_t$ and sources $I_s$:

$$\mathcal{L}_{vs}=\sum_{s}\sum_{p}\left|I_{t}(p)-\hat{I}_{s}(p)\right|,$$

  where $\hat{I}_{s}$ is $I_s$ warped into the target frame. Each target pixel $p_t$ is projected into the source view via

$$p_{s}\sim K\hat{T}_{t\rightarrow s}\hat{D}_{t}(p_{t})K^{-1}p_{t},$$

  ($K$ intrinsics, $\hat{D}_t$ predicted depth) and $\hat{I}_s(p_t)$ is filled by differentiable bilinear sampling of the 4-pixel neighbours (spatial transformer networks). Only correct depth *and* pose make the warp photo-consistent.
- **Explainability mask.** A third head (sharing the pose encoder, 5 deconv layers, per-pair softmax) predicts a soft mask $\hat{E}_{s}$ weighting the loss, $\mathcal{L}_{vs}=\sum_{s}\sum_{p}\hat{E}_{s}(p)\,|I_{t}(p)-\hat{I}_{s}(p)|$, discounting moving objects, occlusion, and non-Lambertian effects; a cross-entropy regularizer toward 1 prevents the trivial all-zero mask.
- **Gradient locality fix.** Bilinear-sampling gradients are local, so the full objective is applied over an image pyramid with an L1 penalty on second-order depth gradients for smoothness:

$$\mathcal{L}_{final}=\sum_{l}\mathcal{L}_{vs}^{l}+\lambda_{s}\mathcal{L}_{smooth}^{l}+\lambda_{e}\sum_{s}\mathcal{L}_{reg}(\hat{E}_{s}^{l}).$$

- **Training.** TensorFlow; $\lambda_s=0.5/l$, $\lambda_e=0.2$; Adam (lr 0.0002, batch 4), ~150K iterations; 3-frame snippets at 128×416 (44,540 KITTI sequences: 40,109 train / 4,431 val).

## Results

- **KITTI depth (Eigen split, 697 test images, median-scaled):** Abs Rel 0.208 trained on KITTI, 0.198 with Cityscapes pre-training — comparable to *depth-supervised* Eigen et al. (0.203 Fine) and close to *pose-supervised* Garg et al. (cap 50 m: 0.201 vs 0.169), though behind concurrent stereo-trained Godard et al. (0.148). Remarkable given zero labels.
- Explainability ablation is modest (0.221 → 0.208 Abs Rel) — KITTI is mostly static over 3-frame snippets.
- **Pose (KITTI odometry 09/10, ATE over 5-frame snippets):** 0.021±0.017 / 0.020±0.015 m — better than ORB-SLAM (short) run on the same 5-frame snippets (0.064±0.141 / 0.064±0.130) and the mean-odometry baseline, behind only ORB-SLAM (full), which uses whole sequences with loop closure and relocalization (0.014±0.008 / 0.012±0.011).
- **Make3D zero-shot:** Abs Rel 0.383 without any Make3D training — captures global layout, with a gap to Make3D-supervised methods.
- Inherited limits stated in the paper: scale ambiguity remains, intrinsics must be known, and static-scene/photo-consistency assumptions bound accuracy — the same assumptions that limit direct SLAM.

## Why it matters for SLAM

SfM-Learner showed that the classical SfM/SLAM objective — photometric consistency across views — can serve as a training signal instead of a runtime cost, letting networks learn depth and ego-motion from raw video. Its view-synthesis loss became the template for Monodepth2, D3VO, and dozens of self-supervised VO/depth systems that now feed learned depth priors back into SLAM pipelines. It marks the conceptual bridge between direct SLAM and end-to-end learned odometry.

## Related

- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — the concept this paper launched
- [MonoDepth](monodepth.md) — stereo-supervised sibling approach
- [DeepVO](deepvo.md) — supervised learned odometry counterpart
- [UndeepVO](undeepvo.md) — follow-up recovering absolute scale from stereo training
- [DeMoN](demon.md) — concurrent supervised two-view depth + motion
- [D3VO](../level-03-monocular-slam/d3vo.md) — self-supervised predictions integrated into direct VO
