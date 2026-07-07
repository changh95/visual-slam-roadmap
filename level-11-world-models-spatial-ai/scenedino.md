# SceneDINO

> Jevtić 2025 · [Paper](https://arxiv.org/abs/2507.06230)

**One-line summary** — SceneDINO brings self-supervised DINO-style features into 3D, inferring geometry and expressive 3D features from a single image in one feed-forward pass and turning them into semantic scene completion without task-specific 3D labels.

## Problem

Semantic scene completion (SSC) asks a model to infer both the 3D geometry *and* the semantics of a scene from a single image — including occluded and never-observed regions ("is there likely a wall behind this corner?"). Prior SSC methods rely heavily on expensive ground-truth annotations: labeled 3D voxel grids that are costly to produce and tie the model to the domain they were collected in. SceneDINO approaches SSC in a fully *unsupervised* setting, asking how far self-supervised representation learning can carry 3D scene understanding without any semantic or geometric ground truth.

## Key ideas

- **Self-supervision only**: training exclusively uses multi-view consistency self-supervision — no semantic labels, no geometric ground truth of any form. The method adapts techniques from self-supervised representation learning and 2D unsupervised scene understanding to the SSC task.
- **Feed-forward 3D feature fields**: given a single input image, SceneDINO infers the scene's 3D geometry together with expressive 3D DINO features in a single feed-forward pass — no per-scene test-time optimization, which is the speed profile online robotics needs.
- **3D feature distillation**: a novel distillation approach lifts 2D DINO foundation-model features into a multi-view-consistent 3D feature representation; because DINO features already encode geometry- and semantics-aware structure learned from internet-scale images, the 3D features are useful before any labels are involved.
- **Unsupervised semantics on top of features**: 3D semantics are then obtained from the distilled feature field in an unsupervised manner, rather than predicted against ground-truth voxel labels — semantics become a *readout* of the representation, not a supervised target.
- **Cheap supervised readout when labels exist**: linear probing the 3D features (fitting only a linear classifier) is enough to match the segmentation accuracy of a current fully supervised SSC approach — strong evidence that the representation, not the label supervision, is doing the heavy lifting.

## Results & impact

SceneDINO reaches state-of-the-art segmentation accuracy in both 3D and 2D *unsupervised* scene understanding, and its linearly probed 3D features match the segmentation accuracy of a current supervised SSC approach. The authors additionally showcase domain generalization and multi-view consistency, positioning the work as "first steps towards a strong foundation for single image 3D scene understanding." It is a clean demonstration that foundation-model features can replace 3D annotation pipelines for scene-level understanding.

## Why it matters for SLAM

SLAM maps are hollow where the sensor has not looked; scene completion fills that gap with learned structural priors, which directly benefits exploration, path planning, and safe navigation in partially observed environments. SceneDINO exemplifies the broader Spatial AI trend of this level: reuse a self-supervised foundation model's representations to get open-world 3D understanding without collecting task-specific 3D annotations — the same philosophy behind open-vocabulary mapping systems.

## Related

- [Spatial AI](spatial-ai.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)
- [OpenScene](../level-03-monocular-slam/openscene.md)
- [World Labs / Marble](world-labs-marble.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
