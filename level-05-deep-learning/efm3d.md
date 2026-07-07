# EFM3D

> Straub (Meta) 2024 · [Paper](https://arxiv.org/abs/2406.10224)

**One-line summary** — A benchmark from Meta Reality Labs for measuring progress toward 3D egocentric foundation models, evaluating 3D object detection and surface regression from ego-video captured with Project Aria glasses.

## Problem

Wearable computers create a new source of context for AI: egocentric sensor data that comes equipped with fine-grained 3D location information (poses, calibrated multi-sensor streams). This opens the opportunity for a new class of *spatial* foundation models rooted in 3D space — what the authors term Egocentric Foundation Models (EFMs) — but progress cannot be measured without a benchmark built on high-quality, 3D-annotated egocentric data. Existing benchmarks (KITTI, ScanNet) are third-person and do not reflect the head-mounted regime.

## Key ideas

- **Two core 3D egocentric perception tasks**: EFM3D benchmarks 3D object detection and surface regression — the first benchmark for these tasks on high-quality annotated egocentric data from Project Aria.
- **Egocentric is different**: head-mounted capture brings rapid head motion, extreme viewpoint changes, hand/body occlusion, and unusual perspectives — characteristics that third-person benchmarks do not test.
- **Rich egocentric modalities**: Aria recordings supply multiple cameras plus inertial data and machine-perception outputs (poses, semi-dense points), so methods can exploit far more than a single RGB stream.
- **EVL baseline (Egocentric Voxel Lifting)**: the proposed baseline lifts 2D features into a 3D voxel grid using the available egocentric modalities, deliberately inheriting foundational capabilities from 2D foundation models rather than training 3D perception from scratch.
- **Simulation for scale**: EVL is trained on a large simulated dataset — high-quality synthetic egocentric data standing in for hard-to-annotate real recordings — and evaluated on the real benchmark.

## Results & impact

- EVL outperforms existing methods on the EFM3D benchmark, supporting the paper's thesis that combining 2D foundation-model features with 3D egocentric structure is the right starting point for EFMs.
- The benchmark exposes how much room remains between current 3D perception and what AR glasses need, and gives the field a shared yardstick for "egocentric foundation model" claims.
- It anchors the broader Project Aria research ecosystem, which supplies SLAM poses, calibration, and point clouds as scaffolding for 3D learning.

## Why it matters for SLAM

AR glasses are one of the main commercial drivers of SLAM, and EFM3D defines what "good 3D perception" means in that setting: metrically accurate, real-time-capable understanding from a wearable rig whose motion is dictated by a human head. For SLAM practitioners it signals where the field is heading — SLAM-provided poses and geometry becoming training scaffolding for large egocentric perception models, and those models in turn feeding semantic priors back into spatial tracking systems.

## Related

- [Foundation models](foundation-models.md) — the modeling paradigm this benchmark targets
- [Depth Anything](depth-anything.md) — a representative large-scale depth model of the kind evaluated here
- [DETR](detr.md) — the detection architecture family behind modern 3D detectors
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md) — the broader vision of egocentric machine perception

[Back to Level 5](../README.md#level-5-applying-deep-learning)
