# Docker

Docker는 애플리케이션을 전체 사용자 공간 환경 — OS 라이브러리, 컴파일러, Python 버전, CUDA 툴킷 — 과 함께 어떤 Linux 호스트에서도 동일하게 실행되는 **컨테이너 이미지**로 패키징한다. SLAM 작업에서 이는 이 분야에서 가장 흔한 실용적 고충 — 특정한 Ubuntu, OpenCV, Eigen, Ceres, ROS 버전 조합에서만 빌드되는 연구 코드 — 를 해결해 준다.

전형적인 SLAM Dockerfile은 정확히 그 조합을 고정한다.

```dockerfile
FROM ros:humble
RUN apt-get update && apt-get install -y \
    libeigen3-dev libopencv-dev libceres-dev \
 && rm -rf /var/lib/apt/lists/*
COPY . /ws/src/my_slam
RUN cd /ws && . /opt/ros/humble/setup.sh && colcon build
```

그리고 전형적인 개발용 `run` 호출은 앞으로 필요할 대부분의 플래그를 조합한다.

```bash
docker build -t my_slam .
docker run -it --rm \
  --gpus all \                              # NVIDIA Container Toolkit: 컨테이너 안에서 GPU 사용
  -v ~/data:/data \                         # 데이터셋은 호스트에 존재
  -v $(pwd):/ws/src/my_slam \               # 호스트에서 소스를 실시간 편집
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \        # 시각화 도구를 위한 X11 포워딩
  --network host \                          # 호스트/컨테이너 간 ROS 디스커버리
  my_slam bash
```

익숙해져야 할 핵심 개념들:

- **이미지 대 컨테이너** — 이미지는 고정된 레시피/결과물이고, 컨테이너는 실행 중인 인스턴스다. `docker build`, `docker run`, `docker exec`가 일상적인 사용의 대부분을 다룬다.
- **볼륨** — 데이터셋과 소스 코드를 호스트에서 마운트하여, 컨테이너는 소모품처럼 다루면서도 데이터는 유지되도록 한다.
- **GPU 접근** — NVIDIA Container Toolkit(`--gpus all`)은 호스트 GPU를 컨테이너 안에 노출하며, 이는 학습된 프론트엔드와 CUDA 가속 맵핑을 컨테이너에서 실행하는 방식이다.
- **GUI/X11 포워딩** — SLAM 시각화 도구(Pangolin, RViz)는 디스플레이 포워딩이 필요하다(위의 `DISPLAY`/X11 소켓 쌍, 종종 호스트에서 `xhost +local:`도 추가로 필요). 한 번 배워둘 만한 잘 알려진 Docker 마찰점이다.
- **레이어 캐싱** — Dockerfile 단계를 변경 빈도가 낮은 것에서 높은 것 순으로 배치하면, 코드 수정 후 재빌드가 OpenCV를 한 시간 동안 재컴파일하는 대신 몇 초 만에 끝난다.
- **하드웨어 장치** — 실제 카메라나 IMU는 명시적인 패스스루(`--device /dev/video0`)가 필요하다. 컨테이너가 물리적 로봇에 닿는 몇 안 되는 지점이다.

## 기본을 넘어서

- **다단계 빌드(multi-stage build)**는 무거운 빌드 이미지(컴파일러, `-dev` 패키지)를 슬림한 런타임 이미지와 분리한다 — 인식 스택을 로봇에 배포하는 패턴이다.
- **docker compose**는 다중 컨테이너 구성을 선언적으로 기술한다: SLAM 노드, 시각화 컨테이너, 데이터셋/백 플레이어를 하나의 재현 가능한 스택으로 묶는다.
- **크로스 아키텍처 빌드**(`docker buildx`)는 x86 워크스테이션에서 ARM 이미지를 빌드한다 — 데스크톱에서 빌드된 이미지가 Jetson급 로봇에 도달하는 방식이다.
- **개발 컨테이너(dev container)**(VS Code 등)는 에디터, 디버거, IntelliSense가 고정된 환경 *내부에서* 실행되도록 하여, "Docker에서는 빌드되는데 내 IDE에서는 안 되는" 마지막 불일치를 제거한다.

실제로 거의 모든 진지한 오픈소스 SLAM 저장소는 이제 Dockerfile을 제공하며, 논문의 결과를 재현하는 작업은 보통 `docker build`로 시작한다. Docker는 SLAM을 대규모로 평가하는 방식이기도 하다: CI 파이프라인은 컨테이너 내부에서 데이터셋 벤치마크를 실행하고, 로봇들은 깔끔한 업데이트와 롤백을 위해 인식 스택을 컨테이너로 배포하는 경우가 점점 늘고 있다.

## 흔한 함정

- 마운트된 볼륨에서 컨테이너 안에서 생성된 파일은 root 소유가 된다. `--user $(id -u):$(id -g)`로 실행하거나 이미지에서 소유권을 수정하라.
- `--network host`(또는 적절한 DDS 설정)를 잊으면 컨테이너 안팎의 ROS 2 노드가 서로 보이지 않게 된다.
- apt 캐시와 빌드 트리를 이미지에 남겨두면 수 기가바이트의 불필요한 용량이 생긴다. 같은 `RUN` 레이어 안에서 정리하라.
- 컨테이너는 의존성을 격리할 뿐 물리 법칙을 격리하지 않는다: 그 자체로는 타이밍 결정성을 개선하거나 실시간 스케줄링을 부여하지 않는다.

## SLAM에서의 의미

SLAM 시스템은 프로젝트 간에 충돌하는 특정 OpenCV/Eigen/Ceres/ROS 버전 등 유명하게 무겁고 취약한 의존성 스택을 가지고 있다. Docker를 사용하면 ORB-SLAM3, VINS-Fusion, PyTorch 기반 프론트엔드를 한 기기에서 의존성 충돌 없이 유지할 수 있고, 자신의 연구를 다른 사람이 재현할 수 있게 만들며, CI 벤치마킹과 실제 로봇 배포 모두를 위한 표준 패키징 단위가 된다.

## 관련 문서

- [ROS/ROS2](ros-ros2.md)
- [CI/CD](ci-cd.md)
- [Git/GitHub](git-github.md)
- [Edge deployment](edge-deployment.md)
