# BAD SLAM

> Schöps 2019 · [Paper](https://openaccess.thecvf.com/content_CVPR_2019/html/Schops_BAD_SLAM_Bundle_Adjusted_Direct_RGB-D_SLAM_CVPR_2019_paper.html)

**One-line summary** — A direct bundle-adjustment RGB-D SLAM that jointly optimizes camera poses and a dense surfel map in real time on the GPU, released together with the high-precision ETH3D SLAM benchmark.

## Problem

Most RGB-D SLAM systems decouple tracking (frame-to-model alignment) from mapping (TSDF or surfel fusion) and optimize each separately — the map is built assuming poses are right, and poses are estimated assuming the map is right. True bundle adjustment, jointly optimizing all camera poses and 3D structure, yields higher accuracy but was considered impractical for dense representations. A second problem was evaluation: existing RGB-D benchmarks had limited ground-truth accuracy, making it hard to even measure the difference between high-precision systems.

## Key ideas

- **True BA for dense SLAM**: surfel positions and camera poses are treated as joint optimization variables — direct bundle adjustment over dense geometry, rather than the usual alternate-and-hope tracking/fusion loop.
- **Direct photometric + geometric residuals**: the cost sums, over each keyframe $k$ and each visible surfel $j$, a photometric term comparing the image intensity at the surfel's projection against the surfel's stored color, and a geometric term comparing the measured depth against the surfel's projected depth:
  $$E = \sum_{k}\sum_{j \in \mathcal{V}_k} \Big[ w_I\big(I_k(\pi(\mathbf{T}_k \mathbf{s}_j)) - c_j\big)^2 + w_D\big(D_k(\pi(\mathbf{T}_k \mathbf{s}_j)) - [\mathbf{T}_k \mathbf{s}_j]_z\big)^2 \Big]$$
  No sparse features are extracted anywhere in the pipeline.
- **GPU-accelerated solver**: the Gauss-Newton system is assembled and solved on the GPU with preconditioned conjugate gradient (PCG), making joint optimization over thousands of surfels and tens of keyframes feasible in real time.
- **Alternating optimization**: the system alternates between optimizing camera poses with surfels fixed and surfel attributes with poses fixed, converging within a few iterations per frame — a practical decomposition of the huge joint problem.
- **ETH3D SLAM benchmark**: the paper introduced a benchmark with far more accurate ground truth than prior RGB-D datasets, precise enough to reveal accuracy differences that older benchmarks could not resolve.

## Results & impact

BAD SLAM achieved the lowest trajectory error on its new ETH3D benchmark, outperforming ElasticFusion, BundleFusion, and ORB-SLAM2, while running in real time on a high-end GPU. Beyond the system itself, the ETH3D SLAM benchmark became a standard evaluation suite for RGB-D SLAM — and its high-precision ground truth exposed how many established systems were less robust than older benchmarks suggested.

## Why it matters for SLAM

BAD SLAM demonstrated that the accuracy argument for bundle adjustment — long settled for sparse SLAM by Strasdat's "Why filter?" analysis — extends to fully dense RGB-D SLAM: joint pose-and-structure optimization removes the systematic biases of decoupled tracking-then-fusion pipelines. Its ETH3D benchmark became a standard evaluation suite for RGB-D SLAM. Reach for the ideas here when tracking-versus-mapping inconsistency, not sensor noise, is your accuracy bottleneck.

## Related

- [ElasticFusion](elasticfusion.md) — surfel mapping with decoupled frame-to-model tracking
- [BundleFusion](bundlefusion.md) — global consistency via sparse-feature BA and TSDF re-integration
- [DVO](dvo.md) — robust direct RGB-D alignment, a precursor of dense direct methods
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — the representation choice behind the system
- [DSO](../level-03-monocular-slam/dso.md) — the sparse direct BA counterpart in monocular SLAM

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
