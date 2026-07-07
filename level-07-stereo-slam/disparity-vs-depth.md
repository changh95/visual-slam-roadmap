# Disparity vs Depth

For a rectified stereo pair, a 3D point projects to the left and right images at the same row but different columns. The horizontal offset between the two projections is the **disparity** $d = u_L - u_R$ (in pixels). For focal length $f$ (pixels) and stereo baseline $B$ (meters), disparity and depth $Z$ are related by

$$d = \frac{f \cdot B}{Z} \quad\Longleftrightarrow\quad Z = \frac{f \cdot B}{d}.$$

The relationship is *inverse*: near objects have large disparity, far objects have small disparity.

## Where the formula comes from

Place the left camera at the origin and the right camera at $(B, 0, 0)$, both looking down $+Z$ with the same focal length $f$ and principal point $c_x$ (which is exactly what rectification arranges). A point $(X, Y, Z)$ projects to

$$u_L = f\,\frac{X}{Z} + c_x, \qquad u_R = f\,\frac{X - B}{Z} + c_x,$$

so the rows agree ($v_L = v_R$) and the column difference is

$$d = u_L - u_R = f\,\frac{X - (X - B)}{Z} = \frac{fB}{Z}.$$

This is also why stereo SLAM systems can store a keypoint as the triple $(u_L, v_L, u_R)$ — as ORB-SLAM2 does — and use $u_R = f\,(X_c - B)/Z_c + c_x$ as a third residual row in bundle adjustment: the right-image column *is* the depth measurement.

## The $Z^2$ law: depth resolution degrades quadratically

Differentiating $Z = fB/d$ with respect to $d$ gives

$$\Delta Z \approx \frac{Z^2}{fB}\,\Delta d,$$

so a fixed disparity-matching error $\Delta d$ (typically a fraction of a pixel) produces a depth error that grows with $Z^2$: doubling the distance quadruples the depth uncertainty. A worked example with $f = 500$ px, $B = 0.1$ m (so $fB = 50$ px·m) and matching precision $\Delta d = 0.25$ px:

| Depth $Z$ | Disparity $d = fB/Z$ | Depth error $\Delta Z$ |
|---|---|---|
| 2 m | 25 px | 0.02 m (1%) |
| 10 m | 5 px | 0.5 m (5%) |
| 20 m | 2.5 px | 2 m (10%) |

At 20 m this rig's "metric" depth is barely better than a guess — the same measurement that is millimeter-grade at arm's length.

## Design consequences

- **Baseline sets the usable depth range.** A larger baseline $B$ increases disparity for the same depth, improving long-range accuracy — but it also increases the minimum measurable depth (very close points fall outside both fields of view or exceed the disparity search range) and makes matching harder due to larger appearance change between views. Small-baseline rigs (e.g., ~10 cm on a drone) are accurate up close and nearly monocular at long range.
- **A practical rule of thumb**: stereo depth is reliable out to roughly 40x the baseline; beyond that, disparity shrinks below matching precision and points behave like monocular (bearing-only) observations. Stereo SLAM systems such as ORB-SLAM2 and Stereo DSO explicitly split points into "close" (trusted metric depth) and "far" (triangulated over time like monocular) using such a threshold.
- **Sub-pixel matching matters.** Since $\Delta d$ appears linearly in the depth error, sub-pixel disparity refinement (parabola fitting, SGM sub-pixel interpolation) directly improves 3D accuracy — it is the cheapest depth-accuracy upgrade available.

## In the estimator: prefer inverse depth

Note that disparity is *linear in inverse depth*: with $\rho = 1/Z$,

$$d = fB\,\rho.$$

Pixel-level matching noise therefore maps to approximately Gaussian noise in $\rho$, but to skewed, heavy-tailed noise in $Z$ (a $\pm 0.25$ px error at $d = 1$ px spans a huge, asymmetric depth interval). This is why SLAM systems parameterize far points by inverse depth, and why measurement covariances should be modeled in disparity/inverse-depth space and propagated, rather than assumed Gaussian in metric depth.

In a SLAM pipeline the conversion appears in two places: turning per-keypoint disparities into 3D landmark positions (or an inverse-depth parameterization), and weighting stereo observations in bundle adjustment according to their depth-dependent uncertainty.

## Common pitfalls

- **Trusting far stereo depth**: feeding 100 m "depths" from a 10 cm baseline into the estimator as if they were accurate metric measurements biases the map; treat low-disparity points as bearing-only.
- **Gaussian-in-$Z$ noise models**: assuming constant depth noise (or Gaussian noise in $Z$) makes the filter/BA overconfident exactly where stereo is weakest.
- **Baseline calibration error**: an error in $B$ scales *every* depth by the same factor — a global scale bias that no amount of averaging removes.
- **Forgetting the minimum depth**: points closer than the disparity search range silently fail to match, so the near limit is set by the search window, not by optics alone.

## Why it matters for SLAM

The $d = fB/Z$ geometry decides whether stereo actually helps: it tells you which landmarks carry metric information, how to set your rig's baseline for your operating range, and how to model measurement noise correctly in the estimator. Misunderstanding it (e.g., trusting stereo depth at 100 m from a 10 cm baseline) is a classic source of biased maps and inconsistent covariances.

## Related

- [Stereo rectification](stereo-rectification.md)
- [Scale observability](scale-observability.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)

[Back to Level 7](../README.md#level-7-stereo-slam)
