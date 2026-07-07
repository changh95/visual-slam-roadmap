# Grounding DINO

> Liu 2023 · [Paper](https://arxiv.org/abs/2303.05499)

**One-line summary** — Open-set object detector that finds any object described by a free-form text prompt, via tight language-vision Transformer fusion — the detection half of the widely used Grounded SAM pipeline.

## Problem

Standard detectors (YOLO, DETR) are closed-set: they detect only the fixed categories they were trained on (e.g., 80 COCO classes). Robots operating in the open world constantly encounter objects outside any training vocabulary, and language is the natural open-vocabulary interface — a robot should detect "the red mug on the table" without "red mug" ever being a training class. The key to open-set detection is introducing language into a closed-set detector so it generalizes to open-set concepts; the question is *where and how tightly* to fuse the two modalities.

## Key ideas

- **Tight fusion across the whole detector**: the paper conceptually divides a closed-set detector into three phases — backbone, neck, head — and injects language into all of them rather than only at the classification output, via a feature enhancer, language-guided query selection, and a cross-modality decoder.
- **Dual encoders**: a Swin Transformer encodes the image into multi-scale visual features while a BERT text encoder produces token-level language features from the prompt.
- **Bidirectional cross-modality feature enhancer**: vision tokens attend to language tokens and vice versa ($\mathbf{v}' = \text{CrossAttn}(\mathbf{v}, \mathbf{l}) + \mathbf{v}$, $\mathbf{l}' = \text{CrossAttn}(\mathbf{l}, \mathbf{v}) + \mathbf{l}$), grounding image regions in words and contextualizing words by image content.
- **Language-guided query selection**: DETR-style object queries are initialized from the visual features most similar to the text tokens, focusing the decoder on relevant regions from the start; each query outputs a box plus a text-region alignment score.
- **Referring expressions, not just categories**: beyond novel category names, the paper evaluates on referring expression comprehension — detecting objects specified with attributes ("the leftmost chair") — a much stronger test of open-set understanding.
- **Grounded SAM**: feeding Grounding DINO's text-prompted boxes into SAM yields high-quality instance masks for any described object — the de facto open-vocabulary segmentation pipeline.

## Results & impact

- Achieves 52.5 AP on COCO detection *zero-shot* — without any COCO training data — and sets a record 26.1 mean AP on the ODinW zero-shot benchmark; strong results across COCO, LVIS, ODinW, and RefCOCO/+/g.
- Became the standard open-vocabulary detector: the Grounded SAM combination is the perception front-end of ConceptGraphs, Clio, and most open-vocabulary 3D scene graph work.
- Eliminated the retrain-per-environment cycle for robotic detection — new object categories are a prompt, not a dataset.

## Why it matters for SLAM

Grounding DINO is what makes language-driven semantic SLAM practical: maps can be populated with objects named by natural language, without retraining a detector for each new environment. The Grounded SAM combination is the perception front-end of open-vocabulary 3D scene graph systems like ConceptGraphs and task-driven mapping like Clio, and it lets robots execute language instructions ("go to the whiteboard") directly against the SLAM map.

## Related

- [DETR](detr.md) — the Transformer detection architecture family it extends
- [SAM](sam.md) — the segmentation partner in Grounded SAM
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs built on this pipeline
- [Open-YOLO 3D](open-yolo-3d.md) — open-vocabulary 3D instance segmentation using 2D open-set detectors
- [CLIP](../level-11-world-models-spatial-ai/clip.md) — the vision-language alignment idea underpinning open-vocabulary perception
- [Clio](clio.md) — task-driven open-vocabulary mapping consuming this detector's outputs

[Back to Level 5](../README.md#level-5-applying-deep-learning)
