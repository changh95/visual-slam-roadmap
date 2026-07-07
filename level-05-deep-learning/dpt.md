# DPT

> Ranftl 2021 · [Paper](https://arxiv.org/abs/2103.13413)

**One-line summary** — Replaces the CNN backbone with a Vision Transformer for dense prediction (depth, segmentation), exploiting global self-attention at every layer to produce globally coherent depth maps.

## Problem

Fully-convolutional networks dominate dense prediction, but their encoders progressively downsample and have limited receptive fields in early layers. For pixel-level tasks like monocular depth this causes locally inconsistent predictions — wobbly depth around object boundaries and inconsistent global depth ordering — because fine-grained predictions never see the whole scene. DPT asks whether a Vision Transformer backbone, which processes representations at a constant, relatively high resolution with a global receptive field at every stage, produces finer-grained and more globally coherent dense predictions.

## Key ideas

- **Global context at every stage**: the ViT backbone applies global self-attention over all image tokens at every layer, so even the earliest features integrate scene-wide context — the property CNN pyramids fundamentally lack.
- **Constant token resolution**: unlike CNN encoders, the ViT maintains its patch resolution throughout the network, avoiding the loss of spatial detail from repeated downsampling; this is credited for better performance on thin structures and consistent depth ordering.
- **Feature reassembly**: tokens are extracted from four depths of the ViT and reassembled into image-like spatial feature maps at resolutions $\{H/32, H/16, H/8, H/4\}$ via read, concatenate, and project operations.
- **Convolutional fusion decoder**: progressive upsampling with residual convolutions combines the multi-scale ViT features into a full-resolution prediction — a hybrid of Transformer encoding and CNN decoding.
- **Scales with data**: the architecture yields its largest gains when a large amount of training data is available, foreshadowing the data-scaling recipe of later depth foundation models.

## Results & impact

- For monocular depth estimation, up to a 28% relative improvement over the state-of-the-art fully-convolutional network (the CNN-based MiDaS), with visibly more coherent depth maps.
- Set a new state of the art on ADE20K semantic segmentation with 49.02% mIoU, and after fine-tuning on smaller datasets (NYUv2, KITTI, Pascal Context) set new states of the art there too.
- DPT-Large became the backbone of MiDaS v3.0 and Depth Anything v1, establishing ViT encoders as the standard for monocular depth and other dense tasks.

## Why it matters for SLAM

DPT made ViT encoders the default for monocular depth: DPT-Large became the backbone of MiDaS v3 and Depth Anything v1, which are the depth priors most commonly injected into monocular and dense SLAM systems. When a SLAM pipeline consumes a "relative depth network" today, it is very likely a DPT-style architecture underneath. Its globally consistent depth is exactly what dense mapping needs — locally wobbly depth maps break TSDF or surfel fusion.

## Related

- [MiDaS](midas.md) — the robust relative-depth training recipe DPT plugs into
- [MonoDepth](monodepth.md) — earlier self-supervised monocular depth lineage
- [ZoeDepth](zoedepth.md) — adds metric scale on top of relative-depth pre-training
- [Depth Anything](depth-anything.md) — foundation-scale depth model built on the DPT architecture
- [Metric3D](metric3d.md) — metric-depth line that also builds on ViT dense prediction

[Back to Level 5](../README.md#level-5-applying-deep-learning)
