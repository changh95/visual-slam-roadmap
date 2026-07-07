# Camera calibration

Camera calibration recovers the intrinsic matrix $\mathbf{K}$ and the lens distortion parameters of a camera from images of a known calibration target. Without accurate calibration, every downstream geometric computation — triangulation, pose estimation, epipolar search — is systematically wrong.

## Zhang's Method

Zhang's method (1999) is the standard calibration procedure. It uses images of a planar checkerboard taken from multiple viewpoints. Each image provides correspondences between known 3D board corners and detected 2D image corners, giving constraints on both the homography (image-to-board) and the intrinsic parameters. The procedure:

1. Detect checkerboard corners in $N \geq 3$ images at different orientations.
2. Compute homographies $H_i$ between the board plane and each image.
3. Extract constraints on $\mathbf{K}$ from each $H_i$, using $H = \lambda\mathbf{K}[r_1, r_2, \mathbf{t}]$ with $r_1 \perp r_2$ and $\|r_1\| = \|r_2\|$.
4. Solve a linear system for the intrinsic parameters.
5. Refine all parameters (intrinsic + extrinsic + distortion) via nonlinear least squares.

**Where the constraints come from.** Write $H = [\mathbf{h}_1, \mathbf{h}_2, \mathbf{h}_3]$. Since $\mathbf{h}_1 \propto \mathbf{K}r_1$ and $\mathbf{h}_2 \propto \mathbf{K}r_2$ with $r_1, r_2$ orthonormal, each view yields two linear equations in the entries of the symmetric matrix $B = \mathbf{K}^{-T}\mathbf{K}^{-1}$:

$$\mathbf{h}_1^T B\, \mathbf{h}_2 = 0, \qquad \mathbf{h}_1^T B\, \mathbf{h}_1 = \mathbf{h}_2^T B\, \mathbf{h}_2$$

$B$ has 6 unknowns (5 if skew is assumed zero), so 3 views suffice; $\mathbf{K}$ is then recovered from $B$ by Cholesky-style decomposition. This is why the board must be shown at *different orientations* — parallel views give redundant constraints.

## Lens Distortion Models

Real lenses deviate from the ideal pinhole model. Two standard models:

**Radial distortion** causes straight lines to appear curved:

$$x_d = x'(1 + k_1 r^2 + k_2 r^4 + k_3 r^6), \qquad y_d = y'(1 + k_1 r^2 + k_2 r^4 + k_3 r^6)$$

where $r^2 = x'^2 + y'^2$ is the squared distance from the principal point. $k_1 > 0$ gives barrel distortion; $k_1 < 0$ gives pincushion distortion. Wide-angle lenses have large $|k_1|$.

**Tangential distortion** is caused by the lens not being perfectly parallel to the image plane:

$$x_d = x' + 2p_1 x'y' + p_2(r^2 + 2x'^2), \qquad y_d = y' + p_1(r^2 + 2y'^2) + 2p_2 x'y'$$

In practice, $k_1, k_2$ (and sometimes $k_3, p_1, p_2$) are estimated jointly with $\mathbf{K}$. OpenCV implements this directly in `cv::calibrateCamera()`.

## Judging calibration quality

The standard quality metric is the **RMS reprojection error** returned by the calibration: reproject the board corners with the estimated parameters and measure the pixel residuals. Beyond the single number, check that:

- Residuals are evenly distributed across the image — a bias in the corners indicates an inadequate distortion model (e.g., a fisheye lens forced into the radial-tangential model).
- The board appeared in **all regions of the image**, including corners and edges, where distortion is strongest and otherwise unconstrained.
- Views included substantial **tilt** (not just frontal shots) so that focal length and principal point decorrelate.

## Common pitfalls

- **Motion blur and rolling shutter** during capture corrupt corner detection; hold the board (or camera) still for each shot.
- **A non-flat board**: printed paper taped to cardboard bends; distortion estimates absorb the bending. Use a rigid, flat target.
- **Too few poses near the image border** — the high-order radial terms then overfit and extrapolate wildly outside the covered region.
- **Calibrating at one focus/zoom setting and running at another**: intrinsics change with focus; lock the lens and recalibrate whenever hardware settings change.

## Why it matters for SLAM

SLAM systems assume that undistorted, calibrated observations feed their geometric solvers; a few pixels of uncorrected distortion at the image border can dominate reprojection error and corrupt the map. Calibration is also the template for harder problems you will meet later — camera-IMU and camera-LiDAR extrinsic calibration follow the same "known target + nonlinear refinement" pattern. Practically, calibrating your own camera with a checkerboard is one of the best first exercises in the field.

## Related

- [Pinhole camera model](pinhole-camera-model.md)
- [Camera models beyond pinhole](camera-models-beyond-pinhole.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Multi-sensor calibration](../level-02-getting-familiar/multi-sensor-calibration.md)
- [Camera device](../level-02-getting-familiar/camera-device.md)
