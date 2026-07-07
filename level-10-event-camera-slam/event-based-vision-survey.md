# Event-based Vision Survey

> Gallego 2020 · [Paper](https://arxiv.org/abs/1904.08405)

**One-line summary** — The definitive survey of event-based vision (published in TPAMI), organizing sensors, event representations, algorithms, and applications into a coherent taxonomy that serves as the standard entry point to the field.

## Problem

Event cameras offer properties that are transformative for robotics in challenging scenarios — microsecond temporal resolution and latency, very high dynamic range (140 dB vs. 60 dB), and low power consumption (about 10 mW at the die level, under 100 mW for full embedded systems). But their unconventional output — a sparse, asynchronous stream of per-pixel brightness changes — is incompatible with the conventional computer-vision toolbox: the data is asynchronous and sparse where images are synchronous and dense, each event carries only binary change information that depends on motion as well as scene brightness, and the noise process of quantizing temporal contrast is not fully characterized. By the late 2010s the resulting literature had grown fast and fragmented; the field needed a unified overview and shared vocabulary.

## Method & architecture

The survey grounds everything in the **event generation model**: a pixel with log-brightness $L \doteq \log(I)$ fires an event $e_k \doteq (\mathbf{x}_k, t_k, p_k)$ when the brightness increment since its last event,

$$\Delta L(\mathbf{x}_k, t_k) \doteq L(\mathbf{x}_k, t_k) - L(\mathbf{x}_k, t_k - \Delta t_k),$$

reaches the contrast threshold: $\Delta L(\mathbf{x}_k, t_k) = p_k\,C$ with polarity $p_k \in \{+1, -1\}$ and $C > 0$ (typically 10–50% illumination change). Two consequences organize much of the field: events approximate the temporal derivative, $\frac{\partial L}{\partial t}(\mathbf{x}_k, t_k) \approx \frac{p_k C}{\Delta t_k}$, and — via brightness constancy — *events are caused by moving edges*: $\Delta L \approx -\nabla L \cdot \mathbf{v}\,\Delta t$, so a gradient moving parallel to itself generates no events. From this base the survey builds its taxonomies:

- **Event representations**: individual events (for filters and spiking neural networks), event packets, event frames / 2D histograms, time surfaces (per-pixel last-event timestamps, i.e., motion history), voxel grids (space-time histograms preserving timestamps), 3D point sets, and *motion-compensated event images* — warping events by a motion hypothesis and maximizing the sharpness/contrast of the resulting image of warped events (the contrast-maximization framework).
- **Processing paradigms**: event-by-event methods (probabilistic filters, SNNs — minimum latency) vs. methods for groups/packets of events (better signal-to-noise ratio, some latency); orthogonally, model-based vs. data-driven approaches.
- **Algorithms by task**: feature detection and tracking, optical flow, 3D reconstruction (instantaneous stereo and monocular multi-view for SLAM), pose estimation and SLAM (traced from rotation-only and planar setups to full 6-DOF event-only systems like EVO), image reconstruction, segmentation, recognition, and neuromorphic control.
- **Hardware context**: the sensor families (DVS, DAVIS, ATIS, and higher-resolution successors) with a spec comparison from the manufacturers, plus neuromorphic processors (SNN hardware) and event-based control, connecting algorithms to the silicon they exploit.

## Results

As a survey its contribution is organizational rather than experimental: it distills the field's hundreds of references into one coherent model-grounded taxonomy, and its terminology (time surfaces, voxel grids, motion compensation) became the standard vocabulary. Its discussion section honestly states that there is no agreement on the best representation or method — the trade-offs (latency vs. power vs. accuracy; sensitivity vs. bandwidth) are application-dependent and largely unquantified — and lists the open challenges: motion-dependent appearance breaking data association, noise modeling, end-to-end event-based perception-to-control systems, and adapting deep learning to events. Written by the leading groups in the area (Gallego, Delbruck, Scaramuzza, Davison, Leutenegger, Daniilidis, and others), it is the default first citation of nearly every event-vision paper since.

## Why it matters for SLAM

If you read one thing before touching event-based SLAM, read this survey: nearly every system in this level (EVO, ESVO, Ultimate-SLAM, EKLT, EDS, DEVO) is easiest to understand in the vocabulary and taxonomy it established, and its event-generation equations are the physical model those systems' front-ends are built on. It also maps the open problems — absolute-intensity loss, noise, data association under motion-dependent appearance, learning on events — that still define the research frontier. Pair it with the community-maintained Awesome-Event-based-Vision repository for datasets (Event Camera Dataset, MVSEC, DSEC), simulators (ESIM, v2e), and code.

## Related

- [Event cameras (DVS)](event-cameras-dvs.md)
- [Event representations](event-representations.md)
- [EVO](evo.md)
- [ESVO](esvo.md)
- [Ultimate-SLAM](ultimate-slam.md)
