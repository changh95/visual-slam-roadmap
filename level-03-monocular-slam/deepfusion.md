# DeepFusion

> Laidlow 2019 · [Paper](https://arxiv.org/abs/2207.12244)

**One-line summary** — A dense monocular reconstruction system that probabilistically fuses semi-dense multi-view-stereo depth from a SLAM system with CNN-predicted depth and depth gradients, weighted by learned uncertainties.

## Problem

Keypoint-based monocular SLAM maps are good for camera tracking but too sparse for many robotic tasks; depth cameras solve density but are "limited in range and to indoor spaces"; and dense reconstruction by minimising photometric error between frames is "typically poorly constrained and suffer[s] from scale ambiguity." DeepFusion targets this gap: a real-time, GPU-based system producing fully dense, metric-scale keyframe depth maps from a single moving camera, by treating CNN predictions as one more (uncertain) measurement source.

## Key ideas

- **Semi-dense geometry + dense priors**: a semi-dense multi-view stereo algorithm attached to a monocular SLAM pipeline yields accurate depth only at high-gradient pixels; a CNN predicts dense depth (with metric scale) for every pixel. Fusion produces dense maps that respect multi-view geometry where it is available.
- **Depth gradients, not just depth**: in addition to absolute depth, the network predicts depth *gradients*, which constrain local surface shape and let sparse geometric measurements propagate across textureless regions instead of being trusted only pointwise.
- **Probabilistic fusion with learned uncertainties**: the network outputs uncertainty estimates alongside its predictions, and fusion is an optimisation "in a probabilistic fashion, using learned uncertainties produced by the network" — each measurement is weighted by its confidence rather than either source being trusted blindly.
- **Amortised network cost, continuous refinement**: "the network only needs to be run once per keyframe," yet the keyframe depth map is re-optimised "with each new frame so as to constantly make use of new geometric constraints" — cheap inference, continually improving geometry.
- **Complementary failure modes**: photometric multi-view stereo fails in low-texture areas exactly where a learned single-view prior is most informative, mirroring CNN-SLAM's motivation but with a more explicitly probabilistic formulation.

## Results & impact

From the abstract: based on its performance on synthetic and real-world datasets, DeepFusion "is capable of performing at least as well as other comparable systems" while producing real-time dense reconstructions on a GPU. Its influence is less about benchmark wins and more about the formulation: depth, depth gradients, and multi-view stereo all become noisy measurements with uncertainties in a single probabilistic estimation problem — a template that later learned-plus-geometric dense SLAM systems adopted.

## Why it matters for SLAM

DeepFusion sits in the lineage of systems that make monocular dense reconstruction practical by combining classical multi-view geometry with learned single-image cues (CNN-SLAM, DVSO, D3VO). Its emphasis on uncertainty-aware fusion — treating network outputs as noisy measurements with confidences rather than ground truth — became a recurring design principle in later learned-plus-geometric SLAM systems.

## Related

- [CNN-SLAM](cnn-slam.md)
- [LSD-SLAM](lsd-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [CodeSLAM](../level-05-deep-learning/codeslam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
