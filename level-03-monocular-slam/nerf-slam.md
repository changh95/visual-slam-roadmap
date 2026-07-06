# NeRF-SLAM

> Rosinol 2023 · [Paper](https://arxiv.org/abs/2210.13641)

**One-line summary** — Coupled a classical(-style) dense monocular SLAM frontend (DROID-SLAM) with an Instant-NGP radiance-field backend, using depth uncertainty to weight NeRF training — real-time dense monocular reconstruction.

## Key ideas

- **SLAM feeds NeRF**: the insight is that dense monocular SLAM already produces exactly what a NeRF needs to train in real time — accurate poses and dense depth maps *with associated uncertainty*.
- **DROID-SLAM frontend**: provides camera poses and dense depth with per-pixel confidence (high on textured surfaces, low in textureless or occluded areas) from monocular input alone.
- **Uncertainty-weighted depth loss**: NeRF depth supervision is weighted by the SLAM depth marginal covariance,
  $$\mathcal{L}_d = \sum_{\mathbf{r}} \sigma_d(\mathbf{r})^{-2} \, \| D_{\text{NeRF}}(\mathbf{r}) - D_{\text{SLAM}}(\mathbf{r}) \|^2,$$
  so noisy depth cannot corrupt the map while confident depth pins down geometry; photometric rendering loss complements it.
- **Instant-NGP backend**: the hash-grid NeRF converges fast enough for online mapping on a single GPU.
- **Monocular and real-time**: unlike iMAP/NICE-SLAM, no depth sensor is required; the paper reports large gains in photometric (PSNR) and geometric (L1 depth) accuracy over competing approaches while running in real time.

## Why it matters for SLAM

NeRF-SLAM (from Rosinol, of Kimera fame) crystallised the hybrid recipe — estimation-theoretic SLAM for poses and uncertainty, neural fields for the map — showing the two are complementary rather than competing. Its uncertainty-weighted supervision became a recurring technique for fusing noisy geometry into neural representations, and the DROID-SLAM + neural-map pattern reappears in GO-SLAM and later systems.

## Related

- [DROID-SLAM](droid-slam.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [GO-SLAM](go-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
