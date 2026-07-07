# Metric3D

> Yin 2023 · [Paper](https://arxiv.org/abs/2307.10984)

**One-line summary** — Zero-shot *metric* monocular depth across hundreds of different cameras, achieved by transforming every image into a canonical camera space that removes the focal-length ambiguity before the network sees it.

## Problem

Single-image metric depth is trapped between two failure modes. State-of-the-art metric models can only handle a single camera model and cannot train on mixed data because of metric ambiguity: the same pixel pattern corresponds to different metric depths under different focal lengths, so a model trained on one camera fails on another. Models trained on large mixed datasets (MiDaS-style) achieve zero-shot generalization only by retreating to affine-invariant depth, which cannot recover real-world metric scale. Metric3D shows that the key to a zero-shot metric model is combining large-scale mixed-data training with an explicit resolution of the camera-model ambiguity.

## Key ideas

- **Canonical Camera Space Transformation (CCST)**: Before inference, the image is rescaled so its effective focal length matches a canonical value $f_c$ (scaling by $f_c/f$); the network therefore always sees a consistent pixel-to-ray mapping regardless of the source camera.
- **De-canonicalization**: The predicted canonical depth is converted back to the true camera:
  $$d_{\text{metric}} = d_{\text{canonical}} \cdot \frac{f}{f_c}$$
  Only the known focal length is needed at test time — no per-camera fine-tuning.
- **Plug-in module**: CCST explicitly addresses the metric ambiguity and can be effortlessly plugged into existing monocular depth models, rather than requiring a bespoke architecture.
- **Massive multi-camera training**: With CCST making datasets compatible, monocular models can be stably trained on over 8 million images spanning thousands of camera models, yielding zero-shot generalization to in-the-wild images with unseen camera settings.
- **Joint depth + normals**: A DPT-style ViT backbone predicts depth and surface normals with geometric consistency constraints, giving richer geometry than depth alone.

## Results & impact

Metric3D achieved state-of-the-art performance on 7 zero-shot benchmarks and won the championship in the 2nd Monocular Depth Estimation Challenge, generalizing zero-shot to in-the-wild images with unseen camera settings. It enables accurate metric 3D structure recovery on randomly collected internet images (single-image metrology), and the paper demonstrates that plugging the model into monocular SLAM relieves scale drift, producing high-quality metric-scale dense mapping. The canonical-camera recipe was adopted by UniDepth, Depth Pro, and other successors, and Metric3D v2 extended it with a larger backbone and more data.

## Why it matters for SLAM

SLAM needs *metric* depth — relative depth cannot anchor scale for monocular systems or feed metric map fusion. Metric3D's canonical-camera normalization became the standard recipe for camera-agnostic metric depth (adopted by UniDepth, Depth Pro, and others) and enables plug-and-play depth priors for whatever camera your robot happens to carry, without per-camera fine-tuning. It is a natural companion for monocular SLAM systems that fuse learned depth to resolve scale ambiguity.

## Related

- [MiDaS](midas.md) — relative-depth baseline that ignores scale
- [ZoeDepth](zoedepth.md) — the metric-bins alternative route to metric depth
- [Depth Anything V2](depth-anything-v2.md) — data-scaling successor in the depth foundation-model line
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md) — the intrinsics that create the ambiguity

[Back to Level 5](../README.md#level-5-applying-deep-learning)
