# GPGPU Programming (CUDA / OpenGL GLSL)

**GPGPU (general-purpose GPU) programming** uses the graphics processor's thousands of parallel cores for non-graphics computation. Dense RGB-D SLAM was the field's killer app: every stage of a pipeline like KinectFusion — per-pixel depth filtering, per-voxel TSDF fusion, per-pixel raycasting — is an **embarrassingly parallel** map over pixels or voxels, exactly what GPUs are built for. Real-time dense SLAM at 30 Hz is simply not feasible on a CPU; it became possible the moment these loops were moved to the GPU.

## CUDA in a nutshell

CUDA (NVIDIA's GPGPU platform) exposes the GPU as a grid of lightweight threads all running the same **kernel** function:

- **Thread hierarchy**: threads are grouped into *blocks*, blocks into a *grid*. A per-pixel kernel is typically launched with one thread per pixel; each thread computes its own coordinates from its block/thread indices.
- **Memory hierarchy**: large but high-latency *global memory*, fast per-block *shared memory* for data reuse within a block, and per-thread registers. Performance hinges on **coalesced** global-memory access (adjacent threads reading adjacent addresses — natural for images) and minimizing host–device (CPU–GPU) transfers, which cross the PCIe bus.
- **Execution model**: threads execute in lock-step groups (*warps*); divergent branches within a warp serialize, so per-pixel code should avoid heavy branching.

Typical SLAM kernels: bilateral filtering of the depth map, computing vertex and normal maps from depth, TSDF integration (one thread per voxel in the camera frustum, projecting the voxel into the depth image and updating a weighted running average), and raycasting the TSDF for frame-to-model tracking.

**Parallel reduction** is the other key pattern: projective-data-association ICP computes a $6 \times 6$ Gauss–Newton system by summing per-pixel terms $J_i^T J_i$ and $J_i^T r_i$ over hundreds of thousands of pixels. Each thread computes its local product; a tree-structured reduction in shared memory sums them per block; a final pass (or atomics) combines block results. Only the tiny $6 \times 6$ system is copied back to the CPU and solved there.

## OpenGL GLSL as a compute vehicle

Before and alongside CUDA, GPGPU was done through the graphics pipeline using **GLSL shaders**, and several influential RGB-D systems (notably **ElasticFusion**) are written this way — with the bonus that it is vendor-neutral, unlike CUDA:

- Data lives in **textures** and vertex buffers; computation is expressed as rendering passes where a **fragment shader** runs once per output pixel, writing results to an offscreen **framebuffer object** ("render-to-texture"), often ping-ponging between two buffers across passes.
- Surfel maps fit the pipeline naturally: each surfel (position, normal, radius, color, weight) is a vertex; **splatting** the map into an index/model image is just rendering; surfel fusion and culling run as shader passes over these buffers.
- Modern OpenGL also offers **compute shaders**, closing much of the gap to CUDA without leaving the GL ecosystem, and **CUDA–OpenGL interop** lets CUDA kernels write into GL buffers for zero-copy visualization.

## Practical guidance

- Keep the whole pipeline resident on the GPU; download only poses and small matrices per frame. Host–device copies of full images or volumes each frame will erase the speedup.
- Profile memory traffic first — most image/voxel kernels are bandwidth-bound, not compute-bound. Use shared memory for stencil-style kernels (bilateral filter, normal computation) that reuse neighboring pixels.
- Use image pyramids on the GPU: coarse-to-fine ICP/tracking runs the same kernels at multiple resolutions for a large convergence basin at low cost.
- Watch numerical precision: consumer GPUs are far faster in `float` than `double`; dense SLAM pipelines run almost entirely in single precision and reserve double precision for the CPU-side solvers where it matters.
- Beyond classic dense SLAM, the same skills power depth-from-stereo networks, neural-field mapping, and any learned front-end: CUDA is the substrate of all of it.

## Why it matters for SLAM

- **KinectFusion** (CUDA) and **ElasticFusion** (GLSL) demonstrate the two GPGPU routes; understanding both lets you read and modify essentially every dense RGB-D SLAM codebase.
- The GPU/CPU split is an architectural decision: dense tracking and mapping on the GPU, sparse optimization (pose graph, BA) on the CPU is the standard division of labor.
- Voxel hashing, TSDF integration, and raycasting are only real-time because of GPU parallelism — algorithm design and GPGPU implementation are inseparable in this domain.

## Related

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [ICP](icp.md)
- [Concurrency](../level-02-getting-familiar/concurrency.md)
