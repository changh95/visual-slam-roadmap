# LERF

> Kerr 2023 · [Paper](https://arxiv.org/abs/2303.09553)

**One-line summary** — Language Embedded Radiance Fields ground CLIP features inside a NeRF via volume rendering, enabling pixel-aligned, zero-shot 3D queries from open-ended natural-language prompts.

## Key ideas

- **A language field inside NeRF**: the network outputs a language embedding $\mathbf{l}(\mathbf{x})$ at every 3D point in addition to colour and density; embeddings are volume-rendered along rays just like colour, and supervised to match CLIP features of the training views, giving multi-view-consistent semantics.
- **Multi-scale CLIP supervision**: CLIP features are extracted over image crops at many scales, so the field captures semantics at different granularities — an object, a region, a whole scene — and queries can be answered hierarchically.
- **DINO regularisation**: self-supervised DINO features provide dense spatial supervision that keeps the language field spatially coherent and prevents degenerate solutions.
- **Zero-shot, mask-free queries**: after optimisation, cosine similarity between a CLIP text embedding and the rendered language field yields interactive 3D relevancy maps for long-tail, open-vocabulary prompts — no region proposals, masks, or fine-tuning.

## Why it matters for SLAM

LERF established the paradigm of embedding vision-language features directly into a 3D scene representation, which is the semantic layer of Spatial AI: maps you can *talk to*. It directly inspired language-embedded Gaussian splatting (LEGS, LangSplat) and complements fusion-style approaches like ConceptFusion. For robotics, "find something to write with" resolved to a 3D location is exactly the capability that turns a SLAM map into an actionable world model.

## Related

- [LEGS](legs.md)
- [ConceptFusion](conceptfusion.md)
- [OpenScene](openscene.md)
- [NeRF](../level-05-deep-learning/nerf.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
