# CCM-SLAM

> Schmuck & Chli 2019 · [Paper](https://github.com/v4rl-ucy/ccm_slam)

**One-line summary** — CCM-SLAM is a centralized collaborative monocular SLAM system in which ORB-SLAM-based agents with fixed-size local maps stream keyframes to a server that performs place recognition, Sim(3) map fusion, redundancy removal and global optimization — engineered so every robot keeps flying through communication failures.

## Problem

Single-robot monocular SLAM is limited in coverage and vulnerable to drift; a robotic team can map faster and correct each other's drift — but only if three problems are solved together: (1) sharing map data efficiently over bandwidth-constrained wireless links, (2) merging maps built by different robots (with unknown initial configuration) into one consistent estimate, and (3) surviving message loss and delays without endangering any agent. The extra constraint that makes it hard: small UAVs' onboard computers cannot host a growing global map, so the architecture itself must bound client-side resources while keeping all navigation-critical tasks onboard.

## Method & architecture

**Agent side.** Each robot runs the keyframe-based visual odometry front-end of ORB-SLAM with a local map $L$ *trimmed to $N$ keyframes* (plus a buffer of up to $B=N$ unacknowledged ones) — keyframes and map points connected in a covisibility graph (edge if ≥15 shared map points, weight = shared observations). Trimming keeps the reference keyframe $KF_{ref}$ and the most recent keyframes; keyframes originated by *other* agents are removed first since the server is guaranteed to hold them. If the server link dies, the agent simply degrades to VO with a limited map window — autonomy is never delegated.

**Server side.** A server map stack holds one (unbounded) map per agent; per-agent handlers run communication, map management and place recognition threads. Each handler stores a $\mathrm{Sim}(3)$ transformation ${}^{L_i}S_i^{M_j}=\{R,t,s\}$ from the agent's local frame to its server map (initially identity — no global reference frame is ever assumed). A DBoW2 keyframe database supports two query types: *intra-map place recognition* (loop closure → global bundle adjustment) and *map matching* across agents. On a match, map fusion computes ${}^{M_m}S^{M_q}$, merges matched map point pairs into new inter-agent constraints, runs global BA (g2o Levenberg-Marquardt, preceded by essential-graph pose-graph optimization over strong edges, $w\geq100$), and updates every affected handler's transform as ${}^{L_i}S_i^{M_f} = {}^{L_i}S_i^{M_q}\cdot\left({}^{M_m}S^{M_q}\right)^{-1}$. A probabilistic keyframe-rejection scheme removes redundancy: if $\theta\%$ of a keyframe's map points are observed by at least 3 other keyframes, it is culled — essential for large missions.

**Communication protocol (the engineering heart).** All poses are exchanged in *relative* coordinates — each keyframe encodes its pose relative to its predecessor and to its covisibility parent — so data arriving while the server map is locked in optimization is implicitly corrected by the result (absolute coordinates would misalign after loop closure). Messages distinguish *new data* (full keyframe with 2D keypoints and 36-byte ORB descriptors, ~55 kB at 1000 features; new map point ~200 B) from *updates* (148 B per keyframe, 52 B per map point) — sent once vs repeatedly; this cut mean traffic from ~10 MB/s to 0.37 MB/s. Loss handling is optimistic: the server acknowledges processed keyframe IDs, and a gap triggers retransmission. The server replies with the $k$ keyframes most covisible with $KF_{ref}$ to augment the agent's local map with (possibly other agents') experiences.

## Results

Hardware: three UAVs (two AscTec Neo with Intel NUC i7, one 200 g-payload AscTec Hummingbird with Atomboard) and a laptop server, communicating over standard WiFi; evaluated on EuRoC machine-hall sequences and the authors' outdoor Irchel dataset (Leica total-station ground truth), typically averaged over 5 runs.

- **Bandwidth/robustness**: nominal per-agent traffic ~0.37 MB/s agent→server, ~0.5-0.75 MB/s server→agent; a 0.5 s delay changes nothing; 20% message loss is absorbed with slightly higher traffic; 50% loss roughly doubles traffic and can cause permanent data loss with small local maps. Traffic scales linearly with the number of agents.
- **Accuracy** (trajectory RMSE, collaborative = joint trajectory of all agents): EuRoC MH1-3 with 3 agents: 0.077 m (0.03% of trajectory length) vs single agents 0.048-0.081 m (0.04-0.116%); monocular-inertial VINS-Mono multi-session: 0.074 m (0.03%). Irchel: 0.21 m (0.06%) vs VINS-Mono 0.36 m (0.11%) — relative error improves through collaboration.
- **Onboard tracking benefits from sharing**: cumulative two-agent tracking RMSE drops from 0.296 to 0.265 m (MH01+MH02) and 0.327 to 0.272 m (MH02+MH03) when data exchange is enabled.
- **Real flights**: three UAVs mapping a 30×7 m urban scene online, with two map fusions and two loop closures during flight; a two-UAV search-and-rescue demo over a ~200×100 m training village produced a single 1336-keyframe, 46413-point server map over a standard WiFi router, with real-time operation onboard each agent throughout.

## Why it matters for SLAM

CCM-SLAM turned the cloud-SLAM concept of C2TAM into a mature, open-source system on a modern ORB-SLAM backbone, and became the de-facto baseline that later collaborative systems compare against. Its central lessons — bound the agent's resources by architecture, exchange relative (not absolute) poses, separate one-time data from updates, and design so local autonomy survives network loss — carried into essentially all subsequent multi-robot SLAM work: its direct descendants COVINS and maplab 2.0 on the centralized side, and the decentralized successors (DOOR-SLAM, Kimera-Multi) that removed the server entirely.

## Related

- [C2TAM](c2tam.md)
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md)
- [Centralized vs Decentralized](centralized-vs-decentralized.md)
- [maplab 2.0](maplab-2-0.md)
- [Kimera-Multi](kimera-multi.md)
- [DOOR-SLAM](door-slam.md)
