# Logarithm & Exponential

Exponential and logarithm functions appear throughout SLAM in the context of **Lie groups** and **Lie algebras**. Beyond their familiar scalar forms, their matrix versions are the bridge between rotations (which are hard to optimize) and vectors (which are easy to optimize).

## The problem with rotations

Rotation matrices $R \in SO(3)$ are not a vector space — you cannot add two rotations and get a rotation, so you cannot apply vanilla gradient descent to them. But their *Lie algebra* $\mathfrak{so}(3)$ (the tangent space at the identity) *is* a vector space: an element is just a 3-vector $\boldsymbol{\phi}$ (axis-angle), written as a skew-symmetric matrix $[\boldsymbol{\phi}]_\times$.

## Exponential and logarithm maps

- The **exponential map** $\exp: \mathfrak{so}(3) \to SO(3)$ converts a Lie algebra element to a rotation matrix. For a rotation by angle $\theta$ around unit axis $\hat{\mathbf{n}}$:

$$\exp([\boldsymbol{\phi}]_\times) = I + \sin\theta\,[\hat{\mathbf{n}}]_\times + (1 - \cos\theta)\,[\hat{\mathbf{n}}]_\times^2$$

  This is **Rodrigues' formula** — a closed form of the matrix exponential series.

- The **logarithm map** $\log: SO(3) \to \mathfrak{so}(3)$ is the inverse: it extracts the axis-angle vector from a rotation matrix.

The same construction extends to full rigid-body poses: $\exp$ maps $\mathfrak{se}(3)$ (6-vectors: translation + rotation) to $SE(3)$ (homogeneous transformation matrices), and $\log$ maps back.

## Why the scalar intuition still helps

The familiar identities carry over in spirit: the exponential turns addition into composition ($e^{a+b} = e^a e^b$ for commuting arguments), and the logarithm turns composition back into something additive. This is exactly what optimization needs: express a small correction as a vector $\boldsymbol{\xi}$, apply it multiplicatively as $T \leftarrow T\cdot\exp(\hat{\boldsymbol{\xi}})$, and measure pose errors as $\|\log(T_1^{-1}T_2)\|$.

## Why it matters for SLAM

Logarithms and exponentials let us "linearize" rotations and poses, making them amenable to gradient-based optimization — every modern SLAM back-end (g2o, GTSAM, Ceres with manifold parameterizations) updates poses through the exponential map, and pose graph errors are defined through the logarithm map. Getting comfortable with $\exp/\log$ now pays off directly when you study Lie groups properly at Level 2.

## Related

- [Rigid body motion](rigid-body-motion.md)
- [Basic Calculus](basic-calculus.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)

[Back to Level 1](../README.md#level-1-beginner)
