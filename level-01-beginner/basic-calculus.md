# Basic Calculus

SLAM back-ends spend most of their time minimizing nonlinear cost functions. Two tools from calculus make that possible: **differentiation** (Jacobians) and **Taylor expansion** (linearization).

## Differentiation and Jacobians

A scalar function $f: \mathbb{R}^n \to \mathbb{R}$ has a gradient $\nabla f = \left[\frac{\partial f}{\partial x_1}, \ldots, \frac{\partial f}{\partial x_n}\right]^T$. A vector function $\mathbf{f}: \mathbb{R}^n \to \mathbb{R}^m$ has a **Jacobian matrix**:

$$J = \frac{\partial \mathbf{f}}{\partial \mathbf{x}} =
\begin{bmatrix}
\frac{\partial f_1}{\partial x_1} & \cdots & \frac{\partial f_1}{\partial x_n} \\
\vdots & \ddots & \vdots \\
\frac{\partial f_m}{\partial x_1} & \cdots & \frac{\partial f_m}{\partial x_n}
\end{bmatrix} \in \mathbb{R}^{m \times n}$$

The Jacobian is the key tool in SLAM optimization: given a residual $\mathbf{e}(\mathbf{x})$ (for example, a reprojection error), its Jacobian $J = \frac{\partial \mathbf{e}}{\partial \mathbf{x}}$ tells us how the residual changes with small perturbations to the state — exactly what Gauss-Newton and Levenberg-Marquardt need.

## The chain rule in SLAM residuals

SLAM residuals are almost always *compositions* of simpler functions, so their Jacobians come from the **chain rule**. The reprojection error of a map point $\mathbf{X}$ observed at pixel $\mathbf{z}$ under pose $T$ is

$$\mathbf{e} = \mathbf{z} - \pi\big(T\,\mathbf{X}\big)$$

a composition of (1) a rigid transformation, (2) perspective division, and (3) the intrinsic mapping. Its Jacobian factors into a product:

$$\frac{\partial \mathbf{e}}{\partial \mathbf{x}} = -\,\frac{\partial \pi}{\partial \mathbf{X}_c}\cdot\frac{\partial \mathbf{X}_c}{\partial \mathbf{x}}$$

where $\mathbf{X}_c = T\mathbf{X}$ is the point in the camera frame. Deriving each factor separately and multiplying is far less error-prone than differentiating the whole expression at once — and it is exactly how SLAM libraries structure their analytic Jacobians.

## Taylor Expansion

The Taylor series expands a smooth function $f$ around a point $x_0$:

$$f(x) = f(x_0) + f'(x_0)(x - x_0) + \frac{1}{2!}f''(x_0)(x - x_0)^2 + \cdots$$

For a multivariate function $f(\mathbf{x})$ around $\mathbf{x}_0$:

$$f(\mathbf{x}) \approx f(\mathbf{x}_0) + J(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0) + \frac{1}{2}(\mathbf{x} - \mathbf{x}_0)^T H(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0)$$

where $J$ is the Jacobian (first order) and $H$ is the Hessian matrix (second order). Truncating at first order gives the *linear approximation* used in Gauss-Newton; truncating at second order gives the *quadratic approximation* used in Newton's method.

## From Taylor expansion to Gauss-Newton

Consider minimizing a sum of squared residuals $F(\mathbf{x}) = \frac{1}{2}\|\mathbf{e}(\mathbf{x})\|^2$. Linearize the residual around the current estimate, $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e} + J\Delta\mathbf{x}$, and substitute:

$$F(\mathbf{x} + \Delta\mathbf{x}) \approx \frac{1}{2}\|\mathbf{e}\|^2 + \mathbf{e}^T J\,\Delta\mathbf{x} + \frac{1}{2}\Delta\mathbf{x}^T J^T J\,\Delta\mathbf{x}$$

This is a quadratic in $\Delta\mathbf{x}$; setting its derivative to zero gives the **normal equations**:

$$(J^T J)\,\Delta\mathbf{x} = -J^T \mathbf{e}$$

Gauss-Newton is therefore "Newton's method with $H \approx J^T J$" — the second-derivative terms of the true Hessian are dropped, which is a good approximation when residuals are small. Levenberg-Marquardt adds a damping term, solving $(J^TJ + \lambda I)\Delta\mathbf{x} = -J^T\mathbf{e}$, interpolating between Gauss-Newton ($\lambda \to 0$) and gradient descent ($\lambda$ large).

## Checking Jacobians numerically

Analytic Jacobians are notoriously easy to get wrong (a sign, a transposed block). The standard sanity check is **central finite differences**: perturb one state dimension at a time and compare

$$J_{:,k} \approx \frac{\mathbf{e}(\mathbf{x} + h\,\mathbf{1}_k) - \mathbf{e}(\mathbf{x} - h\,\mathbf{1}_k)}{2h}$$

with a small step (e.g., $h \sim 10^{-6}$). Every serious SLAM codebase has a unit test doing exactly this for each residual type.

## Common pitfalls

- **Sign errors**: the residual $\mathbf{z} - \pi(\cdot)$ vs. $\pi(\cdot) - \mathbf{z}$ flips the sign of $J$; be consistent.
- **Differentiating rotations naively**: rotation matrices are constrained, so derivatives must be taken with respect to a local perturbation (see [Lie groups](../level-02-getting-familiar/lie-groups.md)), not the 9 matrix entries.
- **Forgetting a chain-rule factor** through normalization or distortion functions — the numeric check above catches this immediately.

## Why it matters for SLAM

In bundle adjustment, the reprojection error $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\Delta\mathbf{x}$ is linearized around the current estimate. This converts the nonlinear least-squares problem into a sequence of linear systems $(J^T J)\Delta\mathbf{x} = -J^T \mathbf{e}$, solved iteratively. Every optimization-based SLAM system — from pose graph optimization to full bundle adjustment — is built on this linearize-solve-update loop, so being able to derive Jacobians by hand (and check them numerically) is a core skill.

## Related

- [Basic Linear Algebra](basic-linear-algebra.md)
- [Logarithm & Exponential](logarithm-and-exponential.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)

[Back to Level 1](../README.md#level-1-beginner)
