# Masked Depth Modeling (LingBot-Depth)

> Tan 2026 · [Paper](https://arxiv.org/abs/2601.17895)

**One-line summary** — Treats the holes RGB-D sensors leave on glass, mirrors, and shiny metal as *natural masks* for masked-autoencoder-style pretraining: a ViT learns a joint RGB-depth embedding that reconstructs complete metric depth from corrupted sensor input, outperforming top-tier RGB-D cameras in precision and coverage.

## Problem

RGB-D cameras are the only modality that delivers metric scale, pixel-aligned dense geometry, and real-time acquisition simultaneously — but their stereo/structured-light matching fails under appearance ambiguity: low-texture surfaces, specular reflections, transparent materials, complex lighting. The result is severe data corruption and missing values exactly where indoor robots most need geometry. Rather than treating these failures as noise to discard, the paper reframes them: missing regions are "masked" signals that inherently reflect geometric ambiguities, so depth completion becomes a masked-modeling problem with the full RGB image as the rescue context.

## Method & architecture

**Masked Depth Modeling (MDM)** follows the MAE encoder-decoder paradigm but predicts depth instead of appearance:

- **Separated patch embedding.** RGB (3-channel) and depth (1-channel) get independent patch-embedding layers with patch size 14 (following DINOv2), producing spatially aligned token grids of $N = HW/14^2$ tokens per modality. Each token receives a shared learnable 2D spatial positional embedding plus a modality embedding (1 for RGB, 2 for depth).
- **Natural masking.** Depth patches that are entirely missing are always masked; mixed valid/invalid patches are masked with probability 0.75; random fully-valid patches top up the mask set to an overall 60–90% depth masking ratio. Because these natural masks arise from real ambiguities (not random dropout), reconstruction is deliberately harder — and the *unmasked* RGB image is always provided as condition. The same framework unifies two tasks by masking strategy alone: mask *all* depth tokens → pure monocular depth estimation; mask only invalid tokens → depth completion.
- **Encoder/decoder.** All RGB tokens + unmasked depth tokens + a [cls] token feed a 24-block ViT-Large (ViT-L/14, DINOv2-initialized). Latent depth tokens are then discarded; the [cls] token is broadcast-added to the contextual tokens, which drive a **ConvStack decoder** (adapted from MoGe): a pyramid of residual blocks and transposed convolutions (kernel 2, stride 2) upsampling from $(h,w)$ to $(16h,16w)$, with UV positional encodings injected at each scale. Supervision is a plain L1 loss on valid ground-truth pixels. Attention visualizations confirm depth queries attend to spatially corresponding RGB regions.
- **Training.** 250K iterations, global batch 1,024 on 128 GPUs (~7.5 days, BF16), AdamW ($\beta_1{=}0.9$, $\beta_2{=}0.999$, weight decay 0.05), encoder lr $1\times10^{-5}$ / decoder lr $1\times10^{-4}$ with warm-up and step decay; augmentations include color jitter, JPEG artifacts, motion blur, shot noise.
- **Data curation.** A synthetic Blender pipeline renders RGB + perfect depth + speckle-pattern stereo pairs (baseline sampled from 0.05–0.2 m, focal 16–28 mm) from 442 indoor scenes, then runs SGM stereo matching to produce *sensor-like* depth with realistic failure holes. A 3D-printed modular rig hosts commercial cameras (RealSense, Orbbec Gemini, ZED) for 2M real captures with FoundationStereo-derived pseudo-depth labels (left-right-checked). Together with seven public RGB-D datasets the corpus totals ~10M samples; 3M RGB-depth pairs (2M real + 1M simulated), code, and checkpoints are released.

## Results

- **Depth completion, Protocol 1** (block-wise masking + Kinect-style noise, four difficulty levels): best RMSE/REL on iBims, NYUv2, and DIODE at *every* level — e.g., NYUv2 extreme RMSE 0.181 vs PromptDA 0.324; iBims extreme 0.345 vs 0.607; over 40% RMSE reduction vs the best competitor on indoor benchmarks even in the extreme setting.
- **Protocol 2** (sparse SfM points as input, ETH3D): RMSE 0.192 indoor (47% below the best baseline, PriorDA 0.360) and 0.664 outdoor (38% below OMNI-DC 1.069), with $\delta_1$ 0.982 indoor.
- **As a pretrained backbone**: MoGe initialized with LingBot-Depth beats DINOv2 initialization across 10 monocular-depth benchmarks (e.g., NYUv2 affine-invariant REL 0.044 vs 0.056); as FoundationStereo's monocular prior it converges faster (epoch-5 HAMMER EPE 0.27 vs 0.46 vanilla) and ends best or comparable everywhere (epoch-15 Middlebury EPE 0.75, HAMMER 0.17).
- **Applications, zero post-training**: temporally consistent video depth completion at 30 FPS 640×480 where both Orbbec and ZED sensors fail (glass lobby, gym mirrors, aquarium tunnel); smoother SpatialTrackerV2 camera trajectories in glass-heavy scenes using refined depth; dexterous grasping success out of 20 trials: steel cup 17 vs 13 (raw depth), transparent cup 16 vs 12, toy car 16 vs 9, and a transparent storage box 10 vs entirely ungraspable with raw depth.

## Why it matters for SLAM

RGB-D SLAM systems (KinectFusion-style fusion, RGB-D odometry) implicitly trust the sensor; glass walls and mirrors are among their most common real-world failure cases, especially indoors where such surfaces are everywhere. LingBot-Depth acts as a drop-in learned sensor front-end — the paper's own camera-tracking experiment shows raw sensor depth causing severe drift in glassy scenes while the completed depth tracks cleanly — extending where RGB-D SLAM can operate without changing the SLAM algorithm itself. Its natural-mask pretraining idea also offers SLAM a joint RGB-depth representation aligned across modalities.

## Related

- [Depth from sensor](../level-04-rgbd-slam/depth-from-sensor.md) — how depth sensors work and where they fail
- [Depth Anything V2](depth-anything-v2.md) — monocular depth foundation model, also strong on reflective surfaces
- [Marigold](marigold.md) — generative depth estimation with fine detail
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md) — classic pipeline that consumes the corrected depth
