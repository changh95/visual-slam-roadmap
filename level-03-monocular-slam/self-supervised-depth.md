# Self-supervised depth

**Self-supervised monocular depth estimation** trains a network to predict per-pixel depth from a single image — *without any ground-truth depth labels*. The supervisory signal is **photometric consistency**: if the predicted depth (and relative camera pose) is correct, then one view of the scene can be warped into another view, and the warped image should match the real one.

Concretely, given a target image $I_t$ and a source image $I_s$ (the other image of a stereo pair, or a neighbouring video frame), the predicted depth $D_t$ and relative pose $T_{t \to s}$ define a warp: each pixel $\mathbf{p}$ is back-projected to 3D, transformed, and re-projected into the source view,

$$\mathbf{p}_s \sim K\, T_{t \to s}\, D_t(\mathbf{p})\, K^{-1} \mathbf{p},$$

and the training loss penalises the photometric difference between $I_t(\mathbf{p})$ and the reconstructed $I_s(\mathbf{p}_s)$ (typically an SSIM + L1 mix, plus an edge-aware smoothness prior). Two training regimes exist:

- **Stereo training**: the pose between views is the known, fixed stereo baseline — so the learned depth is *metric*. (Monodepth, Godard 2017.)
- **Monocular video training**: a second network predicts the frame-to-frame pose jointly with depth (SfM-Learner, Zhou 2017) — no rig needed, but depth is recovered only up to scale, and moving objects violate the static-scene assumption.

**Monodepth2** (Godard 2019) is the classic reference implementation, contributing simple fixes for the main failure modes: a per-pixel *minimum* reprojection loss across source frames (handles occlusion), an *auto-masking* trick that ignores pixels that do not change between frames (handles objects moving with the camera and static frames), and multi-scale losses computed at full resolution.

## The loss, in full

The standard photometric error combines structural similarity with absolute difference,

$$pe(I_a, I_b) = \frac{\alpha}{2}\left(1 - \mathrm{SSIM}(I_a, I_b)\right) + (1 - \alpha)\,\| I_a - I_b \|_1, \qquad \alpha = 0.85,$$

where the SSIM term buys robustness to brightness/exposure changes that would dominate a raw L1 loss. Because photometric error is uninformative in textureless regions (any depth reproduces a flat wall equally well), an **edge-aware smoothness** term regularises the (mean-normalised) inverse depth $d^*$:

$$L_{smooth} = \left| \partial_x d^* \right| e^{-\left|\partial_x I\right|} + \left| \partial_y d^* \right| e^{-\left|\partial_y I\right|},$$

which encourages smooth depth *except* across image edges, where depth discontinuities are likely. Monodepth2's per-pixel minimum over source frames, $\min_s pe(I_t, I_{s \to t})$, replaces the usual average: a pixel occluded in one source view but visible in another is scored only against the view where reprojection can actually succeed — a two-character change (mean → min) with outsized effect.

Note what the warping requires: differentiable bilinear sampling of $I_s$ at the non-integer locations $\mathbf{p}_s$ (the spatial-transformer trick). That is the piece that lets the whole geometric pipeline — depth, pose, projection — train end-to-end by gradient descent.

## Where it fails, and why

The supervisory signal is only as valid as its assumptions: a static, Lambertian scene with brightness constancy and a moving camera. Each violated assumption is a known failure mode:

- **Objects moving with the camera** (the car in front at matched speed) have zero optical flow, which photometric consistency explains as *infinite depth* — the classic "hole in the road ahead" artefact that auto-masking suppresses.
- **Independently moving objects** violate the rigid-scene warp and receive incorrect depth even when masked losses limit the damage.
- **Non-Lambertian surfaces** — reflections, glass, water, specular car paint — move "wrongly" under viewpoint change and corrupt the loss.
- **Low texture and low light**: no gradient signal, so depth there is pure interpolation from the smoothness prior.
- **Scale**: video-trained models inherit monocular scale ambiguity; the common per-image median-scaling evaluation protocol hides this, but a SLAM integration must supply scale from elsewhere (stereo training, IMU, or a metric prior).

## Common pitfalls

- **Trusting depth uncertainty-free**: network depth has spatially correlated, scene-dependent errors; fusing it into SLAM as if it were i.i.d. sensor noise over-weights it badly. D3VO's learned uncertainty is the principled answer.
- **Domain shift**: a KITTI-trained model applied indoors (or to a fisheye camera, or through a windshield at night) degrades silently — validate depth quality in *your* domain before building on it.
- **Intrinsics mismatch**: the warp uses $K$; feeding images with different focal length or unrectified distortion than training breaks the geometry the network internalised.

## Use in SLAM

For SLAM, these networks act as a *depth prior*: CNN-SLAM fuses learned depth into LSD-SLAM-style dense mapping; DVSO uses a stereo-trained network as a "virtual stereo" constraint inside DSO, resolving monocular scale ambiguity; D3VO goes further and also learns pose and photometric uncertainty, tightly integrating all three into the VO back-end.

## Why it matters for SLAM

Self-supervised depth turns a single camera into an approximate depth sensor using nothing but unlabeled video for training — directly attacking monocular SLAM's two classic weaknesses, scale ambiguity and slow depth initialisation. The photometric-warping loss at its core is the same machinery as direct SLAM's photometric error, making this the natural bridge between deep learning and direct methods, and the conceptual ancestor of today's depth foundation models.

## Related

- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [SfM-Learner](../level-05-deep-learning/sfm-learner.md)
- [CNN-SLAM](cnn-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
