# Swarm-SLAM

> Lajoie 2024 · [Paper](https://arxiv.org/abs/2301.06230)

**One-line summary** — Swarm-SLAM is an open-source, sensor-agnostic, decentralized collaborative SLAM framework designed around the properties swarm robotics actually needs — scalability, flexibility, decentralization, and sparsity — with a novel spectral loop-closure prioritization that spends a fixed budget on the most informative inter-robot matches.

## Problem

Collaborative SLAM is a vital component for multi-robot operations in environments without an external positioning system — indoors, underground, or underwater. But as teams grow, naive C-SLAM designs hit a communication wall: exchanging descriptors and geometrically verifying every candidate loop closure between every pair of robots is untenable over bandwidth-limited ad-hoc links. Swarm-SLAM asks how to keep a decentralized system *sparse* — in what is stored, transmitted, and verified — while still finding the inter-robot loop closures that matter most for accurate global estimation.

## Method & architecture

**Front-end (global matching).** Each robot consumes an arbitrary external odometry input plus synchronized sensor data (LiDAR, stereo, RGB-D, IMU). Per keyframe it extracts a compact global descriptor — ScanContext for LiDAR scans, the CNN-based CosPlace for images — and broadcasts only descriptors not yet known to each neighbor (the neighbor manager does the bookkeeping). Nearest-neighbor search on cosine similarity produces candidate inter-robot loop closures.

**Budgeted spectral prioritization (core novelty).** The multi-robot pose graph is $\mathcal{G}=(V, \mathcal{E}^{\text{local}}, \mathcal{E}^{\text{global}})$, where $\mathcal{E}^{\text{global}}$ splits into already-verified fixed edges and unverified candidates. Since the algebraic connectivity $\lambda_2$ (second-smallest eigenvalue of the rotation-weighted graph Laplacian) controls the worst-case error of the SLAM maximum-likelihood estimate, candidates are chosen to maximize it. The Laplacian has entries

$$L_{ij}=\begin{cases}\sum_{(i,j')\in\delta(i)}\kappa_{ij'}, & i=j,\\ -\kappa_{ij}, & \{i,j\}\in\mathcal{E},\\ 0, & \{i,j\}\notin\mathcal{E},\end{cases}$$

with edge weights $\kappa_{ij}=1$ for fixed/local edges and $\kappa_{ij}=s_e$ (the global-matching similarity score) for candidates — so no extra noise information needs to be communicated. Writing the augmented Laplacian as

$$L(\omega) \triangleq L^{\mathcal{E}^{\text{local}}} + L^{\mathcal{E}^{\text{global}}_{\text{fixed}}} + \sum_{e\in\mathcal{E}^{\text{global}}_{\text{candidate}}} \omega_e L_e,$$

each cycle selects the subset of size $B$ (the user-set verification/communication budget) solving

$$\max_{\omega_e\in\{0,1\}} \lambda_2(L(\omega)) \quad \text{s.t.} \quad |\omega| = B,$$

which is NP-hard, so the integrality constraint is relaxed, solved cheaply, and rounded, warm-started from the greedy (top-similarity) solution.

**Local matching & communication.** Selected candidates undergo geometric verification; which keyframes' local features to transmit is cast as a minimum vertex cover problem so shared vertices are sent only once. A temporary broker (lowest-ID robot in range) coordinates matching and transfer requests.

**Back-end (decentralized, not distributed).** At each rendezvous, one robot is elected through negotiation to gather its neighbors' pose graphs and run pose-graph optimization with the Graduated Non-Convexity (GNC) solver under a robust Truncated Least Squares loss, then returns the updated estimates. An anchor-selection scheme (fix the first pose of the lowest reference-frame ID) makes subsets of robots converge to a single global frame across sporadic rendezvous without any central authority.

## Results

- **Datasets:** seven sequences from five datasets, mixing sensors — KITTI 00 stereo split into 2 robots, the ~10 km KITTI-360 09 LiDAR sequence split into 5 robots, GrAco (3 LiDAR sequences), M2DGR Gate (3 LiDAR), and S3E (3 sequences, LiDAR-IMU odometry with stereo-camera inter-robot loop closure detection).
- **Prioritization:** with a budget of $B=1$ per cycle, spectral prioritization maximizes algebraic connectivity as intended and reduces ATE faster than greedy similarity ranking — reasonable accuracy is reached after computing only a fraction of all candidate loop closures.
- **Back-end comparison:** against DGS+PCM and distributed GNC (D-GNC/RBCD) on the same front-end, the GNC-based decentralized back-end consistently achieved the best ATE and the lowest communication and computation time; on KITTI-360 09 (5 robots), the distributed baselines required more than five times the data transmission without matching its accuracy.
- **Real-world deployment:** three heterogeneous robots (Boston Dynamics Spot, Agilex Scout, Scout Mini; each with Jetson AGX Xavier, RealSense D455, Ouster OS0-64, VectorNav VN100, ad-hoc Wi-Fi) in an indoor parking lot: 475 m travelled, 3103 keyframes, 67 inter-robot loop closures of which 10 outliers were rejected by GNC, with only 94.95 MB transmitted in total.

## Why it matters for SLAM

As robot teams grow, naive descriptor broadcasting and exhaustive loop-closure verification blow up communication and computation. Swarm-SLAM attacks exactly this bottleneck, showing that *which* loop closures you verify first matters as much as how you optimize them — and that a simple decentrally-elected back-end can beat fancier distributed solvers in accuracy, bandwidth, and robustness to communication failures. Coming from the same group as DOOR-SLAM, it packages a decade of distributed-SLAM lessons into a modern ROS 2 framework (`MISTLab/Swarm-SLAM`), and its sensor agnosticism makes it a common baseline for heterogeneous multi-robot experiments.

## Related

- [DOOR-SLAM](door-slam.md) — earlier distributed, outlier-resilient system from the same lab
- [Kimera-Multi](kimera-multi.md) — the metric-semantic distributed alternative (source of the D-GNC baseline)
- [Communication constraints](communication-constraints.md) — the resource Swarm-SLAM is engineered to conserve
- [Centralized vs Decentralized](centralized-vs-decentralized.md) — architectural context
- [Inter-robot loop closure](inter-robot-loop-closure.md) — what gets prioritized and verified
- [Map merging](map-merging.md) — the operation the prioritized closures enable
