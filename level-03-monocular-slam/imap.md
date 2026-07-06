# iMAP

> Sucar 2021 · [Paper](https://arxiv.org/abs/2103.12352)

**One-line summary** — The first NeRF-style SLAM system: a single MLP, trained live with no prior data, serves as the *only* scene representation for real-time RGB-D tracking and mapping.

## Key ideas

- **MLP as the entire map**: one network $f_\theta(\mathbf{x}) \rightarrow (\mathbf{c}, \sigma)$ maps 3D coordinates to colour and occupancy/density. There is no TSDF, surfel cloud, or point map — the weights *are* the map.
- **Online training**: the MLP is trained continually against the live RGB-D stream (no pre-training), with tracking at about 10 Hz and global map updates at about 2 Hz using a multi-processing design.
- **Keyframe structure**: a set of keyframes is maintained and replayed during training to mitigate forgetting and to supervise the map from diverse viewpoints.
- **Information-guided pixel sampling**: instead of rendering full images, pixels are sampled dynamically where map uncertainty (rendering loss) is highest, which is essential for real-time speed.
- **Joint tracking and mapping**: tracking optimises the camera pose against the frozen network; mapping jointly refines network weights and keyframe poses.
- **Implicit-representation benefits**: automatic level-of-detail, compact memory, and smooth, plausible filling-in of unobserved regions (e.g., the backs of objects).

## Why it matters for SLAM

iMAP kicked off the entire neural-implicit SLAM line of research. Its limitations were as influential as its ideas: a single MLP forgets catastrophically and over-smooths in larger scenes, which directly motivated NICE-SLAM's hierarchical feature grids, Co-SLAM's hash grids, and ultimately the switch to 3D Gaussian representations. The tracking/mapping split against a differentiable map, established here, is still the template used by NeRF- and 3DGS-based SLAM today.

## Related

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)
- [NeRF-SLAM](nerf-slam.md)
- [SplaTAM](splatam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
