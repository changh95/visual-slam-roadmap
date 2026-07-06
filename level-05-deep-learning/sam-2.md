# SAM 2

> Meta 2024 · [Paper](https://arxiv.org/abs/2408.00714)

**One-line summary** — Extends Segment Anything to video with a streaming memory-attention mechanism that tracks and segments objects consistently across frames, while also being faster and better than SAM on still images.

## Key ideas

- **Unified image + video segmentation**: One promptable model; an image is just a one-frame video. A Hiera hierarchical ViT encodes each frame in a streaming fashion.
- **Memory attention**: The current frame's features cross-attend to a memory bank of past frame features and predicted masks, $\mathbf{f}_t' = \text{CrossAttn}(\mathbf{f}_t, [\mathbf{m}_{t-1}, \ldots, \mathbf{m}_{t-K}])$, maintaining object identity through occlusion and appearance change.
- **Promptable tracking**: A click/box/mask prompt on *any* frame propagates the segmentation forward and backward through the video; corrections are additional prompts, not re-initialization.
- **SA-V dataset**: Large-scale video mask annotations ("masklets") collected with a model-in-the-loop data engine, far exceeding prior video segmentation datasets.
- Roughly 6x faster than running SAM per frame, with better accuracy and far fewer user interactions than prior video object segmentation methods.

## Why it matters for SLAM

Frame-by-frame masks are not enough for SLAM — the system must know it is seeing the *same* object over time to build semantic maps and handle dynamic scenes. SAM 2's streaming design matches the sequential nature of SLAM pipelines: temporally consistent masks enable dynamic-object removal, object-level mapping, and persistent instance identity for data association. Spatio-temporal semantic mapping systems (e.g., Khronos-style) are natural consumers of this capability.

## Related

- [SAM](sam.md) — the image-only predecessor
- [Grounding DINO](grounding-dino.md) — text prompts for what to track
- [Khronos](khronos.md) — spatio-temporal metric-semantic mapping
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — dynamic-object masking in classical SLAM

[Back to Level 5](../README.md#level-5-applying-deep-learning)
