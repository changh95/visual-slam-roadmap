# Concurrency

Real-time SLAM systems use parallelism aggressively: a frame budget of ~33 ms (30 Hz) must cover feature extraction, matching, optimization, and map maintenance. Concurrency in SLAM comes in several layers, from instruction-level SIMD to multi-threaded architecture to GPU offload.

## SIMD: SSE/AVX/Neon

**SIMD** (Single Instruction, Multiple Data) instructions process 4-16 values per instruction: SSE/AVX on x86, **Neon** on ARM (i.e., most robots, phones, and embedded boards). Feature-level image processing is the classic beneficiary — ORB descriptor computation and matching (Hamming distance via XOR + popcount) benefit substantially from Neon intrinsics on ARM. Libraries like Eigen and OpenCV use SIMD internally, but hot loops in a SLAM front-end are often hand-vectorized.

## OpenMP

**OpenMP** provides coarse-grained CPU parallelism with compiler pragmas:

```cpp
#pragma omp parallel for
for (int i = 0; i < num_cells; ++i) {
    extractFeatures(image_grid[i]);   // per-patch feature extraction
}
```

It is well suited to data-parallel work such as parallelizing feature extraction over image patches, per-point residual evaluation, or stereo matching rows — with one line and no explicit thread management.

## CUDA

**CUDA** targets NVIDIA GPUs for massively parallel workloads: dense depth estimation, neural network inference, and dense volumetric mapping (KinectFusion's TSDF integration was designed for the GPU). The trade-offs are host-device memory transfer costs and added deployment complexity — profile before moving a stage to the GPU.

## Multi-threaded SLAM architecture

Beyond data parallelism, SLAM systems are structured as concurrent pipelines: separate threads for tracking (time-critical, every frame) and mapping (background, per keyframe). ORB-SLAM3 uses three threads — Tracking, Local Mapping, and Loop Closing — sharing the map under mutexes. This separation, inherited from PTAM, is arguably the single most influential architectural idea in real-time SLAM. Key skills: `std::thread`, mutexes and lock granularity, condition variables, and avoiding data races on shared map structures.

## Why it matters for SLAM

The difference between a paper prototype and a deployable SLAM system is usually engineering throughput, not algorithmic novelty: the same math runs 10x faster with SIMD descriptors, OpenMP front-ends, and a properly decoupled thread architecture. On embedded platforms with tight power budgets, exploiting Neon and the GPU is often the only way to reach real-time at all.

## Related

- [C++](cpp.md)
- [Edge deployment](edge-deployment.md)
- [Mobile](mobile.md)
- [PTAM](../level-03-monocular-slam/ptam.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
