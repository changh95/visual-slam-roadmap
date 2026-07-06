# Basic Linear Algebra

Linear algebra is the working language of SLAM: points, poses, residuals, and observations are all vectors and matrices, and every solver ultimately reduces to matrix computations.

## Vectors and Matrices

A **vector** $\mathbf{v} \in \mathbb{R}^n$ is a column of $n$ real numbers. In SLAM, vectors represent points, translations, velocities, and residuals. A **matrix** $A \in \mathbb{R}^{m \times n}$ represents a linear map from $\mathbb{R}^n$ to $\mathbb{R}^m$. The central object in SLAM geometry is the matrix-vector product $A\mathbf{x} = \mathbf{b}$.

## Determinant

The determinant $\det(A)$ of a square matrix measures the signed volume scaling factor of the linear map $A$. Key facts:

- $\det(A) \neq 0 \Leftrightarrow A$ is invertible.
- For a rotation matrix $R \in SO(3)$: $\det(R) = +1$.
- $\det(AB) = \det(A)\det(B)$.

## Dot Product and Cross Product

The **dot product** of $\mathbf{u}, \mathbf{v} \in \mathbb{R}^3$ is $\mathbf{u} \cdot \mathbf{v} = \mathbf{u}^T\mathbf{v} = \|\mathbf{u}\|\|\mathbf{v}\|\cos\theta$; it is used for projections and checking orthogonality. The **cross product** $\mathbf{u} \times \mathbf{v}$ produces a vector perpendicular to both, with magnitude $\|\mathbf{u}\|\|\mathbf{v}\|\sin\theta$. It appears in the skew-symmetric matrix formulation of the essential matrix and in computing surface normals.

## Rank, Inverse, and Transpose

The **rank** of $A$ is the dimension of its column space. In SLAM, the fundamental matrix has rank 2 by construction, and a point cloud matrix is rank-deficient when all points are coplanar (a degenerate configuration for SLAM initialization). The **inverse** $A^{-1}$ satisfies $AA^{-1} = I$ and exists iff $\det(A) \neq 0$. For rotation matrices, $R^{-1} = R^T$ (orthogonality) — exploited constantly to avoid computing a full inverse.

## Singular Value Decomposition (SVD)

SVD is the most important matrix factorization in SLAM. Any matrix $A \in \mathbb{R}^{m \times n}$ decomposes as

$$A = U \Sigma V^T$$

where $U$ and $V$ are orthogonal and $\Sigma$ is diagonal with non-negative **singular values** $\sigma_1 \geq \sigma_2 \geq \cdots \geq 0$. Geometrically, any linear map is a rotation/reflection, followed by a coordinate-wise scaling, followed by another rotation/reflection. Uses in SLAM:

- **Essential matrix decomposition**: SVD of $E$ yields the four candidate relative poses $[R|\pm\mathbf{t}]$.
- **DLT triangulation**: the solution is the right singular vector of $A$ with the smallest singular value.
- **ICP alignment**: SVD of the cross-covariance matrix $H = \sum_i \mathbf{p}_i \mathbf{q}_i^T$ gives the optimal rotation.

## Eigenvalues and Eigenvectors

A non-zero vector $\mathbf{v}$ and scalar $\lambda$ satisfying $A\mathbf{v} = \lambda\mathbf{v}$ are an **eigenvector** and **eigenvalue** of $A$. The Harris corner detector classifies image patches from the eigenvalues of the structure tensor, and PCA of a point cloud uses eigenvectors of the covariance matrix to find principal directions (e.g., fitting a plane).

## Why it matters for SLAM

Every stage of a SLAM pipeline is linear algebra in disguise: projecting points uses matrix products, minimal solvers (8-point, DLT, ICP) reduce to SVD, and the normal equations of bundle adjustment are a large sparse linear system. Fluency here — especially with SVD, orthogonal matrices, and rank — is what lets you read SLAM papers and debug geometry code.

## Related

- [Basic Calculus](basic-calculus.md)
- [Epipolar geometry](epipolar-geometry.md)
- [Triangulation](triangulation.md)
- [Math libraries](../level-02-getting-familiar/math-libraries.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)

[Back to Level 1](../README.md#level-1-beginner)
