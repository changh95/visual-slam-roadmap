# iMAP

> Sucar 2021 · [Paper](https://arxiv.org/abs/2103.12352)

**One-line summary** — The first NeRF-style SLAM system: a single MLP, trained live with no prior data, serves as the *only* scene representation for real-time RGB-D tracking and mapping.

## Problem

Dense RGB-D SLAM had always relied on explicit map structures — TSDF voxel grids (KinectFusion), surfels (ElasticFusion) — which need careful memory management, fix their resolution up front, and leave holes wherever the camera never looked. NeRF had just shown that a neural network can represent a scene continuously and compactly, but only via hours of offline training on posed images. iMAP asked whether an MLP could be *the* map of a live SLAM system: trained from scratch, in real time, on a stream from a handheld RGB-D camera, while simultaneously being used for tracking.

## Key ideas

- **MLP as the entire map**: one network $f_\theta(\mathbf{x}) \rightarrow (\mathbf{c}, \sigma)$ maps 3D coordinates to colour and occupancy/density. There is no TSDF, surfel cloud, or point map — the weights *are* the map, queried by volume rendering along camera rays.
- **Online training with no prior data**: the MLP is trained continually against the live RGB-D stream, "in live operation without prior data" (abstract) — the system learns a scene-specific model from scratch, so nothing needs to generalise beyond the current scene.
- **Parallel tracking and mapping**: following the PTAM split, a multi-processing design runs tracking at roughly 10 Hz (optimising the camera pose against the frozen network) and global map updating at roughly 2 Hz (jointly refining network weights and keyframe poses).
- **Keyframe structure against forgetting**: a single MLP trained on the latest frames would catastrophically forget earlier parts of the scene; iMAP keeps a set of keyframes and continually replays them during training, supervising the map from diverse viewpoints.
- **Information-guided pixel sampling**: rendering every pixel is far too slow, so rays are sampled dynamically, concentrated where the rendering loss (map uncertainty) is highest — one of the key innovations that makes continual neural training real-time.
- **Implicit-representation benefits**: compared to standard dense SLAM structures, the MLP gives "efficient geometry representation with automatic detail control and smooth, plausible filling-in of unobserved regions such as the back surfaces of objects" (abstract).

## Results & impact

- Demonstrated, "for the first time", that an MLP can be the sole scene representation of a real-time SLAM system (abstract) — tracking at ~10 Hz, map updates at ~2 Hz, on a handheld RGB-D camera.
- Published at ICCV 2021 from Davison's lab at Imperial College; it founded the neural-implicit SLAM subfield almost single-handedly.
- Its weaknesses were as generative as its strengths: the single MLP's limited capacity (forgetting, over-smoothing in larger scenes) directly motivated NICE-SLAM's hierarchical feature grids, Co-SLAM's hash grids, ESLAM's feature planes, and eventually the community's switch to explicit 3D Gaussian maps.

## Why it matters for SLAM

iMAP kicked off the entire neural-implicit SLAM line of research. The tracking/mapping split against a differentiable map — pose optimisation against a frozen map, map optimisation against replayed keyframes — established here is still the template used by NeRF- and 3DGS-based SLAM today. It also reframed what a "map" is: not a data structure you insert points into, but a function you fit, with continuity, compactness, and hole-filling for free.

## Related

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)
- [NeRF-SLAM](nerf-slam.md)
- [SplaTAM](splatam.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
