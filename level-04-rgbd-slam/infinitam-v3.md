# InfiniTAM v3

> Prisacariu 2017 · [Paper](https://arxiv.org/abs/1708.00783)

**One-line summary** — A modular, cross-device open-source RGB-D reconstruction framework combining voxel-hashed TSDF (or surfel) mapping, robust ICP/RGB tracking, random-fern relocalization, and submap-based globally consistent reconstruction.

## Problem

Representing a reconstruction volumetrically as a TSDF gives the simplicity and efficiency that GPU implementations of KinectFusion-style systems enjoy — but a dense uniform grid is memory-intensive and limits scale, and the research community lacked a single fast, flexible pipeline in which camera tracking, scene representation, and data integration could be swapped and adapted. InfiniTAM is that framework; the v3 technical report documents its third iteration, whose headline additions are a robust tracker with failure detection, a random-ferns relocalizer, globally consistent TSDF reconstruction via submaps, and a surfel backend.

## Method & architecture

**Engine architecture.** A chain-of-responsibility design: stateless processing engines (tracking, allocation, integration, raycast, swapping) pass state objects, each engine split into an Abstract, a Device-Specific (CPU/CUDA/Metal), and a Device-Agnostic layer of shared inline C code. Two pipelines exist: `ITMBasicEngine` (standard fusion) and `ITMMultiEngine` (globally consistent, with loop closure).

**Voxel hashing.** Voxels (TSDF value, weight, optional RGB) are grouped into $8\times 8\times 8$ blocks stored in a contiguous voxel block array ($2^{18}$ entries); a hash table maps a block's corner coordinates $\mathbf{b}$ to its storage index via

$$h(\mathbf{b}) = \big( (b_x \cdot 73856093) \oplus (b_y \cdot 19349669) \oplus (b_z \cdot 83492791) \big) \bmod n$$

with collisions handled by an unordered excess list. Allocation backprojects, for each depth pixel $d$, the segment from $d-\mu$ to $d+\mu$ and allocates the intersected blocks in three non-blocking stages; integration then updates each visible voxel with the running weighted TSDF average as in KinectFusion.

**Tracking.** The classic `ITMDepthTracker` minimizes point-to-plane distances against a raycast of the model, $d = (\mathbf{R}\mathbf{p} + \mathbf{t} - \mathcal{V}(\bar{\mathbf{p}}))^{\top} \mathcal{N}(\bar{\mathbf{p}})$, over a resolution hierarchy; `ITMColorTracker` instead minimizes color differences $d = \| I(\pi(\mathbf{R}\,\mathcal{V}(i) + \mathbf{t})) - \mathcal{C}(i) \|_2$. New in v3, the default `ITMExtendedTracker` makes ICP robust: a Huber norm on per-pixel errors, depth-dependent down-weighting of far (noisier) measurements, outlier gating by distance threshold, and an optional frame-to-frame photometric term on intensities $I = 0.299R + 0.587G + 0.114B$ (Tukey loss, scaled by 0.3), all minimized with Levenberg-Marquardt coarse-to-fine. An SVM classifier on the ICP statistics (inlier percentage, Hessian determinant, residual) detects tracking failure and triggers relocalization.

**Relocalization (random ferns).** Each RGB-D image is encoded as $m$ binary code blocks of $n$ feature tests; similarity between images is the block-wise Hamming distance $\mathrm{BlockHD}(b_C^I, b_C^J) = \frac{1}{m}\sum_{k=1}^{m} (b_{F_k}^I \equiv b_{F_k}^J)$. Code tables map codes to keyframe IDs, so the nearest stored keyframe (and its pose) is retrieved in constant time — used both for pose recovery and loop-closure detection.

**Globally consistent reconstruction.** The scene is divided into rigid submaps (active ones tracked each frame, passive ones dormant; new submaps spawned as the camera leaves the current one). Inter-submap constraints accumulate from tracking and fern-detected loop closures, and a submap pose graph is optimized on a background thread. Rendering raycasts an implicit combined TSDF fused on the fly,

$$\hat{F}(\mathbf{X}) = \sum_i F_w(\mathbf{P}_i \mathbf{X})\, F(\mathbf{P}_i \mathbf{X})$$

where $\mathbf{P}_i$ is submap $i$'s pose and $F, F_w$ its TSDF and weight — the global map is a *view* over submaps, never explicitly built.

**Surfel backend & swapping.** A beta implementation of Keller et al.'s point-based fusion updates a matched surfel by confidence-weighted averaging, $\bar{\mathbf{v}}_k \leftarrow (\bar{c}_k \bar{\mathbf{v}}_k + \alpha \mathbf{v}^g) / (\bar{c}_k + \alpha)$, up to 5M surfels. A swapping engine with fixed-size host/device transfer buffers pages voxel blocks out of GPU memory and re-fuses them on return, so maps can exceed GPU capacity.

## Results

The v3 paper is a technical report on the framework's implementation, not a benchmark study — it contains no quantitative evaluation tables; the underlying globally-consistent submap method is evaluated in its companion publication (Kähler et al., ECCV 2016). The report's own claims are engineering ones: the pipeline runs in real time on GPU (the less-optimized surfel backend is "still real-time" on a good GPU); an off-the-shelf graphics card holds roughly a single room at 4 mm voxel resolution in active memory even with hashing, which the swapping subsystem extends to larger scenes; and the whole stack runs across CPU, CUDA, and Metal device layers with numerous sensors (Kinect, PrimeSense, RealSense, Structure). See the companion papers for full tracking-accuracy evaluation. Its lasting impact is as one of the most widely used, hackable open-source RGB-D reconstruction codebases.

## Why it matters for SLAM

InfiniTAM v3 packaged the post-KinectFusion state of the art — voxel hashing, robust frame-to-model tracking with failure detection, fern relocalization, submap-based loop closure — into one modular framework. If you want to understand how a production-quality dense SLAM pipeline is engineered (memory management, GPU kernels, swappable map backends, host-device paging), reading InfiniTAM's code is one of the best exercises at this level; it is also the reference implementation of the voxel-hashing storage scheme that scalable TSDF systems like BundleFusion build on.

## Related

- [KinectFusion](kinectfusion.md)
- [BundleFusion](bundlefusion.md)
- [ElasticFusion](elasticfusion.md)
- [Kintinuous](kintinuous.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
