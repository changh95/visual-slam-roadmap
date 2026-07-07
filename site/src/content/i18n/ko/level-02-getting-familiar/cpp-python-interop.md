# C++/Python 상호 운용

현대 SLAM 연구는 두 세계에 걸쳐 있습니다: 성능이 중요한 추정 코드는 C++로 작성되고, 실험, 딥러닝, 평가는 Python에서 이루어집니다. C++/Python 상호 운용은 그 사이를 잇는 다리입니다 --- C++ 코어를 Python 바인딩으로 감싸서, 동일한 트래커나 옵티마이저를 노트북에서 구동하거나, PyTorch 모델과 결합하거나, Python 도구로 벤치마크할 수 있게 하며, 이를 위해 어떤 것도 다시 작성할 필요가 없습니다.

**PyBind11**은 이러한 바인딩을 작성하는 사실상의 표준입니다. 헤더 전용 C++ 라이브러리로서, 매우 적은 보일러플레이트로 C++ 클래스와 함수를 Python 모듈로 노출합니다:

```cpp
#include <pybind11/pybind11.h>
#include <pybind11/eigen.h>   // automatic Eigen <-> NumPy conversion

Eigen::Matrix4d track(const Eigen::Matrix4d& T_prev, const cv::Mat& img);

PYBIND11_MODULE(myslam, m) {
    m.def("track", &track, "Track one frame and return the new pose");
}
```

`pybind11/eigen.h` 헤더는 `Eigen` 행렬과 NumPy 배열 사이를 자동으로 변환하며, 이는 정확히 SLAM 코드가 필요로 하는 것입니다: 자세, 포인트 클라우드, 야코비안이 수동 복사 코드 없이 배열로서 언어 경계를 넘어갑니다. 여러분이 사용할 많은 라이브러리들이 이 방식으로 래핑되어 있습니다 --- GTSAM은 공식 Python 래퍼를 제공하며, COLMAP의 `pycolmap` 같은 프로젝트들도 동일한 패턴을 따릅니다.

자유 함수 대신 전체 시스템을 바인딩하는 것은 다음과 같습니다 --- GIL 가드를 주목하세요. 이는 Python이 대기하는 동안에도 다중 스레드 SLAM 코어가 계속 실행되도록 유지해줍니다:

```cpp
namespace py = pybind11;

py::class_<SlamSystem>(m, "SlamSystem")
    .def(py::init<const std::string&>())              // config file path
    .def("track", &SlamSystem::track,
         py::call_guard<py::gil_scoped_release>())    // release GIL during C++ work
    .def_property_readonly("map_points", &SlamSystem::mapPoints);
```

**nanobind**는 동일한 저자가 만든 후속작으로, 더 낮은 바인딩 오버헤드, 더 작은 바이너리, 더 빠른 컴파일 시간을 위해 재설계되었습니다. API는 PyBind11과 의도적으로 유사하여 지식이 그대로 전이됩니다; 호출 오버헤드를 신경 쓰는(예를 들어, 특징당 또는 프레임당 호출되는 작은 함수를 바인딩하는) 새 프로젝트들은 점점 더 nanobind를 선택하고 있습니다.

## SLAM 코드를 래핑할 때 이해해야 할 것

- **소유권과 생명 주기** --- C++ 스레드와 Python 사이에서 공유되는 `Map` 객체를 누가 해제하는지; 반환값 정책(`return_value_policy::reference_internal` 대 `copy`)이 Python이 뷰를 갖는지 소유된 복제본을 갖는지를 결정합니다.
- **GIL** --- 오래 실행되는 C++ 호출은 (위에서처럼) Python의 전역 인터프리터 락을 해제해야 백그라운드 매핑 스레드가 계속 실행되고 Python 호출자가 코어 주변에서 멀티스레딩할 수 있습니다.
- **제로카피 뷰** --- 큰 버퍼(이미지, 포인트 클라우드)를 복사가 아닌 NumPy 뷰로 노출하면 경계를 저렴하게 유지할 수 있습니다; 강제 변환을 피하려면 C++ 측에서 `Eigen::Ref<const Eigen::MatrixXd>`나 `py::array_t`를 받으세요.
- **레이아웃과 dtype 불일치** --- Eigen은 기본적으로 열 우선(column-major)이고 NumPy는 기본적으로 행 우선(row-major)이며, `float32`와 `float64`의 불일치는 조용히 복사를 유발합니다; 프레임당 데이터가 크다면 경계를 프로파일링하세요.
- **빌드와 패키징** --- CMake의 `pybind11_add_module`과 (scikit-build-core 같은) `pyproject.toml`을 결합하면 전체를 `pip install` 가능한 패키지로 만들 수 있으며, 이는 C++ SLAM 시스템을 CI와 협업자들이 사용할 수 있게 만드는 요소입니다.

## 흔한 함정

- 확장 모듈과 Python 인터프리터 또는 다른 C++ 의존성 사이의 컴파일러/ABI 불일치는 import 시점의 크래시를 발생시킵니다; 모든 것을 하나의 일관된 환경에서 빌드하세요 (Docker가 인기 있는 또 다른 이유입니다).
- 예외는 경계를 넘어 변환되어야 합니다 --- PyBind11은 `std::exception`을 Python 예외로 매핑하지만, 커스텀 오류 타입은 명시적인 등록이 필요합니다.
- 디버깅은 양면적입니다: C++ 쪽을 위해 Python 프로세스에 `gdb`/`lldb`를 붙이고, 바인딩에서의 세그폴트는 보통 Python 버그가 아니라 생명 주기 버그임을 기억하세요.

## SLAM에서의 의미

이 분야는 하이브리드 시스템으로 수렴하고 있습니다: 고전적인 C++ 백엔드가 Python/PyTorch에서 동작하는 학습된 프론트엔드(특징 검출기, 깊이 네트워크, 매처)와 결합됩니다. C++ 옵티마이저를 Python으로 바인딩하거나 --- 또는 내보낸 모델을 통해 C++에서 학습된 매처를 호출하는 --- 능력이 바로 이러한 조합들을 실용적으로 만드는 요소입니다. 이는 또한 여러분 자신의 C++ 코드를 변화시킵니다: 한 번 래핑되면, 스크립트로 다룰 수 있게 되고, pytest로 단위 테스트를 할 수 있게 되며, Python 도구로 데이터셋에 대해 평가하기 쉬워집니다.

## 실습

- [PyBind hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch02_08)

## 관련 문서

- [C++](cpp.md)
- [Python](python.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
- [Edge deployment](edge-deployment.md)
