# SAM

> Kirillov 2023 · [Paper](https://arxiv.org/abs/2304.02643)

**One-line summary** — Segment Anything: a promptable segmentation foundation model trained on 1B masks from 11M images that segments arbitrary objects zero-shot from point, box, or mask prompts.

## Problem

Segmentation research was fragmented into task-specific models — semantic, instance, panoptic, interactive — each requiring its own labeled dataset and training run, and none transferring zero-shot to new image distributions or new tasks. NLP had shown that a foundation model trained at sufficient scale on a promptable task can generalize to tasks it was never explicitly trained for.

The Segment Anything project asked what the equivalent task, model, and dataset would be for image segmentation — and how to collect training masks at a scale (billions) that no annotation effort had approached.

## Key ideas

- **Promptable segmentation as a foundation task**: One model answers "segment the thing indicated by this prompt" — where a prompt is a point, box, or mask. Designed and trained this way, it transfers zero-shot to new image distributions and tasks without fine-tuning.
- **Decoupled architecture**: A heavy ViT-H image encoder runs once per image; a lightweight prompt encoder + mask decoder then produce masks in milliseconds per prompt, enabling interactive use and cheap multi-prompt querying of the same image.
- **Ambiguity handling**: For an ambiguous prompt (a click on a shirt: the shirt, or the person?), the decoder outputs 3 candidate masks with IoU confidence scores instead of forcing a single answer.
- **Tasks by prompt composition**: Downstream problems — instance segmentation from detector boxes, "segment everything" via a point grid, interactive annotation — are solved by composing prompts, mirroring how NLP foundation models adapt to tasks through prompting rather than fine-tuning.
- **Model-in-the-loop data engine**: SA-1B's masks were collected in a loop where SAM assisted its own annotation — from model-assisted manual labeling to fully automatic mask generation — making billion-scale annotation feasible; this data flywheel is what makes it a foundation model.
- **SA-1B dataset**: Over 1 billion masks on 11M licensed and privacy-respecting images — by far the largest segmentation dataset to date — released to foster research into foundation models for computer vision.

## Results & impact

- Zero-shot performance is impressive across numerous tasks — often competitive with or even superior to prior fully supervised results, evaluated across dozens of segmentation benchmarks.
- SAM plus a text-prompted detector (Grounded SAM = Grounding DINO + SAM) became the standard recipe for open-vocabulary instance masks.
- SA-1B enabled a wave of downstream training of open-vocabulary and 3D perception models; SAM 2 extended the approach to video.
- Class-agnostic, promptable masks became a standard building block across robotics and 3D scene-understanding systems (ConceptGraphs, Clio, and related open-vocabulary mapping work).

## Why it matters for SLAM

SAM gave SLAM systems class-agnostic object masks on demand — the missing ingredient for open-vocabulary semantic mapping. Paired with a text-prompted detector (Grounded SAM = Grounding DINO + SAM), it powers 3D scene-graph and open-vocabulary mapping systems like ConceptGraphs and Clio, and provides clean masks for dynamic-object removal. Its video successor SAM 2 adds the temporal consistency SLAM actually needs across frames.

## Related

- [SAM 2](sam-2.md) — video extension with streaming memory
- [Grounding DINO](grounding-dino.md) — text-prompted boxes that feed SAM
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs built on SAM masks
- [Clio](clio.md) — task-driven open-vocabulary mapping consumer of SAM-style masks
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md) — open-set multimodal 3D mapping

[Back to Level 5](../README.md#level-5-applying-deep-learning)
