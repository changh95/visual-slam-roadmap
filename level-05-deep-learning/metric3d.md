# Metric3D

> Yin 2023 · [Paper](https://arxiv.org/abs/2307.10984)

**One-line summary** — Zero-shot *metric* monocular depth across thousands of different cameras, achieved by transforming every training image (or its label) into a canonical camera space that removes the focal-length ambiguity.

## Problem

Single-image metric depth is trapped between two failure modes. State-of-the-art metric models can only handle a single camera model and cannot train on mixed data because of metric ambiguity: from a pinhole projection, an object of real size $\hat{S}$ imaged at size $\hat{S}'$ satisfies

$$d_a = \hat{S}\,\frac{\hat{f}}{\hat{S}'} = \hat{S}\cdot\alpha$$

so the same pixel pattern corresponds to different metric depths under different focal lengths $\hat{f}$ (sensor and pixel size, by contrast, are shown not to matter). Models trained on large mixed datasets (MiDaS-style) achieve zero-shot generalization only by retreating to affine-invariant depth, which cannot recover real-world scale. Metric3D shows that the key to a zero-shot metric model is combining large-scale mixed-data training with an explicit resolution of this camera ambiguity.

## Method & architecture

**Canonical camera space transformation (CSTM).** Fix a canonical focal length $f^c$ and transform all training data as if captured by that camera, in one of two equivalent ways:

- *CSTM_label*: keep the image, scale the ground-truth depth by $\omega_d = \frac{f^c}{f}$, i.e. $\mathbf{D}^*_c = \omega_d \mathbf{D}^*$;
- *CSTM_image*: resize the image (and optical center) by $\omega_r = \frac{f^c}{f}$, i.e. $\mathbf{I}_c = \mathcal{T}(\mathbf{I}, \omega_r)$, labels resized without scaling.

A random crop follows (it only changes FOV and optical center, not the metric). The network $\mathcal{N}_d$ is trained in canonical space, $\min_\theta \left|\mathcal{N}_d(\mathbf{I}_c, \theta) - \mathbf{D}^*_c\right|$, and at inference a **de-canonicalization** converts the prediction back to the real camera — e.g. $\mathbf{D} = \frac{1}{\omega_d}\mathbf{D}_c$ for CSTM_label. Only the focal length is needed at test time; the module plugs into any existing monocular depth model.

**Random proposal normalization loss (RPNL).** Whole-image scale-shift normalization squeezes fine-grained local depth contrast, so $M=32$ patches $p_i$ (0.125–0.5 of image size) are randomly cropped and each is normalized by median absolute deviation before an L1 comparison:

$$L_{RPNL} = \frac{1}{MN}\sum_{p_i}^{M}\sum_{j}^{N}\left|\frac{d^*_{p_i,j}-\mu(d^*_{p_i,j})}{\frac{1}{N}\sum_j |d^*_{p_i,j}-\mu(d^*_{p_i,j})|} - \frac{d_{p_i,j}-\mu(d_{p_i,j})}{\frac{1}{N}\sum_j |d_{p_i,j}-\mu(d_{p_i,j})|}\right|$$

with $\mu(\cdot)$ the median. The overall loss is $L = L_{PWN} + L_{VNL} + L_{silog} + L_{RPNL}$ (pair-wise normal regression, virtual normal, scale-invariant log, plus RPNL).

**Backbone and training.** A UNet with a ConvNeXt-Large encoder (ImageNet-22K initialized), trained on 11 public RGB-D datasets — over 8M images spanning more than 10K cameras, all with known intrinsics — balanced per mini-batch, at $512\times 960$ crops, 500K iterations on 48 A100 GPUs. Without CSTM the same model fails to converge on mixed metric data; encoding intrinsics as extra input channels (CamConvs) trains but performs clearly worse.

## Results

Metric3D achieves state-of-the-art performance on 7 zero-shot benchmarks and won the 2nd Monocular Depth Estimation Challenge. Zero-shot (never trained on either dataset), CSTM_label reaches $\delta_1$ 0.944 / AbsRel 0.083 on NYUv2 and $\delta_1$ 0.964 / AbsRel 0.058 on KITTI — comparable to fully supervised in-domain SOTA (NeWCRFs: 0.922 / 0.095 and 0.974 / 0.052). Metric point clouds from single images enable metrology in the wild on Flickr photos with only metadata intrinsics. For SLAM, naively feeding its metric depth to Droid-SLAM on KITTI odometry slashes translational drift $t_{rel}$: Seq 00 from 33.9 to 1.44, Seq 02 from 34.88 to 2.64, Seq 05 from 23.4 to 1.44, Seq 09 from 21.7 to 1.63 — far below ORB-SLAM2 (e.g. 11.43 on Seq 00) — while also enabling metric-scale dense mapping; gains on the small indoor ETH3D SLAM scenes are smaller.

## Why it matters for SLAM

SLAM needs *metric* depth — relative depth cannot anchor scale for monocular systems or feed metric map fusion. Metric3D's canonical-camera normalization became the standard recipe for camera-agnostic metric depth (adopted by UniDepth, Depth Pro, and others; Metric3D v2 added a ViT backbone and surface normals) and enables plug-and-play depth priors for whatever camera your robot happens to carry, without per-camera fine-tuning. Its own experiments show the payoff directly: a monocular SLAM system with its depth behaves like RGB-D SLAM, with scale drift largely eliminated.

## Related

- [MiDaS](midas.md) — relative-depth baseline that ignores scale
- [ZoeDepth](zoedepth.md) — the metric-bins alternative route to metric depth
- [Depth Anything V2](depth-anything-v2.md) — data-scaling successor in the depth foundation-model line
- [DROID-SLAM](droid-slam.md) — the SLAM system Metric3D plugs its depth into on KITTI
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md) — the intrinsics that create the ambiguity
