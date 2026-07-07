# Grounding DINO

> Liu 2023 · [Paper](https://arxiv.org/abs/2303.05499)

**One-line summary** — Open-set object detector that finds any object described by a free-form text prompt, via tight language-vision Transformer fusion — the detection half of the widely used Grounded SAM pipeline.

## Problem

Standard detectors (YOLO, DETR) are closed-set: they detect only the fixed categories they were trained on (e.g., 80 COCO classes). The key to open-set detection is introducing language so a closed-set detector generalizes to unseen concepts — learning language-aware region embeddings classified in a semantic space rather than over a fixed label set. Prior open-set detectors fused the modalities only partially: GLIP fuses only in the neck (phase A), OV-DETR only injects language at the decoder inputs (phase B). The paper's thesis is that fusion should happen in *all three* phases of a detector — neck, query initialization, and head — and that tighter fusion yields better open-set generalization.

## Method & architecture

A dual-encoder single-decoder architecture built on DINO (the DETR variant): image backbone (Swin-T/Swin-L) extracts multi-scale visual features, text backbone (BERT-base) extracts token features from the prompt (all category names concatenated, or a referring expression). Three fusion modules follow:

- **Feature enhancer** (neck, 6 layers): each layer applies deformable self-attention on image features and vanilla self-attention on text features, then image-to-text and text-to-image cross-attention — grounding regions in words and contextualizing words by image content.
- **Language-guided query selection**: with enhanced image features $\mathbf{X}_I \in \mathbb{R}^{N_I \times d}$ and text features $\mathbf{X}_T \in \mathbb{R}^{N_T \times d}$ ($d=256$, $N_I > 10{,}000$, $N_T \le 256$), the $N_q = 900$ decoder queries are initialized from the image tokens most similar to any text token:

$$\mathbf{I}_{N_q} = \texttt{Top}_{N_q}\big(\texttt{Max}^{(-1)}(\mathbf{X}_I \mathbf{X}_T^{\intercal})\big)$$

  where $\texttt{Max}^{(-1)}$ takes the max over the text dimension. Following DINO's mixed query selection, selected features initialize the positional part (dynamic anchor boxes) while content queries stay learnable.
- **Cross-modality decoder** (head, 6 layers): each layer runs query self-attention, image cross-attention, *text cross-attention* (the addition over DINO), and an FFN, so queries keep probing both modalities during box refinement.

**Sub-sentence text representation**: concatenating category names lets unrelated categories attend to each other in BERT; attention masks block cross-category attention while keeping per-word features — finer than sentence-level, cleaner than word-level.

**Training**: L1 + GIoU losses for boxes and, following GLIP, a contrastive loss between predicted objects and language tokens for classification (each query outputs a box and dot-product similarities to text tokens); Hungarian matching costs 2.0/5.0/2.0 (cls/L1/GIoU), loss weights 1.0/5.0/2.0. Trained on detection + grounding (+ caption) data. For REC, the highest-scoring box is returned.

## Results

- **Zero-shot COCO** (no COCO training images): Grounding DINO-L reaches **52.5 AP on COCO minival**; fine-tuned on COCO it reaches 62.6 AP minival (63.0 test-dev). With Swin-T, it beats GLIP-T by +1.8 AP and DINO by +0.5 AP under the same setting; adding grounding data gives >1 AP (48.1 vs 46.7).
- **ODinW zero-shot** (35 diverse real-world detection datasets): a record **26.1 mean AP**.
- **LVIS zero-shot**: outperforms GLIP under comparable data, better on common objects but weaker on rare categories; scales better with data than GLIP (+1.8 AP from Cap4M captions vs GLIP's +1.1) though behind DetCLIPv2 trained on larger-scale data.
- **RefCOCO/+/g** referring expression comprehension: evaluated across all three splits — attribute-qualified phrases ("the leftmost chair"), a stronger open-set test than category names.

## Why it matters for SLAM

Grounding DINO is what makes language-driven semantic SLAM practical: maps can be populated with objects named by natural language, without retraining a detector for each new environment. Feeding its text-prompted boxes to SAM (**Grounded SAM**) yields instance masks for any described object — the perception front-end of open-vocabulary 3D scene graph systems like ConceptGraphs and task-driven mapping like Clio — and it lets robots execute language instructions ("go to the whiteboard") directly against the SLAM map.

## Related

- [DETR](detr.md) — the Transformer detection architecture family it extends
- [SAM](sam.md) — the segmentation partner in Grounded SAM
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs built on this pipeline
- [Open-YOLO 3D](open-yolo-3d.md) — open-vocabulary 3D instance segmentation using 2D open-set detectors
- [CLIP](../level-11-world-models-spatial-ai/clip.md) — the vision-language alignment idea underpinning open-vocabulary perception
- [Clio](clio.md) — task-driven open-vocabulary mapping consuming this detector's outputs
