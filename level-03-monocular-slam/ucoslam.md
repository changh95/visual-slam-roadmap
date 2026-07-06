# UcoSLAM

> Muñoz-Salinas 2019 · [Paper](https://arxiv.org/abs/1902.03729)

**One-line summary** — Fuses natural keypoints with squared planar fiducial markers (ArUco) in one SLAM framework, combining the reliability and metric scale of markers with the coverage of natural features.

## Key ideas

- **Fiducial markers as landmarks**: each detected ArUco/ChArUco marker gives an unambiguous ID and an immediate 6-DoF pose with known metric scale from its physical size — no data-association ambiguity.
- **Hybrid map**: the map holds both marker landmarks (known geometry) and point landmarks triangulated from ORB keypoints, connected through shared keyframes in a covisibility graph.
- **Joint optimization**: bundle adjustment refines camera poses, map points, and marker poses together; marker observations act as strong, drift-free anchors.
- **Marker-based loop closure**: re-observing a marker triggers an immediate, unambiguous loop closure without vocabulary-based place recognition, which also removes perceptual aliasing failures.
- **Robustness in textureless scenes**: markers keep tracking alive where keypoint-only SLAM fails, while natural features cover marker-sparse regions.

## Why it matters for SLAM

UcoSLAM shows that artificial and natural landmarks are complementary: markers contribute metric scale and reliable relocalization/loop closure, features contribute continuous coverage. This makes it highly practical in environments you control — warehouses, labs, industrial AR setups — where placing a few markers is cheap and drastically improves robustness over point-only monocular SLAM.

## Related

- [ORB-SLAM2](orb-slam2.md) — the keypoint-based SLAM design UcoSLAM builds upon
- [Scale ambiguity](scale-ambiguity.md) — the monocular problem that markers solve for free
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md) — the appearance-based loop closure that markers replace
- [Landmark](../level-02-getting-familiar/landmark.md) — general notion of map landmarks

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
