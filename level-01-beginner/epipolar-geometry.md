# Epipolar geometry

When the same scene is observed from two distinct viewpoints, the **epipolar constraint** restricts where the projection of a 3D point in one image can appear in the other image — to a line called the **epipolar line**. This is the geometric foundation of two-view reconstruction and monocular SLAM initialization.

## The geometry

The two camera centres and the 3D point span the **epipolar plane**. This plane cuts each image in an epipolar line; the point where the line joining the two camera centres (the baseline) pierces each image is the **epipole**. All epipolar lines in an image pass through its epipole. The practical consequence: given a feature in image 1, its match in image 2 must lie on a known line — a 2D search collapses to 1D.

## Essential Matrix

For two *calibrated* cameras (intrinsic parameters known), the **essential matrix** $E$ encodes the relative rotation $R$ and translation $\mathbf{t}$ between the cameras:

$$E = [\mathbf{t}]_\times R$$

where $[\mathbf{t}]_\times$ is the skew-symmetric matrix of $\mathbf{t} = [t_1, t_2, t_3]^T$:

$$[\mathbf{t}]_\times = \begin{bmatrix} 0 & -t_3 & t_2 \\ t_3 & 0 & -t_1 \\ -t_2 & t_1 & 0 \end{bmatrix}$$

The **epipolar constraint** for a 3D point observed at normalized camera coordinates $\mathbf{x}_1$ (camera 1) and $\mathbf{x}_2$ (camera 2):

$$\mathbf{x}_2^T E\, \mathbf{x}_1 = 0$$

**Where it comes from.** The ray directions $\mathbf{x}_2$, $R\mathbf{x}_1$, and the baseline $\mathbf{t}$ must be coplanar (they all lie in the epipolar plane). Coplanarity of three vectors means the scalar triple product vanishes: $\mathbf{x}_2 \cdot (\mathbf{t} \times R\mathbf{x}_1) = 0$, and writing the cross product as $[\mathbf{t}]_\times$ gives exactly $\mathbf{x}_2^T E\,\mathbf{x}_1 = 0$.

$E$ has **5 degrees of freedom** (3 for rotation, 3 for translation, minus 1 for scale), which is why the minimal solver needs 5 correspondences. Its SVD has the special form $\Sigma = \mathrm{diag}(\sigma, \sigma, 0)$ — two equal singular values and one zero.

**Recovering pose from $E$.** Given $E = U\Sigma V^T$ with $\Sigma = \mathrm{diag}(1,1,0)$, the four candidate poses are $[R_1|\pm\mathbf{t}]$ and $[R_2|\pm\mathbf{t}]$ with

$$R_1 = UWV^T, \quad R_2 = UW^TV^T, \quad \mathbf{t} = \mathbf{u}_3, \quad W = \begin{bmatrix}0&-1&0\\1&0&0\\0&0&1\end{bmatrix}$$

The true pose is disambiguated by the **cheirality check**: triangulated points must lie in front of both cameras. The translation is recovered only up to scale — the root of monocular scale ambiguity.

## Fundamental Matrix

For two *uncalibrated* cameras, the **fundamental matrix** $F$ relates raw pixel coordinates $\mathbf{p}_1, \mathbf{p}_2$:

$$F = \mathbf{K}_2^{-T} E\, \mathbf{K}_1^{-1}, \qquad \mathbf{p}_2^T F\, \mathbf{p}_1 = 0$$

$F$ is a $3 \times 3$ matrix of rank 2 with 7 degrees of freedom (defined up to scale, with $\det(F) = 0$). It can be estimated from 8+ point correspondences via the 8-point algorithm (Longuet-Higgins, 1981). The epipolar line in image 2 for a point $\mathbf{p}_1$ is simply $\boldsymbol{\ell}_2 = F\,\mathbf{p}_1$, and the epipoles are the null vectors of $F$ and $F^T$.

## Homography

When all scene points are coplanar, or the camera undergoes pure rotation, a **homography** $H$ maps image points directly:

$$\lambda\mathbf{p}_2 = H\,\mathbf{p}_1, \qquad H \in \mathbb{R}^{3 \times 3}$$

Homographies are used in ORB-SLAM for map initialization: competing Homography and Fundamental models are fit to feature matches, and the one with the better score is selected — a robust way to handle both planar and general scenes.

## Degenerate cases to watch for

- **Pure rotation** ($\mathbf{t} = \mathbf{0}$): $E = [\mathbf{0}]_\times R = 0$ — the essential matrix is undefined and no depth can be recovered; a homography explains the motion instead.
- **Planar scenes**: correspondences from a single plane satisfy a homography, and $F$/$E$ estimation becomes ambiguous; this is exactly why ORB-SLAM fits both models.
- **Tiny baselines**: $E$ estimation is numerically unstable and triangulated depths are meaningless; initialization waits for enough parallax.

## Why it matters for SLAM

Epipolar geometry is how a monocular SLAM system bootstraps itself: from 2D-2D feature matches alone it recovers the relative camera pose and triangulates the first map points. It also provides the epipolar line as a 1D search constraint for stereo matching and guided feature matching, and the epipolar constraint is the standard geometric verification inside RANSAC for rejecting false matches.

## Hands-on

- [Epipolar geometry hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_02)
- [Homography hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_04)

## Related

- [Pinhole camera model](pinhole-camera-model.md)
- [Triangulation](triangulation.md)
- [Rigid body motion](rigid-body-motion.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md)
