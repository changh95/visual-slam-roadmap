# Bash/Linux

SLAM开发是在Linux上进行的。机器人运行Linux，数据集在Linux服务器上处理，几乎每一个SLAM代码库都假设使用Linux工具链。熟练使用命令行是不可或缺的。

## 核心技能

- **文件系统**：`ls`、`cd`、`cp`、`mv`、`find`、`grep`——用于浏览代码以及在日志和数据集中查找信息。
- **进程管理**：`top`/`htop`、`kill`——查看你的SLAM节点是否占满了某个CPU核心或存在内存泄漏。
- **构建工具**：`cmake`、`make`、`ninja`——每一个C++ SLAM项目都是这样构建的。
- **ROS工具**：`roslaunch`、`rostopic`、`rosbag`——全部都是从Bash中调用的。
- **SSH**：对机器人和服务器的远程访问。几乎所有机器人调试工作都是通过`ssh`完成的；要学会基于密钥的登录，以及用`scp`/`rsync`来搬运bag文件和地图。

几个组合模式几乎覆盖了日常的日志与数据处理工作：

```bash
grep -rn "tracking lost" logs/            # find every tracking failure
grep "ATE" results.txt | sort -k2 -n      # sort runs by error
find data/ -name "*.bag" | xargs -I{} du -h {}   # size of every bag
watch -n1 nvidia-smi                      # GPU load while a model runs
```

## 命令行文本编辑器与tmux

当你通过SSH登录到一台机器人上时，没有IDE可用，因此你需要能熟练使用一款终端编辑器——**Vim**（或作为备选的nano），足以编辑一个配置文件、修复一个启动脚本，然后顺利退出。Vim的基本生存技能：`i`进入插入模式，`Esc`后输入`:wq`保存并退出，`/`用于搜索。

**tmux**（或`screen`）是一款终端多路复用器：它能让会话在你断开连接后依然存活，并让你把一条SSH连接拆分成多个窗格。一个典型的机器人调试会话会在一个窗格中运行SLAM节点，在另一个窗格中运行`htop`，在第三个窗格中回显某个话题——即使Wi-Fi连接掉线也能存活下来。最简工作流：

```bash
tmux new -s slam      # create a named session
# Ctrl-b %  -> split vertically,  Ctrl-b o -> switch pane
# Ctrl-b d  -> detach
tmux attach -t slam   # reattach after reconnecting
```

## Shell脚本

小型Bash脚本把各种实验串联起来：在数据集的每一个序列上批量运行某个SLAM系统、转换格式，或启动评估流程。要学会变量、循环、管道和退出码——足以写出一个`run_all_sequences.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail                      # fail fast on errors and typos

for seq in data/sequences/*/; do
    name=$(basename "$seq")
    echo "=== $name ==="
    ./build/slam_app --config cfg.yaml --input "$seq" \
        > "results/${name}.log" 2>&1 || echo "FAILED: $name"
done
```

其中`set -euo pipefail`这一行以及显式处理退出码，正是"一个能让你彻夜信赖的脚本"与"在第二个序列崩溃后仍悄悄'成功'的脚本"之间的区别。

## 常见陷阱

- **忘记source环境**：除非你工作区的`setup.bash`在*每一个*shell（包括每一个新打开的tmux窗格）中都被source过，否则ROS工具会报出莫名其妙的错误。
- **在tmux之外运行长时间任务**：一旦SSH断开就会杀死进程；在机器人和服务器上永远使用可断开重连的会话。
- **设备权限**：摄像头和串口IMU会显示为`/dev/video*`和`/dev/tty*`；所谓"找不到传感器"往往只是你的用户没有加入`video`/`dialout`用户组，或缺少相应的udev规则。
- **引号与空格**：未加引号的变量（`$seq`而非`"$seq"`）一旦路径中出现空格就会出错——默认应始终加引号。

## 对SLAM的意义

一名SLAM工程师的日常循环——用CMake构建、通过SSH部署到机器人、在tmux中运行、录制rosbag、grep日志——完全由命令行驱动。熟练掌握这些并不会让你的算法变得更好，但缺乏这些技能会拖慢你进行的每一次实验。

## 相关条目

- [C++](cpp.md)
- [Python](python.md)
- [Git/GitHub](git-github.md)
- [Docker](docker.md)
- [ROS/ROS2](ros-ros2.md)
- [CI/CD](ci-cd.md)
