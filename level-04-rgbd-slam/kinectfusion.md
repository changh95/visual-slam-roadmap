# KinectFusion

> Newcombe 2011 · [Paper](https://ieeexplore.ieee.org/document/6162880)

**One-line summary** — The first real-time RGB-D dense SLAM system, using GPU-accelerated volumetric TSDF fusion and coarse-to-fine point-to-plane ICP tracking to reconstruct room-sized scenes at 30 Hz.

## Problem

Before KinectFusion, dense 3D reconstruction required expensive offline processing or slow sequential algorithms. The consumer Kinect suddenly provided cheap 640x480 depth streams at 30 Hz, but no system could fuse that data into a coherent surface model in real time. KinectFusion bridged the gap with an entirely GPU-resident pipeline — no offline steps, no feature extraction — turning a game peripheral into a live 3D scanner.

## Method & architecture

The whole loop runs on the GPU each frame: `depth capture → bilateral filter → vertex/normal map pyramid → ICP (3 levels) → TSDF integration → ray-cast surface prediction`, and the ray-cast prediction becomes the tracking reference for the next frame.

**Surface measurement.** Raw depth is bilateral-filtered, back-projected to a vertex map $\mathbf{V}_k$ with normals $\mathbf{N}_k$ from finite differences, then block-averaged and sub-sampled into a 3-level pyramid.

**Sensor pose estimation (frame-to-model, point-to-plane ICP).** The pose $\mathbf{T}_{g,k} \in \mathrm{SE}(3)$ is found by minimizing the global point-plane energy between the live measurement and the ray-cast model prediction $(\hat{\mathbf{V}}_{k-1}, \hat{\mathbf{N}}_{k-1})$:

$$E(\mathbf{T}_{g,k}) = \sum_{\mathbf{u},\,\Omega_k(\mathbf{u}) \neq \text{null}} \Big\| \big(\mathbf{T}_{g,k}\dot{\mathbf{V}}_k(\mathbf{u}) - \hat{\mathbf{V}}^{g}_{k-1}(\hat{\mathbf{u}})\big)^{\!\top} \hat{\mathbf{N}}^{g}_{k-1}(\hat{\mathbf{u}}) \Big\|_2$$

Correspondences $\hat{\mathbf{u}}$ come from **projective data association** (project the live vertex into the predicted map — no nearest-neighbor search), gated by distance and normal-compatibility thresholds $\varepsilon_d, \varepsilon_\theta$. Assuming small inter-frame motion, the incremental transform is linearized with parameters $\mathbf{x} = (\beta, \gamma, \alpha, t_x, t_y, t_z)^\top \in \mathbb{R}^6$, giving a $6{\times}6$ symmetric normal system $\sum \mathbf{A}^\top \mathbf{A}\,\mathbf{x} = \sum \mathbf{A}^\top b$ built by parallel tree reduction on the GPU and solved by Cholesky on the CPU. Iterations run coarse-to-fine with at most $[4, 5, 10]$ iterations on pyramid levels $[3, 2, 1]$. Null-space and magnitude checks on $\mathbf{x}$ detect degenerate geometry or broken linearization and trigger relocalization mode.

**Mapping via TSDF integration.** A fixed voxel grid stores a truncated signed distance $F(\mathbf{p})$ and weight $W(\mathbf{p})$ per voxel; each frame's projective signed distance, truncated to a band $\mu$,

$$f_k(\mathbf{p}) = \Psi\left(\frac{d_k(\pi(\mathbf{K}\mathbf{T}_{g,k}^{-1}\mathbf{p})) - \lambda^{-1}\|\mathbf{p} - \mathbf{t}_{g,k}\|}{\mu}\right), \qquad \Psi(\eta) = \min\big(1, \max(-1, \eta)\big)$$

is fused by the weighted running average

$$F_{k}(\mathbf{p}) = \frac{W_{k-1}(\mathbf{p})\,F_{k-1}(\mathbf{p}) + w_k(\mathbf{p})\,f_k(\mathbf{p})}{W_{k-1}(\mathbf{p}) + w_k(\mathbf{p})}$$

so sensor noise averages out; truncating $W$ at a maximum instead yields a moving average that absorbs small scene changes.

**Surface prediction by ray-casting.** Rays march through the TSDF to the zero crossing (skipping in steps $< \mu$ while values stay positive-truncated), and the crossing is refined by linear interpolation of trilinearly sampled values — producing the predicted vertex/normal map used both for display and as the next ICP reference. Frame-to-model tracking against the fused volume, instead of frame-to-frame, is the paper's defining design choice.

## Results

All evaluation is on live Kinect data (640x480 depth at 30 Hz). In the turntable experiment (560 frames over ~19 s, 256^3 voxels in a 3 m^3 volume), frame-to-frame ICP accumulates visible drift and a non-circular trajectory, while frame-to-model tracking closes the loop with the first and last frames almost overlapping and no explicit global optimization; feeding the same loop M=4 times further tightens alignment and reduces artefacts. Keyframe-style tracking (every 8th frame) reduces drift but only frame-to-model is drift-free. The system degrades gracefully at 1/64 the memory (64^3 voxels, every 6th frame). Timing is constant per voxel resolution from 64^3 to 512^3; TSDF integration sustains over 65 gigavoxels/s (~2 ms per full 512^3 volume update), and 16 bits per voxel component suffice (as few as 6 bits for the SDF value). The reported failure mode: a large plane filling the view leaves 3 of 6 DOF unconstrained in the ICP null space. The paper won Best Paper at ISMAR 2011.

## Why it matters for SLAM

KinectFusion established the standard pipeline — depth preprocessing, projective-data-association ICP, TSDF fusion, ray-cast prediction — that virtually every subsequent RGB-D dense SLAM system builds on. It demonstrated that cheap consumer depth sensors plus GPU parallelism could deliver dense reconstruction that had previously required offline processing, sparking the entire wave of fusion systems (Kintinuous, ElasticFusion, BundleFusion, InfiniTAM) covered in this level. Its stated limitations — fixed volume, static-scene assumption — defined the research agenda those successors pursued.

## Related

- [ICP](icp.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [Kintinuous](kintinuous.md)
- [ElasticFusion](elasticfusion.md)
- [DynamicFusion](dynamicfusion.md)
