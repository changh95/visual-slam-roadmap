# CodeSLAM

> Bloesch 2018 · [Paper](https://arxiv.org/abs/1804.00874)

**One-line summary** — CodeSLAM (CVPR 2018) represents each keyframe's dense depth map as a small latent code from a conditional autoencoder, making dense geometry compact and jointly optimizable with camera poses.

## Key ideas

- Dense maps capture full surface shape but are too high-dimensional for rigorous probabilistic inference; sparse maps are tractable but only useful for localization. CodeSLAM seeks a representation that is **dense yet compact and optimisable**.
- A conditional variational autoencoder encodes depth, conditioned on the image intensity, into a small code (128 dimensions in the paper); the decoder recovers a full dense depth map from the code plus the image.
- Conditioning on intensity means the code only has to represent what the image itself cannot predict — the network fills in image-correlated detail (e.g., depth discontinuities at edges), while the code captures the remaining geometry.
- Because depth is now a differentiable function of a few parameters, **photometric bundle adjustment can optimize codes and poses jointly** across overlapping keyframes to reach global consistency — dense geometry becomes a first-class optimization variable, like a landmark.
- The zero-mean Gaussian prior on codes regularizes optimization, keeping decoded depth on the learned manifold of plausible scene geometry.

## Why it matters for SLAM

CodeSLAM answered a question that had blocked dense SLAM since DTAM: how to include dense geometry inside joint probabilistic optimization instead of fusing it after the fact. It spawned a direct lineage — SceneCode (semantics), DeepFactors (probabilistic factor-graph version), NodeSLAM (object-level codes), CodeMapping (with sparse SLAM) — and is the conceptual precursor of neural-implicit SLAM (iMAP, NICE-SLAM), where network parameters again serve as a compact optimizable map.

## Related

- [DeepFactors](deepfactors.md)
- [SceneCode](scenecode.md)
- [NodeSLAM](nodeslam.md)
- [CodeMapping](codemapping.md)
- [iMAP](../level-03-monocular-slam/imap.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
