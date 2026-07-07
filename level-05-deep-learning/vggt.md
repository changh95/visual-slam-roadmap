# VGGT

> Wang (Meta) 2025 · [Paper](https://arxiv.org/abs/2503.11651)

**One-line summary** — A single feed-forward Transformer that directly infers camera parameters, depth maps, dense pointmaps, and 3D point tracks from one to hundreds of views in under a second — CVPR 2025 Best Paper, and a template for replacing geometric pipelines with one network.

## Problem

3D vision models have typically been constrained to and specialized for single tasks: one network for depth, another for pose, another for point tracking — and full multi-view reconstruction required multi-stage pipelines with visual-geometry optimization (bundle adjustment, triangulation, DUSt3R-style global alignment) as post-processing. VGGT asks whether *one* network can directly infer all key 3D attributes of a scene from an arbitrary number of views, fast enough and accurately enough to make the optimization stage optional.

## Method & architecture

**One function, four outputs**: given $N$ images of a scene, the transformer $f$ predicts per frame

$$f\big((I_i)_{i=1}^N\big) = \big(\mathbf{g}_i, D_i, P_i, T_i\big)_{i=1}^N,$$

where $\mathbf{g}_i = [\mathbf{q}, \mathbf{t}, \mathbf{f}] \in \mathbb{R}^9$ packs rotation quaternion, translation, and field of view; $D_i \in \mathbb{R}^{H \times W}$ is the depth map; $P_i \in \mathbb{R}^{3 \times H \times W}$ the pointmap, expressed (as in DUSt3R) in the coordinate frame of the *first* camera; and $T_i \in \mathbb{R}^{C \times H \times W}$ are dense features consumed by a tracking module $\mathcal{T}$.

- **Alternating-Attention backbone**: images are patchified into tokens with DINOv2, then processed by ~1.2B parameters of standard self-attention — $L = 24$ pairs of *frame-wise* self-attention (tokens within each image) alternated with *global* self-attention (tokens across all frames). No cross-attention layers and minimal 3D inductive bias; multi-view geometry is learned, not built in.
- **Tokens and heads**: each frame gets a camera token and four register tokens; the first frame's tokens are distinct learnable parameters, which is how the network knows which camera defines the world frame (so $\mathbf{q}_1 = [0,0,0,1]$, $\mathbf{t}_1 = [0,0,0]$). Cameras are predicted from the output camera tokens by four self-attention layers + a linear layer; dense outputs come from a DPT head followed by 3×3 convolutions, together with aleatoric uncertainty maps $\Sigma_i^D, \Sigma_i^P$.
- **Tracking head**: a CoTracker2-style module correlates a query point's feature against all other frames' feature maps $T_i$ to output correspondences $\hat{\mathbf{y}}_{j,i}$ for arbitrary (unordered) image sets; $f$ and $\mathcal{T}$ are trained jointly.
- **Multi-task loss**:

$$\mathcal{L} = \mathcal{L}_{\text{camera}} + \mathcal{L}_{\text{depth}} + \mathcal{L}_{\text{pmap}} + \lambda \mathcal{L}_{\text{track}}, \qquad \lambda = 0.05,$$

  with Huber camera loss $\mathcal{L}_{\text{camera}} = \sum_i \|\hat{\mathbf{g}}_i - \mathbf{g}_i\|_\epsilon$ and uncertainty-weighted dense losses of the form $\sum_i \|\Sigma_i^D \odot (\hat{D}_i - D_i)\| + \|\Sigma_i^D \odot (\nabla \hat{D}_i - \nabla D_i)\| - \alpha \log \Sigma_i^D$ (likewise for pointmaps).
- **Over-complete predictions**: cameras, depths, and pointmaps are interrelated (pointmap = depth + camera), yet predicting all of them during training measurably improves each; at inference, composing the depth and camera heads yields *better* 3D points than the dedicated pointmap head.
- **Training**: 160K AdamW iterations on 64 A100s over nine days, 2–24 frames per batch at up to 518 px, on 17 datasets (Co3Dv2, BlendMVS, DL3DV, MegaDepth, Kubric, WildRGB, ScanNet, HyperSim, Mapillary, Habitat, Replica, and others) — comparable in scale and diversity to MASt3R's training mix.

## Results

- **Camera pose (10 random frames, AUC@30)**: CO3Dv2 88.2 and RealEstate10K (unseen in training) 85.3 in pure feed-forward mode at ~0.2 s — versus MASt3R 81.8 / 76.4 (~9 s), VGGSfM v2 83.4 / 78.9 (~10 s), and fast concurrent models Fast3R 82.5 / 72.7 and CUT3R 82.8 / 75.3. Feeding VGGT's predictions to bundle adjustment as initialization raises this to 91.8 / 93.5 in ~1.8 s (no triangulation/iterative refinement needed).
- **Multi-view depth (DTU, unknown cameras)**: overall Chamfer 0.382 vs DUSt3R 1.741 — approaching GeoMVSNet (0.295), which uses ground-truth cameras.
- **Pointmaps (ETH3D)**: overall 0.677 (depth+camera composition) vs DUSt3R 1.005 and MASt3R 0.826 with global alignment — while running in 0.2 s instead of 7–9 s.
- **Two-view matching (ScanNet-1500)**: AUC@5 33.9 vs RoMa 31.8 — despite the tracking head not being specialized for two-view matching.
- Pretrained VGGT features significantly enhance downstream tasks, including dynamic point tracking (fine-tuned CoTracker) and feed-forward novel view synthesis. Won the CVPR 2025 Best Paper award; code and models are public.

## Why it matters for SLAM

VGGT validated the feed-forward foundation-model paradigm for 3D vision: a well-trained Transformer can stand in for an entire SfM/SLAM front-end (detection, matching, pose estimation, triangulation, dense depth). It extends the DUSt3R/MASt3R pointmap lineage from image pairs to arbitrary numbers of views, and immediately spawned SLAM systems built around it — VGGT-SLAM, VGGT-Geo, and others — where the network provides instant geometry and a lightweight backend supplies consistency. If you are exploring where SLAM is heading after hand-crafted geometry, this is the paper to read.

## Related

- [DUSt3R](dust3r.md) — pairwise pointmap regression that started this paradigm
- [MASt3R](mast3r.md) — matching-aware successor to DUSt3R
- [VGGT-SLAM](vggt-slam.md) — SLAM system using VGGT as its front-end
- [VGGT-SLAM 2.0](vggt-slam-2-0.md) — real-time successor with a redesigned backend
- [VGGT-Geo](vggt-geo.md) — probabilistic fusion of VGGT priors for dense indoor SLAM
- [VoT](vot.md) — Transformer-based visual odometry in the same trend
