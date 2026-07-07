# DIFIX3D+

> Wu 2025 · [Paper](https://arxiv.org/abs/2503.01774)

**One-line summary** — Uses a single-step image diffusion model (Difix) to remove the floaters, spurious geometry, and blur that plague NeRF / 3DGS reconstructions, both by distilling cleaned pseudo-views back into the 3D representation during training and as a 76 ms neural enhancer at render time.

## Problem

Neural Radiance Fields and 3D Gaussian Splatting have revolutionized 3D reconstruction and novel-view synthesis, but photorealistic rendering from *extreme* novel viewpoints — views far from the captured trajectory — remains challenging: artifacts persist across both representations wherever the 3D model is underconstrained. Per-scene optimization cannot hallucinate plausible content it never observed, and methods that query a diffusion model at every training step scale poorly to large scenes. The fix must come from a learned image prior that is cheap enough to use inside and after reconstruction.

## Method & architecture

**Difix, the single-step fixer.** SD-Turbo is fine-tuned (frozen VAE encoder, LoRA-fine-tuned decoder, pix2pix-Turbo-style) into an image-to-image translator that maps a degraded rendered view $\tilde{I}$ plus clean reference views $I_{\text{ref}}$ to a refined view $\hat{I}$. The key insight: images degraded by rendering artifacts resemble the diffusion model's noisy training distribution at an *intermediate* noise level, so Difix runs single-step denoising at $\tau = 200$ instead of $\tau = 1000$ — validated empirically as the best setting.

**Reference mixing layer.** Novel and reference views are concatenated along a view axis and encoded to latents $\mathbf{z} \in \mathbb{R}^{V \times C \times H \times W}$; the self-attention layers are applied across the flattened view-plus-spatial dimension, inheriting the 2D attention weights while capturing cross-view cues (objects, color, texture).

**Losses.** $\mathcal{L} = \mathcal{L}_{\text{Recon}} + \mathcal{L}_{\text{LPIPS}} + 0.5\,\mathcal{L}_{\text{Gram}}$, where the style term is a Gram-matrix loss over VGG-16 features $\phi_l$ that encourages sharp detail:

$$\mathcal{L}_{\text{Gram}} = \frac{1}{L}\sum_{l=1}^{L} \beta_l \left\| G_l(\hat{I}) - G_l(I) \right\|_2, \qquad G_l(I) = \phi_l(I)^{\top}\phi_l(I) .$$

**Data curation.** Paired artifact/clean training data is manufactured by sparse reconstruction (train on every n-th frame), cycle reconstruction (re-render the original trajectory from a NeRF trained on a 1–6 m shifted trajectory), model underfitting (25–75% of the training schedule), and cross-camera references.

**Difix3D: progressive 3D updates.** Starting from the reference views, every 1.5k iterations the training camera poses are perturbed toward the target trajectory, the resulting novel views are rendered, cleaned by Difix, and added to the training set — progressively growing multi-view-consistent 3D cues toward extreme views. Distillation keeps the result 3D-consistent, and avoiding per-step diffusion queries makes it more than 10× faster than score-distillation-style approaches.

**Difix3D+: render-time polish.** Because Difix is single-step, it also runs as a final post-processing pass on every rendered frame — 76 ms on an NVIDIA A100 — removing residual artifacts that distillation and limited model capacity leave behind. The same trained model serves both NeRF and 3DGS backbones.

## Results

- Nerfbusters dataset: Difix3D+ (Nerfacto) reaches PSNR 18.32 / LPIPS 0.2789 / FID 49.44 vs the Nerfacto baseline's 17.29 / 0.4021 / 134.65; Difix3D+ (3DGS) 18.51 / 0.2637 / 41.77 vs 3DGS 17.66 / 0.3265 / 113.84 — roughly 0.1 lower LPIPS, ~3× lower FID, ~1 dB higher PSNR, and better than Nerfbusters, GANeRF, and NeRFLiX on every metric.
- DL3DV benchmark: FID 112.30 → 41.77 (Nerfacto) and 107.23 → 40.86 (3DGS).
- RDS automotive dataset (center camera trains, side cameras evaluated): PSNR 19.95 → 21.75, FID 91.38 → 73.08, beating NeRFLiX.
- Ablations: naive per-frame fixing without 3D updates flickers; non-incremental distillation degrades LPIPS/FID vs progressive updates; dropping noise from $\tau{=}1000$ to $\tau{=}200$ alone markedly improves LPIPS and FID. Overall the paper reports an average 2× FID improvement over baselines while maintaining 3D consistency.

## Why it matters for SLAM

Dense SLAM systems built on radiance fields or 3D Gaussians (SplaTAM, MonoGS, and successors) produce maps whose rendered novel views degrade quickly away from the camera trajectory — a real problem for AR preview, telepresence, and map inspection. DIFIX3D+ shows that a cheap 2D generative prior can clean up these renders without redesigning the mapping back-end, pointing toward a general pattern: geometric SLAM builds the map, and a feed-forward generative model polishes its outputs — fast enough (single-step) to sit in the render loop.

## Related

- [NeRF](nerf.md) — the neural rendering representation whose artifacts this line of work targets
- [Marigold](marigold.md) — another example of repurposing diffusion priors for 3D perception
- [MonoGS](monogs.md) — Gaussian-splatting SLAM producing renderable maps
- [NeRF-SLAM](nerf-slam.md) — radiance-field map built from real-time SLAM
- [SplaTAM](splatam.md) — 3DGS SLAM whose rendered maps benefit from this kind of post-processing
