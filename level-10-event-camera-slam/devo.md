# DEVO

> Klenk 2024 · [Paper](https://arxiv.org/abs/2312.09800)

**One-line summary** — DEVO (Deep Event Visual Odometry) adapts the DPVO-style learned sparse patch odometry architecture to monocular event streams, trained purely on *simulated* events, and generalizes to real event benchmarks where it cuts pose tracking error by up to 97% versus prior event-only methods.

## Problem

Event cameras promise camera tracking during high-speed motion and in adverse lighting, yet existing event-based *monocular* VO showed limited performance on recent benchmarks. To compensate, many systems added extra sensors — IMUs, stereo event cameras, or frame-based cameras — but those raise cost, complicate system requirements (space, power, calibration), and relying on a frame camera reintroduces exactly the motion-blur and HDR vulnerabilities events were meant to avoid. DEVO asks: what is the limit of general, real-world monocular event-only VO with no additional sensors?

## Method & architecture

**Event representation.** Events $(x_k, y_k, t_k, p_k)$ are binned into voxel grids $\mathbf{E}_t \in \mathbb{R}^{H\times W\times 5}$ (bilinear interpolation of event counts over 5 time bins, normalized to zero mean / unit variance), each paired during training with a ground-truth pose $\mathbf{T}_t \in \mathbb{SE}(3)$ and inverse depth map $\mathbf{d}_t$.

**DPVO-style backbone.** DEVO reuses DPVO's dynamic patch graph and recurrent update operator: sparse event patches on $\mathbf{E}_t$ are connected to neighboring voxel grids; the update operator iteratively predicts optical-flow revisions $\Delta\hat{\mathbf{f}}$ and confidence weights $\omega$, and a differentiable bundle adjustment (DBA) layer updates camera poses and patch depths over a sliding window of keyframes.

**Deep event patch selection (the key novelty).** Events cover the image plane sparsely, so random or gradient-based patch sampling wastes capacity on empty or noisy regions. A small CNN (three 3×3 conv+ReLU layers with 8/16/32 channels, then a 1-channel layer, 4×4 max-pooling, sigmoid) predicts a score map $\mathbf{S}_t \in [0,1]^{H/4 \times W/4}$ highlighting trackable coordinates. It is trained without score labels by the self-supervised loss

$$\mathcal{L}_{\text{score}} = \frac{1}{|\mathcal{E}|} \sum_{(k,j)\in\mathcal{E}} s_k\, r_{kj}\, (1 - \alpha \ln \omega_{kj}) - \ln \mathbf{S}_{\mathbf{P}},$$

which pushes scores $s_k$ down where flow residuals $r_{kj}$ are large or DBA weights $\omega_{kj}$ are small. The total loss is $\mathcal{L} = 0.05\,\mathcal{L}_{\text{score}} + 0.1\,\mathcal{L}_{\text{flow}} + 10\,\mathcal{L}_{\text{pose}}$. At inference, patches are drawn by **pooled multinomial sampling**: the score map is 4×4 average-pooled, coordinates are sampled from a multinomial over grid cells without replacement, then refined within each 4×4 window — more robust to score-map outliers than top-$P$ selection.

**Simulation-only training.** Events are simulated with ESIM on all TartanAir sequences using the event generation model $\Delta L(\mathbf{u}_k, t_k) = p_k C$, with contrast thresholds randomized per sequence, $C \sim \mathcal{U}(0.16, 0.34)$, plus photometric voxel augmentations to shrink the sim-to-real gap. Training: 240k iterations on two A40 GPUs, sequence length $N=15$, $P=80$ patches (~2.5 days).

## Results

- Evaluated on **seven real-world benchmarks** (UZH-FPV, VECtor, HKU, EDS, TUM-VIE, RPG, MVSEC), median of 5 runs, with identical parameters everywhere (only the keyframe threshold varies per dataset); metrics ATE [cm], rotation RMSE, MPE [%/m]. Headline: up to 97% lower pose tracking error than prior event-only methods.
- **UZH-FPV** (drone racing): best on 4 of 9 sequences even though all other successful methods use an IMU; DPVO and EVO fail on all sequences.
- **VECtor**: EVO and ESVO fail on 88% and 76% of sequences respectively; DEVO beats even ESVIO (stereo events + stereo frames + IMU) on 70% of sequences.
- **HKU**: best on 5 of 9 sequences; EVO and ESVO fail on all.
- **TUM-VIE**: at least 44% lower ATE than all event-only methods; **RPG**: at least 63% lower ATE than event-only methods, average ATE 88% lower than USLAM and 28% lower than EDS.
- Code, training, and event-data generation are open source (github.com/tum-vision/DEVO).

## Why it matters for SLAM

DEVO marks the moment the deep-VO revolution reached event cameras: classical event odometry (EVO, ESVO) relies on hand-designed alignment objectives that struggle with noise and sparsity, while DEVO's learned front-end absorbs those effects from data. Its simulation-only training strategy is arguably the most influential part — it shows a practical path around the event data bottleneck, opening event SLAM to the scaling dynamics that transformed frame-based methods.

## Related

- [DPVO](../level-03-monocular-slam/dpvo.md)
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)
- [ESVO](esvo.md)
- [EDS](eds.md)
- [Event representations](event-representations.md)
- [Challenges](challenges.md)
