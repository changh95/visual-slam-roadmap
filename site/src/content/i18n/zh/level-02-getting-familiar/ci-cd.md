# CI/CD

**持续集成（Continuous Integration，CI）**在每次推送或拉取请求时自动构建并测试你的代码；**持续交付/部署（Continuous Delivery/Deployment，CD）**将其扩展到自动打包和发布产物（Docker 镜像、二进制文件）。对于 SLAM 项目 —— 依赖繁重、面向多个目标平台的大型 C++ 代码库来说 —— CI 是保证构建可靠性的关键手段。

## GitHub Actions

GitHub Actions 是开源 SLAM 工作事实上的标准 CI 服务。工作流是位于 `.github/workflows/` 中的 YAML 文件，会在触发条件（`push`、`pull_request`、定时任务）下于全新的运行器虚拟机或容器中执行：

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

对于 SLAM 仓库有用的模式：

- **构建矩阵**：并行地在多个 Ubuntu 版本、编译器和 ROS 发行版上编译：

  ```yaml
  strategy:
    matrix:
      os: [ubuntu-22.04, ubuntu-24.04]
      build_type: [Release, Debug]
  ```

- **基于 Docker 的任务**（`container: my-org/slam-dev:latest`）：在与开发者相同的镜像内运行工作流，这样"在 CI 上能跑"就等同于"到处都能跑"。
- **缓存**（`actions/cache`）：按版本号缓存已编译的第三方依赖（Eigen、Ceres、OpenCV）—— 这是 C++ 项目 CI 轮次耗时 5 分钟与 45 分钟之间的差异所在。
- **产物与发布**：上传每次运行生成的构建二进制文件、wheel 包或评估报告；基于标签触发的工作流可以自动发布 Docker 镜像（这就是 CD 的部分）。
- **自托管运行器**：依赖 GPU 的任务（CUDA 内核、学习型前端）以及 ARM 交叉编译通常需要自托管运行器，因为标准运行器没有 GPU。

## SLAM 项目中应该自动化的内容

1. 在每次提交时进行**构建** —— 否则大量使用模板的 C++ 代码会悄无声息地出错。
2. 对数学工具函数（几何运算、雅可比矩阵）进行**单元测试** —— 成本低，能捕获最严重的bug。
3. **小规模回归测试**：处理一段短的数据集序列，并对照阈值检查 ATE/RPE，从而在合并之前就能发现精度回归。将该序列存放在仓库中（或获取一份固定版本），以确保任务可复现。
4. **代码风格检查/格式化**（clang-format、clang-tidy），以保持多贡献者代码库的一致性 —— 在 CI 中强制执行，从而终结风格争论。

## 常见陷阱

- **不稳定的精度门限**：SLAM 具有随机性（RANSAC、多线程）；将硬性 ATE 阈值设为观测均值会导致随机性失败。应尽可能固定随机种子，并为阈值留出余量，或在多次运行结果上取平均。
- **CI 环境漂移**：对未固定版本的依赖执行 `apt-get install`，意味着构建会在你不知情的情况下发生变化；应固定版本号，或在带版本号的 Docker 镜像内构建。
- **只测试 Release 版本**：Debug 构建（带断言和 sanitizer）能捕获 Release 版本掩盖的内存bug —— 至少应每晚运行一次两者的测试。
- **忽视运行时预算**：一个对精度没有影响、但使每帧延迟翻倍的改动同样是一种回归；应在回归测试任务中记录并设定耗时阈值。

## 对SLAM的意义

SLAM 系统耦合了许多脆弱的组件 —— 传感器驱动、第三方求解器、平台相关的 SIMD 指令 —— 一个在你笔记本上能构建通过的改动，在机器人的 Ubuntu 镜像上却经常会出问题。CI 能在几分钟内捕获这类问题，而基于数据集的回归测试任务能把"我的重构是否损害了精度？"从一项人工的下午苦活，变成一次自动化检查。工业级 SLAM 团队将 CI 流水线（构建、测试、评测、打包）视为产品的一部分。

## 相关条目

- [Git/GitHub](git-github.md)
- [Docker](docker.md)
- [Bash/Linux](bash-linux.md)
- [Metrics](metrics.md)
