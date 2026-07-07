# FutureMapping 2

> Davison 2019 · [Paper](https://arxiv.org/abs/1910.14139)

**One-line summary** — Tutorial-style follow-up to FutureMapping that develops Gaussian Belief Propagation on factor graphs as the core distributed algorithm for Spatial AI, deriving the full information-form message-passing equations and demonstrating them on surface reconstruction and incremental SLAM simulations with code.

## Problem

FutureMapping 1 argued the vision; this paper supplies the algorithmic substance. Standard SLAM back-ends (g2o, GTSAM, Ceres) solve factor-graph inference via centralized global solves that fit poorly with the distributed, incremental, always-on estimation that smart robots and devices operating under real product constraints will need — and with emerging graph processors whose storage and compute are spread across thousands of cores. The paper makes the case that GBP has "the right character" for this future: fully local computation and storage, arbitrary message schedules, and easy dynamic modification of the graph.

## Method & architecture

GBP is loopy belief propagation where all messages and beliefs are Gaussian, kept in the **information form** $\eta = \Lambda\mu$ (information vector and precision matrix), which handles rank-deficient, unconstrained variables and makes products of Gaussians a simple addition of parameters. A factor encoding measurement $\mathbf{z}_s$ with model $\mathbf{h}_s$ and measurement precision $\Lambda_s$ is

$$f_s(\mathbf{x}_s) = K \exp\left( -\tfrac{1}{2} (\mathbf{z}_s - \mathbf{h}_s(\mathbf{x}_s))^{\top} \Lambda_s (\mathbf{z}_s - \mathbf{h}_s(\mathbf{x}_s)) \right).$$

**Linearisation.** A non-linear factor is turned into a local Gaussian around anchor $\mathbf{x}_0$ using the Jacobian $\mathrm{J}_s$:

$$\eta_s = \mathrm{J}_s^{\top}\Lambda_s\left( \mathrm{J}_s\mathbf{x}_0 + \mathbf{z}_s - \mathbf{h}_s(\mathbf{x}_0) \right), \qquad \Lambda_s' = \mathrm{J}_s^{\top}\Lambda_s\mathrm{J}_s,$$

exactly the ingredients of a Gauss-Newton step, but kept local to the factor and relinearised as often (or rarely) as desired.

**Variable-to-factor messages** are just sums of all other incoming messages: $\eta_{ms} = \sum_{l} \eta_{ml}$ and $\Lambda_{ms} = \sum_{l} \Lambda_{ml}$, over neighbours of $\mathbf{x}_m$ except the target factor $f_s$. **Factor-to-variable messages** add incoming messages onto the partitioned factor parameters (conditioning), reorder so the output variable comes first, and marginalise out the rest with the standard information-form Schur complement:

$$\eta_{M\alpha} = \eta_\alpha - \Lambda_{\alpha\beta}\Lambda_{\beta\beta}^{-1}\eta_\beta, \qquad \Lambda_{M\alpha} = \Lambda_{\alpha\alpha} - \Lambda_{\alpha\beta}\Lambda_{\beta\beta}^{-1}\Lambda_{\beta\alpha}.$$

The most expensive local operation is the small matrix inversion $\Lambda_{\beta\beta}^{-1}$ — for unary/binary factors its dimension is at most one variable's dimension. On tree (chain) graphs GBP is exact in one sweep each way; on the loopy graphs of SLAM it iterates to good approximations, and the authors found convergence "remarkably independent" of message scheduling — the property that lets each node live on its own core or device.

**Robust factors.** M-estimators are folded in with purely local computation: evaluate the factor's Mahalanobis distance $M_s$; if it exceeds a threshold $N_\sigma$ (Huber's quadratic-to-linear transition), rescale that factor's $\eta_s$ and $\Lambda_s'$ for this message pass by

$$k_R = \frac{2N_\sigma}{M_s} - \frac{N_\sigma^2}{M_s^2},$$

so the message carries the precision of the Gaussian with equivalent energy (a constant-beyond-threshold kernel uses $k_R = N_\sigma^2/M_s^2$). This yields "lazy data association": a factor's inlier/outlier status can keep changing as evidence accumulates.

**Worked examples with code**: 1D surface reconstruction with interpolated height measurements and pairwise smoothness factors (a loop-free chain, solved exactly); 2D constraint graphs; and an interactive incremental 2D SLAM simulation (`bpslam.py`) with odometry and landmark factors, where message passing simply continues as the robot adds variables and factors — no batch re-solve, even at loop closure. Priors, weak anchors, and dynamically edited factor strengths propagate automatically through the graph.

## Results

The paper is a tutorial and its evaluations are simulations, presented qualitatively: GBP estimates in the incremental SLAM simulation are consistent with a batch solution and comfortably cope with the dynamically changing graph including loop closures; with 1 in 50 measurements corrupted by large errors and Huber factors on all measurements, GBP detects outliers in a local, lazy manner — erroneous measurements are often identified much later, once enough support builds for a better hypothesis. Changing factor precisions after convergence propagates quickly with no global coordination. See paper for the full worked derivations and simulation figures.

## Why it matters for SLAM

This is the standard accessible introduction to GBP for SLAM researchers, and it catalyzed the follow-up work that demonstrated real speedups (bundle adjustment on Graphcore's IPU) and decentralized multi-robot inference (DANCeRS). Its core promise — factor-graph SLAM without a centralized solver — is directly relevant to multi-robot systems and to whatever massively parallel hardware ends up inside future AR devices.

## Related

- [FutureMapping 1](futuremapping-1.md) — the vision paper this one substantiates
- [BA on Graph Processor](ba-on-graph-processor.md) — first concrete IPU demonstration of GBP bundle adjustment
- [DANCeRS](dancers.md) — multi-robot distributed consensus via GBP
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the representation GBP operates on
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — the centralized formulation GBP replaces
