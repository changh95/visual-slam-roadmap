# Thresholding

**Thresholding** converts a grayscale image into a binary decision per pixel: keep or discard, foreground or background, edge or not. Despite its simplicity it appears throughout vision pipelines — as explicit image binarization, and implicitly inside detectors and descriptors that compare intensities or scores against a cutoff.

## Global thresholding

The simplest form applies one threshold $T$ to the whole image:

$$B(x, y) = \begin{cases} 1 & \text{if } I(x, y) > T \\ 0 & \text{otherwise} \end{cases}$$

Choosing $T$ by hand is brittle, so **Otsu's method** selects it automatically from the intensity histogram: it picks the $T$ that maximizes the **between-class variance** of the two resulting pixel classes,

$$\sigma_B^2(T) = \omega_0(T)\, \omega_1(T)\, \big(\mu_0(T) - \mu_1(T)\big)^2$$

where $\omega_0, \omega_1$ are the fractions of pixels below/above $T$ and $\mu_0, \mu_1$ are their mean intensities. Maximizing between-class variance is equivalent to minimizing the within-class variance — the threshold that best separates the histogram into two modes.

## Adaptive (local) thresholding

A single global $T$ fails under uneven illumination (shadows, vignetting). Adaptive thresholding computes a per-pixel threshold from a local neighborhood:

$$T(x, y) = m_W(x, y) - C$$

where $m_W$ is the (plain or Gaussian-weighted) mean over a window $W$ around the pixel and $C$ is a small constant. Each pixel is then compared against its own local threshold. This is how fiducial-marker detectors (ArUco, AprilTag) reliably binarize images before extracting the black-and-white marker grid.

## Hysteresis thresholding

Canny edge detection uses **two** thresholds. Pixels with gradient magnitude above $T_{\text{high}}$ are accepted as strong edges; pixels between $T_{\text{low}}$ and $T_{\text{high}}$ are kept only if they are connected to a strong edge. This preserves long, weak edge segments while rejecting isolated noise responses — a trick worth remembering whenever a single cutoff either fragments good structures or admits too much noise.

## Implicit thresholds inside feature pipelines

Thresholding is baked into most feature machinery:

- **FAST** declares a pixel $p$ a corner only if a contiguous arc of circle pixels is brighter than $I_p + t$ or darker than $I_p - t$; the threshold $t$ directly controls the detected corner count and is often adapted per image or per grid cell to keep feature counts stable.
- **BRIEF/ORB descriptors** are sequences of 1-bit thresholded intensity comparisons between pixel pairs — each descriptor bit is a tiny threshold test.
- **Detector responses** (Harris score, DoG contrast, matching scores) are all filtered by minimum-response thresholds before non-maximum suppression.
- **Direct methods** select pixels whose gradient magnitude exceeds a threshold, since only high-gradient pixels constrain photometric alignment.

## Why it matters for SLAM

SLAM systems are full of thresholds, and knowing the standard techniques for choosing them well separates robust systems from fragile ones. Adaptive thresholding keeps marker- and feature-based pipelines working across lighting changes; the FAST threshold governs the density and stability of the features every downstream module depends on; hysteresis-style two-threshold logic generalizes to many accept/reject decisions (e.g., match filtering). When a SLAM front-end dies indoors-to-outdoors, a hard-coded global threshold is a common culprit.

## Related

- [Edge detector](edge-detector.md)
- [Corner detector](corner-detector.md)
- [Gaussian Blur](gaussian-blur.md)
- [FAST](../level-02-getting-familiar/fast.md)
- [ORB](../level-02-getting-familiar/orb.md)
