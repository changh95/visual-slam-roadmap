# 동시성

실시간 SLAM 시스템은 병렬성을 적극적으로 활용합니다: ~33ms (30Hz)의 프레임 예산은 특징 추출, 매칭, 최적화, 맵 유지 관리를 모두 감당해야 합니다. SLAM에서의 동시성은 명령어 수준의 SIMD부터 다중 스레드 아키텍처, GPU 오프로드까지 여러 층으로 나타납니다.

## SIMD: SSE/AVX/Neon

**SIMD** (Single Instruction, Multiple Data) 명령어는 명령어당 4~16개의 값을 처리합니다: x86의 SSE/AVX, ARM(즉 대부분의 로봇, 폰, 임베디드 보드)의 **Neon**. 특징 수준의 이미지 처리가 대표적인 수혜자입니다 --- ORB 디스크립터 계산과 매칭은 ARM에서 Neon 인트린식으로부터 상당한 이득을 얻습니다. 대표적인 예는 ORB 매칭의 내부 루프인 이진 디스크립터 간 해밍 거리입니다:

```cpp
// Hamming distance of two 256-bit ORB descriptors: XOR + popcount
int hamming(const uint64_t* a, const uint64_t* b) {
    int d = 0;
    for (int i = 0; i < 4; ++i)
        d += __builtin_popcountll(a[i] ^ b[i]);  // 64 bits per instruction
    return d;
}
```

Eigen과 OpenCV 같은 라이브러리는 내부적으로 SIMD를 사용하지만, SLAM 프론트엔드의 핫 루프는 직접 벡터화되는 경우가 많습니다.

## OpenMP

**OpenMP**는 컴파일러 프래그마를 통한 거친 단위 CPU 병렬성을 제공합니다:

```cpp
#pragma omp parallel for
for (int i = 0; i < num_cells; ++i) {
    extractFeatures(image_grid[i]);   // per-patch feature extraction
}
```

이는 이미지 패치에 대한 특징 추출 병렬화, 점별 잔차 계산, 스테레오 매칭 행(row) 처리 등 데이터 병렬 작업에 적합합니다 --- 한 줄의 코드로 명시적인 스레드 관리가 필요 없습니다. 반복이 독립적이고 각 작업이 스레드 fork/join을 상쇄할 만큼 충분한 일을 할 때만 이득을 봅니다.

## CUDA

**CUDA**는 대규모 병렬 워크로드를 위해 NVIDIA GPU를 대상으로 합니다: 밀집 깊이 추정, 신경망 추론, 밀집 볼류메트릭 맵핑(KinectFusion의 TSDF 통합은 GPU를 위해 설계되었습니다). 트레이드오프는 호스트-디바이스 메모리 전송 비용과 추가되는 배포 복잡성입니다 --- CPU에서 2ms가 걸리는 단계가 라운드트립 복사에 3ms가 든다면 GPU에서 0.5ms로 줄이는 것이 가치가 없을 수 있습니다. 단계를 GPU로 옮기기 전에 프로파일링하고, 그렇게 할 경우 파이프라인 단계 전체에서 데이터를 디바이스에 유지하세요.

## 다중 스레드 SLAM 아키텍처

데이터 병렬성을 넘어, SLAM 시스템은 동시적 파이프라인으로 구조화됩니다: 추적(시간에 민감함, 매 프레임)과 맵핑(백그라운드, 키프레임당)을 위한 별도의 스레드. ORB-SLAM3는 세 개의 스레드 --- 추적(Tracking), 로컬 매핑(Local Mapping), 루프 클로징(Loop Closing) ---를 사용하며, 뮤텍스 하에서 맵을 공유합니다. PTAM에서 물려받은 이러한 분리는 실시간 SLAM에서 단연 가장 영향력 있는 아키텍처적 아이디어라고 할 수 있습니다.

핵심 기술은 C++ 기본 요소와 그것을 규율 있게 사용하는 것입니다:

```cpp
std::mutex map_mutex;

// Tracking thread: brief, fine-grained locking
{
    std::lock_guard<std::mutex> lock(map_mutex);
    local_points = map.getLocalPoints(current_pose);  // copy out, then unlock
}
trackAgainst(local_points);  // heavy work happens outside the lock
```

- **락 세분화**: 뮤텍스는 오직 공유 상태 접근 주변에서만 유지하고, 계산 주변에서는 절대 유지하지 마세요; 추적기가 필요한 것을 복사하고 해제하세요.
- **조건 변수 / 큐**: 생산자-소비자 프레임 큐는 카메라 드라이버를 추적 스레드로부터 분리하고 지터를 흡수합니다.
- **데이터 레이스**: 로컬 BA에 의해 수정 중인 맵을 보호되지 않은 상태로 읽으면 "무작위 발산"처럼 보이는 방식으로 상태가 손상됩니다 --- 스레드 새니타이저(`-fsanitize=thread`)가 도움이 됩니다.

## 흔한 함정

- **거친 전역 락**: 하나의 큰 맵 뮤텍스는 추적과 맵핑을 직렬화하여, 스레드 분리의 이점을 조용히 파괴합니다.
- **오버서브스크립션**: OpenMP, (OpenCV 내부의) TBB, 그리고 여러분 자신의 스레드가 각각 동일한 4개 코어에서 스레드 풀을 생성하면 스래싱이 발생합니다; 스레드를 전역적으로 예산화하세요.
- **거짓 공유(false sharing)**: 같은 캐시 라인의 인접한 배열 요소에 쓰는 스레드들은 확장성이 나쁩니다; 블록 단위로 패딩하거나 분할하세요.
- **테스트에서의 비결정성**: 스레드 스케줄링은 실행을 재현 불가능하게 만듭니다; 허용 오차를 두고 회귀 테스트를 설계하고, 디버깅을 위한 단일 스레드 모드를 제공하세요.

## SLAM에서의 의미

논문 프로토타입과 배포 가능한 SLAM 시스템의 차이는 대개 알고리즘의 새로움이 아니라 엔지니어링 처리량입니다: 동일한 수학이 SIMD 디스크립터, OpenMP 프론트엔드, 그리고 제대로 분리된 스레드 아키텍처로 10배 빠르게 실행됩니다. 전력 예산이 빡빡한 임베디드 플랫폼에서는 Neon과 GPU를 활용하는 것이 실시간 성능에 도달하는 유일한 방법인 경우가 많습니다.

## 실습

- [SIMD acceleration hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part5_ch03_06)
- [CUDA acceleration hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part5_ch03_08)

## 관련 문서

- [C++](cpp.md)
- [Edge deployment](edge-deployment.md)
- [Mobile](mobile.md)
- [PTAM](../level-03-monocular-slam/ptam.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
