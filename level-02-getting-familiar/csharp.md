# C#

C# enters the SLAM world through one door: **augmented reality applications**. While SLAM algorithms themselves are written in C++, the applications that *consume* SLAM output — AR games, industrial AR overlays, mixed-reality training tools — are very often built in C# on top of Unity or Microsoft's mixed-reality stack.

**Unity AR.** Unity is the dominant engine for AR development, and its scripting language is C#. Frameworks such as AR Foundation give a C# API over the platform tracking systems (ARKit on iOS, ARCore on Android): you receive the device pose, detected planes, and anchor points that an underlying VIO/SLAM system computes natively, and you use them to place and render virtual content. From the C# side, SLAM appears as a service — a stream of 6-DoF poses and environment geometry — rather than as an algorithm you implement.

The AR Foundation mental model maps directly onto SLAM concepts you know:

- **Session** — the lifetime of the underlying tracker; it can be initializing, tracking, or in a degraded/limited state (the C# app must handle all three gracefully).
- **Trackables** — planes, feature points, images, and meshes detected by the tracker: the platform's version of a *map*.
- **Anchors** — poses pinned to the physical world that the system keeps updating as its map improves; the AR-facing face of *landmarks and loop closure*. When the tracker corrects drift, anchored content visibly snaps — understanding why is pure SLAM knowledge.

**Microsoft HoloLens.** HoloLens is a self-contained mixed-reality headset whose on-board head tracking and spatial mapping run as system services. Applications are typically built in Unity with C#, using the Mixed Reality Toolkit (MRTK) to access spatial meshes, spatial anchors, and hand/eye input. For a SLAM engineer, HoloLens is interesting in both directions: it is a deployed example of always-on head tracking and mapping in a consumer-grade device, and (through its research mode) a source of multi-sensor data for experiments.

The typical division of labor looks like this:

| Layer | Language | Role |
|---|---|---|
| SLAM / VIO engine | C++ | Tracking, mapping, relocalization (platform-provided or custom) |
| Engine bindings | C++/C# interop (P/Invoke, native plugins) | Expose poses, meshes, anchors |
| Application | C# (Unity, MRTK) | Rendering, interaction, business logic |

**Bridging your own C++ SLAM into Unity.** The standard route is a native plugin: compile the C++ core as a shared library per platform (`.so`, `.dylib`, `.dll`, iOS framework) and call it from C# with P/Invoke:

```csharp
[DllImport("myslam")]
private static extern void slam_track(IntPtr image, double timestamp, float[] pose4x4);
```

Poses cross the boundary as flat float arrays; the recurring gotcha is **coordinate conventions** — Unity uses a left-handed, Y-up coordinate system while most SLAM/robotics code is right-handed, so a conversion (axis flip plus corresponding quaternion component changes) sits at every bridge, and getting it wrong produces mirrored or tumbling content.

So even in a C# job, understanding SLAM pays off: you can interpret tracking failures, understand why anchors drift, and design content placement that respects the limits of the underlying tracker.

## Why it matters for SLAM

AR is one of the largest commercial applications of visual SLAM, and C#/Unity is how most AR products are actually shipped. If you work on SLAM for AR devices, C# is the language of your users: you will write native plugins that expose your C++ tracker to Unity, debug issues reported in C# apps, and design APIs (poses, anchors, meshes) that C# developers consume. It is also a practical prototyping route — Unity can simulate cameras and environments for testing perception pipelines.

## Related

- [Mobile](mobile.md)
- [C++](cpp.md)
- [Simulation](simulation.md)
- [Deployed VIO (ARKit / ARCore / etc.)](../level-06-vio-vins/deployed-vio.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
