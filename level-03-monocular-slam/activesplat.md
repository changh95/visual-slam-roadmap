# ActiveSplat

> Li 2025 · [Paper](https://arxiv.org/abs/2410.21955)

**One-line summary** — An autonomous active-mapping system that couples a 3D Gaussian Splatting map with Voronoi-based topological planning, so the robot itself decides where to look next to maximise reconstruction quality and coverage.

## Key ideas

- **Active mapping, not passive SLAM**: instead of processing whatever images arrive, the system unifies online mapping, viewpoint selection, and path planning in one framework — the robot plans its own trajectory to reconstruct the scene.
- **Hybrid map representation**: a dense 3DGS map provides efficient, realistic rendering for assessing reconstruction quality, while a sparse topological abstraction (Voronoi graph) of the workspace supports cheap viewpoint sampling and path planning.
- **View-dependent dense prediction for viewpoint selection**: candidate viewpoints are evaluated by rendering from the Gaussian map, steering the robot toward under-reconstructed regions — the rendering-based representation itself supplies the exploration signal.
- **Hierarchical planning on the topology**: planning over the Voronoi graph mitigates repetitive trajectories and improves local granularity under a limited time budget.
- Validated in simulation and ablations for reconstruction accuracy, data coverage, and exploration efficiency, with photorealistic view synthesis as the end product.

## Why it matters for SLAM

Most of the 3DGS-SLAM literature (SplaTAM, MonoGS, Photo-SLAM) treats the camera trajectory as given; ActiveSplat closes the loop between mapping and *acting*, representative of the shift from passive SLAM toward embodied, exploration-driven reconstruction. It shows that a rendering-based map is not just an output format — its rendering quality metrics directly drive next-best-view decisions, which matters for autonomous inspection, digital-twin capture, and robotic exploration.

## Related

- [SplaTAM](splatam.md)
- [MonoGS](monogs.md)
- [Online 3DGS Modeling](online-3dgs-modeling.md)
- [OpenGS-SLAM](opengs-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
