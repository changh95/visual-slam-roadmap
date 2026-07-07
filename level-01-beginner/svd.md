# SVD (Singular Value Decomposition)

The **singular value decomposition** is arguably the most important matrix factorization in SLAM. Any matrix $A \in \mathbb{R}^{m \times n}$ can be written as

$$A = U \Sigma V^T$$

where $U \in \mathbb{R}^{m \times m}$ and $V \in \mathbb{R}^{n \times n}$ are orthogonal ($U^T U = I$, $V^T V = I$) and $\Sigma \in \mathbb{R}^{m \times n}$ is diagonal with non-negative entries $\sigma_1 \geq \sigma_2 \geq \cdots \geq 0$, the **singular values**. The columns of $U$ and $V$ are the left and right singular vectors.

**Geometric interpretation**: every linear map is a rotation/reflection ($V^T$), followed by an axis-aligned scaling ($\Sigma$), followed by another rotation/reflection ($U$). The singular values measure how much the map stretches space along its principal directions.

## What SVD tells you about a matrix

- **Rank**: the number of nonzero singular values. A near-zero trailing singular value signals a (numerically) rank-deficient system — e.g., a degenerate point configuration.
- **Conditioning**: the ratio $\sigma_1 / \sigma_r$ (largest over smallest nonzero) is the condition number; a large value means the associated least-squares problem is ill-conditioned and solutions are noise-sensitive.
- **Null space**: right singular vectors associated with zero singular values span the null space of $A$ — exactly what homogeneous linear systems in geometry need.

## The workhorse uses in SLAM

**Homogeneous least squares (DLT).** Problems like triangulation, homography estimation, camera calibration, and the eight-point algorithm all reduce to

$$\min_{\mathbf{x}} \lVert A\mathbf{x} \rVert \quad \text{subject to} \quad \lVert \mathbf{x} \rVert = 1$$

whose solution is the right singular vector of $A$ corresponding to the smallest singular value.

**Enforcing matrix constraints.** The closest (in Frobenius norm) rank-2 matrix to an estimated fundamental matrix is obtained by zeroing its smallest singular value. Similarly, a valid essential matrix must have singular values $(s, s, 0)$, enforced by replacing $\Sigma$ with $\mathrm{diag}(1, 1, 0)$.

**Essential matrix decomposition.** Given $E = U \Sigma V^T$ with $\Sigma = \mathrm{diag}(1,1,0)$, the four candidate relative poses are built from $R_1 = U W V^T$, $R_2 = U W^T V^T$, and $\mathbf{t} = \pm\mathbf{u}_3$ (third column of $U$), where

$$W = \begin{bmatrix} 0 & -1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & 1 \end{bmatrix}$$

The correct pose is selected by the cheirality check (triangulated points must lie in front of both cameras).

**Rigid alignment of point sets (Kabsch / Procrustes).** Given matched, centered 3D point sets, form the cross-covariance $H = \sum_i \mathbf{p}_i \mathbf{q}_i^T$ and compute $H = U \Sigma V^T$. The optimal rotation is

$$R = V\, \mathrm{diag}\big(1,\, 1,\, \det(V U^T)\big)\, U^T$$

with the determinant correction guarding against reflections. This closed-form solution is the inner step of ICP and the standard solver for 3D-3D correspondence.

**Projecting onto the rotation group.** A noisy "almost rotation" matrix (e.g., from averaging or numerical drift) is repaired the same way: take its SVD and rebuild with unit singular values and the determinant fix.

**Pseudo-inverse and low-rank approximation.** The Moore-Penrose pseudo-inverse is $A^{+} = V \Sigma^{+} U^T$ (invert nonzero singular values), giving minimum-norm least-squares solutions. Truncating the SVD after $k$ terms yields the best rank-$k$ approximation of $A$ (Eckart-Young theorem), used in dimensionality reduction and matrix conditioning analysis.

## Why it matters for SLAM

SVD appears at nearly every geometric stage of a SLAM pipeline: initializing relative pose from the essential matrix, triangulating landmarks via DLT, aligning point clouds inside ICP, enforcing the internal constraints of estimated fundamental/essential matrices, and diagnosing degeneracies (planar scenes, pure rotation) by inspecting singular-value gaps. Being fluent in "the answer is the singular vector of the smallest singular value" unlocks a large fraction of multiple-view geometry.

## Related

- [Basic Linear Algebra](basic-linear-algebra.md)
- [Triangulation](triangulation.md)
- [Epipolar geometry](epipolar-geometry.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [ICP](../level-04-rgbd-slam/icp.md)
