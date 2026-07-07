# TartanVO

> Wang 2021 · [Paper](https://arxiv.org/abs/2011.00359)

**One-line summary** — The first learning-based visual odometry model that generalizes across multiple real-world datasets without fine-tuning, trained entirely on diverse synthetic data from TartanAir.

## Problem

Prior learning-based VO methods trained and tested on the same dataset (usually KITTI) and failed to generalize across domains, while classical geometric VO generalizes but struggles with motion blur, aggressive rotation, and lighting changes. The paper identifies two causes: (1) training data with insufficient *diversity* in scenes and motion patterns, and (2) ignoring two fundamental ambiguities from multi-view geometry — monocular scale ambiguity and dependence on camera intrinsics — so that "a model learned from one dataset would likely fail in another dataset, no matter how good the feature extractor is."

## Method & architecture

**Two-stage network.** Given consecutive undistorted images $\{I_t, I_{t+1}\}$, a matching module $M_\theta(I_t, I_{t+1})$ (pre-trained PWC-Net) estimates dense optical flow $F_t^{t+1}$, and a pose module $P_\phi(F_t^{t+1}, K)$ (a modified ResNet50 with separate translation and rotation heads, no batch norm) regresses the relative motion $\delta_t^{t+1} = (T, R)$, $T \in \mathbb{R}^3$, $R \in so(3)$. The end-to-end objective jointly supervises both:

$$L = \lambda L_f + L_p = \lambda \lVert M_\theta(I_t, I_{t+1}) - F_t^{t+1} \rVert + \lVert P_\phi(\hat{F}_t^{t+1}) - \delta_t^{t+1} \rVert$$

**Up-to-scale loss.** Since motion scale is unobservable from monocular images, only the translation *direction* is supervised (rotation loss unchanged). The normalized-distance form used in the paper is

$$L_p^{norm} = \left\lVert \frac{\hat{T}}{\max(\lVert\hat{T}\rVert, \epsilon)} - \frac{T}{\max(\lVert T \rVert, \epsilon)} \right\rVert + \lVert \hat{R} - R \rVert, \qquad \epsilon = 10^{-6}$$

(a cosine-similarity variant performs similarly). This closes the train/test translation-loss gap that scale-aware losses leave open.

**Intrinsics layer (IL).** To resolve intrinsics ambiguity, a 2-channel map $K^c \in \mathbb{R}^{2\times H\times W}$ built from the intrinsics $K = \{f_x, f_y, o_x, o_y\}$ is concatenated to the flow before the pose network:

$$K_x^c = (X_{ind} - o_x)/f_x, \qquad K_y^c = (Y_{ind} - o_y)/f_y$$

giving each flow vector its normalized 2D position — the same information geometric methods need to recover pose from matches. Since TartanAir has one fixed camera ($f_x = f_y = 320$, $o_x = 320$, $o_y = 240$), random cropping and resizing (RCR, resize factors up to 2.5) synthesizes cameras with FoV from $40^{\circ}$ to $90^{\circ}$.

**Training.** Trained only on TartanAir (>400,000 frames, 20 environments, 3 held out): first $P_\phi$ alone on ground-truth flow (100k iterations, batch 100), then jointly with $M_\theta$ (50k iterations, batch 64). Inference takes 40 ms per pair on a GTX 1080. The same weights are used on every test dataset — no fine-tuning anywhere.

## Results

- **Ablations**: the train/test generalization gap shrinks monotonically as training data grows from 20k to 100k to 400k frames; the IL is critical once intrinsics vary (test loss 0.0723 with IL vs 0.1999 without, under RCR), and training with RCR + IL generalizes better than single-intrinsics training.
- **KITTI** (zero-shot, two-frame VO only): average $t_{rel}$ 5.48% / $r_{rel}$ 3.05°/100 m over seqs 06/07/09/10 — better than DeepVO (5.81/6.41, trained on KITTI) and far better than geometry-based VISO2-M (15.04/7.62) and monocular ORB-SLAM's $t_{rel}$ (12.16), despite never seeing KITTI.
- **EuRoC** (zero-shot): ATE competitive with geometry-based methods without any backend optimization, and best of all compared methods on the two hardest sequences — VR1-03 (0.64 vs DSO 0.93; SVO/ORB-SLAM/LSD-SLAM fail) and VR2-03 (1.04 vs DSO 1.16).
- **TartanAir challenge sequences**: tracks all 16 hard test trajectories (avg ATE 1.92 on MH000-007) where ORB-SLAM fails on 2 of 8 and hits 21.47 on MH006.
- **Real IR camera**: on RealSense D435i infrared input it closely matches the trajectory of a dedicated T265 tracking camera (fisheye stereo + IMU), despite never seeing real or IR images in training.

## Why it matters for SLAM

TartanVO demonstrated that sim-to-real transfer is viable for visual odometry: a single model trained purely in simulation generalized to KITTI, EuRoC, and real IR footage, and held up in conditions (motion blur, aggressive MAV motion, low light) where classical geometric pipelines fail. Its two lasting lessons — train on massive diverse synthetic data, and bake geometric invariances (scale, intrinsics) into the model — flow directly into DROID-SLAM, DPVO, and MAC-VO, all trained on TartanAir; MAC-VO even uses TartanVO as its motion-model initializer.

## Related

- [DROID-SLAM](droid-slam.md) — learned SLAM that adopted a similar synthetic-training strategy
- [DPVO](dpvo.md) — sparse patch-based successor in learned visual odometry
- [MAC-VO](mac-vo.md) — learned stereo VO with metrics-aware covariance
- [DeepVO](deepvo.md) — earlier end-to-end pose regression that lacked cross-dataset generalization
- [PWC-Net](pwc-net.md) — the optical-flow backbone family used by TartanVO
- [RAFT](raft.md) — the flow architecture that powered the next generation of learned VO
