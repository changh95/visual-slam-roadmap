# Depth Anything 3

> Lin 2025 · [Paper](https://arxiv.org/abs/2511.10647)

**One-line summary** — A single plain transformer (vanilla DINOv2, no architectural specialization) trained on one minimal target — per-view depth maps plus per-pixel ray maps — that recovers consistent geometry and camera poses from any number of views, with or without known poses, beating VGGT by 35.7% in pose accuracy and 23.6% in geometric accuracy on average while also surpassing Depth Anything V2 at monocular depth.

## Problem

Monocular depth, SfM, MVS, and SLAM all recover 3D structure from images, differing often by just the number of input views — yet the field builds a specialized model for each. Recent unified models (DUSt3R, VGGT) suffer key limitations: complex bespoke architectures, joint multi-task optimization from scratch, and an inability to fully leverage large-scale pretrained backbones. DA3 asks two minimal-modeling questions and answers both affirmatively: (1) is there a *minimal set of prediction targets*, or is joint modeling across numerous 3D tasks necessary? (2) can a *single plain transformer* suffice? A second obstacle is data: real-world depth (COLMAP, active sensors) is noisy and incomplete, while clean synthetic depth alone does not generalize camera pose estimation to the real world.

## Method & architecture

**Depth-ray representation.** For $N_v$ input images the model predicts a depth map $\mathbf{D}_i$ and a ray map $\mathbf{M} \in \mathbb{R}^{H \times W \times 6}$ per view — each pixel stores a ray origin $\mathbf{t}$ and *unnormalized* direction $\mathbf{d} = \mathbf{R}\mathbf{K}^{-1}\mathbf{p}$ (magnitude preserves projection scale), sidestepping the orthogonality constraint of regressing $\mathbf{R}$ directly. A world point is then just an element-wise combination:

$$\mathbf{P} = \mathbf{t} + \mathbf{D}(u,v) \cdot \mathbf{d}$$

Camera parameters are recoverable from the ray map: the center is the mean of ray origins, and since $\mathbf{d}_{\text{cam}} = \mathbf{K}\mathbf{R}\,\mathbf{p}$ defines a homography $\mathbf{H} = \mathbf{K}\mathbf{R}$, solving $\mathbf{H}^{*} = \arg\min_{\lVert\mathbf{H}\rVert=1} \sum_{h,w} \lVert \mathbf{H}\mathbf{p}_{h,w} \times \mathbf{M}(h,w,3{:}) \rVert$ by DLT and RQ-decomposing yields $\mathbf{K}, \mathbf{R}$. Because that is costly at inference, a lightweight camera head predicts FOV $\mathbf{f} \in \mathbb{R}^2$, quaternion $\mathbf{q} \in \mathbb{R}^4$, translation $\mathbf{t} \in \mathbb{R}^3$ from one camera token per view (~0.1% of backbone compute). Ablations show depth+ray nearly doubles Auc3 over depth+camera and beats point-map or redundant multi-target setups.

- **Single transformer backbone**: a pretrained ViT (vanilla DINOv2) with *input-adaptive cross-view self-attention* — no architectural change, just token rearrangement. The first $L_s$ layers attend within each image; the remaining $L_g$ layers alternate cross-view and within-view attention ($L_s : L_g = 2{:}1$). With one image it naturally reduces to a monocular depth model at no extra cost.
- **Camera condition injection**: each view is prepended a camera token — an MLP encoding $\mathcal{E}_c(\mathbf{f}_i, \mathbf{q}_i, \mathbf{t}_i)$ when poses are known, a shared learnable token otherwise — so posed and unposed inputs are handled by one model (conditioning activated with probability 0.2 in training).
- **Dual-DPT head**: depth and ray branches share the reassembly modules and differ only in fusion layers, encouraging interaction between the two predictions; ablating it to two separate DPT heads consistently hurts.
- **Teacher-student training**: a monocular relative-depth teacher (DINOv2 + DPT, trained purely on synthetic data, predicting *exponential depth* rather than DA2's disparity) generates dense pseudo-labels for real-world data, aligned to sparse/noisy metric depth by RANSAC least-squares scale-shift: $(\hat{s},\hat{t}) = \arg\min_{s>0,t} \sum_p m_p (s\tilde{\mathbf{D}}_p + t - \mathbf{D}_p)^2$. This preserves pose-depth coherence while adding DA2-level detail.
- **Loss**: normalized by the mean L2 norm of valid points, $\mathcal{L} = \mathcal{L}_D + \mathcal{L}_M + \mathcal{L}_P + \beta \mathcal{L}_C + \alpha \mathcal{L}_{\text{grad}}$ with $\alpha = \beta = 1$ — confidence-weighted L1 terms on depth, ray map, and the composed point map, plus camera and depth-gradient losses.

Trained on public academic datasets only: 128 H100 GPUs, 200k steps, base resolution 504x504, 2-18 views per sample, switching from ground-truth to teacher labels at 120k steps. The same recipe yields a monocular student, a metric-depth model, and a feed-forward 3DGS variant (extra GS-DPT head predicting pixel-aligned Gaussian parameters).

## Results

- **New visual geometry benchmark** (HiRoom, ETH3D, DTU, 7Scenes, ScanNet++ — 89+ scenes): state of the art on 18 of 20 settings; on average **+35.7% camera pose accuracy and +23.6% geometric accuracy over prior SOTA VGGT** (abstract).
- **Pose (Auc3)**: DA3-Giant (1.10B) 80.3 on HiRoom vs VGGT (1.19B) 49.1 and Pi3 67.0; 85.0 vs 62.6 on ScanNet++ (33% relative gain over the second best); at least 8% relative Auc3 improvement over all baselines.
- **Reconstruction**: +25.1% relative over VGGT and +21.5% over Pi3 on average; DA3-Large (0.30B backbone), 3x smaller than VGGT, still beats it in 5 of 10 settings.
- **Monocular depth** ($\delta_1$): DA3 scores 95.3 KITTI / 97.4 NYU / 75.5 SINTEL / 98.6 ETH3D / 95.4 DIODE, outranking DA2 (94.6 / 97.9 / 77.2 / 86.5 / 95.2); the monocular student reaches 97.1 / 98.0 / 82.3 / 98.8 / 96.5, over 10% better than DA2 on ETH3D. DA3-metric is SOTA on ETH3D metric depth ($\delta_1$ 0.917 vs UniDepthv2's 0.863).
- **Feed-forward NVS**: fine-tuned DA3 hits 21.33 PSNR on DL3DV vs 20.96 for a VGGT backbone and 19.24 for specialized DepthSplat — geometry quality directly transfers to rendering quality.
- **Efficiency**: 37.6 FPS per image (DA3-Giant) vs VGGT's 34.1 on an A100 at 504x336; handles 900-1000 images on one 80 GB A100 vs VGGT's 400-500 (DA3-Large: 78.4 FPS, 1500-1600 images). A VGGT-style dual-transformer of comparable size drops to 79.8% of the single-backbone performance — the gap attributed to full pretraining vs two-thirds untrained blocks.

## Why it matters for SLAM

DA3 merges the two deep-geometry threads this roadmap tracks. As the successor to Depth Anything V2, it is a stronger drop-in monocular depth prior for dense mono SLAM — and its metric variant addresses the scale problem directly. As a DUSt3R/VGGT-style any-view model, it emits exactly the front-end quantities a SLAM system needs — consistent per-view depth plus camera poses fusable into a clean point cloud in one forward pass — with better pose accuracy and roughly double the view capacity of VGGT, which matters for submap-based systems like VGGT-SLAM (the paper cites such SLAM applications as consumers of this model family). The camera-token conditioning is notable for SLAM specifically: a tracker's pose estimates can be injected to improve geometry rather than being re-estimated from scratch. Honest caveats: DA3 is feed-forward reconstruction, not SLAM — there is no loop closure, relocalization, or global bundle adjustment, outputs are scale-normalized rather than metric (except the metric variant), and dynamic scenes are explicitly deferred to future work.

## Related

- [Depth Anything V2](depth-anything-v2.md) — the monocular predecessor whose synthetic-teacher / pseudo-labeled-student recipe DA3 generalizes to any-view geometry
- [DUSt3R](dust3r.md) — origin of feed-forward pointmap regression; DA3 argues depth+ray is the better minimal target
- [VGGT](vggt.md) — the prior any-view SOTA with a multi-stage architecture and redundant targets that DA3's plain transformer surpasses
