# CodeMapping

> Matsuki 2021 · [Paper](https://arxiv.org/abs/2107.08994)

**One-line summary** — CodeMapping (RA-L 2021) bolts a CodeSLAM-style learned dense mapper onto a reliable sparse SLAM system, predicting an uncertainty-aware dense depth map for every keyframe from the sparse system's outputs.

## Problem

State-of-the-art sparse visual SLAM systems provide accurate, reliable camera trajectories and landmark positions, but their sparse maps "cannot be used for other tasks such as obstacle avoidance or scene understanding". Fully learned dense SLAM, on the other hand, is fragile: when the network fails, tracking fails with it. CodeMapping asks how to add dense, uncertainty-aware mapping to an arbitrary metric sparse SLAM system without touching — or delaying — its battle-tested tracking core.

## Key ideas

- **Dense mapping as a complement, not a replacement.** The framework takes as input the camera poses, keyframes, and sparse points produced by the SLAM system, and predicts a dense depth image for every keyframe — classical tracking, learned mapping.
- **VAE conditioned on sparse SLAM outputs.** Building on CodeSLAM, a variational autoencoder predicts an uncertainty-aware dense depth map conditioned on the keyframe's intensity image, its **sparse depth** image (rendered from SLAM landmarks), and its **reprojection error** image — the sparse geometry strongly anchors the learned depth and the error image signals where to trust it.
- **Compact codes enable multi-view refinement.** Depth remains a low-dimensional latent code, so dense depth can be refined by multi-view optimization that improves consistency between overlapping keyframes — schematically, the code fit takes the form

  $$\mathbf{z}^* = \arg\min_{\mathbf{z}} \big\| D_{\text{sparse}} - g_\theta(\mathbf{z}, I)\big|_{\text{sparse}} \big\|^2 + \lambda \|\mathbf{z}\|^2 .$$

- **Loosely coupled by design.** The mapper runs in a separate thread, in parallel with the SLAM system; this flexible design allows integration with arbitrary metric sparse SLAM systems "without delaying the main SLAM process".
- **From local depth to global maps.** The per-keyframe dense depths can be fused via TSDF into a globally consistent dense 3D reconstruction, not just used for local mapping.

## Results & impact

- Demonstrated running with ORB-SLAM3, showing accurate dense depth estimation suitable for robotics and augmented reality applications (abstract).
- Conditioning on sparse depth anchors the learned dense depth far better than single-image prediction, and the decoupled architecture avoids the catastrophic failure modes of tightly coupled learned dense SLAM.
- The pattern it crystallized — robust sparse tracking plus a parallel learned dense mapper — became a production-shaped template, reappearing in systems like TANDEM and later monocular dense mapping work.

## Why it matters for SLAM

CodeMapping is a clean example of the pragmatic "hybrid" design that dominates deployable systems: keep the battle-tested sparse front-end, add learning only where classical methods are weak (dense geometry). It carried the CodeSLAM/DeepFactors latent-code lineage into a production-shaped architecture, and its author (Matsuki) later carried the dense-mapping-alongside-tracking philosophy into Gaussian-splatting SLAM (MonoGS).

## Related

- [CodeSLAM](codeslam.md)
- [DeepFactors](deepfactors.md)
- [TANDEM](tandem.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
- [MonoGS](../level-03-monocular-slam/monogs.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
