# NVIDIA Cosmos

> NVIDIA 2025 · [Paper](https://github.com/NVIDIA/Cosmos)

**One-line summary** — Cosmos is NVIDIA's World Foundation Model platform for Physical AI: a suite of pre-trained generative world models, tokenizers, and pipelines that produce physically plausible synthetic video/sensor data for training autonomous vehicles and robots.

## Problem

Physical AI needs to be trained digitally first — it needs a digital twin of itself (the policy model) and a digital twin of the world (the world model). Collecting diverse real sensor data, especially rare and dangerous scenarios, is slow and unsafe, while hand-built simulators suffer a sim-to-real gap. The Cosmos technical report ([arXiv:2501.03575](https://arxiv.org/abs/2501.03575)) positions a *world foundation model* (WFM) — a general-purpose, pre-trained generative model of how visual worlds evolve — as shared infrastructure that developers fine-tune into customized world models for their own Physical AI setups.

## Method & architecture

The platform has five major components: a video curator, video tokenizers, pre-trained WFMs, post-training examples, and guardrails.

- **Data curation**: a Ray-orchestrated pipeline (splitting, filtering, annotation, deduplication, sharding) extracts about 100M clips (2–60 s) from a 20M-hour raw video collection; a VLM captions each clip per 256 frames. Roughly $10^8$ clips feed pre-training and $10^7$ fine-tuning. All WFMs were trained on a cluster of 10,000 H100 GPUs over three months.
- **Cosmos Tokenizer**: a temporally causal encoder-decoder operating in a 2-level wavelet space, built from spatio-temporal factorized convolutions and causal self-attention. Causality means a single network tokenizes both images and videos and matches the causal setting of Physical AI. Continuous tokenizers use a vanilla autoencoder latent (dimension 16); discrete ones use Finite-Scalar Quantization with levels $(8,8,8,5,5,5)$, i.e., a vocabulary of 64,000.
- **Diffusion WFM family**: latent video diffusion models over continuous CV8×8×8 tokens, in Text2World (7B, 14B) and Video2World variants (fine-tuned to predict future video from past frames plus a text prompt). Training follows EDM denoising score matching — at noise level $\sigma$ the denoiser $D_\theta$ minimizes

$$\mathcal{L}(D_\theta,\sigma) = \mathbb{E}_{\mathbf{x}_0,\mathbf{n}}\Big[\big\lVert D_\theta(\mathbf{x}_0+\mathbf{n};\sigma) - \mathbf{x}_0 \big\rVert_2^2\Big]$$

  with $\mathbf{x}_0 \sim p_{\rm data}$ and $\mathbf{n} \sim \mathcal{N}(\mathbf{0},\sigma^2\mathbf{I})$, plus a learned uncertainty weighting $u(\sigma)$ over noise levels. Text conditioning uses T5-XXL; AdaLN-LoRA compresses DiT-style adaptive layer norm, cutting the 7B model from 11B parameters at equal quality.
- **Autoregressive WFM family**: Llama3-style transformers (4B, 12B) doing next-token prediction over discrete DV8×16×16 tokens,

$$\mathcal{L}_{NLL} = \sum_i -\log P(v_i \mid v_1, v_2, \dots, v_{i-1}; \Theta)$$

  with optional T5 cross-attention for text. A 7B diffusion decoder maps discrete tokens back into the continuous token space to remove quantization artifacts; Medusa speculative decoding gives up to 3.2× token throughput, and a low-resolution adaptation reaches real-time 10-FPS generation.
- **Post-training examples**: camera-controlled Video2World (a learned, pose-conditioned renderer), robotic manipulation (instruction- and action-conditioned prediction), and multi-view autonomous driving models fine-tuned from the base WFMs.

## Results

Cosmos Tokenizer outperforms prior tokenizers by a large margin — about +4 dB PSNR reconstruction on DAVIS videos, running up to 12× faster, encoding up to 8 s of 1080p video in one shot on a single A100 80GB. WFM evaluation focuses on 3D consistency and physics alignment: on 500 static-scene videos from RealEstate10K, Cosmos-Predict1-7B-Text2World reaches a Sampson epipolar error of 0.355 vs 0.841 for the VideoLDM baseline, with camera pose estimation success of 62.6% (68.4% for Video2World) vs 4.4% — real videos score 0.431 and 56.4% — and 3DGS-based novel-view synthesis PSNR of 33.02 vs 26.23 (real: 35.38), i.e., generated worlds are geometrically consistent at near-real-video level. The camera-control fine-tune beats CamCo in FID/FVD and in rotation/translation error of SfM-re-estimated trajectories against the commanded ones. Models and code are open-weight/open-source under the NVIDIA Open Model License.

## Why it matters for SLAM

Cosmos represents the industrialization of the world-model idea pioneered by systems like GAIA-1: vertically integrated hardware, simulation (Omniverse), and foundation models for Physical AI. Strikingly, its headline evaluation is pure multi-view geometry — Sampson error, SfM pose-estimation success, 3DGS view synthesis — the exact toolset of SLAM, used here to grade a generative model as a "world simulator". For SLAM, the direct relevance is training-data generation (synthetic multi-sensor sequences for learned SLAM components) and the pose-conditioned Video2World models that behave like learned renderers of imagined but geometrically consistent scenes.

## Related

- [World model](world-model.md)
- [GAIA-1](gaia-1.md)
- [Sora / DiT](sora-dit.md)
- [World Labs / Marble](world-labs-marble.md)
