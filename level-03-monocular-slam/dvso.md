# DVSO

> Yang 2018 · [Paper](https://arxiv.org/abs/1807.02570)

**One-line summary** — Deep Virtual Stereo Odometry feeds CNN depth predictions into DSO as "virtual stereo" measurements, achieving stereo-level accuracy and metric scale from a single camera.

## Key ideas

- **Virtual stereo concept**: a CNN trained to predict monocular depth acts as a virtual second camera; its predictions enter DSO's photometric bundle adjustment as virtual stereo residuals constraining point depths.
- **Two-stage StackNet**: a coarse depth network followed by a refinement network progressively improves single-image depth quality.
- **Semi-supervised training**: combines self-supervised left-right stereo photometric consistency with sparse depth supervision distilled from Stereo DSO reconstructions — dense photometric signal plus accurate sparse geometry.
- **Scale recovery**: because the CNN is trained on stereo imagery with known baseline, its depth is metric, resolving monocular scale ambiguity and easing depth initialisation.
- **Large accuracy gain**: on KITTI odometry, DVSO reported roughly halving DSO's translational error, reaching accuracy comparable to stereo VO methods.

## Why it matters for SLAM

DVSO showed that learned depth can close the performance gap between monocular and stereo visual odometry, and its "CNN as a synthetic sensor" framing became an influential way to think about integrating networks into geometric pipelines. It is the middle step of the CNN-SLAM → DVSO → D3VO lineage, which D3VO completed by adding learned pose and uncertainty on top of learned depth.

## Related

- [DSO](dso.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [D3VO](d3vo.md)
- [CNN-SLAM](cnn-slam.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
