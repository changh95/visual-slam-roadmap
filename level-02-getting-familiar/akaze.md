# AKAZE

**AKAZE (Accelerated-KAZE)** is a feature detector and binary descriptor built on a **nonlinear scale space**. Where SIFT and ORB build multi-scale representations with Gaussian blur — which smooths noise and object boundaries equally — KAZE and AKAZE smooth adaptively: strongly in flat regions, weakly across edges. The result is keypoints that stay better localized on structure boundaries.

## Nonlinear diffusion scale space

Gaussian scale space is the solution of the linear heat equation. KAZE replaces it with **nonlinear diffusion**:

$$\frac{\partial L}{\partial t} = \mathrm{div}\big(c(x, y, t)\, \nabla L\big)$$

where $L$ is the evolving image, $t$ is the scale parameter, and $c$ is a **conductivity function** that gates smoothing by local image content. Following Perona-Malik, conductivity is driven by the gradient of a slightly pre-smoothed image $L_\sigma$, e.g.

$$g_2 = \frac{1}{1 + \dfrac{\lvert \nabla L_\sigma \rvert^2}{\lambda^2}}$$

The contrast parameter $\lambda$ sets which gradients count as "edges": where $\lvert \nabla L_\sigma \rvert \gg \lambda$, conductivity drops toward zero and diffusion stops, preserving the edge; in low-gradient regions diffusion proceeds and noise is smoothed away.

## FED: making it fast

Nonlinear diffusion has no closed-form solution and must be integrated numerically. KAZE (Alcantarilla et al., 2012) used AOS (additive operator splitting) schemes, which are stable but expensive. AKAZE (2013) replaced them with **Fast Explicit Diffusion (FED)**: cycles of simple explicit diffusion steps with specially chosen varying step sizes, whose combined effect is stable and accurate while being much cheaper and easy to parallelize. This is the "Accelerated" in the name — similar quality to KAZE at a fraction of the cost. AKAZE also builds the scale space on a pyramid (downsampling between octaves) to save further computation.

## Detection and description

- **Detector**: at each evolution level, AKAZE computes the scale-normalized **determinant of the Hessian** response $\sigma^2 \big(L_{xx} L_{yy} - L_{xy}^2\big)$ and keeps extrema across space and scale, followed by sub-pixel refinement — a blob-style detector like SIFT's DoG, but computed in the nonlinear scale space.
- **Descriptor**: **M-LDB (Modified Local Difference Binary)**, a binary descriptor that compares average intensities *and* first-derivative values between cells of a grid around the keypoint. The grid is rotated by the keypoint's dominant orientation and scaled with the detection scale, giving rotation and scale invariance while keeping the descriptor binary — matched with Hamming distance via XOR + popcount, like ORB.

## Practical notes

- The contrast parameter $\lambda$ is set automatically from the image's gradient-magnitude histogram (a fixed percentile), so the "edge vs. flat" decision adapts to each image's contrast rather than requiring manual tuning.
- OpenCV exposes AKAZE with descriptor options: full M-LDB, an *upright* variant (skips rotation invariance for speed when the camera does not roll — common on ground robots), and reduced-size descriptors that trade distinctiveness for memory.
- Because the descriptor is binary, AKAZE plugs into the same Hamming-distance brute-force or LSH matching machinery as ORB — no pipeline changes needed to swap features.

## Where it sits among detectors

In practice AKAZE occupies a middle ground: notably more repeatable and accurate than ORB, especially on blurry, low-contrast, or deformable scenes — while remaining far cheaper than SIFT. It ships with OpenCV, requires no patent licensing, and its binary descriptor drops into any Hamming-based matching pipeline. Its main cost is that scale-space construction is still slower than ORB's simple image pyramid, which is why high-frame-rate SLAM front-ends tend to stay with ORB/FAST and use AKAZE where matching quality matters more than raw speed.

## Why it matters for SLAM

Feature quality bounds everything downstream — tracking stability, map accuracy, loop-closure recall. AKAZE demonstrates that the *scale space itself* is a design choice: preserving edges during smoothing yields better-localized keypoints near object boundaries, exactly where SLAM features often live. For pipelines suffering from motion blur or weak texture where ORB degrades, AKAZE is one of the standard "stronger classical feature" upgrades to try before reaching for learned features.

## Hands-on

- [Classical local feature detection](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch01_03)

## Related

- [SIFT](sift.md)
- [ORB](orb.md)
- [FAST](fast.md)
- [Image pyramid](image-pyramid.md)
- [Brute-force matching](brute-force-matching.md)
