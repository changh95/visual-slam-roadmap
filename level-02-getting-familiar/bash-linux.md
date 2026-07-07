# Bash/Linux

SLAM development happens on Linux. Robots run Linux, datasets are processed on Linux servers, and virtually every SLAM codebase assumes a Linux toolchain. Competence with the command line is non-negotiable.

## Core skills

- **File system**: `ls`, `cd`, `cp`, `mv`, `find`, `grep` — navigating code and hunting through logs and datasets.
- **Process management**: `top`/`htop`, `kill` — watching whether your SLAM node is pegging a CPU core or leaking memory.
- **Build tools**: `cmake`, `make`, `ninja` — every C++ SLAM project builds this way.
- **ROS tooling**: `roslaunch`, `rostopic`, `rosbag` — all invoked from Bash.
- **SSH**: remote access to robots and servers. Almost all robot debugging is done over `ssh`; learn key-based login and `scp`/`rsync` for moving bags and maps around.

A few compound patterns cover most daily log-and-data work:

```bash
grep -rn "tracking lost" logs/            # find every tracking failure
grep "ATE" results.txt | sort -k2 -n      # sort runs by error
find data/ -name "*.bag" | xargs -I{} du -h {}   # size of every bag
watch -n1 nvidia-smi                      # GPU load while a model runs
```

## CLI text editors and tmux

When you are logged into a robot over SSH there is no IDE, so you need a terminal editor — **Vim** (or nano as a fallback) — well enough to edit a config file, fix a launch script, and get out. Basic Vim survival: `i` to insert, `Esc` then `:wq` to save and quit, `/` to search.

**tmux** (or `screen`) is a terminal multiplexer: it keeps sessions alive after you disconnect and lets you split one SSH connection into several panes. A typical robot session runs the SLAM node in one pane, `htop` in another, and a topic echo in a third — and survives a dropped Wi-Fi link. Minimal workflow:

```bash
tmux new -s slam      # create a named session
# Ctrl-b %  -> split vertically,  Ctrl-b o -> switch pane
# Ctrl-b d  -> detach
tmux attach -t slam   # reattach after reconnecting
```

## Shell scripting

Small Bash scripts glue experiments together: batch-running a SLAM system over every sequence in a dataset, converting formats, or launching evaluation pipelines. Learn variables, loops, pipes, and exit codes — enough to write a `run_all_sequences.sh`:

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

The `set -euo pipefail` line and the explicit exit-code handling are the difference between a script you can trust overnight and one that silently "succeeds" after the second sequence crashes.

## Common pitfalls

- **Forgetting to source the environment**: ROS tools fail with cryptic errors unless `setup.bash` for your workspace is sourced in *each* shell (including every new tmux pane).
- **Running long jobs outside tmux**: an SSH drop kills the process; always detach-able sessions on robots and servers.
- **Device permissions**: cameras and serial IMUs appear as `/dev/video*` and `/dev/tty*`; "sensor not found" is often just your user missing the `video`/`dialout` group or a udev rule.
- **Quoting and spaces**: unquoted variables (`$seq` vs `"$seq"`) break the moment a path contains a space — quote by default.

## Why it matters for SLAM

The daily loop of a SLAM engineer — build with CMake, deploy to a robot over SSH, run inside tmux, record a rosbag, grep the logs — is entirely command-line driven. Fluency here does not make your algorithms better, but the lack of it will slow every experiment you run.

## Related

- [C++](cpp.md)
- [Python](python.md)
- [Git/GitHub](git-github.md)
- [Docker](docker.md)
- [ROS/ROS2](ros-ros2.md)
- [CI/CD](ci-cd.md)
