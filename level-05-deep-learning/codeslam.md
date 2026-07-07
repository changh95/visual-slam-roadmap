# CodeSLAM

> Bloesch 2018 · [Paper](https://arxiv.org/abs/1804.00874)

**One-line summary** — CodeSLAM (CVPR 2018) represents each keyframe's dense depth map as a small latent code from a conditional autoencoder, making dense geometry compact and jointly optimizable with camera poses.

## Problem

The representation of geometry in real-time 3D perception was (and is) a critical open issue. Dense maps capture complete surface shape and can carry semantic labels, but their high dimensionality makes them computationally costly to store and process — and unsuitable for rigorous probabilistic inference. Sparse feature-based representations avoid these problems but capture only partial scene information and are mainly useful for localisation. CodeSLAM seeks a representation that is **dense yet compact and optimisable**: full surface geometry expressed in few enough parameters to sit inside joint probabilistic optimization.

## Key ideas

- **Depth as a conditional latent code.** A conditional variational autoencoder encodes a keyframe's depth map — conditioned on its intensity image — into a small code (128 dimensions in the paper); the decoder recovers a full dense depth map from code plus image: $D = g_\theta(\mathbf{z}, I)$.
- **Conditioning splits the work.** Because the decoder sees the image, the code "only represents aspects of the local geometry which cannot directly be predicted from the image": image-correlated structure (depth edges at intensity edges, smooth surfaces) comes for free, while the code captures the residual geometry.
- **Dense geometry becomes an optimization variable.** Since depth is now a differentiable function of a few parameters, photometric bundle adjustment can jointly optimize codes and poses across overlapping keyframes,

  $$\min_{\{\xi_i\}, \{\mathbf{z}_i\}} \sum_{(i,j)} \big\| I_i - I_j\big(w(\xi_i, \xi_j, D_{\mathbf{z}_i})\big) \big\|_\delta,$$

  reaching global consistency the way sparse SLAM does with landmarks — but for dense surfaces.
- **A learned prior regularizes geometry.** The zero-mean Gaussian prior on codes ($\mathbf{z} \sim \mathcal{N}(0, I)$) keeps decoded depth on the learned manifold of plausible scene geometry; optimization searches over *plausible* dense reconstructions, not arbitrary per-pixel fields.
- **Real-time capable.** Gauss–Newton over a 128-dimensional code space (plus poses) is cheap, keeping dense-geometry optimisation within the budget of a real-time keyframe-based system.

## Results & impact

- Demonstrated the representation's "advantageous properties" in a keyframe-based monocular dense SLAM setting: compact storage, joint code-and-pose optimization, and dense reconstructions from monocular input (abstract).
- Received major recognition at CVPR 2018 (best paper honourable mention) and immediately spawned a lineage: SceneCode (joint depth+semantic codes), DeepFactors (probabilistic factor-graph version), NodeSLAM (object-level codes), CodeMapping (dense mapper for sparse SLAM).
- Conceptually anticipated neural-implicit SLAM (iMAP, NICE-SLAM), where network parameters again serve as a compact, optimizable stand-in for dense geometry.

## Why it matters for SLAM

CodeSLAM answered a question that had blocked dense SLAM since DTAM: how to include dense geometry inside joint probabilistic optimization instead of fusing it after the fact. Its core lesson — put a learned low-dimensional parameterization between the optimizer and the dense map — is one of the most influential ideas in learned SLAM, connecting classical BA machinery to deep generative priors.

## Related

- [DeepFactors](deepfactors.md)
- [SceneCode](scenecode.md)
- [NodeSLAM](nodeslam.md)
- [CodeMapping](codemapping.md)
- [iMAP](../level-03-monocular-slam/imap.md)
- [DTAM](../level-03-monocular-slam/dtam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
