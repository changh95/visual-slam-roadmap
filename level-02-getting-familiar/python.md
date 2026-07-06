# Python

C++ runs the real-time core of most SLAM systems, but **Python** is the language of everything around that core. In a typical SLAM workflow you will use Python for three things:

- **Deep learning**: PyTorch (and friends) is Python-first. Learned features (SuperPoint), matchers (SuperGlue/LightGlue), monocular depth, and end-to-end systems like DROID-SLAM are all trained — and usually first prototyped — in Python.
- **Analysis and plotting**: NumPy for array math, Matplotlib for trajectory and error plots, and evaluation tooling for computing ATE/RPE against ground truth. When a SLAM run misbehaves, a quick notebook that plots the trajectory, feature counts, or residual histograms is often the fastest debugging tool you have.
- **System scripts and glue**: dataset downloading and conversion, batch experiment runners, calibration pipelines, CI jobs, and ROS 2 nodes (`rclpy`) for non-time-critical components.

Many core SLAM libraries expose Python bindings, so you can prototype full pipelines without touching C++:

| Library | Python entry point |
|---|---|
| OpenCV | `opencv-python` (`cv2`) |
| GTSAM | official Python wrapper |
| g2o | community bindings (e.g. g2opy) |
| Open3D | native Python API (point clouds, ICP, TSDF) |

A common and productive pattern is *prototype in Python, port to C++*: validate the algorithm with `cv2` + NumPy on a dataset, then reimplement the hot loop in C++/Eigen once the design is stable. For research code that must stay in Python, pybind11 lets you wrap the performance-critical C++ pieces and keep the experiment logic in Python — the best of both worlds.

Practical habits worth adopting early: use virtual environments (venv/conda/uv) per project, pin dependency versions for reproducibility, and remember that NumPy uses row-major conventions and OpenCV images are indexed `[row, col]` = `[y, x]` — a classic source of transposed-coordinate bugs.

## Why it matters for SLAM

Modern SLAM research lives at the intersection of geometry and learning, and the learning half speaks Python. Even for classical systems, the evaluation, visualisation, and dataset tooling ecosystem is Python-based; being fluent in it makes you dramatically faster at running experiments and understanding what your C++ system is actually doing.

## Related

- [C++](cpp.md)
- [C++/Python interop](cpp-python-interop.md)
- [OpenCV](opencv.md)
- [Bash/Linux](bash-linux.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
