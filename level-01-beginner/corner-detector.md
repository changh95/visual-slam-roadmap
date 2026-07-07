# Corner detector

A corner is an image location where the intensity changes significantly in *multiple directions*. Corners are stable, repeatable landmarks: unlike flat regions (no gradient) or edges (gradient in only one direction), a corner can be localized unambiguously in 2D, which makes it ideal for tracking and matching. The classic detector is the **Harris corner detector**.

## Structure Tensor

The **structure tensor** (second-moment matrix) at a pixel, computed over a local window $W$ weighted by $w(x,y)$ (often a Gaussian):

$$M = \sum_{(x,y) \in W} w(x,y) \begin{bmatrix} I_x^2 & I_x I_y \\ I_x I_y & I_y^2 \end{bmatrix}$$

where $I_x = \frac{\partial I}{\partial x}$ and $I_y = \frac{\partial I}{\partial y}$ are image gradients (computed with Sobel operators). The eigenvalues $\lambda_1, \lambda_2$ of $M$ characterize the local structure:

| $\lambda_1$ | $\lambda_2$ | Interpretation |
|---|---|---|
| $\approx 0$ | $\approx 0$ | Flat region (no gradients) |
| $\gg 0$ | $\approx 0$ | Edge (gradient in one direction only) |
| $\gg 0$ | $\gg 0$ | Corner (gradients in both directions) |

The intuition: $M$ summarizes how the sum of squared intensity differences changes when the window is shifted. A corner is a point where *any* shift direction produces a large change — which is precisely the condition "both eigenvalues large".

## Corner Response Function

Rather than computing eigenvalues directly (expensive), Harris proposed the response:

$$R = \det(M) - k\,(\mathrm{trace}(M))^2 = \lambda_1\lambda_2 - k(\lambda_1 + \lambda_2)^2$$

with $k \in [0.04, 0.06]$ empirically. $R > 0$ indicates a corner, $R < 0$ an edge, and small $|R|$ a flat region. Non-maximum suppression then selects the strongest local maxima as the final corners.

The closely related **Shi-Tomasi** criterion ("Good Features to Track") scores each pixel by $\min(\lambda_1, \lambda_2)$ directly — the worst-case trackability of the patch — and is what OpenCV's `cv::goodFeaturesToTrack` implements.

## A from-scratch sketch

Implementing Harris in a few lines of NumPy/OpenCV is one of the best beginner exercises:

```python
import cv2, numpy as np

I  = cv2.imread("frame.png", cv2.IMREAD_GRAYSCALE).astype(np.float32)
Ix = cv2.Sobel(I, cv2.CV_32F, 1, 0)
Iy = cv2.Sobel(I, cv2.CV_32F, 0, 1)

# window-averaged structure tensor entries
Sxx = cv2.GaussianBlur(Ix * Ix, (5, 5), 1.0)
Syy = cv2.GaussianBlur(Iy * Iy, (5, 5), 1.0)
Sxy = cv2.GaussianBlur(Ix * Iy, (5, 5), 1.0)

k = 0.04
R = (Sxx * Syy - Sxy**2) - k * (Sxx + Syy)**2   # Harris response
corners = R > 0.01 * R.max()                    # threshold before NMS
```

## Practical notes for SLAM front-ends

- **FAST**, the detector behind ORB, replaces the structure tensor with a fast segment test on a circle of 16 pixels around the candidate — much cheaper, which is what makes real-time detection of thousands of keypoints feasible. Conceptually it still targets the same "intensity changes in multiple directions" property.
- **Spatial distribution matters**: raw response thresholds concentrate corners on highly textured regions. SLAM systems therefore bucket the image into a grid and keep the best corners per cell so that pose estimation is constrained in all image regions.
- **Sub-pixel refinement** (fitting a quadratic to the response around the maximum, e.g. `cv::cornerSubPix`) noticeably improves downstream geometry.

## Common pitfalls

- **Window/blur size trade-off**: too small a window makes the tensor noisy; too large blurs distinct corners together and displaces their locations.
- **Threshold as a fraction of the max response** adapts poorly across scenes; per-cell selection is more robust than a single global threshold.
- **Corners on moving objects or specular highlights** are geometrically useless; detection quality is only half the story — the rest is outlier rejection downstream.

## Why it matters for SLAM

Corners are the raw material of feature-based SLAM front-ends: they become the keypoints that get described, matched, and triangulated into map points. The structure tensor reappears almost verbatim in Lucas-Kanade optical flow — a corner (both eigenvalues large) is exactly the kind of point that can be tracked reliably, which is why "good features to track" and Harris corners are so closely related. Later detectors used in real-time SLAM (FAST, ORB's oriented FAST) are faster heirs of the same idea.

## Related

- [Edge detector](edge-detector.md)
- [Basic Linear Algebra](basic-linear-algebra.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
