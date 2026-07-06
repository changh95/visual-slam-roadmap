# CI/CD

**Continuous Integration (CI)** automatically builds and tests your code on every push or pull request; **Continuous Delivery/Deployment (CD)** extends this to packaging and releasing artifacts (Docker images, binaries) automatically. For SLAM projects — large C++ codebases with heavy dependencies and multiple target platforms — CI is what keeps the build honest.

## GitHub Actions

GitHub Actions is the de facto CI service for open-source SLAM work. Workflows are YAML files in `.github/workflows/` that run on triggers (`push`, `pull_request`, schedules) inside fresh runner VMs or containers:

```yaml
name: build
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: sudo apt-get update && sudo apt-get install -y libeigen3-dev libopencv-dev
      - name: Configure and build
        run: cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build -j
      - name: Run tests
        run: ctest --test-dir build --output-on-failure
```

Useful patterns for SLAM repositories:

- **Build matrix**: compile across Ubuntu versions, compilers, and ROS distros in parallel.
- **Docker-based jobs**: run the workflow inside the same image developers use, so "works on CI" means "works everywhere".
- **Caching**: cache compiled third-party dependencies (Eigen, Ceres, OpenCV) to keep C++ build times tolerable.
- **Artifacts and releases**: upload built binaries, wheels, or evaluation reports from each run.

## What to automate in a SLAM project

1. **Build** on every commit — C++ template-heavy code breaks silently otherwise.
2. **Unit tests** for math utilities (geometry, Jacobians) — cheap and catch the worst bugs.
3. **Small regression runs**: process a short dataset sequence and check ATE/RPE against a threshold, so accuracy regressions are caught before merge.
4. **Linting/formatting** (clang-format, clang-tidy) to keep a multi-contributor codebase consistent.

## Why it matters for SLAM

SLAM systems couple many fragile pieces — sensor drivers, third-party solvers, platform-specific SIMD — and a change that builds on your laptop routinely breaks on the robot's Ubuntu image. CI catches this within minutes, and dataset-based regression jobs turn "did my refactor hurt accuracy?" from a manual afternoon chore into an automatic check. Industrial SLAM teams treat the CI pipeline (build, test, benchmark, package) as part of the product.

## Related

- [Git/GitHub](git-github.md)
- [Docker](docker.md)
- [Bash/Linux](bash-linux.md)
- [Metrics](metrics.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
