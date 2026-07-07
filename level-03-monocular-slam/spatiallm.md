# SpatialLM

> Mao 2025 · [Paper](https://github.com/manycore-research/SpatialLM)

**One-line summary** — Feeds 3D point clouds to a large language model that outputs structured indoor models as executable Python scripts, grounding LLM reasoning in 3D spatial structure.

## Problem

Large language models excel at reasoning and code generation but have no grounding in 3D physical space, while 3D scene representations (point clouds, meshes) carry geometry but no reasoning capability. Point-feature maps (OpenScene, ConceptFusion) and scene graphs (ConceptGraphs) attach semantics to geometry, but their outputs are still not something an LLM can natively parse and manipulate. SpatialLM bridges the gap: an LLM consumes a point cloud and emits a structured, machine-readable model of the space.

## Key ideas

- **Point cloud to LLM**: 3D point clouds are tokenised into a sequence format the LLM can consume, encoding spatial coordinates and features as structured tokens — geometry becomes part of the language model's context rather than a separate modality bolted on.
- **Structured indoor modeling as code**: the model outputs Python scripts defining room boundaries (walls, doors, windows) and object placements as oriented bounding boxes; the scripts are executable and reproduce a structured 3D scene model, so validity can be checked by simply running them.
- **Code as the output representation**: emitting a program instead of raw coordinates leverages what LLMs are already best at (structured code generation) and yields an editable, diff-able, machine-readable scene description.
- **Spatial reasoning in language space**: the LLM reasons about layout, connectivity between spaces, and functional zones, combining code-generation strengths with geometric input.
- **Language-grounded interaction**: users can query the resulting spatial model in natural language and receive answers grounded in the reconstructed geometry.

## Results & impact

SpatialLM is distributed as an open model family with code on GitHub; its significance so far is architectural rather than benchmark-driven — it demonstrates a working pipeline from raw point cloud to executable structured scene description via an LLM. (This entry is kept deliberately lean: no paper abstract was available to verify quantitative claims.)

## Why it matters for SLAM

SpatialLM illustrates where semantic mapping is heading: from label-annotated point clouds (OpenScene, ConceptFusion) and scene graphs (ConceptGraphs) toward representations an LLM can directly parse and manipulate. A SLAM system provides the point cloud; a model like SpatialLM turns it into a structured, queryable, machine-readable description of the space — useful for simulation, planning, digital-twin creation, and embodied AI.

## Related

- [OpenScene](openscene.md)
- [ConceptFusion](conceptfusion.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
