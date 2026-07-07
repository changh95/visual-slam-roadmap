# BA on Graph Processor

> Ortiz 2020 · [Paper](https://arxiv.org/abs/2003.03134)

**One-line summary** — First demonstration (CVPR 2020) that bundle adjustment can be solved extremely fast with Gaussian Belief Propagation on a graph processor (Graphcore IPU), validating the algorithm-hardware co-design vision of FutureMapping.

## Problem

Bundle adjustment is a central computational bottleneck of SLAM and SfM. Classical solvers compute a point estimate of the MAP solution with Levenberg-Marquardt — an inherently centralized batch computation — and even tree-based incremental methods like iSAM2 require periodic centralized restructuring of the graph. Meanwhile, low-power embodied Spatial AI demands massively parallel, in-place computation with minimal data transfer. This paper shows that GBP, which had barely been used for geometric vision, maps naturally onto Graphcore's IPU — 1216 independent cores ("tiles"), each with 256KB local memory and 6 hardware threads, all-to-all interconnect, on-chip accesses costing about 1pJ per byte versus hundreds of pJ per byte for GPU/CPU DRAM.

## Method & architecture

**BA as a factor graph.** Variables are keyframe poses $X$ and landmarks $L$; factors are Gaussian priors $\phi_i(\mathbf{x}_i)$, $\theta_j(\mathbf{l}_j)$ (needed to set monocular scale and condition 2-DOF reprojection messages; auto-generated 100x weaker than the measurement terms) and reprojection factors $\psi_{km}$ with measurement model $\mathbf{h}(\mathbf{x}_k,\mathbf{l}_m) = \pi(R_k\mathbf{l}_m + \mathbf{t}_k)$. MAP inference minimizes the sum of squared Mahalanobis residuals over priors and reprojections. Linearising about $(\mathbf{x}_{k,0},\mathbf{l}_{m,0})$ with the $2\times 9$ Jacobian $\mathrm{J}$ gives each measurement factor in information form:

$$\eta_{km} = \mathrm{J}^{\top}\Sigma_M^{-1}\left( \mathrm{J}\begin{bmatrix}\mathbf{x}_{k,0}\\ \mathbf{l}_{m,0}\end{bmatrix} + \mathbf{z}_{km} - \mathbf{h}(\mathbf{x}_{k,0},\mathbf{l}_{m,0}) \right), \qquad \Lambda_{km} = \mathrm{J}^{\top}\Sigma_M^{-1}\mathrm{J}.$$

**GBP message passing.** Each variable node stores a belief $b_i^t(\mathbf{v}_i)=\mathcal{N}^{-1}(\mathbf{v}_i;\eta_{b_i}^t,\Lambda_{b_i}^t)$. A pairwise factor $\psi_{ij}$ with partitioned parameters sends to variable $\mathbf{v}_i$:

$$\eta_{j\to i}^{t+1} = \eta_i^{ij} - \Lambda_{ij}^{ij}\left( \Lambda_{jj}^{ij} + \Lambda_{b_j}^{t} - \Lambda_{i\to j}^{t} \right)^{-1} \left( \eta_j^{ij} + \eta_{b_j}^{t} - \eta_{i\to j}^{t} \right),$$

$$\Lambda_{j\to i}^{t+1} = \Lambda_{ii}^{ij} - \Lambda_{ij}^{ij}\left( \Lambda_{jj}^{ij} + \Lambda_{b_j}^{t} - \Lambda_{i\to j}^{t} \right)^{-1} \Lambda_{ji}^{ij},$$

and each variable updates its belief by summing its prior and incoming messages: $\eta_{b_i}^{t+1} = \eta_{p_i} + \sum_j \eta_{j\to i}^{t}$, likewise for $\Lambda$. Messages from factors are damped, $\eta^{t+1} \leftarrow (1-d)\,\eta^{t+1} + d\,\eta^{t}$ with $d=0.4$. Relinearisation is entirely local: a factor relinearises when its variables' beliefs drift more than $\beta = 0.01$ from the linearisation point (at most every 10 iterations). Robust cost: a Huber kernel is folded in by rescaling the factor's Gaussian when the Mahalanobis distance $M_{km}$ exceeds $N_\sigma$, down-weighting messages from suspected-outlier measurements.

**IPU mapping.** Each factor/variable node maps to a tile (multiple nodes per tile via the 6 threads for larger graphs), running under the IPU's bulk-synchronous parallel model: all factors relinearise and compute messages, exchange, all variables update beliefs, exchange — a full GBP iteration takes under 125 microseconds. The whole implementation is about 1000 lines of Poplar C++; since the IPU handles halves/floats but not doubles, priors are initially set at measurement-constraint scale and gradually weakened 100x over 10 iterations for numerical stability.

## Results

Evaluation uses sections of TUM and KITTI sequences with ORB-SLAM as front-end (keyframes, ORB features, correspondences), against Ceres on a 6-core i7-8700K (18 threads, LM with dense Schur, Huber kernel, analytic derivatives):

- **Speed**: time to converge to average reprojection error (ARE) below 1.5 — GBP on one IPU is on average **24x faster than Ceres** across 10 sequences; the headline instance with 125 keyframes and 1919 points solves in under 40 ms versus 1450 ms for Ceres. GBP typically needs 50–300 iterations vs. 10–40 LM steps, but each in-place iteration is so fast it wins overall (IPU at 120W).
- **Incremental SLAM**: adding keyframes one at a time over a 90-keyframe sequence, new variables snap into consistency with the existing estimate; GBP converges on average **36x faster than Ceres**, often in fewer than 10 iterations.
- **Robustness**: over 100 trials of noise-perturbed keyframe initializations on two TUM sequences, GBP has a convergence radius comparable to Ceres.
- **Huber loss**: with artificially injected bad data associations (fr1desk, 20 keyframes), GBP with Huber gradually isolates the true outliers (recall 1 throughout) and converges, while GBP without Huber fails beyond 3% bad associations — and Ceres with the same Huber loss cannot converge the solution, suggesting GBP's local outlier handling beats LM's global treatment.

## Why it matters for SLAM

This paper turned the speculative FutureMapping essays into concrete evidence that rethinking SLAM computation around graphs, local storage, and message passing can yield order-of-magnitude speedups. The authors argue the real prize is not static BA speed but "flexible in-place optimisation of general, dynamically changing factor graphs representing Spatial AI problems" — heterogeneous factors, priors from recognition, arbitrary incremental updates. As SLAM moves onto heterogeneous edge hardware and multi-robot systems, GBP's purely local computation model is one of the few back-end designs that scales naturally with core count.

## Related

- [FutureMapping 1](futuremapping-1.md) — the vision paper predicting this result
- [FutureMapping 2](futuremapping-2.md) — the GBP tutorial this implementation follows
- [DANCeRS](dancers.md) — distributed multi-robot GBP
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the underlying representation
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — the centralized incremental alternative (iSAM2)
- [Bundle adjustment](../level-02-getting-familiar/bundle-adjustment.md) — the problem being solved
