# Khronos

> Schmid (MIT SPARK) 2024 · [Paper](https://arxiv.org/abs/2402.13817)

**One-line summary** — Unified spatio-temporal metric-semantic SLAM that extends the Hydra scene-graph line to dynamic environments by tracking the full history of objects: when they appeared, moved, or were removed.

## Key ideas

- **Spatio-temporal scene graph**: Each object node carries a temporal history of its detections and poses, so the map can answer "the chair was here yesterday but moved today".
- **Change detection**: Current observations are compared against the prior map state to detect moved, added, and removed objects rather than treating them as noise.
- **4D object tracking**: Object identity is maintained across changes, linking an object's temporal states in the graph.
- **Static/dynamic separation**: A background model separates static structure from dynamic foreground, keeping metric mapping stable while dynamics are handled explicitly.

## Why it matters for SLAM

Almost all classical SLAM assumes a static world, which breaks down in long-term operation in homes, warehouses, and offices where objects constantly move. Khronos reframes dynamics as something to be *modeled and remembered* rather than filtered out, giving robots a temporal world model. It is a key building block for long-term autonomy on top of the Kimera → Hydra lineage of metric-semantic scene graphs.

## Related

- [Hydra](hydra.md) — the real-time scene-graph system Khronos extends
- [Clio](clio.md) — task-driven open-set scene graphs from the same lab
- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — origin of the dynamic scene graph idea
- [SAM 2](sam-2.md) — video segmentation useful for tracking dynamic entities

[Back to Level 5](../README.md#level-5-applying-deep-learning)
