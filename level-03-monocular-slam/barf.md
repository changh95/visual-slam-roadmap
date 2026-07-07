# BARF

> Lin 2021 · [Paper](https://arxiv.org/abs/2104.06405)

**One-line summary** — Bundle-Adjusting NeRF: jointly optimises a NeRF scene representation *and* the camera poses from imperfect or unknown initialisation, using a coarse-to-fine positional encoding schedule — the key enabling insight for NeRF-based SLAM.

## Problem

NeRF synthesises photorealistic novel views, but it has a hard prerequisite: accurate camera poses for every training image, typically pre-computed with COLMAP. When poses are noisy or unknown, NeRF training fails — the scene representation and the registration problem are coupled, and each needs the other to converge. Worse, the failure is structural: NeRF's high-frequency positional encoding creates a highly non-convex photometric loss landscape riddled with local minima for the pose variables, so simply making poses learnable and back-propagating does not work. BARF ("Bundle-Adjusting Neural Radiance Fields") tackles this joint problem of learning a neural 3D representation while registering the camera frames.

## Key ideas

- **Joint pose + NeRF optimisation**: camera poses $T_i \in SE(3)$, parameterised in the Lie algebra $\mathfrak{se}(3)$ for unconstrained gradient-based updates, are treated as learnable parameters optimised alongside the NeRF MLP weights $\theta$ by minimising the photometric rendering loss

  $$\min_{\theta,\, \{T_i\}} \sum_i \sum_{\mathbf{r}} \left\| \hat{C}_\theta(\mathbf{r};\, T_i) - C_i(\mathbf{r}) \right\|^2$$

  — bundle adjustment where the "map" is a neural field and the "reprojection error" is a rendering residual.
- **Theoretical link to classical image alignment**: BARF establishes the connection to Lucas-Kanade-style registration. In classical alignment, smoothing the image widens the basin of attraction (Gaussian-pyramid coarse-to-fine); BARF shows the same principle applies to synthesis-based registration against a neural field.
- **Positional encoding is the obstacle**: naively applying NeRF's positional encoding $\gamma_l(\mathbf{x}) = [\sin(2^l \pi \mathbf{x}), \cos(2^l \pi \mathbf{x})]$ has a *negative* impact on registration — the $2^l$ frequency scaling amplifies gradient oscillations, so the pose gradients from high-frequency components are incoherent and the optimisation falls into local minima.
- **Coarse-to-fine frequency schedule**: BARF progressively activates the encoding's frequency bands during training with a smooth windowing function

  $$w_l(\alpha) = \tfrac{1}{2}\bigl(1 - \cos(\pi \cdot \mathrm{clamp}(\alpha - l,\, 0,\, 1))\bigr)$$

  where $\alpha$ ramps up over training: early on only low frequencies are active (smooth landscape, wide convergence basin, poses move freely); as poses converge, higher bands switch on and the scene sharpens to full detail.
- **Not a full SLAM system**: BARF is batch co-optimisation of poses and scene — not real-time, not incremental, and it still needs roughly known intrinsics — but it is exactly the tracking machinery a NeRF-based SLAM system needs.

## Results & impact

On synthetic scenes and real-world data (LLFF forward-facing scenes), BARF effectively optimises the neural scene representation while resolving large camera pose misalignment at the same time, reaching view-synthesis quality close to a NeRF trained with ground-truth poses — whereas naive joint optimisation with full positional encoding gets stuck. The paper explicitly frames the consequence: view synthesis and localization from video sequences with unknown poses, "opening up new avenues for visual localization systems (e.g. SLAM)" and dense 3D mapping.

The impact was immediate and broad: tracking-by-rendering in iMAP, NICE-SLAM and their successors rests on the demonstration that poses can be estimated *through* the scene representation, and the coarse-to-fine frequency schedule became a standard ingredient across pose-free neural-field methods (and reappears as scheduled hash-grid smoothing in later systems).

## Why it matters for SLAM

NeRF originally *consumed* camera poses (from COLMAP); BARF showed poses can be *estimated* through the radiance field itself, opening the door to localization with neural scene representations — a direction the authors explicitly flag for SLAM. Every neural-implicit SLAM system that tracks by minimising a rendering loss is running BARF's insight in an online loop; understanding why raw positional encoding breaks pose registration (and how coarse-to-fine fixes it) explains many design choices in that literature.

## Related

- [NeRF](../level-05-deep-learning/nerf.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [GO-SLAM](go-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
