# EFM3D

> Straub (Meta) 2024 · [Paper](https://arxiv.org/abs/2406.10224)

**One-line summary** — Meta Reality Labs benchmark for measuring progress toward 3D Egocentric Foundation Models — 3D object detection and surface regression on annotated Project Aria ego-video — plus EVL, a baseline that lifts frozen 2D foundation features into a gravity-aligned 3D voxel grid.

## Problem

Wearable computers create a new source of context for AI: egocentric sensor data that comes equipped with fine-grained 3D location information (poses, calibration, semi-dense SLAM points). This opens the opportunity for a class of *spatial* foundation models rooted in 3D space — what the authors term Egocentric Foundation Models (EFMs) — but progress cannot be measured without a benchmark built on high-quality, 3D-annotated egocentric data. Existing 3D datasets are RGB-D scanning sequences (ScanNet, ARKitScenes) or simulations whose motion aims to "cover" all surfaces; Aria data instead has one RGB + two greyscale streams, only sparse semi-dense depth, and genuine head-motion patterns — differences that break models designed for the RGB-D scanning regime.

## Method & architecture

**Dataset contributions.** (i) ~3M 3D oriented bounding boxes (OBBs) across 43 classes with per-image visibility metadata for the simulated Aria Synthetic Environments (ASE) dataset; (ii) Aria Everyday Objects (AEO), a real-world validation set of 26 scenes with 584 OBB instances over 9 classes, captured by non-experts for realistic egocentric motion; (iii) ground-truth meshes for the ASE validation split and the real Aria Digital Twin (ADT) dataset.

**EVL (Egocentric Voxel Lifting)** is a universal 3D backbone: a frozen 2D foundation model (DINOv2.5) runs on $T$ posed frames of each video stream; features are upsampled, then the centers of a local gravity-aligned $4m^3$ voxel grid (anchored at the latest gravity-aligned RGB pose) are projected into every image with the calibrated fisheye models and bilinearly sampled, giving a $T\times F\times D\times H\times W$ volume per stream. Features are aggregated over streams and time with mean and standard deviation ($2F\times D\times H\times W$). Semi-dense SLAM points contribute two binary masks — a surface-point mask and a freespace mask sampled along observation rays — concatenated onto the volume, which a 3D U-Net (8x downsample/upsample) then processes. Task heads run on the output volume:

- **3D OBB head** (proposal- and anchor-free, ImVoxelNet-inspired): per voxel a centerness score $v^{c}$, class distribution $v^{cls}$, and 7 box parameters $v^{obb}$ (size, center offset, yaw about gravity), filtered by 3D-IoU NMS. With $N_v$ voxels and focal loss FL:

$$L_{obj}=\frac{1}{N_{v}}\sum^{N_{v}}_{n} w_{c}\,\mathrm{FL}(v_{n}^{c},\widehat{v_{n}^{c}})+w_{iou}\,\mathrm{IoU}(v_{n}^{obb},\widehat{v_{n}^{obb}})+w_{cls}\,\mathrm{FL}(v_{n}^{cls},\widehat{v_{n}^{cls}})$$

- **Occupancy head** for surface regression, supervised by sampling one free, one surface, and one occupied point per GT depth value (target probabilities 0.0 / 0.5 / 1.0) plus a total-variation smoothness term:

$$L_{surf}=\frac{1}{N}\sum^{N}_{n}\mathrm{FL}(p_{\text{free}}^{n},0.0)+\mathrm{FL}(p_{\text{surf}}^{n},0.5)+\mathrm{FL}(p_{\text{occ}}^{n},1.0)$$

Training uses 1s 10Hz snippets, 6.25cm voxels ($64^3$) for detection and 4cm ($96^3$) for surfaces, Adam at $2e^{-4}$ with $w_{cent}=100$, $w_{iou}=10$, $w_{class}=1$; sequence-level evaluation persists predictions via OBB tracking/fusion and running-average occupancy fusion with marching cubes.

## Results

- **3D OBB detection** (mAP averaged over IoU thresholds 0.0–0.5): EVL reaches **0.40 snippet / 0.75 sequence mAP on ASE and 0.22 on real AEO**, vs ImVoxelNet 0.30/0.64/0.15, 3DETR 0.24/0.33/0.16, and Cube R-CNN (ASE-trained) 0.21/0.36/0.08. Sequence-level tracking roughly doubles snippet mAP for all methods.
- **Sim-to-real gap**: image-based models drop hardest on AEO (Cube R-CNN -32, ImVoxelNet -49, EVL -48 mAP) while point-only 3DETR drops just -17 mAP — but EVL is still best on both synthetic and real data.
- **Surface reconstruction** (ASE val): EVL achieves Acc 0.057m / Comp 0.877m / Prec 0.822 / Recall 0.405 (5cm threshold), vs NeuralRecon retrained on ASE at 0.212 / 1.103 / 0.512 / 0.241; on real ADT, EVL leads with 0.182m Acc and 0.594 Prec. Depth-based baselines (ZoeDepth, SimpleRecon, ConsistentDepth) fuse poorly due to scale ambiguity and noisy walls.
- Ablations: geometric augmentation, mean+std aggregation, and both point/freespace masks each measurably improve mAP (0.26 to 0.39 snippet mAP combined).

## Why it matters for SLAM

AR glasses are one of the main commercial drivers of SLAM, and EFM3D defines what "good 3D perception" means in that setting: metrically accurate, 3D-consistent understanding from a wearable rig whose motion is dictated by a human head. It signals where the field is heading — SLAM-provided poses, calibration, and semi-dense points become the scaffolding that makes 3D lifting possible (EVL's masks are literally SLAM outputs), and large egocentric perception models in turn feed semantic priors back into spatial tracking systems.

## Related

- [Foundation models](foundation-models.md) — the modeling paradigm this benchmark targets
- [Depth Anything](depth-anything.md) — a representative large-scale depth model of the kind evaluated here
- [DETR](detr.md) — the detection architecture family behind modern 3D detectors
- [Spatial AI](../level-11-world-models-spatial-ai/spatial-ai.md) — the broader vision of egocentric machine perception
