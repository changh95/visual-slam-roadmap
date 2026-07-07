# LERF

> Kerr 2023 · [Paper](https://arxiv.org/abs/2303.09553)

**One-line summary** — Language Embedded Radiance Fields ground CLIP features inside a NeRF via volume rendering, enabling pixel-aligned, zero-shot 3D queries from open-ended natural-language prompts.

## Problem

Humans refer to 3D locations through language covering "a vast range of properties: visual appearance, semantics, abstract associations, or actionable affordances" (abstract) — "the yellow mug", "something to write with". CLIP can score such prompts against *images*, but it produces one embedding per image crop, with no 3D structure and no pixel alignment; prior open-vocabulary 3D work leaned on region proposals, masks, or fine-tuned detectors, restricting queries to detectable object categories. LERF asks how to ground raw CLIP embeddings *volumetrically* in a NeRF so that arbitrary language queries resolve to 3D locations.

## Key ideas

- **A language field inside NeRF**: the network outputs a language embedding $\mathbf{l}(\mathbf{x})$ at every 3D point in addition to colour and density; embeddings are volume-rendered along rays exactly like colour,
  $$\hat{\mathbf{L}}(\mathbf{r}) = \sum_{k} T_k\,(1 - e^{-\sigma_k \delta_k})\, \mathbf{l}_k,$$
  and supervised to match CLIP features of the training views. Supervising "across training views... provide[s] multi-view consistency and smooth[s] the underlying language field" (abstract).
- **Multi-scale CLIP supervision**: CLIP features are extracted over image crops at many scales, so the field captures semantics at different granularities — an object, a region, a whole scene — and queries can be answered "hierarchically across the volume". A query for "utensils" and one for "the fork's handle" live at different scales of the same field.
- **DINO regularisation**: self-supervised DINO features provide dense, spatially sharp supervision that keeps the language field coherent and prevents degenerate solutions (e.g., the whole scene collapsing to a single embedding), compensating for CLIP's coarse, crop-level signal.
- **Zero-shot, mask-free queries**: after optimisation, cosine similarity between a CLIP text embedding and the rendered language field yields 3D relevancy maps "without relying on region proposals or masks" — no fine-tuning, no fixed category list, supporting long-tail open-vocabulary prompts.
- **Interactive querying**: relevancy maps for new prompts are extracted "interactively in real-time" after the field is trained, which is what makes the representation usable as an interface rather than a batch process.

## Results & impact

- Demonstrated pixel-aligned, zero-shot 3D relevancy extraction for a broad range of natural-language prompts, with intended use cases in "robotics, understanding vision-language models, and interacting with 3D scenes" (abstract).
- Spawned an entire family of language-embedded 3D representations: LEGS and LangSplat (Gaussian-splatting variants), and numerous open-vocabulary field methods; it is the standard citation for "put CLIP in your scene representation".
- Its multi-scale CLIP + DINO-regularisation recipe became the default supervision scheme for distilling 2D vision-language features into 3D fields.

## Why it matters for SLAM

LERF established the paradigm of embedding vision-language features directly into a 3D scene representation, which is the semantic layer of Spatial AI: maps you can *talk to*. It directly inspired language-embedded Gaussian splatting (LEGS, LangSplat) and complements fusion-style approaches like ConceptFusion. For robotics, "find something to write with" resolved to a 3D location is exactly the capability that turns a SLAM map into an actionable world model.

## Related

- [LEGS](legs.md)
- [ConceptFusion](conceptfusion.md)
- [OpenScene](openscene.md)
- [NeRF](../level-05-deep-learning/nerf.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
