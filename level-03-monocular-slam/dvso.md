# DVSO

> Yang 2018 · [Paper](https://arxiv.org/abs/1807.02570)

**One-line summary** — Deep Virtual Stereo Odometry feeds CNN depth predictions into DSO as "virtual stereo" measurements, achieving stereo-level accuracy and metric scale from a single camera.

## Problem

Monocular VO that relies purely on geometric cues is "prone to scale drift and require[s] sufficient motion parallax in successive frames for motion estimation and 3D reconstruction." Stereo rigs fix both problems but cost hardware, calibration, and baseline constraints. DVSO ("Deep Virtual Stereo Odometry") asks whether a depth-prediction network can stand in for the second camera: keep DSO's photometric bundle adjustment, but add the constraints a stereo camera would have provided.

## Key ideas

- **Virtual stereo concept**: deep depth predictions are incorporated into DSO "as direct virtual stereo measurements" — the CNN acts as a virtual second camera whose predictions enter the photometric bundle adjustment as additional residuals constraining point depths, coupled through a virtual stereo baseline.
- **Two-stage StackNet**: a novel network "refines predicted depth from a single image in a two-stage process" — a coarse depth network followed by a refinement network that progressively improves single-image depth quality.
- **Semi-supervised training**: the network is trained "on photoconsistency in stereo images and on consistency with accurate sparse depth reconstructions from Stereo DSO" — dense self-supervised photometric signal plus accurate sparse geometric supervision, with no manual labels.
- **Self-improving loop**: the supervision comes from Stereo DSO, a geometric system, so the pipeline distils classical stereo geometry into a network that then upgrades *monocular* DSO — geometry teaching learning teaching geometry.
- **Scale recovery**: because the CNN is trained on stereo imagery with known baseline, its depth is metric, resolving monocular scale ambiguity and easing DSO's depth initialisation.

## Results & impact

From the abstract: the depth predictions "excel state-of-the-art approaches for monocular depth on the KITTI benchmark," and DVSO "clearly exceeds previous monocular and deep learning based methods in accuracy," even achieving "comparable performance to the state-of-the-art stereo methods, while only relying on a single camera." Stereo-class accuracy from one camera: DVSO made the case that a learned depth prior is effectively a sensor upgrade.

## Why it matters for SLAM

DVSO showed that learned depth can close the performance gap between monocular and stereo visual odometry, and its "CNN as a synthetic sensor" framing became an influential way to think about integrating networks into geometric pipelines. It is the middle step of the CNN-SLAM → DVSO → D3VO lineage, which D3VO completed by adding learned pose and uncertainty on top of learned depth.

## Related

- [DSO](dso.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [D3VO](d3vo.md)
- [CNN-SLAM](cnn-slam.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Scale ambiguity](scale-ambiguity.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
