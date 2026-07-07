# UcoSLAM

> Muñoz-Salinas 2019 · [Paper](https://arxiv.org/abs/1902.03729)

**One-line summary** — Fuses natural keypoints with squared planar fiducial markers (ArUco) in one SLAM framework, combining the reliability and metric scale of markers with the coverage of natural features.

## Problem

Most SLAM systems rely on natural landmarks such as keypoints, but these are unstable over time, repetitive in many environments, or simply insufficient for robust tracking (e.g. in textureless indoor buildings), and they suffer from perceptual aliasing. Marker-based systems provide unambiguous, instantaneous data association and known metric scale, but require markers everywhere. UcoSLAM integrates both kinds of landmark in a single map to achieve long-term robust tracking across many scenarios.

## Key ideas

- **Fiducial markers as landmarks**: each detected ArUco/ChArUco marker provides an unambiguous ID and an immediate 6-DoF pose with known metric scale from its physical size — data association is solved by construction, with no descriptor matching and no aliasing.
- **Hybrid map**: the map holds both marker landmarks (with fixed, known planar geometry) and point landmarks triangulated from ORB keypoints, connected through shared keyframes in a covisibility graph.
- **Joint optimization**: bundle adjustment refines camera poses, map points, and marker poses together; marker observations act as strong, drift-free anchors that also fix the map's absolute scale — resolving the classic monocular scale ambiguity.
- **Marker-based loop closure and relocalization**: re-observing a marker triggers an immediate, unambiguous loop closure without vocabulary-based place recognition, eliminating the false-positive loop closures that perceptual aliasing causes in appearance-based methods.
- **Complementary failure modes**: markers keep tracking alive in textureless regions where keypoint-only SLAM fails, while natural features provide continuous coverage in marker-sparse regions — the combination is more accurate than either landmark type alone.

## Results & impact

Compared against ORB-SLAM2 and LDSO on the public KITTI, EuRoC-MAV, TUM, and SPM datasets, UcoSLAM obtains better precision, robustness, and speed, and the experiments show that combining markers and keypoints achieves better accuracy than each used independently. The system is open source and widely used in industrial AR and warehouse robotics, where placing a few markers is cheap insurance.

## Why it matters for SLAM

UcoSLAM shows that artificial and natural landmarks are complementary: markers contribute metric scale and reliable relocalization/loop closure, features contribute continuous coverage. This makes it highly practical in environments you control — warehouses, labs, industrial AR setups — where placing a few markers is cheap and drastically improves robustness over point-only monocular SLAM.

## Related

- [ORB-SLAM2](orb-slam2.md) — the keypoint-based SLAM design UcoSLAM builds upon
- [Scale ambiguity](scale-ambiguity.md) — the monocular problem that markers solve for free
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md) — the appearance-based loop closure that markers replace
- [Landmark](../level-02-getting-familiar/landmark.md) — general notion of map landmarks
- [LDSO](ldso.md) — the direct-method baseline it was compared against

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
