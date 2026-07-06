# Event-based Vision Survey

> Gallego 2020 · [Paper](https://arxiv.org/abs/1904.08405)

**One-line summary** — The definitive survey of event-based vision (published in TPAMI), organizing sensors, event representations, algorithms, and applications into a coherent taxonomy that serves as the standard entry point to the field.

## Key ideas

- **Sensor principle, precisely stated**: event cameras asynchronously measure per-pixel brightness changes and output a stream of events encoding the time, location, and sign of each change — offering microsecond temporal resolution, very high dynamic range (140 dB vs. 60 dB), low power, and reduced motion blur.
- **Taxonomy of event representations**: the survey systematizes how asynchronous streams are converted for processing — event frames/histograms, time surfaces, voxel grids, and point/spike-based forms — establishing the shared vocabulary the field still uses.
- **Algorithm taxonomy by task**: feature detection and tracking, optical flow, depth estimation and 3D reconstruction, ego-motion/odometry/SLAM, recognition, and control, covering both model-based methods (e.g., contrast maximization) and learning-based ones (CNNs on event tensors, spiking neural networks).
- **Paradigm question**: the survey frames the central methodological choice — process events natively (event-by-event, exploiting asynchrony) versus aggregate them into frame-like structures and reuse conventional vision machinery.
- **Hardware and neuromorphic context**: covers the sensor families (DVS, DAVIS, ATIS) and neuromorphic processors, connecting the algorithms to the silicon they are meant to exploit.
- **Authoritative author list**: written by the leading groups in the area (including Gallego, Delbruck, Scaramuzza, Davison, Leutenegger, Daniilidis), which is part of why it functions as the community's reference document.

## Why it matters for SLAM

If you read one thing before touching event-based SLAM, read this survey: nearly every system in this level (EVO, ESVO, Ultimate-SLAM, EKLT, EDS, DEVO) is easiest to understand in the vocabulary and taxonomy it established. It also honestly maps the open problems — absolute-intensity loss, noise, loop closure, learning on events — that still define the research frontier. Pair it with the community-maintained Awesome-Event-based-Vision repository for datasets, simulators, and code.

## Related

- [Event cameras (DVS)](event-cameras-dvs.md)
- [Event representations](event-representations.md)
- [EVO](evo.md)
- [ESVO](esvo.md)
- [Ultimate-SLAM](ultimate-slam.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
