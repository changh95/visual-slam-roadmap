# TANDEM

> Koestler 2021 · [Paper](https://arxiv.org/abs/2111.07418)

**One-line summary** — Real-time monocular dense SLAM that pairs DSO-style photometric bundle adjustment with a learned multi-view stereo network (CVA-MVSNet) and TSDF fusion, and tracks new frames against depth rendered from the global model.

## Problem

Real-time dense reconstruction from a monocular camera is much harder than RGB-D mapping, where depth can simply be read out and fused. Classical direct methods (DSO) track accurately but reconstruct only sparse/semi-dense points; accurate multi-view stereo traditionally ran offline, and fully learned dense SLAM lagged classical methods in tracking accuracy. TANDEM asks how to get real-time tracking *and* dense, globally consistent mapping from a single moving camera — the first system to integrate learning-based MVS into a traditional optimization-based VO.

## Method & architecture

Three components run in a tight loop (VO on CPU threads; MVS inference and TSDF fusion asynchronously on GPU):

**1. Visual odometry with dense front-end.** The back-end is DSO's direct sparse windowed photometric bundle adjustment. The front-end tracks each new frame by dense direct image alignment against the last keyframe, using a combined depth buffer: sparse depths $D_{n}^{\text{DSO}}$ from the active window's points where available, otherwise dense depth $D_{n}^{\text{TSDF}}$ **rendered from the incrementally built global TSDF model** — the first monocular dense front-end tracking against a global model, and the key robustness gain over sparse-only tracking.

**2. CVA-MVSNet.** Given the active keyframes $\{(I_{i},\mathbf{T}_{i})\}_{i=1}^{n}$, shared-weight 2D U-Nets extract multi-scale features $\mathbf{F}_{i}^{s}$; depth for the reference keyframe is predicted in 3 cascaded stages of increasing resolution. Each stage warps features onto per-pixel depth hypotheses $\mathbf{D}_{hyp}^{s}$ to form feature volumes $\mathbf{V}_{i}^{s}$. Because sliding-window keyframes have very uneven baselines (heavy occlusion / non-overlap), the standard variance cost metric that weighs views equally is replaced by **self-adaptive view aggregation**:

$$\mathbf{C}^{s}=\frac{\sum_{i=1,i\neq j}^{n}(1+\mathbf{W}_{i}^{s})\,\odot\,(\mathbf{V}_{i}^{s}-\mathbf{V}_{j}^{s})^{2}}{n-1}$$

where $\mathbf{W}_{i}^{s}$ are per-voxel weights predicted by a shallow 3D CNN from $(\mathbf{V}_{i}^{s}-\mathbf{V}_{j}^{s})^{2}$, letting the network down-weight erroneous views. The cost volume is regularized by a 3D U-Net and softmaxed into a probability volume $\mathbf{P}^{s}$; depth is its expectation

$$D^{s}[h,w]=\sum_{d=1}^{D^{s}}\;\mathbf{P}^{s}[d,h,w]\cdot\mathbf{D}_{hyp}^{s}[d,h,w]$$

Later stages sample few hypotheses around the upsampled previous-stage depth ($D^{1}=48$ planes over the full range, then fewer), trained with an $L_1$ loss summed over all three stages.

**3. TSDF fusion.** Predicted depth maps are fused into a voxel-hashed truncated signed distance function grid, giving the consistent global model that both the visualized mesh and the dense tracking front-end draw from.

## Results

- **Tracking (EuRoC Vicon Room, ATE RMSE in m, Sim(3)-aligned, mean of 5 runs)**: TANDEM 0.09 / 0.17 / 0.09 / 0.12 on V101/V102/V201/V202, vs. DSO 0.10 / 0.27 / 0.09 / 0.21, ORB-SLAM2 0.31 / 0.11 / 1.40 / 0.84, DeepFactors 1.48 / lost / 1.06 / 1.89. The gain over a "DSO + dense depth" variant on V102/V202 isolates the benefit of tracking against the global TSDF model. Visual-inertial CodeVIO (0.06–0.10) remains better, using an IMU.
- **Dense depth (% pixels within 10% of GT)**: ICL-NUIM average 90.71 (Replica-trained model) vs. Cas-MVSNet 86.94, Atlas 66.93 (with GT poses), DeepFactors 30.17, CNN-SLAM 19.77; EuRoC average 94.40 vs. CodeVIO 78.74.
- **vs. iMAP on Replica**: comparable mesh accuracy/completion (e.g. room-1: Acc 4.26 vs 3.69 cm, Comp 4.71 vs 4.87 cm) — monocular TANDEM matching an RGB-D system.
- **Ablation**: view aggregation cuts depth error 2.64 → 1.92 cm; reducing depth planes to (48,4,4) keeps 2.33 cm while cutting inference to 158 ms and 2917 MiB. Full system runs ~20 FPS on an RTX 2080 Super (8 GB) + i7-9700K, trained only on synthetic Replica trajectories yet generalizing to EuRoC and ICL-NUIM.

## Why it matters for SLAM

TANDEM is a clean demonstration of the classical-plus-learned hybrid design pattern: keep the well-understood geometric estimator for poses, insert learning exactly where classical methods are weakest (dense depth in textureless areas), and let the dense map feed back into tracking. It showed monocular cameras can produce dense TSDF maps online without a depth sensor, standing as the pragmatic alternative to fully learned pipelines like DROID-SLAM and to neural-implicit systems like iMAP/NICE-SLAM.

## Related

- [DSO](../level-03-monocular-slam/dso.md) — the direct sparse odometry backbone
- [MonoRec](monorec.md) — related dense reconstruction from monocular video
- [DeepFactors](deepfactors.md) — code-based dense SLAM compared against
- [CodeMapping](codemapping.md) — sparse SLAM + learned dense depth via codes
- [DROID-SLAM](droid-slam.md) — the fully learned alternative
- [iMAP](imap.md) — the RGB-D neural-implicit system TANDEM matches monocularly
- [NICE-SLAM](nice-slam.md) — neural implicit dense SLAM alternative
