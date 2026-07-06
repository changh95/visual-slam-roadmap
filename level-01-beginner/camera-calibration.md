# Camera calibration

Camera calibration recovers the intrinsic matrix $\mathbf{K}$ and the lens distortion parameters of a camera from images of a known calibration target. Without accurate calibration, every downstream geometric computation — triangulation, pose estimation, epipolar search — is systematically wrong.

## Zhang's Method

Zhang's method (1999) is the standard calibration procedure. It uses images of a planar checkerboard taken from multiple viewpoints. Each image provides correspondences between known 3D board corners and detected 2D image corners, giving constraints on both the homography (image-to-board) and the intrinsic parameters. The procedure:

1. Detect checkerboard corners in $N \geq 3$ images at different orientations.
2. Compute homographies $H_i$ between the board plane and each image.
3. Extract constraints on $\mathbf{K}$ from each $H_i$, using $H = \lambda\mathbf{K}[r_1, r_2, \mathbf{t}]$ with $r_1 \perp r_2$ and $\|r_1\| = \|r_2\| = 1$.
4. Solve a linear system for the intrinsic parameters.
5. Refine all parameters (intrinsic + extrinsic + distortion) via nonlinear least squares.

## Lens Distortion Models

Real lenses deviate from the ideal pinhole model. Two standard models:

**Radial distortion** causes straight lines to appear curved:

$$x_d = x'(1 + k_1 r^2 + k_2 r^4 + k_3 r^6), \qquad y_d = y'(1 + k_1 r^2 + k_2 r^4 + k_3 r^6)$$

where $r^2 = x'^2 + y'^2$ is the squared distance from the principal point. $k_1 > 0$ gives barrel distortion; $k_1 < 0$ gives pincushion distortion. Wide-angle lenses have large $|k_1|$.

**Tangential distortion** is caused by the lens not being perfectly parallel to the image plane:

$$x_d = x' + 2p_1 x'y' + p_2(r^2 + 2x'^2), \qquad y_d = y' + p_1(r^2 + 2y'^2) + 2p_2 x'y'$$

In practice, $k_1, k_2$ (and sometimes $k_3, p_1, p_2$) are estimated jointly with $\mathbf{K}$. OpenCV implements this directly in `cv::calibrateCamera()`.

## Why it matters for SLAM

SLAM systems assume that undistorted, calibrated observations feed their geometric solvers; a few pixels of uncorrected distortion at the image border can dominate reprojection error and corrupt the map. Calibration is also the template for harder problems you will meet later — camera-IMU and camera-LiDAR extrinsic calibration follow the same "known target + nonlinear refinement" pattern. Practically, calibrating your own camera with a checkerboard is one of the best first exercises in the field.

## Related

- [Pinhole camera model](pinhole-camera-model.md)
- [Camera models beyond pinhole](camera-models-beyond-pinhole.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Multi-sensor calibration](../level-02-getting-familiar/multi-sensor-calibration.md)

[Back to Level 1](../README.md#level-1-beginner)
