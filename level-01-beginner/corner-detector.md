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

## Corner Response Function

Rather than computing eigenvalues directly (expensive), Harris proposed the response:

$$R = \det(M) - k\,(\mathrm{trace}(M))^2 = \lambda_1\lambda_2 - k(\lambda_1 + \lambda_2)^2$$

with $k \in [0.04, 0.06]$ empirically. $R > 0$ indicates a corner, $R < 0$ an edge, and small $|R|$ a flat region. Non-maximum suppression then selects the strongest local maxima as the final corners.

## Why it matters for SLAM

Corners are the raw material of feature-based SLAM front-ends: they become the keypoints that get described, matched, and triangulated into map points. The structure tensor reappears almost verbatim in Lucas-Kanade optical flow — a corner (both eigenvalues large) is exactly the kind of point that can be tracked reliably, which is why "good features to track" and Harris corners are so closely related. Later detectors used in real-time SLAM (FAST, ORB's oriented FAST) are faster heirs of the same idea.

## Related

- [Edge detector](edge-detector.md)
- [Basic Linear Algebra](basic-linear-algebra.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)

[Back to Level 1](../README.md#level-1-beginner)
