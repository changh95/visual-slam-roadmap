# DEVO

> Klenk 2024 · [Paper](https://arxiv.org/abs/2312.09800)

**One-line summary** — DEVO (Deep Event Visual Odometry) adapts the DPVO-style learned sparse patch odometry architecture to monocular event streams, trained on large-scale *simulated* event data, and generalizes to real event benchmarks where it substantially outperforms classical event VO.

## Problem

Event cameras promise camera tracking during high-speed motion and in adverse lighting, yet existing event-based *monocular* VO showed limited performance on recent benchmarks. To compensate, many systems added extra sensors — IMUs, stereo event cameras, or frame-based cameras — but those additions raise cost and complicate system requirements, and relying on a frame camera reintroduces exactly the motion-blur and HDR vulnerabilities events were meant to avoid. DEVO asks how far a *single event camera* can go when paired with a modern learned VO architecture.

## Key ideas

- **Learned VO transferred to events**: deep frame-based VO (DROID-SLAM, DPVO) showed that recurrent, correlation-based architectures with differentiable bundle adjustment beat classical pipelines. DEVO asks whether the same data-driven recipe works when the input is events rather than images — and shows it does.
- **DPVO-style sparse patches**: instead of dense flow, the system sparsely tracks a set of selected event patches over time, iteratively refining patch trajectories with a recurrent update operator and optimizing poses and depths jointly — keeping the efficiency benefits of the patch-based design.
- **Deep patch selection tailored to events**: a key component is a novel learned selection mechanism that picks informative event patches. This matters because event data is sparse and motion-dependent — random or gradient-based patch sampling (fine for images) wastes capacity on empty or noisy regions of the event stream.
- **Event voxel grids as network input**: raw events are converted into voxel-grid tensors, so standard CNN feature extractors apply without architectural surgery.
- **Trained purely in simulation**: real event training data with ground truth is scarce, so DEVO is trained on large amounts of simulated events rendered from existing frame datasets — and still transfers to real sensors, demonstrating that sim-to-real transfer is viable for event-based learning.
- **Monocular, events-only**: unlike fusion systems (Ultimate-SLAM, ESVIO), DEVO uses a single event camera with no frames and no IMU, making its robustness results a statement about what events alone can support when paired with learning.

## Results & impact

- DEVO is the first monocular event-only system with strong performance across a large number of real-world benchmarks — the paper evaluates on seven of them.
- It decreases pose tracking error by up to 97% compared to prior event-only methods, and often surpasses or comes close to methods that use *additional* stereo or inertial sensors.
- The results shift the community's expectation of what a single event camera can achieve, weakening the argument that event VO must lean on auxiliary sensors to be competitive.
- Code is open source (github.com/tum-vision/DEVO), making it the natural learned baseline for subsequent event odometry work.

## Why it matters for SLAM

DEVO marks the moment the deep-VO revolution reached event cameras: classical event odometry (EVO, ESVO) relies on hand-designed alignment objectives that struggle with noise and sparsity, while DEVO's learned front-end absorbs those effects from data. Its simulation-only training strategy is arguably the most influential part — it shows a practical path around the event data bottleneck, opening event SLAM to the scaling dynamics that transformed frame-based methods.

## Related

- [DPVO](../level-03-monocular-slam/dpvo.md)
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)
- [ESVO](esvo.md)
- [Event representations](event-representations.md)
- [Challenges](challenges.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
