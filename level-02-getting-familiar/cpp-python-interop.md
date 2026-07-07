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

Binding a whole system rather than free functions looks like this — note the GIL guard, which is what keeps a multi-threaded SLAM core running while Python waits:

```cpp
namespace py = pybind11;

py::class_<SlamSystem>(m, "SlamSystem")
    .def(py::init<const std::string&>())              // config file path
    .def("track", &SlamSystem::track,
         py::call_guard<py::gil_scoped_release>())    // release GIL during C++ work
    .def_property_readonly("map_points", &SlamSystem::mapPoints);
```

**nanobind** is the successor from the same author, redesigned for lower binding overhead, smaller binaries, and faster compile times. Its API is intentionally close to PyBind11, so knowledge transfers directly; new projects that care about call overhead (e.g., binding small functions called per-feature or per-frame) increasingly choose nanobind.

## What to understand when wrapping SLAM code

- **Ownership and lifetimes** — who frees a `Map` object shared between C++ threads and Python; return-value policies (`return_value_policy::reference_internal` vs. `copy`) decide whether Python holds a view or an owned duplicate.
- **The GIL** — long-running C++ calls should release Python's Global Interpreter Lock (as above) so background mapping threads keep running and Python callers can multithread around the core.
- **Zero-copy views** — exposing large buffers (images, point clouds) as NumPy views instead of copies keeps the bridge cheap; accept `Eigen::Ref<const Eigen::MatrixXd>` or `py::array_t` on the C++ side to avoid forcing conversions.
- **Layout and dtype mismatches** — Eigen defaults to column-major while NumPy defaults to row-major, and `float32` vs. `float64` mismatches silently trigger copies; profile the boundary if per-frame data is large.
- **Build and packaging** — `pybind11_add_module` in CMake plus a `pyproject.toml` (e.g., scikit-build-core) turns the whole thing into a `pip install`-able package, which is what makes a C++ SLAM system usable in CI and by collaborators.

## Common pitfalls

- Compiler/ABI mismatch between the extension module and the Python interpreter or other C++ dependencies produces import-time crashes; build everything in one consistent environment (another reason Docker is popular).
- Exceptions must be translated across the boundary — PyBind11 maps `std::exception` to Python exceptions, but custom error types need explicit registration.
- Debugging is two-sided: attach `gdb`/`lldb` to the Python process for the C++ side, and remember a segfault in a binding usually means a lifetime bug, not a Python bug.

## Why it matters for SLAM

The field is converging on hybrid systems: classical C++ back-ends combined with learned front-ends (feature detectors, depth networks, matchers) that live in Python/PyTorch. Being able to bind a C++ optimizer into Python — or call a learned matcher from C++ via exported models — is what makes those combinations practical. It also transforms your own C++ code: once wrapped, it becomes scriptable, unit-testable from pytest, and easy to evaluate against datasets with Python tooling.

## Hands-on

- [PyBind hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_08)

## Related

- [C++](cpp.md)
- [Python](python.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [Edge deployment](edge-deployment.md)
