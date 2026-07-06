# SpatialLM

> Mao 2025 · [Paper](https://github.com/manycore-research/SpatialLM)

**One-line summary** — Feeds 3D point clouds to a large language model that outputs structured indoor models as executable Python scripts, grounding LLM reasoning in 3D spatial structure.

## Key ideas

- **Point cloud to LLM**: 3D point clouds are tokenised into a sequence format the LLM can consume, encoding spatial coordinates and features as structured tokens.
- **Structured indoor modeling as code**: the model outputs Python scripts defining room boundaries, object placements (e.g., oriented bounding boxes), and spatial relationships; the scripts are executable and reproduce a structured 3D scene model.
- **Spatial reasoning in language space**: the LLM reasons about layout, connectivity between spaces, and functional zones, combining code-generation strengths with geometric input.
- **Language-grounded interaction**: users can query the resulting spatial model in natural language, receiving answers grounded in the reconstructed geometry.

## Why it matters for SLAM

SpatialLM illustrates where semantic mapping is heading: from label-annotated point clouds (OpenScene, ConceptFusion) and scene graphs (ConceptGraphs) toward representations an LLM can directly parse and manipulate. A SLAM system provides the point cloud; a model like SpatialLM turns it into a structured, queryable, machine-readable description of the space — useful for simulation, planning, digital-twin creation, and embodied AI.

## Related

- [OpenScene](openscene.md)
- [ConceptFusion](conceptfusion.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
