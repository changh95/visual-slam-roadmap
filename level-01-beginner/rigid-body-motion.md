# Rigid body motion

A **rigid body motion** (rigid transformation) preserves distances between all points. In 3D it consists of a rotation and a translation, and the mathematical structures that represent it — $SO(3)$ and $SE(3)$ — are central to SLAM: a camera pose *is* an element of $SE(3)$.

## Rotation Representations

**Euler angles.** A rotation can be parameterized by three angles $(\phi, \theta, \psi)$ representing successive rotations about fixed or body axes; the 12 possible conventions (ZYX, XYZ, ...) each give different angle sequences. The **gimbal lock** problem occurs when two rotation axes align, reducing the effective degrees of freedom to 2. Euler angles are intuitive for display but numerically problematic — avoid them for iterative optimization.

**Rotation matrices.** A rotation matrix satisfies $R^TR = I$ and $\det(R) = +1$. The set of all such matrices forms the **Special Orthogonal Group**:

$$SO(3) = \{R \in \mathbb{R}^{3\times3} \mid R^TR = I,\ \det(R) = +1\}$$

Rotation matrices are the preferred representation for computation: matrix multiplication is the composition law, and the inverse is simply the transpose.

**Quaternions.** A unit quaternion $q = w + xi + yj + zk$ with $w^2+x^2+y^2+z^2 = 1$ represents a rotation by angle $\theta = 2\arccos(w)$ around axis $[x,y,z]^T/\sin(\theta/2)$. They are compact (4 numbers vs. 9), have no gimbal lock, and compose via the Hamilton product. Note the double cover: $q$ and $-q$ represent the same rotation.

Conversion from quaternion to rotation matrix:

$$R = \begin{bmatrix}
1 - 2(y^2+z^2) & 2(xy - wz) & 2(xz + wy) \\
2(xy + wz) & 1 - 2(x^2+z^2) & 2(yz - wx) \\
2(xz - wy) & 2(yz + wx) & 1 - 2(x^2+y^2)
\end{bmatrix}$$

A quick NumPy sanity check that a matrix is a valid rotation:

```python
import numpy as np
# R is a rotation iff R^T R = I and det(R) = +1
print(np.allclose(R.T @ R, np.eye(3)), np.isclose(np.linalg.det(R), 1.0))
```

## Homogeneous Transformation: $T \in SE(3)$

A rigid body motion combines rotation $R$ and translation $\mathbf{t}$ into one $4\times4$ matrix acting on homogeneous coordinates:

$$T = \begin{bmatrix} R & \mathbf{t} \\ \mathbf{0}^T & 1 \end{bmatrix} \in SE(3), \qquad
T\begin{bmatrix}\mathbf{X}\\1\end{bmatrix} = \begin{bmatrix} R\mathbf{X} + \mathbf{t} \\ 1 \end{bmatrix}$$

Composition is matrix multiplication, with rotation and translation interleaving:

$$T_1 T_2 = \begin{bmatrix} R_1R_2 & R_1\mathbf{t}_2 + \mathbf{t}_1 \\ \mathbf{0}^T & 1 \end{bmatrix}$$

— note that $\mathbf{t}_2$ gets rotated by $R_1$, which is why translations of chained transforms do *not* simply add. The inverse has the closed form:

$$T^{-1} = \begin{bmatrix} R^T & -R^T\mathbf{t} \\ \mathbf{0}^T & 1 \end{bmatrix}$$

Homogeneous coordinates come from **projective space**: appending a 1 (points) or 0 (directions) lets one matrix express rotation and translation together. In projective geometry, parallel 3D lines meet at a **vanishing point** in the image — a useful cue for rotation estimation in man-made environments and a reminder that image formation is projective, not Euclidean.

## Keeping frames straight

The most effective habit is a subscript convention that makes composition self-checking: let $T_{AB}$ map coordinates *from frame $B$ to frame $A$*. Then

$$T_{AC} = T_{AB}\,T_{BC}, \qquad \mathbf{X}_A = T_{AB}\,\mathbf{X}_B$$

and adjacent subscripts must "cancel" like units. If they don't, the expression is wrong — this catches a remarkable fraction of pose-arithmetic bugs at a glance. Be explicit about whether a stored "camera pose" means $T_{world,cam}$ (camera-to-world, the camera's position in the world) or its inverse $T_{cam,world}$ (the extrinsics used in projection); both conventions are common across codebases.

## Common pitfalls

- **Hamilton vs. JPL quaternion conventions**: two incompatible definitions of quaternion multiplication coexist in the literature (Eigen and ROS use Hamilton); mixing them silently conjugates rotations.
- **Quaternion storage order**: `(w, x, y, z)` vs. `(x, y, z, w)` differs between libraries (e.g., Eigen's constructor vs. its internal layout, ROS messages); always test with a known rotation.
- **Drifting off the manifold**: repeatedly multiplying rotation matrices or integrating quaternions accumulates numerical error; re-orthonormalize matrices (e.g., via SVD) or re-normalize quaternions periodically.
- **Sign flips under the double cover**: interpolating between $q$ and a nearby $-q'$ takes the long way around; flip the sign first if the dot product is negative.

## Why it matters for SLAM

Every SLAM system is, at bottom, estimating a trajectory of $SE(3)$ elements. Chaining relative motions ($T_{world,cam} = T_{world,kf}\,T_{kf,cam}$), inverting transforms, and converting between quaternions (compact storage, ROS messages) and rotation matrices (computation) are daily operations. Getting frame conventions right — which frame a transform maps *from* and *to* — is the most common source of bugs for newcomers, so nail this before moving on.

## Related

- [Logarithm & Exponential](logarithm-and-exponential.md)
- [Pinhole camera model](pinhole-camera-model.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
