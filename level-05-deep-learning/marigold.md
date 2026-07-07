# Marigold

> Ke 2024 · [Paper](https://arxiv.org/abs/2312.02145)

**One-line summary** — Repurposes Stable Diffusion as an affine-invariant monocular depth estimator by fine-tuning only its U-Net to denoise depth latents conditioned on the image, trained purely on 74K synthetic samples in ~2.5 GPU-days, with per-pixel uncertainty available by ensembling multiple diffusion samples.

## Problem

Recovering 3D depth from a single image is geometrically ill-posed — it requires *scene understanding*, not just geometry. Discriminative depth estimators, from modest CNNs up to large Transformers, remain limited by the visual world seen during training and struggle zero-shot on unfamiliar content and layout. Meanwhile, Stable Diffusion has distilled internet-scale image collections (LAION-5B) into a rich prior of the visual world. Marigold asks: if a comprehensive representation of the visual world is the cornerstone of monocular depth, can a broadly applicable depth estimator be *derived* from a pretrained image diffusion model without unlearning that prior?

## Method & architecture

Depth estimation is posed as conditional denoising diffusion: model the conditional distribution $D(\mathbf{d}\,|\,\mathbf{x})$ over depth $\mathbf{d}\in\mathbb{R}^{W\times H}$ given RGB image $\mathbf{x}\in\mathbb{R}^{W\times H\times 3}$. The forward process corrupts depth at levels $t\in\{1,\dots,T\}$:

$$\mathbf{d}_t=\sqrt{\bar{\alpha}_t}\,\mathbf{d}_0+\sqrt{1-\bar{\alpha}_t}\,\boldsymbol{\epsilon},\qquad \boldsymbol{\epsilon}\sim\mathcal{N}(0,I),\ \ \bar{\alpha}_t:=\textstyle\prod_{s=1}^{t}(1-\beta_s)$$

and the U-Net $\boldsymbol{\epsilon}_\theta$ is trained with the standard denoising objective $\mathcal{L}=\mathbb{E}_{\mathbf{d}_0,\boldsymbol{\epsilon},t}\lVert\boldsymbol{\epsilon}-\hat{\boldsymbol{\epsilon}}\rVert_2^2$. Everything runs in Stable Diffusion v2's latent space, keeping that space intact:

- **Frozen VAE for both modalities.** The depth map is replicated into 3 channels, encoded by the unmodified SD VAE ($\mathbf{d}\approx\mathcal{D}(\mathcal{E}(\mathbf{d}))$ holds with negligible error); at inference the decoded 3 channels are averaged.
- **Conditioning by concatenation.** Image latent $\mathbf{z}^{(\mathbf{x})}$ and noisy depth latent are concatenated along the feature dimension; the U-Net's first layer is doubled in input channels, with the pretrained input weights duplicated and divided by two. Text conditioning is disabled. Only the U-Net is fine-tuned.
- **Affine-invariant normalization.** Ground-truth depth is mapped to $[-1,1]$ via $\tilde{\mathbf{d}}=\left(\frac{\mathbf{d}-\mathbf{d}_2}{\mathbf{d}_{98}-\mathbf{d}_2}-0.5\right)\times 2$, where $\mathbf{d}_2,\mathbf{d}_{98}$ are the 2% and 98% depth percentiles — a canonical scale/shift-free representation.
- **Synthetic-only training.** Hypersim (~54K indoor) + Virtual KITTI (~20K street) — dense, noise-free depth that the VAE can ingest (no invalid pixels). Training: 18K iterations, batch 32, Adam lr $3\cdot 10^{-5}$, ~2.5 days on one RTX 4090.
- **Annealed multi-resolution noise** during fine-tuning (superimposed multi-scale Gaussian noise, annealed to standard Gaussian at $t=0$) converges faster and substantially beats standard DDPM noise.
- **Inference & ensembling.** DDIM with 50 re-spaced steps from Gaussian noise; $N$ stochastic runs are merged by jointly optimizing per-run scale $\hat{s}_i$ and shift $\hat{t}_i$ to minimize pairwise distances $\lVert\hat{\mathbf{d}}'_i-\hat{\mathbf{d}}'_j\rVert_2$ plus a regularizer $\mathcal{R}=|\min(\mathbf{m})|+|1-\max(\mathbf{m})|$ on the pixel-wise-median merged map $\mathbf{m}$ — no ground truth needed; the spread across samples doubles as uncertainty.

## Results

Zero-shot on five real datasets never seen in training (metrics in %, AbsRel lower / $\delta_1$ higher better):

- **NYUv2**: AbsRel 5.5 / $\delta_1$ 96.4 (w/ ensemble) vs best prior HDN 6.9 / 94.8 — the >20% relative gain cited in the abstract.
- **KITTI**: 9.9 / 91.6 vs DPT 10.0 / 90.1; **ETH3D**: 6.5 / 96.0 vs DPT 7.8 / 94.6; **ScanNet**: 6.4 / 95.1; **DIODE**: 30.8 / 77.3.
- Average rank 1.4 across benchmarks vs 3.2 (HDN) and 3.9 (DPT) — using only 74K synthetic samples against baselines trained on 300K–12M real images.
- Ablations: multi-resolution + annealed noise improves NYUv2 AbsRel from 7.7 to 5.6; ensembling 10 predictions cuts NYUv2 AbsRel by ~8% (20 predictions ~9.5%, diminishing after 10); accuracy saturates at ~10 DDIM steps, fewer than image generation needs.

## Why it matters for SLAM

Marigold demonstrated that internet-scale generative priors transfer to geometric tasks, opening the diffusion-based depth family. For SLAM specifically, its sampled uncertainty is the standout feature: fusing monocular depth priors into a SLAM back-end requires a noise model, and Marigold provides one per pixel for free from the ensemble variance. Its iterative inference keeps it out of real-time front-ends, but it is valuable for offline mapping, dense prior generation, and as the fine-detail quality reference that faster models (e.g., Depth Anything V2) are compared against.

## Related

- [MiDaS](midas.md) — the multi-dataset relative-depth baseline
- [DPT](dpt.md) — discriminative transformer architecture for depth
- [Depth Anything V2](depth-anything-v2.md) — faster discriminative rival trained with synthetic data
- [Metric3D](metric3d.md) — metric-scale alternative for camera-aware depth
- [Align3R](align3r.md) — makes per-frame depth like Marigold's temporally consistent for video/SLAM
