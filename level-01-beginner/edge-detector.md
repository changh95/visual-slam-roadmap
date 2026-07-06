# Edge detector

An edge is an image location where intensity changes sharply in one direction. Edge detection is a fundamental image-processing operation, and its core ingredient — the image gradient — underlies corner detection, optical flow, and direct SLAM methods alike.

## Sobel operator

The Sobel operator computes image gradients via convolution with two $3 \times 3$ kernels:

$$K_x = \begin{bmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{bmatrix}, \qquad
K_y = \begin{bmatrix} -1 & -2 & -1 \\ 0 & 0 & 0 \\ 1 & 2 & 1 \end{bmatrix}$$

The gradient magnitude is $|\nabla I| = \sqrt{(K_x * I)^2 + (K_y * I)^2}$, and the gradient direction is $\mathrm{atan2}(K_y * I,\, K_x * I)$. Sobel combines differentiation with a small amount of smoothing, making it more noise-tolerant than naive finite differences.

## Canny edge detector

The Canny detector is a multi-stage algorithm that turns raw gradients into thin, well-localized edge curves:

1. **Gaussian smoothing** to suppress noise.
2. **Sobel gradient** computation (magnitude and direction).
3. **Non-maximum suppression** along the gradient direction, thinning ridges to single-pixel width.
4. **Hysteresis thresholding** with a high and a low threshold: strong edges are kept, and weak edges are kept only if connected to strong ones.

Both detectors are one-liners in OpenCV (`cv::Sobel`, `cv::Canny`) and are worth implementing once from scratch to internalize how convolution and gradients work.

## Why it matters for SLAM

Image gradients computed by Sobel are the input to the Harris structure tensor and to Lucas-Kanade optical flow, so edge detection is a stepping stone to the feature machinery of SLAM front-ends. Edges themselves are also used directly: line/edge features complement points in low-texture man-made environments (e.g., PL-SLAM), and direct methods such as LSD-SLAM implicitly rely on high-gradient (edge-like) pixels for photometric alignment.

## Related

- [Corner detector](corner-detector.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)
- [PL-SLAM](../level-03-monocular-slam/pl-slam.md)
- [LSD-SLAM](../level-03-monocular-slam/lsd-slam.md)

[Back to Level 1](../README.md#level-1-beginner)
