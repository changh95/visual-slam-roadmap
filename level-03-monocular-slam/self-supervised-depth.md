# Self-supervised depth

**Self-supervised monocular depth estimation** trains a network to predict per-pixel depth from a single image — *without any ground-truth depth labels*. The supervisory signal is **photometric consistency**: if the predicted depth (and relative camera pose) is correct, then one view of the scene can be warped into another view, and the warped image should match the real one.

Concretely, given a target image $I_t$ and a source image $I_s$ (the other image of a stereo pair, or a neighbouring video frame), the predicted depth $D_t$ and relative pose $T_{t \to s}$ define a warp: each pixel $\mathbf{p}$ is back-projected to 3D, transformed, and re-projected into the source view,

$$\mathbf{p}_s \sim K\, T_{t \to s}\, D_t(\mathbf{p})\, K^{-1} \mathbf{p},$$

and the training loss penalises the photometric difference between $I_t(\mathbf{p})$ and the reconstructed $I_s(\mathbf{p}_s)$ (typically an SSIM + L1 mix, plus an edge-aware smoothness prior). Two training regimes exist:

- **Stereo training**: the pose between views is the known, fixed stereo baseline — so the learned depth is *metric*. (Monodepth, Godard 2017.)
- **Monocular video training**: a second network predicts the frame-to-frame pose jointly with depth (SfM-Learner, Zhou 2017) — no rig needed, but depth is recovered only up to scale, and moving objects violate the static-scene assumption.

**Monodepth2** (Godard 2019) is the classic reference implementation, contributing simple fixes for the main failure modes: a per-pixel *minimum* reprojection loss across source frames (handles occlusion), an *auto-masking* trick that ignores pixels that do not change between frames (handles objects moving with the camera and static frames), and multi-scale losses computed at full resolution.

For SLAM, these networks act as a *depth prior*: CNN-SLAM fuses learned depth into LSD-SLAM-style dense mapping; DVSO uses a stereo-trained network as a "virtual stereo" constraint inside DSO, resolving monocular scale ambiguity; D3VO goes further and also learns pose and photometric uncertainty, tightly integrating all three into the VO back-end.

## Why it matters for SLAM

Self-supervised depth turns a single camera into an approximate depth sensor using nothing but unlabeled video for training — directly attacking monocular SLAM's two classic weaknesses, scale ambiguity and slow depth initialisation. The photometric-warping loss at its core is the same machinery as direct SLAM's photometric error, making this the natural bridge between deep learning and direct methods, and the conceptual ancestor of today's depth foundation models.

## Related

- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [SfM-Learner](../level-05-deep-learning/sfm-learner.md)
- [CNN-SLAM](cnn-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
