# EKLT

> Gehrig 2020 · [Paper](https://rpg.ifi.uzh.ch/docs/IJCV19_Gehrig.pdf)

**One-line summary** — EKLT brings Lucas-Kanade (KLT) style feature tracking to event cameras: features are initialized on standard frames and then tracked asynchronously between frames using events, via a generative event model in a maximum-likelihood framework, giving high-rate, blur-free tracks that plug into conventional feature-based pipelines.

## Problem

KLT tracking is the workhorse front-end of feature-based VO/VIO: it tracks feature patches between consecutive frames by minimizing photometric error under brightness constancy. At high speeds this breaks down — features move many pixels between frames, motion blur destroys patch appearance, and the minimization diverges. Events fire with microsecond latency and no blur, carrying exactly the missing inter-frame motion signal — but the same scene pattern produces *different* events depending on motion direction, so establishing event correspondences across time is hard. EKLT sidesteps this by using the motion-independent frame as the reference and the motion-dependent events as measurements.

## Method & architecture

An ideal event camera triggers an event $e_k = (x_k, y_k, t_k, p_k)$ when the log-brightness $L$ at pixel $\mathbf{u}_k$ changes by a contrast threshold $\pm C$:

$$\Delta L(\mathbf{u}_k, t_k) = L(\mathbf{u}_k, t_k) - L(\mathbf{u}_k, t_k - \Delta t_k) = p_k C,$$

with polarity $p_k \in \{-1,+1\}$. Accumulating polarities over an interval $\tau$ gives an **observed brightness-increment image** $\Delta L(\mathbf{u}) = \sum_{t_k \in \tau} p_k C\, \delta(\mathbf{u} - \mathbf{u}_k)$. For small $\tau$, the generative model says increments are caused by gradients moving with optic flow $\mathbf{v}$:

$$\Delta L(\mathbf{u}) \approx -\nabla L(\mathbf{u}) \cdot \mathbf{v}(\mathbf{u})\, \tau,$$

so motion parallel to an edge produces no events, and motion perpendicular produces them at the highest rate. The **predicted increment** from the frame $\hat{L}$ (given at $t=0$) under a candidate warp $\mathbf{W}$ is $\Delta \hat{L}(\mathbf{u}; \mathbf{p}, \mathbf{v}) = -\nabla \hat{L}(\mathbf{W}(\mathbf{u};\mathbf{p})) \cdot \mathbf{v}\, \tau$. Assuming Gaussian error, maximum likelihood reduces to least-squares registration; since $C$ is unknown, EKLT compares *unit-norm* patches over the patch domain $\mathcal{P}$:

$$\min_{\mathbf{p},\mathbf{v}} \left\| \frac{\Delta L(\mathbf{u})}{\|\Delta L(\mathbf{u})\|} - \frac{\Delta \hat{L}(\mathbf{u};\mathbf{p},\mathbf{v})}{\|\Delta \hat{L}(\mathbf{u};\mathbf{p},\mathbf{v})\|} \right\|^2_{L^2(\mathcal{P})},$$

which cancels $C$ and $\tau$. The warp is a rigid-body motion in the image plane, $\mathbf{W}(\mathbf{u};\mathbf{p}) = \mathrm{R}(\mathbf{p})\mathbf{u} + \mathbf{t}(\mathbf{p})$ with $(\mathrm{R}, \mathbf{t}) \in SE(2)$, optimized with Ceres. The pipeline: detect Harris corners on the frame, extract intensity patches and $\nabla \hat{L}$; then for each incoming event, accumulate it into the patches it touches; once $N_e$ events have been collected on a patch, minimize the objective to update $\mathbf{p}$ and $\mathbf{v}$, reset the patch, and repeat. Tracking is therefore asynchronous — updates occur whenever $N_e$ events arrive (typically ~10× the frame rate), and each patch is tracked independently against its frame template, with implicit pixel-to-pixel data association (no event-to-feature ICP correspondences). Monitoring the minimum cost detects track loss and triggers re-initialization on a new frame.

## Results

- **Simulated data** (event camera simulator, 4 scenes): average tracking error of about 0.4 pixel — 0.20 px (sim_april_tags), 0.29 px (sim_3planes), 0.42 px (sim_rocks), 0.67 px (sim_3wall) — a lower bound in noise-free conditions.
- **Real data, 8 sequences**: shapes_6dof, checkerboard, boxes_6dof, poster_6dof (Event Camera Dataset), pipe_2, bicycles, outdoor_day1 (MVSEC), outdoor_forward5 (UZH-FPV), against four baselines (ICP on Canny point sets, EM-ICP, KLT on motion-compensated event frames, KLT on high-pass-filter reconstructed images). Ground truth from KLT on DAVIS frames.
- Track-normalized error: EKLT 0.64–1.21 px across all eight sequences (e.g., poster_6dof 0.64 vs 2.48 ICP, 3.10 EM-ICP, 0.97 KLT-MCEF, 1.18 KLT-HF; boxes_6dof 0.72 vs 4.59 ICP), outperforming all baselines in accuracy on every sequence.
- In black-and-white scenes EKLT is on average twice as accurate with twice longer tracks than ICP; feature age is comparable to the KLT-MCEF and KLT-HF baselines.
- Published in IJCV (2020); the "predict events from frame gradients, align against observed events" paradigm became the standard event-based feature tracker to compare against (e.g., EKLT-VIO uses it as a VIO front-end).

## Why it matters for SLAM

EKLT is the most practical entry point for event cameras into existing SLAM systems: rather than replacing the whole pipeline, it upgrades only the feature tracker, extending a classical VIO front-end into speed regimes where frame-based KLT loses its tracks. It also crystallized the "events + frames are complementary" principle at the feature level, the same philosophy Ultimate-SLAM applies at the estimator level and EDS applies to direct methods.

## Related

- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [ESVIO](esvio.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Event cameras (DVS)](event-cameras-dvs.md)
