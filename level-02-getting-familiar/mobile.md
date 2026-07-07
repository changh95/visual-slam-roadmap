# Mobile

Phones are the most widely deployed SLAM platforms in existence: every modern iPhone and most Android devices run visual-inertial tracking as a system service (ARKit and ARCore). Working on "mobile SLAM" therefore means two distinct skills: using the platform tracking stacks from the native app languages, and — for SLAM engineers proper — getting custom C++ perception code to run well on phone hardware.

**Android (Java/Kotlin).** Applications are written in Kotlin (or Java), but SLAM-grade code runs in C++ via the **NDK** and is bridged with **JNI**. The platform pieces that matter: Camera2/CameraX for frame access (with timestamps and exposure metadata), the sensor APIs for IMU data, and **ARCore** if you prefer to consume Google's built-in motion tracking instead of running your own. Practical realities of Android SLAM work include camera-IMU time synchronization quality varying wildly across devices, and thermal throttling shaping what "real-time" means.

**iOS (Objective-C/Swift).** Applications are written in Swift (legacy code in Objective-C), with C++ integrated directly (Objective-C++ or Swift's C++ interop). AVFoundation provides camera frames, CoreMotion the IMU, and **ARKit** exposes Apple's tightly integrated VIO — widely regarded as a benchmark for consumer tracking quality thanks to factory-calibrated, well-synchronized camera-IMU hardware. Metal and CoreML/ANE handle GPU compute and neural inference for learned components.

## Sensor plumbing: where mobile VIO lives or dies

- **Clock domains.** Camera and IMU timestamps must be on the same clock. On Android, `SENSOR_INFO_TIMESTAMP_SOURCE` tells you whether camera timestamps share the IMU's clock base (`REALTIME`) or live in their own (`UNKNOWN`) — in the latter case you must estimate the offset yourself, and per device.
- **Rolling shutter.** Nearly all phone cameras read out row by row, so each image row is captured at a slightly different time; at fast motion this warps geometry and must be modeled (or accepted as an error source). Platform trackers handle it internally — a custom pipeline has to as well.
- **OIS/EIS.** Optical image stabilization physically moves the lens, silently changing the effective intrinsics per frame; electronic stabilization warps the image. Both are great for video and hostile to geometry — disable them for SLAM or model their effect.
- **Exposure metadata.** Auto-exposure changes image brightness frame to frame; direct/photometric methods need the exposure time and ISO values that Camera2/AVFoundation report.

## The engineering checklist

For a SLAM engineer, the mobile-specific checklist looks the same on both platforms:

- **Sensor access and synchronization** — hardware timestamps for camera and IMU, rolling-shutter awareness, exposure/ISO metadata (see above).
- **Compute budget** — a few CPU cores (shared with the app), NEON SIMD, mobile GPU, and an NPU; power and thermals constrain sustained load far below peak, so benchmark hot, not cold.
- **Language bridging** — Kotlin/Swift UI over a shared C++ core, the standard architecture for cross-platform SLAM products.
- **Use vs. build** — ARKit/ARCore are excellent and free; custom SLAM on phones is justified when you need capabilities they don't expose (custom sensors, maps you own, cross-device relocalization).

## Persistence and shared experiences

The platform stacks also expose map-level features that are pure SLAM under the hood: ARKit can serialize its map (`ARWorldMap`) so an app can save a session and relocalize into it later, and ARCore's Cloud Anchors let multiple devices resolve the same anchor — cross-device relocalization as a service. Knowing what these do internally (place recognition, map merging, relocalization) tells you exactly when you can rely on them and when you need your own mapping layer.

## Why it matters for SLAM

Mobile AR is where visual-inertial SLAM met mass deployment, and phone constraints (tight power budgets, rolling-shutter cameras, consumer-grade IMUs) have shaped the field's engineering priorities. Whether you build apps *on* ARKit/ARCore or compete *with* them, understanding the mobile stack — sensor plumbing, native/managed language bridging, and thermal-bounded real-time — is essential for shipping SLAM to the largest platform there is.

## Related

- [C#](csharp.md)
- [C++](cpp.md)
- [Edge deployment](edge-deployment.md)
- [Deployed VIO (ARKit / ARCore / etc.)](../level-06-vio-vins/deployed-vio.md)
