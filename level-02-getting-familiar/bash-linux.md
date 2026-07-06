# Bash/Linux

SLAM development happens on Linux. Robots run Linux, datasets are processed on Linux servers, and virtually every SLAM codebase assumes a Linux toolchain. Competence with the command line is non-negotiable.

## Core skills

- **File system**: `ls`, `cd`, `cp`, `mv`, `find`, `grep` — navigating code and hunting through logs and datasets.
- **Process management**: `top`/`htop`, `kill` — watching whether your SLAM node is pegging a CPU core or leaking memory.
- **Build tools**: `cmake`, `make`, `ninja` — every C++ SLAM project builds this way.
- **ROS tooling**: `roslaunch`, `rostopic`, `rosbag` — all invoked from Bash.
- **SSH**: remote access to robots and servers. Almost all robot debugging is done over `ssh`; learn key-based login and `scp`/`rsync` for moving bags and maps around.

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

Small Bash scripts glue experiments together: batch-running a SLAM system over every sequence in a dataset, converting formats, or launching evaluation pipelines. Learn variables, loops, pipes, and exit codes — enough to write a `run_all_sequences.sh`.

## Why it matters for SLAM

The daily loop of a SLAM engineer — build with CMake, deploy to a robot over SSH, run inside tmux, record a rosbag, grep the logs — is entirely command-line driven. Fluency here does not make your algorithms better, but the lack of it will slow every experiment you run.

## Related

- [C++](cpp.md)
- [Python](python.md)
- [Git/GitHub](git-github.md)
- [Docker](docker.md)
- [ROS/ROS2](ros-ros2.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
