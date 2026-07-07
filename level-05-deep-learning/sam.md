# SAM

> Kirillov 2023 · [Paper](https://arxiv.org/abs/2304.02643)

**One-line summary** — Segment Anything: a promptable segmentation foundation model trained on 1.1B masks from 11M images that segments arbitrary objects zero-shot from point, box, or mask prompts.

## Problem

Segmentation research was fragmented into task-specific models — interactive, semantic, instance, panoptic — each requiring its own labeled dataset and training run, and none transferring zero-shot to new image distributions or new tasks. NLP had shown that a foundation model trained at sufficient scale on a promptable task can generalize to tasks it was never explicitly trained for. The Segment Anything project asks what the equivalent *task*, *model*, and *dataset* are for segmentation — the catch being that masks are not naturally abundant on the internet, so billion-scale annotation had to be manufactured.

## Method & architecture

The project has three interconnected components: a **promptable segmentation task** (return a valid mask for any prompt — point, box, mask, or exploratory free-form text), the **model (SAM)**, and a **data engine** producing SA-1B.

SAM has three modules, designed so the expensive part is amortized per image:

- **Image encoder**: an MAE pre-trained ViT-H/16 (14×14 windowed attention with four global-attention blocks) on 1024×1024 input, producing a 16x-downscaled image embedding. Runs *once per image*, before any prompt arrives.
- **Prompt encoder**: sparse prompts (points, boxes) become positional encodings summed with learned per-type embeddings; text goes through an off-the-shelf CLIP text encoder; dense prompts (masks) are embedded by convolutions and summed element-wise with the image embedding.
- **Mask decoder**: two modified Transformer decoder blocks with prompt self-attention and *two-directional* cross-attention (prompt-to-image and image-to-prompt), then the image embedding is upsampled and an MLP maps an output token to a dynamic linear classifier that scores mask foreground probability per location. Given a precomputed embedding, prompt encoder + decoder run in ~50 ms in a web browser on CPU — real-time interactive prompting.

**Ambiguity**: a single click can validly mean whole/part/subpart, so SAM predicts **3 output masks** per prompt with a predicted IoU confidence each; training backpropagates only the minimum loss over the three. Mask supervision is a linear combination of focal loss and dice loss, with an interactive setup simulated by sampling prompts over 11 rounds per mask.

**Data engine** (model-in-the-loop, three stages): (1) *assisted-manual* — annotators click with SAM in the loop, 4.3M masks from 120k images, per-mask time falling from 34 s to 14 s as the model was retrained 6 times; (2) *semi-automatic* — SAM pre-fills confident masks, annotators add the rest, +5.9M masks from 180k images; (3) *fully automatic* — prompt SAM with a 32×32 point grid, keep masks that are confident (predicted IoU) and *stable* (thresholding the probability map at $0.5-\delta$ and $0.5+\delta$ yields similar masks), deduplicate with NMS. Applied to all 11M images, this yielded **SA-1B: 1.1B masks, ~100 masks/image**, 11x more images and 400x more masks than Open Images; released images downsampled to 1500 px shortest side.

## Results

- **Single-point zero-shot segmentation on a new 23-dataset suite**: SAM beats the strongest interactive baseline RITM on 16 of 23 datasets (by up to ~47 IoU); with an oracle picking the best of its 3 masks, it wins on *all* 23. In a human study, SAM's masks rate 7–9 out of 10, consistently above RITM — even on datasets where automatic mIoU favors RITM.
- **Zero-shot instance segmentation** (prompting with ViTDet-H boxes): 46.5 mask AP on COCO vs 51.0 for fully supervised ViTDet-H, and 44.7 vs 46.6 on LVIS — close behind without any COCO/LVIS mask training, and rated *higher* than ViTDet by human annotators (ViTDet exploits dataset-specific mask biases).
- **Zero-shot object proposals on LVIS**: outperforms ViTDet-H on medium/large and rare/common objects, trailing only on small and frequent ones.
- **Zero-shot edge detection on BSDS500**: sensible edge maps despite never training for edges; high recall (R50) at lower precision.
- Ablations: training on automatic masks alone loses only ~0.5 mIoU vs all data; 1M images (~10% of SA-1B) nearly matches the full dataset; ViT-H clearly beats ViT-B but only marginally beats ViT-L.
- Stated limits: can miss fine structures, hallucinate small components, not real-time end-to-end with the heavy encoder; text-to-mask is exploratory.

## Why it matters for SLAM

SAM gave SLAM systems class-agnostic object masks on demand — the missing ingredient for open-vocabulary semantic mapping. Paired with a text-prompted detector (Grounded SAM = Grounding DINO + SAM), it powers 3D scene-graph and open-vocabulary mapping systems like ConceptGraphs and Clio, and provides clean masks for dynamic-object removal. Its per-image amortized design (heavy encoder once, cheap prompts many times) fits SLAM keyframe pipelines, and its video successor SAM 2 adds the temporal consistency SLAM actually needs across frames.

## Related

- [SAM 2](sam-2.md) — video extension with streaming memory
- [Grounding DINO](grounding-dino.md) — text-prompted boxes that feed SAM
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs built on SAM masks
- [Clio](clio.md) — task-driven open-vocabulary mapping consumer of SAM-style masks
- [ConceptFusion](conceptfusion.md) — open-set multimodal 3D mapping
