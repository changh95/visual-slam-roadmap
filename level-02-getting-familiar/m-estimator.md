# M-Estimator

Ordinary least squares is statistically optimal under Gaussian noise — and catastrophically fragile under outliers, because the squared loss grows without bound: a single gross outlier can drag the estimate arbitrarily far. **M-estimators** (maximum-likelihood-type estimators) fix this by replacing the squared loss with a **robust kernel** $\rho$ that grows more slowly for large residuals:

$$
\min_{\theta} \sum_i \rho\!\left(\frac{r_i(\theta)}{\sigma}\right)
$$

where $r_i$ is the $i$-th residual (e.g. a reprojection error) and $\sigma$ is a scale parameter that normalizes residuals to noise units.

## Common robust kernels

- **Huber**: quadratic for small residuals, linear beyond a threshold $k$:

$$
\rho(r) = \begin{cases} r^2/2 & |r| \leq k \\ k|r| - k^2/2 & |r| > k \end{cases}
$$

  Convex, safe, mild — the default choice when unsure.

- **Cauchy (Lorentzian)**: $\rho(r) = \frac{c^2}{2}\log\!\left(1 + r^2/c^2\right)$. Logarithmic growth, strongly down-weights large outliers, but non-convex.

- **Tukey biweight**: saturates completely — residuals beyond the threshold $c$ contribute a constant cost and exactly **zero** gradient, so confirmed outliers stop influencing the solution at all. Such *redescending* kernels reject outliers hardest but need a decent initialization, since faraway measurements cannot pull the estimate back.

The derivative $\psi(r) = \rho'(r)$ is called the **influence function**: it measures how much a datum at residual $r$ tugs on the estimate. For least squares $\psi(r) = r$ (unbounded influence); for Huber it is clipped at $\pm k$; for Tukey it redescends to zero.

## Solving with IRLS

Setting the gradient of the robust cost to zero gives $\sum_i \psi(r_i)\,\partial r_i/\partial\theta = 0$. Defining a weight $w_i = \psi(r_i)/r_i$ turns this into the condition of a **weighted** least-squares problem, which suggests **Iteratively Reweighted Least Squares (IRLS)**:

1. Compute residuals $r_i$ at the current estimate.
2. Compute weights $w_i = \rho'(r_i)/r_i$ (small residual → weight near 1; large residual → weight near 0).
3. Solve the weighted least-squares problem $\min_\theta \sum_i w_i\, r_i(\theta)^2$ (one Gauss-Newton/LM step).
4. Repeat until convergence.

In practice this integrates seamlessly into a [Gauss-Newton](gauss-newton.md) or [Levenberg-Marquardt](levenberg-marquardt.md) loop: the robust kernel just rescales each residual block's Jacobian and error. Ceres calls these `LossFunction`s, g2o calls them `RobustKernel`s.

The scale $\sigma$ matters as much as the kernel: it defines what counts as "large". A standard robust estimate is derived from the median absolute deviation, $\hat{\sigma} = 1.4826 \cdot \mathrm{median}_i\,|r_i - \mathrm{median}(r)|$, where the constant makes it consistent with the Gaussian standard deviation.

## M-estimators vs. RANSAC

The two are complementary, and real pipelines use both:

- [RANSAC](ransac.md) makes a **hard** inlier/outlier decision and can recover from overwhelming outlier fractions, but its output is only as good as one minimal sample.
- M-estimators make **soft**, continuous decisions and refine all parameters jointly, but converge to the right basin only if started near it.

The standard recipe: RANSAC to find a coarse model and inlier set, then robust nonlinear refinement (Huber/Cauchy) over the inliers to absorb the remaining mismatches.

## Why it matters for SLAM

Every residual in SLAM is occasionally wrong: mismatched features, moving objects, false loop closures. Feeding even a handful of these into a pure least-squares [bundle adjustment](bundle-adjustment.md) corrupts the whole trajectory. Robust kernels are therefore ubiquitous — ORB-SLAM wraps reprojection errors in Huber kernels, pose-graph back-ends wrap loop-closure edges in Cauchy or switchable-constraint formulations, and modern globally robust methods (graduated non-convexity) are built directly on redescending M-estimators. Knowing which kernel a system uses, and at what threshold, tells you how it will behave the day the front-end lies to it.

## Related

- [RANSAC](ransac.md)
- [Non-linear optimization](non-linear-optimization.md)
- [Bundle Adjustment](bundle-adjustment.md)
- [Robust pose-graph optimization](robust-pose-graph-optimization.md)
- [GNC](../level-05-deep-learning/gnc.md)
