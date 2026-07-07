# YOLO (v1→v11)
> Redmon 2016→2024 · [Paper](https://arxiv.org/abs/1506.02640)

**One-line summary** — "You Only Look Once" reframed object detection as a single-shot regression problem solved by one CNN forward pass, establishing the real-time detection family that SLAM systems most commonly use for semantic and dynamic-object reasoning.

## Problem
Before YOLO, object detection "repurposed classifiers to perform detection" (per the abstract): the R-CNN family generated region proposals, ran a CNN classifier on each region, and stitched the results together with post-processing. These multi-stage pipelines were slow — far from camera frame rate — and could not be optimized end-to-end because each stage was trained separately.

Robotics needed something different: detection that runs in one pass, at video rate, with a single trainable objective.

## Key ideas
- **Detection as single-pass regression.** YOLO frames detection "as a regression problem to spatially separated bounding boxes and associated class probabilities": the image is divided into an $S \times S$ grid, and each cell directly regresses $B$ bounding boxes with confidence scores plus $C$ class probabilities — the network output is a single $S \times S \times (5B + C)$ tensor. One network, one forward pass, one evaluation.
- **End-to-end optimization.** Because the whole detection pipeline is a single network, it can be trained directly on detection performance rather than on proxy objectives for separate proposal/classification stages.
- **Global image context.** The network sees the entire image at once (not isolated proposal crops), so it encodes contextual information — the abstract notes YOLO makes more localization errors than state-of-the-art systems of its day "but is far less likely to predict false detections where nothing exists."
- **Generalization.** YOLO "learns very general representations of objects," outperforming DPM and R-CNN by a wide margin when transferring from natural images to artwork (Picasso and People-Art datasets, per the abstract).
- **A long evolutionary line (v1→v11).** Successive versions added, among other things:
  - anchor boxes and multi-scale prediction (improving recall on small and overlapping objects),
  - stronger backbones and training recipes,
  - anchor-free heads in recent generations,

  keeping the family at or near the speed/accuracy Pareto front for real-time detection for nearly a decade.
- **The Ultralytics ecosystem.** Modern YOLO releases ship as an easy-to-use, actively maintained toolchain — training, export to ONNX/TensorRT, deployment on edge devices — which is a major practical reason YOLO remains the default detector in robotics.
- **Closed-set by design**: it detects only the categories it was trained on — the limitation that motivated open-vocabulary detectors like Grounding DINO.

## Results & impact
The original paper reports the base YOLO model processing images at 45 frames per second, with the smaller Fast YOLO reaching 155 FPS "while still achieving double the mAP of other real-time detectors" (abstract). That speed/accuracy point made per-frame detection viable inside live perception stacks for the first time.

The family's continued evolution kept it there: today "run YOLO on it" is the standard first step whenever a robotics pipeline needs object-level semantics. Its dominance also set the benchmark that Transformer-based detectors (DETR → RT-DETR) later had to beat on both axes.

## Why it matters for SLAM
Object detection is the cheapest way to inject semantics into a SLAM pipeline. Real-time detectors in the YOLO family are used to mask out dynamic objects (people, vehicles) so they do not corrupt feature tracking, to provide object-level landmarks for object SLAM (e.g., CubeSLAM builds 3D cuboid landmarks from 2D detections), and to label maps for downstream tasks. When a SLAM system needs "what is in the image" at frame rate on a robot's onboard computer, YOLO is usually the first tool reached for.

## Related
- [DETR](detr.md) — Transformer-based set-prediction alternative to YOLO-style detection.
- [RT-DETR](rt-detr.md) — the first Transformer detector to beat YOLO on both speed and accuracy.
- [Grounding DINO](grounding-dino.md) — open-vocabulary detection beyond YOLO's fixed classes.
- [CubeSLAM](../level-03-monocular-slam/cubeslam.md) — object SLAM built on 2D detections.
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — using detection/segmentation to remove dynamic objects.
- [SAM](sam.md) — promptable segmentation, the pixel-level counterpart to box-level detection.

[Back to Level 5](../README.md#level-5-applying-deep-learning)
