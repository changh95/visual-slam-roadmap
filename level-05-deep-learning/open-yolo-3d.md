# Open-YOLO 3D

> Boudjoghra 2024 · [Paper](https://arxiv.org/abs/2406.02548)

**One-line summary** — Fast open-vocabulary 3D instance segmentation that replaces the slow SAM + CLIP labeling pipeline with a real-time open-vocabulary 2D object detector, reaching a ~16x speedup over the prior state of the art.

## Problem

Open-vocabulary 3D instance segmentation showed strong promise, but at the cost of slow inference: methods like OpenMask3D and Open3DIS label class-agnostic 3D proposals by projecting them into many views, refining with SAM, encoding crops with CLIP, and aggregating 3D CLIP features — 5-10 minutes per scene. The key observation: the projection of a class-agnostic 3D instance into an image *already* carries the instance information, so per-view segmentation with SAM is redundant when the end goal is only to assign a text label to each 3D mask. A second bottleneck is visibility computation, done by iteratively counting visible points per mask per frame.

## Method & architecture

Pipeline: a 3D network proposes masks, a 2D detector votes on their labels across views.

- **Class-agnostic 3D proposals**: Mask3D (3D CNN backbone + transformer mask decoder) predicts $K_{3D}$ binary instance masks $M \in \mathbb{Z}_2^{K_{3D}\times N}$ over the $N$-point cloud (NMS-filtered, no DBSCAN to keep inference fast).
- **Low-Granularity (LG) label maps**: an open-vocabulary 2D detector (YOLO-World XL) produces boxes $(b_j, c_j)$ per RGB frame. Each frame becomes a label map $\mathcal{L}_i \in \mathbb{Z}^{W\times H}$, initialized to -1 (no class); box regions are painted with their class labels in decreasing order of weight $w_j = b_j^H + b_j^W$, so smaller (closer, visible) boxes overwrite larger ones.
- **Accelerated visibility computation (VAcc)**: all points are projected to all $N_f$ frames in one batched operation, $P^{2D} = (I \star E)\cdot P$ ($I, E$ intrinsics/extrinsics, $\star$ batch-matrix multiplication). In-frame and occlusion visibility are computed as tensor ops:

$$V^{f}=\mathbb{1}(0<P_{x}^{2D}<W)\odot\mathbb{1}(0<P_{y}^{2D}<H), \qquad V^{d}=\mathbb{1}(|P_{z}^{2D}-D_{z}|<\tau_{depth})$$

  where $\mathbb{1}$ is the indicator, $D_z$ the real depth from depth maps, $\tau_{depth}$ a threshold. Per-mask fractional visibility over all frames comes in a single shot:

$$V=\left((V^{f}\odot V^{d})\cdot M^{T}\right)\odot M_{count}^{-1}$$

  with $M_{count}$ the per-mask point counts.
- **Multi-View Prompt Distribution (MVPDist)**: for each 3D mask, take its top-k most-visible frames, look up the LG label-map values at its projected, non-occluded point coordinates, and pool them into a label distribution $\mathcal{D}_j$; the mask gets the class with the highest occurrence — occlusion and viewpoint ambiguity resolved by multi-view consensus, no CLIP feature aggregation at all.
- **Confidence score**: $s_m = s_{IoU}\cdot s_{class}$, combining the MVPDist class probability with the average multi-view IoU between the projected 3D mask's bounding box and the best-matching 2D detection.

## Results

ScanNet200 validation (312 scenes, 200 categories; Mask3D proposals; single A100 40GB):

- **Open-YOLO 3D: 24.7 mAP, 31.7 mAP50, 36.2 mAP25 at 21.8 s/scene** — vs Open3DIS with 2D+3D proposals at 23.7 mAP in 360.12 s (**~16x faster, +1.0 mAP; +2.3 mAP50**), Open3DIS 3D-only at 18.6 mAP (57.68 s), OpenMask3D at 15.4 mAP (553.87 s). Tail classes: 21.6 mAP vs OpenMask3D's 14.9. Closed-vocabulary Mask3D upper bound: 26.9 mAP.
- **Replica** (48 categories, proposals from ScanNet200-trained Mask3D — a generalization test): **23.7 mAP at 16.6 s/scene** vs Open3DIS at 18.5 mAP (187.97 s) and OpenMask3D at 13.1 mAP (547.32 s).
- Ablations with ground-truth proposals confirm both swaps help: replacing SAM-based high-granularity maps with LG label maps and replacing CLIP features with MVPDist each preserve or improve mAP while cutting time; code and models are public.

## Why it matters for SLAM

Open-vocabulary semantics is what lets a robot answer language queries about its map ("where is the fire extinguisher?"), but it only helps online robotics if it runs at interactive rates. Open-YOLO 3D demonstrated that a real-time 2D detector plus multi-view label voting can replace heavyweight SAM+CLIP pipelines for labeling 3D instances — turning per-scene labeling from minutes into seconds and making open-vocabulary semantic mapping practical to attach to a live SLAM system rather than an offline post-process. Its batched projection/visibility machinery is also directly reusable in any multi-view semantic fusion stack.

## Related

- [YOLO](yolo.md) — the real-time detection lineage it leverages
- [Grounding DINO](grounding-dino.md) — text-prompted open-vocabulary 2D detection
- [SAM](sam.md) — the segmentation foundation model it avoids at inference time
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs that benefit from fast labeling
- [OpenScene](openscene.md) — point-level open-vocabulary 3D understanding
- [Clio](clio.md) — task-driven open-set mapping that needs exactly this kind of fast labeling
