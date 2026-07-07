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

## A taste of SLAM tooling in Python

The single most useful script to have in your toolbox is trajectory evaluation. Aligning an estimate to ground truth with the closed-form least-squares rigid alignment (Umeyama's method, via SVD) and computing ATE RMSE is a dozen lines of NumPy:

```python
import numpy as np

def align_and_ate(P_est, P_gt):          # both Nx3
    mu_e, mu_g = P_est.mean(0), P_gt.mean(0)
    U, S, Vt = np.linalg.svd((P_gt - mu_g).T @ (P_est - mu_e))
    D = np.diag([1, 1, np.sign(np.linalg.det(U @ Vt))])
    R = U @ D @ Vt                        # rotation aligning est -> gt
    t = mu_g - R @ mu_e
    err = P_gt - (P_est @ R.T + t)        # residuals after alignment
    return np.sqrt((err ** 2).sum(1).mean())   # ATE RMSE
```

This is essentially what the widely used `evo` package (`pip install evo`) does — in practice, use `evo` for TUM/KITTI/EuRoC formats, plots, and RPE, but knowing the math above keeps its output from being a black box.

## Making Python fast enough

Python's slowness is almost entirely a *loops* problem. The rules of thumb:

- **Vectorise with NumPy** — transforming 100k points is one matrix multiply (`(R @ pts.T).T + t`), not a `for` loop; the difference is routinely 100x.
- **Know where the GIL bites** — Python threads do not parallelise CPU-bound pure-Python code; NumPy/OpenCV calls release the GIL, and `multiprocessing` sidesteps it for batch experiments.
- **Profile before optimising** — `cProfile` and line-profilers usually reveal one hot loop; move exactly that into NumPy, Numba, or a small pybind11 extension rather than porting everything.
- **Mind dtypes** — accidental `float64` doubles memory traffic versus `float32`; image arrays arriving as `uint8` overflow silently under arithmetic (`img1 - img2` wraps around).

## Common pitfalls

- **Coordinate/layout confusion** — `img[y, x]`, `pts` as `(x, y)`: OpenCV mixes both conventions across its API (see the OpenCV note).
- **Aliasing vs copying** — NumPy slicing returns *views*; mutating a slice mutates the original array. Use `.copy()` when you mean a copy.
- **Environment rot** — `opencv-python` vs `opencv-contrib-python` conflicts, CUDA/PyTorch version mismatches; one pinned environment file per project prevents week-long debugging sessions.
- **Quaternion conventions** — different libraries disagree on `(w, x, y, z)` vs `(x, y, z, w)` ordering (e.g. SciPy uses `xyzw`); wrong order produces rotations that are subtly wrong rather than obviously broken.

## Why it matters for SLAM

Modern SLAM research lives at the intersection of geometry and learning, and the learning half speaks Python. Even for classical systems, the evaluation, visualisation, and dataset tooling ecosystem is Python-based; being fluent in it makes you dramatically faster at running experiments and understanding what your C++ system is actually doing.

## Hands-on

- [Basic Python programming](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_07)

## Related

- [C++](cpp.md)
- [C++/Python interop](cpp-python-interop.md)
- [OpenCV](opencv.md)
- [Bash/Linux](bash-linux.md)
