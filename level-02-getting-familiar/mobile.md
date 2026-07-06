# Mobile

Phones are the most widely deployed SLAM platforms in existence: every modern iPhone and most Android devices run visual-inertial tracking as a system service (ARKit and ARCore). Working on "mobile SLAM" therefore means two distinct skills: using the platform tracking stacks from the native app languages, and — for SLAM engineers proper — getting custom C++ perception code to run well on phone hardware.

**Android (Java/Kotlin).** Applications are written in Kotlin (or Java), but SLAM-grade code runs in C++ via the **NDK** and is bridged with **JNI**. The platform pieces that matter: Camera2/CameraX for frame access (with timestamps and exposure metadata), the sensor APIs for IMU data, and **ARCore** if you prefer to consume Google's built-in motion tracking instead of running your own. Practical realities of Android SLAM work include camera-IMU time synchronization quality varying wildly across devices, and thermal throttling shaping what "real-time" means.

**iOS (Objective-C/Swift).** Applications are written in Swift (legacy code in Objective-C), with C++ integrated directly (Objective-C++ or Swift's C++ interop). AVFoundation provides camera frames, CoreMotion the IMU, and **ARKit** exposes Apple's tightly integrated VIO — widely regarded as a benchmark for consumer tracking quality thanks to factory-calibrated, well-synchronized camera-IMU hardware. Metal and CoreML/ANE handle GPU compute and neural inference for learned components.

For a SLAM engineer, the mobile-specific engineering checklist looks the same on both platforms:

- **Sensor access and synchronization** — hardware timestamps for camera and IMU, rolling-shutter awareness, exposure/ISO metadata.
- **Compute budget** — a few CPU cores (shared with the app), NEON SIMD, mobile GPU, and an NPU; power and thermals constrain sustained load far below peak.
- **Language bridging** — Kotlin/Swift UI over a shared C++ core, the standard architecture for cross-platform SLAM products.
- **Use vs. build** — ARKit/ARCore are excellent and free; custom SLAM on phones is justified when you need capabilities they don't expose (custom sensors, maps you own, cross-device relocalization).

## Why it matters for SLAM

Mobile AR is where visual-inertial SLAM met mass deployment, and phone constraints (tight power budgets, rolling-shutter cameras, consumer-grade IMUs) have shaped the field's engineering priorities. Whether you build apps *on* ARKit/ARCore or compete *with* them, understanding the mobile stack — sensor plumbing, native/managed language bridging, and thermal-bounded real-time — is essential for shipping SLAM to the largest platform there is.

## Related

- [C#](csharp.md)
- [C++](cpp.md)
- [Edge deployment](edge-deployment.md)
- [Deployed VIO (ARKit / ARCore / etc.)](../level-06-vio-vins/deployed-vio.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
