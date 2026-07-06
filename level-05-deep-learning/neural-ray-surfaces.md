# Neural Ray Surfaces

> Vasiljevic 2020 · [Paper](https://arxiv.org/abs/2008.06630)

**One-line summary** — Replaces the fixed pinhole projection in self-supervised depth-and-ego-motion learning with a learned per-pixel ray surface, so the same photometric training framework works on fisheye, catadioptric, and other non-pinhole cameras without calibration.

## Key ideas

- **The hidden assumption**: Self-supervised depth methods (SfM-Learner and descendants) synthesize one view from another via projection, which hard-codes a known camera model — almost always pinhole. This breaks on wide-angle, fisheye, and catadioptric optics common in robotics.
- **Learned generic camera**: Instead of an analytic projection function, a network predicts a *ray surface* — per-pixel viewing rays — jointly with depth and ego-motion, so the camera model itself is learned from raw video.
- **Calibration-free**: No intrinsics or distortion parameters are required; lens distortion is absorbed into the learned ray field.
- **Same self-supervision**: Training remains purely photometric view synthesis, now expressed through the learned rays rather than a pinhole matrix.

## Why it matters for SLAM

Robots increasingly carry cameras that a pinhole model describes poorly (fisheye on drones and cars, catadioptric rigs), and calibrating each unit is a deployment cost. Neural Ray Surfaces showed that the camera model can be treated as one more learnable component, extending the self-supervised depth/ego-motion toolbox to arbitrary optics — a step toward SLAM front-ends that adapt to whatever sensor they are given.

## Related

- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — the classical models this replaces with learning
- [SfM-Learner](sfm-learner.md) — the self-supervised depth+ego-motion framework it generalizes
- [Depth from Videos in the Wild](depth-from-videos-in-the-wild.md) — closely related idea of learning intrinsics from video
- [MonoDepth](monodepth.md) — origin of photometric self-supervision for depth

[Back to Level 5](../README.md#level-5-applying-deep-learning)
