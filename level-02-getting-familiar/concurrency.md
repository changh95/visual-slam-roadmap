# Concurrency

Real-time SLAM systems use parallelism aggressively: a frame budget of ~33 ms (30 Hz) must cover feature extraction, matching, optimization, and map maintenance. Concurrency in SLAM comes in several layers, from instruction-level SIMD to multi-threaded architecture to GPU offload.

## SIMD: SSE/AVX/Neon

**SIMD** (Single Instruction, Multiple Data) instructions process 4-16 values per instruction: SSE/AVX on x86, **Neon** on ARM (i.e., most robots, phones, and embedded boards). Feature-level image processing is the classic beneficiary — ORB descriptor computation and matching benefit substantially from Neon intrinsics on ARM. The canonical example is Hamming distance between binary descriptors, the inner loop of ORB matching:

```cpp
// Hamming distance of two 256-bit ORB descriptors: XOR + popcount
int hamming(const uint64_t* a, const uint64_t* b) {
    int d = 0;
    for (int i = 0; i < 4; ++i)
        d += __builtin_popcountll(a[i] ^ b[i]);  // 64 bits per instruction
    return d;
}
```

Libraries like Eigen and OpenCV use SIMD internally, but hot loops in a SLAM front-end are often hand-vectorized.

## OpenMP

**OpenMP** provides coarse-grained CPU parallelism with compiler pragmas:

```cpp
#pragma omp parallel for
for (int i = 0; i < num_cells; ++i) {
    extractFeatures(image_grid[i]);   // per-patch feature extraction
}
```

It is well suited to data-parallel work such as parallelizing feature extraction over image patches, per-point residual evaluation, or stereo matching rows — with one line and no explicit thread management. It only pays off when iterations are independent and each does enough work to amortize the thread fork/join.

## CUDA

**CUDA** targets NVIDIA GPUs for massively parallel workloads: dense depth estimation, neural network inference, and dense volumetric mapping (KinectFusion's TSDF integration was designed for the GPU). The trade-offs are host-device memory transfer costs and added deployment complexity — a stage that takes 2 ms on CPU may not be worth 0.5 ms on GPU if the round-trip copy costs 3 ms. Profile before moving a stage to the GPU, and keep data resident on the device across pipeline stages when you do.

## Multi-threaded SLAM architecture

Beyond data parallelism, SLAM systems are structured as concurrent pipelines: separate threads for tracking (time-critical, every frame) and mapping (background, per keyframe). ORB-SLAM3 uses three threads — Tracking, Local Mapping, and Loop Closing — sharing the map under mutexes. This separation, inherited from PTAM, is arguably the single most influential architectural idea in real-time SLAM.

The key skills are the C++ primitives and their disciplined use:

```cpp
std::mutex map_mutex;

// Tracking thread: brief, fine-grained locking
{
    std::lock_guard<std::mutex> lock(map_mutex);
    local_points = map.getLocalPoints(current_pose);  // copy out, then unlock
}
trackAgainst(local_points);  // heavy work happens outside the lock
```

- **Lock granularity**: hold mutexes only around shared-state access, never around computation; copy what the tracker needs and release.
- **Condition variables / queues**: a producer-consumer frame queue decouples the camera driver from tracking and absorbs jitter.
- **Data races**: an unguarded read of a map being modified by local BA corrupts state in ways that look like "random divergence" — thread sanitizer (`-fsanitize=thread`) is your friend.

## Common pitfalls

- **Coarse global locks**: one big map mutex serializes tracking and mapping, quietly destroying the benefit of the thread split.
- **Oversubscription**: OpenMP, TBB (inside OpenCV), and your own threads each spawning a pool on the same 4 cores causes thrashing; budget threads globally.
- **False sharing**: threads writing to adjacent array elements on the same cache line scale poorly; pad or partition by blocks.
- **Non-determinism in tests**: thread scheduling makes runs non-reproducible; design regression tests with tolerances, and provide a single-threaded mode for debugging.

## Why it matters for SLAM

The difference between a paper prototype and a deployable SLAM system is usually engineering throughput, not algorithmic novelty: the same math runs 10x faster with SIMD descriptors, OpenMP front-ends, and a properly decoupled thread architecture. On embedded platforms with tight power budgets, exploiting Neon and the GPU is often the only way to reach real-time at all.

## Related

- [C++](cpp.md)
- [Edge deployment](edge-deployment.md)
- [Mobile](mobile.md)
- [PTAM](../level-03-monocular-slam/ptam.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
