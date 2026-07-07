# DANCeRS

> Patwardhan 2025 · [Paper](https://arxiv.org/abs/2508.18153)

**One-line summary** — DANCeRS applies Gaussian Belief Propagation to distributed consensus in robot swarms: robots agree on shared decisions — continuous (a formation's pose) or discrete (best-of-N choices) — through purely local, peer-to-peer message passing on a factor graph, with no central server.

## Problem

Robot swarms need cohesive collective behaviour for challenges ranging from shape formation to group decision-making. Existing approaches "often treat consensus in discrete and continuous decision spaces as distinct problems", each with bespoke algorithms (best-of-N voting and opinion dynamics on one side, neighbour-averaging and mean-shift on the other). DANCeRS asks whether a single distributed inference framework can deliver consensus in both domains while respecting the realities of swarms: local-only communication, dynamic graph topology, and scalability with swarm size.

## Method & architecture

The swarm of $N$ robots (communication radius $r_C$) forms a dynamic undirected graph; the whole problem is one factor graph on which the joint distribution factorises as

$$p(\mathbf{X})=\prod_{s}f_{s}(\mathbf{X}_{s}), \qquad f_{s}(\mathbf{X}_{s})\propto e^{-\frac{1}{2}\mathbf{r}^{\top}\boldsymbol{\Lambda}_{s}\mathbf{r}}, \qquad \mathbf{r}=\mathbf{z}_{s}-\mathbf{h}_{s}(\mathbf{X}_{s}),$$

with beliefs kept in information form ($\boldsymbol{\Lambda}=\boldsymbol{\Sigma}^{-1}$, $\boldsymbol{\eta}=\boldsymbol{\Lambda}\boldsymbol{\mu}$). GBP inference is one loop of factor-to-variable messages, variable belief updates, and variable-to-factor messages — all strictly between neighbours. For non-Euclidean states, messages are mapped into the tangent space of the current belief and back via Exp/Log, so variables can live on $\mathbb{R}^{M}, SO(2), SO(3), SE(2), SE(3)$.

Each robot runs a two-layer factor-graph stack:

- **Global Consensus layer** — robot $i$ holds its interpretation ${}^{\mathcal{G}}X_{i}$ of the shared parameter $\chi$, with a prior factor $h_{p}={}^{\mathcal{G}}X_{i}\ominus{}^{\mathcal{G}}x_{i}^{0}$ and, per in-range neighbour $j$, an explicit negotiation factor

$$h_{c}\left({}^{\mathcal{G}}X_{i},{}^{\mathcal{G}}X_{j}\right)={}^{\mathcal{G}}X_{i}\ominus{}^{\mathcal{G}}X_{j}=\mathrm{Log}\left({}^{\mathcal{G}}X_{j}^{-1}\cdot{}^{\mathcal{G}}X_{i}\right).$$

  Because GBP variables are memory-less, each robot keeps a sliding window of $W$ temporally-linked copies; when the oldest is deleted its marginal becomes a new prior, so a robot leaving a group keeps its negotiated mean while its covariance weakens.
- **Discrete decisions as continuous consensus** — for $N_D$ options, take $\mathcal{M}=\mathbb{R}^{1}$ and quantise only to read out the decision: $\gamma(x)=\lfloor N_{D}\cdot x\rfloor$, $\gamma^{-1}(k)=k/N_{D}$. The negotiation itself stays Gaussian and continuous.
- **Path Planning layer** — states $[x,y,\theta,\dot{x},\dot{y},\dot{\theta}]^{\top}$ over a horizon, with a new non-holonomic unicycle factor $h_{u}=\dot{x}\cos\theta-\dot{y}\sin\theta$ (driven to 0, aligning velocity with heading) and a smoothed inter-robot collision factor $h_{r}=\exp(-|\mathbf{x}_{k,i}-\mathbf{x}_{k,j}|/d_{min})$. For shape formation, goals are picked by KD-tree nearest-neighbour search over formation points augmented with an "occupancy weighting" that decays when neighbours leave communication range.

## Results

- **Continuous consensus (shape formation):** convergence defined as mean inter-robot deviation below 0.1 m in position and 0.01 rad in heading; over 50 trials in a 100×100 m arena, DANCeRS converges an order of magnitude faster (in message-passing iterations) than the mean-shift consensus baseline of Sun et al. 2023, with convergence accelerating as $r_C$, robot count $N_R$, and window $W$ grow. It also forms disjoint shapes ('!', 'wifi', smiley face) that mean-shift methods, limited to one connected component, cannot.
- **Discrete consensus:** against entropy-based (ECA) and probabilistic (PCA) consensus baselines, at $r_C=6$ m ECA failed to converge at all; at larger $r_C$ DANCeRS took a roughly constant number of iterations as $N_R$ increased. A sweep supports $\sigma_{c}=0.5/N_{D}$ as a favourable upper bound on consensus-factor strength.
- **Informed robots** ($N_R=500$, $r_C=6$ m): with a single seed robot ($\zeta=0.002$) DANCeRS converged to the seed decision in 80% of trials and in 100% for $\zeta\geq0.01$, versus PCA's 9%→94% over $\zeta=0.002$–$0.05$ and ECA's 0% throughout.
- **Cost:** each inter-robot message is an $n$-vector plus an $n\times n$ symmetric covariance, with $n=3$ for shape formation and $n=1$ for discrete consensus — lightweight enough for low-power devices.

## Why it matters for SLAM

Collaborative SLAM at swarm scale runs into exactly the problems DANCeRS targets: centralized map servers become bandwidth and reliability bottlenecks, and distributed optimizers must tolerate asynchrony and local-only communication. Demonstrating that GBP-style consensus works across a swarm — on Lie-group variables, under a dynamic graph — supports the vision of factor-graph message passing as the shared machinery for distributed estimation, mapping, planning, and coordination, the same computation that solves BA on a graph processor.

## Related

- [FutureMapping 2](futuremapping-2.md)
- [BA on Graph Processor](ba-on-graph-processor.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md)
- [Swarm-SLAM](../level-08-collaborative-slam/swarm-slam.md)
- [Centralized vs Decentralized](../level-08-collaborative-slam/centralized-vs-decentralized.md)
