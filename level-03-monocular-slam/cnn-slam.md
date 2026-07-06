# CNN-SLAM

> Tateno 2017 · [Paper](https://arxiv.org/abs/1704.03489)

**One-line summary** — Fused CNN-predicted dense depth maps with LSD-SLAM's semi-dense photometric depth estimates, recovering absolute scale and dense reconstruction from a single camera.

## Key ideas

- **Complementary depth sources**: direct SLAM (LSD-SLAM) gives accurate multi-view depth in textured regions but fails in low-texture areas; a depth-prediction CNN gives dense, metric depth everywhere but lacks multi-view consistency. CNN-SLAM fuses both.
- **Uncertainty-weighted fusion**: per pixel, depth estimates are combined by inverse-variance weighting, $d_{\text{fused}} = \frac{\sigma_{\text{cnn}}^{-2} d_{\text{cnn}} + \sigma_{\text{slam}}^{-2} d_{\text{slam}}}{\sigma_{\text{cnn}}^{-2} + \sigma_{\text{slam}}^{-2}}$, so whichever source is more reliable dominates.
- **CNN depth for keyframe initialisation**: new keyframes start from predicted depth instead of random depth, improving convergence and reducing tracking failures.
- **Absolute scale recovery**: because the CNN was trained on metric depth data, its predictions resolve the monocular scale ambiguity.
- **Semantic labels in 3D**: a segmentation CNN labels pixels, and the labels are fused into the reconstruction through the same depth maps, yielding a semantically annotated dense model.

## Why it matters for SLAM

CNN-SLAM was one of the first systems to combine deep depth prediction with a classical SLAM pipeline, pioneering the "classical + learned" paradigm that DVSO, D3VO, and many later systems followed. It demonstrated two things that shaped subsequent research: learned depth can recover metric scale for monocular SLAM, and geometry and semantics can be reconstructed jointly in one system.

## Related

- [LSD-SLAM](lsd-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
