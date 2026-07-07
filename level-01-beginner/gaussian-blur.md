# Gaussian Blur

**Gaussian blur** is the convolution of an image $I$ with a 2D Gaussian kernel. It is the standard low-pass filter of computer vision: it suppresses high-frequency noise before any derivative-based operation, and it is the mathematical foundation of scale space. The kernel with standard deviation $\sigma$ is

$$G_\sigma(x, y) = \frac{1}{2\pi\sigma^2} \exp\!\left(-\frac{x^2 + y^2}{2\sigma^2}\right)$$

and the smoothed image is $L(x, y, \sigma) = (G_\sigma * I)(x, y)$, where $*$ denotes convolution. In practice the kernel is truncated to a finite window (a common choice is a half-width of about $3\sigma$, since almost all of the Gaussian's mass lies within $\pm 3\sigma$) and normalized so its entries sum to 1, which preserves the average image brightness.

## Key properties

- **Separability.** The 2D Gaussian factors into two 1D Gaussians, $G_\sigma(x,y) = g_\sigma(x)\, g_\sigma(y)$. A $k \times k$ 2D convolution ($O(k^2)$ per pixel) becomes a horizontal pass followed by a vertical pass ($O(2k)$ per pixel). Every serious implementation exploits this.
- **Cascade (semigroup) property.** Blurring with $\sigma_1$ and then with $\sigma_2$ is equivalent to a single blur with $\sqrt{\sigma_1^2 + \sigma_2^2}$. This lets scale-space pyramids build each level incrementally from the previous one instead of re-blurring the original image.
- **Scale-space uniqueness.** The Gaussian is the only kernel that generates a linear scale space without introducing new spurious structures as $\sigma$ grows (the causality property). This is why SIFT and related detectors define scale as "amount of Gaussian blur."
- **Noise vs. localization trade-off.** Larger $\sigma$ removes more noise but also removes fine detail and displaces edges/corners. Feature pipelines therefore use small $\sigma$ for detection and larger $\sigma$ only where scale invariance is required.

## Role in derivative computation

Differentiation amplifies noise, so gradients are always computed on a smoothed image. Because convolution and differentiation commute,

$$\frac{\partial}{\partial x}\big(G_\sigma * I\big) = \left(\frac{\partial G_\sigma}{\partial x}\right) * I$$

one can convolve directly with the *derivative of a Gaussian*. Harris corner detection, Canny edges, KLT tracking, and optical flow all rely on gradients stabilized this way. The **Difference of Gaussians (DoG)** used by SIFT,

$$D(x, y, \sigma) = L(x, y, k\sigma) - L(x, y, \sigma)$$

is a cheap approximation to the scale-normalized Laplacian of Gaussian, turning two blurs and a subtraction into a blob detector.

## Anti-aliasing in image pyramids

Downsampling an image without first removing frequencies above the new Nyquist limit produces aliasing artifacts. Image pyramids therefore apply a Gaussian blur before each halving step — the classic Gaussian pyramid. Multi-scale feature detection (ORB's scale levels, KLT's coarse-to-fine tracking) depends on this pre-smoothing being done correctly.

## Practical notes

- **Choosing the kernel size**: given $\sigma$, a window of roughly $6\sigma + 1$ pixels captures the kernel; conversely, libraries derive $\sigma$ from a requested kernel size when only one is given. Too small a window truncates the Gaussian and introduces artifacts.
- **Repeated box filters**: by the central limit theorem, convolving several times with a box (mean) filter approximates a Gaussian; this is a common trick on hardware where box filters are nearly free (integral images).
- **Border handling**: convolution needs values outside the image; replicate/reflect padding choices subtly change responses near borders, which matters when features are detected close to image edges.
- **Blur is not always the enemy**: deliberately blurring the *reference* image widens the convergence basin of direct/photometric alignment, which is one reason coarse pyramid levels (heavily smoothed) are aligned first.

## Why it matters for SLAM

Almost every front-end operation in visual SLAM touches a Gaussian blur: gradient-based detectors and trackers smooth before differentiating; SIFT builds its entire detection pipeline on the Gaussian scale space and DoG; ORB and KLT run on Gaussian pyramids for scale robustness; and direct methods benefit from mild smoothing that widens the basin of convergence of photometric alignment. Understanding how $\sigma$ trades noise suppression against feature localization accuracy explains many practical tuning decisions in SLAM front-ends.

## Related

- [Corner detector](corner-detector.md)
- [Edge detector](edge-detector.md)
- [Image pyramid](../level-02-getting-familiar/image-pyramid.md)
- [SIFT](../level-02-getting-familiar/sift.md)
- [Optical flow](../level-02-getting-familiar/optical-flow.md)
