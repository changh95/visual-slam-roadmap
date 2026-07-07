# MonoDepth

> Godard 2016 · [Paper](https://arxiv.org/abs/1609.03677)

**One-line summary** — Self-supervised monocular depth estimation trained on stereo pairs via left-right photometric consistency: stereo images supervise training, but a single image suffices at test time.

## Problem

Supervised monocular depth estimation treats depth as a regression problem and therefore requires vast quantities of ground-truth depth, which comes from expensive LiDAR or structured-light sensors — just recording quality depth data across a range of environments is itself a hard problem. Stereo rigs, by contrast, are cheap and ubiquitous. MonoDepth's insight is to use binocular stereo footage *only during training* as free supervision: predicting the disparity that warps one view into the other is equivalent to predicting depth, so the image reconstruction error becomes the training signal, and no depth labels are ever needed.

## Key ideas

- **Stereo as free supervision**: An encoder-decoder CNN predicts disparity from the left image; warping the right image into the left view with that disparity (via bilinear sampling) should reproduce the left image. Epipolar geometry turns image reconstruction into depth learning.
- **Photometric reconstruction loss**: The appearance difference between the real and reconstructed image is minimized with a mix of SSIM and $\ell_1$:
  $$\mathcal{L}_{\text{ap}} = \frac{\alpha}{2}\left(1 - \text{SSIM}(I^l, \tilde{I}^l)\right) + (1-\alpha)\,\|I^l - \tilde{I}^l\|_1$$
- **Reconstruction alone is not enough**: The paper shows that solving for image reconstruction alone yields poor-quality depth — the warp can be photometrically satisfied by wrong geometry, especially near occlusions.
- **Left-right consistency**: The key fix — the network predicts *both* left and right disparity maps from the left image alone, and a consistency loss forces them to agree when projected across views:
  $$\mathcal{L}_{\text{lr}} = \frac{1}{N}\sum_{ij} \left|d^l_{ij} - d^r_{ij + d^l_{ij}}\right|$$
  This resolves occlusion ambiguities and produces much cleaner, sharper depth.
- **Edge-aware smoothness**: Disparity smoothness is weighted by image gradients so depth discontinuities align with object boundaries instead of bleeding across them.

## Results & impact

On the KITTI driving dataset, MonoDepth produced state-of-the-art monocular depth — even outperforming supervised methods trained with ground-truth depth — and yielded qualitatively sharp depth maps with clear object boundaries. It pioneered self-supervised depth estimation as a research direction, and its left-right consistency loss and SSIM + $\ell_1$ photometric loss became standard components adopted by Monodepth2, PackNet, and many successors.

## Why it matters for SLAM

MonoDepth pioneered self-supervised depth estimation and spawned a massive research direction (Monodepth2, PackNet, and dozens more); its left-right consistency and photometric-loss machinery became standard tools. For SLAM, it opened the path to depth priors that can be trained from the same kind of raw driving/robot footage a SLAM system already collects — no depth sensor required — which is the foundation of the self-supervised depth line used in D3VO, MonoRec, and modern monocular dense mapping.

## Related

- [SfM-Learner](sfm-learner.md) — the monocular-video counterpart (depth + ego-motion)
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — concept overview
- [MiDaS](midas.md) — the multi-dataset generalization successor
- [MonoRec](monorec.md) — dense reconstruction building on this lineage
- [D3VO](../level-03-monocular-slam/d3vo.md) — deep VO built on this self-supervised training philosophy

[Back to Level 5](../README.md#level-5-applying-deep-learning)
