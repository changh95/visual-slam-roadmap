# Logarithm & Exponential

Exponential and logarithm functions appear throughout SLAM in the context of **Lie groups** and **Lie algebras**. Beyond their familiar scalar forms, their matrix versions are the bridge between rotations (which are hard to optimize) and vectors (which are easy to optimize).

## Scalar refresher

The exponential $e^x = \sum_{k=0}^{\infty} \frac{x^k}{k!}$ and its inverse $\log(x)$ satisfy the identities that make them useful:

$$e^{a+b} = e^a e^b, \qquad \log(ab) = \log a + \log b$$

The log identity already earns its keep in probability: likelihoods are *products* of many small numbers, which underflow floating point; taking the logarithm turns the product into a numerically stable *sum* — this is why estimators minimize a negative log-likelihood rather than maximize the likelihood itself.

## The problem with rotations

Rotation matrices $R \in SO(3)$ are not a vector space — you cannot add two rotations and get a rotation, so you cannot apply vanilla gradient descent to them. But their *Lie algebra* $\mathfrak{so}(3)$ (the tangent space at the identity) *is* a vector space: an element is just a 3-vector $\boldsymbol{\phi}$ (axis-angle), written as a skew-symmetric matrix $[\boldsymbol{\phi}]_\times$.

## Exponential and logarithm maps

The **matrix exponential** is defined by the same power series as the scalar one, $\exp(A) = \sum_{k=0}^{\infty} \frac{A^k}{k!}$, and for skew-symmetric arguments the series collapses to a closed form:

- The **exponential map** $\exp: \mathfrak{so}(3) \to SO(3)$ converts a Lie algebra element to a rotation matrix. For a rotation by angle $\theta$ around unit axis $\hat{\mathbf{n}}$ (so $\boldsymbol{\phi} = \theta\hat{\mathbf{n}}$):

$$\exp([\boldsymbol{\phi}]_\times) = I + \sin\theta\,[\hat{\mathbf{n}}]_\times + (1 - \cos\theta)\,[\hat{\mathbf{n}}]_\times^2$$

  This is **Rodrigues' formula** — a closed form of the matrix exponential series, obtained because powers of a unit skew-symmetric matrix cycle: $[\hat{\mathbf{n}}]_\times^3 = -[\hat{\mathbf{n}}]_\times$.

- The **logarithm map** $\log: SO(3) \to \mathfrak{so}(3)$ is the inverse: it extracts the axis-angle vector from a rotation matrix. The angle comes from the trace, $\theta = \arccos\!\big(\tfrac{\mathrm{trace}(R) - 1}{2}\big)$, and the axis from the antisymmetric part of $R$.

For small rotations, keeping only the first-order term gives the ubiquitous approximation

$$\exp([\boldsymbol{\phi}]_\times) \approx I + [\boldsymbol{\phi}]_\times \qquad (\|\boldsymbol{\phi}\| \text{ small})$$

which is exactly the linearization used when deriving Jacobians of residuals with respect to rotation perturbations.

The same construction extends to full rigid-body poses: $\exp$ maps $\mathfrak{se}(3)$ (6-vectors: translation + rotation) to $SE(3)$ (homogeneous transformation matrices), and $\log$ maps back.

## Why the scalar intuition still helps

The familiar identities carry over in spirit: the exponential turns addition into composition ($e^{a+b} = e^a e^b$ for commuting arguments), and the logarithm turns composition back into something additive. This is exactly what optimization needs: express a small correction as a vector $\boldsymbol{\xi}$, apply it multiplicatively as $T \leftarrow T\cdot\exp(\hat{\boldsymbol{\xi}})$, and measure pose errors as $\|\log(T_1^{-1}T_2)\|$.

One caveat worth remembering: for matrices, $e^{A+B} = e^A e^B$ holds only when $A$ and $B$ commute — and rotations about different axes do not. That non-commutativity is precisely why 3D rotations need Lie theory rather than plain vector addition.

## Common pitfalls

- **Numerical instability of the log map near $\theta = 0$ and $\theta = \pi$**: the axis formula divides by $\sin\theta$; robust implementations switch to a Taylor-expanded branch near these angles.
- **Assuming additivity**: composing two axis-angle vectors by adding them is only approximately right for small angles; the exact composition goes through $\exp$/$\log$.
- **Mixing conventions**: some libraries store $SE(3)$ tangent vectors as (translation, rotation), others as (rotation, translation) — check before copying Jacobians between codebases.

## Why it matters for SLAM

Logarithms and exponentials let us "linearize" rotations and poses, making them amenable to gradient-based optimization — every modern SLAM back-end (g2o, GTSAM, Ceres with manifold parameterizations) updates poses through the exponential map, and pose graph errors are defined through the logarithm map. Getting comfortable with $\exp/\log$ now pays off directly when you study Lie groups properly at Level 2.

## Related

- [Rigid body motion](rigid-body-motion.md)
- [Basic Calculus](basic-calculus.md)
- [Basic Probability & Statistics](basic-probability-and-statistics.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
