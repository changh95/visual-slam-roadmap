# Masked Depth Modeling (LingBot-Depth)

> Tan 2026 · [Paper](https://arxiv.org/abs/2601.17895)

**One-line summary** — Applies masked-modeling-style training to depth so that RGB context fills in the regions where active RGB-D sensors systematically fail — glass, mirrors, and shiny metal.

## Key ideas

- **The RGB-D failure mode**: Consumer depth sensors (structured light, time-of-flight, active stereo) return holes or corrupted values on transparent, reflective, and dark absorptive surfaces, because the projected light passes through, bounces away, or is absorbed. These artifacts silently poison downstream reconstruction and tracking.
- **Masked depth modeling**: In the spirit of masked autoencoders, depth regions are masked during training and the model learns to reconstruct them from the RGB image and the surrounding valid depth — teaching it to inpaint exactly the kind of dropout real sensors produce.
- **RGB as the rescue signal**: Where the depth channel is blind (a glass door, a mirror), appearance context still carries the geometric cues needed to produce a plausible, complete depth map.
- **Output**: Completed, artifact-corrected depth maps that downstream RGB-D pipelines can consume as if they came from a better sensor.

## Why it matters for SLAM

RGB-D SLAM systems (KinectFusion-style fusion, RGB-D odometry) implicitly trust the sensor; glass walls and mirrors are among their most common real-world failure cases, especially indoors where such surfaces are everywhere. A depth-completion model trained to fix these failures acts as a drop-in sensor front-end, extending where RGB-D SLAM can operate without changing the SLAM algorithm itself.

## Related

- [Depth from sensor](../level-04-rgbd-slam/depth-from-sensor.md) — how depth sensors work and where they fail
- [Depth Anything V2](depth-anything-v2.md) — monocular depth foundation model, also strong on reflective surfaces
- [Marigold](marigold.md) — generative depth estimation with fine detail
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md) — classic pipeline that consumes the corrected depth

[Back to Level 5](../README.md#level-5-applying-deep-learning)
