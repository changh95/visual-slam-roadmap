# C++

C++는 SLAM의 실무 언어입니다. 이후 레벨에서 공부할 거의 모든 시스템 --- ORB-SLAM, DSO, VINS-Mono, KinectFusion --- 이 C++로 작성되어 있는데, SLAM은 제한된 하드웨어에서 실시간으로 카메라 프레임, IMU 패킷, 최적화 문제를 처리해야 하기 때문입니다. 이 레벨에서 "C++를 안다"는 것은 단순한 문법이 아니라, SLAM 코드베이스가 사용하는 특정한 관용구와 툴체인에서 생산적으로 작업할 수 있다는 것을 의미합니다.

**Modern C++ (C++11/14/17/20).** SLAM 코드는 현대적 관용구에 전적으로 의존합니다: 범위 기반 for 루프, `auto`, 람다 함수, `std::thread`, 스마트 포인터, 이동 의미론(move semantics). 이동 의미론은 특히 중요한데, SLAM은 큰 객체(이미지, 포인트 클라우드, 디스크립터 행렬)를 여기저기로 전달하며, 핫 루프에서 우발적인 깊은 복사를 감당할 수 없기 때문입니다.

**OOP와 디자인 패턴.** SLAM 시스템은 상호작용하는 모듈들 --- 트래커, 로컬 매퍼, 루프 클로저, 맵 데이터베이스 ---로 구조화되며, 이들은 스레드 간에 상태를 공유합니다. 상속 대 합성, 센서 추상화를 위한 인터페이스, 흔한 패턴(맵 데이터베이스를 위한 싱글턴, 센서 드라이버를 위한 팩토리, 발행/구독 스타일 콜백을 위한 관찰자)을 이해하면 ORB-SLAM 같은 대규모 코드베이스를 읽기 쉬워집니다.

**데이터 구조와 알고리즘.** 최근접 이웃 검색을 위한 kd-트리와 해시 그리드, 키프레임 제거를 위한 우선순위 큐, 공가시성(covisibility)과 포즈 그래프 구조를 위한 그래프 등 복잡도를 끊임없이 따지게 됩니다. 올바른 컨테이너(`std::vector` 대 `std::unordered_map`)를 선택하는 것은 프레임 레이트에 눈에 보이는 영향을 미칩니다.

**컴파일러와 빌드 시스템.** 실제 프로젝트는 Make나 Ninja를 구동하는 CMake로 빌드됩니다. Eigen/OpenCV를 찾고, 최적화 플래그(`-O3`, `-march=native`)를 설정하고, 서드파티 서브모듈을 관리하는 `CMakeLists.txt`를 읽고 쓰게 될 것입니다. SLAM 스타일의 최소한의 `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.16)
project(my_vo)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_BUILD_TYPE Release)          # forget this and everything is "slow"

find_package(OpenCV REQUIRED)
find_package(Eigen3 REQUIRED)

add_executable(vo main.cpp)
target_link_libraries(vo ${OpenCV_LIBS} Eigen3::Eigen)
```

컴파일러가 대략 무엇을 하는지(인라이닝, 벡터화, 디버그 대 릴리스 빌드)를 알면, "느린" SLAM 시스템이 흔히 단순한 디버그 빌드일 뿐임을 이해할 수 있습니다.

**C++에서의 OpenCV.** OpenCV는 기본적인 이미지 처리 레이어입니다: 이미지 읽기와 왜곡 보정, 특징 검출(`cv::ORB`, `cv::SIFT`), 매칭(`cv::BFMatcher`, `cv::FlannBasedMatcher`), 자세 추정(`cv::solvePnP`), 캘리브레이션(`cv::calibrateCamera`). 최소한의 특징 파이프라인은 다음과 같습니다:

```cpp
cv::Ptr<cv::ORB> orb = cv::ORB::create(2000);
std::vector<cv::KeyPoint> kps;
cv::Mat desc;
orb->detectAndCompute(img, cv::noArray(), kps, desc);

cv::BFMatcher matcher(cv::NORM_HAMMING);
std::vector<cv::DMatch> matches;
matcher.match(desc_prev, desc, matches);
```

## 실제 SLAM 시스템에서의 동시성

실시간 SLAM 시스템은 여러 세분화 수준에서 병렬성을 적극적으로 활용합니다:

- **스레딩** --- 시간에 민감한 추적과 백그라운드 맵핑을 위한 별도의 스레드. ORB-SLAM3는 세 개의 스레드를 사용합니다: 추적(Tracking), 로컬 매핑(Local Mapping), 루프 클로징(Loop Closing). 맵이 공유 상태이므로, 뮤텍스와 신중한 소유권 규율은 나중에 덧붙이는 것이 아니라 아키텍처의 일부입니다.
- **SIMD (x86의 SSE/AVX, ARM의 Neon)** --- 명령어당 4~16개의 부동소수점을 처리합니다; 디스크립터 계산과 매칭(예: ARM에서 Neon 인트린식을 사용하는 ORB)은 대표적인 수혜자입니다.
- **OpenMP** --- `#pragma omp parallel for`를 통한 거친 단위 CPU 병렬성으로, 이미지 영역이나 피라미드 레벨에 대한 특징 추출을 병렬화하는 데 적합합니다.
- **CUDA** --- 밀집 깊이 추정, 신경망 추론, 밀집 맵핑(KinectFusion 스타일 TSDF 통합)을 위한 GPU 프로그래밍.

## 흔한 함정

- **디버그 빌드.** Eigen을 많이 사용하는 코드의 최적화되지 않은 빌드는 `-O3`보다 극적으로 느립니다; 시스템이 실시간이 불가능하다고 결론짓기 전에 항상 `CMAKE_BUILD_TYPE`을 확인하세요.
- **Eigen 정렬과 버전 혼합.** 힙에 할당된 클래스 안의 고정 크기 벡터화 가능한 Eigen 멤버는 정렬된 할당(`EIGEN_MAKE_ALIGNED_OPERATOR_NEW`)이 필요하며, 서로 다른 Eigen 버전으로 빌드된 라이브러리를 링킹하면 미묘한 크래시를 유발합니다 --- SLAM 프로젝트가 Dockerfile을 배포하는 주된 이유입니다.
- **`cv::Mat`의 얕은 복사 의미론.** 대입과 복사 생성은 내부 버퍼를 공유합니다; 독립적인 복사본이 필요할 때는 `.clone()`을 사용하고, 다중 스레드 파이프라인에서 어느 것을 원하는지 알아두세요.
- **Eigen 표현식과 함께 사용하는 `auto`.** Eigen은 지연 평가되는 표현식 템플릿을 구성합니다; 이를 `auto`로 캡처하면 임시 객체에 대한 댕글링 참조가 생길 수 있습니다. 확신이 없을 때는 구체적인 행렬 타입으로 대입하세요.
- **맵에서의 데이터 레이스.** 트래커가 읽는 동안 매퍼가 랜드마크를 삽입/제거하는 것은 전형적인 SLAM 레이스 컨디션입니다; 자신만의 코드를 작성하기 전에 ORB-SLAM이 맵 접근을 어떻게 보호하는지 공부하세요.

## SLAM에서의 의미

이 레벨 위의 모든 레벨은 여러분이 중간 규모의 C++ 코드베이스를 읽고, 빌드하고, 수정할 수 있다고 가정합니다. 논문을 재현한다는 것은 보통 C++ 리포지터리를 클론하고, 로컬의 Eigen/OpenCV 버전에 맞게 CMake 빌드를 고치고, 시간이 어디로 가는지 프로파일링하는 것을 의미합니다. C++ 유창성은 또한 SLAM 시스템을 *사용하는* 것에서 *바꾸는* 것으로 --- 특징 검출기를 교체하거나, 센서를 추가하거나, 스레딩이나 SIMD로 병목을 최적화하는 것으로 --- 넘어가게 해주는 것입니다.

## 실습

- [Basic C++ programming](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_02)
- [Building C++ libraries](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_03)
- [C++ CPU profiler](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_04)
- [C++ memory profiler](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_05)

## 관련 문서

- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [OpenCV](opencv.md)
- [C++/Python interop](cpp-python-interop.md)
- [Concurrency](concurrency.md)
- [Git/GitHub](git-github.md)
