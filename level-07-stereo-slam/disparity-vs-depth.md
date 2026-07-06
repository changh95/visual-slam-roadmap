# Disparity vs Depth

For a rectified stereo pair, a 3D point projects to the left and right images at the same row but different columns. The horizontal offset between the two projections is the **disparity** $d = u_L - u_R$ (in pixels). For focal length $f$ (pixels) and stereo baseline $B$ (meters), disparity and depth $Z$ are related by

$$d = \frac{f \cdot B}{Z} \quad\Longleftrightarrow\quad Z = \frac{f \cdot B}{d}.$$

The relationship is *inverse*: near objects have large disparity, far objects have small disparity. This one formula drives most of stereo system design:

- **Depth resolution degrades quadratically with range.** Differentiating gives $\Delta Z \approx \frac{Z^2}{fB}\,\Delta d$, so a fixed disparity-matching error $\Delta d$ (typically a fraction of a pixel) produces a depth error that grows with $Z^2$. Doubling the distance to an object quadruples the depth uncertainty.
- **Baseline sets the usable depth range.** A larger baseline $B$ increases disparity for the same depth, improving long-range accuracy — but it also increases the minimum measurable depth (very close points fall outside both fields of view or exceed the disparity search range) and makes matching harder due to larger appearance change between views. Small-baseline rigs (e.g., ~10 cm on a drone) are accurate up close and nearly monocular at long range.
- **A practical rule of thumb**: stereo depth is reliable out to roughly 40x the baseline; beyond that, disparity shrinks below matching precision and points behave like monocular (bearing-only) observations. Stereo SLAM systems such as ORB-SLAM2 and Stereo DSO explicitly split points into "close" (trusted metric depth) and "far" (triangulated over time like monocular) using such a threshold.
- **Sub-pixel matching matters.** Since $\Delta d$ appears linearly in the depth error, sub-pixel disparity refinement (parabola fitting, SGM sub-pixel interpolation) directly improves 3D accuracy.

In a SLAM pipeline the conversion appears in two places: turning per-keypoint disparities into 3D landmark positions (or an inverse-depth parameterization, which behaves better for small disparities), and weighting stereo observations in bundle adjustment according to their depth-dependent uncertainty.

## Why it matters for SLAM

The $d = fB/Z$ geometry decides whether stereo actually helps: it tells you which landmarks carry metric information, how to set your rig's baseline for your operating range, and how to model measurement noise correctly in the estimator. Misunderstanding it (e.g., trusting stereo depth at 100 m from a 10 cm baseline) is a classic source of biased maps and inconsistent covariances.

## Related

- [Stereo rectification](stereo-rectification.md)
- [Scale observability](scale-observability.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)

---
[Back to Level 7](../README.md#level-7-stereo-slam)
