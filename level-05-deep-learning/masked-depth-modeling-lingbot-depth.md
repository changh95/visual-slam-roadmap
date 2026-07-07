# Masked Depth Modeling (LingBot-Depth)

> Tan 2026 · [Paper](https://arxiv.org/abs/2601.17895)

**One-line summary** — Depth-completion model that treats RGB-D sensor failures as "masked" signals to be reconstructed from visual context, fixing the holes and corruption that glass, mirrors, and shiny metal cause in real depth maps.

## Problem

Capturing pixel-aligned metric depth with RGB-D cameras is the most viable route to spatial perception for physical-world applications like autonomous driving and robotic manipulation — but real sensors face hardware limitations and challenging imaging conditions, especially on specular or texture-less surfaces. Projected light passes through glass, bounces off mirrors and polished metal, or finds no texture to match, leaving holes and corrupted values that silently poison downstream reconstruction and tracking.

## Key ideas

- **Sensor failures as masked signals**: The core reframing — inaccuracies from depth sensors can be viewed as "masked" signals that inherently reflect underlying geometric ambiguities. Depth completion then becomes a masked-modeling problem, in the spirit of masked autoencoders: reconstruct the missing depth from what remains.
- **Visual context as the rescue signal**: LingBot-Depth leverages the RGB image to refine and complete depth maps — where the depth channel is blind (a glass door, a mirror), appearance context still carries the geometric cues needed to produce a plausible, complete depth map.
- **Automated data curation**: An automated data-curation pipeline makes training scalable, avoiding the manual collection bottleneck that limits depth-completion datasets.
- **Aligned RGB-depth latent space**: Experiments on downstream tasks suggest the model learns a latent representation aligned across the RGB and depth modalities — useful beyond completion itself.
- **Open release**: The authors release code, checkpoint, and 3M RGB-depth pairs (2M real and 1M simulated) to the spatial-perception community.

## Results & impact

The model outperforms top-tier RGB-D cameras in terms of both depth precision and pixel coverage — i.e., the completed output is a better depth map than the raw sensor produces — and improves a range of downstream spatial-perception tasks. As a very recent paper its long-term influence is still unfolding; treat it as representative of the "learned sensor front-end" direction for RGB-D perception.

## Why it matters for SLAM

RGB-D SLAM systems (KinectFusion-style fusion, RGB-D odometry) implicitly trust the sensor; glass walls and mirrors are among their most common real-world failure cases, especially indoors where such surfaces are everywhere. A depth-completion model trained to fix these failures acts as a drop-in sensor front-end, extending where RGB-D SLAM can operate without changing the SLAM algorithm itself.

## Related

- [Depth from sensor](../level-04-rgbd-slam/depth-from-sensor.md) — how depth sensors work and where they fail
- [Depth Anything V2](depth-anything-v2.md) — monocular depth foundation model, also strong on reflective surfaces
- [Marigold](marigold.md) — generative depth estimation with fine detail
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md) — classic pipeline that consumes the corrected depth

[Back to Level 5](../README.md#level-5-applying-deep-learning)
