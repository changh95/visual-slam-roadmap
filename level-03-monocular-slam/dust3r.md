# DUSt3R

> Wang 2024 · [Paper](https://arxiv.org/abs/2312.14132)

**One-line summary** — Recast pairwise 3D reconstruction as direct regression of dense pointmaps from an image pair by a feed-forward Transformer, requiring no camera calibration, feature matching, or explicit geometric models.

## Problem

Multi-view stereo in the wild "requires to first estimate the camera parameters e.g. intrinsic and extrinsic parameters," which are "tedious and cumbersome to obtain, yet they are mandatory to triangulate corresponding pixels in 3D space." The whole classical pipeline — calibrate, detect, match, estimate poses, triangulate — is a chain of fragile stages, each of which can fail. DUSt3R ("Dense and Unconstrained Stereo 3D Reconstruction") takes "an opposite stance": reconstruct arbitrary image collections with *no* prior information about calibration or viewpoint poses, by regressing 3D structure directly.

## Key ideas

- **Pointmap representation**: for a pair $(I_1, I_2)$ the network outputs $\mathbf{X}_1^1, \mathbf{X}_2^1 \in \mathbb{R}^{H \times W \times 3}$ — per-pixel 3D coordinates expressed in the first camera's frame — "relaxing the hard constraints of usual projective camera models." No intrinsics enter the formulation at all.
- **Monocular and binocular unified**: the pointmap formulation "smoothly unifies the monocular and binocular reconstruction cases" — feed the same image twice and the network performs single-view depth estimation; feed two views and it performs stereo reconstruction.
- **Cross-attention Transformer on pretrained backbones**: a ViT encoder per image plus decoder blocks with cross-attention between views, "allowing us to leverage powerful pretrained models"; regression heads output pointmaps with per-pixel confidence maps.
- **Confidence-weighted regression loss**: trained on large mixed 3D datasets with $\mathcal{L} = \sum_v \sum_{\mathbf{p}} C_v(\mathbf{p}) \cdot \|\hat{\mathbf{X}}_v^1(\mathbf{p}) - \mathbf{X}_v^{1,gt}(\mathbf{p})\|$, so the network learns where it can and cannot be trusted across diverse cameras and scenes.
- **Global alignment for many views**: for $N > 2$ images, a "simple yet effective global alignment strategy" optimises all pairwise pointmaps into one common reference frame — an optimisation over rigid transforms and scale factors, much cheaper than full bundle adjustment.
- **Everything falls out as by-products**: from the aligned pointmaps one can "seamlessly recover" pixel matches, depth maps, and relative and absolute camera parameters — quantities that classical pipelines each compute with a dedicated algorithm.

## Results & impact

From the abstract: DUSt3R "set new SoTAs on monocular/multi-view depth estimation as well as relative pose estimation," unifying a range of 3D vision tasks in one model. Its deeper impact was paradigm-level: it demonstrated that a single feed-forward network trained on enough 3D data can replace the calibrate-detect-match-triangulate pipeline, launching the "3D foundation model" line — MASt3R (matching), MASt3R-SLAM and Spann3R (online operation), MonST3R (dynamic scenes), and the VGGT family (multi-view feed-forward) all build on its pointmap representation.

## Why it matters for SLAM

DUSt3R started the "3D foundation model" era of geometric vision: a single pre-trained network replacing the classical detect-match-triangulate pipeline, working even on uncalibrated images and as few as two views. It directly spawned MASt3R and MASt3R-SLAM, influenced feed-forward multi-view models like VGGT, and now anchors an entire branch of SLAM research where a learned pointmap regressor is the frontend and classical optimisation is the backend. Knowing its assumptions (offline pairing, global alignment cost) explains what the follow-up systems fix.

## Related

- [MASt3R](mast3r.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [VGGT](vggt.md)
- [COLMAP](colmap.md)
- [MonST3R](monst3r.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
