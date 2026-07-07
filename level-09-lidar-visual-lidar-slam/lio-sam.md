# LIO-SAM

> Shan 2020 · [Paper](https://arxiv.org/abs/2007.00258)

**One-line summary** — LIO-SAM reformulated LiDAR-inertial odometry as factor-graph smoothing, letting IMU preintegration, scan-matching, GPS, and loop closures all enter one MAP estimation problem — while keeping real time by matching keyframes only against a local sliding-window map.

## Problem

LOAM saves its data in a global voxel map, which makes it difficult to perform loop closure detection or incorporate absolute measurements such as GPS; its IMU is used only to de-skew scans and give a motion prior (loosely coupled), and its optimization degrades as the voxel map densifies. Tightly-coupled alternatives like LIOM process all measurements jointly but run at only ~0.6× real time. LIO-SAM targets both problems at once: a factor graph accepts heterogeneous relative and absolute measurements as factors, and scan-matching at a *local* rather than global scale keeps computation bounded.

## Method & architecture

The robot state is $\mathbf{x} = [\,\mathbf{R}^{\top}, \mathbf{p}^{\top}, \mathbf{v}^{\top}, \mathbf{b}^{\top}\,]^{\top}$ (attitude, position, velocity, IMU bias). A new state node is added when the pose change exceeds a threshold, and the graph is optimized incrementally with iSAM2 under four factor types:

- **IMU preintegration factors**: between times $i$ and $j$, raw IMU rates are integrated into relative motion constraints

  $$\Delta\mathbf{v}_{ij} = \mathbf{R}_i^{\top}(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\Delta t_{ij}), \quad \Delta\mathbf{p}_{ij} = \mathbf{R}_i^{\top}\left(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\Delta t_{ij}^2\right), \quad \Delta\mathbf{R}_{ij} = \mathbf{R}_i^{\top}\mathbf{R}_j.$$

  Preintegration does double duty: it de-skews the point cloud and initializes scan-matching; the optimized LiDAR odometry in turn estimates the IMU bias in the graph.
- **LiDAR odometry factors**: LOAM-style edge and planar features (by local roughness) are extracted per scan. Keyframes are selected when the pose changes by more than 1 m or 10°; frames in between are discarded. A new keyframe is registered not to a global map but to a voxel map merged from the $n = 25$ most recent sub-keyframes (edge map downsampled at 0.2 m, planar map at 0.4 m). Point-to-line and point-to-plane distances, e.g. for an edge feature

  $$\mathbf{d}_{e_k} = \frac{\left|(\mathbf{p}^{e}_{i+1,k}-\mathbf{p}^{e}_{i,u}) \times (\mathbf{p}^{e}_{i+1,k}-\mathbf{p}^{e}_{i,v})\right|}{\left|\mathbf{p}^{e}_{i,u}-\mathbf{p}^{e}_{i,v}\right|},$$

  are minimized over $\mathbf{T}_{i+1}$ by Gauss–Newton, $\min_{\mathbf{T}_{i+1}} \{ \sum_k \mathbf{d}_{e_k} + \sum_k \mathbf{d}_{p_k} \}$, and the resulting relative transformation $\Delta\mathbf{T}_{i,i+1} = \mathbf{T}_i^{\top}\mathbf{T}_{i+1}$ becomes the factor linking consecutive states.
- **GPS factors**: absolute positions are transformed to local Cartesian coordinates and — since LiDAR-inertial drift grows slowly — added only when the estimated position covariance exceeds the GPS covariance, with linear interpolation for timestamp alignment.
- **Loop-closure factors**: a naive but effective Euclidean search finds prior states within 15 m of a new state; the new keyframe is scan-matched against the $2m+1$ sub-keyframes ($m = 12$) around the candidate. Loops prove especially valuable for correcting altitude drift, since GPS elevation errors approached 100 m in the authors' tests.

## Results

Evaluated on five self-collected datasets (Rotation, Walking, Campus, Park, Amsterdam) across three platforms — handheld device, Clearpath Jackal UGV, and the Duffy 21 electric boat — using a VLP-16, a MicroStrain 3DM-GX5-25 IMU, and Reach M GPS, on an i7-10710U CPU (no GPU):

- **End-to-end translation error (m)**: Campus (1437 m): LOAM 192.43, LIO-odom (no GPS/loops) 9.44, LIO-GPS 6.87, LIO-SAM **0.12**. Park (2898 m): LOAM 121.74, LIOM 34.60, LIO-GPS 2.93, LIO-SAM **0.04**. Amsterdam (19 065 m, 3 h canal cruise): only LIO-GPS (1.21) and LIO-SAM (**0.17**) produce meaningful results.
- **RMSE vs GPS ground truth (Park)**: LIO-SAM 0.96 m vs LOAM 47.31 m, LIOM 28.96 m, LIO-odom 23.96 m.
- **Robustness**: in the Rotation test (up to 133.7 °/s while standing still) LIO-SAM registers precisely in $SO(3)$ where LIOM fails to initialize; the Walking dataset reaches 213.9 °/s.
- **Runtime**: per-scan mapping times e.g. Walking: LIO-SAM 58.4 ms vs LOAM 253.6 ms and LIOM 339.8 ms; stress tests show correct operation at up to 13× real-time playback. LIOM ran at only ~0.6× real time.

## Why it matters for SLAM

LIO-SAM did for LiDAR what VINS-Mono and OKVIS did for cameras: it made tightly-coupled inertial fusion via graph optimization the default architecture. Its clean separation of measurement sources as factors makes it easy to extend — LVI-SAM adds an entire visual-inertial subsystem on top of it — and it remains the standard factor-graph baseline against which filter-based systems like FAST-LIO2 are compared. Use it when you want loop closure, GPS fusion, and a smoothing backend out of the box.

## Related

- [LOAM](loam.md) — the feature extraction and scan-matching foundation
- [LVI-SAM](lvi-sam.md) — direct extension to LiDAR-visual-inertial fusion
- [FAST-LIO2](fast-lio2.md) — the competing direct, filter-based approach
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md) — the key inertial machinery
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the backend formalism
