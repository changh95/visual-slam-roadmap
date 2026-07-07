# Khronos

> Schmid (MIT SPARK) 2024 · [Paper](https://arxiv.org/abs/2402.13817)

**One-line summary** — Unified spatio-temporal metric-semantic SLAM that extends the Hydra scene-graph line to dynamic environments by tracking the full history of objects: when they appeared, moved, or were removed.

## Problem

Dynamic SLAM research has made large strides toward estimating the robot pose accurately in changing environments, but much less emphasis has been put on building dense *spatio-temporal* representations of the environment itself. Long-term autonomy — operating in spaces shared with humans and other agents — requires reasoning over both short-term dynamics (a person walking by) and long-term changes (furniture rearranged between visits), and no prior framework treated these two regimes in a single consistent formulation.

## Key ideas

- **The SMS problem**: Khronos formally defines the Spatio-temporal Metric-semantic SLAM (SMS) problem — jointly estimating the robot trajectory and a dense metric-semantic map that evolves through time — and presents a factorization that makes it efficiently solvable.
- **Fast/slow factorization**: The proposed factorization suggests a natural organization of the perception system: a fast process tracks short-term dynamics within an active temporal window, while a slower process reasons over long-term changes using a factor-graph formulation.
- **Unifying short- and long-term dynamics**: This design unifies existing, previously separate interpretations of dynamics — moving-object tracking on one side and change detection between visits on the other — inside one system.
- **Spatio-temporal scene graph**: Each object node carries a temporal history of its detections and poses, so the map can answer "the chair was here yesterday but moved today".
- **Change detection**: Current observations are compared against the prior map state to detect moved, added, and removed objects rather than treating them as noise to be filtered.
- **Static/dynamic separation**: A background model separates static structure from dynamic foreground, keeping dense metric mapping stable while dynamics are handled explicitly.

## Results & impact

In simulated and real experiments, the spatio-temporal maps built by Khronos are an accurate reflection of the 3D scene over time, and Khronos outperforms baselines across multiple metrics while building its dense spatio-temporal map in real time. The approach was further validated on two heterogeneous robots in challenging, large-scale real-world environments.

## Why it matters for SLAM

Almost all classical SLAM assumes a static world, which breaks down in long-term operation in homes, warehouses, and offices where objects constantly move. Khronos reframes dynamics as something to be *modeled and remembered* rather than filtered out, giving robots a temporal world model. It is a key building block for long-term autonomy on top of the Kimera → Hydra lineage of metric-semantic scene graphs.

## Related

- [Hydra](hydra.md) — the real-time scene-graph system Khronos extends
- [Clio](clio.md) — task-driven open-set scene graphs from the same lab
- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — origin of the dynamic scene graph idea
- [SAM 2](sam-2.md) — video segmentation useful for tracking dynamic entities
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md) — the classical "filter dynamics out" approach Khronos moves beyond

[Back to Level 5](../README.md#level-5-applying-deep-learning)
