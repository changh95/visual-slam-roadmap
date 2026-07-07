# Ultimate-SLAM

> Vidal 2018 · [Paper](https://arxiv.org/abs/1709.06310)

**One-line summary** — Ultimate-SLAM is the first state estimation pipeline that tightly fuses events, standard frames, and IMU in one keyframe-based nonlinear optimization, exploiting the complementary strengths of the three sensors to stay accurate across HDR and high-speed scenarios where any one modality fails.

## Problem

No single sensor covers the whole operating envelope. Standard cameras provide instant, rich information most of the time — in low-speed, well-lit scenarios — but fail severely under fast motion (motion blur from synchronous exposure) and difficult lighting (their ~60 dB dynamic range vs. 140 dB for event cameras). Event cameras do not suffer from motion blur and have very high dynamic range, but output only little information when motion is limited, such as near-still hovering. The IMU provides high-rate dynamics but drifts without visual correction. Prior events+frames systems used frame intensity as a template to align events against — so they failed exactly where events have the advantage. Before this work, no pipeline had fused all three modalities tightly.

## Method & architecture

Built on the event-inertial pipeline of Rebecq et al. (BMVC 2017), extended with standard frames as a parallel visual modality:

- **Spatio-temporal event windows**: upon each standard frame at time $t_k$, a window $W_k = \{e_{j(t_k)-N+1}, \dots, e_{j(t_k)}\}$ of the last $N$ events is selected (window duration auto-adapts to event rate; $N = 20\,000$ in the quadrotor experiments).
- **Motion-compensated event frames**: each window is collapsed into a synthetic image $I_k(\mathbf{x}) = \sum_{e_i \in W_k} \delta(\mathbf{x} - \mathbf{x}'_i)$, where each event is warped to the reference camera frame using IMU-integrated incremental poses and scene depth: $\mathbf{x}'_i = \pi_0(T_{t_k, t_i}(Z(\mathbf{x}_i)\,\pi_0^{-1}(\mathbf{x}_i)))$, with $\pi_0$ the event-camera projection, $T_{t_l,t_m}$ the incremental transform from IMU integration, and $Z(\mathbf{x}_i)$ approximated by the median depth of visible landmarks.
- **Dual feature tracking**: FAST corners are detected and KLT-tracked *independently* on the motion-compensated event frames and on the standard frames (2 pyramid levels, $24\times24$ patches, $32\times32$ bucketing grid), producing two heterogeneous sets of tracks $\{\mathbf{z}^{0,j,k}\}$, $\{\mathbf{z}^{1,j,k}\}$; reliable tracks are linearly triangulated into persistent 3D landmarks.
- **Tightly-coupled back-end**: both track sets and IMU terms enter one joint cost over $M$ keyframes plus a sliding window of $K$ recent frames, solved with Ceres:

$$J = \sum_{i=0}^{1}\sum_{k=1}^{K}\sum_{j\in\mathcal{J}(i,k)} {\mathbf{e}^{i,j,k}}^{T}\mathbf{W}_r^{i,j,k}\,\mathbf{e}^{i,j,k} + \sum_{k=1}^{K-1} {\mathbf{e}_s^{k}}^{T}\mathbf{W}_s^{k}\,\mathbf{e}_s^{k}$$

with reprojection residuals $\mathbf{e}_r^{i,j,k} = \mathbf{z}^{i,j,k} - \pi_i(\mathbf{T}_{C_i S}^{k}\mathbf{T}_{SW}^{k}\,\mathbf{l}^{i,j})$ over sensor index $i$ (event / standard camera), frame $k$, landmark $j$, plus standard IMU kinematics-and-bias error terms $\mathbf{e}_s$. There is *no explicit switching policy* — the optimization naturally weights whichever modality is currently informative.
- **Practical details**: static initialization estimates initial pitch/roll and IMU biases; a strong zero-velocity prior is added whenever the event rate drops below ~$10^3$ events/s (near-still motion, when events nearly vanish).

## Results

- Evaluated on the **Event Camera Dataset** (DAVIS 240C: $240\times180$ event array + 24 Hz frames + 1 kHz IMU, hardware-synchronized), excluding rotation-only and IMU-less sequences; trajectories SE3-aligned over 5 s, errors reported as % of traveled distance.
- **Fr+E+I vs. single-modality variants of the same pipeline**: average position accuracy improvement of **130% over events+IMU** and **85% over frames+IMU**. Example mean position errors (Fr+E+I / E+I / Fr+I): dynamic_6dof 0.19 / 0.38 / 0.62%, hdr_boxes 0.37 / 0.67 / 0.78%, shapes_6dof 0.10 / 0.48 / 0.17%.
- **Vs. state-of-the-art E+I (Rebecq et al. 2017)**: better on almost all sequences, e.g., poster_translation 0.12% vs. 0.46%, shapes_6dof 0.10% vs. 0.42%.
- **First autonomous quadrotor flight using an event camera for state estimation**, running onboard an Odroid XU4 (2.0 GHz quad-core): (i) flying while the room light is switched off and on (frames go completely black, events keep tracking); (ii) fast circles in a low-lit room at up to 1.68 m/s ($\approx340$ pixels/s optical flow), where frames blur but event frames stay sharp; (iii) hovering, where event tracks die but frame tracks hold the drone drift-free.

## Why it matters for SLAM

Ultimate-SLAM settled an early strategic question of the event-camera field: events are most powerful as a *complement* to frames and IMU, not as a wholesale replacement — each modality patches the others' blind spots, and fusing at the estimator (not the pixel) makes degradation graceful. Its tightly-coupled events+frames+IMU factor-graph formulation became the standard template for subsequent event VIO work (ESVIO, EDS-style hybrids), and its quadrotor experiments were a landmark demonstration that event sensing extends the safe operating envelope of real robots.

## Related

- [EVO](evo.md)
- [ESVIO](esvio.md)
- [EDS](eds.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [Event cameras (DVS)](event-cameras-dvs.md)
