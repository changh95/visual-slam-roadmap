# PointFusion / DenseFusion

> Xu 2018 · [Paper](https://arxiv.org/abs/1711.10871) / Wang 2019 · [Paper](https://arxiv.org/abs/1901.04780)

**One-line summary** — Two influential RGB-D object pose networks that fuse image features with point-cloud features per point, forming the learned object front-end that object-level SLAM systems build on.

## Problem

Estimating 3D object pose from RGB-D data requires combining two very different modalities: dense, appearance-rich images and sparse, metrically accurate 3D points. Existing methods either used multi-stage pipelines or baked in sensor- and dataset-specific assumptions (e.g. collapsing depth into an extra image channel, or top-down LiDAR views that fail for pedestrians and indoor clutter), and post-hoc ICP refinement made accurate methods too slow for real-time use. What was needed was a conceptually simple architecture that processes each modality with the network suited to it and fuses the results — per point, so that partially occluded objects can still be posed from their visible fragments.

## Method & architecture

**PointFusion (Xu 2018)** is a two-stage 3D detector: an off-the-shelf 2D detector (Faster R-CNN) supplies crops, then per crop a ResNet-50 extracts an image feature while a PointNet variant (batch norm removed — absolute point coordinates matter for regression; inputs canonicalized by a rotation $R_c$ aligning the crop's viewing ray with the camera $z$-axis) processes up to 400 raw 3D points. A *global* fusion baseline concatenates the two features and regresses the 8 box corners directly with loss $L = \sum_i \mathrm{smoothL1}(\mathbf{x}_i^{*}, \mathbf{x}_i) + L_{\mathrm{stn}}$. The novel *dense* architecture instead uses every input point as a spatial anchor: each point's feature (concatenated with the global point feature and image feature into an $n \times 3136$ tensor) predicts the offsets from itself to the 8 corners, plus a confidence $c_i$, trained with the unsupervised scoring loss

$$L = \frac{1}{N} \sum_i \big( L^{i}_{\mathrm{offset}} \cdot c_i - w \log c_i \big) + L_{\mathrm{stn}}, \qquad w = 0.1$$

so the network learns which points yield good hypotheses; at test time the highest-scoring point's box wins. Predicting relative offsets removes the scene-scale variance (1 m to 100+ m in driving) from the regression target.

**DenseFusion (Wang 2019)** adapts this philosophy to 6-DoF pose of known objects: a segmentation network isolates each object; a CNN encoder-decoder maps the RGB crop to *per-pixel* appearance embeddings and a PointNet-like network (average pooling) maps the masked depth points to per-point geometric embeddings (both 128-D). Fusion is pixel-wise — each point's geometric feature is concatenated with the image feature at its projected pixel, enriched with a globally pooled feature — and each fused feature predicts a full pose $\hat{p}_i = [\hat{R}_i \mid \hat{t}_i]$ with confidence $c_i$. The per-pixel pose loss is the model-point distance

$$L^{p}_{i} = \frac{1}{M} \sum_j \| (R x_j + t) - (\hat{R}_i x_j + \hat{t}_i) \|$$

(for symmetric objects, distance to the *closest* transformed model point), combined exactly as above: $L = \frac{1}{N}\sum_i (L^{p}_{i} c_i - w \log c_i)$ with $w = 0.01$. A differentiable **iterative refinement** module replaces post-hoc ICP: the point cloud is transformed into the currently estimated canonical frame (so the input encodes the estimate), a residual pose is predicted, and after $K = 2$ iterations the final pose is the composition $\hat{p} = [R_K \mid t_K] \cdots [R_0 \mid t_0]$ — trainable end-to-end once the main network has converged.

## Results

PointFusion was the first model to perform better than or on par with the state of the art on both KITTI and SUN-RGBD with the same architecture and hyperparameters. On KITTI cars ($AP_{3D}$, easy/moderate/hard), the all-class model scores 77.92/63.00/53.27 vs MV3D's 71.29/62.68/56.56, and it beats MV3D by large margins on pedestrians (33.36/28.04/23.38) and cyclists (49.34/29.42/26.98); the dense-anchor design roughly doubles the global baseline (43.29 → 74.71 easy AP for cars). On SUN-RGBD (0.25 IoU) it reaches 45.38 mAP at 1.3 s/frame vs DSS's 42.1 at 19.6 s and COG's 47.63 at 10–30 min. DenseFusion, on YCB-Video (ADD-S), reaches 93.1 AUC / 96.8% < 2 cm with iterative refinement, beating PoseCNN+ICP (93.0 / 93.2) while being ~200× faster (0.06 s vs 10.6 s per frame, 16 FPS) and far exceeding PointFusion's global fusion (83.9 / 74.1); under increasing occlusion its accuracy drops only ~2% while PoseCNN+ICP and PointFusion degrade sharply. On LineMOD it reaches 94.3 mean ADD (86.2 without refinement). Deployed on a real robot, its poses yield 73% grasp success over 60 attempts.

## Why it matters for SLAM

Object-level SLAM needs a reliable way to turn raw RGB-D into 6-DoF object observations, and the PointFusion/DenseFusion line established the standard learned architecture for that role: heterogeneous CNN + PointNet feature extraction, per-point fusion, and confidence-weighted pose regression — an implicit robust estimator echoing RANSAC's role in classical pipelines. Systems like MoreFusion use exactly this style of learned pose prediction as initialization for multi-view, collision-aware refinement, and any modern object-SLAM pipeline is likely to feature a descendant of these networks in its front-end.

## Related

- [Fusion++](fusionpp.md)
- [MoreFusion](morefusion.md)
- [SLAM++](slampp.md)
- [DSP-SLAM](dsp-slam.md)
