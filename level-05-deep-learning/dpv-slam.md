# DPV-SLAM

> Lipson 2024 · [Paper](https://arxiv.org/abs/2408.01654)

**One-line summary** — Extended DPVO into a full SLAM system (ECCV 2024) by adding efficient loop-closure and global-correction mechanisms, keeping real-time operation on a single GPU.

## Problem

Deep-network SLAM backbones deliver excellent accuracy but "such approaches are often expensive to run or do not generalize well zero-shot. Their runtime can also fluctuate wildly while their frontend and backend fight for access to GPU resources." Concretely: two CUDA workloads on one device run sequentially, so existing deep SLAM systems periodically drop from ~30 Hz to <1 Hz while a backend iteration runs — consistent real-time needs two GPUs — and flow-based backends must retain dense feature maps for *every* frame, so memory grows with video length. DPVO solved efficiency but is odometry-only, so drift grows without bound. DPV-SLAM completes the design: monocular deep SLAM with loop closure, high *minimum* framerate, and 5-7 GB memory on a single GPU.

## Method & architecture

**DPVO base.** The frontend keeps DPVO's patch graph: patches $\mathbf{P}_{ik}$ (pixel coordinates + inverse depth $\mathbf{d}$) reproject into frame $j$ via $\mathbf{P}'_{ikj} = \Pi[G_j^{-1} \cdot G_i \cdot \Pi^{-1}(\mathbf{P}_{ik})]$; a recurrent operator predicts residuals $\Delta_{ikj}$ and confidences $w_{ikj}$, and bundle adjustment aligns reprojections to the "ideal" targets $\mathcal{I}_{ikj} = \mathbf{P}'_{ikj} + \Delta_{ikj}$:

$$\operatorname*{arg\,min}_{G, \mathbf{d}} \sum_i \sum_{k} \sum_{j} \left\lVert \Pi[G_j^{-1} \cdot G_i \cdot \Pi^{-1}(\mathbf{P}_{ik})] - \mathcal{I}_{ikj} \right\rVert^2_{\Sigma_{ikj}}, \qquad \Sigma_{ikj} = \operatorname{diag}(w_{ikj})$$

**Proximity loop closure (mid-term).** The key observation: for each directed edge, the correlation operator only needs dense features of the *destination* frame, while the BA factor constrains both poses regardless of edge direction — so edges can be flipped arbitrarily to control which frames pay the memory cost. DPV-SLAM therefore permanently stores only patch features for past frames (~0.6 GB per 1000 frames) and inserts *uni-directional* edges from old patches into recent frames whenever the camera passes near a previously visited pose. Odometry and loop-closure factors are mixed in one shared optimization, run by a new CUDA block-sparse bundle adjustment built for sparse, variable-sized patch graphs. Everything runs in a single process on a single GPU; one proximity global BA takes 0.1-0.18 s on EuRoC vs 0.5-5 s for DROID-SLAM's backend.

**Classical loop closure (long-term, "DPV-SLAM++").** A complementary CPU backend corrects scale drift: dBoW2 image retrieval over ORB features detects loop candidates; off-the-shelf detectors/matchers plus structure-only BA triangulate 3D keypoints around each retrieved pair, whose alignment via RANSAC + Umeyama gives the drift $\Delta S^{loop}_{jk} \in Sim(3)$. Keyframe similarities $S_i$ are then optimized by Levenberg-Marquardt over a pose graph with smoothness and loop residuals

$$r_i = \log_{Sim(3)}\big(\Delta S_{(i,i+1)}^{-1} \cdot S_i^{-1} \cdot S_{i+1}\big), \qquad r_{jk} = \log_{Sim(3)}\big(\Delta S^{loop}_{jk} \cdot S_j^{-1} \cdot S_k\big)$$

after which poses and depths are rescaled ($d_i \leftarrow d_i / s_i$). Retrieval and PGO run in parallel processes, adding virtually zero runtime.

## Results

Median of 5 runs, timings on an RTX-3090; same TartanAir-trained weights everywhere (zero-shot):

- **EuRoC**: avg ATE 0.024 m vs DROID-SLAM 0.022 — comparable accuracy at 50 FPS vs 20 FPS using 5 GB vs 20 GB. Versus base DPVO, error drops 4x (0.105 to 0.024) for only 60 to 50 FPS and 4 to 5 GB.
- **KITTI**: DPV-SLAM++ avg ATE 25.76 m at 39 FPS vs DROID-SLAM 54.19+ (fails on 02 and 09) and LDSO 22.42; on seq 00/05/07 it reaches 8.30/5.74/1.52 where proximity-only deep methods drift by scale (DPVO 113.21 on seq 00). Proximity-only loop closure cannot fix scale drift — image retrieval is what rescues outdoor driving.
- **TUM-RGBD** (freiburg1): DPV-SLAM++ avg 0.054 vs DROID-SLAM 0.038 and GO-SLAM 0.035 — similar accuracy band at 30 FPS with 4.0-6.0 GB vs 7.2-8.5 GB.
- **TartanAir** (competition test set): avg ATE 0.16 vs DROID-SLAM 0.24, at 27 FPS vs 8 FPS.
- Overall: 0 catastrophic failures across all four benchmarks, indoor and outdoor, with 1x-4x real-time throughput.

## Why it matters for SLAM

DPV-SLAM completes the DROID-SLAM → DPVO arc: differentiable-BA visual odometry, made sparse and fast, finally equipped with loop closure to be a genuine SLAM system — and it is a clean case study of how learned frontends combine with classical global machinery (dBoW2 retrieval, $Sim(3)$ pose-graph optimization) in one budget. Its edge-flipping memory trick and single-GPU frontend/backend co-existence address the systems problems that keep deep SLAM out of robots.

## Related

- [DPVO](dpvo.md)
- [DROID-SLAM](droid-slam.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
- [MAC-VO](mac-vo.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
