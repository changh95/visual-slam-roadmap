# Bash/Linux

SLAM 개발은 Linux 위에서 이루어진다. 로봇은 Linux를 구동하고, 데이터셋은 Linux 서버에서 처리되며, 거의 모든 SLAM 코드베이스는 Linux 툴체인을 가정한다. 커맨드라인에 대한 숙련도는 타협할 수 없는 요건이다.

## 핵심 스킬

- **파일 시스템**: `ls`, `cd`, `cp`, `mv`, `find`, `grep` — 코드를 탐색하고 로그와 데이터셋을 뒤지는 데 쓰인다.
- **프로세스 관리**: `top`/`htop`, `kill` — SLAM 노드가 CPU 코어를 붙잡고 있는지, 메모리를 누수하고 있는지 지켜보는 데 쓰인다.
- **빌드 도구**: `cmake`, `make`, `ninja` — 모든 C++ SLAM 프로젝트가 이 방식으로 빌드된다.
- **ROS 도구**: `roslaunch`, `rostopic`, `rosbag` — 모두 Bash에서 실행된다.
- **SSH**: 로봇과 서버에 대한 원격 접속. 거의 모든 로봇 디버깅은 `ssh`를 통해 이루어진다. 키 기반 로그인과, bag 파일과 맵을 옮기기 위한 `scp`/`rsync`를 익혀야 한다.

몇 가지 복합 패턴이 로그·데이터 관련 일상 작업의 대부분을 커버한다:

```bash
grep -rn "tracking lost" logs/            # find every tracking failure
grep "ATE" results.txt | sort -k2 -n      # sort runs by error
find data/ -name "*.bag" | xargs -I{} du -h {}   # size of every bag
watch -n1 nvidia-smi                      # GPU load while a model runs
```

## CLI 텍스트 에디터와 tmux

SSH로 로봇에 로그인해 있을 때는 IDE가 없으므로, 터미널 에디터 — **Vim**(또는 대안으로 nano) — 를 설정 파일을 편집하고 실행 스크립트를 고치고 빠져나올 수 있을 만큼은 다룰 줄 알아야 한다. Vim 생존 기초: 삽입은 `i`, 저장 후 종료는 `Esc`에 이어 `:wq`, 검색은 `/`.

**tmux**(또는 `screen`)는 터미널 멀티플렉서다: 연결이 끊긴 뒤에도 세션을 살아있게 유지하고, 하나의 SSH 연결을 여러 개의 창으로 나눌 수 있게 해준다. 일반적인 로봇 세션은 한 창에서 SLAM 노드를, 다른 창에서 `htop`을, 세 번째 창에서 토픽 echo를 실행하며 — Wi-Fi 연결이 끊겨도 살아남는다. 최소한의 워크플로우:

```bash
tmux new -s slam      # create a named session
# Ctrl-b %  -> split vertically,  Ctrl-b o -> switch pane
# Ctrl-b d  -> detach
tmux attach -t slam   # reattach after reconnecting
```

## 셸 스크립팅

작은 Bash 스크립트는 실험들을 하나로 엮어 준다: 데이터셋의 모든 시퀀스에 걸쳐 SLAM 시스템을 배치 실행하거나, 포맷을 변환하거나, 평가 파이프라인을 실행하는 식이다. 변수, 루프, 파이프, 종료 코드를 배워 두면 `run_all_sequences.sh` 정도는 작성할 수 있게 된다:

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

`set -euo pipefail` 줄과 명시적인 종료 코드 처리는, 신뢰할 수 있는 밤샘 스크립트와 두 번째 시퀀스에서 죽고도 조용히 "성공"하는 스크립트 사이의 차이를 만든다.

## 흔한 함정

- **환경 소싱을 잊는 것**: 워크스페이스의 `setup.bash`가 *각* 셸(새로 여는 tmux 창마다도 포함)에서 소스되지 않으면 ROS 도구는 알아보기 힘든 오류를 내며 실패한다.
- **tmux 바깥에서 긴 작업을 실행하는 것**: SSH 연결이 끊기면 프로세스가 죽는다. 로봇과 서버에서는 항상 분리 가능한(detach-able) 세션을 사용해야 한다.
- **디바이스 권한**: 카메라와 시리얼 IMU는 `/dev/video*`와 `/dev/tty*`로 나타난다. "센서를 찾을 수 없음"은 흔히 사용자가 `video`/`dialout` 그룹에 속해 있지 않거나 udev 규칙이 없는 것일 뿐이다.
- **인용과 공백**: 인용되지 않은 변수(`$seq` 대 `"$seq"`)는 경로에 공백이 들어가는 순간 깨진다 — 기본적으로 항상 인용해야 한다.

## SLAM에서의 의미

SLAM 엔지니어의 일상적인 루프 — CMake로 빌드하고, SSH로 로봇에 배포하고, tmux 안에서 실행하고, rosbag을 기록하고, 로그를 grep하는 것 — 은 전적으로 커맨드라인으로 이루어진다. 여기에 능숙하다고 해서 알고리즘이 더 좋아지는 것은 아니지만, 능숙하지 못하면 여러분이 진행하는 모든 실험이 느려질 것이다.

## 관련 문서

- [C++](cpp.md)
- [Python](python.md)
- [Git/GitHub](git-github.md)
- [Docker](docker.md)
- [ROS/ROS2](ros-ros2.md)
- [CI/CD](ci-cd.md)
