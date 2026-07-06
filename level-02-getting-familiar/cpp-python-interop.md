# C++/Python interop

Modern SLAM research lives in two worlds: performance-critical estimation code is written in C++, while experimentation, deep learning, and evaluation happen in Python. C++/Python interop is the bridge — you wrap a C++ core in Python bindings so that the same tracker or optimizer can be driven from a notebook, combined with PyTorch models, or benchmarked with Python tooling, without rewriting anything.

**PyBind11** is the de-facto standard for writing these bindings. It is a header-only C++ library that exposes C++ classes and functions as Python modules with very little boilerplate:

```cpp
#include <pybind11/pybind11.h>
#include <pybind11/eigen.h>   // automatic Eigen <-> NumPy conversion

Eigen::Matrix4d track(const Eigen::Matrix4d& T_prev, const cv::Mat& img);

PYBIND11_MODULE(myslam, m) {
    m.def("track", &track, "Track one frame and return the new pose");
}
```

The `pybind11/eigen.h` header converts between `Eigen` matrices and NumPy arrays automatically, which is exactly what SLAM code needs: poses, point clouds, and Jacobians cross the language boundary as arrays with no manual copying code. Many libraries you will use are wrapped this way — GTSAM ships an official Python wrapper, and projects like COLMAP's `pycolmap` follow the same pattern.

**nanobind** is the successor from the same author, redesigned for lower binding overhead, smaller binaries, and faster compile times. Its API is intentionally close to PyBind11, so knowledge transfers directly; new projects that care about call overhead (e.g., binding small functions called per-feature or per-frame) increasingly choose nanobind.

Practical things to understand when wrapping SLAM code:

- **Ownership and lifetimes** — who frees a `Map` object shared between C++ threads and Python; return-value policies matter.
- **The GIL** — long-running C++ calls should release Python's Global Interpreter Lock so background mapping threads keep running.
- **Zero-copy views** — exposing large buffers (images, point clouds) as NumPy views instead of copies keeps the bridge cheap.

## Why it matters for SLAM

The field is converging on hybrid systems: classical C++ back-ends combined with learned front-ends (feature detectors, depth networks, matchers) that live in Python/PyTorch. Being able to bind a C++ optimizer into Python — or call a learned matcher from C++ via exported models — is what makes those combinations practical. It also transforms your own C++ code: once wrapped, it becomes scriptable, unit-testable from pytest, and easy to evaluate against datasets with Python tooling.

## Related

- [C++](cpp.md)
- [Python](python.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [Edge deployment](edge-deployment.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
