# SpatialLM

> Mao 2025 · [Paper](https://github.com/manycore-research/SpatialLM)

**One-line summary** — Fine-tunes an off-the-shelf LLM to consume 3D point clouds and emit structured indoor models — walls, doors, windows, and oriented object boxes — as Python-dataclass scripts, grounding LLM reasoning in 3D spatial structure.

## Problem

Structured indoor modeling — recovering the architectural layout (walls, doors, windows) plus 3D object bounding boxes from raw RGBD scans — has been the domain of task-specific networks (RoomFormer's polygon queries, V-DETR's detection heads) or bespoke autoregressive decoders with domain-specific tokens (SceneScript). Meanwhile LLMs excel at reasoning and code generation but have no grounding in 3D space. Two things blocked simply fine-tuning an LLM for the task: no large, high-quality dataset pairing point clouds with structured 3D annotations, and no empirical understanding of how to align point-cloud input with an LLM. SpatialLM (tech report: [arXiv 2506.07491](https://arxiv.org/abs/2506.07491), NeurIPS 2025) tackles both.

## Method & architecture

- **Standard "Encoder–MLP–LLM" pipeline** — no specialized decoder. A point-cloud encoder compresses the scene into a short sequence of visual tokens for the LLM:

$$\mathbf{F} = \mathcal{E}(\mathbf{P}), \qquad \mathbf{P} \in \mathbb{R}^{N \times 6},\; \mathbf{F} \in \mathbb{R}^{K \times D},\; K \ll N,$$

  where each point carries XYZ + RGB. The chosen encoder is Sonata (an encoder-only, self-supervised Point Transformer V3 variant), a two-layer MLP projector, and Qwen2.5-0.5B as the base LLM (603.5M params total; released checkpoints also include a Llama-1B variant).
- **Scene description as Python code.** The output is plain text: dataclass-style scripts (e.g. `class Wall: a_x, a_y, a_z, b_x, b_y, b_z, height`) for walls/doors/windows and oriented bounding boxes over 59 object categories. Code is human-editable, extensible to new classes, and exploits the LLM's built-in coding ability; unlike SceneScript's domain-specific tokens, no custom vocabulary is needed.
- **SpatialLM dataset.** 12,328 synthetic scenes (54,778 rooms) parsed from professionally authored interior designs, rendered photo-realistically along simulated camera trajectories (images every 0.5 m); split 11,328/500/500 train/val/test. This dwarfs real annotated datasets (SceneCAD: 1,151 rooms with layout labels).
- **Empirical alignment study.** Naive token reduction of per-point DINOv2 features (voxelization or farthest-point sampling) collapses to near-zero object F1 — too much spatial information is lost; learned encoders (sparse 3DCNN, Sonata) work, with Sonata best (layout F1 84.6 vs 79.4 for 3DCNN at IoU@0.25). Doubling encoder spatial resolution (K ≈ 510 tokens) helps (object F1 49.4 → 61.1 at IoU@0.5); 4× hurts. Single-stage training with encoder, MLP, and LLM all trainable beats every two- and three-stage freezing schedule.
- **Evaluation metrics**: Hungarian-matched F1 at IoU thresholds 0.25/0.5 — 2D IoU of projected plane segments for layout, 3D IoU for object boxes (F1 rather than mAP because autoregressive models emit no confidence scores).

## Results

- **Layout estimation (Structured3D)**: SpatialLM pre-trained on its own dataset then fine-tuned on Structured3D reaches **F1 94.3 / 93.5** (IoU@0.25/0.5), beating the specialist RoomFormer (83.4/81.4) and SceneScript (90.4/89.2). Training on Structured3D alone gives only 32.6/18.1 — the large pre-training dataset is what makes LLM fine-tuning viable.
- **3D object detection (ScanNet, 18 classes, F1)**: pre-train + ScanNet fine-tune scores **65.6 / 52.6** vs SceneScript 49.1/36.8 and the specialist V-DETR 65.1/56.8 — ahead at IoU@0.25, behind at 0.5, with most misses on the smallest objects (picture, sink). ScanNet-only training collapses (2.9/0.7).
- **Zero-shot on video reconstructions**: on 107 indoor-tour videos reconstructed with MASt3R-SLAM — noisy, occluded, artifact-ridden point clouds — SpatialLM produces consistent layouts and full object boxes without fine-tuning, completing unseen regions (beds extended to the floor, plausible balcony/dining layouts) from context.

## Why it matters for SLAM

SpatialLM illustrates where semantic mapping is heading: from label-annotated point clouds (OpenScene, ConceptFusion) and scene graphs (ConceptGraphs) toward representations an LLM can directly parse and manipulate. A SLAM system provides the point cloud — the paper's own demo pipeline runs MASt3R-SLAM on monocular video — and SpatialLM turns it into a compact, editable, machine-readable description of the space, useful for scene editing, AR, robot navigation, digital twins, and embodied AI.

## Related

- [OpenScene](openscene.md)
- [ConceptFusion](conceptfusion.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md)
