# Grounding DINO

> Liu 2023 · [Paper](https://arxiv.org/abs/2303.05499)

**One-line summary** — Open-set object detector that finds any object described by a free-form text prompt, via tight language-vision Transformer fusion — the detection half of the widely used Grounded SAM pipeline.

## Key ideas

- **Beyond closed vocabularies**: standard detectors (YOLO, DETR) only detect their fixed training categories; a robot in the open world needs to detect "the red mug on the table" without "red mug" ever being a training class. Language is the natural open-vocabulary interface.
- **Dual encoders**: a Swin Transformer encodes the image into multi-scale visual features while a BERT text encoder produces token-level language features from the prompt.
- **Bidirectional cross-modality fusion**: a feature enhancer lets vision tokens attend to language tokens and vice versa ($\mathbf{v}' = \text{CrossAttn}(\mathbf{v}, \mathbf{l}) + \mathbf{v}$, $\mathbf{l}' = \text{CrossAttn}(\mathbf{l}, \mathbf{v}) + \mathbf{l}$), grounding image regions in words and contextualizing words by image content.
- **Language-guided query selection**: DETR-style object queries are initialized from the visual features most similar to the text tokens, focusing the decoder on relevant regions from the start; each query outputs a box plus a text-region alignment score.
- **Grounded SAM**: feeding Grounding DINO's text-prompted boxes into SAM yields high-quality instance masks for any described object — the de facto open-vocabulary segmentation pipeline.

## Why it matters for SLAM

Grounding DINO is what makes language-driven semantic SLAM practical: maps can be populated with objects named by natural language, without retraining a detector for each new environment. The Grounded SAM combination is the perception front-end of open-vocabulary 3D scene graph systems like ConceptGraphs and task-driven mapping like Clio, and it lets robots execute language instructions ("go to the whiteboard") directly against the SLAM map.

## Related

- [DETR](detr.md) — the Transformer detection architecture family it extends
- [SAM](sam.md) — the segmentation partner in Grounded SAM
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs built on this pipeline
- [Open-YOLO 3D](open-yolo-3d.md) — open-vocabulary 3D instance segmentation using 2D open-set detectors
- [CLIP](../level-11-world-models-spatial-ai/clip.md) — the vision-language alignment idea underpinning open-vocabulary perception

[Back to Level 5](../README.md#level-5-applying-deep-learning)
