# Neural Ray Surfaces

> Vasiljevic 2020 · [Paper](https://arxiv.org/abs/2008.06630)

**One-line summary** — Replaces the fixed pinhole projection in self-supervised depth-and-ego-motion learning with a learned per-pixel ray surface, so the same photometric training framework works on fisheye, catadioptric, and other non-pinhole cameras without calibration.

## Problem

Self-supervised learning became a powerful tool for depth and ego-motion estimation, but every method in the family shares one significant hidden limitation: the view-synthesis step assumes a *known parametric camera model* — almost always standard pinhole geometry. The approach therefore fails outright on imaging systems that deviate significantly from that assumption, such as catadioptric cameras or underwater imaging, and even fisheye lenses common on cars and drones are poorly served. Calibrating every unit with a specialized model is a real deployment cost.

## Key ideas

- **Generic camera model, learned**: Inspired by the geometric camera model of Grossberg and Nayar — a camera as an arbitrary set of pixel-wise viewing rays — Neural Ray Surfaces (NRS) are convolutional networks that predict per-pixel projection rays, approximating a wide range of cameras without any parametric form.
- **Fully differentiable, end-to-end**: NRS are fully differentiable and learned end-to-end from unlabeled raw videos, jointly with the depth and ego-motion networks — the camera model becomes just one more learnable component.
- **Calibration-free**: No intrinsics or distortion parameters are required; lens geometry, including severe distortion, is absorbed into the learned ray field.
- **Same self-supervision**: Training remains purely photometric view synthesis; the warp from one frame to another is simply expressed through the learned rays instead of a pinhole projection matrix, so the entire SfM-Learner-style toolbox carries over unchanged.

## Results & impact

The paper demonstrates self-supervised learning of visual odometry and depth estimation from raw videos captured with a wide variety of camera systems — pinhole, fisheye, and catadioptric — using a single framework and no prior knowledge of the camera model. It stands as the reference point for calibration-free self-supervised geometry learning across heterogeneous optics.

## Why it matters for SLAM

Robots increasingly carry cameras that a pinhole model describes poorly (fisheye on drones and cars, catadioptric rigs), and calibrating each unit is a deployment cost. Neural Ray Surfaces showed that the camera model can be treated as one more learnable component, extending the self-supervised depth/ego-motion toolbox to arbitrary optics — a step toward SLAM front-ends that adapt to whatever sensor they are given.

## Related

- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — the classical models this replaces with learning
- [SfM-Learner](sfm-learner.md) — the self-supervised depth+ego-motion framework it generalizes
- [Depth from Videos in the Wild](depth-from-videos-in-the-wild.md) — closely related idea of learning intrinsics from video
- [MonoDepth](monodepth.md) — origin of photometric self-supervision for depth
- [Camera calibration](../level-01-beginner/camera-calibration.md) — the manual process NRS sidesteps

[Back to Level 5](../README.md#level-5-applying-deep-learning)
