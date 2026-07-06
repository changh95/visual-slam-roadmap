# Event representations

Raw event streams are sparse, asynchronous lists of tuples $e_k = (\mathbf{x}_k, t_k, p_k)$ — a format almost no downstream algorithm consumes directly. Before tracking, mapping, or feeding a neural network, most systems convert a batch of events into an intermediate representation. The choice of representation is one of the central design decisions in event-based vision, trading temporal fidelity against compatibility with existing algorithms.

**Event frames / histograms.** Accumulate events over a time window (or a fixed event count) into a 2D image:

$$H(x, y) = \sum_k p_k \cdot \delta(\mathbf{x}_k - (x, y))$$

Simple, compatible with any image-based algorithm (feature detection, CNNs, direct alignment), and the basis of many tracking front-ends. The cost: temporal structure inside the window is discarded, and the "image" appearance depends on motion speed and window length.

**Time surfaces.** Store at each pixel the time of the most recent event, usually passed through an exponential decay:

$$\mathcal{T}(\mathbf{x}, t) = \exp\!\left(-\frac{t - t_{\text{last}}(\mathbf{x})}{\tau}\right)$$

This encodes *recency* of activity — recently active pixels are bright, stale ones fade — producing smooth, gradient-rich maps that are well suited to registration and data association. ESVO's tracking, for example, aligns against time surfaces.

**Voxel grids.** Bin events into a 3D tensor over space and discretized time:

$$V(x, y, b) = \sum_{k:\, t_k \in \text{bin}_b} p_k \cdot \delta(\mathbf{x}_k - (x, y))$$

Voxel grids preserve coarse temporal structure while remaining a dense tensor that standard 2D/3D CNNs can process — the default input for learned event pipelines such as DEVO — at the cost of memory and a fixed binning choice.

**Spike tensors / event point clouds.** Treat the events themselves as points in $(x, y, t)$ space, processed by PointNet-style networks or spiking neural networks (SNNs) that operate natively on asynchronous spikes. This is the most faithful representation (no aggregation at all) but requires specialized architectures and, for SNNs, neuromorphic hardware to realize the efficiency benefits.

| Representation | Temporal fidelity | Compatibility | Typical use |
|---|---|---|---|
| Event frame | Low (window-collapsed) | Highest (any image algorithm) | Tracking front-ends, CNNs |
| Time surface | Medium (recency only) | High | Registration, data association |
| Voxel grid | Medium-high (binned) | High (CNNs) | Learned VO (DEVO) |
| Spikes / points | Full | Low (special architectures) | SNNs, PointNet-style models |

## Why it matters for SLAM

Every event-based SLAM system implicitly answers "what do we do with the raw stream?" first, and the answer shapes everything downstream: event frames enabled frame-like tracking pipelines, time surfaces enabled stereo matching and map registration in ESVO, and voxel grids made it possible to reuse deep frame-based VO architectures (DPVO/DROID-style) for events in DEVO. Understanding these representations — and what each one throws away — is the fastest route to reading the event-SLAM literature critically.

## Related

- [Event cameras (DVS)](event-cameras-dvs.md)
- [Event-based Vision Survey](event-based-vision-survey.md)
- [ESVO](esvo.md)
- [DEVO](devo.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
