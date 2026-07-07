# Scale ambiguity

**Scale ambiguity** is the fundamental limitation of monocular SLAM: from images alone, absolute metric scale is unrecoverable. A scene observed at distance $d$ with camera baseline $b$ produces *exactly* the same images as a scene at distance $\alpha d$ with baseline $\alpha b$, for any positive scalar $\alpha$. A dollhouse filmed up close and a real house filmed from far away are geometrically indistinguishable to a single moving camera.

Formally, a monocular reconstruction lives in a **similarity space** $\mathrm{Sim}(3)$ (rotation + translation + scale, 7 DoF) rather than the Euclidean $SE(3)$: the epipolar constraint fixes rotation and translation *direction*, but the translation magnitude — and with it the entire map scale — is a free parameter. Monocular systems simply pick a scale at initialisation (e.g. normalising the first baseline to 1).

## Seeing it in the math

Take the projection of a world point $\mathbf{X}$ into a camera at pose $(R, \mathbf{t})$:

$$\mathbf{x} \sim K \left( R\, \mathbf{X} + \mathbf{t} \right).$$

Now scale the entire world *and* every camera translation by $\alpha > 0$: $\mathbf{X}' = \alpha \mathbf{X}$, $\mathbf{t}' = \alpha \mathbf{t}$. Then

$$K \left( R\, \mathbf{X}' + \mathbf{t}' \right) = \alpha\, K \left( R\, \mathbf{X} + \mathbf{t} \right) \sim \mathbf{x},$$

because projective equality ignores the overall factor $\alpha$. *Every* image measurement in *every* camera is unchanged, so no photometric or geometric image cost can distinguish the two reconstructions — the likelihood is exactly flat along the scale direction. This also identifies precisely what breaks the symmetry: any measurement with physical units that does **not** get multiplied by $\alpha$. An accelerometer measurement (m/s²), a stereo baseline (m), a wheel-encoder distance (m), or a depth reading (m) all refuse to scale, and the flat direction disappears — which is the one-line explanation of every scale-recovery technique listed below.

The same reasoning explains why the ambiguity is exactly **one** dimension: rotations and translation directions are pinned by the epipolar geometry, so of $\mathrm{Sim}(3)$'s 7 DoF, images determine 6 relative DoF and leave only $\alpha$ free (plus the arbitrary global gauge — where you put the world origin — which every SLAM formulation has).

Worse than the unknown global scale is **scale drift**: because scale is unobservable, small errors let the estimated scale slowly wander along the trajectory, so a long monocular loop may return to its start at a different scale. This is why monocular systems such as ORB-SLAM perform loop closure over $\mathrm{Sim}(3)$ — the loop correction must fix scale as well as pose.

How scale is recovered in practice:

- **IMU fusion (VIO)**: the accelerometer measures metric acceleration, making scale observable given sufficient motion — the approach used by VINS-Mono, ORB-SLAM3 inertial mode, and every phone/headset tracker.
- **Stereo or RGB-D**: a known baseline or direct depth measurement provides scale by construction.
- **Known object sizes / geometry priors**: recognised objects (CubeSLAM), known markers, camera height above the ground plane (common in driving).
- **Learned depth priors**: modern metric monocular depth networks (e.g. Metric3D) and metric-trained 3D foundation models (e.g. MASt3R) predict approximately metre-scaled geometry from a single image, giving monocular pipelines an approximate absolute scale — a learned prior, not a geometric guarantee, but often good in practice.

## Consequences for evaluation and pitfalls

Because a monocular trajectory has no defined units, evaluating one against ground truth requires estimating the alignment *including scale*: a $\mathrm{Sim}(3)$ (7-DoF) alignment, typically via Umeyama's closed-form method, before computing ATE. Reading benchmarks demands care here — a monocular system evaluated with 7-DoF alignment and a stereo/VIO system with 6-DoF alignment are being graded on different curves, and a single global scale correction cannot hide *scale drift*, which is why long outdoor monocular sequences (KITTI) punish pure monocular methods so visibly.

Pitfalls worth knowing before they bite:

- **Pure rotation gives no scale — and no triangulation at all**: with zero baseline there is no parallax; monocular initialisation fails or degenerates under rotation-only motion, which is why initialisers wait for sufficient parallax (or model the homography case separately).
- **Constant velocity fools VIO scale too**: scale becomes observable through the accelerometer only under *non-zero acceleration*; a drone cruising at constant velocity (or a car on cruise control) provides no excitation, and VIO scale can drift until the next acceleration.
- **Scale collapse in optimisation**: monocular BA has a flat direction along scale; without gauge fixing (anchoring a pose pair distance or adding a prior), numerical drift can shrink or inflate the whole map between optimisation runs.
- **Mixed-scale maps after merging**: merging two monocular sub-maps (multi-session or multi-robot) requires estimating a relative $\mathrm{Sim}(3)$, not $SE(3)$ — merging at fixed scale silently deforms one map to fit the other.
- **Learned metric depth is a prior, not a sensor**: metric depth networks can be systematically off (per-scene bias from unfamiliar focal lengths or scene types); treat their scale as a measurement with generous uncertainty, not as ground truth.

## Why it matters for SLAM

Scale ambiguity dictates system design: it is *the* reason phones and headsets add an IMU, cars add stereo/LiDAR, and monocular papers report trajectory error only after scale alignment with ground truth. Understanding which measurements make scale observable — and how scale drift corrupts long trajectories — is essential for reading any monocular or visual-inertial SLAM paper.

## Related

- [Scale observability](../level-07-stereo-slam/scale-observability.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [Metric3D](../level-05-deep-learning/metric3d.md)
- [MASt3R](mast3r.md)
- [CubeSLAM](cubeslam.md)
