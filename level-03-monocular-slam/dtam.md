# DTAM

> Newcombe 2011 · [Paper](https://ieeexplore.ieee.org/document/6126513)

**One-line summary** — The first system to perform dense 3D reconstruction and camera tracking from a monocular camera in real time, using GPU-accelerated photometric optimisation.

## Key ideas

- **Dense keyframe depth via cost volumes**: for each keyframe, a photometric cost volume is built by warping neighbouring frames across inverse-depth hypotheses; per-pixel depth is found by minimising a regularised photometric cost with a primal-dual optimisation.
- **Dense whole-image tracking**: camera pose is estimated by aligning the live frame against a synthetic view rendered from the dense model, minimising photometric error over every pixel rather than a set of features.
- **GPGPU as an enabler**: cost-volume construction, regularised optimisation, and model rendering all run on the GPU — dense monocular SLAM only became feasible through massively parallel computation.
- **Direct, not feature-based**: DTAM demonstrated that tracking against a dense model can be more robust to motion blur and defocus than feature matching.

## Why it matters for SLAM

Where PTAM produced sparse point maps, DTAM showed a single camera could deliver dense surfaces in real time, opening the door to richer scene understanding, occlusion-aware AR, and obstacle avoidance. It founded the direct/dense line of SLAM research — directly influencing LSD-SLAM, DSO, and (via the same first author) KinectFusion — and established GPU computing as a core tool of dense SLAM. Modern dense systems from ElasticFusion to NeRF- and 3DGS-based SLAM are descendants of its dense-tracking-and-mapping blueprint.

## Related

- [PTAM](ptam.md)
- [LSD-SLAM](lsd-slam.md)
- [DSO](dso.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
