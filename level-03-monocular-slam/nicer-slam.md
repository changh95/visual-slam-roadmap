# NICER-SLAM

> Zhu 2024 · [Paper](https://arxiv.org/abs/2302.03594)

**One-line summary** — An RGB-only neural implicit SLAM system that jointly optimises poses and a hierarchical neural map, using monocular depth priors and optical flow as geometric supervision instead of a depth sensor.

## Problem

Dense neural implicit SLAM systems "either rely on RGB-D sensors, or require a separate monocular SLAM approach for camera tracking, and do not produce high-fidelity dense 3D scene reconstruction" (abstract). Depth sensors have limited range, fail outdoors, and add cost and weight; bolting a separate tracker in front of a neural map gives up the elegance and accuracy of joint optimisation. NICER-SLAM asks whether one system can simultaneously optimise camera poses and a neural map — with novel-view synthesis quality — from plain RGB.

## Key ideas

- **RGB-only joint optimisation**: camera poses and a hierarchical neural implicit map are optimised simultaneously from colour images alone — no depth sensor and no external tracking system.
- **Monocular depth integration**: a pre-trained monocular depth network provides dense per-frame geometric cues, used as "easy-to-obtain" soft supervision (abstract) rather than trusted metric measurements — the map reconciles them across views.
- **Optical flow + warping loss**: dense flow between frames adds multi-view constraints, and "a simple warping loss" further enforces geometric consistency (abstract): pixels warped through the rendered geometry into a neighbouring view must photometrically agree.
- **Hierarchical neural implicit map with SDF**: NICE-SLAM-style multi-level feature grids are decoded into signed distance and colour by small MLPs, giving well-defined surfaces and high-quality novel-view synthesis.
- **Locally adaptive SDF-to-density transformation**: the conversion used in volume rendering has spatially varying sharpness, letting the representation model both crisp surfaces and harder, fuzzier regions in complicated indoor scenes (abstract).

## Results & impact

On both synthetic and real-world datasets NICER-SLAM demonstrates "strong performance in dense mapping, tracking, and novel view synthesis, even competitive with recent RGB-D SLAM systems" (abstract) — the headline result being that removing the depth sensor no longer means giving up dense neural SLAM: reconstruction quality in RGB-only mode approaches that of depth-supervised systems such as NICE-SLAM. Its recipe — monocular depth priors, flow consistency, adaptive SDF rendering — reappears throughout later RGB-only neural and Gaussian SLAM work.

## Why it matters for SLAM

NICER-SLAM showed that neural implicit SLAM does not fundamentally depend on depth sensors: priors from monocular depth networks plus flow consistency can substitute for direct depth supervision. This broadened the applicability of dense neural SLAM to plain monocular cameras and influenced subsequent RGB-only neural and Gaussian SLAM systems such as MonoGS.

## Related

- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [MonoGS](monogs.md)
- [DPT](../level-05-deep-learning/dpt.md)
- [MiDaS](../level-05-deep-learning/midas.md)
- [RAFT](../level-05-deep-learning/raft.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
