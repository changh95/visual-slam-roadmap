# Epipolar geometry

When the same scene is observed from two distinct viewpoints, the **epipolar constraint** restricts where the projection of a 3D point in one image can appear in the other image — to a line called the **epipolar line**. This is the geometric foundation of two-view reconstruction and monocular SLAM initialization.

## Essential Matrix

For two *calibrated* cameras (intrinsic parameters known), the **essential matrix** $E$ encodes the relative rotation $R$ and translation $\mathbf{t}$ between the cameras:

$$E = [\mathbf{t}]_\times R$$

where $[\mathbf{t}]_\times$ is the skew-symmetric matrix of $\mathbf{t} = [t_1, t_2, t_3]^T$:

$$[\mathbf{t}]_\times = \begin{bmatrix} 0 & -t_3 & t_2 \\ t_3 & 0 & -t_1 \\ -t_2 & t_1 & 0 \end{bmatrix}$$

The **epipolar constraint** for a 3D point observed at normalized camera coordinates $\mathbf{x}_1$ (camera 1) and $\mathbf{x}_2$ (camera 2):

$$\mathbf{x}_2^T E\, \mathbf{x}_1 = 0$$

Geometrically, this says $\mathbf{x}_1$, $\mathbf{x}_2$, and the two camera centres are coplanar. Decomposing $E$ via SVD recovers the relative pose $[R|\mathbf{t}]$ up to four candidates (disambiguated by requiring triangulated points to lie in front of both cameras) — and only up to scale, the root of monocular scale ambiguity.

## Fundamental Matrix

For two *uncalibrated* cameras, the **fundamental matrix** $F$ relates raw pixel coordinates $\mathbf{p}_1, \mathbf{p}_2$:

$$F = \mathbf{K}_2^{-T} E\, \mathbf{K}_1^{-1}, \qquad \mathbf{p}_2^T F\, \mathbf{p}_1 = 0$$

$F$ is a $3 \times 3$ matrix of rank 2 with 7 degrees of freedom (defined up to scale, with $\det(F) = 0$). It can be estimated from 8+ point correspondences via the 8-point algorithm (Longuet-Higgins, 1981).

## Homography

When all scene points are coplanar, or the camera undergoes pure rotation, a **homography** $H$ maps image points directly:

$$\lambda\mathbf{p}_2 = H\,\mathbf{p}_1, \qquad H \in \mathbb{R}^{3 \times 3}$$

Homographies are used in ORB-SLAM for map initialization: competing Homography and Fundamental models are fit to feature matches, and the one with the better score is selected — a robust way to handle both planar and general scenes.

## Why it matters for SLAM

Epipolar geometry is how a monocular SLAM system bootstraps itself: from 2D-2D feature matches alone it recovers the relative camera pose and triangulates the first map points. It also provides the epipolar line as a 1D search constraint for stereo matching and guided feature matching, and the epipolar constraint is the standard geometric verification inside RANSAC for rejecting false matches.

## Related

- [Pinhole camera model](pinhole-camera-model.md)
- [Triangulation](triangulation.md)
- [Rigid body motion](rigid-body-motion.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)

[Back to Level 1](../README.md#level-1-beginner)
