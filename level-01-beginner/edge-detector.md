# Edge detector

An edge is an image location where intensity changes sharply in one direction. Edge detection is a fundamental image-processing operation, and its core ingredient — the image gradient — underlies corner detection, optical flow, and direct SLAM methods alike.

## Grayscale and smoothing first

Edge detection (like most SLAM front-end processing) operates on **grayscale** images: gradients only need intensity, one channel is 3x faster to process than three, and color is inconsistent across lighting. The standard conversion is the luminance formula $I = 0.299R + 0.587G + 0.114B$.

Since differentiation amplifies noise, images are smoothed before gradient computation with a **Gaussian blur** — convolution with the kernel

$$G(x,y) = \frac{1}{2\pi\sigma^2}\exp\!\left(-\frac{x^2+y^2}{2\sigma^2}\right)$$

The choice of $\sigma$ sets the scale of edges you detect: small $\sigma$ preserves fine detail (and noise), large $\sigma$ keeps only coarse structure.

## Sobel operator

The Sobel operator computes image gradients via convolution with two $3 \times 3$ kernels:

$$K_x = \begin{bmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{bmatrix}, \qquad
K_y = \begin{bmatrix} -1 & -2 & -1 \\ 0 & 0 & 0 \\ 1 & 2 & 1 \end{bmatrix}$$

The gradient magnitude is $|\nabla I| = \sqrt{(K_x * I)^2 + (K_y * I)^2}$, and the gradient direction is $\mathrm{atan2}(K_y * I,\, K_x * I)$. Sobel combines differentiation (the $[-1, 0, 1]$ pattern) with smoothing perpendicular to it (the $[1, 2, 1]$ weights), making it more noise-tolerant than naive finite differences.

## Canny edge detector

The Canny detector is a multi-stage algorithm that turns raw gradients into thin, well-localized edge curves:

1. **Gaussian smoothing** to suppress noise.
2. **Sobel gradient** computation (magnitude and direction).
3. **Non-maximum suppression** along the gradient direction, thinning ridges to single-pixel width: a pixel survives only if its magnitude exceeds both neighbours along the gradient.
4. **Hysteresis thresholding** with a high and a low threshold: strong edges (above high) are kept, and weak edges (between low and high) are kept only if connected to strong ones. This preserves continuous contours while rejecting isolated noise responses.

```python
import cv2
edges = cv2.Canny(gray, threshold1=50, threshold2=150)  # low, high
```

Both detectors are one-liners in OpenCV (`cv::Sobel`, `cv::Canny`) and are worth implementing once from scratch to internalize how convolution and gradients work.

## Common pitfalls

- **Skipping the blur**: Canny on a noisy raw image produces speckled, fragmented edges; tune $\sigma$ (or the built-in aperture) together with the thresholds.
- **Single-threshold thinking**: the two Canny thresholds are the point of the algorithm — a lone threshold either fragments contours or admits noise; the low threshold should be a fraction of the high one.
- **Edges are not features**: an edge point can slide along its contour (the *aperture problem*), so it constrains geometry in only one direction — this is exactly why corners, not edge points, are matched as keypoints, and why edge-based SLAM treats edges as 1D constraints.

## Why it matters for SLAM

Image gradients computed by Sobel are the input to the Harris structure tensor and to Lucas-Kanade optical flow, so edge detection is a stepping stone to the feature machinery of SLAM front-ends. Edges themselves are also used directly: line/edge features complement points in low-texture man-made environments (e.g., PL-SLAM), and direct methods such as LSD-SLAM implicitly rely on high-gradient (edge-like) pixels for photometric alignment.

## Related

- [Corner detector](corner-detector.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)
- [PL-SLAM](../level-03-monocular-slam/pl-slam.md)
- [LSD-SLAM](../level-03-monocular-slam/lsd-slam.md)
- [DSO](../level-03-monocular-slam/dso.md)

[Back to Level 1](../README.md#level-1-beginner)
