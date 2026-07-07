# C++

C++ is the working language of SLAM. Nearly every system you will study in later levels — ORB-SLAM, DSO, VINS-Mono, KinectFusion — is written in C++, because SLAM must process camera frames, IMU packets, and optimization problems in real time on constrained hardware. At this level, "knowing C++" means being productive in the specific idioms and toolchains that SLAM codebases use, not just the syntax.

**Modern C++ (C++11/14/17/20).** SLAM code lives and dies by modern idioms: range-based for loops, `auto`, lambda functions, `std::thread`, smart pointers, and move semantics. Move semantics matter in particular because SLAM passes around large objects (images, point clouds, descriptor matrices) and cannot afford accidental deep copies in a hot loop.

**OOP and design patterns.** SLAM systems are structured as interacting modules — tracker, local mapper, loop closer, map database — that share state across threads. Understanding inheritance vs. composition, interfaces for sensor abstraction, and common patterns (singleton for a map database, factory for sensor drivers, observer for pub/sub-style callbacks) makes large codebases like ORB-SLAM readable.

**Data structures and algorithms.** You will constantly reason about complexity: kd-trees and hash grids for nearest-neighbor search, priority queues for keyframe culling, graphs for covisibility and pose-graph structure. Choosing the right container (`std::vector` vs. `std::unordered_map`) has a visible effect on frame rate.

**Compilers and build systems.** Real projects are built with CMake driving Make or Ninja. Expect to read and write `CMakeLists.txt` that find Eigen/OpenCV, set optimization flags (`-O3`, `-march=native`), and manage third-party submodules. A minimal SLAM-flavored `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.16)
project(my_vo)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_BUILD_TYPE Release)          # forget this and everything is "slow"

find_package(OpenCV REQUIRED)
find_package(Eigen3 REQUIRED)

add_executable(vo main.cpp)
target_link_libraries(vo ${OpenCV_LIBS} Eigen3::Eigen)
```

Knowing roughly what the compiler does (inlining, vectorization, debug vs. release builds) explains why a "slow" SLAM system is often just a debug build.

**OpenCV in C++.** OpenCV is the default image-processing layer: reading and undistorting images, feature detection (`cv::ORB`, `cv::SIFT`), matching (`cv::BFMatcher`, `cv::FlannBasedMatcher`), pose estimation (`cv::solvePnP`), and calibration (`cv::calibrateCamera`). A minimal feature pipeline looks like:

```cpp
cv::Ptr<cv::ORB> orb = cv::ORB::create(2000);
std::vector<cv::KeyPoint> kps;
cv::Mat desc;
orb->detectAndCompute(img, cv::noArray(), kps, desc);

cv::BFMatcher matcher(cv::NORM_HAMMING);
std::vector<cv::DMatch> matches;
matcher.match(desc_prev, desc, matches);
```

## Concurrency in a real SLAM system

Real-time SLAM systems use parallelism aggressively, at several granularities:

- **Threading** — separate threads for time-critical tracking and background mapping. ORB-SLAM3 uses three threads: Tracking, Local Mapping, and Loop Closing. The map is the shared state, so mutexes and careful ownership discipline are part of the architecture, not an afterthought.
- **SIMD (SSE/AVX on x86, Neon on ARM)** — process 4–16 floats per instruction; descriptor computation and matching (e.g., ORB with Neon intrinsics on ARM) are classic beneficiaries.
- **OpenMP** — coarse-grained CPU parallelism via `#pragma omp parallel for`, good for parallelizing feature extraction over image regions or pyramid levels.
- **CUDA** — GPU programming for dense depth estimation, neural-network inference, and dense mapping (KinectFusion-style TSDF integration).

## Common pitfalls

- **Debug builds.** An unoptimized build of Eigen-heavy code is dramatically slower than `-O3`; always check `CMAKE_BUILD_TYPE` before concluding a system is not real-time capable.
- **Eigen alignment and version mixing.** Fixed-size vectorizable Eigen members in heap-allocated classes require aligned allocation (`EIGEN_MAKE_ALIGNED_OPERATOR_NEW`), and linking libraries built against different Eigen versions causes subtle crashes — a major reason SLAM projects ship Dockerfiles.
- **`cv::Mat` shallow-copy semantics.** Assignment and copy-construction share the underlying buffer; use `.clone()` when you need an independent copy, and know which you want in a multi-threaded pipeline.
- **`auto` with Eigen expressions.** Eigen builds lazy expression templates; capturing them with `auto` can create dangling references to temporaries. Assign to a concrete matrix type when in doubt.
- **Data races on the map.** Tracker reading while the mapper inserts/culls landmarks is the canonical SLAM race condition; study how ORB-SLAM guards map access before writing your own.

## Why it matters for SLAM

Every level above this one assumes you can read, build, and modify a mid-sized C++ codebase. Reproducing a paper usually means cloning a C++ repository, fixing its CMake build against your local Eigen/OpenCV versions, and profiling where the time goes. C++ fluency is also what lets you move from *using* SLAM systems to *changing* them — swapping a feature detector, adding a sensor, or optimizing a bottleneck with threading or SIMD.

## Related

- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [OpenCV](opencv.md)
- [C++/Python interop](cpp-python-interop.md)
- [Concurrency](concurrency.md)
- [Git/GitHub](git-github.md)
