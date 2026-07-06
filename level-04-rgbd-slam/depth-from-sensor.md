# Depth from sensor

RGB-D cameras capture a color image and a per-pixel depth image simultaneously. Getting depth directly from hardware changes the SLAM problem fundamentally: there is no scale ambiguity to resolve, no need to triangulate points from parallax before the map becomes useful, and dense reconstruction becomes possible from the very first frame. The field took off when cheap consumer depth cameras arrived around 2010-2011 (the Microsoft Kinect), which triggered the wave of real-time volumetric fusion systems starting with KinectFusion.

There are two dominant sensing principles:

- **Structured light**: the sensor projects a known infrared dot pattern onto the scene and observes its deformation with an IR camera; depth follows from triangulation between projector and camera. The Kinect v1 (range roughly 0.8-4 m) and Orbbec Astra work this way.
- **Active IR Time-of-Flight (ToF)**: the sensor emits modulated infrared light and measures the travel time (phase shift) of the returned signal per pixel. Kinect v2 and Azure Kinect use ToF, generally giving better accuracy and resolution than structured light.

A third, related design is **active IR stereo** (e.g. Intel RealSense D400 series): a classical stereo pair aided by a projected IR texture, so it also works on textureless surfaces while degrading gracefully to passive stereo in sunlight.

| | Structured light | Active IR ToF |
|---|---|---|
| Principle | Pattern triangulation | Per-pixel travel time |
| Typical range | ~0.5-4 m | up to ~4-5 m |
| Example sensors | Kinect v1, Orbbec Astra | Kinect v2, Azure Kinect |
| Weaknesses | Sunlight, pattern interference | Multi-path reflections, sunlight |

The trade-off for getting **metric scale for free** is a set of hard physical limitations. Range is short (a few meters), so these sensors are indoor devices. Strong infrared ambient light (sunlight) washes out the emitted signal. Dark, absorbing, transparent, or specular materials return little or corrupted signal, leaving holes in the depth image. Depth noise also grows with distance — roughly quadratically for triangulation-based sensors — which is why RGB-D SLAM systems weight or truncate far measurements.

## Why it matters for SLAM

Every design decision in RGB-D SLAM flows from the sensor: per-pixel metric depth enables dense frame-to-model tracking with ICP and volumetric TSDF or surfel fusion, while the sensor's noise model, range limit, and material failure modes determine where those systems break. Knowing whether your depth comes from structured light, ToF, or active stereo tells you what environments the system can survive — and why RGB-D SLAM is an indoor technology while outdoor systems reach for stereo or LiDAR.

## Related

- [Camera device](../level-02-getting-familiar/camera-device.md) — overview of camera sensor types
- [KinectFusion](kinectfusion.md) — the system that consumer depth cameras enabled
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md) — depth from passive stereo triangulation
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — the monocular problem that depth sensors remove

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
