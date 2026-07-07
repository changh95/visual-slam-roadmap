# Pinhole camera model

The pinhole camera is the standard model for most cameras used in SLAM. Light from a 3D point passes through a small hole (the optical centre) and projects onto an image plane. The model describes **image projection**: how a point in the 3D world maps to a 2D pixel.

## Coordinate Systems

Four coordinate systems are involved:

1. **World frame** $\mathbf{X}_w = [X_w, Y_w, Z_w]^T$: fixed reference frame.
2. **Camera frame** $\mathbf{X}_c = [X_c, Y_c, Z_c]^T$: $Z_c$ is the optical axis (pointing forward).
3. **Image plane** $\mathbf{x}' = [x', y']^T$: metric coordinates on the image plane.
4. **Pixel frame** $\mathbf{u} = [u, v]^T$: discrete pixel coordinates.

The usual convention is $X_c$ pointing right, $Y_c$ pointing down, $Z_c$ pointing forward — matching pixel coordinates $u$ (right) and $v$ (down) with the origin at the top-left corner of the image.

## Projection Pipeline

**Step 1: World to Camera.** The rigid body transformation (extrinsic parameters) converts a world point to the camera frame:

$$\mathbf{X}_c = R\mathbf{X}_w + \mathbf{t}$$

**Step 2: Camera to Image Plane (perspective division).**

$$x' = \frac{X_c}{Z_c}, \qquad y' = \frac{Y_c}{Z_c}$$

This division by depth is the source of perspective effects — and of the nonlinearity that makes vision geometry interesting. The coordinates $(x', y')$ are called **normalized coordinates**: they are what remains of a pixel once the intrinsics are stripped off, and most geometric derivations (essential matrix, triangulation) are cleanest in this frame.

**Step 3: Image Plane to Pixel (intrinsic parameters).**

$$u = f_x \cdot x' + c_x, \qquad v = f_y \cdot y' + c_y$$

where $f_x, f_y$ are focal lengths in pixels and $(c_x, c_y)$ is the principal point. The pixel focal length relates the physical focal length $f$ (in mm) to the pixel size: $f_x = f / (\text{pixel width})$, which is why $f_x \neq f_y$ when pixels are not square.

## Matrix Form

Combining all steps in homogeneous coordinates:

$$Z_c \begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \underbrace{\begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix}}_{\mathbf{K}} \begin{bmatrix} R & \mathbf{t} \end{bmatrix} \begin{bmatrix} X_w \\ Y_w \\ Z_w \\ 1 \end{bmatrix}$$

The matrix $\mathbf{K}$ is the **camera intrinsic matrix**, and $P = \mathbf{K}[R|\mathbf{t}]$ is the $3 \times 4$ **camera projection matrix**. In the general case $\mathbf{K}$ includes a skew parameter (usually zero for modern cameras).

A direct NumPy translation of the pipeline:

```python
import numpy as np

def project(K, R, t, X_w):
    X_c = R @ X_w + t          # world -> camera
    x_n = X_c[:2] / X_c[2]     # perspective division (normalized coords)
    u   = K[0, 0] * x_n[0] + K[0, 2]
    v   = K[1, 1] * x_n[1] + K[1, 2]
    return np.array([u, v])
```

## Back-projection: the inverse is a ray

Projection destroys one dimension: a pixel does not determine a 3D point, only a **ray**. Given pixel $\mathbf{u}$, the ray of possible 3D points in the camera frame is

$$\mathbf{X}_c(\lambda) = \lambda\,\mathbf{K}^{-1}\begin{bmatrix}u\\v\\1\end{bmatrix}, \qquad \lambda > 0$$

Recovering the missing depth $\lambda$ is exactly what triangulation (multiple views), stereo (a second calibrated camera), or a depth sensor provides. The field of view follows from the same geometry: $\mathrm{FoV}_x = 2\arctan\!\big(\tfrac{W}{2f_x}\big)$ for image width $W$.

## Common pitfalls

- **Axis conventions**: computer vision uses $Z$ forward / $Y$ down; robotics (ROS) body frames use $X$ forward / $Z$ up. Confusing them is the classic first bug when wiring a camera into a robot.
- **Principal point is not the image centre**: $(c_x, c_y)$ is close to $(W/2, H/2)$ but must be calibrated, not assumed.
- **Forgetting the perspective division** when implementing projection by hand — the homogeneous output of $P\mathbf{X}$ must be divided by its third component.
- **Applying the model to distorted pixels**: real images must be undistorted first (or the distortion model included in $\pi$); the pure pinhole equations only hold for ideal coordinates.

## Why it matters for SLAM

The projection function $\pi(\cdot)$ defined by this model is at the heart of every visual SLAM system: the reprojection error $\mathbf{e} = \mathbf{z} - \pi(T\mathbf{X})$ minimized in bundle adjustment is nothing more than "project the map point with the pinhole model, compare against the measured pixel". Triangulation, PnP, and epipolar geometry are all derived from the same equation, so deriving this pipeline from scratch is the single most valuable exercise at this level.

## Related

- [Camera calibration](camera-calibration.md)
- [Camera models beyond pinhole](camera-models-beyond-pinhole.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Triangulation](triangulation.md)
- [Rigid body motion](rigid-body-motion.md)
- [Camera device](../level-02-getting-familiar/camera-device.md)

[Back to Level 1](../README.md#level-1-beginner)
