# C++

C++ is the working language of SLAM. Nearly every system you will study in later levels — ORB-SLAM, DSO, VINS-Mono, KinectFusion — is written in C++, because SLAM must process camera frames, IMU packets, and optimization problems in real time on constrained hardware. At this level, "knowing C++" means being productive in the specific idioms and toolchains that SLAM codebases use, not just the syntax.

**Modern C++ (C++11/14/17/20).** SLAM code lives and dies by modern idioms: range-based for loops, `auto`, lambda functions, `std::thread`, smart pointers, and move semantics. Move semantics matter in particular because SLAM passes around large objects (images, point clouds, descriptor matrices) and cannot afford accidental deep copies in a hot loop.

**OOP and design patterns.** SLAM systems are structured as interacting modules — tracker, local mapper, loop closer, map database — that share state across threads. Understanding inheritance vs. composition, interfaces for sensor abstraction, and common patterns (singleton for a map database, factory for sensor drivers, observer for pub/sub-style callbacks) makes large codebases like ORB-SLAM readable.

**Data structures and algorithms.** You will constantly reason about complexity: kd-trees and hash grids for nearest-neighbor search, priority queues for keyframe culling, graphs for covisibility and pose-graph structure. Choosing the right container (`std::vector` vs. `std::unordered_map`) has a visible effect on frame rate.

**Compilers and build systems.** Real projects are built with CMake driving Make or Ninja. Expect to read and write `CMakeLists.txt` that find Eigen/OpenCV, set optimization flags (`-O3`, `-march=native`), and manage third-party submodules. Knowing roughly what the compiler does (inlining, vectorization, debug vs. release builds) explains why a "slow" SLAM system is often just a debug build.

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

## Why it matters for SLAM

Every level above this one assumes you can read, build, and modify a mid-sized C++ codebase. Reproducing a paper usually means cloning a C++ repository, fixing its CMake build against your local Eigen/OpenCV versions, and profiling where the time goes. C++ fluency is also what lets you move from *using* SLAM systems to *changing* them — swapping a feature detector, adding a sensor, or optimizing a bottleneck with threading or SIMD.

## Related

- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [OpenCV](opencv.md)
- [C++/Python interop](cpp-python-interop.md)
- [Concurrency](concurrency.md)
- [Git/GitHub](git-github.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
