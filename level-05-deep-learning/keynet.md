# KeyNet

> Barroso-Laguna 2019 · [Paper](https://arxiv.org/abs/1904.00889)

**One-line summary** — Learned keypoint detector (Key.Net) that combines handcrafted derivative filters with a few learned CNN layers in a shallow multi-scale architecture, trained to maximize keypoint repeatability across scales.

## Problem

Classical detectors (Harris, DoG) are built from handcrafted derivative filters and scale-space heuristics: interpretable and cheap, but not optimized for the property that matters downstream — repeatability under real viewpoint and scale changes. Fully learned detectors go to the other extreme, and by 2019 their advantage over handcrafted ones had *not* been clearly demonstrated: CNN detectors struggled especially with scale, wasting capacity rediscovering gradient structure. Key.Net asks whether a small network *seeded* with the right handcrafted structure can beat both.

## Method & architecture

**Handcrafted + learned filters.** The first layer is a frozen bank of 10 derivative-based filters in the spirit of Harris and Hessian: first-order maps $I_x$, $I_y$, $I_x I_y$, $I_x^2$, $I_y^2$ and second-order $I_{xx}$, $I_{yy}$, $I_{xy}$, $I_{xx} I_{yy}$, $I_{xy}^2$. These act as soft anchors; three learned blocks (each an $M=8$-filter 5x5 convolution + batch norm + ReLU) then localize, score and rank features. The hardcoded filters cut learnable parameters and stabilize training.

**Scale-space inside the network.** The input is processed at three pyramid levels (blurred and downsampled by 1.2), all streams sharing weights; feature maps are upsampled, concatenated, and fused by a final learned filter into a single response map $\mathcal{R}$. Ablation: one level gives 72.5 validation repeatability, three levels 79.1, more than three adds little.

**Index Proposal (IP) layer.** To train through keypoint extraction differentiably, each $N\times N$ window $w_i$ of $\mathcal{R}$ is turned into soft coordinates by a spatial softmax,

$$m_{i}(u,v)=\frac{e^{w_{i}(u,v)}}{\sum_{j,k}^{N}e^{w_{i}(j,k)}}, \qquad [x_{i},y_{i}]^{T}=\sum_{u,v}^{N}[W\odot m_{i},\;W^{T}\odot m_{i}]^{T}+c_{w}$$

a differentiable stand-in for non-maximum suppression ($W$ holds index values, $c_w$ is the window corner). With ground-truth homography $H_{b,a}$ between images $I_a, I_b$, the covariant-constraint loss regresses IP coordinates in one image onto NMS maxima in the other:

$$\mathcal{L}_{IP}(I_{a},I_{b},H_{a,b},N)=\sum_{i}\alpha_{i}\,\|[x_{i},y_{i}]^{T}_{a}-H_{b,a}[\hat{x}_{i},\hat{y}_{i}]^{T}_{b}\|^{2}, \quad \alpha_{i}=\mathcal{R}_{a}(x_{i},y_{i})+\mathcal{R}_{b}(\hat{x}_{i},\hat{y}_{i})$$

so only significant features contribute; losses are computed symmetrically in both directions.

**Multi-Scale Index Proposal (M-SIP).** The loss is averaged over window sizes $N_s\in\{8,16,24,32,40\}$ with weights $\lambda_s\in\{256,64,16,4,1\}$:

$$\mathcal{L}_{MSIP}(I_{a},I_{b},H_{a,b})=\sum_{s}\lambda_{s}\,\mathcal{L}_{IP}(I_{a},I_{b},H_{a,b},N_{s})$$

forcing the network to score highest the keypoints that stay dominant across context sizes — scoring and ranking emerge from the loss itself. Ablation: all five windows give 79.1 repeatability vs 70.5 for the 8x8 window alone.

**Cheap training data.** 12,000 image pairs of size 192x192 generated from ImageNet with random scale [0.5, 3.5], skew, rotation (±60°) and photometric jitter — ground-truth correspondence for free, no manual annotation. A siamese pair of Key.Nets converges in ~30 epochs (~2h on a GTX 1080 Ti).

## Results

- **HPatches repeatability** (top 1000 points, IoU error < 0.4): on viewpoint sequences Key.Net-SI is best with 60.5 (scale+location) / 73.2 (location-only), vs SuperPoint-TI 33.3/67.1, LF-Net-SI 32.3/62.2, and the best handcrafted MSER-SI 56.4/62.8. On illumination sequences the single-scale Key.Net-TI wins with 72.0, above TILDE-TI (70.4) which was designed for that setting.
- **Matching** (with a common HardNet descriptor): Key.Net+HardNet has the best viewpoint matching score, 38.4, edging SuperPoint (38.0 with its own descriptor, 37.4 with HardNet); LF-Net+HardNet leads on illumination (43.8 vs Key.Net's 39.7).
- **Complexity**: SuperPoint's detector uses ~940k learnable parameters — Key.Net has ~160x fewer, and Tiny-Key.Net (all handcrafted filters + one learned filter) ~3,100x fewer while still topping SuperPoint's viewpoint repeatability. Inference on a 600x600 image: 5.7 ms (Tiny) and 31 ms (Key.Net).

## Why it matters for SLAM

SLAM front-ends live or die by detector repeatability: if the same 3D point is not re-detected across frames, no descriptor can save the match. Key.Net showed that injecting classical detector priors (handcrafted filters, scale space) into a small learned model beats both purely handcrafted and purely learned detectors on repeatability while staying light enough for real-time pipelines — a design point directly relevant to embedded SLAM.

## Related

- [SuperPoint](superpoint.md) — self-supervised joint detector-descriptor
- [HardNet](hardnet.md) — learned descriptor commonly paired with Key.Net
- [R2D2](r2d2.md) — reliability-aware detection and description
- [DISK](disk.md) — reinforcement-learning-trained alternative
- [Keypoints](../level-02-getting-familiar/keypoints.md) — classical background on detection
- [Learned vs hand-crafted](learned-vs-hand-crafted.md) — the trade-off Key.Net deliberately straddles
