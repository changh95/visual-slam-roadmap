# EDS

> Hidalgo-Carrió 2022 · [Paper](https://rpg.ifi.uzh.ch/docs/CVPR22_Hidalgo.pdf)

**One-line summary** — EDS (Event-aided Direct Sparse Odometry) is the first direct monocular VO to fuse events and frames in one photometric framework: events tracked against keyframes via the event generation model keep tracking alive in the "blind time" between frames where fast motion breaks frame-only direct VO.

## Problem

DSO is one of the most accurate frame-based VO systems, thanks to photometric bundle adjustment over a sparse set of high-gradient points — but its tracking assumes consecutive frames overlap enough for photometric alignment. That assumption breaks under fast camera motion, motion blur, and low frame rates. Events carry exactly the missing signal in those gaps, but they cannot be plugged in naively: direct methods work on absolute image intensity, while events encode brightness *changes*. EDS supplies the principled conversion between the two via the event generation model.

## Method & architecture

**Event generation model (EGM).** An event $e_k = (\mathbf{u}_k, t_k, p_k)$ fires when log-brightness changes by the contrast sensitivity $C$: $\Delta L(\mathbf{u}_k, t_k) = p_k C$. Accumulating polarities over a window of $N_e$ events gives a brightness-increment image $\Delta L(\mathbf{u}) = \sum_{t_k \in \mathcal{T}} p_k C\, \delta(\mathbf{u} - \mathbf{u}_k)$ (EDS accumulates *Gaussian-weighted* polarities $w_k p_k$ to reduce accumulation blur), which for small $\Delta t$ is linearized as

$$\Delta L(\mathbf{u}) \approx -\nabla L(\mathbf{u}) \cdot \mathbf{v}(\mathbf{u})\, \Delta t.$$

**Front-end (tracking).** A keyframe holds a brightness frame $\hat{L}$ and a semi-dense inverse depth map. The image-point velocity is purely geometric, $\mathbf{v}(\mathbf{u}) = \mathrm{J}(\mathbf{u}, d_{\mathbf{u}})\, \dot{\mathrm{T}}$, where $\mathrm{J}$ is the $2\times 6$ feature sensitivity matrix of pixel $\mathbf{u}$ with depth $d_{\mathbf{u}}$ and $\dot{\mathrm{T}} = (\mathbf{V}^\top, \boldsymbol{\omega}^\top)^\top$ the camera's linear/angular velocity. This predicts the brightness change $\Delta \hat{L}(\mathbf{u}) \approx -\nabla \hat{L}(\mathbf{u}) \cdot \mathrm{J}(\mathbf{u}, d_{\mathbf{u}})\, \dot{\mathrm{T}}\, \Delta t$ from the frame. Camera tracking jointly optimizes the 6-DOF pose increment and velocity over event packets by matching normalized increments under a Huber norm $\gamma$:

$$(\delta \mathrm{T}^{\ast}, \dot{\mathrm{T}}^{\ast}) = \arg\min_{\delta \mathrm{T}, \dot{\mathrm{T}}} \left\| \frac{\Delta \hat{L}}{\|\Delta \hat{L}\|_2} - \frac{\Delta L}{\|\Delta L\|_2} \right\|_{\gamma},$$

evaluated only at selected high-gradient contour pixels (a tiling scheme, e.g. 11×11 tiles, keeps 10–15% of pixels well distributed), with event increments transferred to the keyframe via projection $\mathbf{u}_e = \pi\big(T_{e,f}\, \pi^{-1}(\mathbf{u}_f, d_{\mathbf{u}_f})\big)$. Normalization cancels the unknown contrast $C$. New keyframes are spawned when 20–30% of points leave the FOV or relative rotation exceeds a threshold; depths propagate to new keyframes via a k-d-tree nearest-neighbor fill.

**Back-end.** Photometric bundle adjustment over a sliding window of 7 keyframes (2000–8000 points, 8-pixel residual patches, Huber norm, Ceres) refines poses and inverse depths, which feed back to the front-end — the design is modular enough to swap in DSO's PBA. Bootstrapping uses classical multi-view geometry, learned monocular depth, or DSO's coarse initializer on the frames.

## Results

- **Stereo DAVIS 240C dataset** (bin, boxes, desk, monitor; mocap ground truth): EDS gets ATE of 1.1 / 2.1 / 1.5 / 1.0 cm — better than the *stereo* event method ESVO (2.8 / 5.8 / 3.2 / 3.3 cm), USLAM events+frames+IMU (7.7 / 9.5 / 9.8 / 6.5 cm), and EVO (13.2 / 14.2 / 5.2 / 7.8 cm, failing early on two sequences), despite being monocular and IMU-free. Rotation errors: 0.99 / 1.83 / 1.87 / 0.60 deg.
- Against frame-based baselines, EDS is consistently better than monocular ORB-SLAM in translation, similar to DSO (and more accurate on the fast desk sequence, 1.5 cm vs 10.0 cm), and only slightly worse than stereo ORB-SLAM.
- **Low frame-rate study**: as frame rate drops, EDS's error stays nearly constant while DSO's grows sharply (DSO's recovery tracking fails below 10 FPS); EDS also beats ORB-SLAM without loop closure — events keep tracking alive between distant frames.
- **Sensitivity**: tracking degrades gracefully with depth noise but fails abruptly when contrast-threshold noise exceeds $\sigma_C > 0.15$.
- The work also introduced a new beamsplitter-rig event+frame dataset (the EDS dataset) for evaluating hybrid systems.

## Why it matters for SLAM

EDS is the direct-method counterpart of the "events as enhancement" philosophy: where EKLT augments feature tracking and Ultimate-SLAM augments a feature-based VIO back-end, EDS shows the same complementarity holds for photometric, direct odometry. It demonstrated that a mature frame-based system can adopt events with targeted changes rather than a redesign — a blueprint for retrofitting event robustness onto existing direct SLAM pipelines.

## Related

- [DSO](../level-03-monocular-slam/dso.md)
- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)
- [Event representations](event-representations.md)
