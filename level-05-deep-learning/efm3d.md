# EFM3D

> Straub (Meta) 2024 · [Paper](https://arxiv.org/abs/2406.10224)

**One-line summary** — A benchmark from Meta Reality Labs for measuring progress toward egocentric 3D foundation models, evaluating 3D perception (object detection and surface/depth understanding) from ego-video captured with Project Aria glasses.

## Key ideas

- **Egocentric is different**: head-mounted capture brings rapid head motion, extreme viewpoint changes, hand/body occlusion, and unusual perspectives — characteristics that third-person benchmarks like KITTI or ScanNet do not test.
- **Project Aria data**: the benchmark builds on large-scale egocentric recordings from Aria glasses (multi-camera rig plus IMU and other sensors) with high-quality 3D ground truth, so models are evaluated in the actual AR-glasses operating regime.
- **3D perception tasks from ego-video**: tasks cover egocentric 3D understanding — 3D object detection and surface/depth estimation — measured over video sequences rather than single frames.
- **Foundation-model framing**: the goal is to measure whether large pretrained "egocentric foundation models" can leverage this data regime, mirroring how 2D vision benchmarks drove 2D foundation models.
- **Domain gap exposed**: state-of-the-art models trained on standard datasets degrade noticeably on egocentric data, motivating egocentric-specific pretraining.

## Why it matters for SLAM

AR glasses are one of the main commercial drivers of SLAM, and EFM3D defines what "good 3D perception" means in that setting: metrically accurate, real-time-capable understanding from a wearable rig whose motion is dictated by a human head. For SLAM practitioners it signals where the field is heading — SLAM-provided poses and geometry becoming training scaffolding for large egocentric perception models, and those models in turn feeding semantic priors back into spatial tracking systems.

## Related

- [Foundation models](foundation-models.md) — the modeling paradigm this benchmark targets
- [Depth Anything](depth-anything.md) — a representative large-scale depth model of the kind evaluated here
- [DETR](detr.md) — the detection architecture family behind modern 3D detectors
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md) — the broader vision of egocentric machine perception

[Back to Level 5](../README.md#level-5-applying-deep-learning)
