# Metric3D

> Yin 2023 · [Paper](https://arxiv.org/abs/2307.10984)

**One-line summary** — Zero-shot *metric* monocular depth across hundreds of different cameras, achieved by transforming every image into a canonical camera space that removes the focal-length ambiguity before the network sees it.

## Key ideas

- **The intrinsics problem**: The same pixel pattern corresponds to different metric depths under different focal lengths, so a metric-depth model trained on one camera fails on another. Relative-depth models (MiDaS) dodge this by giving up scale entirely.
- **Canonical Camera Space Transformation (CCST)**: Before inference, the image is rescaled so its effective focal length matches a canonical value $f_c$; the network therefore always sees a consistent pixel-to-ray mapping.
- **De-canonicalization**: The predicted canonical depth is converted back to the true camera: $d_{\text{metric}} = d_{\text{canonical}} \cdot \frac{f}{f_c}$.
- **Massive multi-camera training**: Trained on millions of images spanning many datasets and hundreds of camera models, made compatible by CCST.
- **Joint depth + normals**: A DPT-style ViT backbone predicts depth and surface normals with geometric consistency constraints, giving richer geometry than depth alone.

## Why it matters for SLAM

SLAM needs *metric* depth — relative depth cannot anchor scale for monocular systems or feed metric map fusion. Metric3D's canonical-camera normalization became the standard recipe for camera-agnostic metric depth (adopted by UniDepth, Depth Pro, and others) and enables plug-and-play depth priors for whatever camera your robot happens to carry, without per-camera fine-tuning. It is a natural companion for monocular SLAM systems that fuse learned depth to resolve scale ambiguity.

## Related

- [MiDaS](midas.md) — relative-depth baseline that ignores scale
- [ZoeDepth](zoedepth.md) — the metric-bins alternative route to metric depth
- [Depth Anything V2](depth-anything-v2.md) — data-scaling successor in the depth foundation-model line
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md) — the intrinsics that create the ambiguity

[Back to Level 5](../README.md#level-5-applying-deep-learning)
