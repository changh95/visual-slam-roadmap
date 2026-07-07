# ESVO

> Zhou 2021 · [Paper](https://arxiv.org/abs/2007.15548)

**One-line summary** — ESVO is the first published event-based *stereo* visual odometry system: a parallel tracking-and-mapping design built entirely on time surfaces, where stereo spatio-temporal consistency yields metric semi-dense depth and pose comes from registering events against that map — in real time on a CPU.

## Problem

Monocular event VO recovers pose only up to scale; a stereo rig with a known baseline provides absolute metric depth without an IMU. But stereo matching for event cameras is non-trivial: temporal coincidence does not strictly hold at the pixel level (delays, jitter, differing event firing rates), and events carry no intensity to correlate — classical synchronized intensity-patch matching does not apply. ESVO set out to solve VO from a stereo event rig in natural scenes under general 6-DoF motion, with solutions that are principled *and* efficient enough for real-time operation on commodity hardware.

## Method & architecture

A parallel tracking-and-mapping system whose common currency is the **time surface** (TS): at each pixel $\mathbf{x}$, with $t_{\text{last}}(\mathbf{x})$ the timestamp of the last event there,

$$\mathcal{T}(\mathbf{x},t) \doteq \exp\!\left(-\frac{t - t_{\text{last}}(\mathbf{x})}{\eta}\right),$$

with decay rate $\eta = 30$ ms — a compact 2D map of recent edge motion, refreshed at 100 Hz.

- **Mapping — inverse depth per event**: for an event at $\mathbf{x}$ on the left camera, the inverse depth $\rho^\star = \arg\min_\rho C$ minimizes the temporal inconsistency $C \doteq \sum_i r_i^2(\rho)$ with signed per-pixel residuals $r_i(\rho) \doteq \mathcal{T}_{\text{left}}(\mathbf{x}_{1,i},t) - \mathcal{T}_{\text{right}}(\mathbf{x}_{2,i},t)$ between patches centered at the projections $\mathbf{x}_1, \mathbf{x}_2$ of the depth hypothesis into both time surfaces. This is forward-projection: a depth hypothesis *is* a candidate stereo match, so matching and triangulation happen in one step. Solved by Gauss-Newton updates $\Delta\rho = -(\mathbf{J}^{\top}\mathbf{r})/\|\mathbf{J}\|^{2}$, initialized by epipolar block matching.
- **Mapping — probabilistic fusion**: residuals empirically follow a Student's $t$ distribution, so each estimate carries uncertainty $\rho \sim St(\rho^\star,\, s_r^2/\|\mathbf{J}\|^2,\, \nu_r)$ with variance $\sigma_{\rho^\star}^{2} = \frac{\nu_r}{\nu_r - 2}\frac{s_r^{2}}{\|\mathbf{J}\|^{2}}$; robust IRLS replaces plain least squares. Estimates from 20 stereo observations are propagated to a common time and fused with a Student's-$t$ Bayesian filter (hypotheses compatible if $\mu_b - 2\sigma_b \leq \mu_a \leq \mu_b + 2\sigma_b$, else keep the lower-variance one), yielding a semi-dense inverse depth map at 20 Hz.
- **Tracking — TS negative as distance field**: the "negative" $\bar{\mathcal{T}}(\mathbf{x},t) = 1 - \mathcal{T}(\mathbf{x},t)$ acts as an anisotropic distance field to the current edge locations. The rig pose is the warp $\boldsymbol{\theta}^\star$ (Cayley rotation + translation) minimizing $\sum_{\mathbf{x}\in\mathcal{S}} \bigl(\bar{\mathcal{T}}_{\text{left}}(W(\mathbf{x},\rho;\boldsymbol{\theta}),k)\bigr)^2$ over the support $\mathcal{S}$ of the depth map — solved with the forward compositional Lucas-Kanade method, Huber-norm IRLS, and stochastic LM sampling ($N_p = 300$ points per iteration, ~5 iterations). Only the left TS is used (adding the right doubles cost for little accuracy).

## Results

- **Setups**: DAVIS240C rig (14.7 cm baseline), DAVIS346 drone data (MVSEC/upenn, 10 cm), a simulator, and the authors' own DAVIS346 rig (7.5 cm baseline); C++/ROS, real time on an Intel Core i7-8750H laptop CPU (mapping at ~20 Hz).
- **Mapping**: the Student's-$t$ IRLS solver beats standard LS (mean depth error 2.15 cm vs. 2.76 cm, std 1.29 vs. 2.94 cm on synthetic 3-plane data, plus ~52% more fused estimates). Against stereo baselines GTS, SGM, and CopNet on sequences with LiDAR ground truth, ESVO is best on every criterion — e.g., upenn_flying1: mean error 0.16 m and relative error 3.05% vs. 0.31 m / 5.64% (GTS), 0.31 m / 5.58% (SGM), 0.59 m / 10.93% (CopNet).
- **Full VO**: outperforms the event-based SGM+ICP baseline on all six sequences (e.g., ATE 13.9 cm vs. 95.8 cm on upenn_flying1); slightly behind stereo ORB-SLAM2 (no global BA) on the rpg handheld sequences but clearly better on the upenn drone sequences (ATE 13.9 vs. 49.8 cm and 11.1 vs. 50.2 cm), where frames suffer.
- Demonstrated VO in low-light and HDR conditions on the authors' own recordings; software, rig design, and datasets released open source (published in T-RO 2021), making ESVO the standard stereo event VO baseline.

## Why it matters for SLAM

ESVO demonstrated that the stereo recipe that matured frame-based SLAM (metric scale from a baseline, no IMU required) transfers to event cameras — but only after rethinking stereo matching around event timing rather than intensity. Its two key ideas — spatio-temporal consistency across stereo time surfaces for depth, and the time-surface negative as a distance field for tracking — became standard tools. It directly motivated ESVIO, which adds tightly-coupled IMU and image fusion on top of the stereo event design, and it remains the reference point that newer systems, including learned ones like DEVO, compare against.

## Related

- [EVO](evo.md)
- [ESVIO](esvio.md)
- [Event representations](event-representations.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
