# C

C 是 C++ 的祖先语言，至今仍是底层系统编程的通用语言：操作系统内核、设备驱动、传感器固件以及许多嵌入式运行时都是用 C 编写的。你很少会用 C 编写一整套 SLAM 系统，但你会不断地阅读并与 C 代码打交道。

## 需要学习的内容

- **指针与内存**：`malloc`/`free`、指针运算、数组与指针的区别。C 没有智能指针或 RAII —— 每一次内存分配都由你自己负责。理解这一点会让 C++ 的抽象（以及它们的开销）变得更加清晰。
- **结构体与函数**：C 程序围绕纯数据结构和自由函数组织，而不是类；许多高性能库为了获得可预测的内存布局而保留了这种风格。
- **函数指针**：C 中用于回调的机制。传感器 SDK 通过调用你注册的函数指针来传递帧数据 —— 下面的模式几乎是每一个相机/IMU 驱动 API 的样子。
- **编译模型**：头文件、翻译单元、链接、`extern "C"`。这与 C++ 继承的模型相同，而你在 SLAM 项目中会遇到的大多数构建错误（未定义引用、ABI 不匹配）在理解这一点之后会更容易调试。

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

## 连接 C 与 C++

C++ 编译器会对函数名进行*name mangling*（名称修饰）以编码类型信息，而 C 不会。`extern "C"` 告诉 C++ 编译器使用 C 语言的链接方式，从而让两个世界能够互相调用：

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

这种包装模式 —— 内部是 C API，外部是 RAII —— 正是良好设计的 SLAM 代码库用来约束 C 接口不安全性的方式。

## C 在 SLAM 工作中出现的场景

- **传感器驱动与 SDK**：相机、IMU 和 LiDAR 厂商通常提供 C API；你的 C++ 包装类通过 `extern "C"` 接口调用它们。
- **嵌入式与微控制器代码**：在计算资源受限的平台上（无人机、嵌入式板卡），传感器一侧的代码经常是纯 C 编写的。
- **绑定**：Python 扩展模块以及许多跨语言接口都是在 C ABI 层面定义的，因为 C 的 ABI 是稳定的公共基础。

## 常见陷阱

- **内存泄漏与重复释放**：每个 `malloc` 都需要恰好一次 `free`；在 30 Hz 的帧回调中出现泄漏会在几分钟内耗尽内存。
- **悬空指针**：传感器回调通常会借给你一个缓冲区，一旦回调返回该缓冲区就失效了 —— 应该复制你需要的数据，而不是保存指针。
- **所有权文档缺失**：与 C++ 智能指针不同，C API 的头文件很少说明谁负责释放什么；对于每一个返回句柄的函数，都要阅读文档（或源码）。
- **结构体布局假设**：将字节缓冲区强制转换为结构体，在存在填充/对齐差异时会出错；对于任何跨越网络或 ABI 边界的数据，都应使用显式的（反）序列化。

## 对SLAM的意义

实时 SLAM 与硬件紧密相连，而你的算法与传感器、操作系统、加速器之间的边界几乎总是一个 C 接口。能够流畅地阅读 C 代码 —— 并理解手动内存管理 —— 会让你成为更出色的 C++ 程序员，并让你能够调试从驱动回调到光束法平差的完整技术栈。对大多数学习者而言，可以把 C 当作 C++ 学习的伴随内容，而不必单独深入钻研。

## 相关条目

- [C++](cpp.md)
- [Python](python.md)
- [C++/Python interop](cpp-python-interop.md)
- [Edge deployment](edge-deployment.md)
- [Camera device](camera-device.md)
