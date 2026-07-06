# Open-YOLO 3D

> Boudjoghra 2024 · [Paper](https://arxiv.org/abs/2406.02548)

**One-line summary** — Fast open-vocabulary 3D instance segmentation that replaces the slow SAM + CLIP labeling pipeline with a real-time open-vocabulary 2D object detector, reaching roughly 16x speedups over prior methods.

## Key ideas

- **The bottleneck**: Prior open-vocabulary 3D instance segmentation (OpenMask3D-style) projects each 3D mask into multiple images, runs SAM on crops and CLIP for classification — minutes per scene, far from robot-usable.
- **Class-agnostic 3D proposals**: A 3D instance segmentation network produces class-agnostic instance masks from the point cloud; the open-vocabulary problem reduces to *labeling* these masks.
- **2D boxes instead of masks + CLIP**: A fast open-vocabulary 2D detector (YOLO-World-style) processes the frames once, producing text-prompted bounding boxes that are far cheaper than per-crop SAM + CLIP encoding.
- **Multi-view label transfer**: Each 3D mask is projected into the 2D views, matched against detections, and its final label is aggregated across views — resolving occlusion and viewpoint ambiguity by consensus.
- Delivers competitive accuracy at a fraction of the inference time, turning per-scene processing from minutes to seconds.

## Why it matters for SLAM

Open-vocabulary semantics is what lets a robot answer language queries about its map ("where is the fire extinguisher?"), but it only helps online robotics if it runs at interactive rates. Open-YOLO 3D demonstrated that lightweight 2D detectors can replace heavyweight foundation-model pipelines for labeling 3D instances, making open-vocabulary semantic mapping practical to attach to a live SLAM system rather than an offline post-process.

## Related

- [YOLO](yolo.md) — the real-time detection lineage it leverages
- [Grounding DINO](grounding-dino.md) — text-prompted open-vocabulary 2D detection
- [SAM](sam.md) — the segmentation foundation model it avoids at inference time
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs that benefit from fast labeling
- [OpenScene](../level-03-monocular-slam/openscene.md) — point-level open-vocabulary 3D understanding

[Back to Level 5](../README.md#level-5-applying-deep-learning)
