# CNN-SLAM

> Tateno 2017 · [Paper](https://arxiv.org/abs/1704.03489)

**One-line summary** — Fused CNN-predicted dense depth maps with LSD-SLAM's semi-dense photometric depth estimates, recovering absolute scale and dense reconstruction from a single camera.

## Problem

Direct monocular SLAM (LSD-SLAM) produces semi-dense depth maps, but it fails in low-texture regions and cannot recover absolute scale. Meanwhile, CNN-based single-image depth prediction had just become viable: it gives dense, scale-aware depth for every pixel, but lacks the multi-view consistency and fine geometric accuracy of triangulated depth. CNN-SLAM ("CNN-SLAM: Real-time dense monocular SLAM with learned depth prediction", Tateno, Tombari, Laina, Navab) asked how these two complementary sources could be fused into a single accurate, dense, metric monocular reconstruction system.

## Key ideas

- **Complementary depth sources**: direct SLAM gives accurate multi-view depth in textured regions but fails in low-texture areas; a depth-prediction CNN gives dense, metric depth everywhere but lacks multi-view consistency. The fusion scheme deliberately "privileges depth prediction in image locations where monocular SLAM approaches tend to fail, e.g. along low-textured regions, and vice-versa."
- **CNN depth prediction per keyframe**: a pre-trained fully convolutional depth network (in the lineage of Eigen et al. / Laina et al.) predicts a dense depth map for each new keyframe; the network only needs to run once per keyframe, not per frame.
- **Uncertainty-weighted fusion**: per pixel, depth estimates are combined by inverse-variance weighting,
  $$d_{\text{fused}} = \frac{\sigma_{\text{cnn}}^{-2}\, d_{\text{cnn}} + \sigma_{\text{slam}}^{-2}\, d_{\text{slam}}}{\sigma_{\text{cnn}}^{-2} + \sigma_{\text{slam}}^{-2}}$$
  so whichever source is more reliable at that pixel dominates: SLAM depth in high-gradient regions (low multi-view uncertainty), CNN depth in textureless ones.
- **CNN depth for keyframe initialisation**: new keyframes start from predicted depth instead of random depth, improving convergence of the photometric depth filter and reducing tracking failures.
- **Absolute scale recovery**: because the CNN was trained on metric depth data, its predictions carry absolute scale — the fusion therefore resolves the monocular scale ambiguity, "overcoming one of the major limitations of monocular SLAM."
- **Semantic labels in 3D**: a segmentation CNN labels each keyframe, and the single-frame labels are fused into the dense reconstruction through the same depth maps, yielding a semantically coherent 3D model from a single view.

## Results & impact

The paper evaluated on two benchmark datasets, demonstrating robust and accurate dense reconstruction with absolute scale recovery — the fusion helping precisely in the low-texture regions where LSD-SLAM's photometric depth estimation struggles. Beyond the benchmarks, CNN-SLAM's lasting impact is the fusion recipe itself: treat learned depth as a per-pixel measurement with an uncertainty, and combine it with multi-view depth in a principled weighted average. That recipe reappears in DeepFusion, DVSO, D3VO, and much of hybrid SLAM since.

## Why it matters for SLAM

CNN-SLAM was one of the first systems to combine deep depth prediction with a classical SLAM pipeline, pioneering the "classical + learned" paradigm that DVSO, D3VO, and many later systems followed. It demonstrated two things that shaped subsequent research: learned depth can recover metric scale for monocular SLAM, and geometry and semantics can be reconstructed jointly in one system.

## Related

- [LSD-SLAM](lsd-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [DeepFusion](deepfusion.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Self-supervised depth](self-supervised-depth.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
