# SuMa++

> Chen (Bonn) 2019 · [Paper](https://www.ipb.uni-bonn.de/pdfs/chen2019iros.pdf)

**One-line summary** — SuMa++ extends SuMa with point-wise semantics from RangeNet++, filtering moving objects out of the surfel map via semantic consistency checks and weighting ICP residuals by semantic agreement, which markedly improves robustness in dynamic traffic — without blindly deleting parked cars.

## Problem

SuMa — like most LiDAR SLAM systems — assumes a static world: every scan point contributes equally to ICP registration. In driving scenes, especially highways with few distinct static structures, wrong correspondences on consistently moving outliers (like cars in a traffic jam) lock the frame-to-model ICP onto the traffic and corrupt both pose and map. The naive fix — deleting all points of movable classes — backfires: parked cars are often the most distinctive static features available, and removing them makes the surfel map sparser and registration worse. The system needs to distinguish *actually moving* objects from *potentially movable but static* ones.

## Method & architecture

The SuMa pipeline is extended at three points: a semantic segmentation front-end, a dynamics filter in the map update, and semantic weights in the ICP.

- **Semantic segmentation on the range image**: RangeNet++ — an FCN based on the SqueezeSeg architecture with a DarkNet53 backbone, trained on SemanticKITTI — predicts a label for every point of the spherical projection, producing a raw semantic mask $\mathcal{S}_{\text{raw}}$. Each surfel additionally stores the inferred label $y$ and its probability.
- **Flood-fill label refinement**: back-projection of the blob-like CNN output introduces label artifacts, reduced in two steps: an *erosion* removes pixels whose neighborhood (kernel size $d$) contains conflicting labels, then a *depth-based fill-in* re-assigns eroded boundary pixels from neighbors whose vertex-map distances are consistent (within threshold $\theta$), yielding the refined mask $\mathcal{S}_D$.
- **Filtering dynamics by semantic consistency**: during the map update, the labels of the new observation $\mathcal{S}_D$ are checked against the rendered semantic world model $\mathcal{S}_M$. Inconsistent surfels — presumed moving — receive a penalty in the recursive stability update:

  $$l_s^{(t)} = l_s^{(t-1)} + \mathrm{odds}\left(p_{\text{stable}}\, e^{-\alpha^2/\sigma_\alpha^2}\, e^{-d^2/\sigma_d^2}\right) - \mathrm{odds}(p_{\text{prior}}) - \mathrm{odds}(p_{\text{penalty}}),$$

  so after several observations moving objects drop below the stability threshold and are removed, while static movables (parked cars) survive as valuable registration features.
- **Semantic ICP**: the frame-to-model point-to-plane objective becomes $E = \sum_{u \in \mathcal{V}_D} w_u\, r_u^2$ with $r_u = \mathbf{n}_u^{\top}\left(\mathbf{T}^{(k)}_{C_{t-1}C_t} \mathbf{u} - \mathbf{v}_u\right)$, solved by Gauss–Newton with weights

  $$w_u^{(k)} = \rho_{\text{Huber}}\left(r_u^{(k)}\right) C_{\text{semantic}}\left(\mathcal{S}_D(u), \mathcal{S}_M(u)\right) \mathrm{I}\{l_s^{(k)} \geq l_{\text{stable}}\},$$

  where $C_{\text{semantic}} = P(y_u|u)$ if scan and map labels agree and $1 - P(y_u|u)$ otherwise — the network's own confidence softly down-weights semantically inconsistent correspondences.
- **Initialization caveat**: dynamics in the *first* scan cannot be detected by consistency (there is no map yet), so all movable classes are removed during the initialization period only.

## Results

- KITTI road/raw sequences 30–41 (country + highway; not in the odometry benchmark, so no segmentation training overlap), relative rotational (deg/100 m) / translational (%) errors: SuMa 1.35/6.13 → SuMa++ 1.04/1.46 on average. Highway seq. 35: 5.11/26.8 → 2.90/1.11; seq. 40: 1.09/18.0 → 0.75/1.95; seq. 41: 1.24/15.6 → 1.14/1.67.
- KITTI odometry training set: SuMa 0.36/0.83 → SuMa++ 0.29/0.70 on average (IMLS-SLAM −/0.55, LOAM −/0.84). The naive baseline "SuMa nomovable" diverges in urban sequences (average 23.3/9.24; e.g. seq. 00: 22.0/58.0) — removing parked cars destroys good features.
- KITTI test set (server-side): 0.0032 deg/m and 1.06% translational error vs 1.39% for original SuMa.
- Runtime on a Xeon W-2123 + Quadro P4000: RangeNet++ takes 75 ms per scan on average, surfel mapping 48 ms, with at most 190 ms when integrating loop closures.

## Why it matters for SLAM

SuMa++ was one of the first LiDAR SLAM systems to use a deep segmentation network to handle dynamic environments, a problem pure geometry struggles with when traffic is dense or slow-moving. Its key empirical lesson — filter what actually *moves* via map–scan semantic consistency, rather than deleting whole movable classes — became standard practice in urban autonomous-driving SLAM, and mirrors what DynaSLAM did for visual SLAM. It also cemented the range image as the standard intermediate representation for learned LiDAR processing, and produced semantically labeled surfel maps usable by downstream navigation.

## Hands-on

- [Run SuMa++](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/suma_pp)

## Related

- [SuMa](suma.md)
- [Range image](range-image.md)
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md)
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md)
- [FAST-LIO2](fast-lio2.md)
