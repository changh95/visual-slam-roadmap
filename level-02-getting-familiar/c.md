# C

C is the ancestor of C++ and remains the lingua franca of low-level systems: operating system kernels, device drivers, sensor firmware, and many embedded runtimes are written in C. You will rarely write a full SLAM system in C, but you will constantly read and interface with C code.

## What to learn

- **Pointers and memory**: `malloc`/`free`, pointer arithmetic, arrays vs. pointers. C has no smart pointers or RAII — every allocation is your responsibility. Understanding this makes C++'s abstractions (and their costs) much clearer.
- **Structs and functions**: C programs are organized around plain data structures and free functions rather than classes; many high-performance libraries keep this style for predictable memory layout.
- **The compilation model**: headers, translation units, linking, `extern "C"`. This is the same model C++ inherits, and most build errors you will fight in SLAM projects (undefined references, ABI mismatches) are easier to debug once you understand it.

```c
#include <stdlib.h>

typedef struct { float x, y, z; } Point3;

Point3* cloud_alloc(size_t n) {
    return (Point3*)malloc(n * sizeof(Point3));  /* must free() later */
}
```

## Where C shows up in SLAM work

- **Sensor drivers and SDKs**: camera, IMU, and LiDAR vendors often ship C APIs; your C++ wrapper calls them through `extern "C"` interfaces.
- **Embedded and microcontroller code**: on compute-constrained platforms (drones, embedded boards), the sensor-side code is frequently plain C.
- **Bindings**: Python extension modules and many cross-language interfaces are defined at the C ABI level, because C's ABI is the stable common denominator.

## Why it matters for SLAM

Real-time SLAM lives close to the hardware, and the boundary between your algorithm and the sensors, OS, and accelerators is almost always a C interface. Reading C fluently — and understanding manual memory management — makes you a better C++ programmer and lets you debug the full stack, from driver callback to bundle adjustment. Most learners can treat C as a companion to C++ study rather than a separate deep dive.

## Related

- [C++](cpp.md)
- [Python](python.md)
- [C++/Python interop](cpp-python-interop.md)
- [Edge deployment](edge-deployment.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
