# ActiveSplat

> Li 2025 · [Paper](https://arxiv.org/abs/2410.21955)

**One-line summary** — An autonomous active-mapping system that couples a 3D Gaussian Splatting map with Voronoi-based topological planning, so the robot itself decides where to look next to maximise reconstruction quality and coverage.

## Problem

Standard SLAM and 3DGS-mapping systems are *passive*: they process whatever images the camera happens to capture, and reconstruction quality is at the mercy of the operator's trajectory. Active mapping flips the problem — the robot must autonomously choose viewpoints and plan paths that maximise reconstruction quality and coverage under a limited time budget. Doing this with a rendering-based map is attractive (the map itself can tell you what is well or poorly reconstructed) but demands a representation that supports both fast, realistic rendering for quality assessment *and* efficient planning over the workspace — requirements a dense Gaussian map alone does not satisfy.

## Key ideas

- **Active mapping, not passive SLAM**: ActiveSplat establishes a unified framework for online mapping, viewpoint selection, and path planning — the robot plans its own trajectory to reconstruct the scene, rather than consuming a given image stream.
- **Gaussian splatting as the map**: the system leverages 3DGS's efficient and realistic rendering, so candidate viewpoints can be evaluated by actually rendering from the current map — the exploration signal comes from the map representation itself.
- **Hybrid map representation (the key)**: dense environmental information (the Gaussian map) is integrated with a *sparse abstraction of the workspace* (a Voronoi-graph topology). The dense side supplies view-dependent prediction for viewpoint selection; the sparse side supplies cheap viewpoint sampling and path planning.
- **Hierarchical planning on the topology**: a hierarchical planning strategy over the topological map mitigates repetitive trajectories and improves local granularity given limited time budgets — global decisions ride on the graph, local refinement fills in detail.
- **Efficient decision-making with accuracy and completeness**: the division of labour (render-based quality where it matters, graph-based planning where speed matters) is what makes online active reconstruction tractable, ensuring high-fidelity reconstruction with photorealistic view synthesis as the end product.

## Results & impact

The paper reports extensive experiments and ablation studies validating the approach on three axes: reconstruction accuracy, data coverage, and exploration efficiency — i.e. the hybrid dense-sparse design is not just a systems convenience but measurably improves both what gets reconstructed and how quickly the robot covers the scene. Code is released via the project page, making it a practical reference implementation for active Gaussian-splatting reconstruction.

## Why it matters for SLAM

Most of the 3DGS-SLAM literature (SplaTAM, MonoGS, Photo-SLAM) treats the camera trajectory as given; ActiveSplat closes the loop between mapping and *acting*, representative of the shift from passive SLAM toward embodied, exploration-driven reconstruction. It shows that a rendering-based map is not just an output format — its rendering quality directly drives next-best-view decisions, which matters for autonomous inspection, digital-twin capture, and robotic exploration.

## Related

- [SplaTAM](splatam.md)
- [MonoGS](monogs.md)
- [Online 3DGS Modeling](online-3dgs-modeling.md)
- [OpenGS-SLAM](opengs-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
