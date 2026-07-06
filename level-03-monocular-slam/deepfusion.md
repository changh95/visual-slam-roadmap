# DeepFusion

> Laidlow 2019 · [Paper](https://arxiv.org/abs/2207.12244)

**One-line summary** — A dense monocular reconstruction system that probabilistically fuses semi-dense multi-view-stereo depth from a SLAM system with CNN-predicted depth and depth gradients, weighted by learned uncertainties.

## Key ideas

- **Semi-dense geometry + dense priors**: multi-view stereo from a monocular SLAM pipeline yields accurate but semi-dense depth (only at high-gradient pixels); a CNN predicts dense depth for every pixel. Fusing them gives dense maps that respect multi-view geometry where it is available.
- **Depth gradients, not just depth**: in addition to absolute depth, the network predicts depth *gradients*, which constrain local surface shape and help propagate sparse geometric measurements across textureless regions.
- **Probabilistic fusion with learned uncertainties**: the network outputs uncertainty estimates alongside its predictions, and fusion is formulated as an optimisation that weights each measurement by its (learned or estimated) confidence rather than trusting either source blindly.
- **Complementary failure modes**: photometric multi-view stereo fails in low-texture areas exactly where a learned prior is most useful, mirroring the motivation of CNN-SLAM but with a more explicitly probabilistic formulation.

## Why it matters for SLAM

DeepFusion sits in the lineage of systems that make monocular dense reconstruction practical by combining classical multi-view geometry with learned single-image cues (CNN-SLAM, DVSO, D3VO). Its emphasis on uncertainty-aware fusion — treating network outputs as noisy measurements with confidences rather than ground truth — became a recurring design principle in later learned-plus-geometric SLAM systems.

## Related

- [CNN-SLAM](cnn-slam.md)
- [LSD-SLAM](lsd-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
