# CI/CD

**지속적 통합(Continuous Integration, CI)**은 매 푸시 또는 풀 리퀘스트마다 코드를 자동으로 빌드하고 테스트합니다; **지속적 배포/전달(Continuous Delivery/Deployment, CD)**은 이를 확장하여 아티팩트(Docker 이미지, 바이너리)의 패키징과 릴리스를 자동화합니다. 무거운 의존성과 다중 타깃 플랫폼을 가진 대규모 C++ 코드베이스인 SLAM 프로젝트에서, CI는 빌드를 정직하게 유지해주는 장치입니다.

## GitHub Actions

GitHub Actions는 오픈소스 SLAM 작업에서 사실상의 표준 CI 서비스입니다. 워크플로는 `.github/workflows/`에 있는 YAML 파일로, 트리거(`push`, `pull_request`, 예약 실행)에 의해 새로운 러너 VM 또는 컨테이너 내에서 실행됩니다:

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

SLAM 리포지터리에 유용한 패턴들:

- **빌드 매트릭스**: Ubuntu 버전, 컴파일러, ROS 배포판에 걸쳐 병렬로 컴파일:

  ```yaml
  strategy:
    matrix:
      os: [ubuntu-22.04, ubuntu-24.04]
      build_type: [Release, Debug]
  ```

- **Docker 기반 작업** (`container: my-org/slam-dev:latest`): 개발자들이 사용하는 것과 동일한 이미지 내부에서 워크플로를 실행하여, "CI에서는 동작함"이 "어디서든 동작함"을 의미하게 만듭니다.
- **캐싱** (`actions/cache`): 버전을 키로 하여 컴파일된 서드파티 의존성(Eigen, Ceres, OpenCV)을 캐시합니다 --- C++ 프로젝트에서 5분짜리 CI와 45분짜리 CI의 차이를 만듭니다.
- **아티팩트와 릴리스**: 각 실행에서 빌드된 바이너리, 휠, 평가 리포트를 업로드합니다; 태그로 트리거되는 워크플로는 Docker 이미지를 자동으로 게시할 수 있습니다 (CD의 절반).
- **자체 호스팅 러너**: GPU에 의존하는 작업(CUDA 커널, 학습된 프론트엔드)과 ARM 교차 빌드는 보통 자체 호스팅 러너가 필요합니다. 표준 러너에는 GPU가 없기 때문입니다.

## SLAM 프로젝트에서 자동화해야 할 것

1. 매 커밋마다 **빌드** --- 템플릿이 많은 C++ 코드는 그렇지 않으면 조용히 깨집니다.
2. 수학 유틸리티(기하학, 야코비안)를 위한 **단위 테스트** --- 저렴하면서 최악의 버그를 잡아냅니다.
3. **소규모 회귀 실행**: 짧은 데이터셋 시퀀스를 처리하고 ATE/RPE를 임계값과 비교하여, 정확도 회귀가 병합 전에 발견되도록 합니다. 작업이 재현 가능하도록 시퀀스를 리포지터리에 저장하거나 고정된 사본을 가져오세요.
4. 다중 기여자 코드베이스의 일관성을 유지하기 위한 **린팅/포매팅** (clang-format, clang-tidy) --- CI에서 강제하여 스타일 논쟁을 끝내세요.

## 흔한 함정

- **불안정한 정확도 게이트**: SLAM은 (RANSAC, 스레딩으로 인해) 확률적입니다; 관측된 평균값에 딱 맞춘 엄격한 ATE 임계값은 무작위로 실패합니다. 가능하면 시드를 고정하고 여유를 둔 임계값을 설정하거나, 여러 번 실행한 평균을 사용하세요.
- **CI 환경 드리프트**: 고정되지 않은 의존성에 대한 `apt-get install`은 빌드가 여러분도 모르게 바뀐다는 뜻입니다; 버전을 고정하거나 버전이 명시된 Docker 이미지 내부에서 빌드하세요.
- **Release만 테스트**: (어서션과 새니타이저가 있는) Debug 빌드는 Release가 숨기는 메모리 버그를 잡아냅니다 --- 적어도 야간에는 둘 다 실행하세요.
- **런타임 예산 무시**: 정확도에는 영향이 없지만 프레임당 지연 시간을 두 배로 만드는 변경도 회귀입니다; 회귀 작업에서 타이밍을 로깅하고 임계값을 설정하세요.

## SLAM에서의 의미

SLAM 시스템은 센서 드라이버, 서드파티 솔버, 플랫폼별 SIMD 등 많은 취약한 조각들을 결합하며, 여러분의 노트북에서는 빌드되는 변경이 로봇의 Ubuntu 이미지에서는 흔히 깨집니다. CI는 이를 몇 분 안에 잡아내며, 데이터셋 기반 회귀 작업은 "내 리팩터링이 정확도를 해쳤는가?"라는 질문을 수작업의 오후 작업에서 자동 점검으로 바꿔줍니다. 산업계의 SLAM 팀들은 CI 파이프라인(빌드, 테스트, 벤치마크, 패키징)을 제품의 일부로 취급합니다.

## 관련 문서

- [Git/GitHub](git-github.md)
- [Docker](docker.md)
- [Bash/Linux](bash-linux.md)
- [Metrics](metrics.md)
