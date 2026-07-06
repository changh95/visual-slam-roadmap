# DPT

> Ranftl 2021 · [Paper](https://arxiv.org/abs/2103.13413)

**One-line summary** — Replaces the CNN backbone with a Vision Transformer for dense prediction (depth, segmentation), exploiting global self-attention at every layer to produce globally coherent depth maps.

## Key ideas

- **Global context at every stage**: CNN encoders have limited receptive fields in early layers, causing locally inconsistent dense predictions. A ViT processes all image tokens with global self-attention at every layer, so even fine-grained predictions see the whole scene.
- **Feature reassembly**: tokens are extracted from four depths of the ViT and reassembled into spatial feature maps at resolutions $\{H/32, H/16, H/8, H/4\}$ via read, concatenate, and project operations.
- **Convolutional fusion decoder**: progressive upsampling with residual convolutions fuses the multi-scale ViT features into a full-resolution prediction.
- **Constant token resolution**: unlike CNN pyramids, the ViT maintains its patch resolution throughout, which is credited for better performance on thin structures and consistent depth ordering.
- Large improvements over the CNN-based MiDaS on standard depth benchmarks (NYU Depth v2, KITTI) as well as on semantic segmentation.

## Why it matters for SLAM

DPT made ViT encoders the default for monocular depth: DPT-Large became the backbone of MiDaS v3 and Depth Anything v1, which are the depth priors most commonly injected into monocular and dense SLAM systems. When a SLAM pipeline consumes a "relative depth network" today, it is very likely a DPT-style architecture underneath. Its globally consistent depth is exactly what dense mapping needs — locally wobbly depth maps break TSDF or surfel fusion.

## Related

- [MiDaS](midas.md) — the robust relative-depth training recipe DPT plugs into
- [MonoDepth](monodepth.md) — earlier self-supervised monocular depth lineage
- [ZoeDepth](zoedepth.md) — adds metric scale on top of relative-depth pre-training
- [Depth Anything](depth-anything.md) — foundation-scale depth model built on the DPT architecture

[Back to Level 5](../README.md#level-5-applying-deep-learning)
