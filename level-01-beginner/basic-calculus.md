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

## Taylor Expansion

The Taylor series expands a smooth function $f$ around a point $x_0$:

$$f(x) = f(x_0) + f'(x_0)(x - x_0) + \frac{1}{2!}f''(x_0)(x - x_0)^2 + \cdots$$

For a multivariate function $f(\mathbf{x})$ around $\mathbf{x}_0$:

$$f(\mathbf{x}) \approx f(\mathbf{x}_0) + J(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0) + \frac{1}{2}(\mathbf{x} - \mathbf{x}_0)^T H(\mathbf{x}_0)(\mathbf{x} - \mathbf{x}_0)$$

where $J$ is the Jacobian (first order) and $H$ is the Hessian matrix (second order). Truncating at first order gives the *linear approximation* used in Gauss-Newton; truncating at second order gives the *quadratic approximation* used in Newton's method.

## Why it matters for SLAM

In bundle adjustment, the reprojection error $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\Delta\mathbf{x}$ is linearized around the current estimate. This converts the nonlinear least-squares problem into a sequence of linear systems $(J^T J)\Delta\mathbf{x} = -J^T \mathbf{e}$, solved iteratively. Every optimization-based SLAM system — from pose graph optimization to full bundle adjustment — is built on this linearize-solve-update loop, so being able to derive Jacobians by hand (and check them numerically) is a core skill.

## Related

- [Basic Linear Algebra](basic-linear-algebra.md)
- [Logarithm & Exponential](logarithm-and-exponential.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)

[Back to Level 1](../README.md#level-1-beginner)
