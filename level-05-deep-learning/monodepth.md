# MonoDepth

> Godard 2016 · [Paper](https://arxiv.org/abs/1609.03677)

**One-line summary** — Self-supervised monocular depth estimation trained on stereo pairs via left-right photometric consistency: stereo images supervise training, but a single image suffices at test time.

## Key ideas

- **Stereo as free supervision**: Instead of expensive LiDAR ground truth, training uses stereo pairs — predicting the disparity that warps one view into the other is equivalent to predicting depth.
- **Photometric reconstruction loss**: The right image is warped to the left viewpoint using predicted disparity (bilinear sampling), and the appearance difference is minimized with a mix of SSIM and $\ell_1$: $\mathcal{L}_{\text{ap}} = \frac{\alpha}{2}(1 - \text{SSIM}(I^l, \tilde{I}^l)) + (1-\alpha)\|I^l - \tilde{I}^l\|_1$.
- **Left-right consistency**: The network predicts both left and right disparity maps from the left image alone, and a consistency loss forces them to agree — resolving ambiguities from occlusion and producing much cleaner depth.
- **Edge-aware smoothness**: Disparity smoothness is weighted by image gradients so depth discontinuities align with object boundaries.
- Achieved accuracy comparable to supervised methods of its era on KITTI without any LiDAR supervision.

## Why it matters for SLAM

MonoDepth pioneered self-supervised depth estimation and spawned a massive research direction (Monodepth2, PackNet, and dozens more); its left-right consistency and photometric-loss machinery became standard tools. For SLAM, it opened the path to depth priors that can be trained from the same kind of raw driving/robot footage a SLAM system already collects — no depth sensor required — which is the foundation of the self-supervised depth line used in D3VO, MonoRec, and modern monocular dense mapping.

## Related

- [SfM-Learner](sfm-learner.md) — the monocular-video counterpart (depth + ego-motion)
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — concept overview
- [MiDaS](midas.md) — the multi-dataset generalization successor
- [MonoRec](monorec.md) — dense reconstruction building on this lineage

[Back to Level 5](../README.md#level-5-applying-deep-learning)
