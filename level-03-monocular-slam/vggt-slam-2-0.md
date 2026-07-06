# VGGT-SLAM 2.0

> Maggio 2026 · [Paper](https://arxiv.org/abs/2601.19887)

**One-line summary** — The successor to VGGT-SLAM, pushing feed-forward foundation-model SLAM toward real-time dense scene reconstruction.

## Key ideas

- **Real-time focus**: the headline goal is real-time dense reconstruction from a feed-forward model, addressing the main practical limitation of the original VGGT-SLAM pipeline.
- **Feed-forward geometry, SLAM-style consistency**: like its predecessor, the system relies on a VGGT-class network to produce dense geometry and poses, with a SLAM backend maintaining global consistency across the sequence.
- **Same lineage, tighter integration**: it builds directly on the submap-based design of VGGT-SLAM, refining how feed-forward predictions are accumulated into a single coherent dense map at interactive rates.

## Why it matters for SLAM

The first wave of foundation-model SLAM systems (MASt3R-SLAM, VGGT-SLAM) proved the concept but often ran well below sensor frame rate. VGGT-SLAM 2.0 targets the remaining gap — making dense feed-forward reconstruction usable online — which is the requirement for robotics and AR rather than offline mapping. Watching this line of work is the best way to track how quickly learned front-ends are displacing classical geometric pipelines.

## Related

- [VGGT-SLAM](vggt-slam.md) — the original system this version supersedes
- [VGGT](vggt.md) — the underlying feed-forward geometry model
- [MASt3R-SLAM](mast3r-slam.md) — contemporary foundation-model SLAM
- [DROID-SLAM](droid-slam.md) — earlier learned SLAM baseline in this lineage

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
