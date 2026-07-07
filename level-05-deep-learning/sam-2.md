# SAM 2

> Meta 2024 · [Paper](https://arxiv.org/abs/2408.00714)

**One-line summary** — Extends Segment Anything to video with a streaming memory-attention mechanism that tracks and segments objects consistently across frames, while also being faster and better than SAM on still images.

## Problem

SAM segments each image independently, so running it on video loses object identity across frames — yet robotics, AR, and video editing all need *the same object* segmented consistently over time, through occlusion, deformation, and appearance change.

Dedicated video object segmentation methods existed but were not promptable in SAM's flexible sense, and video mask annotations were scarce compared to image masks. SAM 2 poses promptable visual segmentation as one task spanning images and videos, and builds the model *and* the dataset to solve it.

## Key ideas

- **Unified image + video segmentation**: One promptable model; an image is just a one-frame video. A Hiera hierarchical ViT encodes frames in a streaming fashion, so the system processes arbitrarily long video in real time frame by frame.
- **Streaming memory attention**: The current frame's features cross-attend to a memory bank of past frame features and predicted masks, $\mathbf{f}_t' = \text{CrossAttn}(\mathbf{f}_t, [\mathbf{m}_{t-1}, \ldots, \mathbf{m}_{t-K}])$, maintaining object identity through occlusion and appearance change without re-running on past frames.
- **Promptable tracking with cheap corrections**: A click/box/mask prompt on *any* frame propagates the segmentation forward and backward through the video; when the model drifts, a single corrective click on a later frame refines the whole masklet — corrections are additional prompts, not re-initialization.
- **Model-in-the-loop data engine**: A user-interaction loop where the model improves the data and the data improves the model produced SA-V, the largest video segmentation dataset to date — tens of thousands of videos with hundreds of thousands of spatio-temporal "masklet" annotations, far exceeding prior video segmentation datasets.
- **Simple transformer architecture**: The design deliberately stays close to SAM — prompt encoder, mask decoder — with memory as the only fundamentally new component, which is why it also improves on SAM for still images.

## Results & impact

- Video segmentation: better accuracy than prior approaches while using 3x fewer user interactions.
- Image segmentation: more accurate and 6x faster than the original SAM.
- Strong performance across a wide range of tasks; the model, the SA-V dataset, training code, and demo were all released, making it the default promptable video segmenter.
- For perception pipelines, it turned "masks per frame" into "object tracks with masks" — the representation object-level mapping systems actually need.

## Why it matters for SLAM

Frame-by-frame masks are not enough for SLAM — the system must know it is seeing the *same* object over time to build semantic maps and handle dynamic scenes. SAM 2's streaming design matches the sequential nature of SLAM pipelines: temporally consistent masks enable dynamic-object removal, object-level mapping, and persistent instance identity for data association. Spatio-temporal semantic mapping systems (e.g., Khronos-style) are natural consumers of this capability.

## Related

- [SAM](sam.md) — the image-only predecessor
- [Grounding DINO](grounding-dino.md) — text prompts for what to track
- [Khronos](khronos.md) — spatio-temporal metric-semantic mapping
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — dynamic-object masking in classical SLAM

[Back to Level 5](../README.md#level-5-applying-deep-learning)
