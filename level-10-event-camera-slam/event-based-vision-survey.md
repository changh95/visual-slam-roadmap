# Event-based Vision Survey

> Gallego 2020 · [Paper](https://arxiv.org/abs/1904.08405)

**One-line summary** — The definitive survey of event-based vision (published in TPAMI), organizing sensors, event representations, algorithms, and applications into a coherent taxonomy that serves as the standard entry point to the field.

## Problem

Event cameras offer properties that are transformative for robotics in challenging scenarios — microsecond temporal resolution, very high dynamic range (140 dB vs. 60 dB), low power consumption, and high pixel bandwidth (on the order of kHz) resulting in reduced motion blur. But their unconventional output — a sparse, asynchronous stream of per-pixel brightness changes — is incompatible with the conventional computer-vision toolbox, and novel methods are required to unlock the sensors' potential. By the late 2010s the resulting literature had grown fast and fragmented; the field needed a unified overview and shared vocabulary.

## Key ideas

- **Sensor principle, precisely stated**: event cameras asynchronously measure per-pixel brightness changes and output a stream of events encoding the time, location, and sign of each change — the survey grounds every algorithm in this working principle.
- **Taxonomy of event representations**: the survey systematizes how asynchronous streams are converted for processing — event frames/histograms, time surfaces, voxel grids, and point/spike-based forms — establishing the shared vocabulary the field still uses.
- **Algorithm taxonomy by task**: from low-level vision (feature detection and tracking, optical flow) to high-level vision (reconstruction, segmentation, recognition), plus ego-motion/SLAM and control, covering both model-based methods (e.g., contrast maximization) and learning-based ones (CNNs on event tensors, spiking neural networks).
- **Event-based brightness constancy**: the survey connects events to classical optics via $\nabla L \cdot \mathbf{v} + \partial L / \partial t = 0$ — motion estimation becomes finding the flow or trajectory that best *focuses* (maximizes the contrast of) the warped event image.
- **Paradigm question**: the survey frames the central methodological choice — process events natively (event-by-event, exploiting asynchrony) versus aggregate them into frame-like structures and reuse conventional vision machinery.
- **Hardware and neuromorphic context**: covers the sensor families (DVS, DAVIS, ATIS) and specialized processors including spiking neural networks, connecting the algorithms to the silicon they are meant to exploit — the search for "a more efficient, bio-inspired way for machines to perceive and interact with the world."

## Results & impact

- As a survey its impact is organizational rather than experimental: it distills hundreds of references into one coherent taxonomy, and its terminology (time surfaces, voxel grids, contrast maximization) became the field's standard vocabulary.
- Written by the leading groups in the area (including Gallego, Delbruck, Scaramuzza, Davison, Leutenegger, Daniilidis), it functions as the community's reference document and the default first citation of nearly every event-vision paper since.
- It explicitly highlights the challenges that remain — which is precisely the list (intensity loss, noise, loop closure, learning on events) that later systems like DEVO and ESVIO set out to address.
- It pairs naturally with the community-maintained Awesome-Event-based-Vision repository, which catalogs the datasets (Event Camera Dataset, MVSEC, DSEC), simulators (ESIM, v2e), and codebases the survey discusses.

## Why it matters for SLAM

If you read one thing before touching event-based SLAM, read this survey: nearly every system in this level (EVO, ESVO, Ultimate-SLAM, EKLT, EDS, DEVO) is easiest to understand in the vocabulary and taxonomy it established. It also honestly maps the open problems — absolute-intensity loss, noise, loop closure, learning on events — that still define the research frontier. Pair it with the community-maintained Awesome-Event-based-Vision repository for datasets, simulators, and code.

## Related

- [Event cameras (DVS)](event-cameras-dvs.md)
- [Event representations](event-representations.md)
- [EVO](evo.md)
- [ESVO](esvo.md)
- [Ultimate-SLAM](ultimate-slam.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
