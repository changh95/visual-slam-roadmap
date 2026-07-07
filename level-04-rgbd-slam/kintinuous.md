# Kintinuous

> Whelan 2012 · [Paper](https://ieeexplore.ieee.org/document/6907054)

**One-line summary** — Extended KinectFusion to unbounded environments with a continuously shifting (cyclical-buffer) TSDF volume that streams departing surface slices into an incrementally built triangular mesh, plus early loop-closure machinery (DBoW+SURF, iSAM) that matured into deformation-based map correction.

## Problem

KinectFusion's fixed-size TSDF volume cannot represent environments larger than a desk or small room — once the camera moves beyond the volume boundary, tracking fails. Its ICP odometry also fails in areas with poor 3D geometry (e.g. straight corridors). Large-scale indoor and outdoor mapping requires extending the reconstruction indefinitely in real time while keeping a path open to correcting accumulated drift.

## Method & architecture

**Rolling (cyclical) TSDF volume.** The TSDF (size $v_s$ voxels, dimension $d$ meters, voxel size $v_m = d/v_s$) no longer stays anchored at the starting position. The system continuously checks camera distance from the volume origin; when it exceeds a movement threshold $b$, the volume is virtually translated to re-center the camera. The shift is quantized to whole voxels: with camera translation $\mathbf{t}_{i+1}$,

$$\mathbf{u} = \left\lfloor \frac{\mathbf{t}_{i+1}}{v_m} \right\rfloor, \qquad \mathbf{t}'_{i+1} = \mathbf{t}_{i+1} - v_m \mathbf{u}, \qquad \mathbf{g}_{i+1} = \mathbf{g}_i + \mathbf{u}$$

where $\mathbf{t}'_{i+1}$ is the new in-volume camera position and $\mathbf{g}_i$ tracks the volume's global position in voxel units. No voxels are moved in memory: the 3D array is treated as **cyclical**, with lookups remapped as $x' = (x + g_i^x) \bmod v_s$ (same for $y, z$), so re-centering only updates base index offsets.

**Slice extraction and meshing.** The slice of voxels that leaves the volume is ray-cast orthogonally along each axis to extract zero-crossing vertices, deduplicated with a voxel-grid filter (leaf size $v_m$), zeroed for reuse, and streamed to the CPU. Each boundary crossing adds a pose-graph element $Q_n = (\mathbf{g}_i, \mathbf{t}'_i, R_i, M_i)$ storing the pose and its associated surface slice $M_i$; slices (extracted with 2-voxel overlap) feed a greedy triangulation algorithm producing a seamless mesh bounded only by system memory.

**Multi-threaded architecture.** A hierarchical design keeps the GPU front-end unblocked: the TSDF tracking/integration thread signals a CloudSliceProcessor thread (transforms + downsampling), which signals a pool of ComponentThreads (mesh generation, place recognition, ...), so map post-processing never stalls 30 Hz tracking.

**Odometry alternatives and loop closure.** To survive geometrically degenerate scenes, the ICP odometry can be replaced by the feature-based FOVIS visual odometry — trading some local mesh smoothness for robustness in corridors. For loop closure the paper integrates DBoW place recognition with SURF descriptors as a ComponentThread, propagating detected pose constraints back to the TSDF virtual frame via the stored $\mathbf{t}'$ vectors, and experiments with iSAM pose-graph optimization — observing that a **mesh deformation** is required alongside pose updates. The mature Kintinuous line implements exactly that with an embedded deformation graph, moving each mesh vertex with its nearby graph nodes: $\tilde{\mathbf{v}}_i = R_k(\mathbf{v}_i - \mathbf{g}_k) + \mathbf{g}_k + \mathbf{t}_k$, so the dense map bends into consistency instead of being rebuilt.

## Results

On a desktop with an Intel i7-2600 (3.4 GHz), 8 GB RAM, and a GTX 560 Ti (2 GB), with $v_s = 512$ and 15 FPS handheld/vehicle Kinect captures, four datasets were mapped in real time: a research lab (LAB, 31.07 m pose-to-pose odometry, 6 m volume), two floors of an apartment (APT, 42.31 m), a suburban estate filmed from a car at night (CAR, 136.18 m, 20 m volume, 81.6 x 22.8 x 81.5 m bounding cuboid), and a straight corridor (CORR, 56.08 m, using FOVIS). Final meshes reach 1.5-3.1 million triangles (63-118 MB). TSDF update times of 33.8-41.3 ms show the front-end can sustain the Kinect's full 30 FPS, unaffected by map growth; the CloudSliceProcessor adds only 2.6-4.7 ms per slice, and mesh generation keeps pace on average. FOVIS odometry costs 14.71 +/- 4.39 ms versus 10.54 +/- 0.21 ms for CUDA ICP — slower but still real-time, with reduced drift in the corridor at the cost of local mesh smoothness (frame-to-frame vs frame-to-model).

## Why it matters for SLAM

Kintinuous was the first system to take dense volumetric fusion out of a single fixed volume and into corridors, apartments, and streets, showing that dense RGB-D SLAM could be a genuine large-scale mapping tool rather than a desktop scanning demo. Its cyclical-buffer rolling volume was adopted and refined by later systems (InfiniTAM's voxel hashing solves the same scalability problem differently), and its loop-closure investigations — pose graph plus mesh deformation — became the core mechanism of ElasticFusion, its direct successor by the same lead author.

## Related

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [InfiniTAM v3](infinitam-v3.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
