# RoMa v2

> Edstedt 2025 · [Paper](https://arxiv.org/abs/2511.15706)

**One-line summary** — Successor to RoMa that pushes dense feature matching to be "harder, better, faster, denser": a DINOv3 multi-view Transformer matcher plus decoupled refiners with a custom CUDA correlation kernel, combining RoMa's robustness with UFM-like speed while adding per-pixel error covariance.

## Problem

Dense feature matching — estimating a warp $\mathbf{W}^{A\mapsto B}\in\mathbb{R}^{H^A\times W^A\times 2}$ and confidence $\mathbf{p}^{A\mapsto B}$ for every pixel — has become the gold standard for two-view correspondence, but existing matchers still fail on many hard real-world scenarios (RUBIK exposes RoMa's weakness under extreme viewpoint change) and the high-precision models are slow. UFM showed dense matching can be much faster, but fine-tunes its backbone (hurting extreme-appearance robustness on WxBS) and loses sub-pixel precision. RoMa v2 sets out to combine both strengths.

## Method & architecture

**Decoupled two-stage pipeline.** Matching and refinement are trained in two separate stages (UFM-style) instead of jointly with detached gradients (RoMa-style), enabling rapid experimentation: the coarse matcher trains 300k steps at batch 128 (~38M pairs), is then frozen, and three refiners train 300k steps at batch 64 (~19M pairs).

**Coarse matcher (stride 4).** Frozen DINOv3 ViT-L replaces DINOv2 (linear-probe EPE 19.0 vs 27.1, robustness 86.4% vs 77.0%). Features from both images pass through a ViT-B multi-view Transformer alternating frame-wise and global attention (VGGT-style, normalized-grid RoPE). RoMa's Gaussian Process match encoder is replaced by single-headed attention over the similarity matrix $\mathcal{S}_{mn}=\exp(\tfrac{1}{\tau}\,\text{cossim}(\mathbf{z}^A_m,\mathbf{z}^B_n))$, with an auxiliary dense NLL target on the best-matching patch:

$$\mathcal{L}_{\text{NLL}}=\sum_{m=1}^{M}-\log(\operatorname{Softmax}(\mathcal{S}_m)_{n^*}),$$

where $n^*$ is the patch closest to the ground-truth warp. A DPT head decodes match embeddings + DINOv3 features into warp and confidence at 1/4 resolution. Full matcher loss: $\mathcal{L}_{\text{matcher}}=\mathcal{L}_{\text{NLL}}+\mathcal{L}_{\text{warp}}+10^{-2}\mathcal{L}_{\text{overlap}}$.

**Refiners (strides 4, 2, 1) with a custom CUDA kernel.** RoMa-like ConvNet refiners, but the memory-hungry local-correlation op is rewritten as a custom CUDA/PyTorch-extension kernel and channel dims are powers of two. Warp supervision uses the generalized Charbonnier loss $\mathcal{L}_{\text{warp}}=(ic)^{\alpha}\left(\lVert\mathbf{r}\rVert^{2}/(ic)^{2}+1\right)^{\alpha/2}$ with $\alpha=0.5$, $c=10^{-3}$, stride $i\in\{4,2,1\}$; overlap uses pixel-wise BCE. An EMA of weights (decay 0.999) removes a random ±0.1 px sub-pixel prediction bias observed during training.

**Predictive covariance.** Unlike RoMa/UFM, refiners predict a per-pixel $2\times 2$ precision matrix of the residual $\mathbf{r}_\theta=\mathbf{W}^{A\mapsto B}_\theta-\mathbf{W}^{A\mapsto B}_{\text{GT}}$ via Cholesky factors ($\Sigma^{-1}=LL^{\top}$, Softplus-constrained diagonal), trained by Gaussian NLL $\mathcal{L}_{\text{precision}}=\frac{1}{2}\mathbf{r}^{\top}\Sigma^{-1}\mathbf{r}-\frac{1}{2}\log\det(\Sigma^{-1})+\log(2\pi)$ on covisible pixels with $\lVert\mathbf{r}\rVert<8$ px, accumulated hierarchically across strides.

**Curated data mixture.** Ten datasets instead of RoMa's MegaDepth-only: wide-baseline (MegaDepth, AerialMD, BlendedMVS, Hypersim, TartanAir v2, Map-Free, ScanNet++ v2) plus small-baseline (FlyingThings3D, VKITTI2, UnrealStereo4k), 5069 scenes total — aerial data buys robustness to large rotations and air-to-ground views; small-baseline data buys fine-grained detail and textureless-surface prediction.

## Results

- **MegaDepth-1500 pose**: 62.8 / 77.0 / 86.6 AUC@5°/10°/20° vs RoMa 62.6/76.7/86.3, UFM 41.5, MASt3R 42.4 — best of all matchers and feed-forward 3D models.
- **ScanNet-1500 pose**: 33.6 / 56.2 / 73.8 vs RoMa 31.8/53.4/70.9 — on par with VGGT (33.9) and MASt3R.
- **Dense matching (640×640, EPE lower better)**: MegaDepth 1.47 vs RoMa 2.34; TartanAir-WB 13.82 vs UFM 15.85 and RoMa 60.61; AerialMegaDepth 4.12 vs RoMa 25.05 (84% lower); FlyingThings3D 0.93; ScanNet++ v2 4.00; MapFree 2.03 — best across all six datasets.
- **Runtime (batch 8, H200)**: 30.9 pairs/s at 4.8 GB — 1.7× faster than RoMa (18.5 pairs/s) at similar memory; UFM is faster (43.0) but needs 16.2 GB.
- **WxBS**: 55.4 mAA@10px — below RoMa (60.8, the gap traced to the IR-to-RGB subset) but far above UFM (42.3). On the new SatAst astronaut-to-satellite benchmark: 37.0 AUC@10px vs RoMa 23.5, UFM 1.8.
- **Covariance payoff (Hypersim)**: covariance-weighted refinement lifts pose AUC@1° from 54.9 to 76.4 (~20 points).

## Why it matters for SLAM

Dense, certainty-aware matching is becoming the front-end of choice for relocalization, loop closure, and offline mapping under extreme appearance change, and the RoMa line is its reference implementation. Speed was the main obstacle to using RoMa-class matchers online in SLAM; RoMa v2's 1.7× speedup and memory-lean refinement narrow that gap. The per-pixel error covariance is directly consumable by SLAM back-ends — weighting residuals in RANSAC and pose refinement exactly as an estimation pipeline expects — and the model is the natural feature backbone for MASt3R-style two-view reconstruction.

## Related

- [RoMa](roma.md) — the predecessor and core architecture
- [LoFTR](loftr.md) — earlier detector-free matching lineage
- [Foundation models](foundation-models.md) — the source of robust coarse features
- [MASt3R](../level-03-monocular-slam/mast3r.md) — dense matching fused with 3D reconstruction
- [DeDoDe](dedode.md) — same group's decoupled sparse detector/descriptor
