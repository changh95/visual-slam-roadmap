# C

C는 C++의 조상이며 여전히 저수준 시스템의 공용어입니다: 운영체제 커널, 디바이스 드라이버, 센서 펌웨어, 그리고 많은 임베디드 런타임이 C로 작성됩니다. 완전한 SLAM 시스템을 C로 통째로 작성하는 일은 드물지만, C 코드를 끊임없이 읽고 인터페이싱하게 됩니다.

## 배워야 할 것

- **포인터와 메모리**: `malloc`/`free`, 포인터 연산, 배열과 포인터의 차이. C에는 스마트 포인터나 RAII가 없습니다 --- 모든 할당은 여러분의 책임입니다. 이를 이해하면 C++의 추상화(그리고 그 비용)가 훨씬 명확해집니다.
- **구조체와 함수**: C 프로그램은 클래스가 아니라 평범한 데이터 구조체와 자유 함수를 중심으로 구성됩니다; 예측 가능한 메모리 배치를 위해 많은 고성능 라이브러리가 이 스타일을 유지합니다.
- **함수 포인터**: 콜백을 위한 C의 메커니즘. 센서 SDK는 여러분이 등록한 함수 포인터를 호출하여 프레임을 전달합니다 --- 아래 패턴은 거의 모든 카메라/IMU 드라이버 API가 취하는 형태입니다.
- **컴파일 모델**: 헤더, 번역 단위, 링킹, `extern "C"`. 이는 C++가 그대로 물려받은 모델이며, SLAM 프로젝트에서 씨름하게 되는 대부분의 빌드 오류(정의되지 않은 참조, ABI 불일치)는 이 모델을 이해하면 훨씬 디버깅하기 쉬워집니다.

```c
#include <stdlib.h>

typedef struct { float x, y, z; } Point3;

Point3* cloud_alloc(size_t n) {
    return (Point3*)malloc(n * sizeof(Point3));  /* must free() later */
}

/* Callback registration, the universal sensor-SDK pattern */
typedef void (*frame_cb)(const unsigned char* data, int w, int h, void* user);
void sensor_set_callback(frame_cb cb, void* user_data);
```

## C와 C++ 연결하기

C++ 컴파일러는 타입을 인코딩하기 위해 함수 이름을 *맹글링(mangle)*하지만, C는 그렇지 않습니다. `extern "C"`는 C++ 컴파일러에게 C 링키지를 사용하도록 지시하여 두 세계가 서로를 호출할 수 있게 합니다:

```cpp
extern "C" {
#include "vendor_camera_sdk.h"   // C header from the sensor vendor
}

// C++ wrapper: RAII around the C API's open/close pair
class Camera {
public:
    Camera()  { handle_ = vendor_cam_open(); }
    ~Camera() { vendor_cam_close(handle_); }
private:
    vendor_cam_handle* handle_;
};
```

이러한 래퍼 패턴 --- 내부는 C API, 외부는 RAII --- 는 잘 설계된 SLAM 코드베이스가 C 인터페이스의 불안전성을 격리하는 방법입니다.

## C가 SLAM 작업에서 나타나는 곳

- **센서 드라이버와 SDK**: 카메라, IMU, LiDAR 제조사들은 흔히 C API를 제공하며, 여러분의 C++ 래퍼는 `extern "C"` 인터페이스를 통해 이를 호출합니다.
- **임베디드 및 마이크로컨트롤러 코드**: 계산 자원이 제한된 플랫폼(드론, 임베디드 보드)에서는 센서 측 코드가 순수 C로 작성되는 경우가 많습니다.
- **바인딩**: Python 확장 모듈과 많은 언어 간 인터페이스는 C ABI 수준에서 정의됩니다. C의 ABI가 안정적인 공통 분모이기 때문입니다.

## 흔한 함정

- **메모리 누수와 이중 해제(double free)**: 모든 `malloc`은 정확히 하나의 `free`를 필요로 합니다; 30Hz 프레임 콜백에서의 누수는 몇 분 만에 메모리를 고갈시킵니다.
- **댕글링 포인터**: 센서 콜백은 콜백이 종료되면 유효하지 않게 되는 버퍼를 빌려주는 경우가 많습니다 --- 필요한 것을 복사하고, 포인터를 저장하지 마세요.
- **소유권이 문서화되지 않음**: C++ 스마트 포인터와 달리, C API의 헤더는 누가 무엇을 해제하는지 거의 명시하지 않습니다; 핸들을 반환하는 모든 함수에 대해 문서(또는 소스)를 읽으세요.
- **구조체 레이아웃 가정**: 바이트 버퍼를 구조체로 캐스팅하는 것은 패딩/정렬 차이에서 깨집니다; 와이어나 ABI를 넘어가는 모든 것에는 명시적인 (역)직렬화를 사용하세요.

## SLAM에서의 의미

실시간 SLAM은 하드웨어와 밀접하게 맞닿아 있으며, 여러분의 알고리즘과 센서, OS, 가속기 사이의 경계는 거의 항상 C 인터페이스입니다. C를 유창하게 읽고 --- 수동 메모리 관리를 이해하는 것 --- 은 여러분을 더 나은 C++ 프로그래머로 만들고, 드라이버 콜백에서 번들 조정까지 전체 스택을 디버깅할 수 있게 해줍니다. 대부분의 학습자는 C를 별도의 심층 학습 대상이 아니라 C++ 학습의 동반자로 다루면 충분합니다.

## 관련 문서

- [C++](cpp.md)
- [Python](python.md)
- [C++/Python interop](cpp-python-interop.md)
- [Edge deployment](edge-deployment.md)
- [Camera device](camera-device.md)
