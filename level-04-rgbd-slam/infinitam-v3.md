# InfiniTAM v3

> Prisacariu 2017 · [Paper](https://arxiv.org/abs/1708.00783)

**One-line summary** — A modular, cross-platform open-source RGB-D reconstruction framework combining voxel-hashed TSDF (or surfel) mapping, ICP/RGB tracking, random-fern relocalization, and loop closure.

## Problem

Representing a reconstruction volumetrically as a TSDF gives most of the simplicity and efficiency that GPU implementations of KinectFusion-style systems enjoy — but the representation is memory-intensive and limits applicability to small-scale reconstructions. Several remedies had been explored (rolling volumes, voxel hashing, submaps), yet the community lacked a single fast, flexible pipeline in which components like camera tracking, scene representation, and data integration could be swapped and adapted. InfiniTAM was proposed as that unifying framework, and v3 is the technical report describing its third iteration.

## Key ideas

- **Voxel hashing for unbounded scenes**: instead of a fixed grid, TSDF voxel blocks are stored in a hash table and allocated only near observed surfaces, giving bounded memory for arbitrarily large scenes:
  $$h(\mathbf{b}) = \left(\mathbf{b}_x p_1 \oplus \mathbf{b}_y p_2 \oplus \mathbf{b}_z p_3\right) \bmod n$$
  where $\mathbf{b}$ is the block index and $p_1, p_2, p_3$ are large primes.
- **Pluggable map representations**: interchangeable backends — hashed-TSDF volumetric reconstruction, a surfel-based backend (an implementation of Keller et al.'s approach), and sparse point clouds — behind a common integration/ray-cast interface, so tracking code is representation-agnostic.
- **Robust camera tracking**: a new robust tracking module (one of v3's headline features) aligns each depth image to a ray-cast prediction of the model with coarse-to-fine point-to-plane ICP, optionally combined with RGB alignment; low-level code improvements significantly improved tracking performance over earlier versions.
- **Keyframe relocalization with random ferns**: an implementation of Glocker et al.'s fern-based relocalizer recovers the pose after tracking loss and proposes loop-closure candidates from frame appearance.
- **Globally consistent TSDF reconstruction via rigid submaps**: the scene is divided into rigid submaps whose relative poses are optimized — a novel approach in v3 to bring loop-closure consistency to TSDF maps; pose corrections can trigger de-integration and re-integration of affected voxel blocks.
- **Cross-platform engineering**: runs on CPU, CUDA, and OpenCL — including mobile devices — with clean modular C++ that made it a favorite research baseline and teaching codebase.

## Results & impact

Evaluated on TUM RGB-D, ICL-NUIM, and large indoor sequences, InfiniTAM v3's tracking accuracy is on par with ElasticFusion, and voxel hashing enables apartment-scale reconstruction; CPU-only mode runs at 5-10 Hz while GPU mode exceeds 30 Hz, with demonstrations on ARM-based mobile devices. It became one of the most widely used open-source RGB-D reconstruction frameworks for research, and the voxel-hashing storage scheme it packaged (originating with Niessner et al. 2013) became the standard approach for scalable TSDF maps, adopted by BundleFusion and many later systems.

## Why it matters for SLAM

InfiniTAM v3 packaged the post-KinectFusion state of the art — voxel hashing, frame-to-model tracking, relocalization, loop closure — into one hackable framework, and became one of the most widely used open-source RGB-D reconstruction codebases. If you want to understand how a production-quality dense SLAM pipeline is engineered (memory management, GPU kernels, swappable map backends), reading InfiniTAM's code is one of the best exercises at this level.

## Related

- [KinectFusion](kinectfusion.md)
- [BundleFusion](bundlefusion.md)
- [ElasticFusion](elasticfusion.md)
- [Kintinuous](kintinuous.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
