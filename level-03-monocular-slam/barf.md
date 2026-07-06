# BARF

> Lin 2021 · [Paper](https://arxiv.org/abs/2104.06405)

**One-line summary** — Bundle-Adjusting NeRF: jointly optimises a NeRF scene representation *and* the camera poses from imperfect or unknown initialisation, using a coarse-to-fine positional encoding schedule — the key enabling insight for NeRF-based SLAM.

## Key ideas

- **Joint pose + NeRF optimisation**: camera poses $T_i \in SE(3)$ (parameterised in the Lie algebra $\mathfrak{se}(3)$) are treated as learnable parameters optimised alongside the NeRF MLP weights by minimising the photometric rendering loss — bundle adjustment where the "map" is a neural field.
- **Positional encoding is the obstacle**: naively applying NeRF's high-frequency positional encoding $\gamma_l(\mathbf{x}) = [\sin(2^l \pi \mathbf{x}), \cos(2^l \pi \mathbf{x})]$ hurts registration — high frequencies create a highly non-convex loss landscape full of local minima for the pose variables.
- **Coarse-to-fine schedule**: BARF progressively activates frequency bands during training via a smooth windowing function — start with low frequencies (smooth, wide convergence basin) and add high frequencies as poses converge.
- **Theoretical link to classical alignment**: the schedule is the neural analogue of Gaussian-pyramid image alignment (Lucas-Kanade) — blur first for a large basin of attraction, refine at full resolution.
- On synthetic and real (LLFF) scenes, BARF recovers poses from substantial misalignment while reaching view-synthesis quality close to NeRF trained with ground-truth poses.
- **Not a full SLAM system**: batch pose + scene co-optimisation, not real-time or incremental — but exactly the machinery a NeRF-based SLAM tracker needs.

## Why it matters for SLAM

NeRF originally *consumed* camera poses (from COLMAP); BARF showed poses can be *estimated* through the radiance field itself, opening the door to localization with neural scene representations — a direction the authors explicitly flag for SLAM. Tracking-by-rendering in iMAP, NICE-SLAM and their successors rests on this insight, and the coarse-to-fine frequency schedule became a standard technique across pose-free neural-field methods.

## Related

- [NeRF](../level-05-deep-learning/nerf.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
