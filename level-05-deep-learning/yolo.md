# YOLO (v1→v11)
> Redmon 2016→2024 · [Paper](https://arxiv.org/abs/1506.02640)

**One-line summary** — "You Only Look Once" reframed object detection as a single-shot regression problem solved by one CNN forward pass, establishing the real-time detection family that SLAM systems most commonly use for semantic and dynamic-object reasoning.

## Key ideas
- **Detection as single-pass regression**: instead of region proposals followed by per-region classification (R-CNN family), YOLO v1 divides the image into a grid and directly regresses bounding boxes and class probabilities in one forward pass — trading some accuracy for dramatic speed.
- **Global image context**: because the whole image is processed at once, YOLO makes fewer background false positives than proposal-based detectors of its era.
- **A long evolutionary line (v1→v11)**: successive versions added anchor boxes, better backbones, multi-scale prediction, anchor-free heads, and improved training recipes, keeping the family at or near the speed/accuracy Pareto front for real-time detection.
- **Ultralytics ecosystem**: modern YOLO releases ship as an easy-to-use, actively maintained toolchain (training, export to ONNX/TensorRT, deployment on edge devices), which is a major reason YOLO remains the default detector in robotics.
- Closed-set by design: it detects only the categories it was trained on — the limitation that motivated open-vocabulary detectors like Grounding DINO.

## Why it matters for SLAM
Object detection is the cheapest way to inject semantics into a SLAM pipeline. Real-time detectors in the YOLO family are used to mask out dynamic objects (people, vehicles) so they do not corrupt feature tracking, to provide object-level landmarks for object SLAM (e.g., CubeSLAM builds 3D cuboid landmarks from 2D detections), and to label maps for downstream tasks. When a SLAM system needs "what is in the image" at frame rate on a robot's onboard computer, YOLO is usually the first tool reached for.

## Related
- [DETR](detr.md) — Transformer-based set-prediction alternative to YOLO-style detection.
- [RT-DETR](rt-detr.md) — the first Transformer detector to beat YOLO on both speed and accuracy.
- [Grounding DINO](grounding-dino.md) — open-vocabulary detection beyond YOLO's fixed classes.
- [CubeSLAM](../level-03-monocular-slam/cubeslam.md) — object SLAM built on 2D detections.
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — using detection/segmentation to remove dynamic objects.

[Back to Level 5](../README.md#level-5-applying-deep-learning)
