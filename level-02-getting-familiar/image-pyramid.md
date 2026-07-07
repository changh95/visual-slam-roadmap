# Image Pyramid

An **image pyramid** is a multi-resolution representation of an image: a stack of progressively smaller (and correspondingly blurred) copies of the same picture. It is the standard engineering answer to the fact that neither the *scale* of scene structures nor the *magnitude* of inter-frame motion is known in advance — algorithms simply run at every level, or coarse levels bootstrap fine ones.

## Gaussian pyramid

The base level $I_0$ is the input image. Each subsequent level is obtained by low-pass filtering and subsampling:

$$
I_{\ell+1}(x, y) = \big(G_{\sigma} * I_{\ell}\big)(2x,\, 2y)
$$

i.e., convolve with a Gaussian kernel, then keep every second pixel in both directions. The blur is essential, not cosmetic: subsampling halves the sampling rate, so frequencies above the new Nyquist limit must be removed first or they **alias** into false low-frequency structure. Each halving of resolution is called an **octave**. The whole pyramid costs little: the geometric series $1 + \tfrac{1}{4} + \tfrac{1}{16} + \cdots$ converges to $\tfrac{4}{3}$ of the base image's memory.

Two common refinements:

- **Finer scale sampling.** SIFT fills each octave with $s$ intermediate scales, blurring by factors $k = 2^{1/s}$, so that difference-of-Gaussian responses can be compared across a dense set of scales and extrema localized in $(x, y, \sigma)$.
- **Non-power-of-2 factors.** ORB detectors typically use a gentler scale factor (ORB-SLAM uses 1.2 across 8 levels) so that a landmark remains matchable over a range of viewing distances without large jumps between levels.

A **Laplacian pyramid** stores instead the band-pass differences between consecutive Gaussian levels, $L_\ell = I_\ell - \mathrm{upsample}(I_{\ell+1})$ — the same idea that DoG exploits for blob detection, and a classical tool for image blending and compression.

## What pyramids buy in vision algorithms

**Scale-invariant detection.** A corner detector like FAST has a fixed 7-pixel footprint; it cannot respond to a corner that is 40 pixels wide. Running the *same* detector on every pyramid level effectively scans over object sizes. The level at which a feature fires is recorded — ORB scales the keypoint coordinates and descriptor patch accordingly, and in SLAM the detection level defines the distance range at which the landmark can be re-detected later (scale-aware matching in ORB-SLAM's search windows).

**Coarse-to-fine motion estimation.** Lucas-Kanade optical flow is valid only for sub-pixel to few-pixel displacements, because it linearizes the intensity function. A displacement of $d$ pixels at full resolution appears as $d / 2^{\ell}$ pixels at level $\ell$ — small enough to satisfy the linearization at some coarse level. Pyramidal LK (Bouguet's KLT) estimates flow $\mathbf{d}_L$ at the coarsest level $L$, then propagates it down as the initial guess

$$
\mathbf{g}_{\ell-1} = 2\,(\mathbf{g}_{\ell} + \mathbf{d}_{\ell}),
$$

refining at each finer level. With $L$ levels, a window of radius $w$ can capture motions on the order of $(2^{L+1}-1)\,w$ pixels instead of $w$. The same coarse-to-fine schedule drives direct image alignment in LSD-SLAM/DSO and dense methods like DTAM — coarse levels also smooth the photometric cost surface, widening the basin of convergence.

**Robustness and speed.** Coarse levels suppress noise and fine texture that create local minima; and processing at quarter or sixteenth resolution first lets a tracker reject bad hypotheses cheaply before touching full-resolution pixels.

## Practical bookkeeping

Details that matter when implementing pyramid-based front-ends:

- **Coordinate conventions**: a keypoint at $(x, y)$ on level $\ell$ corresponds to $(x \cdot s^{\ell},\, y \cdot s^{\ell})$ at the base level for scale factor $s$ — off-by-one-level bugs in this mapping are a classic source of subtly wrong reprojection errors.
- **Per-level feature budgets**: detectors distribute their feature quota across levels (more at fine levels, fewer at coarse ones) so the map contains landmarks usable at multiple distances.
- **Descriptor scale**: the descriptor patch must be sampled from the level of detection (or scaled accordingly), otherwise matching across scale silently degrades.
- **Blur-then-subsample order**: skipping the low-pass filter to save time introduces aliasing that hurts both detection repeatability and photometric alignment.

## Why it matters for SLAM

Pyramids appear in nearly every SLAM front-end, twice. First, *feature scale*: multi-level detection is what lets ORB-SLAM keep matching a landmark as the camera approaches or retreats from it — without it, tracks would die whenever apparent size changes. Second, *motion range*: pyramidal KLT and coarse-to-fine direct alignment are what let trackers survive fast camera motion between frames; when a SLAM system loses tracking under rapid rotation, the first questions are how many pyramid levels it uses and whether the coarsest level still sees enough structure. Choosing the number of levels and scale factor is a real tuning knob: more levels extend motion and scale range but cost compute and produce coarser, noisier estimates at the top.

## Related

- [Gaussian blur](../level-01-beginner/gaussian-blur.md)
- [SIFT](sift.md)
- [ORB](orb.md)
- [Optical flow](optical-flow.md)
- [KLT Tracker](klt-tracker.md)
