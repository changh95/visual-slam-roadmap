# DM-VIO
> von Stumberg 2022 · [Paper](https://arxiv.org/abs/2201.04114)

**One-line summary** — A direct (DSO-based) monocular VIO built on two new techniques — *delayed marginalization* and *pose graph bundle adjustment (PGBA)* for IMU initialization — that outperforms even stereo-inertial systems with a single camera and IMU.

## Problem
Marginalization keeps sliding-window VIO real-time, but "it cannot easily be reversed, and linearization points of connected variables have to be fixed" (First-Estimates Jacobians). This is especially painful in monocular VIO, where the scale is connected to the marginalization prior as soon as the first keyframe is marginalized — yet may still change drastically, since scale is unobservable under constant-velocity motion (common in cars). Prior systems either ran visual-only + separate IMU init (losing photometric uncertainty) or, like VI-DSO, initialized immediately with arbitrary scale and used lossy *dynamic* marginalization. DM-VIO answers three questions with one mechanism: how to capture full visual uncertainty in the initializer, how to transfer it into the main system, and how to keep the prior consistent when scale changes.

## Method & architecture
The core is a visual-inertial bundle adjustment over all active keyframes, minimized with Levenberg-Marquardt (photometric part SIMD-accelerated from DSO, other factors in GTSAM):

$$E(\mathbf{s}) = W(e_{\text{photo}}) \cdot E_{\text{photo}} + E_{\text{imu}} + E_{\text{prior}}$$

- **Photometric energy (DSO-style).** Each active keyframe $i \in \mathcal{F}$ hosts points $\mathbf{p}$ projected into observing frames $j$:
  $$E_{\mathbf{p}j} = \sum_{\mathbf{p} \in \mathcal{N}_{\mathbf{p}}} \omega_{\mathbf{p}} \left\lVert (I_j[\mathbf{p}'] - b_j) - \frac{t_j e^{a_j}}{t_i e^{a_i}} (I_i[\mathbf{p}] - b_i) \right\rVert_{\gamma},$$
  with affine brightness parameters $a, b$, exposure times $t$, and Huber norm $\lVert\cdot\rVert_\gamma$.
- **Dynamic photometric weight.** With $e_{\text{photo}} = \sqrt{E_{\text{photo}}/n_{\text{residuals}}}$, the weight $W(e_{\text{photo}}) = \lambda \cdot (\theta/e_{\text{photo}})^2$ if $e_{\text{photo}} \geq \theta$ (else $\lambda$), with $\theta = 8$. Unlike the per-point Huber norm, this downweights the *whole image* when quality is bad, shifting trust to the IMU.
- **IMU factors.** On-manifold preintegration predicts state $\widehat{\mathbf{s}}_j^I$ with covariance $\widehat{\Sigma}_j$:
  $$E_{\text{imu}}(\mathbf{s}_i^I, \mathbf{s}_j^I) = \left(\widehat{\mathbf{s}}_j^I \boxminus \mathbf{s}_j^I\right)^T \widehat{\Sigma}_j^{-1} \left(\widehat{\mathbf{s}}_j^I \boxminus \mathbf{s}_j^I\right)$$
- **Explicit scale and gravity.** Visual factors live in a scale-arbitrary frame $V$, IMU factors in the metric frame $I$; the state includes scale $s$ and rotation $\mathbf{R}_{V\_I}$ explicitly, so scale keeps being optimized in the main system after initialization.
- **Marginalization.** Old variables $\beta$ are removed via Schur complement, $\widehat{\mathbf{H}}_{\alpha\alpha} = \mathbf{H}_{\alpha\alpha} - \mathbf{H}_{\alpha\beta}\mathbf{H}_{\beta\beta}^{-1}\mathbf{H}_{\beta\alpha}$, keeping at most $N_f = 8$ keyframes with DSO's non-fixed-lag strategy.
- **Delayed marginalization.** A *second* factor graph replays the same marginalization order with delay $d = 100$ frames (points are still marginalized immediately, so each linearized photometric factor connects exactly $N_f$ keyframes; the Markov blanket — and hence runtime, measured at 0.44 ms — stays the same as the main graph). This graph can be (1) populated with IMU factors, (2) re-advanced to rebuild the prior, (3) used to relinearize FEJ values.
- **PGBA for IMU initialization.** IMU and bias factors are inserted into the delayed graph (at least $d - N_f + 2$ poses can receive them, i.e. ≥ 93 IMU factors) and all variables are optimized. Unlike pose graph optimization it uses "octonary" factors capturing the full BA probability distribution; unlike full BA it never relinearizes photometric terms — accurate *and* fast. Re-advancing the optimized graph then hands the main system a marginalization prior containing all visual and inertial information.
- **Multi-stage initializer.** Coarse IMU init (poses fixed, single bias; gravity from averaged accelerometer, scale = 1) → threshold on marginal scale covariance → PGBA init (with optional re-init under a tighter threshold $\theta_{\text{reinit}}$) → *marginalization replacement* whenever $\max(s, s_{\text{fej}})/\min(s, s_{\text{fej}}) > \theta_s$, rebuilding the prior with current linearization points.

## Results
Evaluated on EuRoC, TUM-VI, and 4Seasons (drone, handheld, automotive); 10 runs per EuRoC sequence, 5 elsewhere, in real-time mode on a 2013 MacBook Pro (i7 2.3 GHz, no GPU).

- **EuRoC**: average RMSE ATE **0.069 m** (mono, no loop closure) — best reported VIO at the time, beating stereo-inertial Basalt (0.072), VI-DSO (0.089, mono), VINS-Mono (0.184), OKVIS (0.231). Also the lowest average scale error reported on the dataset (0.6%).
- **TUM-VI**: mean drift **0.472%** vs. Basalt 0.939% (stereo) and VINS-Mono 1.700%; best result on 16 of 28 sequences (e.g. outdoors8: 2.11 m vs. Basalt 13.53 m). More robust overall than ORB-SLAM3 in cumulative plots, though ORB-SLAM3's loop closures win on some sequences.
- **4Seasons**: with long constant-velocity stretches where mono scale is unobservable, DM-VIO still outperforms stereo-inertial ORB-SLAM3 and Basalt.
- Runtime: tracking 10.34 ms, keyframe processing 53.67 ms; delayed marginalization adds only 0.44 ms (0.8%) to the keyframe thread.

## Why it matters for SLAM
DM-VIO closed the gap between direct and feature-based VIO: a monocular photometric system with a well-designed marginalization and initialization strategy can beat feature-based *stereo*-inertial pipelines. It is the culmination of the TUM direct-method line (DSO → VI-DSO → DM-VIO) and the system to study for how marginalization consistency issues (FEJ, unobservable scale) manifest — and are mitigated — in practice. Delayed marginalization is a general tool: the paper itself suggests keyframe reactivation for map reuse and PGBA for long-term loop closures.

## Related
- [DSO](../level-03-monocular-slam/dso.md) — the direct sparse odometry core.
- [VI-DSO](vi-dso.md) — the earlier direct visual-inertial predecessor from the same group.
- [Basalt](basalt.md) — the alternative fix for marginalization linearization error (nonlinear factor recovery).
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the IMU factor formulation used.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — background on the mechanism being "delayed."
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — the linear-algebra tool behind Eq. (10).
- [Observability](observability.md) — why monocular scale is initially unobservable and must be handled explicitly.
