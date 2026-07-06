# BAD SLAM

> Schöps 2019 · [Paper](https://openaccess.thecvf.com/content_CVPR_2019/html/Schops_BAD_SLAM_Bundle_Adjusted_Direct_RGB-D_SLAM_CVPR_2019_paper.html)

**One-line summary** — A direct bundle-adjustment RGB-D SLAM that jointly optimizes camera poses and a dense surfel map in real time on the GPU, released together with the high-precision ETH3D SLAM benchmark.

## Key ideas

- **True BA for dense SLAM**: most RGB-D systems decouple tracking (frame-to-model alignment) from mapping (fusion); BAD SLAM instead treats surfel positions and camera poses as joint optimization variables — direct bundle adjustment over dense geometry.
- **Direct residuals**: the cost combines photometric and geometric (depth) residuals of surfels projected into keyframes, avoiding sparse feature extraction entirely.
- **GPU-accelerated solver**: the Gauss-Newton system is assembled and solved on the GPU with preconditioned conjugate gradient, making joint optimization over many surfels and keyframes feasible in real time.
- **Alternating optimization**: the system alternates between optimizing camera poses with surfels fixed and surfel attributes with poses fixed, converging in a few iterations per frame.
- **ETH3D SLAM benchmark**: the paper introduced a benchmark with much more accurate ground truth than existing RGB-D datasets, enabling meaningful evaluation of high-precision systems.

## Why it matters for SLAM

BAD SLAM demonstrated that the accuracy argument for bundle adjustment — long settled for sparse SLAM by Strasdat's "Why filter?" analysis — extends to fully dense RGB-D SLAM: joint pose-and-structure optimization removes the systematic biases of decoupled tracking-then-fusion pipelines. Its ETH3D benchmark became a standard evaluation suite for RGB-D SLAM. Reach for the ideas here when tracking-versus-mapping inconsistency, not sensor noise, is your accuracy bottleneck.

## Related

- [ElasticFusion](elasticfusion.md) — surfel mapping with decoupled frame-to-model tracking
- [BundleFusion](bundlefusion.md) — global consistency via sparse-feature BA and TSDF re-integration
- [DVO](dvo.md) — robust direct RGB-D alignment, a precursor of dense direct methods
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — the representation choice behind the system
- [DSO](../level-03-monocular-slam/dso.md) — the sparse direct BA counterpart in monocular SLAM

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
