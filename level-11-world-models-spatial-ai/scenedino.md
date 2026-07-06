# SceneDINO

> Jevtić 2025 · [Paper](https://arxiv.org/abs/2507.06230)

**One-line summary** — SceneDINO brings self-supervised DINO-style features into 3D, inferring geometry and expressive 3D features from imagery in a single feed-forward pass and turning them into semantic scene completion without task-specific 3D labels.

## Key ideas

- **Semantic scene completion (SSC)**: A robot only observes what is in its sensor frustum; SSC asks the model to predict the occupancy and semantics of the *whole* scene, including occluded and never-observed regions — "is there likely a wall behind this corner?"
- **Self-supervised features instead of labels**: Classical SSC methods train on expensive annotated 3D voxel datasets and are brittle under domain shift. SceneDINO instead builds on self-supervised vision-foundation features (DINO family), which already encode geometry- and semantics-aware structure learned from internet-scale images.
- **Feed-forward, not per-scene optimization**: Unlike NeRF-style test-time optimization, a single forward pass lifts image features into a 3D representation — the speed profile needed for online robotics use.
- **Feature distillation into 3D**: 2D foundation-model features are distilled into a 3D feature field with multi-view consistency, and semantics are then obtained from the features in an unsupervised manner, rather than from ground-truth voxel labels.

## Why it matters for SLAM

SLAM maps are hollow where the sensor has not looked; scene completion fills that gap with learned structural priors, which directly benefits exploration, path planning, and safe navigation in partially observed environments. SceneDINO exemplifies the broader Spatial AI trend of this level: reuse a self-supervised foundation model's representations to get open-world 3D understanding without collecting task-specific 3D annotations — the same philosophy behind open-vocabulary mapping systems.

## Related

- [Spatial AI](spatial-ai.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)
- [OpenScene](../level-03-monocular-slam/openscene.md)
- [World Labs / Marble](world-labs-marble.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
